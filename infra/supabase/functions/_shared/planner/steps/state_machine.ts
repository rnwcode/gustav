import type { Dimension, Outcome } from '../models/enums.ts';
import { levelFor, levelsEqual, withLevel } from '../models/levels.ts';
import type { Levels } from '../models/levels.ts';
import type { HistoryEntry, SkillState } from '../models/skill_state.ts';
import type { StateMachineConfig } from './state_machine_config.ts';
import { addDays } from '../time.ts';

/**
 * Skill state machine and spaced repetition.
 *
 * Spec: `docs/specs/skill-zustandsautomat.md`. Pure functions — `date`
 * comes in as a parameter, never from the system clock (CLAUDE.md, rule 2).
 */

const MAX_HISTORY_LENGTH = 10;
const ALL_DIMENSIONS: readonly Dimension[] = ['duration', 'distance', 'distraction'];

/**
 * The dimension currently being worked on: the first in `order` whose
 * level has not yet reached the target. If all three have reached target,
 * the last dimension in the order counts as active.
 */
export function activeDimension(
  levels: Levels,
  targetLevels: Levels,
  order: readonly Dimension[],
): Dimension {
  for (const d of order) {
    if (levelFor(levels, d) < levelFor(targetLevels, d)) return d;
  }
  const last = order[order.length - 1];
  if (!last) throw new Error('activeDimension requires a non-empty order');
  return last;
}

/**
 * Processes one assessment (`succeeded`, `partial` or `notYet`) and
 * returns the new `SkillState`.
 */
export function apply(args: {
  state: SkillState;
  targetLevels: Levels;
  outcome: Outcome;
  date: Date;
  config: StateMachineConfig;
}): SkillState {
  const { state, targetLevels, outcome, date, config } = args;
  if (outcome !== 'succeeded' && outcome !== 'partial' && outcome !== 'notYet') {
    throw new Error(`apply expects succeeded, partial or notYet, was ${outcome}`);
  }

  const fullHistory: HistoryEntry[] = [
    ...state.history,
    { date, outcome, levels: state.levels },
  ];

  const active = activeDimension(state.levels, targetLevels, config.order);

  let newLevels = state.levels;
  let newStatus = state.status;

  if (outcome === 'succeeded') {
    const successesInARow = countInARow(fullHistory, state.levels, 'succeeded');
    if (successesInARow >= config.increaseAfterSuccesses) {
      newLevels = withIncreasedDimension(state.levels, targetLevels, active);
    }
  } else if (outcome === 'notYet') {
    const failuresInARow = countInARow(fullHistory, state.levels, 'notYet');
    if (failuresInARow >= config.decreaseAfterFailures) {
      const newValue = flooredAtZero(levelFor(state.levels, active) - 1);
      newLevels = withLevel(state.levels, active, newValue);
      if (newValue === 0) newStatus = 'building';
    }
  }

  if (newStatus === 'building' && newLevels.distraction >= config.generalizeAtDistraction) {
    newStatus = 'generalizing';
  }
  if (levelsEqual(newLevels, targetLevels)) {
    newStatus = 'consolidated';
  }

  const intervalConfig = config.intervals.get(newStatus);
  if (!intervalConfig) {
    throw new Error(`state machine config has no interval entry for status ${newStatus}`);
  }
  const newInterval = outcome === 'succeeded'
    ? capped(Math.round(state.intervalDays * config.successFactor), intervalConfig.cap)
    : outcome === 'notYet'
    ? intervalConfig.start
    : state.intervalDays;

  const trimmedHistory = fullHistory.length > MAX_HISTORY_LENGTH
    ? fullHistory.slice(fullHistory.length - MAX_HISTORY_LENGTH)
    : fullHistory;

  return {
    ...state,
    status: newStatus,
    levels: newLevels,
    history: trimmedHistory,
    lastPracticedAt: date,
    dueAt: addDays(date, newInterval),
    intervalDays: newInterval,
  };
}

/**
 * A problem reported in the weekly check-in: throws `maintenance` back to
 * `generalizing` and lowers the active dimension by one level.
 */
export function reportProblem(args: {
  state: SkillState;
  targetLevels: Levels;
  config: StateMachineConfig;
}): SkillState {
  const { state, targetLevels, config } = args;
  if (state.status !== 'maintenance') {
    throw new Error(`reportProblem only applies to skills in maintenance, was ${state.status}`);
  }

  const active = activeDimension(state.levels, targetLevels, config.order);
  const newLevels = withLevel(
    state.levels,
    active,
    flooredAtZero(levelFor(state.levels, active) - 1),
  );
  const intervalConfig = config.intervals.get('generalizing');
  if (!intervalConfig) {
    throw new Error('state machine config has no interval entry for status generalizing');
  }

  return {
    ...state,
    status: 'generalizing',
    levels: newLevels,
    intervalDays: intervalConfig.start,
  };
}

/**
 * Raises `active` by 1 and lowers every other dimension by 1 (floor 0) —
 * but only if that dimension has not yet reached its target. A dimension
 * already at target is left untouched, otherwise „all target levels
 * reached" could never happen at the same time.
 */
function withIncreasedDimension(levels: Levels, targetLevels: Levels, active: Dimension): Levels {
  let updated = withLevel(levels, active, levelFor(levels, active) + 1);
  for (const d of ALL_DIMENSIONS) {
    if (d === active) continue;
    if (levelFor(levels, d) < levelFor(targetLevels, d)) {
      updated = withLevel(updated, d, flooredAtZero(levelFor(levels, d) - 1));
    }
  }
  return updated;
}

/**
 * Counts how often `target` occurs consecutively at the end of `history`,
 * as long as the entries were assessed at the same `levels`. `partial`
 * does not break the streak.
 */
function countInARow(history: readonly HistoryEntry[], levels: Levels, target: Outcome): number {
  let count = 0;
  for (let i = history.length - 1; i >= 0; i--) {
    const entry = history[i];
    if (!entry || !levelsEqual(entry.levels, levels)) break;
    if (entry.outcome === target) {
      count++;
    } else if (entry.outcome === 'partial') {
      continue;
    } else {
      break;
    }
  }
  return count;
}

function flooredAtZero(value: number): number {
  return value < 0 ? 0 : value;
}

function capped(value: number, cap: number): number {
  return value > cap ? cap : value;
}
