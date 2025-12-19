// lib/types.ts
export type BuildType = "hire" | "hybrid" | "custom" | "engineered";
export type StandSize = "small" | "medium" | "large";
export type AvComplexity = "basic" | "medium" | "high";
export type FabricationIntensity = "standard" | "some_custom" | "heavy_custom";
export type BriefClarity = "clear" | "some_unknowns" | "vague";
export type LeadBucket = "fast_track" | "standard" | "custom" | "high_risk"; // Legacy type, kept for backward compatibility
export type ComplexityBucket = "low" | "medium" | "high";
// RiskLevel removed in v2 - no risk scoring per spec section 9.3

export interface InfoGates {
  finalDrawings: boolean;
  finishesConfirmed: boolean;
  brandingAssets: boolean;
  avInputsConfirmed: boolean;
  engineeringSignedOff: boolean;
  clientScopeApproved: boolean;
}

export interface ProjectInput {
  projectName: string;
  clientName: string;
  truckLeaveDate: string | null;

  buildType: BuildType;
  standSize: StandSize;
  avComplexity: AvComplexity;
  fabricationIntensity: FabricationIntensity;
  briefClarity: BriefClarity;
  engineeringRequired: boolean;
  longLeadItems: boolean;

  infoGates: InfoGates;
}

export interface PhaseDurations {
  designDays: number;
  clientReviewDays: number;
  approvalBufferDays: number;
  procurementDays: number;
  productionDays: number;
  qaAndPackDays: number;
}

export interface Milestones {
  designStart: Date;
  clientReviewStart: Date;
  approvalDeadline: Date;
  procurementStart: Date;
  productionStart: Date;
  productionComplete: Date;
  dispatch: Date;
  truckLeaveDate: Date;
}

// Task-based types (v2)
export interface TaskConfig {
  id: string;
  name: string;
  durationLow: number;
  durationMedium: number;
  durationHigh: number;
  scopeConditions: string[];
  successFactor: string;
  internalNotes?: string;
}

export interface ScheduledTask extends TaskConfig {
  startDate: Date | null;
  endDate: Date | null;
  duration: number; // chosen bucket duration (durationLow, durationMedium, or durationHigh)
}

// Note: PhaseDurations and Milestones are legacy types kept for backward compatibility
// They are defined above and reused here for CalculationResult

// Updated CalculationResult (v2)
export interface CalculationResult {
  ci: number;
  bucket: ComplexityBucket;
  tasks: ScheduledTask[];
  clientMilestones: ScheduledTask[];
  infoCompleteness: number;
  // Legacy fields for backward compatibility (optional)
  leadBucket?: LeadBucket;
  durations?: PhaseDurations;
  milestones?: Milestones | null;
  // riskLevel removed in v2 - no risk scoring per spec section 9.3
}

