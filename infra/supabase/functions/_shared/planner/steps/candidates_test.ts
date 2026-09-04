import { assertEquals } from '../dev_deps.ts';
import type { SkillStatus } from '../models/enums.ts';
import type { Levels } from '../models/levels.ts';
import type { Skill } from '../models/skill.ts';
import type { SkillState } from '../models/skill_state.ts';
import type { CandidateConfig } from './candidates_config.ts';
import { collectCandidates } from './candidates.ts';

// Fixtures from docs/specs/kandidaten-sammeln.md.

function skill(overrides: {
  id: string;
  prerequisites?: readonly string[];
  minAgeWeeks?: number;
}): Skill {
  return {
    id: overrides.id,
    name: overrides.id,
    category: 'basicCue',
    prerequisites: overrides.prerequisites ?? [],
    minAgeWeeks: overrides.minAgeWeeks ?? 8,
    isCoreSkill: true,
    targetLevels: { duration: 1, distance: 3, distraction: 4 },
    description: 'test skill',
  };
}

function state(overrides: {
  skillId: string;
  status: SkillStatus;
  levels?: Levels;
  dueAt?: Date | null;
}): SkillState {
  return {
    dogId: 'dog1',
    skillId: overrides.skillId,
    status: overrides.status,
    levels: overrides.levels ?? { duration: 1, distance: 3, distraction: 2 },
    history: [],
    lastPracticedAt: null,
    dueAt: overrides.dueAt ?? null,
    intervalDays: 3,
  };
}

const config: CandidateConfig = {
  needTargets: new Map([
    ['scent', 5],
    ['social', 3],
  ]),
};

Deno.test('a due refresher becomes a skill focus', () => {
  const pool = collectCandidates({
    skillStates: new Map([
      [
        'rueckruf',
        state({
          skillId: 'rueckruf',
          status: 'generalizing',
          levels: { duration: 1, distance: 3, distraction: 2 },
          dueAt: new Date(2026, 2, 10),
        }),
      ],
    ]),
    catalog: [skill({ id: 'rueckruf' })],
    dogAgeWeeks: 40,
    priorities: [],
    periodEnd: new Date(2026, 2, 12),
    needCoverageLastPeriod: new Map(),
    config,
  });

  assertEquals(pool.skills.length, 1);
  const focus = pool.skills[0]!;
  assertEquals(focus.skillId, 'rueckruf');
  assertEquals(focus.levels, { duration: 1, distance: 3, distraction: 2 });
  assertEquals(focus.priority, 0);
  assertEquals(focus.overdueDays, 2);
  assertEquals(focus.isNewSkill, false);
});

Deno.test('a priority raises a not-yet-due skill', () => {
  const pool = collectCandidates({
    skillStates: new Map([
      [
        'leash',
        state({
          skillId: 'leash',
          status: 'building',
          levels: { duration: 0, distance: 1, distraction: 0 },
          dueAt: new Date(2026, 2, 20),
        }),
      ],
    ]),
    catalog: [skill({ id: 'leash' })],
    dogAgeWeeks: 40,
    priorities: [{ skillIdOrTopic: 'leash', weight: 3 }],
    periodEnd: new Date(2026, 2, 12),
    needCoverageLastPeriod: new Map(),
    config,
  });

  assertEquals(pool.skills.length, 1);
  const focus = pool.skills[0]!;
  assertEquals(focus.priority, 3);
  assertEquals(focus.overdueDays, 0);
});

Deno.test('due and prioritized merge into a single focus', () => {
  const pool = collectCandidates({
    skillStates: new Map([
      [
        'rueckruf',
        state({
          skillId: 'rueckruf',
          status: 'generalizing',
          levels: { duration: 1, distance: 3, distraction: 2 },
          dueAt: new Date(2026, 2, 10),
        }),
      ],
    ]),
    catalog: [skill({ id: 'rueckruf' })],
    dogAgeWeeks: 40,
    priorities: [{ skillIdOrTopic: 'rueckruf', weight: 2 }],
    periodEnd: new Date(2026, 2, 12),
    needCoverageLastPeriod: new Map(),
    config,
  });

  assertEquals(pool.skills.length, 1);
  const focus = pool.skills[0]!;
  assertEquals(focus.priority, 2);
  assertEquals(focus.overdueDays, 2);
});

const newSkillCatalog = [skill({ id: 'recall', prerequisites: ['name-focus'], minAgeWeeks: 9 })];

Deno.test('new skill appears once the prerequisite reached generalizing', () => {
  const pool = collectCandidates({
    skillStates: new Map([[
      'name-focus',
      state({ skillId: 'name-focus', status: 'generalizing' }),
    ]]),
    catalog: newSkillCatalog,
    dogAgeWeeks: 12,
    priorities: [],
    periodEnd: new Date(2026, 2, 12),
    needCoverageLastPeriod: new Map(),
    config,
  });

  assertEquals(pool.skills.length, 1);
  const focus = pool.skills[0]!;
  assertEquals(focus.skillId, 'recall');
  assertEquals(focus.isNewSkill, true);
  assertEquals(focus.levels, { duration: 0, distance: 0, distraction: 0 });
  assertEquals(focus.priority, 0);
  assertEquals(focus.overdueDays, 0);
});

Deno.test('new skill does not appear while the prerequisite is still building', () => {
  const pool = collectCandidates({
    skillStates: new Map([['name-focus', state({ skillId: 'name-focus', status: 'building' })]]),
    catalog: newSkillCatalog,
    dogAgeWeeks: 12,
    priorities: [],
    periodEnd: new Date(2026, 2, 12),
    needCoverageLastPeriod: new Map(),
    config,
  });

  assertEquals(pool.skills.length, 0);
});

Deno.test('new skill does not appear before the minimum age, regardless of prerequisites', () => {
  const pool = collectCandidates({
    skillStates: new Map(),
    catalog: newSkillCatalog,
    dogAgeWeeks: 7,
    priorities: [],
    periodEnd: new Date(2026, 2, 12),
    needCoverageLastPeriod: new Map(),
    config,
  });

  assertEquals(pool.skills.length, 0);
});

Deno.test('need gaps are collected, including dimensions with no coverage at all', () => {
  const pool = collectCandidates({
    skillStates: new Map(),
    catalog: [],
    dogAgeWeeks: 40,
    priorities: [],
    periodEnd: new Date(2026, 2, 12),
    needCoverageLastPeriod: new Map([['scent', 2]]),
    config,
  });

  assertEquals(pool.needs, [
    { dimension: 'scent', gap: 3 },
    { dimension: 'social', gap: 3 },
  ]);
});
