import 'package:meta/meta.dart';

import '../models/enums.dart';
import 'assignment_config.dart';
import 'scoring.dart';

/// One day of the period, with everything the caller already resolved
/// from `Household` and the calendar date.
@immutable
class PeriodDay {
  const PeriodDay({
    required this.date,
    required this.isTrainingDay,
    required this.timeBudgetMinutes,
  });

  final DateTime date;
  final bool isTrainingDay;
  final int timeBudgetMinutes;
}

/// One day's outcome of assignment. `activityId == null` means
/// deliberately empty — a valid outcome, not a gap.
@immutable
class DayAssignment {
  const DayAssignment({required this.date, this.activityId});

  final DateTime date;
  final String? activityId;
}

/// Walks the scored, sorted pool day by day — see
/// `docs/specs/zuweisen.md`. Does not attach a `Reason` (that is step 8)
/// or cross-check the result (that is step 7).
List<DayAssignment> assignToDays({
  required List<PeriodDay> days,
  required List<ScoredActivity> pool,
  required AssignmentConfig config,
}) {
  final assignableCap = _min(
    config.maxActiveSlots,
    _flooredAtZero(days.length - config.minEmptySlots),
  );

  final budgets = days.map((d) => d.timeBudgetMinutes);
  final shortestBudget = budgets.isEmpty ? 0 : budgets.reduce(_min);
  final longestBudget =
      budgets.isEmpty ? 0 : budgets.reduce((a, b) => a > b ? a : b);
  final hasShortDay = shortestBudget < longestBudget;

  final usedActivityIds = <String>{};
  final assignments = <DayAssignment>[];
  var activeCount = 0;
  var trainingCount = 0;
  var previousArousal = 0;

  for (final day in days) {
    ScoredActivity? chosen;

    if (activeCount < assignableCap) {
      for (final candidate in pool) {
        final activity = candidate.activity;
        if (usedActivityIds.contains(activity.id)) continue;

        if (activity.type == ActivityType.training) {
          if (!day.isTrainingDay) continue;
          if (trainingCount >= config.maxTrainingSlots) continue;
        }

        if (activity.durationMin > day.timeBudgetMinutes) continue;

        final isDemanding = activity.arousal >= config.heavyArousalThreshold;
        if (isDemanding &&
            hasShortDay &&
            day.timeBudgetMinutes == shortestBudget) {
          continue;
        }

        if (previousArousal >= config.heavyArousalThreshold &&
            activity.type != ActivityType.rest &&
            activity.type != ActivityType.enrichment) {
          continue;
        }

        if (previousArousal >= config.maxArousalThreshold &&
            activity.arousal >= config.maxArousalThreshold) {
          continue;
        }

        chosen = candidate;
        break;
      }
    }

    if (chosen != null) {
      usedActivityIds.add(chosen.activity.id);
      activeCount++;
      if (chosen.activity.type == ActivityType.training) trainingCount++;
      previousArousal = chosen.activity.arousal;
      assignments
          .add(DayAssignment(date: day.date, activityId: chosen.activity.id));
    } else {
      previousArousal = 0;
      assignments.add(DayAssignment(date: day.date));
    }
  }

  return assignments;
}

int _flooredAtZero(int value) => value < 0 ? 0 : value;

int _min(int a, int b) => a < b ? a : b;
