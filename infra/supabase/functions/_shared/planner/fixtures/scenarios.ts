import type { Dog } from '../models/dog.ts';
import type { Household } from '../models/household.ts';
import type { WeeklyContext } from '../models/checkin.ts';
import type { NeedDimension } from '../models/enums.ts';
import type { SkillState } from '../models/skill_state.ts';

/** Everything `plan()` needs except the catalogs and config, which the simulator supplies. */
export interface FixtureScenario {
  readonly name: string;
  readonly today: Date;
  readonly dog: Dog;
  readonly household: Household;
  readonly weeklyContext: WeeklyContext;
  readonly loadOverLastSevenDays: readonly number[];
  readonly skillStates: ReadonlyMap<string, SkillState>;
  readonly needCoverageLastPeriod: ReadonlyMap<NeedDimension, number>;
  readonly lastUsedByVarianceGroup: ReadonlyMap<string, Date>;
  readonly lastUsedByActivityId: ReadonlyMap<string, Date>;
}

const TODAY = new Date('2026-03-16T00:00:00.000Z'); // a Monday — see docs/specs/slots-festlegen.md

function daysBefore(days: number): Date {
  return new Date(TODAY.getTime() - days * 24 * 60 * 60 * 1000);
}

const DEFAULT_HOUSEHOLD: Household = {
  id: 'fixture-household',
  postalCode: null,
  housingType: 'apartment',
  surroundings: 'city',
  experience: 'experienced',
  weekdayTimeBudgetMinutes: 30,
  weekendTimeBudgetMinutes: 60,
  trainingDays: new Set(['monday', 'wednesday', 'friday']),
  planningDay: 'sunday',
  householdSize: 1,
  equipment: ['leash'],
};

const DEFAULT_WEEKLY_CONTEXT: WeeklyContext = {
  priorities: [],
  constraints: { days: new Set(), minutesPerDay: null, locations: [] },
  flags: new Set(),
  source: 'fallback',
};

/**
 * Synthetic dog/household/check-in scenarios — NOT real users. Named and
 * shaped after the five fixtures `docs/datenmodell.md` describes under
 * „Test-Fixtures"; the three period-length fixtures listed there
 * (Mittwochsstart, Samstagsstart, Wiedereinstieg) are about `today`'s
 * weekday, not the dog, so the simulator (`../simulate.ts`) exercises
 * those by varying `today` against any of these five, rather than by a
 * separate dog fixture.
 */
