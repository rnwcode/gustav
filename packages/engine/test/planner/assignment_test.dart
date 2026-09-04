import 'package:engine/engine.dart';
import 'package:test/test.dart';

void main() {
  const zeroNeeds =
      Needs(physical: 0, mentalWork: 0, scent: 0, social: 0, recovery: 0);

  Activity activity({
    required String id,
    ActivityType type = ActivityType.enrichment,
    int arousal = 1,
    int durationMin = 10,
  }) =>
      Activity(
        id: id,
        title: id,
        sentence: 'sentence',
        type: type,
        needs: zeroNeeds,
        arousal: arousal,
        durationMin: durationMin,
        durationMax: durationMin,
        location: Location.any,
        isRefresher: false,
        heatSuitable: true,
        rainSuitable: true,
        darknessSuitable: true,
        jointStraining: false,
        secondPerson: false,
        minAgeWeeks: 8,
        varianceGroup: id,
        cooldownDays: 10,
        successCriterion: 'criterion',
      );

  ScoredActivity scored(Activity activity, {double score = 0}) =>
      ScoredActivity(activity: activity, score: score);

  PeriodDay day(DateTime date,
          {bool isTrainingDay = true, int timeBudgetMinutes = 30}) =>
      PeriodDay(
          date: date,
          isTrainingDay: isTrainingDay,
          timeBudgetMinutes: timeBudgetMinutes);

  List<DateTime> weekFrom(DateTime start, int count) =>
      List.generate(count, (i) => start.add(Duration(days: i)));

  const config = AssignmentConfig(
    maxActiveSlots: 5,
    maxTrainingSlots: 3,
    minEmptySlots: 1,
    heavyArousalThreshold: 2,
    maxArousalThreshold: 3,
  );

  // Isolates a single rule on a short, two-day (or one-day) sequence —
  // minEmptySlots: 1 would already consume the only fillable slot before
  // the rule under test gets a chance to matter (docs/specs/zuweisen.md).
  const looseConfig = AssignmentConfig(
    maxActiveSlots: 5,
    maxTrainingSlots: 3,
    minEmptySlots: 0,
    heavyArousalThreshold: 2,
    maxArousalThreshold: 3,
  );

  test('the best activities go first, the rest stays empty', () {
    final dates = weekFrom(DateTime(2026, 3, 2), 7);
    final days = dates.map(day).toList();
    final pool = [
      scored(activity(id: 'a'), score: 4),
      scored(activity(id: 'b'), score: 3),
      scored(activity(id: 'c'), score: 2),
      scored(activity(id: 'd'), score: 1),
    ];

    final result = assignToDays(days: days, pool: pool, config: config);

    expect(result.map((r) => r.activityId).toList(), [
      'a',
      'b',
      'c',
      'd',
      null,
      null,
      null,
    ]);
  });

  test('an activity waits for a training day instead of being discarded', () {
    final dates = weekFrom(DateTime(2026, 3, 2), 2);
    final days = [
      day(dates[0], isTrainingDay: false),
      day(dates[1], isTrainingDay: true),
    ];
    final pool = [scored(activity(id: 'recall', type: ActivityType.training))];

    final result = assignToDays(days: days, pool: pool, config: config);

    expect(result[0].activityId, isNull);
    expect(result[1].activityId, 'recall');
  });

  test('the training-slot cap is enforced even if a matching activity remains',
      () {
    final dates = weekFrom(DateTime(2026, 3, 2), 3);
    final days = dates.map(day).toList();
    final pool = [
      scored(activity(id: 't1', type: ActivityType.training), score: 3),
      scored(activity(id: 't2', type: ActivityType.training), score: 2),
      scored(activity(id: 't3', type: ActivityType.training), score: 1),
    ];
    const capped = AssignmentConfig(
      maxActiveSlots: 5,
      maxTrainingSlots: 2,
      minEmptySlots: 0,
      heavyArousalThreshold: 2,
      maxArousalThreshold: 3,
    );

    final result = assignToDays(days: days, pool: pool, config: capped);

    expect(result.map((r) => r.activityId).toList(), ['t1', 't2', null]);
  });

  test('duration must fit the day\'s time budget', () {
    final days = [day(DateTime(2026, 3, 2), timeBudgetMinutes: 5)];
    final pool = [
      scored(activity(id: 'long', durationMin: 15), score: 2),
      scored(activity(id: 'short', durationMin: 5), score: 1),
    ];

    final result = assignToDays(days: days, pool: pool, config: looseConfig);

    expect(result.single.activityId, 'short');
  });

  test('only rest or enrichment is admitted after a heavy day', () {
    final dates = weekFrom(DateTime(2026, 3, 2), 2);
    final days = dates.map(day).toList();
    final pool = [
      scored(activity(id: 'heavy-day1', arousal: 2), score: 5),
      scored(
          activity(
              id: 'training-hard', type: ActivityType.training, arousal: 2),
          score: 4),
      scored(activity(id: 'rest-easy', type: ActivityType.rest, arousal: 0),
          score: 1),
    ];

    final result = assignToDays(days: days, pool: pool, config: looseConfig);

    expect(result[0].activityId, 'heavy-day1');
    expect(result[1].activityId, 'rest-easy');
  });

  test('never two maximum-arousal days in a row', () {
    final dates = weekFrom(DateTime(2026, 3, 2), 2);
    final days = dates.map(day).toList();
    final pool = [
      scored(activity(id: 'max-day1', arousal: 3), score: 5),
      scored(activity(id: 'also-max', arousal: 3), score: 4),
      scored(activity(id: 'moderate', arousal: 2), score: 3),
    ];

    final result = assignToDays(days: days, pool: pool, config: looseConfig);

    expect(result[0].activityId, 'max-day1');
    expect(result[1].activityId, 'moderate');
  });

  group('the shortest day', () {
    test('excludes demanding activities when days actually differ', () {
      final dates = weekFrom(DateTime(2026, 3, 2), 2);
      final days = [
        day(dates[0], timeBudgetMinutes: 10),
        day(dates[1], timeBudgetMinutes: 60),
      ];
      final pool = [scored(activity(id: 'hard', arousal: 2, durationMin: 10))];

      final result = assignToDays(days: days, pool: pool, config: config);

      expect(result[0].activityId, isNull);
      expect(result[1].activityId, 'hard');
    });

    test('does not apply when every day has the same budget', () {
      final dates = weekFrom(DateTime(2026, 3, 2), 2);
      final days = dates.map((d) => day(d, timeBudgetMinutes: 10)).toList();
      final pool = [scored(activity(id: 'hard', arousal: 2, durationMin: 10))];

      final result = assignToDays(days: days, pool: pool, config: config);

      expect(result[0].activityId, 'hard');
    });
  });

  test('minEmptySlots is respected even if enough candidates remain', () {
    final dates = weekFrom(DateTime(2026, 3, 2), 3);
    final days = dates.map(day).toList();
    final pool = [
      scored(activity(id: 'a'), score: 3),
      scored(activity(id: 'b'), score: 2),
      scored(activity(id: 'c'), score: 1),
    ];

    final result = assignToDays(days: days, pool: pool, config: config);

    expect(result.map((r) => r.activityId).toList(), ['a', 'b', null]);
  });

  test('each activity is used at most once per period', () {
    final dates = weekFrom(DateTime(2026, 3, 2), 2);
    final days = dates.map(day).toList();
    final pool = [scored(activity(id: 'only-one'))];
    const noEmptyRequired = AssignmentConfig(
      maxActiveSlots: 5,
      maxTrainingSlots: 3,
      minEmptySlots: 0,
      heavyArousalThreshold: 2,
      maxArousalThreshold: 3,
    );

    final result =
        assignToDays(days: days, pool: pool, config: noEmptyRequired);

    expect(result[0].activityId, 'only-one');
    expect(result[1].activityId, isNull);
  });
}
