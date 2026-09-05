import { needFor } from '../models/activity.ts';
import type { NeedDimension } from '../models/enums.ts';
import type { DayAssignment } from './assignment.ts';
import type { ScoredActivity } from './scoring.ts';

const ALL_NEED_DIMENSIONS: readonly NeedDimension[] = [
  'physical',
  'mentalWork',
  'scent',
  'social',
  'recovery',
];

/**
 * Verifies the period `assignToDays` (step 6) produced and, if exactly one
 * of the three checks fails, corrects it with a single swap — see
 * `docs/specs/gegenpruefen.md`. Pure function, no re-invocation of step 6.
 */
export function crossCheckPeriod(args: {
  assignments: readonly DayAssignment[];
  pool: readonly ScoredActivity[];
  maxTrainingSlots: number;
}): DayAssignment[] {
  const { assignments, pool, maxTrainingSlots } = args;

  const activityById = new Map(pool.map((p) => [p.activity.id, p.activity]));
  const scoreById = new Map(pool.map((p) => [p.activity.id, p.score]));

  const weakestIndex = (predicate: (activityId: string) => boolean): number => {
    let weakest = -1;
    let weakestScore = Infinity;
    let weakestId = '';
    assignments.forEach((assignment, index) => {
      const activityId = assignment.activityId;
      if (activityId === null || !predicate(activityId)) return;
      const score = scoreById.get(activityId) ?? -Infinity;
      if (
        score < weakestScore ||
        (score === weakestScore && activityId.localeCompare(weakestId) < 0)
      ) {
        weakest = index;
        weakestScore = score;
        weakestId = activityId;
      }
    });
    return weakest;
  };

  // 1. Need coverage.
  const coveredDimensions = new Set<NeedDimension>();
  for (const assignment of assignments) {
    if (assignment.activityId === null) continue;
    const activity = activityById.get(assignment.activityId);
    if (activity === undefined) continue;
    for (const dimension of ALL_NEED_DIMENSIONS) {
      if (needFor(activity.needs, dimension) > 0) coveredDimensions.add(dimension);
    }
  }
  const missingDimensions = ALL_NEED_DIMENSIONS.filter((d) => !coveredDimensions.has(d));

  if (missingDimensions.length > 0) {
    const usedIds = new Set(assignments.map((a) => a.activityId).filter((id) => id !== null));
    const fix = pool.find(
      (candidate) =>
        !usedIds.has(candidate.activity.id) &&
        missingDimensions.some((d) => needFor(candidate.activity.needs, d) > 0),
    );
    const index = fix === undefined ? -1 : weakestIndex(() => true);
    if (index === -1) return [...assignments];
    return assignments.map((assignment, i) =>
      i === index ? { date: assignment.date, activityId: fix!.activity.id } : assignment
    );
  }

  // 2. Training cap.
  const trainingCount = assignments.filter((a) => {
    if (a.activityId === null) return false;
    return activityById.get(a.activityId)?.type === 'training';
  }).length;

  if (trainingCount > maxTrainingSlots) {
    const index = weakestIndex((id) => activityById.get(id)?.type === 'training');
    if (index !== -1) {
      return assignments.map((assignment, i) =>
        i === index ? { date: assignment.date, activityId: null } : assignment
      );
    }
  }

  // 3. At least one empty slot.
  const hasEmptySlot = assignments.some((a) => a.activityId === null);
  if (!hasEmptySlot) {
    const index = weakestIndex(() => true);
    if (index !== -1) {
      return assignments.map((assignment, i) =>
        i === index ? { date: assignment.date, activityId: null } : assignment
      );
    }
  }

  return [...assignments];
}
