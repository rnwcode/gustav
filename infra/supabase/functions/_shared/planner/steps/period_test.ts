import { assertEquals, assertThrows } from '../dev_deps.ts';
import type { Household } from '../models/household.ts';
import type { PeriodConfig } from './period_config.ts';
import { buildPeriod } from './period.ts';

// Fixtures from docs/specs/slots-festlegen.md, using the real values from
// content/planer.yaml.

const realConfig: PeriodConfig = {
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
};

function household(overrides: Partial<Household>): Household {
  return {
    id: 'household-1',
    postalCode: null,
    housingType: 'apartment',
    surroundings: 'city',
    experience: 'experienced',
    weekdayTimeBudgetMinutes: 30,
    weekendTimeBudgetMinutes: 60,
    trainingDays: new Set(['monday', 'wednesday', 'friday']),
    planningDay: 'sunday',
    householdSize: 1,
    equipment: [],
    ...overrides,
  };
}

Deno.test('Wednesday start yields a 5-day period ending on the next Sunday', () => {
  const period = buildPeriod({
    startDate: new Date('2026-03-11T00:00:00.000Z'), // Wednesday
    household: household({}),
    lifeStage: 'adult',
    recoveryNeed: 'none',
    config: realConfig,
  });

  assertEquals(period.days.length, 5);
  assertEquals(period.periodEnd, new Date('2026-03-15T00:00:00.000Z')); // Sunday
});

Deno.test('Saturday start is too short and skips a week forward', () => {
  const period = buildPeriod({
    startDate: new Date('2026-03-14T00:00:00.000Z'), // Saturday
    household: household({}),
    lifeStage: 'adult',
    recoveryNeed: 'none',
    config: realConfig,
  });

  assertEquals(period.days.length, 9);
  assertEquals(period.periodEnd, new Date('2026-03-22T00:00:00.000Z')); // Sunday, a week later
});

Deno.test('steady state: a Monday start (the day after planningDay) is always 7 days', () => {
  const period = buildPeriod({
    startDate: new Date('2026-03-16T00:00:00.000Z'), // Monday
    household: household({}),
    lifeStage: 'adult',
    recoveryNeed: 'none',
    config: realConfig,
  });

  assertEquals(period.days.length, 7);
  assertEquals(period.periodEnd, new Date('2026-03-22T00:00:00.000Z')); // Sunday
});

Deno.test('training days and time budgets are resolved per weekday', () => {
  const period = buildPeriod({
    startDate: new Date('2026-03-16T00:00:00.000Z'), // Monday
    household: household({
      trainingDays: new Set(['monday', 'wednesday', 'friday']),
      weekdayTimeBudgetMinutes: 20,
      weekendTimeBudgetMinutes: 45,
    }),
    lifeStage: 'adult',
    recoveryNeed: 'none',
    config: realConfig,
  });

  assertEquals(period.days[0], {
    date: new Date('2026-03-16T00:00:00.000Z'),
    isTrainingDay: true,
    timeBudgetMinutes: 20,
  });
  assertEquals(period.days[5], {
    date: new Date('2026-03-21T00:00:00.000Z'), // Saturday
    isTrainingDay: false,
    timeBudgetMinutes: 45,
  });
});

Deno.test('high recovery need doubles the minimum number of empty slots', () => {
  const period = buildPeriod({
    startDate: new Date('2026-03-16T00:00:00.000Z'),
    household: household({}),
    lifeStage: 'adult',
    recoveryNeed: 'high',
    config: realConfig,
  });

  assertEquals(period.minEmptySlots, 2);
});

Deno.test('a puppy has narrower caps than an adult dog', () => {
  const puppyPeriod = buildPeriod({
    startDate: new Date('2026-03-16T00:00:00.000Z'),
    household: household({}),
    lifeStage: 'puppy',
    recoveryNeed: 'none',
    config: realConfig,
  });
  assertEquals(puppyPeriod.maxActiveSlots, 4);
  assertEquals(puppyPeriod.maxTrainingSlots, 2);

  const adultPeriod = buildPeriod({
    startDate: new Date('2026-03-16T00:00:00.000Z'),
    household: household({}),
    lifeStage: 'adult',
    recoveryNeed: 'none',
    config: realConfig,
  });
  assertEquals(adultPeriod.maxActiveSlots, 6);
  assertEquals(adultPeriod.maxTrainingSlots, 4);
});

Deno.test('a life stage missing from the config is a configuration error', () => {
  const incompleteConfig: PeriodConfig = {
    ...realConfig,
    maxActiveSlotsByLifeStage: new Map(),
  };

  assertThrows(() =>
    buildPeriod({
      startDate: new Date('2026-03-16T00:00:00.000Z'),
      household: household({}),
      lifeStage: 'adult',
      recoveryNeed: 'none',
      config: incompleteConfig,
    })
  );
});
