// Milestone Calculator engine.
//
// Ported from Manus's db-productionMilestone.ts. Stripped of Drizzle / MySQL
// helpers and the legacy `calculateMilestoneDates` wrapper. The scheduling
// algorithm is byte-for-byte equivalent to the source, only the working-day
// primitives are swapped for the closures-aware helpers in ./working-days.
//
// Pure functions only. No DB calls here — callers fetch the closure set and
// any config overrides, then pass them in. That keeps the engine easy to
// test with `new Set<string>()` for the pure Mon–Fri baseline.

import {
  addWorkingDays as addWorkingDaysBase,
  subtractWorkingDays as subtractWorkingDaysBase,
  type ClosureSet,
} from './working-days';

// ============================================================================
// Types
// ============================================================================

export type BuildType = 'hire_only' | 'hybrid' | 'custom' | 'engineered';
export type StandSize = 'small' | 'medium' | 'large';
export type AvComplexity = 'basic' | 'medium' | 'high';
export type FabricationIntensity = 'standard' | 'some_custom' | 'heavy_custom';
export type BriefClarity = 'clear' | 'some_unknowns' | 'vague';
export type ComplexityBucket = 'low' | 'medium' | 'high';

export type ProjectStage = 'concept_design' | 'production' | 'onsite' | 'post_show';
export type TaskFlexibility = 'fixed' | 'flexible' | 'client_action';
export type DeliverableScope = 'xzibit' | 'client' | 'off';

export interface ProjectInput {
  buildType: BuildType;
  standSize: StandSize;
  avComplexity: AvComplexity;
  fabricationIntensity: FabricationIntensity;
  briefClarity: BriefClarity;
  engineeringRequired: boolean;
  longLeadItems: boolean;
  graphicsRequired?: boolean;
  avRequired?: boolean;
  // Stage selection — if provided, only these stages are included in the schedule
  activeStages?: ProjectStage[];
  // Deliverable scope toggles
  graphicsScope?: DeliverableScope;
  avContentScope?: DeliverableScope;
  conceptDesignScope?: DeliverableScope;
}

export interface InfoGates {
  finalDrawings: boolean;
  finishesConfirmed: boolean;
  brandingAssets: boolean;
  avInputsConfirmed: boolean;
  engineeringSignedOff: boolean;
  clientScopeApproved: boolean;
}

export interface ScheduledTask {
  id: string;
  name: string;
  stage: ProjectStage;
  flexibility: TaskFlexibility;
  duration: number;
  startDate: Date;
  endDate: Date;
  successFactor: string;
  internalNotes?: string;
}

export interface CalculationResult {
  ci: number;
  bucket: ComplexityBucket;
  infoCompleteness: number;
  tasks: ScheduledTask[];
  totalWorkingDays: number;
  projectStartDate: Date;
  bumpInWarning?: string;
}

export interface TaskConfig {
  id: string;
  name: string;
  stage: ProjectStage;
  flexibility: TaskFlexibility;
  durationLow: number;
  durationMedium: number;
  durationHigh: number;
  scopeConditions: string[];
  successFactor: string;
  internalNotes?: string;
}

export interface CIWeights {
  buildType: Record<BuildType, number>;
  standSize: Record<StandSize, number>;
  avComplexity: Record<AvComplexity, number>;
  fabricationIntensity: Record<FabricationIntensity, number>;
  briefClarity: Record<BriefClarity, number>;
  engineeringRequired: number;
  longLeadItems: number;
  graphicsRequired: number;
  avRequired: number;
}

export interface Thresholds {
  lowMax: number;
  mediumMax: number;
}

export interface ConfigOverride {
  ciWeights?: CIWeights;
  thresholds?: Thresholds;
  tasks?: TaskConfig[];
}

// ============================================================================
// Default CI config
// ============================================================================

