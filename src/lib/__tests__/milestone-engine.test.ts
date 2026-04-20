/**
 * Port of Manus's milestone-calculator.test.ts. Adjusted for the
 * closures-aware engine signature: every scheduling-sensitive call receives
 * an empty ClosureSet to preserve the pure Mon–Fri baseline behaviour.
 */

import { describe, it, expect } from 'vitest';
import {
  calculateCI,
  mapBucket,
  calculateInfoCompleteness,
  subtractWorkingDays,
  addWorkingDays,
  runCalculation,
  STAGE_LABELS,
  STAGE_DESCRIPTIONS,
  type ProjectInput,
  type InfoGates,
  type ProjectStage,
} from '../milestone-engine';
import type { ClosureSet } from '../working-days';

const EMPTY: ClosureSet = new Set();

const defaultInfoGates: InfoGates = {
  finalDrawings: false,
  finishesConfirmed: false,
  brandingAssets: false,
  avInputsConfirmed: false,
  engineeringSignedOff: false,
  clientScopeApproved: false,
};

const allInfoGates: InfoGates = {
  finalDrawings: true,
  finishesConfirmed: true,
  brandingAssets: true,
  avInputsConfirmed: true,
  engineeringSignedOff: true,
  clientScopeApproved: true,
};

const baseInput: ProjectInput = {
  buildType: 'hybrid',
  standSize: 'medium',
  avComplexity: 'medium',
  fabricationIntensity: 'some_custom',
  briefClarity: 'some_unknowns',
  engineeringRequired: false,
  longLeadItems: false,
};

// Monday 2026-06-01 as truck leave date (local time to avoid timezone issues)
const TRUCK_LEAVE = new Date(2026, 5, 1); // June 1, 2026 local time

// ─── CI Scoring ───────────────────────────────────────────────────────────────

describe('calculateCI', () => {
  it('computes minimum CI for simplest project', () => {
    const ci = calculateCI({
      buildType: 'hire_only',
      standSize: 'small',
      avComplexity: 'basic',
      fabricationIntensity: 'standard',
      briefClarity: 'clear',
      engineeringRequired: false,
      longLeadItems: false,
    });
    expect(ci).toBe(4);
  });

  it('computes maximum CI for most complex project', () => {
    const ci = calculateCI({
      buildType: 'engineered',
      standSize: 'large',
      avComplexity: 'high',
      fabricationIntensity: 'heavy_custom',
      briefClarity: 'vague',
      engineeringRequired: true,
      longLeadItems: true,
      graphicsRequired: true,
      avRequired: true,
    });
    expect(ci).toBe(31);
  });

  it('computes baseline hybrid/medium project CI', () => {
    expect(calculateCI(baseInput)).toBe(12);
  });

  it('adds engineering bonus correctly', () => {
    const withEng = calculateCI({ ...baseInput, engineeringRequired: true });
    const withoutEng = calculateCI({ ...baseInput, engineeringRequired: false });
    expect(withEng - withoutEng).toBe(3);
  });

  it('adds long-lead bonus correctly', () => {
    const withLL = calculateCI({ ...baseInput, longLeadItems: true });
    const withoutLL = calculateCI({ ...baseInput, longLeadItems: false });
    expect(withLL - withoutLL).toBe(2);
  });

  it('adds graphics and AV bonuses correctly', () => {
    const withBoth = calculateCI({ ...baseInput, graphicsRequired: true, avRequired: true });
    const withoutBoth = calculateCI(baseInput);
    expect(withBoth - withoutBoth).toBe(2);
  });
});

// ─── Bucket Mapping ───────────────────────────────────────────────────────────

describe('mapBucket', () => {
  it('returns low for CI <= 8', () => {
    expect(mapBucket(4)).toBe('low');
    expect(mapBucket(8)).toBe('low');
  });

  it('returns medium for CI 9–15', () => {
    expect(mapBucket(9)).toBe('medium');
    expect(mapBucket(12)).toBe('medium');
    expect(mapBucket(15)).toBe('medium');
  });

  it('returns high for CI > 15', () => {
    expect(mapBucket(16)).toBe('high');
    expect(mapBucket(31)).toBe('high');
  });
});

// ─── Info Completeness ────────────────────────────────────────────────────────

