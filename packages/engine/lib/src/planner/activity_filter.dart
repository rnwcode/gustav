import '../models/activity.dart';
import '../models/enums.dart';
import 'activity_filter_config.dart';
import 'candidates.dart';

/// Hard-filters the activity catalog down to what is currently admissible
/// — see `docs/specs/hart-filtern.md`. Does not score or assign; that is
/// planner steps 5 and 6.
List<Activity> filterActivities({
  required List<Activity> catalog,
  required CandidatePool candidates,
  required Set<String> coreSkillIds,
  required int dogAgeWeeks,
  required Set<Restriction> restrictions,
  required int weeksSinceArrival,
  required List<String> householdEquipment,
  required int householdSize,
  required List<Location> allowedLocations,
  required DateTime today,
  required Map<String, DateTime> lastUsedByVarianceGroup,
  required ActivityFilterConfig config,
}) {
  final focusById = {
    for (final focus in candidates.skills) focus.skillId: focus
  };

  return catalog.where((activity) {
    final trainsSkill = activity.trainsSkill;
    final focus = trainsSkill == null ? null : focusById[trainsSkill];

    if (dogAgeWeeks < activity.minAgeWeeks) return false;
    final maxAgeWeeks = activity.maxAgeWeeks;
    if (maxAgeWeeks != null && dogAgeWeeks > maxAgeWeeks) return false;

    if (trainsSkill != null && focus == null) return false;

    if (activity.equipment.any((item) => !householdEquipment.contains(item))) {
      return false;
    }

    if (activity.secondPerson && householdSize < 2) return false;

    for (final restriction in restrictions) {
      final ceiling = config.restrictionArousalCeiling[restriction];
      if (ceiling != null && activity.arousal >= ceiling) return false;
    }
    if (restrictions.contains(Restriction.jointIssues) &&
        activity.jointStraining) {
      return false;
    }

    final isExemptCoreSkill =
        trainsSkill != null && coreSkillIds.contains(trainsSkill);
    if (!isExemptCoreSkill) {
      final lastUsedAt = lastUsedByVarianceGroup[activity.varianceGroup];
      if (lastUsedAt != null &&
          today.difference(lastUsedAt).inDays < activity.cooldownDays) {
        return false;
      }
    }

    if (allowedLocations.isNotEmpty &&
        activity.location != Location.any &&
        !allowedLocations.contains(activity.location)) {
      return false;
    }

    final seasonalWindow = activity.seasonalWindow;
    if (seasonalWindow != null && !seasonalWindow.contains(today.month)) {
      return false;
    }

    if (weeksSinceArrival < config.settlingInWeeks) {
      if (activity.arousal > config.settlingInMaxArousal) return false;
      final forDistraction = activity.forDistraction;
      if (activity.type == ActivityType.training &&
          forDistraction != null &&
          forDistraction.$2 > config.settlingInMaxDistraction) {
        return false;
      }
    }

    if (focus != null) {
      if (activity.type == ActivityType.training) {
        final forDistraction = activity.forDistraction;
        if (forDistraction == null) return false;
        final currentDistraction = focus.levels.distraction;
        if (currentDistraction < forDistraction.$1 ||
            currentDistraction > forDistraction.$2) {
          return false;
        }
      }
      final isMastered = focus.status == SkillStatus.consolidated ||
          focus.status == SkillStatus.maintenance;
      if (isMastered && !activity.isRefresher) return false;
    }

    return true;
  }).toList();
}
