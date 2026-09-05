/**
 * The slice of `content/planer.yaml` day-by-day assignment needs
 * (sections `phasen` and `belastungsregeln`). Passed in, not imported
 * (CLAUDE.md, rule 10).
 */
export interface AssignmentConfig {
  /** `phasen[lifeStage].aktive_slots`. */
  readonly maxActiveSlots: number;

  /** `phasen[lifeStage].training`. */
  readonly maxTrainingSlots: number;

  /**
   * 1 normally, 2 at `RecoveryNeed.high` — resolved by the caller, since
   * this function does not know about recovery need.
   */
  readonly minEmptySlots: number;

  /**
   * `belastungsregeln.nach_belastung_ab`. Serves two rules that share the
   * same „that was demanding" threshold: only rest/enrichment the day
   * after, and no placement on the period's shortest day.
   */
  readonly heavyArousalThreshold: number;

  /** `belastungsregeln.nie_zwei_tage_in_folge_belastung`. */
  readonly maxArousalThreshold: number;
}
