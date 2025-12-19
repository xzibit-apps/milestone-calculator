// lib/calculator.ts
// Production Milestone Calculator v2
// - Uses Truck Leave Date as anchor
// - Uses task config loaded from config/tasks.json
// - Uses CI config loaded from config/ciConfig.json
// - Schedules tasks sequentially backwards (parallel/graph logic can be phase 2)

import type {
  BuildType,
  StandSize,
  AvComplexity,
  FabricationIntensity,
  BriefClarity,
  ComplexityBucket,
  ProjectInput,
  TaskConfig,
  ScheduledTask,
  CalculationResult,
  InfoGates,
} from './types';

// CI Config types
export interface CIConfig {
  weights: {
    buildType: Record<BuildType, number>;
    standSize: Record<StandSize, number>;
    avComplexity: Record<AvComplexity, number>;
    fabricationIntensity: Record<FabricationIntensity, number>;
    briefClarity: Record<BriefClarity, number>;
    engineeringRequired: number;
    longLeadItems: number;
  };
  thresholds: {
    lowMax: number;
    mediumMax: number;
  };
}

// Load CI config (will be loaded from JSON at runtime)
let ciConfigCache: CIConfig | null = null;

export function loadCIConfig(): CIConfig {
  if (ciConfigCache) return ciConfigCache;
  
  // In browser, we'll need to fetch this
  // For now, return default - will be updated when we load from JSON
  throw new Error('CI Config must be loaded from JSON file');
}

export function setCIConfig(config: CIConfig): void {
  ciConfigCache = config;
}

// --- Complexity scoring (now uses config) ---

export function calculateCI(input: ProjectInput, ciConfig: CIConfig): number {
  let score = 0;
  score += ciConfig.weights.buildType[input.buildType];
  score += ciConfig.weights.standSize[input.standSize];
  score += ciConfig.weights.avComplexity[input.avComplexity];
  score += ciConfig.weights.fabricationIntensity[input.fabricationIntensity];
  score += ciConfig.weights.briefClarity[input.briefClarity];
  if (input.engineeringRequired) score += ciConfig.weights.engineeringRequired;
  if (input.longLeadItems) score += ciConfig.weights.longLeadItems;
  return score;
}

export function mapBucket(ci: number, ciConfig: CIConfig): ComplexityBucket {
  if (ci <= ciConfig.thresholds.lowMax) return "low";
  if (ci <= ciConfig.thresholds.mediumMax) return "medium";
  return "high";
}

// --- Info completeness ---

export function calculateInfoCompleteness(gates: InfoGates): number {
  const total = Object.keys(gates).length;
  const passed = Object.values(gates).filter(Boolean).length;
  return total === 0 ? 0 : passed / total;
}

// --- Working-days helper (Mon–Fri only) ---

export function addWorkingDays(date: Date, days: number): Date {
  const result = new Date(date);
  const step = days >= 0 ? 1 : -1;
  let remaining = Math.abs(days);
  while (remaining > 0) {
    result.setDate(result.getDate() + step);
    const dow = result.getDay(); // 0=Sun,6=Sat
    if (dow !== 0 && dow !== 6) {
      remaining -= 1;
    }
  }
  return result;
}

// Count working days between two dates (inclusive)
export function countWorkingDays(startDate: Date | null, endDate: Date | null): number {
  if (!startDate || !endDate) return 0;
  
  let count = 0;
  const current = new Date(startDate);
  const end = new Date(endDate);
  
  // Normalize to start of day
  current.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);
  
  while (current <= end) {
    const dow = current.getDay();
    if (dow !== 0 && dow !== 6) { // Monday to Friday
      count += 1;
    }
    current.setDate(current.getDate() + 1);
  }
  
  return count;
}

// --- Task selection and scheduling ---

