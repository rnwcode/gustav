import type { Activity } from '../_shared/planner/models/activity.ts';
import type { Dog } from '../_shared/planner/models/dog.ts';
import type { Household } from '../_shared/planner/models/household.ts';
import type { Skill } from '../_shared/planner/models/skill.ts';
import type { HistoryEntry, SkillState } from '../_shared/planner/models/skill_state.ts';
import type { Slot } from '../_shared/planner/models/weekly_plan.ts';
import { parseActivityYaml } from '../_shared/content/activity_yaml.ts';
import { parseSkillYaml } from '../_shared/content/skill_yaml.ts';
import {
  bodyTypeFromGerman,
  breedGroupFromGerman,
  experienceFromGerman,
  germanForNeedDimension,
  germanForOutcome,
  germanForReasonKind,
  germanForSkillStatus,
  housingTypeFromGerman,
  originFromGerman,
  outcomeFromGerman,
  restrictionFromGerman,
  sizeClassFromGerman,
  skillStatusFromGerman,
  surroundingsFromGerman,
  weekdayFromGerman,
} from '../_shared/content/german_enums.ts';

/** Maps a `hund` row (see `infra/supabase/migrations/0001_init.sql`) onto `Dog`. */
export interface HundRow {
  readonly id: string;
  readonly name: string;
  readonly geburtsdatum: string;
  readonly einzugsdatum: string;
  readonly herkunft: string;
  readonly rassegruppe: string;
  readonly groessenklasse: string;
  readonly koerperbau: readonly string[];
  readonly einschraenkungen: readonly string[];
}

export function dogFromRow(row: HundRow): Dog {
  return {
    id: row.id,
    name: row.name,
    birthDate: new Date(row.geburtsdatum),
    arrivalDate: new Date(row.einzugsdatum),
    origin: originFromGerman(row.herkunft),
    breedGroup: breedGroupFromGerman(row.rassegruppe),
    sizeClass: sizeClassFromGerman(row.groessenklasse),
    bodyType: new Set(row.koerperbau.map(bodyTypeFromGerman)),
    restrictions: new Set(row.einschraenkungen.map(restrictionFromGerman)),
  };
}

/** Maps a `haushalt` row onto `Household`. */
export interface HaushaltRow {
  readonly id: string;
  readonly plz: string | null;
  readonly wohnsituation: string;
  readonly umgebung: string;
  readonly erfahrung: string;
  readonly zeitbudget_werktag_min: number;
  readonly zeitbudget_wochenende_min: number;
  readonly trainingstage: readonly string[];
  readonly planungstag: string;
  readonly personen: number;
  readonly equipment: readonly string[];
}

export function householdFromRow(row: HaushaltRow): Household {
  return {
    id: row.id,
    postalCode: row.plz,
    housingType: housingTypeFromGerman(row.wohnsituation),
    surroundings: surroundingsFromGerman(row.umgebung),
    experience: experienceFromGerman(row.erfahrung),
    weekdayTimeBudgetMinutes: row.zeitbudget_werktag_min,
    weekendTimeBudgetMinutes: row.zeitbudget_wochenende_min,
    trainingDays: new Set(row.trainingstage.map(weekdayFromGerman)),
    planningDay: weekdayFromGerman(row.planungstag),
    householdSize: row.personen,
    equipment: [...row.equipment],
  };
}

interface RawHistoryEntry {
  readonly datum: string;
  readonly ergebnis: string;
  readonly stufe_dauer: number;
  readonly stufe_distanz: number;
  readonly stufe_ablenkung: number;
}

function historyFromJson(raw: unknown): HistoryEntry[] {
  const entries = (raw ?? []) as readonly RawHistoryEntry[];
  return entries.map((entry) => ({
    date: new Date(entry.datum),
    outcome: outcomeFromGerman(entry.ergebnis),
    levels: {
      duration: entry.stufe_dauer,
      distance: entry.stufe_distanz,
      distraction: entry.stufe_ablenkung,
    },
  }));
}

function historyToJson(history: readonly HistoryEntry[]): RawHistoryEntry[] {
  return history.map((entry) => ({
    datum: toDateString(entry.date),
    ergebnis: germanForOutcome(entry.outcome),
    stufe_dauer: entry.levels.duration,
    stufe_distanz: entry.levels.distance,
    stufe_ablenkung: entry.levels.distraction,
  }));
}

/** Maps a `skill_stand` row onto `SkillState`. */
export interface SkillStandRow {
  readonly skill_id: string;
  readonly status: string;
  readonly stufe_dauer: number;
  readonly stufe_distanz: number;
  readonly stufe_ablenkung: number;
  readonly historie: unknown;
  readonly letzte_uebung_am: string | null;
  readonly faellig_am: string | null;
  readonly intervall_tage: number;
}

export function skillStateFromRow(row: SkillStandRow, dogId: string): SkillState {
  return {
    dogId,
    skillId: row.skill_id,
    status: skillStatusFromGerman(row.status),
    levels: {
      duration: row.stufe_dauer,
      distance: row.stufe_distanz,
      distraction: row.stufe_ablenkung,
    },
    history: historyFromJson(row.historie),
    lastPracticedAt: row.letzte_uebung_am === null ? null : new Date(row.letzte_uebung_am),
    dueAt: row.faellig_am === null ? null : new Date(row.faellig_am),
    intervalDays: row.intervall_tage,
  };
}

/** Builds the `skill_stand` upsert row for a (possibly just-updated) `SkillState`. */
export function skillStandRowFromState(hundId: string, state: SkillState) {
  return {
    hund_id: hundId,
    skill_id: state.skillId,
    status: germanForSkillStatus(state.status),
    stufe_dauer: state.levels.duration,
    stufe_distanz: state.levels.distance,
    stufe_ablenkung: state.levels.distraction,
    historie: historyToJson(state.history),
    letzte_uebung_am: state.lastPracticedAt === null ? null : toDateString(state.lastPracticedAt),
    faellig_am: state.dueAt === null ? null : toDateString(state.dueAt),
    intervall_tage: state.intervalDays,
  };
}

/** Builds the `slot` insert row for a freshly generated `Slot` — `ergebnis` is always null at creation. */
export function slotRowFromSlot(wochenplanId: string, slot: Slot) {
  return {
    wochenplan_id: wochenplanId,
    datum: toDateString(slot.date),
    aktivitaet_id: slot.activityId,
    begruendung_art: germanForReasonKind(slot.reason.kind),
    begruendung_skill_id: slot.reason.skillId,
    begruendung_bedarfsdimension: slot.reason.needDimension === null
      ? null
      : germanForNeedDimension(slot.reason.needDimension),
    ergebnis: null,
  };
}

export function toDateString(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/**
 * Maps an `aktivitaet`/`skill` row (`infra/supabase/migrations/0002_content.sql`)
 * onto `Activity`/`Skill`. The tables mirror `content/schema/{aktivitaet,skill}.yaml`
 * field for field — the same shape a YAML-parsed content document has — so
 * a row read back from Postgres runs through the very same translator the
 * content loader uses, no separate DB-only mapping logic needed.
 */
export function activityFromRow(row: unknown): Activity {
  return parseActivityYaml(row);
}

export function skillFromRow(row: unknown): Skill {
  return parseSkillYaml(row);
}
