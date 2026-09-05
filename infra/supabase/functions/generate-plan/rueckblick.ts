import type { Activity } from '../_shared/planner/models/activity.ts';
import type { Skill } from '../_shared/planner/models/skill.ts';
import type { SkillState } from '../_shared/planner/models/skill_state.ts';
import { apply } from '../_shared/planner/steps/state_machine.ts';
import type { StateMachineConfig } from '../_shared/planner/steps/state_machine_config.ts';
import { outcomeFromGerman } from '../_shared/content/german_enums.ts';

export interface RueckblickEntry {
  readonly slotId: string;
  /** German — `klappte`/`so_halb`/`noch_nicht`/`uebersprungen`/`nicht_geschafft`, as typed by the app. */
  readonly ergebnis: string;
}

/** The previous period's slots, only what's needed to resolve which skill (if any) a rating trains. */
export interface RatedSlotRow {
  readonly id: string;
  readonly datum: string;
  readonly aktivitaet_id: string | null;
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
 * Processes one check-in's `rueckblick` — the ratings for the *previous*
 * period's slots — into updated `SkillState`s (via the state machine) and
 * the `slot.ergebnis` values to persist. Pure: no IO, the caller reads and
 * writes Postgres.
 */
export function applyRueckblick(args: {
  entries: readonly RueckblickEntry[];
  slotsById: ReadonlyMap<string, RatedSlotRow>;
  activityById: ReadonlyMap<string, Activity>;
  skillById: ReadonlyMap<string, Skill>;
  skillStates: ReadonlyMap<string, SkillState>;
  stateMachineConfig: StateMachineConfig;
  dogId: string;
}): {
  updatedSkillStates: Map<string, SkillState>;
  slotErgebnisUpdates: readonly { slotId: string; ergebnis: string }[];
} {
  const { entries, slotsById, activityById, skillById, stateMachineConfig, dogId } = args;

  const updatedSkillStates = new Map(args.skillStates);
  const slotErgebnisUpdates: { slotId: string; ergebnis: string }[] = [];

  for (const entry of entries) {
    slotErgebnisUpdates.push({ slotId: entry.slotId, ergebnis: entry.ergebnis });

    const slot = slotsById.get(entry.slotId);
    if (slot === undefined || slot.aktivitaet_id === null) continue;
    const activity = activityById.get(slot.aktivitaet_id);
    if (activity === undefined || activity.trainsSkill === null) continue;

    const outcome = outcomeFromGerman(entry.ergebnis);
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
        date: new Date(slot.datum),
        config: stateMachineConfig,
      }),
    );
  }

  return { updatedSkillStates, slotErgebnisUpdates };
}
