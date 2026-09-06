import type { ScoredActivity } from './scoring.ts';
import type { AssignmentConfig } from './assignment_config.ts';

/**
 * One day of the period, with everything the caller already resolved
 * from `Household` and the calendar date.
 */
export interface PeriodDay {
  readonly date: Date;
  readonly isTrainingDay: boolean;
  readonly timeBudgetMinutes: number;
}

/**
 * One day's outcome of assignment. `activityId === null` means
 * deliberately empty — a valid outcome, not a gap.
 */
export interface DayAssignment {
  readonly date: Date;
  readonly activityId: string | null;
}

/**
 * Walks the scored, sorted pool day by day — see
 * `docs/specs/zuweisen.md`. Does not attach a `Reason` (that is step 8)
 * or cross-check the result (that is step 7).
 */
export function assignToDays(args: {
  days: readonly PeriodDay[];
  pool: readonly ScoredActivity[];
  config: AssignmentConfig;
}): DayAssignment[] {
  const { days, pool, config } = args;

  const assignableCap = Math.min(
    config.maxActiveSlots,
    flooredAtZero(days.length - config.minEmptySlots),
  );

  const budgets = days.map((d) => d.timeBudgetMinutes);
  const shortestBudget = budgets.length === 0 ? 0 : Math.min(...budgets);
  const longestBudget = budgets.length === 0 ? 0 : Math.max(...budgets);
  const hasShortDay = shortestBudget < longestBudget;

  const usedActivityIds = new Set<string>();
  const assignments: DayAssignment[] = [];
  let activeCount = 0;
  let trainingCount = 0;
  let previousArousal = 0;

  const findCandidate = (day: PeriodDay, dayIndex: number, excludeRest: boolean) => {
    for (const candidate of pool) {
      const activity = candidate.activity;
      if (usedActivityIds.has(activity.id)) continue;

      // Day 1 of the period is never a deliberately quiet day — a brand
      // new plan (or any period's opening day) needs to visibly do
      // something, not open with "rest" (docs/specs/zuweisen.md, "Tag 1
      // ist nie ein Ruhetag"). Only a preference, not absolute: the
      // caller retries without it if nothing else fits at all, so a
      // genuinely empty day 1 never wins over a rest day that does fit.
      if (dayIndex === 0 && excludeRest && activity.type === 'rest') continue;

      if (activity.type === 'training') {
        if (!day.isTrainingDay) continue;
        if (trainingCount >= config.maxTrainingSlots) continue;
      }

      if (activity.durationMin > day.timeBudgetMinutes) continue;

      const isDemanding = activity.arousal >= config.heavyArousalThreshold;
      if (isDemanding && hasShortDay && day.timeBudgetMinutes === shortestBudget) {
        continue;
      }

      if (
        previousArousal >= config.heavyArousalThreshold &&
        activity.type !== 'rest' &&
        activity.type !== 'enrichment'
      ) {
        continue;
      }

      if (
        previousArousal >= config.maxArousalThreshold &&
        activity.arousal >= config.maxArousalThreshold
      ) {
        continue;
      }

      return candidate;
    }
    return undefined;
  };

  for (let dayIndex = 0; dayIndex < days.length; dayIndex++) {
    const day = days[dayIndex]!;
    let chosen: ScoredActivity | undefined;

    if (activeCount < assignableCap) {
      chosen = findCandidate(day, dayIndex, true);
      if (chosen === undefined && dayIndex === 0) {
        chosen = findCandidate(day, dayIndex, false);
      }
    }

    if (chosen !== undefined) {
      usedActivityIds.add(chosen.activity.id);
      activeCount++;
      if (chosen.activity.type === 'training') trainingCount++;
      previousArousal = chosen.activity.arousal;
      assignments.push({ date: day.date, activityId: chosen.activity.id });
    } else {
      previousArousal = 0;
      assignments.push({ date: day.date, activityId: null });
    }
  }

  return assignments;
}

function flooredAtZero(value: number): number {
  return value < 0 ? 0 : value;
}
