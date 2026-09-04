import 'package:meta/meta.dart';

import '../models/checkin.dart';
import '../models/enums.dart';
import '../models/levels.dart';
import '../models/skill.dart';
import '../models/skill_state.dart';
import 'candidates_config.dart';

const Levels _startingLevels = Levels(duration: 0, distance: 0, distraction: 0);

/// One skill that is „in play" this period, with the raw signals scoring
/// (planner step 5) will weigh — see `docs/specs/kandidaten-sammeln.md`.
@immutable
class SkillFocus {
  const SkillFocus({
    required this.skillId,
    required this.levels,
    required this.priority,
    required this.overdueDays,
    required this.isNewSkill,
  });

  final String skillId;
  final Levels levels;

  /// 0–3, from the weekly check-in.
  final int priority;

  /// Days past `dueAt`, relative to the period end. 0 for a skill that is
  /// not due at all.
  final int overdueDays;

  final bool isNewSkill;
}

/// One need dimension with an unmet gap from the previous period.
@immutable
class NeedFocus {
  const NeedFocus({required this.dimension, required this.gap});

  final NeedDimension dimension;

  /// Always > 0 — dimensions without a gap are not included.
  final int gap;

  @override
  bool operator ==(Object other) =>
      other is NeedFocus && other.dimension == dimension && other.gap == gap;

  @override
  int get hashCode => Object.hash(dimension, gap);
}

@immutable
class CandidatePool {
  const CandidatePool({this.skills = const [], this.needs = const []});

  final List<SkillFocus> skills;
  final List<NeedFocus> needs;
}

/// Collects everything „in play" for the period: due refreshers,
/// prioritized skills, newly unlocked skills, and unmet need dimensions.
/// Does not filter or score — see `docs/specs/kandidaten-sammeln.md`.
CandidatePool collectCandidates({
  required Map<String, SkillState> skillStates,
  required List<Skill> catalog,
  required int dogAgeWeeks,
  required List<Priority> priorities,
  required DateTime periodEnd,
  required Map<NeedDimension, int> needCoverageLastPeriod,
  required CandidateConfig config,
}) {
  final ids = <String>{};
  final levelsById = <String, Levels>{};
  final priorityById = <String, int>{};
  final overdueById = <String, int>{};
  final newSkillIds = <String>{};

  for (final entry in skillStates.entries) {
    final state = entry.value;
    final dueAt = state.dueAt;
    if (state.status != SkillStatus.dormant &&
        dueAt != null &&
        !dueAt.isAfter(periodEnd)) {
      ids.add(entry.key);
      levelsById[entry.key] = state.levels;
      overdueById[entry.key] = periodEnd.difference(dueAt).inDays;
    }
  }

  for (final priority in priorities) {
    final state = skillStates[priority.skillIdOrTopic];
    if (state == null) continue;
    ids.add(priority.skillIdOrTopic);
    levelsById[priority.skillIdOrTopic] = state.levels;
    priorityById[priority.skillIdOrTopic] = priority.weight;
  }

  for (final skill in catalog) {
    if (skillStates.containsKey(skill.id)) continue;
    if (dogAgeWeeks < skill.minAgeWeeks) continue;
    final prerequisitesMet = skill.prerequisites.every((id) {
      final state = skillStates[id];
      return state != null && _hasReachedGeneralizing(state.status);
    });
    if (!prerequisitesMet) continue;
    ids.add(skill.id);
    newSkillIds.add(skill.id);
  }

  final skills = ids
      .map(
        (id) => SkillFocus(
          skillId: id,
          levels: levelsById[id] ?? _startingLevels,
          priority: priorityById[id] ?? 0,
          overdueDays: overdueById[id] ?? 0,
          isNewSkill: newSkillIds.contains(id),
        ),
      )
      .toList();

  final needs = <NeedFocus>[];
  for (final dimension in NeedDimension.values) {
    final target = config.needTargets[dimension] ?? 0;
    final covered = needCoverageLastPeriod[dimension] ?? 0;
    final gap = target - covered;
    if (gap > 0) needs.add(NeedFocus(dimension: dimension, gap: gap));
  }

  return CandidatePool(skills: skills, needs: needs);
}

bool _hasReachedGeneralizing(SkillStatus status) =>
    status == SkillStatus.generalizing ||
    status == SkillStatus.consolidated ||
    status == SkillStatus.maintenance;
