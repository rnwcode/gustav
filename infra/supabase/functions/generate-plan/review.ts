import type { Activity } from '../_shared/planner/models/activity.ts';
import type { Outcome } from '../_shared/planner/models/enums.ts';
import type { Skill } from '../_shared/planner/models/skill.ts';
import type { SkillState } from '../_shared/planner/models/skill_state.ts';
import { apply } from '../_shared/planner/steps/state_machine.ts';
import type { StateMachineConfig } from '../_shared/planner/steps/state_machine_config.ts';

export interface ReviewEntry {
  readonly slotId: string;
  readonly outcome: Outcome;
}

/** The previous period's slots, only what's needed to resolve which skill (if any) a rating trains. */
export interface RatedSlotRow {
  readonly id: string;
  readonly date: string;
  readonly activity_id: string | null;
}

function freshSkillState(args: {
  dogId: string;
  skillId: string;
  stateMachineConfig: StateMachineConfig;
}): SkillState {
  const buildingInterval = args.stateMachineConfig.intervals.get('building');
  return {
    dogId: args.dogId,
    skillId: args.skillId,
    // 'notStarted' means "no row exists yet" — the row itself starts at
    // 'building' once a first assessment creates it (see simulate/run.ts).
    status: 'building',
    levels: { duration: 0, distance: 0, distraction: 0 },
    history: [],
    lastPracticedAt: null,
    dueAt: null,
    intervalDays: buildingInterval?.start ?? 1,
  };
}

/**
 * Processes one check-in's `review` — the ratings for the *previous*
 * period's slots — into updated `SkillState`s (via the state machine) and
 * the `slot.outcome` values to persist. Pure: no IO, the caller reads and
 * writes Postgres.
 */
export function applyReview(args: {
  entries: readonly ReviewEntry[];
  slotsById: ReadonlyMap<string, RatedSlotRow>;
  activityById: ReadonlyMap<string, Activity>;
  skillById: ReadonlyMap<string, Skill>;
  skillStates: ReadonlyMap<string, SkillState>;
  stateMachineConfig: StateMachineConfig;
  dogId: string;
}): {
  updatedSkillStates: Map<string, SkillState>;
  slotOutcomeUpdates: readonly { slotId: string; outcome: Outcome }[];
} {
  const { entries, slotsById, activityById, skillById, stateMachineConfig, dogId } = args;

  const updatedSkillStates = new Map(args.skillStates);
  const slotOutcomeUpdates: { slotId: string; outcome: Outcome }[] = [];

  for (const entry of entries) {
    slotOutcomeUpdates.push({ slotId: entry.slotId, outcome: entry.outcome });

    const slot = slotsById.get(entry.slotId);
    if (slot === undefined || slot.activity_id === null) continue;
    const activity = activityById.get(slot.activity_id);
    if (activity === undefined || activity.trainsSkill === null) continue;

    const outcome = entry.outcome;
    if (outcome !== 'succeeded' && outcome !== 'partial' && outcome !== 'notYet') continue;

    const skill = skillById.get(activity.trainsSkill);
    if (skill === undefined) continue;

    const state = updatedSkillStates.get(skill.id) ??
      freshSkillState({ dogId, skillId: skill.id, stateMachineConfig });
    updatedSkillStates.set(
      skill.id,
      apply({
        state,
        targetLevels: skill.targetLevels,
        outcome,
        date: new Date(slot.date),
        config: stateMachineConfig,
      }),
    );
  }

  return { updatedSkillStates, slotOutcomeUpdates };
}
