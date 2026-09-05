import { assertEquals } from '../dev_deps.ts';
import type { Activity, Needs } from '../models/activity.ts';
import type { ActivityType, Location, Restriction, SkillStatus } from '../models/enums.ts';
import type { SkillFocus } from './candidates.ts';
import type { ActivityFilterConfig } from './activity_filter_config.ts';
import { filterActivities } from './activity_filter.ts';

const ZERO_NEEDS: Needs = { physical: 0, mentalWork: 0, scent: 0, social: 0, recovery: 0 };

function activity(overrides: {
  id?: string;
  type?: ActivityType;
  trainsSkill?: string | null;
  arousal?: number;
  minAgeWeeks?: number;
  maxAgeWeeks?: number | null;
  equipment?: readonly string[];
  secondPerson?: boolean;
  jointStraining?: boolean;
  location?: Location;
  seasonalWindow?: readonly number[] | null;
  varianceGroup?: string;
  cooldownDays?: number;
  isRefresher?: boolean;
  forDistraction?: readonly [number, number] | null;
}): Activity {
  const id = overrides.id ?? 'a1';
  return {
    id,
    title: id,
    sentence: 'sentence',
    type: overrides.type ?? 'enrichment',
    trainsSkill: overrides.trainsSkill ?? null,
    needs: ZERO_NEEDS,
    arousal: overrides.arousal ?? 1,
    durationMin: 5,
    durationMax: 10,
    location: overrides.location ?? 'any',
    forDistraction: overrides.forDistraction ?? null,
    isRefresher: overrides.isRefresher ?? false,
    heatSuitable: true,
    rainSuitable: true,
    darknessSuitable: true,
    jointStraining: overrides.jointStraining ?? false,
    seasonalWindow: overrides.seasonalWindow ?? null,
    equipment: overrides.equipment ?? [],
    secondPerson: overrides.secondPerson ?? false,
    minAgeWeeks: overrides.minAgeWeeks ?? 8,
    maxAgeWeeks: overrides.maxAgeWeeks ?? null,
    suitability: new Map(),
    varianceGroup: overrides.varianceGroup ?? 'default',
    cooldownDays: overrides.cooldownDays ?? 10,
    illustration: null,
    instructions: [],
    successCriterion: 'criterion',
    commonMistakes: [],
    troubleshooting: [],
  };
}

function focus(overrides: {
  skillId: string;
  levels?: { duration: number; distance: number; distraction: number };
  status?: SkillStatus;
}): SkillFocus {
  return {
    skillId: overrides.skillId,
    levels: overrides.levels ?? { duration: 0, distance: 0, distraction: 0 },
    priority: 0,
    overdueDays: 0,
    isNewSkill: false,
    status: overrides.status ?? 'building',
  };
}

const config: ActivityFilterConfig = {
  settlingInWeeks: 6,
  settlingInMaxArousal: 2,
  settlingInMaxDistraction: 1,
  restrictionArousalCeiling: new Map([
    ['protectiveCare', 2],
    ['recovery', 2],
  ]),
};

function run(overrides: {
  catalog: readonly Activity[];
  candidates?: { skills: readonly SkillFocus[] };
  coreSkillIds?: ReadonlySet<string>;
  dogAgeWeeks?: number;
  restrictions?: ReadonlySet<Restriction>;
  weeksSinceArrival?: number;
  householdEquipment?: readonly string[];
  householdSize?: number;
  allowedLocations?: readonly Location[];
  today?: Date;
  lastUsedByVarianceGroup?: ReadonlyMap<string, Date>;
}): Activity[] {
  return filterActivities({
    catalog: overrides.catalog,
    candidates: { skills: overrides.candidates?.skills ?? [], needs: [] },
    coreSkillIds: overrides.coreSkillIds ?? new Set(),
    dogAgeWeeks: overrides.dogAgeWeeks ?? 40,
    restrictions: overrides.restrictions ?? new Set(),
    weeksSinceArrival: overrides.weeksSinceArrival ?? 52,
    householdEquipment: overrides.householdEquipment ?? [],
    householdSize: overrides.householdSize ?? 1,
    allowedLocations: overrides.allowedLocations ?? [],
    today: overrides.today ?? new Date(2026, 2, 12),
    lastUsedByVarianceGroup: overrides.lastUsedByVarianceGroup ?? new Map(),
    config,
  });
}

Deno.test('an unremarkable activity passes every rule', () => {
  assertEquals(run({ catalog: [activity({})] }).length, 1);
});

Deno.test('too young is excluded', () => {
  const result = run({ catalog: [activity({ minAgeWeeks: 20 })], dogAgeWeeks: 12 });
  assertEquals(result.length, 0);
});

