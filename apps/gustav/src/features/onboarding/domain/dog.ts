// Wire values match `dog.*` (`infra/supabase/migrations/0001_init.sql`) and
// the planner's English vocabulary (`_shared/planner/models/enums.ts`) —
// same string on both sides, no translation at the boundary. Keep option
// lists and their values here, nowhere else — a screen never hardcodes one
// of these strings. Only the `label`s are German — user-visible text, not
// code (CLAUDE.md, section Sprache).

export const ORIGIN_OPTIONS = [
  { value: 'breeder', label: 'Züchter' },
  { value: 'shelter', label: 'Tierschutz' },
  { value: 'private', label: 'Privat' },
  { value: 'unknown', label: 'Weiß ich nicht' },
] as const;
export type Origin = (typeof ORIGIN_OPTIONS)[number]['value'];

export const BREED_GROUP_OPTIONS = [
  { value: 'herding', label: 'Hüte' },
  { value: 'hunting', label: 'Jagd' },
  { value: 'companion', label: 'Begleit' },
  { value: 'livestockGuardian', label: 'Herdenschutz' },
  { value: 'terrier', label: 'Terrier' },
  { value: 'sighthound', label: 'Wind' },
  { value: 'nordic', label: 'Nordisch' },
  { value: 'molosser', label: 'Molosser' },
  { value: 'mixed', label: 'Mischling' },
] as const;
export type BreedGroup = (typeof BREED_GROUP_OPTIONS)[number]['value'];

/**
 * Onboarding still only asks for a group, not a specific breed (no
 * breed-search UI exists yet) — this maps that choice onto one of the nine
 * generic placeholder rows in `breed` seeded by `0003_rasse.sql`
 * (`docs/specs/rasse-modellieren.md`). `createDog` links the new dog to
 * this row via `dog_breed` instead of writing a `breed_group` column,
 * which no longer exists on `dog`.
 */
export const BREED_ID_BY_BREED_GROUP: Record<BreedGroup, string> = {
  herding: 'group_herding',
  hunting: 'group_hunting',
  companion: 'group_companion',
  livestockGuardian: 'group_livestock_guardian',
  terrier: 'group_terrier',
  sighthound: 'group_sighthound',
  nordic: 'group_nordic',
  molosser: 'group_molosser',
  mixed: 'group_mixed',
};

export const GENDER_OPTIONS = [
  { value: 'male', label: 'Rüde' },
  { value: 'female', label: 'Hündin' },
] as const;
export type Gender = (typeof GENDER_OPTIONS)[number]['value'];

export const SIZE_CLASS_OPTIONS = [
  { value: 'small', label: 'Klein' },
  { value: 'medium', label: 'Mittel' },
  { value: 'large', label: 'Groß' },
] as const;
export type SizeClass = (typeof SIZE_CLASS_OPTIONS)[number]['value'];

export const BODY_TYPE_OPTIONS = [
  { value: 'brachycephalic', label: 'Kurze Nase' },
  { value: 'denseUndercoat', label: 'Dichte Unterwolle' },
  { value: 'longLegged', label: 'Langbeinig' },
] as const;
export type BodyType = (typeof BODY_TYPE_OPTIONS)[number]['value'];

export const RESTRICTION_OPTIONS = [
  { value: 'protectiveCare', label: 'Schonung' },
  { value: 'jointIssues', label: 'Gelenke' },
  { value: 'senior', label: 'Senior' },
  { value: 'recovery', label: 'Rekonvaleszenz' },
] as const;
export type Restriction = (typeof RESTRICTION_OPTIONS)[number]['value'];

/** Mostly mirrors the `dog` table — no `lifeStage`/`heatSensitivity`:
 * those are derived server-side from `birthDate`/`today`, never stored,
 * and the app has no time logic of its own (CLAUDE.md, Regel 2).
 * `breedGroup` is the one exception: it doesn't map onto a `dog` column
 * (that's gone, `0003_rasse.sql`) — `createDog` turns it into a
 * `dog_breed` link instead, see `BREED_ID_BY_BREED_GROUP`. */
export type Dog = {
  name: string;
  birthDate: string; // ISO yyyy-mm-dd
  arrivalDate: string; // ISO yyyy-mm-dd
  origin: Origin;
  breedGroup: BreedGroup;
  sizeClass: SizeClass;
  bodyType: readonly BodyType[];
  restrictions: readonly Restriction[];
  /** `null` = nicht angegeben — ein legitimer Zustand, gerade bei
   * Tierschutzhunden ohne Papiere. */
  gender: Gender | null;
  neutered: boolean | null;
};
