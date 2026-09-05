import type { LifeStage } from '../models/enums.ts';

/**
 * The slice of `content/planer.yaml` the period-building step needs
 * (sections `perioden` and `phasen`). Passed in, not imported (CLAUDE.md,
 * rule 10).
 */
export interface PeriodConfig {
  /** `perioden.laenge_tage` — every steady-state period's length. */
  readonly regularLengthDays: number;

  /**
   * `perioden.erste_periode_min_tage`. Below this, the (irregular) first
   * period is pushed out by `regularLengthDays` instead of ending on the
   * very next `planningDay` — see `docs/specs/slots-festlegen.md`.
   */
  readonly firstPeriodMinDays: number;

  /** `perioden.leere_slots_min`. */
  readonly minEmptySlots: number;

  /** `perioden.leere_slots_bei_erholungsbedarf_hoch`. */
  readonly minEmptySlotsAtHighRecoveryNeed: number;

  /** `phasen[lifeStage].aktive_slots`. */
  readonly maxActiveSlotsByLifeStage: ReadonlyMap<LifeStage, number>;

  /** `phasen[lifeStage].training`. */
  readonly maxTrainingSlotsByLifeStage: ReadonlyMap<LifeStage, number>;
}