export const FIXTURE_SCENARIOS: readonly FixtureScenario[] = [
  {
    name: 'Welpe, Periode 1',
    today: TODAY,
    dog: {
      id: 'fixture-dog-puppy',
      name: '[Fixture] Welpe',
      birthDate: daysBefore(11 * 7),
      arrivalDate: daysBefore(10),
      origin: 'breeder',
      breedGroup: 'companion',
      sizeClass: 'medium',
      bodyType: new Set(),
      restrictions: new Set(),
    },
    household: {
      ...DEFAULT_HOUSEHOLD,
      id: 'fixture-household-puppy',
      experience: 'firstTimeOwner',
      weekdayTimeBudgetMinutes: 20,
    },
    weeklyContext: DEFAULT_WEEKLY_CONTEXT,
    loadOverLastSevenDays: [0, 0, 0, 0, 0, 0, 0],
    skillStates: new Map(),
    needCoverageLastPeriod: new Map(),
    lastUsedByVarianceGroup: new Map(),
    lastUsedByActivityId: new Map(),
  },
  {
    name: 'Junghund in der Pubertät',
    today: TODAY,
    dog: {
      id: 'fixture-dog-puberty',
      name: '[Fixture] Junghund',
      birthDate: daysBefore(43 * 7),
      arrivalDate: daysBefore(40 * 7),
      origin: 'shelter',
      breedGroup: 'herding',
      sizeClass: 'medium',
      bodyType: new Set(),
      restrictions: new Set(),
    },
    household: DEFAULT_HOUSEHOLD,
    weeklyContext: { ...DEFAULT_WEEKLY_CONTEXT, flags: new Set(['leash']), source: 'chip' },
    loadOverLastSevenDays: [1, 1, 0, 1, 1, 0, 1],
    skillStates: new Map<string, SkillState>([
      [
        'fixture_recall',
        {
          dogId: 'fixture-dog-puberty',
          skillId: 'fixture_recall',
          status: 'generalizing',
          // Stepped back one distraction level after 2x "noch nicht" in a
          // row (docs/specs/skill-zustandsautomat.md) instead of being
          // dropped — repeated at distraction 1 rather than abandoned.
          levels: { duration: 1, distance: 2, distraction: 1 },
          history: [],
          lastPracticedAt: daysBefore(3),
          dueAt: TODAY,
          intervalDays: 3,
        },
      ],
    ]),
    needCoverageLastPeriod: new Map(),
    lastUsedByVarianceGroup: new Map(),
    lastUsedByActivityId: new Map(),
  },
  {
    name: 'Volle Periode',
    today: TODAY,
    dog: {
      id: 'fixture-dog-busy',
      name: '[Fixture] Ausgelasteter Hund',
      birthDate: daysBefore(3 * 365),
      arrivalDate: daysBefore(2 * 365),
      origin: 'breeder',
      breedGroup: 'sighthound',
      sizeClass: 'large',
      bodyType: new Set(),
      restrictions: new Set(),
    },
    household: DEFAULT_HOUSEHOLD,
    weeklyContext: {
      ...DEFAULT_WEEKLY_CONTEXT,
      flags: new Set(['shortOnTime']),
      constraints: { days: new Set(), minutesPerDay: 15, locations: [] },
      source: 'chip',
    },
    // High load over the last week -> recoveryNeed: high.
    loadOverLastSevenDays: [3, 3, 2, 3, 3, 2, 3],
    skillStates: new Map(),
    needCoverageLastPeriod: new Map(),
    lastUsedByVarianceGroup: new Map(),
    lastUsedByActivityId: new Map(),
  },
  {
    name: 'Erwachsener Hund, alles gefestigt',
    today: TODAY,
    dog: {
      id: 'fixture-dog-adult',
      name: '[Fixture] Erwachsener Hund',
      birthDate: daysBefore(4 * 365),
      arrivalDate: daysBefore(4 * 365 - 30),
      origin: 'breeder',
      breedGroup: 'companion',
      sizeClass: 'medium',
      bodyType: new Set(),
      restrictions: new Set(),
    },
    household: DEFAULT_HOUSEHOLD,
    weeklyContext: {
      ...DEFAULT_WEEKLY_CONTEXT,
      flags: new Set(['moreMentalWork']),
      source: 'chip',
    },
    loadOverLastSevenDays: [1, 1, 1, 1, 1, 1, 1],
    skillStates: new Map<string, SkillState>(
      ['fixture_name_focus', 'fixture_sit', 'fixture_recall'].map((skillId) => [
        skillId,
        {
          dogId: 'fixture-dog-adult',
          skillId,
          status: 'maintenance',
          levels: { duration: 3, distance: 3, distraction: 4 },
          history: [],
          lastPracticedAt: daysBefore(20),
          dueAt: TODAY,
          intervalDays: 60,
        },
      ]),
    ),
    needCoverageLastPeriod: new Map(),
    // Recently done -> excluded from scoring's "recently done" bonus pool.
    lastUsedByVarianceGroup: new Map(),
    lastUsedByActivityId: new Map([['fixture_food_puzzle', daysBefore(3)]]),
  },
  {
    name: 'Schonzeit',
    today: TODAY,
    dog: {
      id: 'fixture-dog-recovery',
      name: '[Fixture] Hund in Schonzeit',
      birthDate: daysBefore(5 * 365),
      arrivalDate: daysBefore(4 * 365),
      origin: 'breeder',
      breedGroup: 'molosser',
      sizeClass: 'large',
      bodyType: new Set(),
      restrictions: new Set(['recovery']),
    },
    household: DEFAULT_HOUSEHOLD,
    weeklyContext: DEFAULT_WEEKLY_CONTEXT,
    loadOverLastSevenDays: [0, 0, 0, 0, 0, 0, 0],
    skillStates: new Map(),
    needCoverageLastPeriod: new Map(),
    lastUsedByVarianceGroup: new Map(),
    lastUsedByActivityId: new Map(),
  },
];