export const CI_WEIGHTS: CIWeights = {
  buildType: { hire_only: 1, hybrid: 2, custom: 3, engineered: 4 },
  standSize: { small: 1, medium: 3, large: 5 },
  avComplexity: { basic: 1, medium: 2, high: 4 },
  fabricationIntensity: { standard: 1, some_custom: 3, heavy_custom: 6 },
  briefClarity: { clear: 0, some_unknowns: 2, vague: 5 },
  engineeringRequired: 3,
  longLeadItems: 2,
  graphicsRequired: 1,
  avRequired: 1,
};

export const CI_THRESHOLDS: Thresholds = {
  lowMax: 8,
  mediumMax: 15,
};

// ============================================================================
// Stage labels
// ============================================================================

export const STAGE_LABELS: Record<ProjectStage, string> = {
  concept_design: 'Stage 1 — Concept Design',
  production: 'Stage 2 — Production',
  onsite: 'Stage 3 — Onsite',
  post_show: 'Stage 4 — Post-Show',
};

export const STAGE_DESCRIPTIONS: Record<ProjectStage, string> = {
  concept_design:
    'Sales, quoting and concept design. Ends when quote and concept are approved.',
  production:
    'Detail design, fabrication, procurement and graphics. Ends when the truck leaves the workshop.',
  onsite:
    'Transport, bump-in, show and bump-out. All dates are venue-controlled.',
  post_show:
    'Return logistics and stand disposition. Client must decide what happens to the stand.',
};

// ============================================================================
// Default tasks
// ============================================================================

