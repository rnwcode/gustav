import type { Activity } from '../models/activity.ts';
import { needFor } from '../models/activity.ts';
import type { BreedGroup, NeedDimension, RecoveryNeed } from '../models/enums.ts';
import type { CandidatePool, SkillFocus } from './candidates.ts';
import type { ScoringConfig } from './scoring_config.ts';
import { daysBetween } from '../time.ts';

/**
 * An activity with the score it received in planner step 5 — see
 * `docs/specs/scoren.md`.
 */
export interface ScoredActivity {
  readonly activity: Activity;
  readonly score: number;
}

/**
 * Scores the admissible pool from `filterActivities()` and returns it
 * sorted descending by score, with a deterministic tie-break on the
 * activity ID. Does not assign activities to days — that is step 6.
 */
export function scoreActivities(args: {
  pool: readonly Activity[];
  candidates: CandidatePool;
  breedGroup: BreedGroup;
  recoveryNeed: RecoveryNeed;
  lastUsedByActivityId: ReadonlyMap<string, Date>;
  today: Date;
  config: ScoringConfig;
}): ScoredActivity[] {
  const { pool, candidates, breedGroup, recoveryNeed, lastUsedByActivityId, today, config } = args;

  const focusById = new Map<string, SkillFocus>(candidates.skills.map((f) => [f.skillId, f]));
  const gappedDimensions = new Set<NeedDimension>(candidates.needs.map((n) => n.dimension));

  const scored: ScoredActivity[] = pool.map((activity) => {
    const focus = activity.trainsSkill === null ? undefined : focusById.get(activity.trainsSkill);

    const priorityScore = config.priorityWeight * (focus?.priority ?? 0);

    const overdueWeeks = (focus?.overdueDays ?? 0) / 7;
    const cappedOverdueWeeks = overdueWeeks > config.overdueCap ? config.overdueCap : overdueWeeks;
    const overdueScore = config.overdueWeight * cappedOverdueWeeks;

    let needGapScore = 0;
    for (const dimension of gappedDimensions) {
      needGapScore += needFor(activity.needs, dimension);
    }
    const needScore = config.needGapWeight * needGapScore;

    const newSkillScore = config.newSkillWeight * ((focus?.isNewSkill ?? false) ? 1 : 0);

    const suitability = activity.suitability.get(breedGroup) ?? 0;
    const suitabilityScore = config.suitabilityWeight * suitability;

    const arousalScore = recoveryNeed === 'none'
      ? 0
      : config.arousalAtRecoveryNeedWeight * activity.arousal;

    const lastUsedAt = lastUsedByActivityId.get(activity.id);
    const recentlyDone = lastUsedAt !== undefined &&
      daysBetween(lastUsedAt, today) < config.recentlyDoneDays;
    const recentlyDoneScore = recentlyDone ? config.recentlyDoneWeight : 0;

    const score = priorityScore +
      overdueScore +
      needScore +
      newSkillScore +
      suitabilityScore +
      arousalScore +
      recentlyDoneScore;

    return { activity, score };
  });

  scored.sort((a, b) => {
    const byScore = b.score - a.score;
    if (byScore !== 0) return byScore;
    return a.activity.id.localeCompare(b.activity.id);
  });

  return scored;
}
