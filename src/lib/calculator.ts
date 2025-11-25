// lib/calculator.ts
import {
  AvComplexity,
  BriefClarity,
  BuildType,
  CalculationResult,
  FabricationIntensity,
  InfoGates,
  LeadBucket,
  Milestones,
  PhaseDurations,
  ProjectInput,
  RiskLevel,
  StandSize,
} from "./types";

// scoring
const BUILD_TYPE_SCORES: Record<BuildType, number> = {
  hire: 1,
  hybrid: 3,
  custom: 5,
  engineered: 8,
};

const STAND_SIZE_SCORES: Record<StandSize, number> = {
  small: 1,
  medium: 3,
  large: 5,
};

const AV_COMPLEXITY_SCORES: Record<AvComplexity, number> = {
  basic: 1,
  medium: 2,
  high: 4,
};

const FABRICATION_SCORES: Record<FabricationIntensity, number> = {
  standard: 1,
  some_custom: 3,
  heavy_custom: 6,
};

const BRIEF_CLARITY_SCORES: Record<BriefClarity, number> = {
  clear: 0,
  some_unknowns: 2,
  vague: 5,
};

// fallback durations
const DEFAULT_DURATIONS: Record<LeadBucket, PhaseDurations> = {
  fast_track: { designDays:3, clientReviewDays:3, approvalBufferDays:2, procurementDays:5, productionDays:5, qaAndPackDays:2 },
  standard:   { designDays:5, clientReviewDays:5, approvalBufferDays:3, procurementDays:7, productionDays:10, qaAndPackDays:2 },
  custom:     { designDays:7, clientReviewDays:7, approvalBufferDays:3, procurementDays:10, productionDays:15, qaAndPackDays:3 },
  high_risk:  { designDays:10, clientReviewDays:10, approvalBufferDays:5, procurementDays:15, productionDays:20, qaAndPackDays:3 },
};

export function calculateComplexityIndex(input: ProjectInput): number {
  let score = 0;
  score += BUILD_TYPE_SCORES[input.buildType];
  score += STAND_SIZE_SCORES[input.standSize];
  score += AV_COMPLEXITY_SCORES[input.avComplexity];
  score += FABRICATION_SCORES[input.fabricationIntensity];
  score += BRIEF_CLARITY_SCORES[input.briefClarity];
  if (input.engineeringRequired) score += 3;
  if (input.longLeadItems) score += 2;
  return score;
}

export function getLeadBucket(ci: number): LeadBucket {
  if (ci <= 8) return "fast_track";
  if (ci <= 15) return "standard";
  if (ci <= 22) return "custom";
  return "high_risk";
}

export function getPhaseDurations(bucket: LeadBucket, brief: BriefClarity, eng: boolean): PhaseDurations {
  const base = DEFAULT_DURATIONS[bucket];
  let { designDays, clientReviewDays } = base;
  const { approvalBufferDays, procurementDays, productionDays, qaAndPackDays } = base;

  if (brief === "some_unknowns") { designDays+=2; clientReviewDays+=2; }
  if (brief === "vague") { designDays+=4; clientReviewDays+=4; }
  if (eng) { designDays+=3; clientReviewDays+=2; }

  return { designDays, clientReviewDays, approvalBufferDays, procurementDays, productionDays, qaAndPackDays };
}

// working days add (Monday-Friday only)
export function addWorkingDays(date: Date, days: number): Date {
  const r = new Date(date);
  const step = days >= 0 ? 1 : -1;
  let remaining = Math.abs(days);
  while (remaining > 0) {
    r.setDate(r.getDate() + step);
    const d = r.getDay();
    if (d !== 0 && d !== 6) remaining--;
  }
  return r;
}

export function calculateMilestones(truckLeave: Date, d: PhaseDurations): Milestones {
  const dispatch = addWorkingDays(truckLeave, -1);
  const productionComplete = addWorkingDays(dispatch, -d.qaAndPackDays);
  const productionStart = addWorkingDays(productionComplete, -d.productionDays);
  const procurementStart = addWorkingDays(productionStart, -d.procurementDays);
  const approvalDeadline = addWorkingDays(procurementStart, -d.approvalBufferDays);
  const clientReviewStart = addWorkingDays(approvalDeadline, -d.clientReviewDays);
  const designStart = addWorkingDays(clientReviewStart, -d.designDays);
  return { designStart, clientReviewStart, approvalDeadline, procurementStart, productionStart, productionComplete, dispatch, truckLeaveDate: truckLeave };
}

export function calculateInfoCompleteness(gates: InfoGates): number {
  const t = Object.keys(gates).length;
  const p = Object.values(gates).filter(Boolean).length;
  return t === 0 ? 0 : p / t;
}

export function calculateRiskLevel(m: Milestones | null): RiskLevel {
  if (!m) return "unknown";
  const today = new Date(); today.setHours(0,0,0,0);
  if (m.designStart < today) return "high";
  if (m.clientReviewStart < today) return "tight";
  return "ok";
}

export function runCalculation(input: ProjectInput): CalculationResult {
  const ci = calculateComplexityIndex(input);
  const leadBucket = getLeadBucket(ci);
  const durations = getPhaseDurations(leadBucket, input.briefClarity, input.engineeringRequired);

  const truckLeave = input.truckLeaveDate ? new Date(input.truckLeaveDate+"T00:00:00") : null;
  const milestones = truckLeave ? calculateMilestones(truckLeave, durations) : null;

  return {
    ci,
    leadBucket,
    durations,
    milestones,
    riskLevel: calculateRiskLevel(milestones),
    infoCompleteness: calculateInfoCompleteness(input.infoGates),
  };
}

export function formatDate(date: Date | null): string {
  if (!date || isNaN(date.getTime())) return "-";
  return date.toISOString().split("T")[0];
}

