/**
 * How a synthetic owner behaves week over week — drives which `Outcome`
 * an assigned slot gets and whether a check-in even happens. Not part of
 * the planner itself (`plan()` never sees a profile); purely a knob for
 * the simulator to explore how the planner reacts to different owners.
 */
export interface SimulationProfile {
  readonly name: string;

  /** Probability a real check-in happens this period (else a fallback, empty `WeeklyContext`). */
  readonly checkInRate: (periodIndex: number) => number;

  /** Probability an assigned slot is actually attempted at all. */
  readonly completionRate: (periodIndex: number) => number;

  /** Of an unattempted slot, the share that is `notCompleted` rather than `skipped`. */
  readonly notCompletedShare: number;

  /** Of an attempted training slot, the probability the outcome is `succeeded`. */
  readonly successRate: (periodIndex: number) => number;

  /** Of an attempted-but-not-succeeded training slot, the share that is `partial` rather than `notYet`. */
  readonly partialShare: number;
}

const constant = (value: number) => () => value;

/** Checks in every period, mostly succeeds, rarely skips anything. */
export const DILIGENT_PROFILE: SimulationProfile = {
  name: 'fleissig',
  checkInRate: constant(1.0),
  completionRate: constant(0.9),
  notCompletedShare: 0.3,
  successRate: constant(0.75),
  partialShare: 0.6,
};

/** Checks in about half the time, mixed completion and success. */
export const IRREGULAR_PROFILE: SimulationProfile = {
  name: 'unregelmaessig',
  checkInRate: constant(0.5),
  completionRate: constant(0.55),
  notCompletedShare: 0.5,
  successRate: constant(0.5),
  partialShare: 0.5,
};

/**
 * Starts like `DILIGENT_PROFILE` and disengages over time — completion and
 * success rates decay linearly toward a floor. Exercises whether the
 * planner backs off rather than pressuring a disengaging owner (CLAUDE.md,
 * section Tonalität: „kein Streak-Druck, keine Ermahnung nach einer Pause").
 */
export const GIVING_UP_PROFILE: SimulationProfile = {
  name: 'gibt_auf',
  checkInRate: (periodIndex) => Math.max(0.15, 0.9 - periodIndex * 0.08),
  completionRate: (periodIndex) => Math.max(0.1, 0.85 - periodIndex * 0.08),
  notCompletedShare: 0.6,
  successRate: (periodIndex) => Math.max(0.15, 0.7 - periodIndex * 0.06),
  partialShare: 0.4,
};

export const PROFILES: Readonly<Record<string, SimulationProfile>> = {
  fleissig: DILIGENT_PROFILE,
  unregelmaessig: IRREGULAR_PROFILE,
  gibt_auf: GIVING_UP_PROFILE,
};
