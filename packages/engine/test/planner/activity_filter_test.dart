import 'package:engine/engine.dart';
import 'package:test/test.dart';

void main() {
  const zeroNeeds =
      Needs(physical: 0, mentalWork: 0, scent: 0, social: 0, recovery: 0);

  Activity activity({
    String id = 'a1',
    ActivityType type = ActivityType.enrichment,
    String? trainsSkill,
    int arousal = 1,
    int minAgeWeeks = 8,
    int? maxAgeWeeks,
    List<String> equipment = const [],
    bool secondPerson = false,
    bool jointStraining = false,
    Location location = Location.any,
    List<int>? seasonalWindow,
    String varianceGroup = 'default',
    int cooldownDays = 10,
    bool isRefresher = false,
    (int, int)? forDistraction,
  }) =>
      Activity(
        id: id,
        title: id,
        sentence: 'sentence',
        type: type,
        trainsSkill: trainsSkill,
        needs: zeroNeeds,
        arousal: arousal,
        durationMin: 5,
        durationMax: 10,
        location: location,
        forDistraction: forDistraction,
        isRefresher: isRefresher,
        heatSuitable: true,
        rainSuitable: true,
        darknessSuitable: true,
        jointStraining: jointStraining,
        seasonalWindow: seasonalWindow,
        equipment: equipment,
        secondPerson: secondPerson,
        minAgeWeeks: minAgeWeeks,
        maxAgeWeeks: maxAgeWeeks,
        varianceGroup: varianceGroup,
        cooldownDays: cooldownDays,
        successCriterion: 'criterion',
      );

  SkillFocus focus({
    required String skillId,
    Levels levels = const Levels(duration: 0, distance: 0, distraction: 0),
    SkillStatus status = SkillStatus.building,
  }) =>
      SkillFocus(
        skillId: skillId,
        levels: levels,
        priority: 0,
        overdueDays: 0,
        isNewSkill: false,
        status: status,
      );

  const config = ActivityFilterConfig(
    settlingInWeeks: 6,
    settlingInMaxArousal: 2,
    settlingInMaxDistraction: 1,
    restrictionArousalCeiling: {
      Restriction.protectiveCare: 2,
      Restriction.recovery: 2
    },
  );

  List<Activity> run({
    required List<Activity> catalog,
    CandidatePool candidates = const CandidatePool(),
    Set<String> coreSkillIds = const {},
    int dogAgeWeeks = 40,
    Set<Restriction> restrictions = const {},
    int weeksSinceArrival = 52,
    List<String> householdEquipment = const [],
    int householdSize = 1,
    List<Location> allowedLocations = const [],
    DateTime? today,
    Map<String, DateTime> lastUsedByVarianceGroup = const {},
  }) =>
      filterActivities(
        catalog: catalog,
        candidates: candidates,
        coreSkillIds: coreSkillIds,
        dogAgeWeeks: dogAgeWeeks,
        restrictions: restrictions,
        weeksSinceArrival: weeksSinceArrival,
        householdEquipment: householdEquipment,
        householdSize: householdSize,
        allowedLocations: allowedLocations,
        today: today ?? DateTime(2026, 3, 12),
        lastUsedByVarianceGroup: lastUsedByVarianceGroup,
        config: config,
      );

  test('an unremarkable activity passes every rule', () {
    final result = run(catalog: [activity()]);
    expect(result, hasLength(1));
  });

  test('too young is excluded', () {
    final result = run(catalog: [activity(minAgeWeeks: 20)], dogAgeWeeks: 12);
    expect(result, isEmpty);
  });

  test('a skill not in the candidate pool excludes its activities', () {
    final result = run(catalog: [activity(trainsSkill: 'sit')]);
    expect(result, isEmpty);
  });

  test('missing equipment excludes, present equipment admits', () {
    final withoutClicker = run(catalog: [
      activity(equipment: const ['clicker'])
    ]);
    expect(withoutClicker, isEmpty);

    final withClicker = run(
      catalog: [
        activity(equipment: const ['clicker'])
      ],
      householdEquipment: const ['clicker'],
    );
    expect(withClicker, hasLength(1));
  });

  test('a restriction lowers the admissible arousal', () {
    final tooArousing = run(
      catalog: [activity(arousal: 2)],
      restrictions: const {Restriction.protectiveCare},
    );
    expect(tooArousing, isEmpty);

    final fine = run(
      catalog: [activity(arousal: 1)],
      restrictions: const {Restriction.protectiveCare},
    );
    expect(fine, hasLength(1));
  });

  test('joint issues exclude joint-straining activities', () {
    final result = run(
      catalog: [activity(jointStraining: true)],
      restrictions: const {Restriction.jointIssues},
    );
    expect(result, isEmpty);
  });

  test('cooldown excludes recent variance groups, except for core skills', () {
    final today = DateTime(2026, 3, 12);
    final recentlyUsed = {'nose-work': today.subtract(const Duration(days: 3))};

    final nonCore = run(
      catalog: [
        activity(
          id: 'sniff',
          trainsSkill: 'sniffing',
          varianceGroup: 'nose-work',
          cooldownDays: 10,
        ),
      ],
      candidates: CandidatePool(skills: [focus(skillId: 'sniffing')]),
      today: today,
      lastUsedByVarianceGroup: recentlyUsed,
    );
    expect(nonCore, isEmpty);

    final core = run(
      catalog: [
        activity(
          id: 'recall-refresher',
          trainsSkill: 'recall',
          varianceGroup: 'nose-work',
          cooldownDays: 10,
        ),
      ],
      candidates: CandidatePool(skills: [focus(skillId: 'recall')]),
      coreSkillIds: const {'recall'},
      today: today,
      lastUsedByVarianceGroup: recentlyUsed,
    );
    expect(core, hasLength(1));
  });

  test('settling-in caps arousal and, for training, the distraction range', () {
    final tooArousing =
        run(catalog: [activity(arousal: 3)], weeksSinceArrival: 2);
    expect(tooArousing, isEmpty);

    final rangeTooWide = run(
      catalog: [
        activity(
          id: 'recall-training',
          type: ActivityType.training,
          trainsSkill: 'recall',
          forDistraction: (0, 3),
        ),
      ],
      candidates: CandidatePool(
        skills: [
          focus(
              skillId: 'recall',
              levels: const Levels(duration: 0, distance: 0, distraction: 1))
        ],
      ),
      weeksSinceArrival: 2,
    );
    expect(rangeTooWide, isEmpty);
  });

  test('a training activity must cover the skill\'s current distraction level',
      () {
    final poolAtLevel2 = CandidatePool(
      skills: [
        focus(
            skillId: 'recall',
            levels: const Levels(duration: 0, distance: 0, distraction: 2))
      ],
    );

    final tooEasy = run(
      catalog: [
        activity(
          id: 'recall-easy',
          type: ActivityType.training,
          trainsSkill: 'recall',
          forDistraction: (0, 1),
        ),
      ],
      candidates: poolAtLevel2,
    );
    expect(tooEasy, isEmpty);

    final matching = run(
      catalog: [
        activity(
          id: 'recall-match',
          type: ActivityType.training,
          trainsSkill: 'recall',
          forDistraction: (2, 4),
        ),
      ],
      candidates: poolAtLevel2,
    );
    expect(matching, hasLength(1));
  });

  test('a consolidated skill only admits refresher activities', () {
    final poolConsolidated = CandidatePool(
      skills: [
        focus(
          skillId: 'recall',
          levels: const Levels(duration: 1, distance: 3, distraction: 2),
          status: SkillStatus.consolidated,
        ),
      ],
    );

    final fullSession = run(
      catalog: [
        activity(
          id: 'recall-full',
          type: ActivityType.training,
          trainsSkill: 'recall',
          forDistraction: (2, 4),
        ),
      ],
      candidates: poolConsolidated,
    );
    expect(fullSession, isEmpty);

    final refresher = run(
      catalog: [
        activity(
          id: 'recall-refresh',
          type: ActivityType.training,
          trainsSkill: 'recall',
          forDistraction: (2, 4),
          isRefresher: true,
        ),
      ],
      candidates: poolConsolidated,
    );
    expect(refresher, hasLength(1));
  });
}
