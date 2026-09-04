import type { Restriction } from '../models/enums.ts';

/**
 * The slice of `content/planer.yaml` hard filtering needs (section
 * `belastungsregeln`, plus a restriction-arousal rule not yet named in
 * the content schema — see `docs/specs/hart-filtern.md`, „Offene
 * Fragen"). Passed in, not imported (CLAUDE.md, rule 10).
 */
export interface ActivityFilterConfig {
  /** `eingewoehnung_wochen`. */
  readonly settlingInWeeks: number;

  /** `eingewoehnung_max_belastung`. */
  readonly settlingInMaxArousal: number;

  /** `eingewoehnung_max_ablenkung`. */
  readonly settlingInMaxDistraction: number;

  /**
   * A restriction excludes activities whose `arousal` is at or above this
   * ceiling — e.g. `protectiveCare`/`recovery` at 2
   * (`docs/datenmodell.md`: „Schonung schließt Belastung ≥ 2 aus").
   */
  readonly restrictionArousalCeiling: ReadonlyMap<Restriction, number>;
}