describe('calculateInfoCompleteness', () => {
  it('returns 0 when no gates are checked', () => {
    expect(calculateInfoCompleteness(defaultInfoGates)).toBe(0);
  });

  it('returns 1 when all gates are checked', () => {
    expect(calculateInfoCompleteness(allInfoGates)).toBe(1);
  });

  it('returns 0.5 when 3 of 6 gates are checked', () => {
    const half: InfoGates = {
      finalDrawings: true,
      finishesConfirmed: true,
      brandingAssets: true,
      avInputsConfirmed: false,
      engineeringSignedOff: false,
      clientScopeApproved: false,
    };
    expect(calculateInfoCompleteness(half)).toBeCloseTo(0.5);
  });
});

// ─── Working Day Helpers ──────────────────────────────────────────────────────

describe('subtractWorkingDays', () => {
  it('subtracts 5 working days from a Monday to get the previous Monday', () => {
    const from = new Date(2026, 5, 1);
    const result = subtractWorkingDays(from, 5, EMPTY);
    expect(result.getDay()).toBe(1);
    const diff = (from.getTime() - result.getTime()) / (1000 * 60 * 60 * 24);
    expect(diff).toBe(7);
  });

  it('skips weekends when subtracting', () => {
    const result = subtractWorkingDays(new Date(2026, 5, 1), 1, EMPTY);
    expect(result.getDay()).toBe(5);
  });

  it('returns same date when subtracting 0 days', () => {
    const date = new Date(2026, 5, 1);
    const result = subtractWorkingDays(date, 0, EMPTY);
    expect(result.getTime()).toBe(date.getTime());
  });
});

describe('addWorkingDays', () => {
  it('adds 5 working days from Monday to next Monday', () => {
    const result = addWorkingDays(new Date(2026, 5, 1), 5, EMPTY);
    expect(result.getDay()).toBe(1);
  });

  it('skips weekends when adding', () => {
    const result = addWorkingDays(new Date(2026, 5, 5), 1, EMPTY);
    expect(result.getDay()).toBe(1);
  });
});

// ─── Stage Labels & Descriptions ─────────────────────────────────────────────

describe('STAGE_LABELS and STAGE_DESCRIPTIONS', () => {
  it('has labels for all 4 stages', () => {
    const stages: ProjectStage[] = ['concept_design', 'production', 'onsite', 'post_show'];
    for (const s of stages) {
      expect(STAGE_LABELS[s]).toBeTruthy();
      expect(STAGE_DESCRIPTIONS[s]).toBeTruthy();
    }
  });
});

// ─── runCalculation — basic scheduling ───────────────────────────────────────

