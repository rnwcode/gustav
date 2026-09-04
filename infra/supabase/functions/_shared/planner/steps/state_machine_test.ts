import { assertEquals } from '../dev_deps.ts';
import type { Outcome } from '../models/enums.ts';
import type { Levels } from '../models/levels.ts';
import type { HistoryEntry, SkillState } from '../models/skill_state.ts';
import type { StateMachineConfig } from './state_machine_config.ts';
import { apply, reportProblem } from './state_machine.ts';

// Fixtures from docs/specs/skill-zustandsautomat.md: skill „rueckruf"
// (content id, stays German — see content/skills/rueckruf.yaml), values
// from content/planer.yaml.

const targetLevels: Levels = { duration: 1, distance: 3, distraction: 4 };

const config: StateMachineConfig = {
  increaseAfterSuccesses: 3,
  decreaseAfterFailures: 2,
  order: ['duration', 'distance', 'distraction'],
  generalizeAtDistraction: 2,
  successFactor: 1.8,
  intervals: new Map([
    ['building', { start: 1, cap: 4 }],
    ['generalizing', { start: 3, cap: 14 }],
    ['consolidated', { start: 10, cap: 45 }],
    ['maintenance', { start: 45, cap: 90 }],
  ]),
};

function historyOf(count: number, outcome: Outcome, levels: Levels): HistoryEntry[] {
  return Array.from({ length: count }, () => ({ date: new Date(2026, 2, 1), outcome, levels }));
}

function skillState(
  overrides: Partial<SkillState> & Pick<SkillState, 'status' | 'levels'>,
): SkillState {
  return {
    dogId: 'dog1',
    skillId: 'rueckruf',
    history: [],
    lastPracticedAt: null,
    dueAt: null,
    intervalDays: 0,
    ...overrides,
  };
}

Deno.test('3x succeeded raises the active dimension, lowers only the unfinished one', () => {
  const levels: Levels = { duration: 1, distance: 1, distraction: 1 };
  const state = skillState({
    status: 'building',
    levels,
    history: historyOf(2, 'succeeded', levels),
    intervalDays: 2,
  });

  const result = apply({
    state,
    targetLevels,
    outcome: 'succeeded',
    date: new Date(2026, 2, 10),
    config,
  });

  assertEquals(result.levels, { duration: 1, distance: 2, distraction: 0 });
  assertEquals(result.status, 'building');
  assertEquals(result.intervalDays, 4);
  assertEquals(result.lastPracticedAt, new Date(2026, 2, 10));
  assertEquals(result.dueAt, new Date(2026, 2, 14));
  assertEquals(result.history.at(-1)?.outcome, 'succeeded');
  assertEquals(result.history.at(-1)?.levels, levels);
});

Deno.test('2x notYet in a row lowers the active dimension; at 0 status falls back to building', () => {
  const levels: Levels = { duration: 1, distance: 3, distraction: 1 };
  const state = skillState({
    status: 'generalizing',
    levels,
    history: historyOf(1, 'notYet', levels),
    intervalDays: 3,
  });

  const result = apply({
    state,
    targetLevels,
    outcome: 'notYet',
    date: new Date(2026, 2, 10),
    config,
  });

  assertEquals(result.levels, { duration: 1, distance: 3, distraction: 0 });
  assertEquals(result.status, 'building');
  assertEquals(result.intervalDays, 1);
  assertEquals(result.dueAt, new Date(2026, 2, 11));
});

Deno.test('partial changes neither levels nor interval', () => {
  const levels: Levels = { duration: 0, distance: 0, distraction: 0 };
  const state = skillState({ status: 'building', levels, intervalDays: 1 });

  const result = apply({
    state,
    targetLevels,
    outcome: 'partial',
    date: new Date(2026, 2, 10),
    config,
  });

  assertEquals(result.levels, levels);
  assertEquals(result.status, 'building');
  assertEquals(result.intervalDays, 1);
  assertEquals(result.lastPracticedAt, new Date(2026, 2, 10));
  assertEquals(result.dueAt, new Date(2026, 2, 11));
});

Deno.test('distraction reaches the generalization threshold', () => {
  const levels: Levels = { duration: 1, distance: 3, distraction: 1 };
  const state = skillState({
    status: 'building',
    levels,
    history: historyOf(2, 'succeeded', levels),
    intervalDays: 1,
  });

  const result = apply({
    state,
    targetLevels,
    outcome: 'succeeded',
    date: new Date(2026, 2, 10),
    config,
  });

  assertEquals(result.levels, { duration: 1, distance: 3, distraction: 2 });
  assertEquals(result.status, 'generalizing');
  assertEquals(result.intervalDays, 2);
});

Deno.test('reaching target levels leads to consolidated', () => {
  const levels: Levels = { duration: 1, distance: 3, distraction: 3 };
  const state = skillState({
    status: 'generalizing',
    levels,
    history: historyOf(2, 'succeeded', levels),
    intervalDays: 10,
  });

  const result = apply({
    state,
    targetLevels,
    outcome: 'succeeded',
    date: new Date(2026, 2, 10),
    config,
  });

  assertEquals(result.levels, targetLevels);
  assertEquals(result.status, 'consolidated');
  assertEquals(result.intervalDays, 18);
});

Deno.test('reportProblem throws maintenance back to generalizing', () => {
  const state = skillState({ status: 'maintenance', levels: targetLevels, intervalDays: 45 });

  const result = reportProblem({ state, targetLevels, config });

  assertEquals(result.levels, { duration: 1, distance: 3, distraction: 3 });
  assertEquals(result.status, 'generalizing');
  assertEquals(result.intervalDays, 3);
});

Deno.test('history keeps only the last ten entries', () => {
  const levels: Levels = { duration: 0, distance: 0, distraction: 0 };
  const state = skillState({
    status: 'building',
    levels,
    history: historyOf(10, 'partial', levels),
    intervalDays: 1,
  });

  const result = apply({
    state,
    targetLevels,
    outcome: 'partial',
    date: new Date(2026, 2, 10),
    config,
  });

  assertEquals(result.history.length, 10);
});
