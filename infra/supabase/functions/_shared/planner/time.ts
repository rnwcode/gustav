/** Shared day-math helpers — every planner step reasons in whole days. */

export const MS_PER_DAY = 24 * 60 * 60 * 1000;

/** Whole days between two dates, floored (matches Dart's `Duration.inDays`). */
export function daysBetween(from: Date, to: Date): number {
  return Math.floor((to.getTime() - from.getTime()) / MS_PER_DAY);
}

export function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * MS_PER_DAY);
}