describe('runCalculation — basic scheduling', () => {
  it('returns tasks scheduled correctly relative to truck leave date', () => {
    const result = runCalculation(baseInput, defaultInfoGates, TRUCK_LEAVE, EMPTY);
    expect(result.tasks.length).toBeGreaterThan(0);
    const preTruckTasks = result.tasks.filter(
      (t) => t.stage === 'concept_design' || t.stage === 'production',
    );
    for (const task of preTruckTasks) {
      const endDate = new Date(task.endDate);
      expect(endDate.getTime()).toBeLessThanOrEqual(TRUCK_LEAVE.getTime() + 1000 * 60 * 60 * 24);
    }
  });

  it('returns correct bucket for hybrid/medium project (CI=12 → medium)', () => {
    const result = runCalculation(baseInput, defaultInfoGates, TRUCK_LEAVE, EMPTY);
    expect(result.ci).toBe(12);
    expect(result.bucket).toBe('medium');
  });

  it('returns correct bucket for simple hire-only project (CI=4 → low)', () => {
    const simpleInput: ProjectInput = {
      buildType: 'hire_only',
      standSize: 'small',
      avComplexity: 'basic',
      fabricationIntensity: 'standard',
      briefClarity: 'clear',
      engineeringRequired: false,
      longLeadItems: false,
    };
    const result = runCalculation(simpleInput, defaultInfoGates, TRUCK_LEAVE, EMPTY);
    expect(result.bucket).toBe('low');
  });

  it('returns correct bucket for complex engineered project (CI=31 → high)', () => {
    const complexInput: ProjectInput = {
      buildType: 'engineered',
      standSize: 'large',
      avComplexity: 'high',
      fabricationIntensity: 'heavy_custom',
      briefClarity: 'vague',
      engineeringRequired: true,
      longLeadItems: true,
      graphicsRequired: true,
      avRequired: true,
    };
    const result = runCalculation(complexInput, defaultInfoGates, TRUCK_LEAVE, EMPTY);
    expect(result.bucket).toBe('high');
  });

  it('production tasks are ordered chronologically (startDate ascending)', () => {
    const result = runCalculation(baseInput, defaultInfoGates, TRUCK_LEAVE, EMPTY);
    const preTruckTasks = result.tasks.filter(
      (t) => t.stage === 'concept_design' || t.stage === 'production',
    );
    for (let i = 1; i < preTruckTasks.length; i++) {
      const prev = new Date(preTruckTasks[i - 1].startDate).getTime();
      const curr = new Date(preTruckTasks[i].startDate).getTime();
      expect(curr).toBeGreaterThanOrEqual(prev);
    }
  });

  it('onsite tasks are ordered chronologically (startDate ascending)', () => {
    const input: ProjectInput = {
      ...baseInput,
      activeStages: ['production', 'onsite', 'post_show'],
    };
    const result = runCalculation(input, defaultInfoGates, TRUCK_LEAVE, EMPTY);
    const postTruckTasks = result.tasks.filter(
      (t) => t.stage === 'onsite' || t.stage === 'post_show',
    );
    for (let i = 1; i < postTruckTasks.length; i++) {
      const prev = new Date(postTruckTasks[i - 1].startDate).getTime();
      const curr = new Date(postTruckTasks[i].startDate).getTime();
      expect(curr).toBeGreaterThanOrEqual(prev);
    }
  });

  it('totalWorkingDays equals sum of all task durations', () => {
    const result = runCalculation(baseInput, defaultInfoGates, TRUCK_LEAVE, EMPTY);
    const sumDurations = result.tasks.reduce((acc, t) => acc + t.duration, 0);
    expect(result.totalWorkingDays).toBe(sumDurations);
  });

  it('projectStartDate equals startDate of first task', () => {
    const result = runCalculation(baseInput, defaultInfoGates, TRUCK_LEAVE, EMPTY);
    const firstTaskStart = new Date(result.tasks[0].startDate).getTime();
    const projectStart = new Date(result.projectStartDate).getTime();
    expect(projectStart).toBe(firstTaskStart);
  });

  it('infoCompleteness is 0 when no gates are checked', () => {
    const result = runCalculation(baseInput, defaultInfoGates, TRUCK_LEAVE, EMPTY);
    expect(result.infoCompleteness).toBe(0);
  });

  it('infoCompleteness is 1 when all gates are checked', () => {
    const result = runCalculation(baseInput, allInfoGates, TRUCK_LEAVE, EMPTY);
    expect(result.infoCompleteness).toBe(1);
  });
});

// ─── runCalculation — stage filtering ────────────────────────────────────────

describe('runCalculation — stage filtering', () => {
  it('includes all 4 stages by default', () => {
    const result = runCalculation(baseInput, defaultInfoGates, TRUCK_LEAVE, EMPTY);
    const stages = new Set(result.tasks.map((t) => t.stage));
    expect(stages.has('concept_design')).toBe(true);
    expect(stages.has('production')).toBe(true);
  });

  it('excludes concept_design tasks when stage is toggled off', () => {
    const input: ProjectInput = {
      ...baseInput,
      activeStages: ['production', 'onsite', 'post_show'],
    };
    const result = runCalculation(input, defaultInfoGates, TRUCK_LEAVE, EMPTY);
    const hasConceptTasks = result.tasks.some((t) => t.stage === 'concept_design');
    expect(hasConceptTasks).toBe(false);
  });

  it('excludes post_show tasks when stage is toggled off', () => {
    const input: ProjectInput = {
      ...baseInput,
      activeStages: ['concept_design', 'production', 'onsite'],
    };
    const result = runCalculation(input, defaultInfoGates, TRUCK_LEAVE, EMPTY);
    const hasPostShow = result.tasks.some((t) => t.stage === 'post_show');
    expect(hasPostShow).toBe(false);
  });

  it('only includes production stage when only production is active', () => {
    const input: ProjectInput = {
      ...baseInput,
      activeStages: ['production'],
    };
    const result = runCalculation(input, defaultInfoGates, TRUCK_LEAVE, EMPTY);
    expect(result.tasks.length).toBeGreaterThan(0);
    const stages = new Set(result.tasks.map((t) => t.stage));
    expect(stages.size).toBe(1);
    expect(stages.has('production')).toBe(true);
  });

  it('returns empty tasks when no stages are active', () => {
    const input: ProjectInput = {
      ...baseInput,
      activeStages: [],
    };
    const result = runCalculation(input, defaultInfoGates, TRUCK_LEAVE, EMPTY);
    expect(result.tasks.length).toBe(0);
    expect(result.totalWorkingDays).toBe(0);
  });

  it('includes onsite tasks when onsite stage is active', () => {
    const input: ProjectInput = {
      ...baseInput,
      activeStages: ['onsite'],
    };
    const result = runCalculation(input, defaultInfoGates, TRUCK_LEAVE, EMPTY);
    const hasOnsite = result.tasks.some((t) => t.stage === 'onsite');
    expect(hasOnsite).toBe(true);
  });
});

