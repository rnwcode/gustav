import 'package:meta/meta.dart';

import '../models/activity.dart';
import '../models/enums.dart';
import 'candidates.dart';
import 'scoring_config.dart';

/// An activity with the score it received in planner step 5 — see
/// `docs/specs/scoren.md`.
@immutable
class ScoredActivity {
  const ScoredActivity({required this.activity, required this.score});

  final Activity activity;
  final double score;
}

/// Scores the admissible pool from `filterActivities()` and returns it
/// sorted descending by score, with a deterministic tie-break on the
/// activity ID. Does not assign activities to days — that is step 6.
List<ScoredActivity> scoreActivities({
  required List<Activity> pool,
  required CandidatePool candidates,
  required BreedGroup breedGroup,
  required RecoveryNeed recoveryNeed,
  required Map<String, DateTime> lastUsedByActivityId,
  required DateTime today,
  required ScoringConfig config,
}) {
  final focusById = {
    for (final focus in candidates.skills) focus.skillId: focus
  };
  final gappedDimensions =
      candidates.needs.map((need) => need.dimension).toSet();

  final scored = pool.map((activity) {
    final focus =
        activity.trainsSkill == null ? null : focusById[activity.trainsSkill];

    final priorityScore = config.priorityWeight * (focus?.priority ?? 0);

    final overdueWeeks = (focus?.overdueDays ?? 0) / 7;
    final cappedOverdueWeeks =
        overdueWeeks > config.overdueCap ? config.overdueCap : overdueWeeks;
    final overdueScore = config.overdueWeight * cappedOverdueWeeks;

    final needGapScore = gappedDimensions.fold<int>(
      0,
      (sum, dimension) => sum + activity.needs[dimension],
    );
    final needScore = config.needGapWeight * needGapScore;

    final newSkillScore =
        config.newSkillWeight * ((focus?.isNewSkill ?? false) ? 1 : 0);

    final suitability = activity.suitability[breedGroup] ?? 0;
    final suitabilityScore = config.suitabilityWeight * suitability;

    final arousalScore = recoveryNeed == RecoveryNeed.none
        ? 0.0
        : config.arousalAtRecoveryNeedWeight * activity.arousal;

    final lastUsedAt = lastUsedByActivityId[activity.id];
    final recentlyDone = lastUsedAt != null &&
        today.difference(lastUsedAt).inDays < config.recentlyDoneDays;
    final recentlyDoneScore = recentlyDone ? config.recentlyDoneWeight : 0.0;

    final score = priorityScore +
        overdueScore +
        needScore +
        newSkillScore +
        suitabilityScore +
        arousalScore +
        recentlyDoneScore;

    return ScoredActivity(activity: activity, score: score);
  }).toList();

  scored.sort((a, b) {
    final byScore = b.score.compareTo(a.score);
    if (byScore != 0) return byScore;
    return a.activity.id.compareTo(b.activity.id);
  });

  return scored;
}
