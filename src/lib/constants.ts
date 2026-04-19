// lib/constants.ts - Static messages and constants

export const MESSAGES = {
  // Form labels
  INPUTS: 'Project inputs',
  PROJECT_NAME: 'Project name',
  CLIENT_NAME: 'Client name',
  TRUCK_LEAVE_DATE: 'Truck leave date',
  BUILD_TYPE: 'Build type',
  STAND_SIZE: 'Stand size',
  AV_COMPLEXITY: 'AV complexity',
  FABRICATION_INTENSITY: 'Fabrication intensity',
  BRIEF_CLARITY: 'Brief clarity',
  OPTIONAL_FLAGS: 'Optional flags',
  INFORMATION_GATES: 'Information gates',

  // Placeholders
  PROJECT_NAME_PLACEHOLDER: 'Enter project name',
  CLIENT_NAME_PLACEHOLDER: 'Enter client name',

  // Help text
  TRUCK_LEAVE_DATE_HELP: 'Leave empty to calculate CI and durations only (no milestones)',

  // Validation errors
  PROJECT_NAME_REQUIRED: 'Project name is required',
  CLIENT_NAME_REQUIRED: 'Client name is required',
  TRUCK_LEAVE_DATE_REQUIRED: 'Truck leave date is required',
  TRUCK_LEAVE_DATE_INVALID: 'Please enter a valid date',
  TRUCK_LEAVE_DATE_FUTURE: 'Truck leave date must be in the future',

  // Optional flags
  ENGINEERING_REQUIRED: 'Engineering required',
  LONG_LEAD_ITEMS: 'Long-lead items',

  // Information gates
  FINAL_DRAWINGS: 'Final drawings',
  FINISHES_CONFIRMED: 'Finishes confirmed',
  BRANDING_ASSETS: 'Branding assets',
  AV_INPUTS_CONFIRMED: 'AV inputs confirmed',
  ENGINEERING_SIGNED_OFF: 'Engineering signed off',
  CLIENT_SCOPE_APPROVED: 'Client scope approved',

  // Buttons
  CALCULATE_MILESTONES: 'Calculate milestones',
  CALCULATING: 'Calculating…',

  // Results
  CALCULATED_SPECS: 'Calculated specs',
  COMPLEXITY_INDEX: 'Complexity index',
  COMPLEXITY_BUCKET: 'Complexity bucket',
  LEAD_BUCKET: 'Lead bucket', // Legacy — kept for backward compatibility
  PHASE_DURATIONS: 'Phase durations (days)',
  MILESTONES: 'Milestones',
  INFORMATION_COMPLETENESS: 'Information completeness',

  // Empty states
  NO_RESULTS: 'Fill in the project inputs and click "Calculate milestones" to see results',
  TRUCK_LEAVE_DATE_REQUIRED_TITLE: 'Truck leave date required',
  TRUCK_LEAVE_DATE_REQUIRED_MESSAGE: 'Enter a truck leave date to calculate milestones',

  // Lead buckets (legacy)
  BUCKET_FAST_TRACK: 'Fast track',
  BUCKET_STANDARD: 'Standard',
  BUCKET_CUSTOM: 'Custom',
  BUCKET_HIGH_RISK: 'High risk',

  // Complexity buckets (v2)
  BUCKET_LOW: 'Low',
  BUCKET_MEDIUM: 'Medium',
  BUCKET_HIGH: 'High',

  // Phase labels
  PHASE_DESIGN: 'Design',
  PHASE_REVIEW: 'Review',
  PHASE_BUFFER: 'Buffer',
  PHASE_PROCUREMENT: 'Procurement',
  PHASE_PRODUCTION: 'Production',
  PHASE_QA_PACK: 'QA & pack',

  // Milestone labels
  MILESTONE_DESIGN_START: 'Design start',
  MILESTONE_CLIENT_REVIEW_START: 'Client review start',
  MILESTONE_APPROVAL_DEADLINE: 'Approval deadline',
  MILESTONE_PROCUREMENT_START: 'Procurement start',
  MILESTONE_PRODUCTION_START: 'Production start',
  MILESTONE_PRODUCTION_COMPLETE: 'Production complete',
  MILESTONE_DISPATCH: 'Dispatch',
  MILESTONE_TRUCK_LEAVE: 'Truck leave',

  // Build types
  BUILD_HIRE: 'Hire only',
  BUILD_HYBRID: 'Hybrid',
  BUILD_CUSTOM: 'Custom',
  BUILD_ENGINEERED: 'Engineered',

  // Stand sizes
  STAND_SMALL: 'Small',
  STAND_MEDIUM: 'Medium',
  STAND_LARGE: 'Large',

  // AV complexity
  AV_BASIC: 'Basic',
  AV_MEDIUM: 'Medium',
  AV_HIGH: 'High',

  // Fabrication intensity
  FAB_STANDARD: 'Standard',
  FAB_SOME_CUSTOM: 'Some custom',
  FAB_HEAVY_CUSTOM: 'Heavy custom',

  // Brief clarity
  BRIEF_CLEAR: 'Clear',
  BRIEF_SOME_UNKNOWNS: 'Some unknowns',
  BRIEF_VAGUE: 'Vague',

  // Error messages
  ERROR_CALCULATION_FAILED: 'Failed to calculate milestones. Please check your inputs and try again.',
  ERROR_CONFIG_NOT_LOADED: 'Configuration not loaded. Please refresh the page.',
  ERROR_INVALID_TRUCK_DATE: 'Truck leave date cannot be in the past.',
} as const;

// Timing constants
export const TIMING = {
  // Admin page message display duration (milliseconds)
  MESSAGE_DISPLAY_DURATION: 3000,
  // Fade animation duration (milliseconds)
  FADE_ANIMATION_DURATION: 300,
  // Minimum calculation delay for smooth UX (milliseconds)
  CALCULATION_DELAY: 100,
} as const;
