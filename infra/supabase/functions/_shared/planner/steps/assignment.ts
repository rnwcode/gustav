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

  for (const day of days) {
    let chosen: ScoredActivity | undefined;

    if (activeCount < assignableCap) {
      for (const candidate of pool) {
        const activity = candidate.activity;
        if (usedActivityIds.has(activity.id)) continue;

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

        chosen = candidate;
        break;
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
