import type { LifeStage, RecoveryNeed, Restriction } from '../models/enums.ts';
import type { LoadBudgetConfig } from './load_budget_config.ts';

/** The rolling load balance — see `docs/specs/belastungsbudget.md`. */
export interface LoadBudget {
  readonly quote: number;
  readonly recoveryNeed: RecoveryNeed;
}

/**
 * Evaluates the rolling load budget from seven days of already-resolved
 * daily loads. Pure function — how a daily load is derived from `Slot`,
 * `Activity.arousal` and `Outcome` is the caller's job, not this
 * function's (see the spec's „Nicht dazu gehört").
 */
export function evaluateLoadBudget(args: {
  loadOverLastSevenDays: readonly number[];
  lifeStage: LifeStage;
  restrictions: ReadonlySet<Restriction>;
  config: LoadBudgetConfig;
}): LoadBudget {
  const { loadOverLastSevenDays, lifeStage, restrictions, config } = args;
  if (loadOverLastSevenDays.length !== 7) {
    throw new Error(
      `evaluateLoadBudget expects exactly 7 days, got ${loadOverLastSevenDays.length}`,
    );
  }

  const baseCapacity = config.capacityPerDay.get(lifeStage);
  if (baseCapacity === undefined) {
    throw new Error(`load budget config has no capacity entry for life stage ${lifeStage}`);
  }
  let capacity = baseCapacity;
  for (const restriction of restrictions) {
    const cap = config.restrictionCap.get(restriction);
    if (cap !== undefined && cap < capacity) capacity = cap;
  }

  const totalLoad = loadOverLastSevenDays.reduce((sum, day) => sum + day, 0);
  const quote = totalLoad / 7 / capacity;

  const recoveryNeed: RecoveryNeed = quote >= config.recoveryNeedHighFrom
    ? 'high'
    : quote >= config.recoveryNeedMediumFrom
    ? 'medium'
    : 'none';

  return { quote, recoveryNeed };
}
