import type { NeedDimension, Outcome, ReasonKind } from './enums.ts';

/**
 * Machine-readable reason a slot was assigned what it was — every output
 * knows its reason, or the explaining sentence (planner step 8) could not
 * be written honestly (`docs/datenmodell.md`, section „Fünf
 * Entscheidungen").
 */
export interface Reason {
  readonly kind: ReasonKind;
  readonly skillId: string | null;
  readonly needDimension: NeedDimension | null;
}

/**
 * One day's slot. Deliberately allowed to be empty — that is a valid
 * outcome, not a gap (`docs/produkt.md`).
 */
export interface Slot {
  readonly date: Date;

  /** `null` for a deliberately empty day. */
  readonly activityId: string | null;

  readonly reason: Reason;
  readonly outcome: Outcome | null;
}

/**
 * A period's plan: generated once, then stored — never recomputed on every
 * open (CLAUDE.md, rule 10). `algorithmVersion` and `configVersion` are
 * stored alongside so a later config change never silently rewrites a
 * period already handed to the owner.
 */
export interface WeeklyPlan {
  readonly dogId: string;
  readonly periodStart: Date;
  readonly periodEnd: Date;
  readonly algorithmVersion: number;
  readonly configVersion: number;
  readonly slots: readonly Slot[];
}
