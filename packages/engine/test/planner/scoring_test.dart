import 'package:engine/engine.dart';
import 'package:test/test.dart';

void main() {
  const zeroNeeds =
      Needs(physical: 0, mentalWork: 0, scent: 0, social: 0, recovery: 0);

  Activity activity({
    String id = 'a1',
    String? trainsSkill,
    int arousal = 0,
    Needs needs = zeroNeeds,
    Map<BreedGroup, int> suitability = const {},
  }) =>
      Activity(
        id: id,
        title: id,
        sentence: 'sentence',
        type: ActivityType.enrichment,
        trainsSkill: trainsSkill,
        needs: needs,
        arousal: arousal,
        durationMin: 5,
        durationMax: 10,
        location: Location.any,
        isRefresher: false,
        heatSuitable: true,
        rainSuitable: true,
        darknessSuitable: true,
        jointStraining: false,
        secondPerson: false,
        minAgeWeeks: 8,
        suitability: suitability,
        varianceGroup: 'default',
        cooldownDays: 10,
        successCriterion: 'criterion',
      );

  SkillFocus focus({
    required String skillId,
    int priority = 0,
    int overdueDays = 0,
    bool isNewSkill = false,
  }) =>
      SkillFocus(
        skillId: skillId,
        levels: const Levels(duration: 0, distance: 0, distraction: 0),
        priority: priority,
        overdueDays: overdueDays,
        isNewSkill: isNewSkill,
        status: SkillStatus.building,
      );

  const config = ScoringConfig(
    priorityWeight: 3.0,
    overdueWeight: 2.0,
    overdueCap: 3.0,
    needGapWeight: 2.0,
    newSkillWeight: 1.0,
    suitabilityWeight: 1.0,
    arousalAtRecoveryNeedWeight: -3.0,
    recentlyDoneWeight: -2.0,
    recentlyDoneDays: 10,
  );

  final today = DateTime(2026, 3, 12);

  List<ScoredActivity> run({
    required List<Activity> pool,
    CandidatePool candidates = const CandidatePool(),
    BreedGroup breedGroup = BreedGroup.herding,
    RecoveryNeed recoveryNeed = RecoveryNeed.none,
    Map<String, DateTime> lastUsedByActivityId = const {},
  }) =>
      scoreActivities(
        pool: pool,
        candidates: candidates,
        breedGroup: breedGroup,
        recoveryNeed: recoveryNeed,
        lastUsedByActivityId: lastUsedByActivityId,
        today: today,
        config: config,
      );

  test('priority', () {
    final result = run(
      pool: [activity(id: 'recall', trainsSkill: 'recall')],
      candidates:
          CandidatePool(skills: [focus(skillId: 'recall', priority: 3)]),
    );
    expect(result.single.score, closeTo(9.0, 1e-9));
  });

  test('overdue is capped', () {
    final oneWeek = run(
      pool: [activity(id: 'recall', trainsSkill: 'recall')],
      candidates:
          CandidatePool(skills: [focus(skillId: 'recall', overdueDays: 7)]),
    );
    expect(oneWeek.single.score, closeTo(2.0, 1e-9));

    final fourWeeks = run(
      pool: [activity(id: 'recall', trainsSkill: 'recall')],
      candidates:
          CandidatePool(skills: [focus(skillId: 'recall', overdueDays: 28)]),
    );
    expect(fourWeeks.single.score, closeTo(6.0, 1e-9));
  });

  test('need gap only counts dimensions that actually have a gap', () {
    final pool = CandidatePool(
      needs: const [
        NeedFocus(dimension: NeedDimension.scent, gap: 3),
        NeedFocus(dimension: NeedDimension.social, gap: 2),
      ],
    );

    final coversGap = run(
      pool: [
        activity(
          id: 'sniff',
          needs: const Needs(
              physical: 0, mentalWork: 0, scent: 2, social: 1, recovery: 0),
        ),
      ],
      candidates: pool,
    );
    expect(coversGap.single.score, closeTo(6.0, 1e-9));

    final missesGap = run(
      pool: [
        activity(
          id: 'fetch',
          needs: const Needs(
              physical: 3, mentalWork: 0, scent: 0, social: 0, recovery: 0),
        ),
      ],
      candidates: pool,
    );
    expect(missesGap.single.score, closeTo(0.0, 1e-9));
  });

  test('new skill bonus', () {
    final result = run(
      pool: [activity(id: 'recall', trainsSkill: 'recall')],
      candidates:
          CandidatePool(skills: [focus(skillId: 'recall', isNewSkill: true)]),
    );
    expect(result.single.score, closeTo(1.0, 1e-9));
  });

  test('suitability, missing entry counts as neutral', () {
    final withEntry = run(
      pool: [
        activity(id: 'a', suitability: const {BreedGroup.herding: 2}),
      ],
      breedGroup: BreedGroup.herding,
    );
    expect(withEntry.single.score, closeTo(2.0, 1e-9));

    final withoutEntry = run(pool: [activity(id: 'b', suitability: const {})]);
    expect(withoutEntry.single.score, closeTo(0.0, 1e-9));
  });

  test('the arousal penalty only applies once recovery need is elevated', () {
    final none = run(
      pool: [activity(id: 'a', arousal: 3)],
      recoveryNeed: RecoveryNeed.none,
    );
    expect(none.single.score, closeTo(0.0, 1e-9));

    final medium = run(
      pool: [activity(id: 'a', arousal: 3)],
      recoveryNeed: RecoveryNeed.medium,
    );
    expect(medium.single.score, closeTo(-9.0, 1e-9));
  });

  test('recently-done penalty', () {
    final recent = run(
      pool: [activity(id: 'sniff')],
      lastUsedByActivityId: {'sniff': today.subtract(const Duration(days: 5))},
    );
    expect(recent.single.score, closeTo(-2.0, 1e-9));

    final longAgo = run(
      pool: [activity(id: 'sniff')],
      lastUsedByActivityId: {'sniff': today.subtract(const Duration(days: 15))},
    );
    expect(longAgo.single.score, closeTo(0.0, 1e-9));
  });

  test('everything combined', () {
    final result = run(
      pool: [
        activity(
            id: 'recall',
            trainsSkill: 'recall',
            suitability: const {BreedGroup.herding: 1})
      ],
      candidates: CandidatePool(
          skills: [focus(skillId: 'recall', priority: 2, overdueDays: 14)]),
      breedGroup: BreedGroup.herding,
    );
    expect(result.single.score, closeTo(11.0, 1e-9));
  });

  test('deterministic tie-break by activity id when scores are equal', () {
    final result = run(pool: [activity(id: 'zebra'), activity(id: 'apple')]);
    expect(result.map((r) => r.activity.id).toList(), ['apple', 'zebra']);
  });
}
