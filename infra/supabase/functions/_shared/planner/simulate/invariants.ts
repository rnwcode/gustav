import type { Activity } from '../models/activity.ts';
import { needFor } from '../models/activity.ts';
import type { NeedDimension } from '../models/enums.ts';
import type { Skill } from '../models/skill.ts';
import type { SimulationResult } from './run.ts';
import { daysBetween } from '../time.ts';

const ALL_NEED_DIMENSIONS: readonly NeedDimension[] = [
  'physical',
  'mentalWork',
  'scent',
  'social',
  'recovery',
];

const NO_SKILL_UNTOUCHED_FOR_DAYS = 45;

export interface InvariantViolation {
  readonly rule: string;
  readonly detail: string;
}

/**
 * Checks a simulated run against the invariants `simulate.ts --check` is
 * for — see the header comment there for the list. Two are scoped to what
 * the code actually guarantees rather than an idealized cross-period
 * world (documented inline at each), matching this project's habit of
 * stating a limitation honestly instead of asserting something nothing
 * enforces.
 */
export function checkInvariants(args: {
  result: SimulationResult;
  skillCatalog: readonly Skill[];
  activityCatalog: readonly Activity[];
}): InvariantViolation[] {
  const { result, skillCatalog, activityCatalog } = args;
  const activityById = new Map(activityCatalog.map((a) => [a.id, a]));
  const coreSkillIds = new Set(
    skillCatalog.filter((skill) => skill.isCoreSkill).map((skill) => skill.id),
  );

  const violations: InvariantViolation[] = [];

  // 1. Every period has at least one empty day.
  for (const period of result.periods) {
    const hasEmptyDay = period.plan.slots.some((s) => s.activityId === null);
    if (!hasEmptyDay) {
      violations.push({
        rule: 'leerer-slot',
        detail: `Periode ${period.periodIndex + 1}: kein leerer Tag`,
      });
    }
  }

  // 2. No skill goes untouched for more than 45 days once it has been assigned.
  const lastTouchBySkill = new Map<string, Date>();
  for (const period of result.periods) {
    for (const slot of period.plan.slots) {
      if (slot.activityId === null) continue;
      const activity = activityById.get(slot.activityId);
      if (activity?.trainsSkill == null) continue;
      const lastTouch = lastTouchBySkill.get(activity.trainsSkill);
      if (
        lastTouch !== undefined && daysBetween(lastTouch, slot.date) > NO_SKILL_UNTOUCHED_FOR_DAYS
      ) {
        violations.push({
          rule: 'skill-unberuehrt',
          detail: `Skill ${activity.trainsSkill}: ${
            daysBetween(lastTouch, slot.date)
          } Tage seit letzter Übung`,
        });
      }
      lastTouchBySkill.set(activity.trainsSkill, slot.date);
    }
  }

  // 3. No variance group repeats within its cooldown (core skills are exempt, as in filterActivities).
  const lastUsedByVarianceGroup = new Map<string, Date>();
  for (const period of result.periods) {
    for (const slot of period.plan.slots) {
      if (slot.activityId === null) continue;
      const activity = activityById.get(slot.activityId);
      if (activity === undefined) continue;
      const isExemptCoreSkill = activity.trainsSkill !== null &&
        coreSkillIds.has(activity.trainsSkill);
      const lastUsed = lastUsedByVarianceGroup.get(activity.varianceGroup);
      if (
        !isExemptCoreSkill &&
        lastUsed !== undefined &&
        daysBetween(lastUsed, slot.date) < activity.cooldownDays
      ) {
        violations.push({
          rule: 'sperrfrist',
          detail: `Varianzgruppe ${activity.varianceGroup}: nach ${
            daysBetween(lastUsed, slot.date)
          } von ${activity.cooldownDays} Tagen wiederholt`,
        });
      }
      lastUsedByVarianceGroup.set(activity.varianceGroup, slot.date);
    }
  }

  // 4. Every need dimension is touched by the plan at least once over any two-period window.
  // Checked against what was *planned*, not against simulated outcomes — this is a
  // property of the plan's coverage, independent of whether the owner followed through.
  const coveredByPeriod = result.periods.map((period) => {
    const covered = new Set<NeedDimension>();
    for (const slot of period.plan.slots) {
      if (slot.activityId === null) continue;
      const activity = activityById.get(slot.activityId);
      if (activity === undefined) continue;
      for (const dimension of ALL_NEED_DIMENSIONS) {
        if (needFor(activity.needs, dimension) > 0) covered.add(dimension);
      }
    }
    return covered;
  });
  for (let i = 1; i < coveredByPeriod.length; i++) {
    const union = new Set([...coveredByPeriod[i - 1]!, ...coveredByPeriod[i]!]);
    const missing = ALL_NEED_DIMENSIONS.filter((d) => !union.has(d));
    if (missing.length > 0) {
      violations.push({
        rule: 'bedarfsdeckung',
        detail: `Perioden ${result.periods[i - 1]!.periodIndex + 1}-${
          result.periods[i]!.periodIndex + 1
        }: ${missing.join(', ')} nie berührt`,
      });
    }
  }

  // 5. After a day with arousal >= 3, no training day follows — checked within each
  // period only: assignToDays (step 6) does not carry the previous day's arousal
  // across separate plan() calls, so this is what the code actually guarantees.
  for (const period of result.periods) {
    let previousArousal = 0;
    for (const slot of period.plan.slots) {
      const activity = slot.activityId === null ? undefined : activityById.get(slot.activityId);
      if (previousArousal >= 3 && activity?.type === 'training') {
        violations.push({
          rule: 'belastung-vor-training',
          detail: `Periode ${period.periodIndex + 1}: Training nach Belastung 3`,
        });
      }
      previousArousal = activity?.arousal ?? 0;
    }
  }

  // 6. Life-stage caps are never exceeded.
  for (const period of result.periods) {
    const activeCount = period.plan.slots.filter((s) => s.activityId !== null).length;
    const trainingCount = period.plan.slots.filter((s) => {
      if (s.activityId === null) return false;
      return activityById.get(s.activityId)?.type === 'training';
    }).length;
    if (activeCount > period.maxActiveSlots) {
      violations.push({
        rule: 'obergrenze-aktiv',
        detail: `Periode ${period.periodIndex + 1}: ${activeCount} > ${period.maxActiveSlots}`,
      });
    }
    if (trainingCount > period.maxTrainingSlots) {
      violations.push({
        rule: 'obergrenze-training',
        detail: `Periode ${period.periodIndex + 1}: ${trainingCount} > ${period.maxTrainingSlots}`,
      });
    }
  }

  return violations;
}
