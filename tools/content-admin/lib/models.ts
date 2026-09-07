/**
 * Mirrors `infra/supabase/migrations/0002_content.sql` — the same column
 * names and enum-value spellings as the DB and as
 * `infra/supabase/functions/_shared/planner/models/enums.ts`. This tool is
 * a third runtime (Next.js/Node, not Deno) so it can't import those files
 * directly (same reason the Expo app defines its own mirror types instead
 * of importing across runtimes, CLAUDE.md, section Sprache) — but the
 * vocabulary stays identical on purpose, so a value typed here always means
 * the same thing everywhere else in the repo.
 */

export const SKILL_CATEGORIES = [
  'basicCue',
  'leashWork',
  'impulseControl',
  'dailyRoutine',
  'socialBehavior',
  'cooperation',
] as const;
export type SkillCategory = (typeof SKILL_CATEGORIES)[number];

export const ACTIVITY_TYPES = ['training', 'enrichment', 'everyday', 'rest', 'care'] as const;
export type ActivityType = (typeof ACTIVITY_TYPES)[number];

export const LOCATIONS = ['indoors', 'outdoors', 'onTheGo', 'any'] as const;
export type Location = (typeof LOCATIONS)[number];

export const BREED_GROUPS = [
  'herding',
  'hunting',
  'companion',
  'livestockGuardian',
  'terrier',
  'sighthound',
  'nordic',
  'molosser',
  'mixed',
] as const;
export type BreedGroup = (typeof BREED_GROUPS)[number];

export interface TargetLevels {
  readonly duration: number;
  readonly distance: number;
  readonly distraction: number;
}

export interface Needs {
  readonly physical: number;
  readonly mentalWork: number;
  readonly scent: number;
  readonly social: number;
  readonly recovery: number;
}

export interface TroubleshootingEntry {
  readonly problem: string;
  readonly answer: string;
}

/** `skill` row — content, identical for every user (CLAUDE.md rule 5). */
export interface Skill {
  readonly id: string;
  readonly category: SkillCategory;
  readonly prerequisites: readonly string[];
  readonly min_age_weeks: number;
  readonly is_core_skill: boolean;
  readonly target_levels: TargetLevels;
  readonly created_at: string;
}

/** `skill_text` row — one per `(skill_id, locale)`. */
export interface SkillText {
  readonly skill_id: string;
  readonly locale: string;
  readonly name: string;
  readonly description: string;
}

/** `activity` row. */
export interface Activity {
  readonly id: string;
  readonly type: ActivityType;
  readonly trains_skill: string | null;
  readonly needs: Needs;
  readonly arousal: number;
  readonly duration_min: number;
  readonly duration_max: number;
  readonly location: Location;
  readonly for_distraction: readonly [number, number] | null;
  readonly is_refresher: boolean;
  readonly heat_suitable: boolean;
  readonly rain_suitable: boolean;
  readonly darkness_suitable: boolean;
  readonly joint_straining: boolean;
  readonly seasonal_window: readonly number[] | null;
  readonly equipment: readonly string[];
  readonly second_person: boolean;
  readonly min_age_weeks: number;
  readonly max_age_weeks: number | null;
  /** breedGroup -> weight, -1..+2 (`docs/datenmodell.md`). */
  readonly suitability: Readonly<Partial<Record<BreedGroup, number>>>;
  readonly variance_group: string;
  readonly cooldown_days: number;
  readonly illustration: string | null;
  readonly created_at: string;
}

/** `activity_text` row — one per `(activity_id, locale)`. */
export interface ActivityText {
  readonly activity_id: string;
  readonly locale: string;
  readonly title: string;
  readonly sentence: string;
  readonly instructions: readonly string[];
  readonly success_criterion: string;
  readonly common_mistakes: readonly string[];
  readonly troubleshooting: readonly TroubleshootingEntry[];
}
