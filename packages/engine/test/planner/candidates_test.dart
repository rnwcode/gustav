import 'package:engine/engine.dart';
import 'package:test/test.dart';

void main() {
  Skill skill({
    required String id,
    List<String> prerequisites = const [],
    int minAgeWeeks = 8,
  }) =>
      Skill(
        id: id,
        name: id,
        category: SkillCategory.basicCue,
        prerequisites: prerequisites,
        minAgeWeeks: minAgeWeeks,
        isCoreSkill: true,
        targetLevels: const Levels(duration: 1, distance: 3, distraction: 4),
        description: 'test skill',
      );

  SkillState state({
    required String skillId,
    required SkillStatus status,
    Levels levels = const Levels(duration: 1, distance: 3, distraction: 2),
    DateTime? dueAt,
  }) =>
      SkillState(
        dogId: 'dog1',
        skillId: skillId,
        status: status,
        levels: levels,
        dueAt: dueAt,
        intervalDays: 3,
      );

  const config = CandidateConfig(
    needTargets: {NeedDimension.scent: 5, NeedDimension.social: 3},
  );

  test('a due refresher becomes a skill focus', () {
    final pool = collectCandidates(
      skillStates: {
        'rueckruf': state(
          skillId: 'rueckruf',
          status: SkillStatus.generalizing,
          levels: const Levels(duration: 1, distance: 3, distraction: 2),
          dueAt: DateTime(2026, 3, 10),
        ),
      },
      catalog: [skill(id: 'rueckruf')],
      dogAgeWeeks: 40,
      priorities: const [],
      periodEnd: DateTime(2026, 3, 12),
      needCoverageLastPeriod: const {},
      config: config,
    );

    expect(pool.skills, hasLength(1));
    final focus = pool.skills.single;
    expect(focus.skillId, 'rueckruf');
    expect(
        focus.levels, const Levels(duration: 1, distance: 3, distraction: 2));
    expect(focus.priority, 0);
    expect(focus.overdueDays, 2);
    expect(focus.isNewSkill, false);
  });

  test('a priority raises a not-yet-due skill', () {
    final pool = collectCandidates(
      skillStates: {
        'leash': state(
          skillId: 'leash',
          status: SkillStatus.building,
          levels: const Levels(duration: 0, distance: 1, distraction: 0),
          dueAt: DateTime(2026, 3, 20),
        ),
      },
      catalog: [skill(id: 'leash')],
      dogAgeWeeks: 40,
      priorities: const [Priority(skillIdOrTopic: 'leash', weight: 3)],
      periodEnd: DateTime(2026, 3, 12),
      needCoverageLastPeriod: const {},
      config: config,
    );

    expect(pool.skills, hasLength(1));
    final focus = pool.skills.single;
    expect(focus.priority, 3);
    expect(focus.overdueDays, 0);
  });

  test('due and prioritized merge into a single focus', () {
    final pool = collectCandidates(
      skillStates: {
        'rueckruf': state(
          skillId: 'rueckruf',
          status: SkillStatus.generalizing,
          levels: const Levels(duration: 1, distance: 3, distraction: 2),
          dueAt: DateTime(2026, 3, 10),
        ),
      },
      catalog: [skill(id: 'rueckruf')],
      dogAgeWeeks: 40,
      priorities: const [Priority(skillIdOrTopic: 'rueckruf', weight: 2)],
      periodEnd: DateTime(2026, 3, 12),
      needCoverageLastPeriod: const {},
      config: config,
    );

    expect(pool.skills, hasLength(1));
    final focus = pool.skills.single;
    expect(focus.priority, 2);
    expect(focus.overdueDays, 2);
  });

  group('new skill discovery', () {
    final catalog = [
      skill(id: 'recall', prerequisites: ['name-focus'], minAgeWeeks: 9)
    ];

    test('appears once the prerequisite reached generalizing', () {
      final pool = collectCandidates(
        skillStates: {
          'name-focus':
              state(skillId: 'name-focus', status: SkillStatus.generalizing)
        },
        catalog: catalog,
        dogAgeWeeks: 12,
        priorities: const [],
        periodEnd: DateTime(2026, 3, 12),
        needCoverageLastPeriod: const {},
        config: config,
      );

      expect(pool.skills, hasLength(1));
      final focus = pool.skills.single;
      expect(focus.skillId, 'recall');
      expect(focus.isNewSkill, true);
      expect(
          focus.levels, const Levels(duration: 0, distance: 0, distraction: 0));
      expect(focus.priority, 0);
      expect(focus.overdueDays, 0);
    });

    test('does not appear while the prerequisite is still building', () {
      final pool = collectCandidates(
        skillStates: {
          'name-focus':
              state(skillId: 'name-focus', status: SkillStatus.building)
        },
        catalog: catalog,
        dogAgeWeeks: 12,
        priorities: const [],
        periodEnd: DateTime(2026, 3, 12),
        needCoverageLastPeriod: const {},
        config: config,
      );

      expect(pool.skills, isEmpty);
    });

    test('does not appear before the minimum age, regardless of prerequisites',
        () {
      final pool = collectCandidates(
        skillStates: const {},
        catalog: catalog,
        dogAgeWeeks: 7,
        priorities: const [],
        periodEnd: DateTime(2026, 3, 12),
        needCoverageLastPeriod: const {},
        config: config,
      );

      expect(pool.skills, isEmpty);
    });
  });

  test('need gaps are collected, including dimensions with no coverage at all',
      () {
    final pool = collectCandidates(
      skillStates: const {},
      catalog: const [],
      dogAgeWeeks: 40,
      priorities: const [],
      periodEnd: DateTime(2026, 3, 12),
      needCoverageLastPeriod: const {NeedDimension.scent: 2},
      config: config,
    );

    expect(
        pool.needs,
        unorderedEquals([
          const NeedFocus(dimension: NeedDimension.scent, gap: 3),
          const NeedFocus(dimension: NeedDimension.social, gap: 3),
        ]));
  });
}
