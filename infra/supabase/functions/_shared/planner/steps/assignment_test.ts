import { assertEquals } from '../dev_deps.ts';
import type { Activity, Needs } from '../models/activity.ts';
import type { ActivityType } from '../models/enums.ts';
import type { AssignmentConfig } from './assignment_config.ts';
import type { PeriodDay } from './assignment.ts';
import type { ScoredActivity } from './scoring.ts';
import { assignToDays } from './assignment.ts';

const ZERO_NEEDS: Needs = { physical: 0, mentalWork: 0, scent: 0, social: 0, recovery: 0 };

function activity(overrides: {
  id: string;
  type?: ActivityType;
  arousal?: number;
  durationMin?: number;
}): Activity {
  const durationMin = overrides.durationMin ?? 10;
  return {
    id: overrides.id,
    title: overrides.id,
    sentence: 'sentence',
    type: overrides.type ?? 'enrichment',
    trainsSkill: null,
    needs: ZERO_NEEDS,
    arousal: overrides.arousal ?? 1,
    durationMin,
    durationMax: durationMin,
    location: 'any',
    forDistraction: null,
    isRefresher: false,
    heatSuitable: true,
    rainSuitable: true,
    darknessSuitable: true,
    jointStraining: false,
    seasonalWindow: null,
    equipment: [],
    secondPerson: false,
    minAgeWeeks: 8,
    maxAgeWeeks: null,
    suitability: new Map(),
    varianceGroup: overrides.id,
    cooldownDays: 10,
    illustration: null,
    instructions: [],
    successCriterion: 'criterion',
    commonMistakes: [],
    troubleshooting: [],
  };
}

function scored(a: Activity, score = 0): ScoredActivity {
  return { activity: a, score };
}

function day(
  date: Date,
  overrides: { isTrainingDay?: boolean; timeBudgetMinutes?: number } = {},
): PeriodDay {
  return {
    date,
    isTrainingDay: overrides.isTrainingDay ?? true,
    timeBudgetMinutes: overrides.timeBudgetMinutes ?? 30,
  };
}

function weekFrom(start: Date, count: number): Date[] {
  return Array.from(
    { length: count },
    (_, i) => new Date(start.getTime() + i * 24 * 60 * 60 * 1000),
  );
}

const config: AssignmentConfig = {
  maxActiveSlots: 5,
  maxTrainingSlots: 3,
  minEmptySlots: 1,
  heavyArousalThreshold: 2,
  maxArousalThreshold: 3,
};

// Isolates a single rule on a short, two-day (or one-day) sequence —
// minEmptySlots: 1 would already consume the only fillable slot before
// the rule under test gets a chance to matter (docs/specs/zuweisen.md).
const looseConfig: AssignmentConfig = { ...config, minEmptySlots: 0 };

Deno.test('the best activities go first, the rest stays empty', () => {
  const dates = weekFrom(new Date(2026, 2, 2), 7);
  const days = dates.map((d) => day(d));
  const pool = [
    scored(activity({ id: 'a' }), 4),
    scored(activity({ id: 'b' }), 3),
    scored(activity({ id: 'c' }), 2),
    scored(activity({ id: 'd' }), 1),
  ];

  const result = assignToDays({ days, pool, config });

  assertEquals(result.map((r) => r.activityId), ['a', 'b', 'c', 'd', null, null, null]);
});

Deno.test('an activity waits for a training day instead of being discarded', () => {
  const dates = weekFrom(new Date(2026, 2, 2), 2);
  const days = [day(dates[0]!, { isTrainingDay: false }), day(dates[1]!, { isTrainingDay: true })];
  const pool = [scored(activity({ id: 'recall', type: 'training' }))];

  const result = assignToDays({ days, pool, config });

  assertEquals(result[0]!.activityId, null);
  assertEquals(result[1]!.activityId, 'recall');
});

