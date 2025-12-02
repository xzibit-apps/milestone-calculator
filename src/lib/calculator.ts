// lib/calculator.ts
// Updated logic for Production Milestone Calculator v2
// - Uses Truck Leave Date as anchor
// - Uses task config loaded from config/tasks.json
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

// --- Complexity scoring tables ---

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

export function calculateCI(input: ProjectInput): number {
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

export function mapBucket(ci: number): ComplexityBucket {
  if (ci <= 8) return "low";
  if (ci <= 15) return "medium";
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
export function countWorkingDays(startDate: Date, endDate: Date): number {
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
  const tags: string[] = [];
  tags.push(input.buildType);
  if (input.engineeringRequired) tags.push("engineering");
  if (input.avComplexity === "high") tags.push("av_heavy");

  return allTasks.filter((t) => {
    if (!t.scopeConditions || t.scopeConditions.length === 0) return true;
    if (t.scopeConditions.includes("all")) return true;
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

  // assume tasks[] is in logical order from first -> last
  for (let i = tasks.length - 1; i >= 0; i--) {
    const task = tasks[i];
    const duration = getDurationForBucket(task, bucket);
    const start =
      duration > 0 ? addWorkingDays(currentEnd, -duration) : new Date(currentEnd);
    const end = new Date(currentEnd);
    scheduled.unshift({
      ...task,
      startDate: start,
      endDate: end,
    });
    currentEnd = start;
  }

  return scheduled;
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
  allTasks: TaskConfig[]
): CalculationResult {
  const ci = calculateCI(input);
  const bucket = mapBucket(ci);
  const infoCompleteness = calculateInfoCompleteness(input.infoGates);

  const truckLeave =
    input.truckLeaveDate && input.truckLeaveDate !== ""
      ? new Date(input.truckLeaveDate + "T00:00:00")
      : null;

  const scopedTasks = selectTasksForProject(allTasks, input);
  let scheduled: ScheduledTask[] = [];

  if (truckLeave && !isNaN(truckLeave.getTime())) {
    scheduled = scheduleSequentialBackwards(truckLeave, scopedTasks, bucket);
  }

  return {
    ci,
    bucket,
    tasks: scheduled,
    clientMilestones: scheduled,
    infoCompleteness,
  };
}
