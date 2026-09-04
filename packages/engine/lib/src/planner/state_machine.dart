import '../models/enums.dart';
import '../models/levels.dart';
import '../models/skill_state.dart';
import 'state_machine_config.dart';

/// Skill state machine and spaced repetition.
///
/// Spec: `docs/specs/skill-zustandsautomat.md`. Pure functions — `date`
/// comes in as a parameter, never from the system clock (CLAUDE.md, rule 2).

const int _maxHistoryLength = 10;

/// The dimension currently being worked on: the first in `order` whose
/// level has not yet reached the target. If all three have reached target,
/// the last dimension in the order counts as active.
Dimension activeDimension(
    Levels levels, Levels targetLevels, List<Dimension> order) {
  for (final d in order) {
    if (levels[d] < targetLevels[d]) return d;
  }
  return order.last;
}

/// Processes one assessment (`succeeded`, `partial` or `notYet`) and
/// returns the new [SkillState].
SkillState apply({
  required SkillState state,
  required Levels targetLevels,
  required Outcome outcome,
  required DateTime date,
  required StateMachineConfig config,
}) {
  assert(
    outcome == Outcome.succeeded ||
        outcome == Outcome.partial ||
        outcome == Outcome.notYet,
    'apply expects succeeded, partial or notYet, was $outcome',
  );

  final fullHistory = [
    ...state.history,
    HistoryEntry(date: date, outcome: outcome, levels: state.levels),
  ];

  final active = activeDimension(state.levels, targetLevels, config.order);

  var newLevels = state.levels;
  var newStatus = state.status;

  if (outcome == Outcome.succeeded) {
    final successesInARow =
        _countInARow(fullHistory, state.levels, Outcome.succeeded);
    if (successesInARow >= config.increaseAfterSuccesses) {
      newLevels = _withIncreasedDimension(state.levels, targetLevels, active);
    }
  } else if (outcome == Outcome.notYet) {
    final failuresInARow =
        _countInARow(fullHistory, state.levels, Outcome.notYet);
    if (failuresInARow >= config.decreaseAfterFailures) {
      final newValue = _flooredAtZero(state.levels[active] - 1);
      newLevels = state.levels.updated(active, newValue);
      if (newValue == 0) newStatus = SkillStatus.building;
    }
  }

  if (newStatus == SkillStatus.building &&
      newLevels.distraction >= config.generalizeAtDistraction) {
    newStatus = SkillStatus.generalizing;
  }
  if (newLevels == targetLevels) {
    newStatus = SkillStatus.consolidated;
  }

  final intervalConfig = config.intervals[newStatus]!;
  final newInterval = switch (outcome) {
    Outcome.succeeded => _capped(
        (state.intervalDays * config.successFactor).round(),
        intervalConfig.cap,
      ),
    Outcome.notYet => intervalConfig.start,
    _ => state.intervalDays,
  };

  final trimmedHistory = fullHistory.length > _maxHistoryLength
      ? fullHistory.sublist(fullHistory.length - _maxHistoryLength)
      : fullHistory;

  return state.copyWith(
    status: newStatus,
    levels: newLevels,
    history: trimmedHistory,
    lastPracticedAt: date,
    dueAt: date.add(Duration(days: newInterval)),
    intervalDays: newInterval,
  );
}

/// A problem reported in the weekly check-in: throws `maintenance` back to
/// `generalizing` and lowers the active dimension by one level.
SkillState reportProblem({
  required SkillState state,
  required Levels targetLevels,
  required StateMachineConfig config,
}) {
  assert(
    state.status == SkillStatus.maintenance,
    'reportProblem only applies to skills in maintenance, was ${state.status}',
  );

  final active = activeDimension(state.levels, targetLevels, config.order);
  final newLevels =
      state.levels.updated(active, _flooredAtZero(state.levels[active] - 1));
  final intervalConfig = config.intervals[SkillStatus.generalizing]!;

  return state.copyWith(
    status: SkillStatus.generalizing,
    levels: newLevels,
    intervalDays: intervalConfig.start,
  );
}

/// Raises [active] by 1 and lowers every other dimension by 1 (floor 0) —
/// but only if that dimension has not yet reached its target. A dimension
/// already at target is left untouched, otherwise „all target levels
/// reached" could never happen at the same time.
Levels _withIncreasedDimension(
    Levels levels, Levels targetLevels, Dimension active) {
  var updated = levels.updated(active, levels[active] + 1);
  for (final d in Dimension.values) {
    if (d == active) continue;
    if (levels[d] < targetLevels[d]) {
      updated = updated.updated(d, _flooredAtZero(levels[d] - 1));
    }
  }
  return updated;
}

/// Counts how often [target] occurs consecutively at the end of [history],
/// as long as the entries were assessed at the same [levels]. `partial`
/// does not break the streak.
int _countInARow(List<HistoryEntry> history, Levels levels, Outcome target) {
  var count = 0;
  for (final entry in history.reversed) {
    if (entry.levels != levels) break;
    if (entry.outcome == target) {
      count++;
    } else if (entry.outcome == Outcome.partial) {
      continue;
    } else {
      break;
    }
  }
  return count;
}

int _flooredAtZero(int value) => value < 0 ? 0 : value;

int _capped(int value, int cap) => value > cap ? cap : value;