// ─── runCalculation — build type scope filtering ──────────────────────────────

describe('runCalculation — build type scope filtering', () => {
  it('hire_only build excludes custom-only tasks (detail design, CAD, fabrication)', () => {
    const input: ProjectInput = {
      buildType: 'hire_only',
      standSize: 'small',
      avComplexity: 'basic',
      fabricationIntensity: 'standard',
      briefClarity: 'clear',
      engineeringRequired: false,
      longLeadItems: false,
      activeStages: ['production'],
    };
    const result = runCalculation(input, defaultInfoGates, TRUCK_LEAVE, EMPTY);
    const taskIds = result.tasks.map((t) => t.id);
    expect(taskIds).not.toContain('detail_design');
    expect(taskIds).not.toContain('cad_workshop_drawings');
    expect(taskIds).not.toContain('workshop_building_of_components');
  });

  it('custom build includes detail design and fabrication tasks', () => {
    const input: ProjectInput = {
      buildType: 'custom',
      standSize: 'medium',
      avComplexity: 'basic',
      fabricationIntensity: 'heavy_custom',
      briefClarity: 'clear',
      engineeringRequired: false,
      longLeadItems: false,
      activeStages: ['production'],
    };
    const result = runCalculation(input, defaultInfoGates, TRUCK_LEAVE, EMPTY);
    const taskIds = result.tasks.map((t) => t.id);
    expect(taskIds).toContain('detail_design');
    expect(taskIds).toContain('workshop_building_of_components');
  });

  it('engineered build includes engineering-scoped tasks', () => {
    const input: ProjectInput = {
      buildType: 'engineered',
      standSize: 'large',
      avComplexity: 'basic',
      fabricationIntensity: 'heavy_custom',
      briefClarity: 'clear',
      engineeringRequired: true,
      longLeadItems: false,
      activeStages: ['production'],
    };
    const result = runCalculation(input, defaultInfoGates, TRUCK_LEAVE, EMPTY);
    const taskIds = result.tasks.map((t) => t.id);
    expect(taskIds).toContain('cad_workshop_drawings');
    expect(taskIds).toContain('sign_off_of_shop_drawings');
  });

  it('hire_only still includes pack_and_load and truck_leave_date (scopeConditions: all)', () => {
    const input: ProjectInput = {
      buildType: 'hire_only',
      standSize: 'small',
      avComplexity: 'basic',
      fabricationIntensity: 'standard',
      briefClarity: 'clear',
      engineeringRequired: false,
      longLeadItems: false,
      activeStages: ['production'],
    };
    const result = runCalculation(input, defaultInfoGates, TRUCK_LEAVE, EMPTY);
    const taskIds = result.tasks.map((t) => t.id);
    expect(taskIds).toContain('pack_and_load');
    expect(taskIds).toContain('truck_leave_date');
  });
});

// ─── runCalculation — deliverable scope ──────────────────────────────────────

describe('runCalculation — deliverable scope (graphics)', () => {
  it('excludes graphic_design_production when graphicsScope is off', () => {
    const input: ProjectInput = {
      ...baseInput,
      activeStages: ['production'],
      graphicsScope: 'off',
    };
    const result = runCalculation(input, defaultInfoGates, TRUCK_LEAVE, EMPTY);
    const taskIds = result.tasks.map((t) => t.id);
    expect(taskIds).not.toContain('graphic_design_production');
  });

  it('includes graphic_design_production with full duration when graphicsScope is xzibit', () => {
    const input: ProjectInput = {
      ...baseInput,
      activeStages: ['production'],
      graphicsScope: 'xzibit',
    };
    const result = runCalculation(input, defaultInfoGates, TRUCK_LEAVE, EMPTY);
    const gfxTask = result.tasks.find((t) => t.id === 'graphic_design_production');
    expect(gfxTask).toBeDefined();
    expect(gfxTask!.duration).toBeGreaterThan(0);
    expect(gfxTask!.name).toBe('Graphic Design & Printing');
  });

  it('shows graphic design as client deadline (duration=0) when graphicsScope is client', () => {
    const input: ProjectInput = {
      ...baseInput,
      activeStages: ['production'],
      graphicsScope: 'client',
    };
    const result = runCalculation(input, defaultInfoGates, TRUCK_LEAVE, EMPTY);
    const gfxTask = result.tasks.find((t) => t.id === 'graphic_design_production');
    expect(gfxTask).toBeDefined();
    expect(gfxTask!.duration).toBe(0);
    expect(gfxTask!.name).toContain('Client Deadline');
    expect(gfxTask!.flexibility).toBe('client_action');
  });
});

