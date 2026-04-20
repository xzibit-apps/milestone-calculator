// Shared helpers for the /api/milestone/* routes. Request parsing, date
// coercion, input validation, and the end-to-end "run a calculation" path.

import {
  runCalculation,
  calculateBumpInWarning,
  type ProjectInput,
  type InfoGates,
  type CalculationResult,
  type ConfigOverride,
} from './milestone-engine';
import { getClosures } from './working-days';
import { getMilestoneConfig } from './milestone-db';

const BUILD_TYPES = ['hire_only', 'hybrid', 'custom', 'engineered'] as const;
const STAND_SIZES = ['small', 'medium', 'large'] as const;
const AV_COMPLEXITIES = ['basic', 'medium', 'high'] as const;
const FAB_INTENSITIES = ['standard', 'some_custom', 'heavy_custom'] as const;
const BRIEF_CLARITIES = ['clear', 'some_unknowns', 'vague'] as const;
const DELIVERABLE_SCOPES = ['xzibit', 'client', 'off'] as const;
const STAGES = ['concept_design', 'production', 'onsite', 'post_show'] as const;

/** Coerce an ISO-date string, epoch-ms number, or Date into a local-midnight Date. */
export function coerceDate(v: unknown): Date | null {
  if (v === null || v === undefined) return null;
  if (v instanceof Date) return isNaN(v.getTime()) ? null : v;
  if (typeof v === 'number') {
    const d = new Date(v);
    return isNaN(d.getTime()) ? null : d;
  }
  if (typeof v === 'string') {
    // Prefer local-midnight parse for 'YYYY-MM-DD'.
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(v);
    if (m) {
      const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
      return isNaN(d.getTime()) ? null : d;
    }
    const d = new Date(v);
    return isNaN(d.getTime()) ? null : d;
  }
  return null;
}

function isOneOf<T extends readonly string[]>(v: unknown, allowed: T): v is T[number] {
  return typeof v === 'string' && (allowed as readonly string[]).includes(v);
}

export type ParsedRequest = {
  input: ProjectInput;
  infoGates: InfoGates;
  truckLeaveDate: Date;
};

/** Validate + parse the core fields shared by /calculate and /save. */
export function parseCoreRequest(body: unknown): { ok: true; parsed: ParsedRequest } | { ok: false; error: string } {
  if (!body || typeof body !== 'object') return { ok: false, error: 'body must be a JSON object' };
  const b = body as Record<string, unknown>;

  const inputRaw = b.input;
  if (!inputRaw || typeof inputRaw !== 'object') {
    return { ok: false, error: 'input is required and must be an object' };
  }
  const i = inputRaw as Record<string, unknown>;

  if (!isOneOf(i.buildType, BUILD_TYPES)) return { ok: false, error: `input.buildType must be one of ${BUILD_TYPES.join(', ')}` };
  if (!isOneOf(i.standSize, STAND_SIZES)) return { ok: false, error: `input.standSize must be one of ${STAND_SIZES.join(', ')}` };
  if (!isOneOf(i.avComplexity, AV_COMPLEXITIES)) return { ok: false, error: `input.avComplexity must be one of ${AV_COMPLEXITIES.join(', ')}` };
  if (!isOneOf(i.fabricationIntensity, FAB_INTENSITIES)) return { ok: false, error: `input.fabricationIntensity must be one of ${FAB_INTENSITIES.join(', ')}` };
  if (!isOneOf(i.briefClarity, BRIEF_CLARITIES)) return { ok: false, error: `input.briefClarity must be one of ${BRIEF_CLARITIES.join(', ')}` };

  const activeStages = i.activeStages;
  if (activeStages !== undefined) {
    if (!Array.isArray(activeStages) || !activeStages.every((s) => isOneOf(s, STAGES))) {
      return { ok: false, error: 'input.activeStages must be an array of project stages' };
    }
  }
  for (const field of ['graphicsScope', 'avContentScope', 'conceptDesignScope'] as const) {
    if (i[field] !== undefined && !isOneOf(i[field], DELIVERABLE_SCOPES)) {
      return { ok: false, error: `input.${field} must be one of ${DELIVERABLE_SCOPES.join(', ')}` };
    }
  }

  const input: ProjectInput = {
    buildType: i.buildType as ProjectInput['buildType'],
    standSize: i.standSize as ProjectInput['standSize'],
    avComplexity: i.avComplexity as ProjectInput['avComplexity'],
    fabricationIntensity: i.fabricationIntensity as ProjectInput['fabricationIntensity'],
    briefClarity: i.briefClarity as ProjectInput['briefClarity'],
    engineeringRequired: Boolean(i.engineeringRequired),
    longLeadItems: Boolean(i.longLeadItems),
    graphicsRequired: typeof i.graphicsRequired === 'boolean' ? i.graphicsRequired : undefined,
    avRequired: typeof i.avRequired === 'boolean' ? i.avRequired : undefined,
    activeStages: activeStages as ProjectInput['activeStages'],
    graphicsScope: i.graphicsScope as ProjectInput['graphicsScope'],
    avContentScope: i.avContentScope as ProjectInput['avContentScope'],
    conceptDesignScope: i.conceptDesignScope as ProjectInput['conceptDesignScope'],
  };

  const gatesRaw = b.infoGates;
  if (!gatesRaw || typeof gatesRaw !== 'object') {
    return { ok: false, error: 'infoGates is required and must be an object' };
  }
  const g = gatesRaw as Record<string, unknown>;
  const infoGates: InfoGates = {
    finalDrawings: Boolean(g.finalDrawings),
    finishesConfirmed: Boolean(g.finishesConfirmed),
    brandingAssets: Boolean(g.brandingAssets),
    avInputsConfirmed: Boolean(g.avInputsConfirmed),
    engineeringSignedOff: Boolean(g.engineeringSignedOff),
    clientScopeApproved: Boolean(g.clientScopeApproved),
  };

  const truckLeaveDate = coerceDate(b.truckLeaveDate);
  if (!truckLeaveDate) {
    return { ok: false, error: 'truckLeaveDate is required (ISO date string or epoch ms)' };
  }

  return { ok: true, parsed: { input, infoGates, truckLeaveDate } };
}

/** Load config + closures, run the engine, return the result. */
export async function computeCalculation(
  parsed: ParsedRequest,
  extras?: { bumpInDate: Date | null; showOpenDate: Date | null },
): Promise<{ result: CalculationResult; config: ConfigOverride }> {
  const [config, closures] = await Promise.all([
    getMilestoneConfig(),
    getClosures(),
  ]);

  const result = runCalculation(
    parsed.input,
    parsed.infoGates,
    parsed.truckLeaveDate,
    closures,
    config,
  );

  if (extras && (extras.bumpInDate || extras.showOpenDate)) {
    const warning = calculateBumpInWarning(
      parsed.truckLeaveDate,
      extras.bumpInDate,
      extras.showOpenDate,
    );
    if (warning) result.bumpInWarning = warning;
  }

  return { result, config };
}

/** Marshal the result's Date objects to ISO strings for JSON responses. */
export function serialiseResult(result: CalculationResult): unknown {
  return {
    ...result,
    projectStartDate: result.projectStartDate instanceof Date
      ? result.projectStartDate.toISOString()
      : result.projectStartDate,
    tasks: result.tasks.map((t) => ({
      ...t,
      startDate: t.startDate instanceof Date ? t.startDate.toISOString() : t.startDate,
      endDate: t.endDate instanceof Date ? t.endDate.toISOString() : t.endDate,
    })),
  };
}
