// lib/constants.ts - Static messages and constants

export const MESSAGES = {
  // Form Labels
  INPUTS: 'Project Inputs',
  PROJECT_NAME: 'Project Name',
  CLIENT_NAME: 'Client Name',
  TRUCK_LEAVE_DATE: 'Truck Leave Date',
  BUILD_TYPE: 'Build Type',
  STAND_SIZE: 'Stand Size',
  AV_COMPLEXITY: 'AV Complexity',
  FABRICATION_INTENSITY: 'Fabrication Intensity',
  BRIEF_CLARITY: 'Brief Clarity',
  OPTIONAL_FLAGS: 'Optional Flags',
  INFORMATION_GATES: 'Information Gates',
  
  // Placeholders
  PROJECT_NAME_PLACEHOLDER: 'Enter project name',
  CLIENT_NAME_PLACEHOLDER: 'Enter client name',
  
  // Help Text
  TRUCK_LEAVE_DATE_HELP: 'Leave empty to calculate CI and durations only (no milestones)',
  
  // Validation Errors
  PROJECT_NAME_REQUIRED: 'Project name is required',
  CLIENT_NAME_REQUIRED: 'Client name is required',
  TRUCK_LEAVE_DATE_REQUIRED: 'Truck leave date is required',
  TRUCK_LEAVE_DATE_INVALID: 'Please enter a valid date',
  TRUCK_LEAVE_DATE_FUTURE: 'Truck leave date must be in the future',
  
  // Optional Flags
  ENGINEERING_REQUIRED: 'Engineering Required',
  LONG_LEAD_ITEMS: 'Long-lead Items',
  
  // Information Gates
  FINAL_DRAWINGS: 'Final Drawings',
  FINISHES_CONFIRMED: 'Finishes Confirmed',
  BRANDING_ASSETS: 'Branding Assets',
  AV_INPUTS_CONFIRMED: 'AV Inputs Confirmed',
  ENGINEERING_SIGNED_OFF: 'Engineering Signed Off',
  CLIENT_SCOPE_APPROVED: 'Client Scope Approved',
  
  // Buttons
  CALCULATE_MILESTONES: 'Calculate Milestones',
  CALCULATING: 'Calculating...',
  
  // Results
  CALCULATED_SPECS: 'Calculated Specs',
  COMPLEXITY_INDEX: 'Complexity Index',
  LEAD_BUCKET: 'Lead Bucket',
  PHASE_DURATIONS: 'Phase Durations (Days)',
  MILESTONES: 'Milestones',
  RISK_LEVEL: 'Risk Level',
  INFORMATION_COMPLETENESS: 'Information Completeness',
  
  // Empty States
  NO_RESULTS: 'Fill in the project inputs and click "Calculate Milestones" to see results',
  TRUCK_LEAVE_DATE_REQUIRED_TITLE: 'Truck Leave Date Required',
  TRUCK_LEAVE_DATE_REQUIRED_MESSAGE: 'Enter a Truck Leave Date to calculate milestones',
  
  // Risk Levels
  RISK_OK: 'On Track',
  RISK_TIGHT: 'Tight',
  RISK_HIGH: 'High Risk',
  RISK_UNKNOWN: 'Unknown',
  
  // Lead Buckets
  BUCKET_FAST_TRACK: 'Fast Track',
  BUCKET_STANDARD: 'Standard',
  BUCKET_CUSTOM: 'Custom',
  BUCKET_HIGH_RISK: 'High Risk',
  
  // Phase Labels
  PHASE_DESIGN: 'Design',
  PHASE_REVIEW: 'Review',
  PHASE_BUFFER: 'Buffer',
  PHASE_PROCUREMENT: 'Procurement',
  PHASE_PRODUCTION: 'Production',
  PHASE_QA_PACK: 'QA & Pack',
  
  // Milestone Labels
  MILESTONE_DESIGN_START: 'Design Start',
  MILESTONE_CLIENT_REVIEW_START: 'Client Review Start',
  MILESTONE_APPROVAL_DEADLINE: 'Approval Deadline',
  MILESTONE_PROCUREMENT_START: 'Procurement Start',
  MILESTONE_PRODUCTION_START: 'Production Start',
  MILESTONE_PRODUCTION_COMPLETE: 'Production Complete',
  MILESTONE_DISPATCH: 'Dispatch',
  MILESTONE_TRUCK_LEAVE: 'Truck Leave',
  
  // Build Types
  BUILD_HIRE: 'Hire-only',
  BUILD_HYBRID: 'Hybrid',
  BUILD_CUSTOM: 'Custom',
  BUILD_ENGINEERED: 'Engineered',
  
  // Stand Sizes
  STAND_SMALL: 'Small',
  STAND_MEDIUM: 'Medium',
  STAND_LARGE: 'Large',
  
  // AV Complexity
  AV_BASIC: 'Basic',
  AV_MEDIUM: 'Medium',
  AV_HIGH: 'High',
  
  // Fabrication Intensity
  FAB_STANDARD: 'Standard',
  FAB_SOME_CUSTOM: 'Some Custom',
  FAB_HEAVY_CUSTOM: 'Heavy Custom',
  
  // Brief Clarity
  BRIEF_CLEAR: 'Clear',
  BRIEF_SOME_UNKNOWNS: 'Some Unknowns',
  BRIEF_VAGUE: 'Vague',
} as const;