export const TASKS: TaskConfig[] = [
  // ── STAGE 1: CONCEPT DESIGN ───────────────────────────────────────────────
  {
    id: 'brief_received',
    name: 'Brief / Enquiry Received',
    stage: 'concept_design',
    flexibility: 'fixed',
    durationLow: 1,
    durationMedium: 2,
    durationHigh: 3,
    scopeConditions: ['all'],
    successFactor:
      'A complete brief with site plans, AV requirements and brand guidelines starts the project on solid footing.',
    internalNotes:
      'Fixed anchor — starts the clock. All subsequent tasks are calculated from this point.',
  },
  {
    id: 'concept_design',
    name: 'Concept Design',
    stage: 'concept_design',
    flexibility: 'flexible',
    durationLow: 3,
    durationMedium: 5,
    durationHigh: 8,
    scopeConditions: ['all'],
    successFactor:
      'A strong concept that reflects the brief reduces revision rounds and accelerates client approval.',
    internalNotes:
      'May be skipped for repeat clients with existing approved designs. Includes 3D renders for pitch projects.',
  },
  {
    id: 'quote_preparation',
    name: 'Quote Preparation & Revisions',
    stage: 'concept_design',
    flexibility: 'flexible',
    durationLow: 3,
    durationMedium: 5,
    durationHigh: 8,
    scopeConditions: ['all'],
    successFactor:
      'A detailed, accurate quote minimises revision rounds. Typically 2–3 revisions before approval.',
    internalNotes:
      'Allow for 2–3 quote revision cycles. Price negotiation and scope refinement happen here.',
  },
  {
    id: 'quote_sign_off',
    name: 'Quote & Concept Approval',
    stage: 'concept_design',
    flexibility: 'client_action',
    durationLow: 2,
    durationMedium: 3,
    durationHigh: 5,
    scopeConditions: ['all'],
    successFactor:
      'Client approves the quote and concept design, formally committing to the project scope and budget.',
    internalNotes:
      'Fixed gate — Production cannot start until this is signed off. Client action required.',
  },
  // ── STAGE 2: PRODUCTION ────────────────────────────────────────────────────
  {
    id: 'detail_design',
    name: 'Detail Design & Drawings',
    stage: 'production',
    flexibility: 'flexible',
    durationLow: 3,
    durationMedium: 5,
    durationHigh: 7,
    scopeConditions: ['custom', 'hybrid', 'engineered'],
    successFactor: 'Finalising details early accelerates CAD and production.',
  },
  {
    id: 'sign_off_of_detail_design',
    name: 'Detail Design Sign Off',
    stage: 'production',
    flexibility: 'client_action',
    durationLow: 1,
    durationMedium: 2,
    durationHigh: 3,
    scopeConditions: ['custom', 'hybrid', 'engineered'],
    successFactor:
      'Timely client feedback keeps momentum high. Must be approved before fabrication starts.',
    internalNotes: 'Client action — gates fabrication start.',
  },
  {
    id: 'cad_workshop_drawings',
    name: 'CAD / Shop Drawings',
    stage: 'production',
    flexibility: 'flexible',
    durationLow: 2,
    durationMedium: 4,
    durationHigh: 6,
    scopeConditions: ['custom', 'engineered'],
    successFactor: 'Accurate drawings ensure smooth production and prevent rework.',
  },
  {
    id: 'sign_off_of_shop_drawings',
    name: 'Shop Drawings Sign Off',
    stage: 'production',
    flexibility: 'client_action',
    durationLow: 1,
    durationMedium: 2,
    durationHigh: 3,
    scopeConditions: ['custom', 'engineered'],
    successFactor: 'Clear and quick sign-off avoids downstream delays.',
    internalNotes: 'Client action — required before fabrication commences.',
  },
  {
    id: 'procurement_of_materials',
    name: 'Procurement of Materials',
    stage: 'production',
    flexibility: 'flexible',
    durationLow: 3,
    durationMedium: 5,
    durationHigh: 7,
    scopeConditions: ['custom', 'engineered', 'hybrid'],
    successFactor: 'Early confirmation of finishes and materials speeds production.',
  },
  {
    id: 'graphic_design_production',
    name: 'Graphic Design & Printing',
    stage: 'production',
    flexibility: 'flexible',
    durationLow: 3,
    durationMedium: 5,
    durationHigh: 8,
    scopeConditions: ['all'],
    successFactor:
      'Approved artwork and print-ready files delivered early prevent last-minute graphic changes that delay finishing and packing.',
    internalNotes:
      'Parallel workstream — runs alongside fabrication. Includes artwork sign-off, print production, and delivery to workshop.',
  },
  {
    id: 'cnc_cut',
    name: 'CNC Cut',
    stage: 'production',
    flexibility: 'flexible',
    durationLow: 1,
    durationMedium: 2,
    durationHigh: 3,
    scopeConditions: ['custom', 'engineered'],
    successFactor: 'Accurate materials and CAD files ensure precision cutting.',
  },
  {
    id: 'manual_cut_and_machining',
    name: 'Manual Cut & Machining',
    stage: 'production',
    flexibility: 'flexible',
    durationLow: 1,
    durationMedium: 2,
    durationHigh: 3,
    scopeConditions: ['custom', 'engineered'],
    successFactor: 'Clear specifications allow efficient manual cutting process.',
  },
  {
    id: 'workshop_building_of_components',
    name: 'Workshop Build of Components',
    stage: 'production',
    flexibility: 'flexible',
    durationLow: 3,
    durationMedium: 6,
    durationHigh: 10,
    scopeConditions: ['custom', 'engineered'],
    successFactor:
      'Stable scope prevents rework and keeps fabrication on schedule.',
    internalNotes: 'Major fabrication bottleneck.',
  },
  {
    id: 'workshop_assemble_pre_build',
    name: 'Workshop Assemble / Pre-Build',
    stage: 'production',
    flexibility: 'flexible',
    durationLow: 2,
    durationMedium: 4,
    durationHigh: 6,
    scopeConditions: ['custom', 'engineered'],
    successFactor: 'Complete components ensure smooth assembly.',
  },
  {
    id: 'finishing_2pac_roller_painting',
    name: 'Finishing & Painting',
    stage: 'production',
    flexibility: 'flexible',
    durationLow: 2,
    durationMedium: 3,
    durationHigh: 5,
    scopeConditions: ['custom', 'engineered'],
    successFactor: 'Approved colours and finishes prevent last-minute changes.',
    internalNotes: 'Paint booth capacity dependent.',
  },
  {
    id: 'workshop_pre_build_sign_off',
    name: 'Workshop Pre-Build Sign Off',
    stage: 'production',
    flexibility: 'client_action',
    durationLow: 1,
    durationMedium: 1,
    durationHigh: 2,
    scopeConditions: ['custom', 'engineered'],
    successFactor:
      'Formal sign-off of the fully assembled stand in the workshop catches issues before the truck leaves — preventing costly on-site rectifications.',
    internalNotes:
      'Quality gate: stand must be fully assembled and signed off by PM before disassembly and packing.',
  },
  {
    id: 'contingency',
    name: 'Contingency Buffer',
    stage: 'production',
    flexibility: 'flexible',
    durationLow: 1,
    durationMedium: 3,
    durationHigh: 5,
    scopeConditions: ['all'],
    successFactor:
      'Contingency safeguards delivery quality and absorbs unexpected changes.',
  },
  {
    id: 'pack_and_load',
    name: 'Pack & Load',
    stage: 'production',
    flexibility: 'flexible',
    durationLow: 1,
    durationMedium: 2,
    durationHigh: 3,
    scopeConditions: ['all'],
    successFactor: 'Good labelling and protection ensures successful bump-in.',
  },
  {
    id: 'truck_leave_date',
    name: 'Truck Leave',
    stage: 'production',
    flexibility: 'fixed',
    durationLow: 0,
    durationMedium: 0,
    durationHigh: 0,
    scopeConditions: ['all'],
    successFactor: 'Meeting all prior milestones ensures an on-time dispatch.',
    internalNotes:
      'Hard deadline — the date everything works back from. Cannot move.',
  },
  // ── STAGE 3: ONSITE ────────────────────────────────────────────────────────
  {
    id: 'transport_to_site',
    name: 'Transport to Site',
    stage: 'onsite',
    flexibility: 'fixed',
    durationLow: 1,
    durationMedium: 1,
    durationHigh: 2,
    scopeConditions: ['all'],
    successFactor:
      'Truck departs on time and route is confirmed. Driver has site access details.',
    internalNotes: 'Venue-controlled — determined by bump-in access time.',
  },
  {
    id: 'bump_in',
    name: 'Bump In',
    stage: 'onsite',
    flexibility: 'fixed',
    durationLow: 1,
    durationMedium: 2,
    durationHigh: 3,
    scopeConditions: ['all'],
    successFactor:
      'All components arrive on time, crew is briefed, and site access is confirmed with the venue.',
    internalNotes: 'Venue sets the access window. Duration scales with stand complexity.',
  },
  {
    id: 'show_open',
    name: 'Show Open',
    stage: 'onsite',
    flexibility: 'fixed',
    durationLow: 1,
    durationMedium: 3,
    durationHigh: 5,
    scopeConditions: ['all'],
    successFactor: 'Stand is complete, staffed and ready before doors open.',
    internalNotes: 'Cannot move — it is the event. Duration = number of show days.',
  },
  {
    id: 'bump_out',
    name: 'Bump Out',
    stage: 'onsite',
    flexibility: 'fixed',
    durationLow: 1,
    durationMedium: 1,
    durationHigh: 2,
    scopeConditions: ['all'],
    successFactor:
      "All components are packed and removed within the venue's bump-out window.",
    internalNotes: 'Venue sets the breakdown window.',
  },
  // ── STAGE 4: POST-SHOW ─────────────────────────────────────────────────────
  {
    id: 'stand_disposition_decision',
    name: 'Stand Disposition Decision',
    stage: 'post_show',
    flexibility: 'client_action',
    durationLow: 1,
    durationMedium: 2,
    durationHigh: 3,
    scopeConditions: ['all'],
    successFactor:
      'Client confirms what happens to the stand before bump-out: store, sell, refurbish or dispose. Agreed before the show ends.',
    internalNotes:
      'Client action — often left too late. Raise this conversation early so logistics can be arranged in advance.',
  },
  {
    id: 'transport_return',
    name: 'Transport Return to Warehouse',
    stage: 'post_show',
    flexibility: 'flexible',
    durationLow: 1,
    durationMedium: 1,
    durationHigh: 2,
    scopeConditions: ['all'],
    successFactor: 'All components are returned promptly to avoid venue storage fees.',
  },
  {
    id: 'warehouse_return',
    name: 'Warehouse Return / Storage',
    stage: 'post_show',
    flexibility: 'flexible',
    durationLow: 1,
    durationMedium: 2,
    durationHigh: 3,
    scopeConditions: ['all'],
    successFactor:
      'Stand is inspected, catalogued and stored correctly. Client is invoiced for storage if applicable.',
    internalNotes:
      "Conditional on client's disposition decision. May be replaced by disposal or sale process.",
  },
];

