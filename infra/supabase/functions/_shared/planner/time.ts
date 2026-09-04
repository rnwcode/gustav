/** Shared day-math helpers — every planner step reasons in whole days. */

import type { Weekday } from './models/enums.ts';

export const MS_PER_DAY = 24 * 60 * 60 * 1000;

/**
 * `Weekday` in `Date.getUTCDay()` order (Sunday = 0). Dates throughout the
 * planner are constructed as UTC midnight (e.g. `new Date('2026-03-10')`),
 * so weekday extraction uses the UTC day, never the local one.
 */
const WEEKDAY_BY_UTC_INDEX: readonly Weekday[] = [
  'sunday',
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
];

export function weekdayOf(date: Date): Weekday {
  return WEEKDAY_BY_UTC_INDEX[date.getUTCDay()]!;
}

function weekdayIndex(weekday: Weekday): number {
  return WEEKDAY_BY_UTC_INDEX.indexOf(weekday);
}

/** Inclusive day count from `from` to the next occurrence of `to` (1-7). */
export function daysUntilNextWeekdayInclusive(from: Weekday, to: Weekday): number {
  return ((weekdayIndex(to) - weekdayIndex(from) + 7) % 7) + 1;
}

/** Whole days between two dates, floored (matches Dart's `Duration.inDays`). */
export function daysBetween(from: Date, to: Date): number {
  return Math.floor((to.getTime() - from.getTime()) / MS_PER_DAY);
}

export function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * MS_PER_DAY);
}
