import { assertAlmostEquals, assertEquals } from '../dev_deps.ts';
import type { Dog } from '../models/dog.ts';
import type { Household } from '../models/household.ts';
import type { WeeklyContext } from '../models/checkin.ts';
import type { LoadBudgetConfig } from './load_budget_config.ts';
import { buildContext } from './context.ts';

// Fixtures from docs/specs/kontext-bauen.md. `realConfig` mirrors
// load_budget_test.ts (values from content/planer.yaml).

const realConfig: LoadBudgetConfig = {
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
};

const today = new Date('2026-03-12T00:00:00.000Z');
const daysBefore = (days: number) => new Date(today.getTime() - days * 24 * 60 * 60 * 1000);

const household: Household = {
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
};

const weeklyContext: WeeklyContext = {
  priorities: [],
  constraints: { days: new Set(), minutesPerDay: null, locations: [] },
  flags: new Set(),
  source: 'fallback',
};

function dogFixture(overrides: Partial<Dog>): Dog {
  return {
    id: 'dog-1',
    name: 'Gustav',
    birthDate: daysBefore(1095),
    arrivalDate: daysBefore(730),
    origin: 'breeder',
    breedGroups: new Map([['companion', 1]]),
    sizeClass: 'medium',
    bodyType: new Set(),
    restrictions: new Set(),
    gender: null,
    neutered: null,
    ...overrides,
  };
}

Deno.test('adult dog with a normal load has no elevated recovery need', () => {
  const context = buildContext({
    dog: dogFixture({}),
    household,
    weeklyContext,
    today,
    loadOverLastSevenDays: [1, 1, 1, 1, 1, 1, 3],
    loadBudgetConfig: realConfig,
  });

  assertEquals(context.ageWeeks, 156);
  assertEquals(context.lifeStage, 'adult');
  assertEquals(context.heatSensitivity, 0);
  assertEquals(context.weeksSinceArrival, 104);
  assertAlmostEquals(context.loadBudget.quote, 0.643, 0.001);
  assertEquals(context.loadBudget.recoveryNeed, 'none');
  assertEquals(context.household, household);
  assertEquals(context.weeklyContext, weeklyContext);
});

Deno.test('life stage from step 1 feeds the load budget capacity for a puppy', () => {
  const context = buildContext({
    dog: dogFixture({ birthDate: daysBefore(70), arrivalDate: daysBefore(10) }),
    household,
    weeklyContext,
    today,
    loadOverLastSevenDays: [1, 0, 1, 0, 0, 1, 0],
    loadBudgetConfig: realConfig,
  });

  assertEquals(context.ageWeeks, 10);
  assertEquals(context.lifeStage, 'puppy');
  assertEquals(context.weeksSinceArrival, 1);
  assertAlmostEquals(context.loadBudget.quote, 0.429, 0.001);
});

Deno.test('a restriction on the dog carries through into the load budget', () => {
  const context = buildContext({
    dog: dogFixture({ restrictions: new Set(['recovery']) }),
    household,
    weeklyContext,
    today,
    loadOverLastSevenDays: [1, 0, 1, 0, 1, 0, 0],
    loadBudgetConfig: realConfig,
  });

  assertAlmostEquals(context.loadBudget.quote, 0.714, 0.001);
  assertEquals(context.loadBudget.recoveryNeed, 'medium');
});