describe('runCalculation — deliverable scope (AV content)', () => {
  it('excludes av_content task when avContentScope is off', () => {
    const input: ProjectInput = {
      ...baseInput,
      activeStages: ['production'],
      avContentScope: 'off',
    };
    const result = runCalculation(input, defaultInfoGates, TRUCK_LEAVE, EMPTY);
    const avTask = result.tasks.find((t) => t.id === 'av_content');
    expect(avTask).toBeUndefined();
  });

  it('includes av_content with full duration when avContentScope is xzibit', () => {
    const input: ProjectInput = {
      ...baseInput,
      activeStages: ['production'],
      avContentScope: 'xzibit',
    };
    const result = runCalculation(input, defaultInfoGates, TRUCK_LEAVE, EMPTY);
    const avTask = result.tasks.find((t) => t.id === 'av_content');
    expect(avTask).toBeDefined();
    expect(avTask!.duration).toBeGreaterThan(0);
    expect(avTask!.name).toBe('AV Content Creation');
  });

  it('shows AV content as client deadline (duration=0) when avContentScope is client', () => {
    const input: ProjectInput = {
      ...baseInput,
      activeStages: ['production'],
      avContentScope: 'client',
    };
    const result = runCalculation(input, defaultInfoGates, TRUCK_LEAVE, EMPTY);
    const avTask = result.tasks.find((t) => t.id === 'av_content');
    expect(avTask).toBeDefined();
    expect(avTask!.duration).toBe(0);
    expect(avTask!.name).toContain('Client');
    expect(avTask!.flexibility).toBe('client_action');
  });

  it('inserts av_content task before pack_and_load', () => {
    const input: ProjectInput = {
      ...baseInput,
      activeStages: ['production'],
      avContentScope: 'xzibit',
    };
    const result = runCalculation(input, defaultInfoGates, TRUCK_LEAVE, EMPTY);
    const avIdx = result.tasks.findIndex((t) => t.id === 'av_content');
    const packIdx = result.tasks.findIndex((t) => t.id === 'pack_and_load');
    expect(avIdx).toBeGreaterThanOrEqual(0);
    expect(packIdx).toBeGreaterThanOrEqual(0);
    expect(avIdx).toBeLessThan(packIdx);
  });
});

describe('runCalculation — deliverable scope (concept design)', () => {
  it('includes concept design with full duration when conceptDesignScope is xzibit', () => {
    const input: ProjectInput = {
      ...baseInput,
      activeStages: ['concept_design'],
      conceptDesignScope: 'xzibit',
    };
    const result = runCalculation(input, defaultInfoGates, TRUCK_LEAVE, EMPTY);
    const cdTask = result.tasks.find((t) => t.id === 'concept_design');
    expect(cdTask).toBeDefined();
    expect(cdTask!.duration).toBeGreaterThan(0);
  });

  it('excludes concept design when conceptDesignScope is off', () => {
    const input: ProjectInput = {
      ...baseInput,
      activeStages: ['concept_design'],
      conceptDesignScope: 'off',
    };
    const result = runCalculation(input, defaultInfoGates, TRUCK_LEAVE, EMPTY);
    const cdTask = result.tasks.find((t) => t.id === 'concept_design');
    expect(cdTask).toBeUndefined();
  });

  it('shows concept design as client deadline when conceptDesignScope is client', () => {
    const input: ProjectInput = {
      ...baseInput,
      activeStages: ['concept_design'],
      conceptDesignScope: 'client',
    };
    const result = runCalculation(input, defaultInfoGates, TRUCK_LEAVE, EMPTY);
    const cdTask = result.tasks.find((t) => t.id === 'concept_design');
    expect(cdTask).toBeDefined();
    expect(cdTask!.duration).toBe(0);
    expect(cdTask!.flexibility).toBe('client_action');
    expect(cdTask!.name).toContain('Client');
  });
});

