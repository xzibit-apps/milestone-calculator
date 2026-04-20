// Working-day arithmetic with pluggable closure set.
//
// API routes fetch the closure set once per calculation (via getClosures) and
// pass it into the sync helpers — keeps the engine pure and test-friendly.

import { getSupabaseAdmin } from './supabase-server';

/** Set of non-working dates, keyed by ISO `YYYY-MM-DD`. */
export type ClosureSet = Set<string>;

/** Default jurisdictions relevant to the QLD-office MVP. */
export const DEFAULT_JURISDICTIONS = ['national', 'qld', 'company'] as const;

function toIsoDate(date: Date): string {
  // Use the local-date components rather than UTC so that a Date constructed
  // from 'YYYY-MM-DD' at local midnight round-trips cleanly.
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** Load active closures for the given jurisdictions into an in-memory Set. */
export async function getClosures(
  jurisdictions: readonly string[] = DEFAULT_JURISDICTIONS,
): Promise<ClosureSet> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('company_closures')
    .select('date')
    .eq('active', true)
    .in('jurisdiction', jurisdictions as string[]);

  if (error) throw new Error(`Failed to load company_closures: ${error.message}`);

  const set: ClosureSet = new Set();
  for (const row of data ?? []) {
    if (typeof row.date === 'string') set.add(row.date);
  }
  return set;
}

export function isWeekend(date: Date): boolean {
  const day = date.getDay();
  return day === 0 || day === 6;
}

export function isNonWorkingDay(date: Date, closures: ClosureSet): boolean {
  if (isWeekend(date)) return true;
  return closures.has(toIsoDate(date));
}

function stepDays(fromDate: Date, days: number, closures: ClosureSet): Date {
  if (days === 0) return new Date(fromDate);
  const direction = days > 0 ? 1 : -1;
  let remaining = Math.abs(days);
  const cursor = new Date(fromDate);
  while (remaining > 0) {
    cursor.setDate(cursor.getDate() + direction);
    if (!isNonWorkingDay(cursor, closures)) remaining -= 1;
  }
  return cursor;
}

/** Subtract `days` working days from `fromDate`. Weekends + closures skipped. */
export function subtractWorkingDays(
  fromDate: Date,
  days: number,
  closures: ClosureSet,
): Date {
  return stepDays(fromDate, -Math.abs(days), closures);
}

/**
 * Add `days` working days to `fromDate`. Negative `days` steps backwards —
 * matches the engine's callers which pass positive offsets for forward passes
 * and occasionally negative offsets for the pre-truck backward pass.
 */
export function addWorkingDays(
  fromDate: Date,
  days: number,
  closures: ClosureSet,
): Date {
  return stepDays(fromDate, days, closures);
}