// ============================================================================
// Pure functions
// ============================================================================

export function calculateCI(
  input: ProjectInput,
  weights: CIWeights = CI_WEIGHTS,
): number {
  let score = 0;
  score += (weights.buildType as Record<string, number>)[input.buildType] ?? 0;
  score += (weights.standSize as Record<string, number>)[input.standSize] ?? 0;
  score += (weights.avComplexity as Record<string, number>)[input.avComplexity] ?? 0;
  score +=
    (weights.fabricationIntensity as Record<string, number>)[input.fabricationIntensity] ?? 0;
  score += (weights.briefClarity as Record<string, number>)[input.briefClarity] ?? 0;
  if (input.engineeringRequired) score += weights.engineeringRequired ?? 0;
  if (input.longLeadItems) score += weights.longLeadItems ?? 0;
  if (input.graphicsRequired) score += weights.graphicsRequired ?? 0;
  if (input.avRequired) score += weights.avRequired ?? 0;
  return score;
}

export function mapBucket(
  ci: number,
  thresholds: Thresholds = CI_THRESHOLDS,
): ComplexityBucket {
  if (ci <= thresholds.lowMax) return 'low';
  if (ci <= thresholds.mediumMax) return 'medium';
  return 'high';
}

export function calculateInfoCompleteness(gates: InfoGates): number {
  const total = Object.keys(gates).length;
  const passed = Object.values(gates).filter(Boolean).length;
  return total === 0 ? 0 : passed / total;
}

