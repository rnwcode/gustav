import { assertEquals } from '../dev_deps.ts';
import type { Activity, Needs } from '../models/activity.ts';
import type { NeedFocus, SkillFocus } from './candidates.ts';
import type { DayAssignment } from './assignment.ts';
import { buildSlots } from './wording.ts';

// Fixtures from docs/specs/texten.md.

const ZERO_NEEDS: Needs = { physical: 0, mentalWork: 0, scent: 0, social: 0, recovery: 0 };

function activity(overrides: { id: string; trainsSkill?: string | null; needs?: Needs }): Activity {
  const id = overrides.id;
  return {
    id,
    title: id,
    sentence: 'sentence',
    type: 'enrichment',
    trainsSkill: overrides.trainsSkill ?? null,
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

function focus(overrides: {
  skillId: string;
  priority?: number;
  overdueDays?: number;
  isNewSkill?: boolean;
}): SkillFocus {
  return {
    skillId: overrides.skillId,
    levels: { duration: 0, distance: 0, distraction: 0 },
    priority: overrides.priority ?? 0,
    overdueDays: overrides.overdueDays ?? 0,
    isNewSkill: overrides.isNewSkill ?? false,
    status: 'building',
  };
}

function need(dimension: NeedFocus['dimension'], gap: number): NeedFocus {
  return { dimension, gap };
}

function date(day: number): Date {
  return new Date(`2026-03-${String(day).padStart(2, '0')}T00:00:00.000Z`);
}

Deno.test('an empty day gets an empty reason', () => {
  const assignments: DayAssignment[] = [{ date: date(1), activityId: null }];

  const slots = buildSlots({ assignments, pool: [], candidates: { skills: [], needs: [] } });

  assertEquals(slots, [
    {
      date: date(1),
      activityId: null,
      reason: { kind: 'empty', skillId: null, needDimension: null },
      outcome: null,
    },
  ]);
});

Deno.test('a new skill is the reason', () => {
  const intro = activity({ id: 'intro', trainsSkill: 'recall' });
  const assignments: DayAssignment[] = [{ date: date(1), activityId: 'intro' }];

  const slots = buildSlots({
    assignments,
    pool: [{ activity: intro, score: 1 }],
    candidates: { skills: [focus({ skillId: 'recall', isNewSkill: true })], needs: [] },
  });

  assertEquals(slots[0]!.reason, { kind: 'newSkill', skillId: 'recall', needDimension: null });
});

Deno.test('a due refresher wins over priority', () => {
  const recall = activity({ id: 'recall-refresh', trainsSkill: 'recall' });
  const assignments: DayAssignment[] = [{ date: date(1), activityId: 'recall-refresh' }];

  const slots = buildSlots({
    assignments,
    pool: [{ activity: recall, score: 1 }],
    candidates: {
      skills: [focus({ skillId: 'recall', overdueDays: 5, priority: 2 })],
      needs: [],
    },
  });

  assertEquals(slots[0]!.reason, { kind: 'dueRefresher', skillId: 'recall', needDimension: null });
});

Deno.test('priority alone is the reason', () => {
  const recall = activity({ id: 'recall-priority', trainsSkill: 'recall' });
  const assignments: DayAssignment[] = [{ date: date(1), activityId: 'recall-priority' }];

  const slots = buildSlots({
    assignments,
    pool: [{ activity: recall, score: 1 }],
    candidates: { skills: [focus({ skillId: 'recall', priority: 3 })], needs: [] },
  });

  assertEquals(slots[0]!.reason, { kind: 'priority', skillId: 'recall', needDimension: null });
});

Deno.test('need coverage without a skill link', () => {
  const sniff = activity({ id: 'schnueffelteppich', needs: { ...ZERO_NEEDS, scent: 3 } });
  const assignments: DayAssignment[] = [{ date: date(1), activityId: 'schnueffelteppich' }];

  const slots = buildSlots({
    assignments,
    pool: [{ activity: sniff, score: 1 }],
    candidates: { skills: [], needs: [need('scent', 3)] },
  });

  assertEquals(slots[0]!.reason, { kind: 'needGap', skillId: null, needDimension: 'scent' });
});

Deno.test('the largest gap wins, not the strongest coverage', () => {
  const both = activity({ id: 'both', needs: { ...ZERO_NEEDS, scent: 2, social: 1 } });
  const assignments: DayAssignment[] = [{ date: date(1), activityId: 'both' }];

  const slots = buildSlots({
    assignments,
    pool: [{ activity: both, score: 1 }],
    candidates: { skills: [], needs: [need('scent', 1), need('social', 4)] },
  });

  assertEquals(slots[0]!.reason, { kind: 'needGap', skillId: null, needDimension: 'social' });
});

Deno.test('no signal at all falls back to recoveryNeed', () => {
  const restDay = activity({ id: 'ruhetag', needs: ZERO_NEEDS });
  const assignments: DayAssignment[] = [{ date: date(1), activityId: 'ruhetag' }];

  const slots = buildSlots({
    assignments,
    pool: [{ activity: restDay, score: 1 }],
    candidates: { skills: [], needs: [] },
  });

  assertEquals(slots[0]!.reason, { kind: 'recoveryNeed', skillId: null, needDimension: null });
});

Deno.test('a skill focus with none of the three signals falls through to need gap', () => {
  const recall = activity({
    id: 'recall-generic',
    trainsSkill: 'recall',
    needs: { ...ZERO_NEEDS, scent: 2 },
  });
  const assignments: DayAssignment[] = [{ date: date(1), activityId: 'recall-generic' }];

  const slots = buildSlots({
    assignments,
    pool: [{ activity: recall, score: 1 }],
    candidates: {
      skills: [focus({ skillId: 'recall' })],
      needs: [need('scent', 2)],
    },
  });

  assertEquals(slots[0]!.reason, { kind: 'needGap', skillId: null, needDimension: 'scent' });
});

Deno.test('outcome is always null when a slot is built', () => {
  const restDay = activity({ id: 'ruhetag' });
  const assignments: DayAssignment[] = [{ date: date(1), activityId: 'ruhetag' }];

  const slots = buildSlots({
    assignments,
    pool: [{ activity: restDay, score: 1 }],
    candidates: { skills: [], needs: [] },
  });

  assertEquals(slots[0]!.outcome, null);
});
