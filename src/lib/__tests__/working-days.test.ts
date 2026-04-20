import { describe, it, expect } from 'vitest';
import {
  isWeekend,
  isNonWorkingDay,
  addWorkingDays,
  subtractWorkingDays,
  type ClosureSet,
} from '../working-days';

const EMPTY: ClosureSet = new Set();

function d(iso: string): Date {
  return new Date(`${iso}T00:00:00`);
}

describe('working-days helpers', () => {
  it('isWeekend detects Saturday and Sunday', () => {
    expect(isWeekend(d('2026-04-25'))).toBe(true); // Saturday
    expect(isWeekend(d('2026-04-26'))).toBe(true); // Sunday
    expect(isWeekend(d('2026-04-27'))).toBe(false); // Monday
  });

  it('isNonWorkingDay returns true for weekends and closures', () => {
    const closures: ClosureSet = new Set(['2026-04-27']);
    expect(isNonWorkingDay(d('2026-04-25'), EMPTY)).toBe(true); // weekend
    expect(isNonWorkingDay(d('2026-04-27'), closures)).toBe(true); // closure
    expect(isNonWorkingDay(d('2026-04-27'), EMPTY)).toBe(false);
    expect(isNonWorkingDay(d('2026-04-28'), closures)).toBe(false);
  });

  it('addWorkingDays skips weekends', () => {
    // Friday + 1 working day = next Monday
    const result = addWorkingDays(d('2026-05-01'), 1, EMPTY);
    expect(result.getDay()).toBe(1); // Monday
    expect(result.getDate()).toBe(4);
  });

  it('addWorkingDays skips closures', () => {
    // Mon 4 May 2026 is QLD Labour Day (closure); Mon+1 working day from the
    // preceding Friday should land on Tue 5 May, skipping both the weekend
    // and the closure.
    const closures: ClosureSet = new Set(['2026-05-04']);
    const result = addWorkingDays(d('2026-05-01'), 1, closures);
    expect(result.getDate()).toBe(5);
    expect(result.getMonth()).toBe(4); // May (0-indexed)
  });

  it('addWorkingDays with 0 returns the same date', () => {
    const start = d('2026-04-27');
    const result = addWorkingDays(start, 0, EMPTY);
    expect(result.getTime()).toBe(start.getTime());
  });

  it('addWorkingDays with negative days steps backwards', () => {
    // Monday - 1 working day = preceding Friday
    const result = addWorkingDays(d('2026-05-04'), -1, EMPTY);
    expect(result.getDay()).toBe(5); // Friday
    expect(result.getDate()).toBe(1);
  });

  it('subtractWorkingDays with positive count steps backwards', () => {
    // Monday - 3 working days = preceding Wednesday
    const result = subtractWorkingDays(d('2026-05-04'), 3, EMPTY);
    expect(result.getDay()).toBe(3); // Wednesday
    expect(result.getDate()).toBe(29); // 29 Apr 2026
  });

  it('handles the 2026 Christmas/New Year closure range', () => {
    // Using the real national public holidays in that window:
    //   Fri 25 Dec, Sat 26 Dec, Sun 27 Dec, ..., Fri 1 Jan 2027
    //   Sat 26 Dec is not a closure in every year — for 2026 it falls on
    //   Saturday but is still seeded as a national holiday.
    // From Thu 24 Dec + 3 working days, skipping both public holidays and
    // weekends, we should land on Wed 30 Dec.
    const closures: ClosureSet = new Set([
      '2026-12-25',
      '2026-12-26',
      '2027-01-01',
    ]);
    const result = addWorkingDays(d('2026-12-24'), 3, closures);
    expect(result.getFullYear()).toBe(2026);
    expect(result.getMonth()).toBe(11); // December
    expect(result.getDate()).toBe(30);
  });
});