// ─── runCalculation — duration buckets ───────────────────────────────────────

describe('runCalculation — duration scaling by bucket', () => {
  it('low bucket uses durationLow for all tasks', () => {
    const simpleInput: ProjectInput = {
      buildType: 'hire_only',
      standSize: 'small',
      avComplexity: 'basic',
      fabricationIntensity: 'standard',
      briefClarity: 'clear',
      engineeringRequired: false,
      longLeadItems: false,
      activeStages: ['production'],
    };
    const result = runCalculation(simpleInput, defaultInfoGates, TRUCK_LEAVE, EMPTY);
    expect(result.bucket).toBe('low');
    const packTask = result.tasks.find((t) => t.id === 'pack_and_load');
    expect(packTask?.duration).toBe(1);
  });

  it('high bucket uses durationHigh for all tasks', () => {
    const complexInput: ProjectInput = {
      buildType: 'engineered',
      standSize: 'large',
      avComplexity: 'high',
      fabricationIntensity: 'heavy_custom',
      briefClarity: 'vague',
      engineeringRequired: true,
      longLeadItems: true,
      graphicsRequired: true,
      avRequired: true,
      activeStages: ['production'],
    };
    const result = runCalculation(complexInput, defaultInfoGates, TRUCK_LEAVE, EMPTY);
    expect(result.bucket).toBe('high');
    const packTask = result.tasks.find((t) => t.id === 'pack_and_load');
    expect(packTask?.duration).toBe(3);
  });

  it('medium bucket uses durationMedium for all tasks', () => {
    const result = runCalculation(baseInput, defaultInfoGates, TRUCK_LEAVE, EMPTY);
    expect(result.bucket).toBe('medium');
    const contingencyTask = result.tasks.find((t) => t.id === 'contingency');
    expect(contingencyTask?.duration).toBe(3);
  });
});

// ─── runCalculation — truck leave date anchor ─────────────────────────────────

describe('runCalculation — truck leave date anchor', () => {
  it('truck_leave_date task has duration=0 and is anchored to truck leave date', () => {
    const result = runCalculation(baseInput, defaultInfoGates, TRUCK_LEAVE, EMPTY);
    const truckTask = result.tasks.find((t) => t.id === 'truck_leave_date');
    expect(truckTask).toBeDefined();
    expect(truckTask!.duration).toBe(0);
    const taskDate = new Date(truckTask!.startDate);
    expect(taskDate.getFullYear()).toBe(TRUCK_LEAVE.getFullYear());
    expect(taskDate.getMonth()).toBe(TRUCK_LEAVE.getMonth());
    expect(taskDate.getDate()).toBe(TRUCK_LEAVE.getDate());
  });

  it('production stage task end dates are before or equal to truck leave date', () => {
    const result = runCalculation(baseInput, defaultInfoGates, TRUCK_LEAVE, EMPTY);
    const productionTasks = result.tasks.filter(
      (t) => t.stage === 'concept_design' || t.stage === 'production',
    );
    for (const task of productionTasks) {
      const endDate = new Date(task.endDate);
      expect(endDate.getTime()).toBeLessThanOrEqual(TRUCK_LEAVE.getTime() + 1000 * 60 * 60 * 24);
    }
  });

  it('onsite tasks start AFTER truck leave date', () => {
    const input: ProjectInput = {
      ...baseInput,
      activeStages: ['production', 'onsite'],
    };
    const result = runCalculation(input, defaultInfoGates, TRUCK_LEAVE, EMPTY);
    const onsiteTasks = result.tasks.filter((t) => t.stage === 'onsite');
    for (const task of onsiteTasks) {
      const startDate = new Date(task.startDate);
      expect(startDate.getTime()).toBeGreaterThan(TRUCK_LEAVE.getTime());
    }
  });

  it('calculates correctly with a different truck leave date', () => {
    const differentDate = new Date('2026-09-15T00:00:00.000Z');
    const result = runCalculation(baseInput, defaultInfoGates, differentDate, EMPTY);
    expect(result.tasks.length).toBeGreaterThan(0);
    const truckTask = result.tasks.find((t) => t.id === 'truck_leave_date');
    expect(truckTask).toBeDefined();
  });
});

// ─── runCalculation — combined stage + scope ─────────────────────────────────

