// Wire values match `hund.*` (`infra/supabase/migrations/0001_init.sql`) and
// `content/schema/*.yaml`. Keep option lists and their German values here,
// nowhere else — a screen never hardcodes a German string.

export const ORIGIN_OPTIONS = [
  { value: 'zuechter', label: 'Züchter' },
  { value: 'tierschutz', label: 'Tierschutz' },
  { value: 'privat', label: 'Privat' },
  { value: 'unbekannt', label: 'Weiß ich nicht' },
] as const;
export type Origin = (typeof ORIGIN_OPTIONS)[number]['value'];

export const BREED_GROUP_OPTIONS = [
  { value: 'huete', label: 'Hüte' },
  { value: 'jagd', label: 'Jagd' },
  { value: 'begleit', label: 'Begleit' },
  { value: 'herdenschutz', label: 'Herdenschutz' },
  { value: 'terrier', label: 'Terrier' },
  { value: 'wind', label: 'Wind' },
  { value: 'nordisch', label: 'Nordisch' },
  { value: 'molosser', label: 'Molosser' },
  { value: 'misch', label: 'Mischling' },
] as const;
export type BreedGroup = (typeof BREED_GROUP_OPTIONS)[number]['value'];

export const SIZE_CLASS_OPTIONS = [
  { value: 'klein', label: 'Klein' },
  { value: 'mittel', label: 'Mittel' },
  { value: 'gross', label: 'Groß' },
] as const;
export type SizeClass = (typeof SIZE_CLASS_OPTIONS)[number]['value'];

export const BODY_TYPE_OPTIONS = [
  { value: 'brachyzephal', label: 'Kurze Nase' },
  { value: 'dichte_unterwolle', label: 'Dichte Unterwolle' },
  { value: 'langbeinig', label: 'Langbeinig' },
] as const;
export type BodyType = (typeof BODY_TYPE_OPTIONS)[number]['value'];

export const RESTRICTION_OPTIONS = [
  { value: 'schonung', label: 'Schonung' },
  { value: 'gelenke', label: 'Gelenke' },
  { value: 'senior', label: 'Senior' },
  { value: 'rekonvaleszenz', label: 'Rekonvaleszenz' },
] as const;
export type Restriction = (typeof RESTRICTION_OPTIONS)[number]['value'];

/** Mirrors the `hund` table — no `lifeStage`/`heatSensitivity`: those are
 * derived server-side from `birthDate`/`today`, never stored, and the app
 * has no time logic of its own (CLAUDE.md, Regel 2). */
export type Dog = {
  name: string;
  birthDate: string; // ISO yyyy-mm-dd
  arrivalDate: string; // ISO yyyy-mm-dd
  origin: Origin;
  breedGroup: BreedGroup;
  sizeClass: SizeClass;
  bodyType: readonly BodyType[];
  restrictions: readonly Restriction[];
};
