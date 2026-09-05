import { assertEquals } from '../dev_deps.ts';
import type { Activity, Needs } from '../models/activity.ts';
import type { ActivityType } from '../models/enums.ts';
import type { DayAssignment } from './assignment.ts';
import { crossCheckPeriod } from './cross_check.ts';

// Fixtures from docs/specs/gegenpruefen.md.

const ZERO_NEEDS: Needs = { physical: 0, mentalWork: 0, scent: 0, social: 0, recovery: 0 };
const ALL_NEEDS_COVERED: Needs = {
  physical: 1,
  mentalWork: 1,
  scent: 1,
  social: 1,
  recovery: 1,
};

function activity(overrides: {
  id: string;
  type?: ActivityType;
  needs?: Needs;
}): Activity {
  const id = overrides.id;
  return {
    id,
    title: id,
    sentence: 'sentence',
    type: overrides.type ?? 'enrichment',
    trainsSkill: null,
    needs: overrides.needs ?? ZERO_NEEDS,
    arousal: 0,
    durationMin: 5,
    durationMax: 10,
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
    varianceGroup: 'default',
    cooldownDays: 10,
    illustration: null,
    instructions: [],
    successCriterion: 'criterion',
    commonMistakes: [],
    troubleshooting: [],
  };
}

function scored(id: string, score: number, overrides: { type?: ActivityType; needs?: Needs } = {}) {
  return { activity: activity({ id, ...overrides }), score };
}

function date(day: number): Date {
  return new Date(`2026-03-${String(day).padStart(2, '0')}T00:00:00.000Z`);
}

Deno.test('a missing need dimension is swapped in at the weakest assigned slot', () => {
  const a = scored('a', 5, { needs: { ...ZERO_NEEDS, physical: 2 } });
  const b = scored('b', 4, { needs: { ...ZERO_NEEDS, mentalWork: 2 } });
  const c = scored('c', 1, { needs: { ...ZERO_NEEDS, scent: 3 } });

  const assignments: DayAssignment[] = [
    { date: date(1), activityId: 'a' },
    { date: date(2), activityId: 'b' },
    { date: date(3), activityId: null },
  ];

  const result = crossCheckPeriod({
    assignments,
    pool: [a, b, c],
    maxTrainingSlots: 5,
  });

  assertEquals(result, [
    { date: date(1), activityId: 'a' },
    { date: date(2), activityId: 'c' },
    { date: date(3), activityId: null },
  ]);
});

Deno.test('a need gap with no covering candidate in the pool is left unfixed', () => {
  const a = scored('a', 5, { needs: { ...ZERO_NEEDS, physical: 2 } });
  const b = scored('b', 4, { needs: { ...ZERO_NEEDS, mentalWork: 2 } });

  const assignments: DayAssignment[] = [
    { date: date(1), activityId: 'a' },
    { date: date(2), activityId: 'b' },
  ];

  const result = crossCheckPeriod({ assignments, pool: [a, b], maxTrainingSlots: 5 });

  assertEquals(result, assignments);
});

Deno.test('exceeding the training cap empties the weakest training slot', () => {
  const recall = scored('recall', 8, { type: 'training', needs: ALL_NEEDS_COVERED });
  const sit = scored('sit', 3, { type: 'training', needs: ALL_NEEDS_COVERED });

  const assignments: DayAssignment[] = [
    { date: date(1), activityId: 'recall' },
    { date: date(2), activityId: 'sit' },
  ];

  const result = crossCheckPeriod({
    assignments,
    pool: [recall, sit],
    maxTrainingSlots: 1,
  });

  assertEquals(result, [
    { date: date(1), activityId: 'recall' },
    { date: date(2), activityId: null },
  ]);
});

Deno.test('no empty slot empties the overall weakest slot', () => {
  const a = scored('a', 5, { needs: ALL_NEEDS_COVERED });
  const b = scored('b', 4, { needs: ALL_NEEDS_COVERED });

  const assignments: DayAssignment[] = [
    { date: date(1), activityId: 'a' },
    { date: date(2), activityId: 'b' },
  ];

  const result = crossCheckPeriod({ assignments, pool: [a, b], maxTrainingSlots: 5 });

  assertEquals(result, [
    { date: date(1), activityId: 'a' },
    { date: date(2), activityId: null },
  ]);
});

Deno.test('only the first failing check is corrected in one pass', () => {
  // Missing "scent" (check 1) AND no empty slot (check 3) at the same time.
  const a = scored('a', 5, { needs: { ...ZERO_NEEDS, physical: 2 } });
  const b = scored('b', 4, { needs: { ...ZERO_NEEDS, mentalWork: 2 } });
  const c = scored('c', 1, { needs: { ...ZERO_NEEDS, scent: 3, social: 1, recovery: 1 } });

  const assignments: DayAssignment[] = [
    { date: date(1), activityId: 'a' },
    { date: date(2), activityId: 'b' },
  ];

  const result = crossCheckPeriod({ assignments, pool: [a, b, c], maxTrainingSlots: 5 });

  // Check 1 fixed (b -> c); check 3 (still no empty slot) is left for a later pass.
  assertEquals(result, [
    { date: date(1), activityId: 'a' },
    { date: date(2), activityId: 'c' },
  ]);
});

Deno.test('everything already satisfied leaves the assignments unchanged', () => {
  const a = scored('a', 5, { needs: ALL_NEEDS_COVERED });

  const assignments: DayAssignment[] = [
    { date: date(1), activityId: 'a' },
    { date: date(2), activityId: null },
  ];

  const result = crossCheckPeriod({ assignments, pool: [a], maxTrainingSlots: 5 });

  assertEquals(result, assignments);
});
