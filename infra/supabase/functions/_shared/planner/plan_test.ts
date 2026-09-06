import { assertEquals } from './dev_deps.ts';
import type { Dog } from './models/dog.ts';
import type { Household } from './models/household.ts';
import type { WeeklyContext } from './models/checkin.ts';
import type { Activity, Needs } from './models/activity.ts';
import type { PlannerConfig } from './plan_config.ts';
import { ALGORITHM_VERSION, plan } from './plan.ts';

// Fixtures from docs/specs/planer.md, example 1 — the real values from
// content/planer.yaml, sliced per step config (see the individual step
// specs for where each number comes from).

const ZERO_NEEDS: Needs = { physical: 0, mentalWork: 0, scent: 0, social: 0, recovery: 0 };

const config: PlannerConfig = {
  version: 1,
  loadBudget: {
    capacityPerDay: new Map([
      ['puppy', 1.0],
      ['adolescent', 1.6],
      ['puberty', 1.8],
      ['adult', 2.0],
      ['senior', 1.4],
    ]),
    restrictionCap: new Map([
      ['recovery', 0.6],
      ['protectiveCare', 1.0],
    ]),
    recoveryNeedMediumFrom: 0.7,
    recoveryNeedHighFrom: 1.0,
  },
  period: {
    regularLengthDays: 7,
    firstPeriodMinDays: 5,
    minEmptySlots: 1,
    minEmptySlotsAtHighRecoveryNeed: 2,
    maxActiveSlotsByLifeStage: new Map([
      ['puppy', 4],
      ['adolescent', 5],
      ['puberty', 6],
      ['adult', 6],
      ['senior', 5],
    ]),
    maxTrainingSlotsByLifeStage: new Map([
      ['puppy', 2],
      ['adolescent', 3],
      ['puberty', 4],
      ['adult', 4],
      ['senior', 3],
    ]),
  },
  candidates: {
    needTargets: new Map([
      ['physical', 6],
      ['mentalWork', 6],
      ['scent', 5],
      ['social', 3],
      ['recovery', 6],
    ]),
  },
  activityFilter: {
    settlingInWeeks: 6,
    settlingInMaxArousal: 2,
    settlingInMaxDistraction: 1,
    restrictionArousalCeiling: new Map([
      ['protectiveCare', 2],
      ['recovery', 2],
    ]),
  },
  scoring: {
    priorityWeight: 3.0,
    overdueWeight: 2.0,
    overdueCap: 3.0,
    needGapWeight: 2.0,
    newSkillWeight: 1.0,
    suitabilityWeight: 1.0,
    arousalAtRecoveryNeedWeight: -3.0,
    recentlyDoneWeight: -2.0,
    recentlyDoneDays: 10,
  },
  assignment: {
    heavyArousalThreshold: 2,
    maxArousalThreshold: 3,
  },
};

const today = new Date('2026-03-16T00:00:00.000Z'); // Monday

function daysBefore(days: number): Date {
  return new Date(today.getTime() - days * 24 * 60 * 60 * 1000);
}

const dog: Dog = {
  id: 'dog-1',
  name: 'Gustav',
  birthDate: daysBefore(1825), // 5 years — well into adulthood
  arrivalDate: daysBefore(1825), // long past settling-in
  origin: 'breeder',
  breedGroups: new Map([['companion', 1]]),
  sizeClass: 'medium',
  bodyType: new Set(),
  restrictions: new Set(),
  gender: null,
  neutered: null,
};

const household: Household = {
  id: 'household-1',
  postalCode: null,
  housingType: 'apartment',
  surroundings: 'city',
  experience: 'experienced',
  weekdayTimeBudgetMinutes: 30,
  weekendTimeBudgetMinutes: 30,
  trainingDays: new Set(['monday']),
  planningDay: 'sunday',
  householdSize: 1,
  equipment: [],
};

const weeklyContext: WeeklyContext = {
  priorities: [],
  constraints: { days: new Set(), minutesPerDay: null, locations: [] },
  flags: new Set(),
  source: 'fallback',
};

const sniff: Activity = {
  id: 'sniff',
  title: 'sniff',
  sentence: 'sentence',
  type: 'enrichment',
  trainsSkill: null,
  needs: { ...ZERO_NEEDS, scent: 3 },
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
  minAgeWeeks: 0,
  maxAgeWeeks: null,
  suitability: new Map(),
  varianceGroup: 'sniff',
  cooldownDays: 0,
  illustration: null,
  instructions: [],
  successCriterion: 'criterion',
  commonMistakes: [],
  troubleshooting: [],
};

function date(day: number): Date {
  return new Date(`2026-03-${String(day).padStart(2, '0')}T00:00:00.000Z`);
}

function runPlan(configOverrides: Partial<PlannerConfig> = {}) {
  return plan({
    dog,
    household,
    weeklyContext,
    today,
    loadOverLastSevenDays: [0, 0, 0, 0, 0, 0, 0],
    skillStates: new Map(),
    skillCatalog: [],
    activityCatalog: [sniff],
    needCoverageLastPeriod: new Map(),
    lastUsedByVarianceGroup: new Map(),
    lastUsedByActivityId: new Map(),
    config: { ...config, ...configOverrides },
  });
}

Deno.test('a single candidate is tracked end to end into the finished WeeklyPlan', () => {
  const result = runPlan();

  assertEquals(result.dogId, 'dog-1');
  assertEquals(result.periodStart, date(16));
  assertEquals(result.periodEnd, date(22));
  assertEquals(result.algorithmVersion, ALGORITHM_VERSION);
  assertEquals(result.configVersion, 1);

  assertEquals(result.slots, [
    {
      date: date(16),
      activityId: 'sniff',
      reason: { kind: 'needGap', skillId: null, needDimension: 'scent' },
      outcome: null,
    },
    {
      date: date(17),
      activityId: null,
      reason: { kind: 'empty', skillId: null, needDimension: null },
      outcome: null,
    },
    {
      date: date(18),
      activityId: null,
      reason: { kind: 'empty', skillId: null, needDimension: null },
      outcome: null,
    },
    {
      date: date(19),
      activityId: null,
      reason: { kind: 'empty', skillId: null, needDimension: null },
      outcome: null,
    },
    {
      date: date(20),
      activityId: null,
      reason: { kind: 'empty', skillId: null, needDimension: null },
      outcome: null,
    },
    {
      date: date(21),
      activityId: null,
      reason: { kind: 'empty', skillId: null, needDimension: null },
      outcome: null,
    },
    {
      date: date(22),
      activityId: null,
      reason: { kind: 'empty', skillId: null, needDimension: null },
      outcome: null,
    },
  ]);
});

Deno.test('configVersion follows config.version regardless of content', () => {
  const result = runPlan({ version: 2 });
  assertEquals(result.configVersion, 2);
});
