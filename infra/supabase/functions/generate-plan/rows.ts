import type { Activity } from '../_shared/planner/models/activity.ts';
import type { Dog } from '../_shared/planner/models/dog.ts';
import type { BodyType, BreedGroup, Gender, Origin, Restriction, SizeClass } from '../_shared/planner/models/enums.ts';
import type { Household } from '../_shared/planner/models/household.ts';
import type { Skill } from '../_shared/planner/models/skill.ts';
import type { HistoryEntry, SkillState } from '../_shared/planner/models/skill_state.ts';
import type { Slot } from '../_shared/planner/models/weekly_plan.ts';

/**
 * Maps a `dog` row (see `infra/supabase/migrations/0001_init.sql`,
 * `0003_rasse.sql`) onto `Dog`. Column values already match the planner's
 * English vocabulary one-to-one (`origin`, `size_class`, … are the same
 * strings as `Dog`'s fields) — no German ↔ English translation happens
 * here, unlike the German-content path in `_shared/content/german_enums.ts`.
 */
export interface DogRow {
  readonly id: string;
  readonly name: string;
  readonly birth_date: string;
  readonly arrival_date: string;
  readonly origin: string;
  readonly size_class: string;
  readonly body_type: readonly string[];
  readonly restrictions: readonly string[];
  readonly gender: string | null;
  readonly neutered: boolean | null;
}

/** One `dog_breed` row joined with its `breed.breed_group`
 * (`0003_rasse.sql`) — the shape a `select weight, breed:breed_id
 * (breed_group)` query returns per linked breed. */
export interface DogBreedRow {
  readonly breed_group: string;
  readonly weight: number | null;
}

/**
 * Normalizes a dog's linked breeds into weights per `BreedGroup` (sum 1).
 * A missing `weight` counts as 1 before normalizing, so breeds without an
 * explicitly maintained weight split evenly among themselves — no upkeep
 * needed for the common case (`docs/specs/rasse-modellieren.md`).
 */
export function resolveBreedGroups(
  breeds: readonly DogBreedRow[],
): ReadonlyMap<BreedGroup, number> {
  if (breeds.length === 0) {
    throw new Error('a dog needs at least one linked breed');
  }
  const totalWeight = breeds.reduce((sum, b) => sum + (b.weight ?? 1), 0);
  const groups = new Map<BreedGroup, number>();
  for (const breed of breeds) {
    const group = breed.breed_group as BreedGroup;
    const weight = (breed.weight ?? 1) / totalWeight;
    groups.set(group, (groups.get(group) ?? 0) + weight);
  }
  return groups;
}

export function dogFromRow(row: DogRow, breeds: readonly DogBreedRow[]): Dog {
  return {
    id: row.id,
    name: row.name,
    birthDate: new Date(row.birth_date),
    arrivalDate: new Date(row.arrival_date),
    origin: row.origin as Origin,
    breedGroups: resolveBreedGroups(breeds),
    sizeClass: row.size_class as SizeClass,
    bodyType: new Set(row.body_type as BodyType[]),
    restrictions: new Set(row.restrictions as Restriction[]),
    gender: row.gender === null ? null : (row.gender as Gender),
    neutered: row.neutered,
  };
}

/** Maps a `household` row onto `Household`. */
export interface HouseholdRow {
  readonly id: string;
  readonly postal_code: string | null;
  readonly housing_type: string;
  readonly surroundings: string;
  readonly experience: string;
  readonly weekday_time_budget_min: number;
  readonly weekend_time_budget_min: number;
  readonly training_days: readonly string[];
  readonly planning_day: string;
  readonly household_size: number;
  readonly equipment: readonly string[];
}

export function householdFromRow(row: HouseholdRow): Household {
  return {
    id: row.id,
    postalCode: row.postal_code,
    housingType: row.housing_type as Household['housingType'],
    surroundings: row.surroundings as Household['surroundings'],
    experience: row.experience as Household['experience'],
    weekdayTimeBudgetMinutes: row.weekday_time_budget_min,
    weekendTimeBudgetMinutes: row.weekend_time_budget_min,
    trainingDays: new Set(row.training_days as Household['planningDay'][]),
    planningDay: row.planning_day as Household['planningDay'],
    householdSize: row.household_size,
    equipment: [...row.equipment],
  };
}

interface RawHistoryEntry {
  readonly date: string;
  readonly outcome: string;
  readonly levelDuration: number;
  readonly levelDistance: number;
  readonly levelDistraction: number;
}

function historyFromJson(raw: unknown): HistoryEntry[] {
  const entries = (raw ?? []) as readonly RawHistoryEntry[];
  return entries.map((entry) => ({
    date: new Date(entry.date),
    outcome: entry.outcome as HistoryEntry['outcome'],
    levels: {
      duration: entry.levelDuration,
      distance: entry.levelDistance,
      distraction: entry.levelDistraction,
    },
  }));
}

function historyToJson(history: readonly HistoryEntry[]): RawHistoryEntry[] {
  return history.map((entry) => ({
    date: toDateString(entry.date),
    outcome: entry.outcome,
    levelDuration: entry.levels.duration,
    levelDistance: entry.levels.distance,
    levelDistraction: entry.levels.distraction,
  }));
}

/** Maps a `skill_state` row onto `SkillState`. */
export interface SkillStateRow {
  readonly skill_id: string;
  readonly status: string;
  readonly level_duration: number;
  readonly level_distance: number;
  readonly level_distraction: number;
  readonly history: unknown;
  readonly last_practiced_at: string | null;
  readonly due_at: string | null;
  readonly interval_days: number;
}

