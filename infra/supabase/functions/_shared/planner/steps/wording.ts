import { needFor } from '../models/activity.ts';
import type { Reason } from '../models/weekly_plan.ts';
import type { Slot } from '../models/weekly_plan.ts';
import type { CandidatePool } from './candidates.ts';
import type { DayAssignment } from './assignment.ts';
import type { ScoredActivity } from './scoring.ts';

/**
 * Attaches a machine-readable `Reason` to every assignment — planner
 * step 8. Produces no prose: the explaining sentence is a template (MVP)
 * or an LLM (later), and either way lives outside this pure function —
 * see `docs/specs/texten.md`.
 */
export function buildSlots(args: {
  assignments: readonly DayAssignment[];
  pool: readonly ScoredActivity[];
  candidates: CandidatePool;
}): Slot[] {
  const { assignments, pool, candidates } = args;

  const activityById = new Map(pool.map((p) => [p.activity.id, p.activity]));
  const focusBySkillId = new Map(candidates.skills.map((f) => [f.skillId, f]));

  return assignments.map((assignment) => ({
    date: assignment.date,
    activityId: assignment.activityId,
    reason: reasonFor(assignment.activityId, activityById, focusBySkillId, candidates),
    outcome: null,
  }));
}

function reasonFor(
  activityId: string | null,
  activityById: ReadonlyMap<string, ScoredActivity['activity']>,
  focusBySkillId: ReadonlyMap<string, CandidatePool['skills'][number]>,
  candidates: CandidatePool,
): Reason {
  if (activityId === null) {
    return { kind: 'empty', skillId: null, needDimension: null };
  }

  const activity = activityById.get(activityId);
  const focus = activity?.trainsSkill == null
    ? undefined
    : focusBySkillId.get(activity.trainsSkill);

  if (focus !== undefined) {
    if (focus.isNewSkill) {
      return { kind: 'newSkill', skillId: focus.skillId, needDimension: null };
    }
    if (focus.overdueDays > 0) {
      return { kind: 'dueRefresher', skillId: focus.skillId, needDimension: null };
    }
    if (focus.priority > 0) {
      return { kind: 'priority', skillId: focus.skillId, needDimension: null };
    }
  }

  if (activity !== undefined) {
    let bestDimension: CandidatePool['needs'][number] | undefined;
    for (const need of candidates.needs) {
      if (needFor(activity.needs, need.dimension) <= 0) continue;
      if (bestDimension === undefined || need.gap > bestDimension.gap) {
        bestDimension = need;
      }
    }
    if (bestDimension !== undefined) {
      return { kind: 'needGap', skillId: null, needDimension: bestDimension.dimension };
    }
  }

  return { kind: 'recoveryNeed', skillId: null, needDimension: null };
}
