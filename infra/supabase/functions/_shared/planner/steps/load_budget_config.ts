import type { LifeStage, Restriction } from '../models/enums.ts';

/**
 * The slice of `content/planer.yaml` the load budget needs (sections
 * `belastbarkeit_pro_tag`, `einschraenkung_deckel` and `erholungsbedarf`).
 * Passed in, not imported (CLAUDE.md, rule 10).
 */
export interface LoadBudgetConfig {
  readonly capacityPerDay: ReadonlyMap<LifeStage, number>;

  /**
   * Only restrictions that cap capacity have an entry here — others (e.g.
   * `jointIssues`, `senior`) act elsewhere in the planner (filtering).
   */
  readonly restrictionCap: ReadonlyMap<Restriction, number>;

  readonly recoveryNeedMediumFrom: number;
  readonly recoveryNeedHighFrom: number;
}
