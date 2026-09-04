import 'package:meta/meta.dart';

import 'enums.dart';
import 'levels.dart';

/// One entry in a skill state's history — the last ten are enough
/// (`docs/datenmodell.md`).
@immutable
class HistoryEntry {
  const HistoryEntry(
      {required this.date, required this.outcome, required this.levels});

  final DateTime date;
  final Outcome outcome;
  final Levels levels;
}

/// The state of one skill for one dog. A skill is not a scalar — state is
/// tracked per skill × difficulty (`docs/datenmodell.md`, section „Fünf
/// Entscheidungen").
@immutable
class SkillState {
  const SkillState({
    required this.dogId,
    required this.skillId,
    required this.status,
    required this.levels,
    this.history = const [],
    this.lastPracticedAt,
    this.dueAt,
    required this.intervalDays,
  });

  final String dogId;
  final String skillId;
  final SkillStatus status;
  final Levels levels;

  /// Most recent entry last.
  final List<HistoryEntry> history;

  final DateTime? lastPracticedAt;
  final DateTime? dueAt;
  final int intervalDays;

  SkillState copyWith({
    SkillStatus? status,
    Levels? levels,
    List<HistoryEntry>? history,
    DateTime? lastPracticedAt,
    DateTime? dueAt,
    int? intervalDays,
  }) =>
      SkillState(
        dogId: dogId,
        skillId: skillId,
        status: status ?? this.status,
        levels: levels ?? this.levels,
        history: history ?? this.history,
        lastPracticedAt: lastPracticedAt ?? this.lastPracticedAt,
        dueAt: dueAt ?? this.dueAt,
        intervalDays: intervalDays ?? this.intervalDays,
      );
}
