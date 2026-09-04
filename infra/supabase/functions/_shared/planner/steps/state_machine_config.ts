import type { Dimension, SkillStatus } from '../models/enums.ts';

/**
 * Start value and cap for the spaced-repetition interval of one skill
 * status. In days.
 */
export interface IntervalConfig {
  readonly start: number;
  readonly cap: number;
}

/**
 * The slice of `content/planer.yaml` the state machine needs (sections
 * `spaced_repetition` and `stufen`). Passed in, not imported (CLAUDE.md,
 * rule 1/10) — loading the YAML file belongs elsewhere, not in
 * `_shared/planner/`.
 */
export interface StateMachineConfig {
  /** 3× „succeeded" at the current level raises one dimension. */
  readonly increaseAfterSuccesses: number;

  /** 2× „not yet" in a row lowers the active dimension. */
  readonly decreaseAfterFailures: number;

  /** Order in which dimensions are raised: duration → distance → distraction. */
  readonly order: readonly Dimension[];

  readonly generalizeAtDistraction: number;

  /** Multiplier applied to the interval on „succeeded". */
  readonly successFactor: number;

  /**
   * Only for the statuses that have their own row in `content/planer.yaml`:
   * building, generalizing, consolidated, maintenance.
   */
  readonly intervals: ReadonlyMap<SkillStatus, IntervalConfig>;
}
