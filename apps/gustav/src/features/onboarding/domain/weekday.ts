// Day of the week — used for `trainingDays`/`planningDay`. The wire value
// (`infra/supabase/migrations/0001_init.sql`) is the full English word,
// matching the planner's `Weekday` domain type
// (`_shared/planner/models/enums.ts`) directly — no translation at the
// boundary.
export const WEEKDAY_ORDER = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const;
export type Weekday = (typeof WEEKDAY_ORDER)[number];

const LABEL_BY_WEEKDAY: Record<Weekday, string> = {
  monday: 'Mo',
  tuesday: 'Di',
  wednesday: 'Mi',
  thursday: 'Do',
  friday: 'Fr',
  saturday: 'Sa',
  sunday: 'So',
};

const FULL_LABEL_BY_WEEKDAY: Record<Weekday, string> = {
  monday: 'Montag',
  tuesday: 'Dienstag',
  wednesday: 'Mittwoch',
  thursday: 'Donnerstag',
  friday: 'Freitag',
  saturday: 'Samstag',
  sunday: 'Sonntag',
};

export function weekdayShortLabel(day: Weekday): string {
  return LABEL_BY_WEEKDAY[day];
}

export function weekdayFullLabel(day: Weekday): string {
  return FULL_LABEL_BY_WEEKDAY[day];
}
