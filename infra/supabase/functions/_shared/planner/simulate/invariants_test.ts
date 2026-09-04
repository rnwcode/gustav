import { assertEquals } from '../dev_deps.ts';
import type { Activity, Needs } from '../models/activity.ts';
import type { ActivityType } from '../models/enums.ts';
import type { Skill } from '../models/skill.ts';
import type { SimulatedPeriod, SimulationResult } from './run.ts';
import { checkInvariants } from './invariants.ts';

const ZERO_NEEDS: Needs = { physical: 0, mentalWork: 0, scent: 0, social: 0, recovery: 0 };

function activity(overrides: {
  id: string;
  type?: ActivityType;
  trainsSkill?: string | null;
  needs?: Needs;
  arousal?: number;
  varianceGroup?: string;
  cooldownDays?: number;
}): Activity {
  const id = overrides.id;
  return {
    id,
    title: id,
    sentence: 'sentence',
    type: overrides.type ?? 'enrichment',
    trainsSkill: overrides.trainsSkill ?? null,
    needs: overrides.needs ?? ZERO_NEEDS,
    arousal: overrides.arousal ?? 0,
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
    varianceGroup: overrides.varianceGroup ?? id,
    cooldownDays: overrides.cooldownDays ?? 10,
    illustration: null,
    instructions: [],
    successCriterion: 'criterion',
    commonMistakes: [],
    troubleshooting: [],
  };
}

function skill(id: string, isCoreSkill = false): Skill {
  return {
    id,
    name: id,
    category: 'basicCue',
    prerequisites: [],
    minAgeWeeks: 8,
    isCoreSkill,
    targetLevels: { duration: 0, distance: 0, distraction: 0 },
    description: 'fixture',
  };
}

function date(day: number): Date {
  return new Date(`2026-03-${String(day).padStart(2, '0')}T00:00:00.000Z`);
}

function period(
  periodIndex: number,
  slots: { date: Date; activityId: string | null }[],
  overrides: Partial<SimulatedPeriod> = {},
): SimulatedPeriod {
  return {
    periodIndex,
    lifeStage: 'adult',
    recoveryNeed: 'none',
    maxActiveSlots: 6,
    maxTrainingSlots: 4,
    plan: {
      dogId: 'dog-1',
      periodStart: slots[0]!.date,
      periodEnd: slots[slots.length - 1]!.date,
      algorithmVersion: 1,
      configVersion: 1,
      slots: slots.map((s) => ({
        date: s.date,
        activityId: s.activityId,
        reason: { kind: 'empty', skillId: null, needDimension: null },
        outcome: null,
      })),
    },
    ...overrides,
  };
}

function run(periods: SimulatedPeriod[]): SimulationResult {
  return { scenarioName: 'test', profileName: 'test', periods };
}

Deno.test('a period with no empty day violates leerer-slot', () => {
  const a = activity({ id: 'a' });
  const violations = checkInvariants({
    result: run([period(0, [{ date: date(1), activityId: 'a' }])]),
    skillCatalog: [],
    activityCatalog: [a],
  });
  assertEquals(violations.some((v) => v.rule === 'leerer-slot'), true);
});

Deno.test('a period with an empty day satisfies leerer-slot', () => {
  const a = activity({ id: 'a' });
  const violations = checkInvariants({
    result: run([
      period(0, [{ date: date(1), activityId: 'a' }, { date: date(2), activityId: null }]),
    ]),
    skillCatalog: [],
    activityCatalog: [a],
  });
  assertEquals(violations.some((v) => v.rule === 'leerer-slot'), false);
});

Deno.test('a skill untouched for more than 45 days violates skill-unberuehrt', () => {
  const training = activity({ id: 'train', type: 'training', trainsSkill: 'recall' });
  const violations = checkInvariants({
    result: run([
      period(0, [{ date: date(1), activityId: 'train' }, { date: date(2), activityId: null }]),
      period(1, [
        { date: new Date(date(1).getTime() + 50 * 86400000), activityId: 'train' },
        { date: new Date(date(1).getTime() + 51 * 86400000), activityId: null },
      ]),
    ]),
    skillCatalog: [skill('recall')],
    activityCatalog: [training],
  });
  assertEquals(violations.some((v) => v.rule === 'skill-unberuehrt'), true);
});

