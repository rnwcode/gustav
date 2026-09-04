import type { Activity } from '../models/activity.ts';
import type { Location, Restriction } from '../models/enums.ts';
import type { ActivityFilterConfig } from './activity_filter_config.ts';
import type { CandidatePool, SkillFocus } from './candidates.ts';
import { daysBetween } from '../time.ts';

/**
 * Hard-filters the activity catalog down to what is currently admissible
 * — see `docs/specs/hart-filtern.md`. Does not score or assign; that is
 * planner steps 5 and 6.
 */
export function filterActivities(args: {
  catalog: readonly Activity[];
  candidates: CandidatePool;
  coreSkillIds: ReadonlySet<string>;
  dogAgeWeeks: number;
  restrictions: ReadonlySet<Restriction>;
  weeksSinceArrival: number;
  householdEquipment: readonly string[];
  householdSize: number;
  allowedLocations: readonly Location[];
  today: Date;
  lastUsedByVarianceGroup: ReadonlyMap<string, Date>;
  config: ActivityFilterConfig;
}): Activity[] {
  const {
    catalog,
    candidates,
    coreSkillIds,
    dogAgeWeeks,
    restrictions,
    weeksSinceArrival,
    householdEquipment,
    householdSize,
    allowedLocations,
    today,
    lastUsedByVarianceGroup,
    config,
  } = args;

  const focusById = new Map<string, SkillFocus>(candidates.skills.map((f) => [f.skillId, f]));
  const todayMonth = today.getMonth() + 1; // JS months are 0-indexed, content uses 1-12

  return catalog.filter((activity) => {
    const trainsSkill = activity.trainsSkill;
    const focus = trainsSkill === null ? undefined : focusById.get(trainsSkill);

    if (dogAgeWeeks < activity.minAgeWeeks) return false;
    if (activity.maxAgeWeeks !== null && dogAgeWeeks > activity.maxAgeWeeks) return false;

    if (trainsSkill !== null && focus === undefined) return false;

    if (activity.equipment.some((item) => !householdEquipment.includes(item))) {
      return false;
    }

    if (activity.secondPerson && householdSize < 2) return false;

    for (const restriction of restrictions) {
      const ceiling = config.restrictionArousalCeiling.get(restriction);
      if (ceiling !== undefined && activity.arousal >= ceiling) return false;
    }
    if (restrictions.has('jointIssues') && activity.jointStraining) {
      return false;
    }

    const isExemptCoreSkill = trainsSkill !== null && coreSkillIds.has(trainsSkill);
    if (!isExemptCoreSkill) {
      const lastUsedAt = lastUsedByVarianceGroup.get(activity.varianceGroup);
      if (lastUsedAt !== undefined && daysBetween(lastUsedAt, today) < activity.cooldownDays) {
        return false;
      }
    }

    if (
      allowedLocations.length > 0 &&
      activity.location !== 'any' &&
      !allowedLocations.includes(activity.location)
    ) {
      return false;
    }

    if (activity.seasonalWindow !== null && !activity.seasonalWindow.includes(todayMonth)) {
      return false;
    }

    if (weeksSinceArrival < config.settlingInWeeks) {
      if (activity.arousal > config.settlingInMaxArousal) return false;
      const forDistraction = activity.forDistraction;
      if (
        activity.type === 'training' &&
        forDistraction !== null &&
        forDistraction[1] > config.settlingInMaxDistraction
      ) {
        return false;
      }
    }

    if (focus !== undefined) {
      if (activity.type === 'training') {
        const forDistraction = activity.forDistraction;
        if (forDistraction === null) return false;
        const currentDistraction = focus.levels.distraction;
        if (currentDistraction < forDistraction[0] || currentDistraction > forDistraction[1]) {
          return false;
        }
      }
      const isMastered = focus.status === 'consolidated' || focus.status === 'maintenance';
      if (isMastered && !activity.isRefresher) return false;
    }

    return true;
  });
}
