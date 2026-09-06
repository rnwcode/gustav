import { assertEquals } from '../_shared/planner/dev_deps.ts';
import type { Activity, Needs } from '../_shared/planner/models/activity.ts';
import type { Skill } from '../_shared/planner/models/skill.ts';
import type { StateMachineConfig } from '../_shared/planner/steps/state_machine_config.ts';
import { applyReview } from './review.ts';

const ZERO_NEEDS: Needs = { physical: 0, mentalWork: 0, scent: 0, social: 0, recovery: 0 };

function activity(overrides: { id: string; trainsSkill?: string | null }): Activity {
  return {
    id: overrides.id,
    title: overrides.id,
    sentence: 'sentence',
    type: 'training',
    trainsSkill: overrides.trainsSkill ?? null,
    needs: ZERO_NEEDS,
    arousal: 1,
    durationMin: 5,
    durationMax: 10,
    location: 'any',
    forDistraction: [0, 5],
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
    varianceGroup: overrides.id,
    cooldownDays: 0,
    illustration: null,
    instructions: [],
    successCriterion: 'criterion',
    commonMistakes: [],
    troubleshooting: [],
  };
}

const recall: Skill = {
  id: 'recall',
  name: 'Rückruf',
  category: 'basicCue',
  prerequisites: [],
  minAgeWeeks: 8,
  isCoreSkill: true,
  targetLevels: { duration: 1, distance: 3, distraction: 4 },
  description: 'fixture',
};

const stateMachineConfig: StateMachineConfig = {
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

Deno.test('a rated slot without a skill link only updates slot.outcome', () => {
  const enrichment = activity({ id: 'sniff' });
  const result = applyReview({
    entries: [{ slotId: 'slot-1', outcome: 'succeeded' }],
    slotsById: new Map([['slot-1', { id: 'slot-1', date: '2026-03-16', activity_id: 'sniff' }]]),
    activityById: new Map([['sniff', enrichment]]),
    skillById: new Map(),
    skillStates: new Map(),
    stateMachineConfig,
    dogId: 'dog-1',
  });

  assertEquals(result.slotOutcomeUpdates, [{ slotId: 'slot-1', outcome: 'succeeded' }]);
  assertEquals(result.updatedSkillStates.size, 0);
});

Deno.test('a succeeded rating on a new skill creates and advances a SkillState', () => {
  const training = activity({ id: 'recall-intro', trainsSkill: 'recall' });
  const result = applyReview({
    entries: [{ slotId: 'slot-1', outcome: 'succeeded' }],
    slotsById: new Map([['slot-1', {
      id: 'slot-1',
      date: '2026-03-16',
      activity_id: 'recall-intro',
    }]]),
    activityById: new Map([['recall-intro', training]]),
    skillById: new Map([['recall', recall]]),
    skillStates: new Map(),
    stateMachineConfig,
    dogId: 'dog-1',
  });

  const state = result.updatedSkillStates.get('recall');
  assertEquals(state?.dogId, 'dog-1');
  assertEquals(state?.status, 'building');
  assertEquals(state?.lastPracticedAt, new Date('2026-03-16'));
});

Deno.test('skipped/notCompleted ratings never touch the state machine', () => {
  const training = activity({ id: 'recall-intro', trainsSkill: 'recall' });
  const result = applyReview({
    entries: [{ slotId: 'slot-1', outcome: 'skipped' }],
    slotsById: new Map([['slot-1', {
      id: 'slot-1',
      date: '2026-03-16',
      activity_id: 'recall-intro',
    }]]),
    activityById: new Map([['recall-intro', training]]),
    skillById: new Map([['recall', recall]]),
    skillStates: new Map(),
    stateMachineConfig,
    dogId: 'dog-1',
  });

  assertEquals(result.updatedSkillStates.size, 0);
  assertEquals(result.slotOutcomeUpdates, [{ slotId: 'slot-1', outcome: 'skipped' }]);
});

Deno.test('an empty slot (no activity) still records outcome if rated, without touching state', () => {
  const result = applyReview({
    entries: [{ slotId: 'slot-1', outcome: 'succeeded' }],
    slotsById: new Map([['slot-1', { id: 'slot-1', date: '2026-03-16', activity_id: null }]]),
    activityById: new Map(),
    skillById: new Map(),
    skillStates: new Map(),
    stateMachineConfig,
    dogId: 'dog-1',
  });

  assertEquals(result.updatedSkillStates.size, 0);
  assertEquals(result.slotOutcomeUpdates, [{ slotId: 'slot-1', outcome: 'succeeded' }]);
});
