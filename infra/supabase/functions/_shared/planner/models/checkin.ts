import type {
  IntentChip,
  Location,
  Outcome,
  ReviewChip,
  Weekday,
  WeeklyContextSource,
} from './enums.ts';

/** How one past slot turned out, gathered on the planning day. */
export interface ReviewEntry {
  readonly slotId: string;
  readonly outcome: Outcome;
}

/**
 * What the owner reports on the planning day: how the period went and what
 * matters to them next. „Not sure" must be a valid answer and still lead to
 * a good period (`docs/produkt.md`).
 */
export interface WeeklyCheckin {
  readonly review: readonly ReviewEntry[];
  readonly freeTextReview: string | null;
  readonly intentChips: ReadonlySet<IntentChip>;
  readonly freeTextIntent: string | null;
  readonly availableDays: ReadonlySet<Weekday>;

  /** Optional, shown on the planning-day screen — never asked daily. */
  readonly reviewChips: ReadonlySet<ReviewChip>;
}

/** One weight for a skill or topic, 0–3. */
export interface Priority {
  readonly skillIdOrTopic: string;
  readonly weight: number;
}

export interface Constraints {
  readonly days: ReadonlySet<Weekday>;
  readonly minutesPerDay: number | null;
  readonly locations: readonly Location[];
}

/**
 * The result of translating `WeeklyCheckin` into something the planner can
 * use directly. In the MVP this translation is template-based; later an
 * LLM translates free text into the same shape (`docs/datenmodell.md`,
 * backlog V1.2) — the planner itself never sees free text.
 */
export interface WeeklyContext {
  readonly priorities: readonly Priority[];
  readonly constraints: Constraints;

  /**
   * Open-ended on purpose (`docs/datenmodell.md` lists `radfahrer | hitze |
   * schonung | ueberdreht | …`) — flags are produced by the translator, not
   * enumerated up front here.
   */
  readonly flags: ReadonlySet<string>;

  /**
   * Decides whether the app is allowed to say „you told us" (see
   * `docs/produkt.md`, section Tonalität).
   */
  readonly source: WeeklyContextSource;
}
