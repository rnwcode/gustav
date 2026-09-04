import 'package:meta/meta.dart';

import 'enums.dart';

/// The second currency: how much an activity covers each of the five need
/// dimensions, 0–3 (`docs/datenmodell.md`, section „Fünf Entscheidungen").
@immutable
class Needs {
  const Needs({
    required this.physical,
    required this.mentalWork,
    required this.scent,
    required this.social,
    required this.recovery,
  });

  final int physical;
  final int mentalWork;
  final int scent;
  final int social;
  final int recovery;

  int operator [](NeedDimension d) => switch (d) {
        NeedDimension.physical => physical,
        NeedDimension.mentalWork => mentalWork,
        NeedDimension.scent => scent,
        NeedDimension.social => social,
        NeedDimension.recovery => recovery,
      };
}

@immutable
class TroubleshootingEntry {
  const TroubleshootingEntry({required this.problem, required this.answer});

  final String problem;
  final String answer;
}

/// Anything that can fill a day's slot: a training session, a sniffing game,
/// a daily routine, a rest suggestion. Not every activity trains a skill.
/// Content comes from `content/aktivitaeten/*.yaml`, see
/// `content/schema/aktivitaet.yaml`.
@immutable
class Activity {
  const Activity({
    required this.id,
    required this.title,
    required this.sentence,
    required this.type,
    this.trainsSkill,
    required this.needs,
    required this.arousal,
    required this.durationMin,
    required this.durationMax,
    required this.location,
    this.forDistraction,
    required this.isRefresher,
    required this.heatSuitable,
    required this.rainSuitable,
    required this.darknessSuitable,
    required this.jointStraining,
    this.seasonalWindow,
    this.equipment = const [],
    required this.secondPerson,
    required this.minAgeWeeks,
    this.maxAgeWeeks,
    this.suitability = const {},
    required this.varianceGroup,
    required this.cooldownDays,
    this.illustration,
    this.instructions = const [],
    required this.successCriterion,
    this.commonMistakes = const [],
    this.troubleshooting = const [],
  });

  final String id;
  final String title;

  /// THE sentence for the day view, one or two lines.
  final String sentence;

  final ActivityType type;

  /// `null` for enrichment.
  final String? trainsSkill;

  final Needs needs;

  /// 0–3, how much arousal is left afterwards.
  final int arousal;

  final int durationMin;
  final int durationMax;
  final Location location;

  /// Only for `type == training`: the matching distraction levels, as
  /// [min, max].
  final (int, int)? forDistraction;

  final bool isRefresher;

  final bool heatSuitable;
  final bool rainSuitable;
  final bool darknessSuitable;
  final bool jointStraining;

  /// e.g. `[10, 11, 12]` for New Year's Eve preparation.
  final List<int>? seasonalWindow;

  final List<String> equipment;
  final bool secondPerson;
  final int minAgeWeeks;
  final int? maxAgeWeeks;

  /// Weighted, NEVER filters hard (`docs/datenmodell.md`).
  final Map<BreedGroup, int> suitability;

  /// The cooldown is tied to the variance group, not the activity — basic
  /// cues need repetition, enrichment doesn't.
  final String varianceGroup;
  final int cooldownDays;

  final String? illustration;
  final List<String> instructions;
  final String successCriterion;
  final List<String> commonMistakes;
  final List<TroubleshootingEntry> troubleshooting;
}