/**
 * Subtract working days from `fromDate`, skipping weekends and any closures
 * in the provided set. Re-exported at the engine level so tests that assume
 * pure Mon–Fri arithmetic can import from one place.
 */
export function subtractWorkingDays(
  fromDate: Date,
  days: number,
  closures: ClosureSet,
): Date {
  return subtractWorkingDaysBase(fromDate, days, closures);
}

/** Add working days to `fromDate`. Negative `days` steps backwards. */
export function addWorkingDays(
  fromDate: Date,
  days: number,
  closures: ClosureSet,
): Date {
  return addWorkingDaysBase(fromDate, days, closures);
}

// ============================================================================
// Main entry point
// ============================================================================

export function runCalculation(
  input: ProjectInput,
  infoGates: InfoGates,
  truckLeaveDate: Date,
  closures: ClosureSet,
  overrideConfig?: ConfigOverride,
): CalculationResult {
  const effectiveCiWeights = overrideConfig?.ciWeights ?? CI_WEIGHTS;
  const effectiveThresholds = overrideConfig?.thresholds ?? CI_THRESHOLDS;
  const effectiveTasks = overrideConfig?.tasks ?? TASKS;

  const ci = calculateCI(input, effectiveCiWeights);
  const bucket = mapBucket(ci, effectiveThresholds);
  const infoCompleteness = calculateInfoCompleteness(infoGates);

  const activeStages: ProjectStage[] =
    input.activeStages ?? ['concept_design', 'production', 'onsite', 'post_show'];

  const applicableTasks = effectiveTasks.filter((task) => {
    if (!activeStages.includes(task.stage)) return false;
    if (task.scopeConditions.includes('all')) return true;
    if (task.scopeConditions.includes(input.buildType)) return true;
    if (input.engineeringRequired && task.scopeConditions.includes('engineered'))
      return true;
    return false;
  });

  // Apply deliverable-scope transforms to graphics + concept_design tasks.
  const scopedTasks = applicableTasks
    .map((task): TaskConfig | null => {
      if (task.id === 'graphic_design_production') {
        const scope = input.graphicsScope ?? 'off';
        if (scope === 'off') return null;
        if (scope === 'client') {
          return {
            ...task,
            name: 'Graphic Design — Client Deadline',
            flexibility: 'client_action',
            durationLow: 0,
            durationMedium: 0,
            durationHigh: 0,
          };
        }
        return task;
      }
      if (task.id === 'concept_design') {
        const scope = input.conceptDesignScope ?? 'xzibit';
        if (scope === 'off') return null;
        if (scope === 'client') {
          return {
            ...task,
            name: 'Concept Design — Client Provides',
            flexibility: 'client_action',
            durationLow: 0,
            durationMedium: 0,
            durationHigh: 0,
          };
        }
        return task;
      }
      return task;
    })
    .filter((t): t is TaskConfig => t !== null);

  // Optional av_content task — injected before pack_and_load.
  const avContentTask: TaskConfig | null = (() => {
    const scope = input.avContentScope ?? 'off';
    if (scope === 'off') return null;
    return {
      id: 'av_content',
      name: scope === 'client' ? 'AV Content Files — Client Deadline' : 'AV Content Creation',
      stage: 'production',
      flexibility: scope === 'client' ? 'client_action' : 'flexible',
      durationLow: scope === 'client' ? 0 : 3,
      durationMedium: scope === 'client' ? 0 : 5,
      durationHigh: scope === 'client' ? 0 : 8,
      scopeConditions: ['all'],
      successFactor:
        scope === 'client'
          ? 'Client must supply final AV content files by this date to allow integration testing before truck leave.'
          : 'AV content created and tested in-house. Includes motion graphics, video files, and playback testing.',
    };
  })();

  const finalTasks: TaskConfig[] = [];
  for (const task of scopedTasks) {
    if (task.id === 'pack_and_load' && avContentTask) {
      finalTasks.push(avContentTask);
    }
    finalTasks.push(task);
  }

  const PRE_TRUCK_STAGES: ProjectStage[] = ['concept_design', 'production'];
  const POST_TRUCK_STAGES: ProjectStage[] = ['onsite', 'post_show'];

  const preTruckTasks = finalTasks.filter((t) => PRE_TRUCK_STAGES.includes(t.stage));
  const postTruckTasks = finalTasks.filter((t) => POST_TRUCK_STAGES.includes(t.stage));

  const scheduledTasks: ScheduledTask[] = [];

  // ── Backward pass: concept + production tasks ──────────────────────────────
  const preTruckReversed = [...preTruckTasks].reverse();
  let backwardCursor = new Date(truckLeaveDate);

  for (const task of preTruckReversed) {
    const duration = pickDuration(task, bucket);

    if (duration === 0) {
      scheduledTasks.unshift({
        id: task.id,
        name: task.name,
        stage: task.stage,
        flexibility: task.flexibility,
        duration: 0,
        startDate: new Date(backwardCursor),
        endDate: new Date(backwardCursor),
        successFactor: task.successFactor,
        internalNotes: task.internalNotes,
      });
      continue;
    }

    const endDate = new Date(backwardCursor);
    const startDate = subtractWorkingDays(backwardCursor, duration, closures);

    scheduledTasks.unshift({
      id: task.id,
      name: task.name,
      stage: task.stage,
      flexibility: task.flexibility,
      duration,
      startDate,
      endDate,
      successFactor: task.successFactor,
      internalNotes: task.internalNotes,
    });

    backwardCursor = new Date(startDate);
  }

  // ── Forward pass: onsite + post-show tasks ────────────────────────────────
  let forwardCursor = new Date(truckLeaveDate);

  for (const task of postTruckTasks) {
    const duration = pickDuration(task, bucket);

    if (duration === 0) {
      scheduledTasks.push({
        id: task.id,
        name: task.name,
        stage: task.stage,
        flexibility: task.flexibility,
        duration: 0,
        startDate: new Date(forwardCursor),
        endDate: new Date(forwardCursor),
        successFactor: task.successFactor,
        internalNotes: task.internalNotes,
      });
      continue;
    }

    const startDate = addWorkingDays(forwardCursor, 1, closures);
    const endDate = addWorkingDays(startDate, duration - 1, closures);

    scheduledTasks.push({
      id: task.id,
      name: task.name,
      stage: task.stage,
      flexibility: task.flexibility,
      duration,
      startDate,
      endDate,
      successFactor: task.successFactor,
      internalNotes: task.internalNotes,
    });

    forwardCursor = new Date(endDate);
  }

  const projectStartDate = scheduledTasks[0]?.startDate ?? truckLeaveDate;
  let totalWorkingDays = 0;
  for (const t of scheduledTasks) {
    totalWorkingDays += t.duration;
  }

  return {
    ci,
    bucket,
    infoCompleteness,
    tasks: scheduledTasks,
    totalWorkingDays,
    projectStartDate,
  };
}

