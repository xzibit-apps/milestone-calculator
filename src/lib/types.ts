// lib/types.ts
export type BuildType = "hire" | "hybrid" | "custom" | "engineered";
export type StandSize = "small" | "medium" | "large";
export type AvComplexity = "basic" | "medium" | "high";
export type FabricationIntensity = "standard" | "some_custom" | "heavy_custom";
export type BriefClarity = "clear" | "some_unknowns" | "vague";
export type LeadBucket = "fast_track" | "standard" | "custom" | "high_risk";
export type RiskLevel = "ok" | "tight" | "high" | "unknown";

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

export interface CalculationResult {
  ci: number;
  leadBucket: LeadBucket;
  durations: PhaseDurations;
  milestones: Milestones | null;
  riskLevel: RiskLevel;
  infoCompleteness: number;
}

