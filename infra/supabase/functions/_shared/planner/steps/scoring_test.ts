import { assertAlmostEquals, assertEquals } from '../dev_deps.ts';
import type { Activity, Needs } from '../models/activity.ts';
import type { BreedGroup, RecoveryNeed } from '../models/enums.ts';
import type { CandidatePool, SkillFocus } from './candidates.ts';
import type { ScoringConfig } from './scoring_config.ts';
import { scoreActivities } from './scoring.ts';

const ZERO_NEEDS: Needs = { physical: 0, mentalWork: 0, scent: 0, social: 0, recovery: 0 };

function activity(overrides: {
  id?: string;
  trainsSkill?: string | null;
  arousal?: number;
  needs?: Needs;
  suitability?: ReadonlyMap<BreedGroup, number>;
}): Activity {
  const id = overrides.id ?? 'a1';
  return {
    id,
    title: id,
    sentence: 'sentence',
    type: 'enrichment',
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
    suitability: overrides.suitability ?? new Map(),
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

const config: ScoringConfig = {
  priorityWeight: 3.0,
  overdueWeight: 2.0,
  overdueCap: 3.0,
  needGapWeight: 2.0,
  newSkillWeight: 1.0,
  suitabilityWeight: 1.0,
  arousalAtRecoveryNeedWeight: -3.0,
  recentlyDoneWeight: -2.0,
  recentlyDoneDays: 10,
};

const today = new Date(2026, 2, 12);

function run(overrides: {
  pool: readonly Activity[];
  candidates?: CandidatePool;
  breedGroup?: BreedGroup;
  recoveryNeed?: RecoveryNeed;
  lastUsedByActivityId?: ReadonlyMap<string, Date>;
}) {
  return scoreActivities({
    pool: overrides.pool,
    candidates: overrides.candidates ?? { skills: [], needs: [] },
    breedGroup: overrides.breedGroup ?? 'herding',
    recoveryNeed: overrides.recoveryNeed ?? 'none',
    lastUsedByActivityId: overrides.lastUsedByActivityId ?? new Map(),
    today,
    config,
  });
}

Deno.test('priority', () => {
  const result = run({
    pool: [activity({ id: 'recall', trainsSkill: 'recall' })],
    candidates: { skills: [focus({ skillId: 'recall', priority: 3 })], needs: [] },
  });
  assertAlmostEquals(result[0]!.score, 9.0, 1e-9);
});

Deno.test('overdue is capped', () => {
  const oneWeek = run({
    pool: [activity({ id: 'recall', trainsSkill: 'recall' })],
    candidates: { skills: [focus({ skillId: 'recall', overdueDays: 7 })], needs: [] },
  });
  assertAlmostEquals(oneWeek[0]!.score, 2.0, 1e-9);

  const fourWeeks = run({
    pool: [activity({ id: 'recall', trainsSkill: 'recall' })],
    candidates: { skills: [focus({ skillId: 'recall', overdueDays: 28 })], needs: [] },
  });
  assertAlmostEquals(fourWeeks[0]!.score, 6.0, 1e-9);
});

Deno.test('need gap only counts dimensions that actually have a gap', () => {
  const pool: CandidatePool = {
    skills: [],
    needs: [
      { dimension: 'scent', gap: 3 },
      { dimension: 'social', gap: 2 },
    ],
  };

  const coversGap = run({
    pool: [
      activity({
        id: 'sniff',
        needs: { physical: 0, mentalWork: 0, scent: 2, social: 1, recovery: 0 },
      }),
    ],
    candidates: pool,
  });
  assertAlmostEquals(coversGap[0]!.score, 6.0, 1e-9);

  const missesGap = run({
    pool: [
      activity({
        id: 'fetch',
        needs: { physical: 3, mentalWork: 0, scent: 0, social: 0, recovery: 0 },
      }),
    ],
    candidates: pool,
  });
  assertAlmostEquals(missesGap[0]!.score, 0.0, 1e-9);
});

Deno.test('new skill bonus', () => {
  const result = run({
    pool: [activity({ id: 'recall', trainsSkill: 'recall' })],
    candidates: { skills: [focus({ skillId: 'recall', isNewSkill: true })], needs: [] },
  });
  assertAlmostEquals(result[0]!.score, 1.0, 1e-9);
});

Deno.test('suitability, missing entry counts as neutral', () => {
  const withEntry = run({
    pool: [activity({ id: 'a', suitability: new Map([['herding', 2]]) })],
    breedGroup: 'herding',
  });
  assertAlmostEquals(withEntry[0]!.score, 2.0, 1e-9);

  const withoutEntry = run({ pool: [activity({ id: 'b', suitability: new Map() })] });
  assertAlmostEquals(withoutEntry[0]!.score, 0.0, 1e-9);
});

Deno.test('the arousal penalty only applies once recovery need is elevated', () => {
  const none = run({ pool: [activity({ id: 'a', arousal: 3 })], recoveryNeed: 'none' });
  assertAlmostEquals(none[0]!.score, 0.0, 1e-9);

  const medium = run({ pool: [activity({ id: 'a', arousal: 3 })], recoveryNeed: 'medium' });
  assertAlmostEquals(medium[0]!.score, -9.0, 1e-9);
});

Deno.test('recently-done penalty', () => {
  const recent = run({
    pool: [activity({ id: 'sniff' })],
    lastUsedByActivityId: new Map([['sniff', new Date(2026, 2, 7)]]),
  });
  assertAlmostEquals(recent[0]!.score, -2.0, 1e-9);

  const longAgo = run({
    pool: [activity({ id: 'sniff' })],
    lastUsedByActivityId: new Map([['sniff', new Date(2026, 1, 25)]]),
  });
  assertAlmostEquals(longAgo[0]!.score, 0.0, 1e-9);
});

Deno.test('everything combined', () => {
  const result = run({
    pool: [
      activity({ id: 'recall', trainsSkill: 'recall', suitability: new Map([['herding', 1]]) }),
    ],
    candidates: {
      skills: [focus({ skillId: 'recall', priority: 2, overdueDays: 14 })],
      needs: [],
    },
    breedGroup: 'herding',
  });
  assertAlmostEquals(result[0]!.score, 11.0, 1e-9);
});

Deno.test('deterministic tie-break by activity id when scores are equal', () => {
  const result = run({ pool: [activity({ id: 'zebra' }), activity({ id: 'apple' })] });
  assertEquals(result.map((r) => r.activity.id), ['apple', 'zebra']);
});