Deno.test('a non-core variance group repeating within its cooldown violates sperrfrist', () => {
  const a = activity({ id: 'a', varianceGroup: 'grp', cooldownDays: 10 });
  const violations = checkInvariants({
    result: run([
      period(0, [
        { date: date(1), activityId: 'a' },
        { date: date(2), activityId: null },
        { date: date(3), activityId: 'a' },
      ]),
    ]),
    skillCatalog: [],
    activityCatalog: [a],
  });
  assertEquals(violations.some((v) => v.rule === 'sperrfrist'), true);
});

Deno.test('a core-skill activity is exempt from the cooldown check', () => {
  const a = activity({
    id: 'a',
    type: 'training',
    trainsSkill: 'recall',
    varianceGroup: 'grp',
    cooldownDays: 10,
  });
  const violations = checkInvariants({
    result: run([
      period(0, [
        { date: date(1), activityId: 'a' },
        { date: date(2), activityId: null },
        { date: date(3), activityId: 'a' },
      ]),
    ]),
    skillCatalog: [skill('recall', true)],
    activityCatalog: [a],
  });
  assertEquals(violations.some((v) => v.rule === 'sperrfrist'), false);
});

Deno.test('a need dimension untouched over two periods violates bedarfsdeckung', () => {
  const scent = activity({ id: 'scent', needs: { ...ZERO_NEEDS, scent: 3 } });
  const violations = checkInvariants({
    result: run([
      period(0, [{ date: date(1), activityId: 'scent' }]),
      period(1, [{ date: date(8), activityId: 'scent' }]),
    ]),
    skillCatalog: [],
    activityCatalog: [scent],
  });
  assertEquals(violations.some((v) => v.rule === 'bedarfsdeckung'), true);
});

Deno.test('training right after an arousal-3 day violates belastung-vor-training', () => {
  const hard = activity({ id: 'hard', arousal: 3 });
  const training = activity({ id: 'train', type: 'training', arousal: 1 });
  const violations = checkInvariants({
    result: run([
      period(0, [
        { date: date(1), activityId: 'hard' },
        { date: date(2), activityId: 'train' },
      ]),
    ]),
    skillCatalog: [],
    activityCatalog: [hard, training],
  });
  assertEquals(violations.some((v) => v.rule === 'belastung-vor-training'), true);
});

Deno.test('exceeding maxActiveSlots violates obergrenze-aktiv', () => {
  const a = activity({ id: 'a' });
  const violations = checkInvariants({
    result: run([
      period(0, [{ date: date(1), activityId: 'a' }, { date: date(2), activityId: 'a' }], {
        maxActiveSlots: 1,
      }),
    ]),
    skillCatalog: [],
    activityCatalog: [a],
  });
  assertEquals(violations.some((v) => v.rule === 'obergrenze-aktiv'), true);
});

Deno.test('a clean run has no violations', () => {
  const training = activity({ id: 'train', type: 'training', trainsSkill: 'recall' });
  const enrichment = activity({
    id: 'enrich',
    needs: { physical: 1, mentalWork: 1, scent: 1, social: 1, recovery: 1 },
  });
  const violations = checkInvariants({
    result: run([
      period(0, [
        { date: date(1), activityId: 'train' },
        { date: date(2), activityId: 'enrich' },
        { date: date(3), activityId: null },
      ]),
      period(1, [
        { date: date(12), activityId: 'train' },
        { date: date(13), activityId: 'enrich' },
        { date: date(14), activityId: null },
      ]),
    ]),
    skillCatalog: [skill('recall')],
    activityCatalog: [training, enrichment],
  });
  assertEquals(violations, []);
});
