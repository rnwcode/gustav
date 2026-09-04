import 'package:engine/engine.dart';
import 'package:test/test.dart';

// Fixtures from docs/specs/skill-zustandsautomat.md: skill „rueckruf"
// (content id, stays German — see content/skills/rueckruf.yaml), values
// from content/planer.yaml.
void main() {
  const targetLevels = Levels(duration: 1, distance: 3, distraction: 4);

  const config = StateMachineConfig(
    increaseAfterSuccesses: 3,
    decreaseAfterFailures: 2,
    order: [Dimension.duration, Dimension.distance, Dimension.distraction],
    generalizeAtDistraction: 2,
    successFactor: 1.8,
    intervals: {
      SkillStatus.building: IntervalConfig(start: 1, cap: 4),
      SkillStatus.generalizing: IntervalConfig(start: 3, cap: 14),
      SkillStatus.consolidated: IntervalConfig(start: 10, cap: 45),
      SkillStatus.maintenance: IntervalConfig(start: 45, cap: 90),
    },
  );

  List<HistoryEntry> historyOf(int count, Outcome outcome, Levels levels) =>
      List.generate(
        count,
        (_) => HistoryEntry(
            date: DateTime(2026, 3, 1), outcome: outcome, levels: levels),
      );

  test(
      '3x succeeded raises the active dimension, lowers only the unfinished one',
      () {
    const levels = Levels(duration: 1, distance: 1, distraction: 1);
    final state = SkillState(
      dogId: 'dog1',
      skillId: 'rueckruf',
      status: SkillStatus.building,
      levels: levels,
      history: historyOf(2, Outcome.succeeded, levels),
      intervalDays: 2,
    );

    final result = apply(
      state: state,
      targetLevels: targetLevels,
      outcome: Outcome.succeeded,
      date: DateTime(2026, 3, 10),
      config: config,
    );

    expect(
        result.levels, const Levels(duration: 1, distance: 2, distraction: 0));
    expect(result.status, SkillStatus.building);
    expect(result.intervalDays, 4);
    expect(result.lastPracticedAt, DateTime(2026, 3, 10));
    expect(result.dueAt, DateTime(2026, 3, 14));
    expect(result.history.last.outcome, Outcome.succeeded);
    expect(result.history.last.levels, levels);
  });

  test(
      '2x notYet in a row lowers the active dimension; at 0 status falls back to building',
      () {
    const levels = Levels(duration: 1, distance: 3, distraction: 1);
    final state = SkillState(
      dogId: 'dog1',
      skillId: 'rueckruf',
      status: SkillStatus.generalizing,
      levels: levels,
      history: historyOf(1, Outcome.notYet, levels),
      intervalDays: 3,
    );

    final result = apply(
      state: state,
      targetLevels: targetLevels,
      outcome: Outcome.notYet,
      date: DateTime(2026, 3, 10),
      config: config,
    );

    expect(
        result.levels, const Levels(duration: 1, distance: 3, distraction: 0));
    expect(result.status, SkillStatus.building);
    expect(result.intervalDays, 1);
    expect(result.dueAt, DateTime(2026, 3, 11));
  });

  test('partial changes neither levels nor interval', () {
    const levels = Levels(duration: 0, distance: 0, distraction: 0);
    final state = SkillState(
      dogId: 'dog1',
      skillId: 'rueckruf',
      status: SkillStatus.building,
      levels: levels,
      intervalDays: 1,
    );

    final result = apply(
      state: state,
      targetLevels: targetLevels,
      outcome: Outcome.partial,
      date: DateTime(2026, 3, 10),
      config: config,
    );

    expect(result.levels, levels);
    expect(result.status, SkillStatus.building);
    expect(result.intervalDays, 1);
    expect(result.lastPracticedAt, DateTime(2026, 3, 10));
    expect(result.dueAt, DateTime(2026, 3, 11));
  });

  test('distraction reaches the generalization threshold', () {
    const levels = Levels(duration: 1, distance: 3, distraction: 1);
    final state = SkillState(
      dogId: 'dog1',
      skillId: 'rueckruf',
      status: SkillStatus.building,
      levels: levels,
      history: historyOf(2, Outcome.succeeded, levels),
      intervalDays: 1,
    );

    final result = apply(
      state: state,
      targetLevels: targetLevels,
      outcome: Outcome.succeeded,
      date: DateTime(2026, 3, 10),
      config: config,
    );

    expect(
        result.levels, const Levels(duration: 1, distance: 3, distraction: 2));
    expect(result.status, SkillStatus.generalizing);
    expect(result.intervalDays, 2);
  });

  test('reaching target levels leads to consolidated', () {
    const levels = Levels(duration: 1, distance: 3, distraction: 3);
    final state = SkillState(
      dogId: 'dog1',
      skillId: 'rueckruf',
      status: SkillStatus.generalizing,
      levels: levels,
      history: historyOf(2, Outcome.succeeded, levels),
      intervalDays: 10,
    );

    final result = apply(
      state: state,
      targetLevels: targetLevels,
      outcome: Outcome.succeeded,
      date: DateTime(2026, 3, 10),
      config: config,
    );

    expect(result.levels, targetLevels);
    expect(result.status, SkillStatus.consolidated);
    expect(result.intervalDays, 18);
  });

  test('reportProblem throws maintenance back to generalizing', () {
    final state = SkillState(
      dogId: 'dog1',
      skillId: 'rueckruf',
      status: SkillStatus.maintenance,
      levels: targetLevels,
      intervalDays: 45,
    );

    final result =
        reportProblem(state: state, targetLevels: targetLevels, config: config);

    expect(
        result.levels, const Levels(duration: 1, distance: 3, distraction: 3));
    expect(result.status, SkillStatus.generalizing);
    expect(result.intervalDays, 3);
  });

  test('history keeps only the last ten entries', () {
    const levels = Levels(duration: 0, distance: 0, distraction: 0);
    final state = SkillState(
      dogId: 'dog1',
      skillId: 'rueckruf',
      status: SkillStatus.building,
      levels: levels,
      history: historyOf(10, Outcome.partial, levels),
      intervalDays: 1,
    );

    final result = apply(
      state: state,
      targetLevels: targetLevels,
      outcome: Outcome.partial,
      date: DateTime(2026, 3, 10),
      config: config,
    );

    expect(result.history.length, 10);
  });
}
