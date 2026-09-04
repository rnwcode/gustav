/**
 * The slice of `content/planer.yaml` scoring needs (section `gewichte`
 * plus `kuerzlich_gemacht_tage`). Passed in, not imported (CLAUDE.md,
 * rule 10). `arousalAtRecoveryNeedWeight` and `recentlyDoneWeight` are
 * already negative in the YAML — see `docs/specs/scoren.md`, „Zu den
 * Vorzeichen".
 */
export interface ScoringConfig {
  readonly priorityWeight: number;
  readonly overdueWeight: number;
  readonly overdueCap: number;
  readonly needGapWeight: number;
  readonly newSkillWeight: number;
  readonly suitabilityWeight: number;
  readonly arousalAtRecoveryNeedWeight: number;
  readonly recentlyDoneWeight: number;
  readonly recentlyDoneDays: number;
}
