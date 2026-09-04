import 'package:meta/meta.dart';

import 'enums.dart';
import 'levels.dart';

/// Something a dog can learn. Difficulty is three-dimensional (duration,
/// distance, distraction) — content comes from `content/skills/*.yaml`, see
/// `content/schema/skill.yaml`.
@immutable
class Skill {
  const Skill({
    required this.id,
    required this.name,
    required this.category,
    this.prerequisites = const [],
    required this.minAgeWeeks,
    required this.isCoreSkill,
    required this.targetLevels,
    required this.description,
  });

  final String id;
  final String name;
  final SkillCategory category;

  /// Skill IDs that must have reached at least `generalizing` status.
  final List<String> prerequisites;

  final int minAgeWeeks;

  /// Core skills are exempt from the variance-group cooldown — basic cues
  /// need repetition (`docs/datenmodell.md`, section Aktivität).
  final bool isCoreSkill;

  final Levels targetLevels;
  final String description;
}
