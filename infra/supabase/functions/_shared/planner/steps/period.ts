import type { Household } from '../models/household.ts';
import type { LifeStage, RecoveryNeed } from '../models/enums.ts';
import type { PeriodDay } from './assignment.ts';
import type { PeriodConfig } from './period_config.ts';
import { addDays, daysUntilNextWeekdayInclusive, weekdayOf } from '../time.ts';

/** Everything `assignToDays` (step 6) needs about the period as a whole. */
export interface Period {
  readonly days: readonly PeriodDay[];
  readonly periodEnd: Date;
  readonly minEmptySlots: number;
  readonly maxActiveSlots: number;
  readonly maxTrainingSlots: number;
}

/**
 * Builds the period — planner step 2. Resolves the period's length and
 * days from `Household`, and the recovery-need- and life-stage-dependent
 * limits step 6 needs. See `docs/specs/slots-festlegen.md`.
 */
export function buildPeriod(args: {
  startDate: Date;
  household: Household;
  lifeStage: LifeStage;
  recoveryNeed: RecoveryNeed;
  config: PeriodConfig;
}): Period {
  const { startDate, household, lifeStage, recoveryNeed, config } = args;

  const distance = daysUntilNextWeekdayInclusive(weekdayOf(startDate), household.planningDay);
  const length = distance < config.firstPeriodMinDays
    ? distance + config.regularLengthDays
    : distance;

  const days: PeriodDay[] = [];
  for (let i = 0; i < length; i++) {
    const date = addDays(startDate, i);
    const weekday = weekdayOf(date);
    days.push({
      date,
      isTrainingDay: household.trainingDays.has(weekday),
      timeBudgetMinutes: weekday === 'saturday' || weekday === 'sunday'
        ? household.weekendTimeBudgetMinutes
        : household.weekdayTimeBudgetMinutes,
    });
  }

  const maxActiveSlots = config.maxActiveSlotsByLifeStage.get(lifeStage);
  if (maxActiveSlots === undefined) {
    throw new Error(`period config has no maxActiveSlots entry for life stage ${lifeStage}`);
  }
  const maxTrainingSlots = config.maxTrainingSlotsByLifeStage.get(lifeStage);
  if (maxTrainingSlots === undefined) {
    throw new Error(`period config has no maxTrainingSlots entry for life stage ${lifeStage}`);
  }

  return {
    days,
    periodEnd: addDays(startDate, length - 1),
    minEmptySlots: recoveryNeed === 'high'
      ? config.minEmptySlotsAtHighRecoveryNeed
      : config.minEmptySlots,
    maxActiveSlots,
    maxTrainingSlots,
  };
}