describe('runCalculation — combined stage + scope scenarios', () => {
  it('production-only with all deliverables on (xzibit) includes graphics and AV tasks', () => {
    const input: ProjectInput = {
      ...baseInput,
      activeStages: ['production'],
      graphicsScope: 'xzibit',
      avContentScope: 'xzibit',
    };
    const result = runCalculation(input, defaultInfoGates, TRUCK_LEAVE, EMPTY);
    const taskIds = result.tasks.map((t) => t.id);
    expect(taskIds).toContain('graphic_design_production');
    expect(taskIds).toContain('av_content');
  });

  it('production-only with client deliverables shows deadline markers', () => {
    const input: ProjectInput = {
      ...baseInput,
      activeStages: ['production'],
      graphicsScope: 'client',
      avContentScope: 'client',
    };
    const result = runCalculation(input, defaultInfoGates, TRUCK_LEAVE, EMPTY);
    const gfxTask = result.tasks.find((t) => t.id === 'graphic_design_production');
    const avTask = result.tasks.find((t) => t.id === 'av_content');
    expect(gfxTask?.duration).toBe(0);
    expect(avTask?.duration).toBe(0);
  });

  it('concept+production stages (no onsite/post-show) excludes onsite tasks', () => {
    const input: ProjectInput = {
      ...baseInput,
      activeStages: ['concept_design', 'production'],
    };
    const result = runCalculation(input, defaultInfoGates, TRUCK_LEAVE, EMPTY);
    const hasOnsite = result.tasks.some((t) => t.stage === 'onsite');
    const hasPostShow = result.tasks.some((t) => t.stage === 'post_show');
    expect(hasOnsite).toBe(false);
    expect(hasPostShow).toBe(false);
  });

  it('all stages active gives more tasks than production-only', () => {
    const allStages = runCalculation(
      { ...baseInput, activeStages: ['concept_design', 'production', 'onsite', 'post_show'] },
      defaultInfoGates,
      TRUCK_LEAVE,
      EMPTY,
    );
    const prodOnly = runCalculation(
      { ...baseInput, activeStages: ['production'] },
      defaultInfoGates,
      TRUCK_LEAVE,
      EMPTY,
    );
    expect(allStages.tasks.length).toBeGreaterThan(prodOnly.tasks.length);
  });
});

// ─── runCalculation — edge cases ─────────────────────────────────────────────

describe('runCalculation — edge cases', () => {
  it('handles hire_only with all stages active', () => {
    const input: ProjectInput = {
      buildType: 'hire_only',
      standSize: 'small',
      avComplexity: 'basic',
      fabricationIntensity: 'standard',
      briefClarity: 'clear',
      engineeringRequired: false,
      longLeadItems: false,
    };
    const result = runCalculation(input, defaultInfoGates, TRUCK_LEAVE, EMPTY);
    expect(result.tasks.length).toBeGreaterThan(0);
    expect(result.totalWorkingDays).toBeGreaterThan(0);
  });

  it('handles engineered build with all stages and all deliverables', () => {
    const input: ProjectInput = {
      buildType: 'engineered',
      standSize: 'large',
      avComplexity: 'high',
      fabricationIntensity: 'heavy_custom',
      briefClarity: 'vague',
      engineeringRequired: true,
      longLeadItems: true,
      graphicsRequired: true,
      avRequired: true,
      activeStages: ['concept_design', 'production', 'onsite', 'post_show'],
      graphicsScope: 'xzibit',
      avContentScope: 'xzibit',
      conceptDesignScope: 'xzibit',
    };
    const result = runCalculation(input, defaultInfoGates, TRUCK_LEAVE, EMPTY);
    expect(result.bucket).toBe('high');
    expect(result.totalWorkingDays).toBeGreaterThan(30);
  });

  it('handles concept design scope off with concept stage active', () => {
    const input: ProjectInput = {
      ...baseInput,
      activeStages: ['concept_design'],
      conceptDesignScope: 'off',
    };
    const result = runCalculation(input, defaultInfoGates, TRUCK_LEAVE, EMPTY);
    const cdTask = result.tasks.find((t) => t.id === 'concept_design');
    expect(cdTask).toBeUndefined();
    const briefTask = result.tasks.find((t) => t.id === 'brief_received');
    expect(briefTask).toBeDefined();
  });

  it('uses override config when provided', () => {
    const overrideConfig = {
      ciWeights: {
        buildType: { hire_only: 10, hybrid: 10, custom: 10, engineered: 10 },
        standSize: { small: 10, medium: 10, large: 10 },
        avComplexity: { basic: 10, medium: 10, high: 10 },
        fabricationIntensity: { standard: 10, some_custom: 10, heavy_custom: 10 },
        briefClarity: { clear: 10, some_unknowns: 10, vague: 10 },
        engineeringRequired: 10,
        longLeadItems: 10,
        graphicsRequired: 10,
        avRequired: 10,
      },
      thresholds: { lowMax: 5, mediumMax: 10 },
    };
    const result = runCalculation(baseInput, defaultInfoGates, TRUCK_LEAVE, EMPTY, overrideConfig);
    expect(result.bucket).toBe('high');
  });
});