Deno.test('a skill not in the candidate pool excludes its activities', () => {
  const result = run({ catalog: [activity({ trainsSkill: 'sit' })] });
  assertEquals(result.length, 0);
});

Deno.test('missing equipment excludes, present equipment admits', () => {
  const withoutClicker = run({ catalog: [activity({ equipment: ['clicker'] })] });
  assertEquals(withoutClicker.length, 0);

  const withClicker = run({
    catalog: [activity({ equipment: ['clicker'] })],
    householdEquipment: ['clicker'],
  });
  assertEquals(withClicker.length, 1);
});

Deno.test('a restriction lowers the admissible arousal', () => {
  const tooArousing = run({
    catalog: [activity({ arousal: 2 })],
    restrictions: new Set(['protectiveCare']),
  });
  assertEquals(tooArousing.length, 0);

  const fine = run({
    catalog: [activity({ arousal: 1 })],
    restrictions: new Set(['protectiveCare']),
  });
  assertEquals(fine.length, 1);
});

Deno.test('joint issues exclude joint-straining activities', () => {
  const result = run({
    catalog: [activity({ jointStraining: true })],
    restrictions: new Set(['jointIssues']),
  });
  assertEquals(result.length, 0);
});

Deno.test('cooldown excludes recent variance groups, except for core skills', () => {
  const today = new Date(2026, 2, 12);
  const recentlyUsed = new Map([['nose-work', new Date(2026, 2, 9)]]);

  const nonCore = run({
    catalog: [
      activity({
        id: 'sniff',
        trainsSkill: 'sniffing',
        varianceGroup: 'nose-work',
        cooldownDays: 10,
      }),
    ],
    candidates: { skills: [focus({ skillId: 'sniffing' })] },
    today,
    lastUsedByVarianceGroup: recentlyUsed,
  });
  assertEquals(nonCore.length, 0);

  const core = run({
    catalog: [
      activity({
        id: 'recall-refresher',
        trainsSkill: 'recall',
        varianceGroup: 'nose-work',
        cooldownDays: 10,
      }),
    ],
    candidates: { skills: [focus({ skillId: 'recall' })] },
    coreSkillIds: new Set(['recall']),
    today,
    lastUsedByVarianceGroup: recentlyUsed,
  });
  assertEquals(core.length, 1);
});

Deno.test('settling-in caps arousal and, for training, the distraction range', () => {
  const tooArousing = run({ catalog: [activity({ arousal: 3 })], weeksSinceArrival: 2 });
  assertEquals(tooArousing.length, 0);

  const rangeTooWide = run({
    catalog: [
      activity({
        id: 'recall-training',
        type: 'training',
        trainsSkill: 'recall',
        forDistraction: [0, 3],
      }),
    ],
    candidates: {
      skills: [focus({ skillId: 'recall', levels: { duration: 0, distance: 0, distraction: 1 } })],
    },
    weeksSinceArrival: 2,
  });
  assertEquals(rangeTooWide.length, 0);
});

Deno.test("a training activity must cover the skill's current distraction level", () => {
  const poolAtLevel2 = {
    skills: [focus({ skillId: 'recall', levels: { duration: 0, distance: 0, distraction: 2 } })],
  };

  const tooEasy = run({
    catalog: [
      activity({
        id: 'recall-easy',
        type: 'training',
        trainsSkill: 'recall',
        forDistraction: [0, 1],
      }),
    ],
    candidates: poolAtLevel2,
  });
  assertEquals(tooEasy.length, 0);

  const matching = run({
    catalog: [
      activity({
        id: 'recall-match',
        type: 'training',
        trainsSkill: 'recall',
        forDistraction: [2, 4],
      }),
    ],
    candidates: poolAtLevel2,
  });
  assertEquals(matching.length, 1);
});

Deno.test('a consolidated skill only admits refresher activities', () => {
  const poolConsolidated = {
    skills: [
      focus({
        skillId: 'recall',
        levels: { duration: 1, distance: 3, distraction: 2 },
        status: 'consolidated',
      }),
    ],
  };

  const fullSession = run({
    catalog: [
      activity({
        id: 'recall-full',
        type: 'training',
        trainsSkill: 'recall',
        forDistraction: [2, 4],
      }),
    ],
    candidates: poolConsolidated,
  });
  assertEquals(fullSession.length, 0);

  const refresher = run({
    catalog: [
      activity({
        id: 'recall-refresh',
        type: 'training',
        trainsSkill: 'recall',
        forDistraction: [2, 4],
        isRefresher: true,
      }),
    ],
    candidates: poolConsolidated,
  });
  assertEquals(refresher.length, 1);
});