export function skillStateFromRow(row: SkillStateRow, dogId: string): SkillState {
  return {
    dogId,
    skillId: row.skill_id,
    status: row.status as SkillState['status'],
    levels: {
      duration: row.level_duration,
      distance: row.level_distance,
      distraction: row.level_distraction,
    },
    history: historyFromJson(row.history),
    lastPracticedAt: row.last_practiced_at === null ? null : new Date(row.last_practiced_at),
    dueAt: row.due_at === null ? null : new Date(row.due_at),
    intervalDays: row.interval_days,
  };
}

/** Builds the `skill_state` upsert row for a (possibly just-updated) `SkillState`. */
export function skillStateRowFromState(dogId: string, state: SkillState) {
  return {
    dog_id: dogId,
    skill_id: state.skillId,
    status: state.status,
    level_duration: state.levels.duration,
    level_distance: state.levels.distance,
    level_distraction: state.levels.distraction,
    history: historyToJson(state.history),
    last_practiced_at: state.lastPracticedAt === null ? null : toDateString(state.lastPracticedAt),
    due_at: state.dueAt === null ? null : toDateString(state.dueAt),
    interval_days: state.intervalDays,
  };
}

/** Builds the `slot` insert row for a freshly generated `Slot` — `outcome` is always null at creation. */
export function slotRowFromSlot(weeklyPlanId: string, slot: Slot) {
  return {
    weekly_plan_id: weeklyPlanId,
    date: toDateString(slot.date),
    activity_id: slot.activityId,
    reason_kind: slot.reason.kind,
    reason_skill_id: slot.reason.skillId,
    reason_need_dimension: slot.reason.needDimension,
    outcome: null,
  };
}

/**
 * Builds the `reason` object generate-plan's response sends the app — same
 * vocabulary as `reason_kind`/`reason_need_dimension` above, so a freshly
 * generated plan and one re-read from the DB after a `period_still_active`
 * (`planRepository.fetchStoredPlan`) hand the app the exact same shape
 * (`weeklyPlan.ts`'s `ReasonKind`/`PlanReason`). A thin pass-through now
 * that the DB speaks the same vocabulary as the planner — kept as its own
 * function so the response shape has one definition, not two ad-hoc copies.
 */
export function reasonJsonFromReason(reason: Slot['reason']) {
  return {
    kind: reason.kind,
    skillId: reason.skillId,
    needDimension: reason.needDimension,
  };
}

export function toDateString(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/**
 * Maps an `activity`/`skill` row, joined with its `locale = 'de'` text row
 * (`infra/supabase/migrations/0002_content.sql`), onto `Activity`/`Skill`.
 * Column values already match the planner's English vocabulary (unlike
 * `content/{aktivitaeten,skills}/*.yaml`, still German — those feed only
 * the simulator via `_shared/content/{activity,skill}_yaml.ts`, a separate
 * path this file doesn't touch). Text (`title`/`sentence`/… resp.
 * `name`/`description`) lives in the joined `activity_text`/`skill_text`
 * row — flattened in here since it's the one place that shape matters.
 */
export function activityFromRow(row: unknown): Activity {
  const r = row as Record<string, unknown> & { activity_text: readonly Record<string, unknown>[] };
  const text = r.activity_text[0];
  const needs = r.needs as Activity['needs'];
  const suitability = new Map<BreedGroup, number>();
  for (const [key, value] of Object.entries(r.suitability as Record<string, number>)) {
    suitability.set(key as BreedGroup, value);
  }
  return {
    id: r.id as string,
    title: text.title as string,
    sentence: (text.sentence as string).trim(),
    type: r.type as Activity['type'],
    trainsSkill: (r.trains_skill as string | null) ?? null,
    needs,
    arousal: r.arousal as number,
    durationMin: r.duration_min as number,
    durationMax: r.duration_max as number,
    location: r.location as Activity['location'],
    forDistraction: (r.for_distraction as [number, number] | null) ?? null,
    isRefresher: r.is_refresher as boolean,
    heatSuitable: r.heat_suitable as boolean,
    rainSuitable: r.rain_suitable as boolean,
    darknessSuitable: r.darkness_suitable as boolean,
    jointStraining: r.joint_straining as boolean,
    seasonalWindow: (r.seasonal_window as number[] | null) ?? null,
    equipment: r.equipment as string[],
    secondPerson: r.second_person as boolean,
    minAgeWeeks: r.min_age_weeks as number,
    maxAgeWeeks: (r.max_age_weeks as number | null) ?? null,
    suitability,
    varianceGroup: r.variance_group as string,
    cooldownDays: r.cooldown_days as number,
    illustration: (r.illustration as string | null) ?? null,
    instructions: text.instructions as string[],
    successCriterion: (text.success_criterion as string).trim(),
    commonMistakes: text.common_mistakes as string[],
    troubleshooting: (text.troubleshooting as { problem: string; answer: string }[]).map((entry) => ({
      problem: entry.problem.trim(),
      answer: entry.answer.trim(),
    })),
  };
}

export function skillFromRow(row: unknown): Skill {
  const r = row as Record<string, unknown> & { skill_text: readonly Record<string, unknown>[] };
  const text = r.skill_text[0];
  const targetLevels = r.target_levels as Skill['targetLevels'];
  return {
    id: r.id as string,
    name: text.name as string,
    category: r.category as Skill['category'],
    prerequisites: (r.prerequisites as string[] | null) ?? [],
    minAgeWeeks: r.min_age_weeks as number,
    isCoreSkill: r.is_core_skill as boolean,
    targetLevels,
    description: (text.description as string).trim(),
  };
}