// ─── runCalculation — task sequence validation ───────────────────────────────

describe('runCalculation — task sequence validation', () => {
  it('truck_leave_date is the last task in production stage', () => {
    const input: ProjectInput = {
      ...baseInput,
      activeStages: ['production'],
    };
    const result = runCalculation(input, defaultInfoGates, TRUCK_LEAVE, EMPTY);
    const productionTasks = result.tasks.filter((t) => t.stage === 'production');
    const lastProdTask = productionTasks[productionTasks.length - 1];
    expect(lastProdTask?.id).toBe('truck_leave_date');
  });

  it('pack_and_load comes before truck_leave_date', () => {
    const input: ProjectInput = {
      ...baseInput,
      activeStages: ['production'],
    };
    const result = runCalculation(input, defaultInfoGates, TRUCK_LEAVE, EMPTY);
    const packIdx = result.tasks.findIndex((t) => t.id === 'pack_and_load');
    const truckIdx = result.tasks.findIndex((t) => t.id === 'truck_leave_date');
    expect(packIdx).toBeGreaterThanOrEqual(0);
    expect(truckIdx).toBeGreaterThanOrEqual(0);
    expect(packIdx).toBeLessThan(truckIdx);
  });

  it('contingency comes before pack_and_load', () => {
    const input: ProjectInput = {
      ...baseInput,
      activeStages: ['production'],
    };
    const result = runCalculation(input, defaultInfoGates, TRUCK_LEAVE, EMPTY);
    const contingencyIdx = result.tasks.findIndex((t) => t.id === 'contingency');
    const packIdx = result.tasks.findIndex((t) => t.id === 'pack_and_load');
    if (contingencyIdx >= 0 && packIdx >= 0) {
      expect(contingencyIdx).toBeLessThan(packIdx);
    }
  });
});

// ─── runCalculation — specific CI values ─────────────────────────────────────

describe('runCalculation — specific CI boundary values', () => {
  it('CI=8 maps to low bucket', () => {
    const input: ProjectInput = {
      buildType: 'hire_only',
      standSize: 'medium',
      avComplexity: 'basic',
      fabricationIntensity: 'standard',
      briefClarity: 'some_unknowns',
      engineeringRequired: false,
      longLeadItems: false,
    };
    const result = runCalculation(input, defaultInfoGates, TRUCK_LEAVE, EMPTY);
    expect(result.ci).toBe(8);
    expect(result.bucket).toBe('low');
  });

  it('CI=9 maps to medium bucket', () => {
    const input: ProjectInput = {
      buildType: 'hire_only',
      standSize: 'medium',
      avComplexity: 'medium',
      fabricationIntensity: 'standard',
      briefClarity: 'some_unknowns',
      engineeringRequired: false,
      longLeadItems: false,
    };
    const result = runCalculation(input, defaultInfoGates, TRUCK_LEAVE, EMPTY);
    expect(result.ci).toBe(9);
    expect(result.bucket).toBe('medium');
  });

  it('CI=15 maps to medium bucket', () => {
    const input: ProjectInput = {
      buildType: 'hybrid',
      standSize: 'medium',
      avComplexity: 'medium',
      fabricationIntensity: 'some_custom',
      briefClarity: 'vague',
      engineeringRequired: false,
      longLeadItems: false,
    };
    const result = runCalculation(input, defaultInfoGates, TRUCK_LEAVE, EMPTY);
    expect(result.ci).toBe(15);
    expect(result.bucket).toBe('medium');
  });

  it('CI=16 maps to high bucket', () => {
    const input: ProjectInput = {
      buildType: 'hybrid',
      standSize: 'medium',
      avComplexity: 'high',
      fabricationIntensity: 'some_custom',
      briefClarity: 'some_unknowns',
      engineeringRequired: false,
      longLeadItems: true,
    };
    const result = runCalculation(input, defaultInfoGates, TRUCK_LEAVE, EMPTY);
    expect(result.ci).toBe(16);
    expect(result.bucket).toBe('high');
  });
});
