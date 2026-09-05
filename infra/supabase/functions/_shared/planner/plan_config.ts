import type { LoadBudgetConfig } from './steps/load_budget_config.ts';
import type { PeriodConfig } from './steps/period_config.ts';
import type { CandidateConfig } from './steps/candidates_config.ts';
import type { ActivityFilterConfig } from './steps/activity_filter_config.ts';
import type { ScoringConfig } from './steps/scoring_config.ts';

/**
 * All of `content/planer.yaml`, sliced into exactly what each of the eight
 * steps already declared it needs. Passed in, not imported (CLAUDE.md,
 * rule 10) — see `docs/specs/planer.md`.
 */
export interface PlannerConfig {
  /** `content/planer.yaml`'s own `version` — becomes `WeeklyPlan.configVersion` unread. */
  readonly version: number;

  readonly loadBudget: LoadBudgetConfig;
  readonly period: PeriodConfig;
  readonly candidates: CandidateConfig;
  readonly activityFilter: ActivityFilterConfig;
  readonly scoring: ScoringConfig;

  /** `belastungsregeln` — the two thresholds `assignToDays` needs beyond `Period`. */
  readonly assignment: {
    readonly heavyArousalThreshold: number;
    readonly maxArousalThreshold: number;
  };
}
