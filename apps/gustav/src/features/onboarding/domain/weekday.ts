// Day of the week — used for `trainingDays`/`planningDay`. The German wire
// value (`content/*.yaml`, `infra/supabase/migrations/0001_init.sql`) is the
// two-letter abbreviation.
export const WEEKDAY_ORDER = ['mo', 'di', 'mi', 'do', 'fr', 'sa', 'so'] as const;
export type Weekday = (typeof WEEKDAY_ORDER)[number];

const LABEL_BY_WEEKDAY: Record<Weekday, string> = {
  mo: 'Mo',
  di: 'Di',
  mi: 'Mi',
  do: 'Do',
  fr: 'Fr',
  sa: 'Sa',
  so: 'So',
};

const FULL_LABEL_BY_WEEKDAY: Record<Weekday, string> = {
  mo: 'Montag',
  di: 'Dienstag',
  mi: 'Mittwoch',
  do: 'Donnerstag',
  fr: 'Freitag',
  sa: 'Samstag',
  so: 'Sonntag',
};

export function weekdayShortLabel(day: Weekday): string {
  return LABEL_BY_WEEKDAY[day];
}

export function weekdayFullLabel(day: Weekday): string {
  return FULL_LABEL_BY_WEEKDAY[day];
}
