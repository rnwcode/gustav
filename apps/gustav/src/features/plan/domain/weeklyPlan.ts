// Mirrors `Reason` (`_shared/planner/models/weekly_plan.ts`) and
// `slot.begruendung_*` (`0001_init.sql`). German wire values, matching the
// DB check constraint.
export const REASON_KINDS = [
  'leer',
  'neuer_skill',
  'faellig',
  'prioritaet',
  'bedarfsluecke',
  'erholungsbedarf',
] as const;
export type ReasonKind = (typeof REASON_KINDS)[number];

/** UI-only descriptions of why a day looks the way it does — describing, not
 * instructing (CLAUDE.md, Tonalität). */
export const REASON_LABELS: Record<ReasonKind, string> = {
  leer: 'Bewusst frei',
  neuer_skill: 'Neuer Skill',
  faellig: 'Fällig zur Wiederholung',
  prioritaet: 'Aus dem Check-in',
  bedarfsluecke: 'Bedarfslücke',
  erholungsbedarf: 'Erholung',
};

export type PlanReason = {
  kind: ReasonKind;
  skillId: string | null;
  needDimension: string | null;
};

// Matches `slot.ergebnis`'s check constraint.
export const SLOT_RESULTS = ['klappte', 'so_halb', 'noch_nicht', 'uebersprungen', 'nicht_geschafft'] as const;
export type SlotResult = (typeof SLOT_RESULTS)[number];

export const SLOT_RESULT_LABELS: Record<SlotResult, string> = {
  klappte: 'Klappte',
  so_halb: 'So halb',
  noch_nicht: 'Noch nicht',
  uebersprungen: 'Übersprungen',
  nicht_geschafft: 'Nicht geschafft',
};

/** One day of the plan. `activityId === null` is a deliberately empty day —
 * not missing data (docs/datenmodell.md, „Fünf Entscheidungen"). */
export type PlanSlot = {
  id: string | null; // present once read back from the DB, absent right after generate-plan
  date: string; // ISO yyyy-mm-dd
  activityId: string | null;
  title: string | null;
  sentence: string | null;
  reason: PlanReason;
  result: SlotResult | null;
};

/** One generated period — stored once, never recomputed on open
 * (CLAUDE.md, Regel 10). */
export type WeeklyPlan = {
  id: string;
  periodStart: string;
  periodEnd: string;
  slots: PlanSlot[];
};

export function planSlotFromGeneratePlanResponse(json: any): PlanSlot {
  return {
    id: null,
    date: json.datum,
    activityId: json.aktivitaetId ?? null,
    title: json.titel ?? null,
    sentence: json.satz ?? null,
    reason: {
      kind: json.begruendung.kind,
      skillId: json.begruendung.skillId ?? null,
      needDimension: json.begruendung.needDimension ?? null,
    },
    result: null,
  };
}

export function weeklyPlanFromGeneratePlanResponse(json: any): WeeklyPlan {
  return {
    id: json.wochenplanId,
    periodStart: json.periodeStart,
    periodEnd: json.periodeEnde,
    slots: (json.slots as unknown[]).map(planSlotFromGeneratePlanResponse),
  };
}