function pickDuration(task: TaskConfig, bucket: ComplexityBucket): number {
  if (bucket === 'low') return task.durationLow;
  if (bucket === 'medium') return task.durationMedium;
  return task.durationHigh;
}

/**
 * Warn if truck leave date doesn't give enough time before bump-in, or if
 * bump-in and show-open leave no setup buffer. Calendar-day math intentional
 * — transit and show gaps don't respect weekends.
 */
export function calculateBumpInWarning(
  truckLeaveDate: Date,
  bumpInStartDate: Date | null,
  showOpenDate: Date | null,
): string | null {
  if (!bumpInStartDate && !showOpenDate) return null;

  const warnings: string[] = [];
  const fmt = (d: Date) => d.toLocaleDateString('en-AU');

  if (bumpInStartDate) {
    const diffDays = Math.round(
      (bumpInStartDate.getTime() - truckLeaveDate.getTime()) / (1000 * 60 * 60 * 24),
    );
    if (diffDays < 0) {
      warnings.push(
        `Truck leave date (${fmt(truckLeaveDate)}) is AFTER bump-in start (${fmt(bumpInStartDate)}). The stand cannot arrive in time.`,
      );
    } else if (diffDays === 0) {
      warnings.push(
        `Truck leaves on the same day as bump-in starts (${fmt(bumpInStartDate)}). There is no transit buffer — any delay will cause a late arrival.`,
      );
    } else if (diffDays === 1) {
      warnings.push(
        'Only 1 day between truck leave and bump-in start. Transit buffer is very tight — consider moving the truck leave date earlier.',
      );
    }
  }

  if (showOpenDate && bumpInStartDate) {
    const bumpInDays = Math.round(
      (showOpenDate.getTime() - bumpInStartDate.getTime()) / (1000 * 60 * 60 * 24),
    );
    if (bumpInDays < 1) {
      warnings.push(
        'Show opens on the same day or before bump-in starts — there is no time for site installation.',
      );
    } else if (bumpInDays === 1) {
      warnings.push(
        `Only 1 day for bump-in before show opens (${fmt(showOpenDate)}). This is extremely tight for any stand larger than a shell scheme.`,
      );
    }
  }

  return warnings.length > 0 ? warnings.join(' ') : null;
}
