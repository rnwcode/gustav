// Mirrors `Reason` (`_shared/planner/models/weekly_plan.ts`) and
// `slot.reason_*` (`0001_init.sql`) — same English vocabulary throughout,
// DB included.
export const REASON_KINDS = [
  'empty',
  'newSkill',
  'dueRefresher',
  'priority',
  'needGap',
  'recoveryNeed',
] as const;
export type ReasonKind = (typeof REASON_KINDS)[number];

/** UI-only descriptions of why a day looks the way it does — describing, not
 * instructing (CLAUDE.md, Tonalität). */
export const REASON_LABELS: Record<ReasonKind, string> = {
  empty: 'Bewusst frei',
  newSkill: 'Neuer Skill',
  dueRefresher: 'Fällig zur Wiederholung',
  priority: 'Aus dem Check-in',
  needGap: 'Bedarfslücke',
  recoveryNeed: 'Erholung',
};

export type PlanReason = {
  kind: ReasonKind;
  skillId: string | null;
  needDimension: string | null;
};

// Matches `slot.outcome`'s check constraint.
export const SLOT_RESULTS = ['succeeded', 'partial', 'notYet', 'skipped', 'notCompleted'] as const;
export type SlotResult = (typeof SLOT_RESULTS)[number];

export const SLOT_RESULT_LABELS: Record<SlotResult, string> = {
  succeeded: 'Klappte',
  partial: 'So halb',
  notYet: 'Noch nicht',
  skipped: 'Übersprungen',
  notCompleted: 'Nicht geschafft',
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
    date: json.date,
    activityId: json.activityId ?? null,
    title: json.title ?? null,
    sentence: json.sentence ?? null,
    reason: {
      kind: json.reason.kind,
      skillId: json.reason.skillId ?? null,
      needDimension: json.reason.needDimension ?? null,
    },
    result: null,
  };
}

export function weeklyPlanFromGeneratePlanResponse(json: any): WeeklyPlan {
  return {
    id: json.weeklyPlanId,
    periodStart: json.periodStart,
    periodEnd: json.periodEnd,
    slots: (json.slots as unknown[]).map(planSlotFromGeneratePlanResponse),
  };
}
