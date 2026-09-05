import type { Dog } from '../models/dog.ts';
import { ageInWeeksAt, heatSensitivityAt, lifeStageAt } from '../models/dog_derivations.ts';
import type { LifeStage } from '../models/enums.ts';
import type { Household } from '../models/household.ts';
import type { WeeklyContext } from '../models/checkin.ts';
import { daysBetween } from '../time.ts';
import { evaluateLoadBudget, type LoadBudget } from './load_budget.ts';
import type { LoadBudgetConfig } from './load_budget_config.ts';

/**
 * Everything the later planner steps need, derived once against the same
 * `today` — see `docs/specs/kontext-bauen.md`.
 */
export interface PlanningContext {
  readonly dog: Dog;
  readonly today: Date;
  readonly ageWeeks: number;
  readonly lifeStage: LifeStage;
  readonly heatSensitivity: number;
  readonly weeksSinceArrival: number;
  readonly household: Household;
  readonly weeklyContext: WeeklyContext;
  readonly loadBudget: LoadBudget;
}

/**
 * Builds the planning context for one period — planner step 1. Pure
 * assembly: derives nothing that `dog_derivations.ts` and
 * `evaluateLoadBudget` don't already compute, it only calls them with the
 * same `dog`/`today` and bundles the result.
 */
export function buildContext(args: {
  dog: Dog;
  household: Household;
  weeklyContext: WeeklyContext;
  today: Date;
  loadOverLastSevenDays: readonly number[];
  loadBudgetConfig: LoadBudgetConfig;
}): PlanningContext {
  const { dog, household, weeklyContext, today, loadOverLastSevenDays, loadBudgetConfig } = args;

  const lifeStage = lifeStageAt(dog, today);

  return {
    dog,
    today,
    ageWeeks: ageInWeeksAt(dog, today),
    lifeStage,
    heatSensitivity: heatSensitivityAt(dog, today),
    weeksSinceArrival: Math.floor(daysBetween(dog.arrivalDate, today) / 7),
    household,
    weeklyContext,
    loadBudget: evaluateLoadBudget({
      loadOverLastSevenDays,
      lifeStage,
      restrictions: dog.restrictions,
      config: loadBudgetConfig,
    }),
  };
}