export function selectTasksForProject(
  allTasks: TaskConfig[],
  input: ProjectInput
): TaskConfig[] {
  // Derive project tags
  const tags: string[] = ["all"]; // Always include "all"
  tags.push(input.buildType);
  if (input.engineeringRequired) tags.push("engineering");
  if (input.avComplexity === "high") tags.push("av_heavy");

  return allTasks.filter((t) => {
    if (!t.scopeConditions || t.scopeConditions.length === 0) return true;
    // Task is included if any of its scopeConditions match any project tag
    return t.scopeConditions.some((cond) => tags.includes(cond));
  });
}

export function getDurationForBucket(task: TaskConfig, bucket: ComplexityBucket): number {
  switch (bucket) {
    case "low":
      return task.durationLow;
    case "medium":
      return task.durationMedium;
    case "high":
      return task.durationHigh;
  }
}

// Sequential backwards scheduling using task order
export function scheduleSequentialBackwards(
  truckLeaveDate: Date,
  tasks: TaskConfig[],
  bucket: ComplexityBucket
): ScheduledTask[] {
  const scheduled: ScheduledTask[] = [];
  let currentEnd = new Date(truckLeaveDate);
  currentEnd.setHours(0, 0, 0, 0);

  // Walk backwards through tasks (tasks array is in forward order)
  for (let i = tasks.length - 1; i >= 0; i--) {
    const task = tasks[i];
    const duration = getDurationForBucket(task, bucket);
    
    let start: Date | null = null;
    let end: Date | null = null;
    
    if (duration > 0) {
      // Calculate start date by going backwards
      start = addWorkingDays(currentEnd, -duration);
      end = new Date(currentEnd);
    } else {
      // Zero-duration task (like Truck Leave Date)
      start = new Date(currentEnd);
      end = new Date(currentEnd);
    }
    
    scheduled.unshift({
      ...task,
      startDate: start,
      endDate: end,
      duration: duration,
    });
    
    // Move currentEnd backwards for next iteration
    currentEnd = start;
  }

  return scheduled;
}

// Schedule tasks without dates (when truckLeaveDate is not provided)
export function scheduleTasksWithoutDates(
  tasks: TaskConfig[],
  bucket: ComplexityBucket
): ScheduledTask[] {
  return tasks.map((task) => {
    const duration = getDurationForBucket(task, bucket);
    return {
      ...task,
      startDate: null,
      endDate: null,
      duration: duration,
    };
  });
}

// Helper to format dates for UI
export function formatDate(date: Date | null | undefined): string {
  if (!date || isNaN(date.getTime())) return "-";
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

// Main entrypoint
export function runCalculation(
  input: ProjectInput,
  allTasks: TaskConfig[],
  ciConfig: CIConfig
): CalculationResult {
  const ci = calculateCI(input, ciConfig);
  const bucket = mapBucket(ci, ciConfig);
  const infoCompleteness = calculateInfoCompleteness(input.infoGates);

  const truckLeave =
    input.truckLeaveDate && input.truckLeaveDate !== ""
      ? new Date(input.truckLeaveDate + "T00:00:00")
      : null;

  const scopedTasks = selectTasksForProject(allTasks, input);
  let scheduled: ScheduledTask[] = [];

  if (truckLeave && !isNaN(truckLeave.getTime())) {
    // Validate that truck leave date is not in the past
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const truckLeaveDate = new Date(truckLeave);
    truckLeaveDate.setHours(0, 0, 0, 0);
    
       if (truckLeaveDate < today) {
      throw new Error('Truck leave date cannot be in the past');
    }
    
    scheduled = scheduleSequentialBackwards(truckLeave, scopedTasks, bucket);
  } else {
    // No truck leave date - schedule with durations only
    scheduled = scheduleTasksWithoutDates(scopedTasks, bucket);
  }

  return {
    ci,
    bucket,
    tasks: scheduled,
    clientMilestones: scheduled, // For v2, same as tasks
    infoCompleteness,
  };
}