Deno.test('the training-slot cap is enforced even if a matching activity remains', () => {
  const dates = weekFrom(new Date(2026, 2, 2), 3);
  const days = dates.map((d) => day(d));
  const pool = [
    scored(activity({ id: 't1', type: 'training' }), 3),
    scored(activity({ id: 't2', type: 'training' }), 2),
    scored(activity({ id: 't3', type: 'training' }), 1),
  ];
  const capped: AssignmentConfig = { ...config, maxTrainingSlots: 2, minEmptySlots: 0 };

  const result = assignToDays({ days, pool, config: capped });

  assertEquals(result.map((r) => r.activityId), ['t1', 't2', null]);
});

Deno.test("duration must fit the day's time budget", () => {
  const days = [day(new Date(2026, 2, 2), { timeBudgetMinutes: 5 })];
  const pool = [
    scored(activity({ id: 'long', durationMin: 15 }), 2),
    scored(activity({ id: 'short', durationMin: 5 }), 1),
  ];

  const result = assignToDays({ days, pool, config: looseConfig });

  assertEquals(result[0]!.activityId, 'short');
});

Deno.test('only rest or enrichment is admitted after a heavy day', () => {
  const dates = weekFrom(new Date(2026, 2, 2), 2);
  const days = dates.map((d) => day(d));
  const pool = [
    scored(activity({ id: 'heavy-day1', arousal: 2 }), 5),
    scored(activity({ id: 'training-hard', type: 'training', arousal: 2 }), 4),
    scored(activity({ id: 'rest-easy', type: 'rest', arousal: 0 }), 1),
  ];

  const result = assignToDays({ days, pool, config: looseConfig });

  assertEquals(result[0]!.activityId, 'heavy-day1');
  assertEquals(result[1]!.activityId, 'rest-easy');
});

Deno.test('never two maximum-arousal days in a row', () => {
  const dates = weekFrom(new Date(2026, 2, 2), 2);
  const days = dates.map((d) => day(d));
  const pool = [
    scored(activity({ id: 'max-day1', arousal: 3 }), 5),
    scored(activity({ id: 'also-max', arousal: 3 }), 4),
    scored(activity({ id: 'moderate', arousal: 2 }), 3),
  ];

  const result = assignToDays({ days, pool, config: looseConfig });

  assertEquals(result[0]!.activityId, 'max-day1');
  assertEquals(result[1]!.activityId, 'moderate');
});

Deno.test('the shortest day excludes demanding activities when days actually differ', () => {
  const dates = weekFrom(new Date(2026, 2, 2), 2);
  const days = [
    day(dates[0]!, { timeBudgetMinutes: 10 }),
    day(dates[1]!, { timeBudgetMinutes: 60 }),
  ];
  const pool = [scored(activity({ id: 'hard', arousal: 2, durationMin: 10 }))];

  const result = assignToDays({ days, pool, config });

  assertEquals(result[0]!.activityId, null);
  assertEquals(result[1]!.activityId, 'hard');
});

Deno.test('the shortest-day rule does not apply when every day has the same budget', () => {
  const dates = weekFrom(new Date(2026, 2, 2), 2);
  const days = dates.map((d) => day(d, { timeBudgetMinutes: 10 }));
  const pool = [scored(activity({ id: 'hard', arousal: 2, durationMin: 10 }))];

  const result = assignToDays({ days, pool, config });

  assertEquals(result[0]!.activityId, 'hard');
});

Deno.test('minEmptySlots is respected even if enough candidates remain', () => {
  const dates = weekFrom(new Date(2026, 2, 2), 3);
  const days = dates.map((d) => day(d));
  const pool = [
    scored(activity({ id: 'a' }), 3),
    scored(activity({ id: 'b' }), 2),
    scored(activity({ id: 'c' }), 1),
  ];

  const result = assignToDays({ days, pool, config });

  assertEquals(result.map((r) => r.activityId), ['a', 'b', null]);
});

Deno.test('each activity is used at most once per period', () => {
  const dates = weekFrom(new Date(2026, 2, 2), 2);
  const days = dates.map((d) => day(d));
  const pool = [scored(activity({ id: 'only-one' }))];
  const noEmptyRequired: AssignmentConfig = { ...config, minEmptySlots: 0 };

  const result = assignToDays({ days, pool, config: noEmptyRequired });

  assertEquals(result[0]!.activityId, 'only-one');
  assertEquals(result[1]!.activityId, null);
});
