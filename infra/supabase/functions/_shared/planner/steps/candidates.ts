import type { Priority } from '../models/checkin.ts';
import type { NeedDimension, SkillStatus } from '../models/enums.ts';
import type { Levels } from '../models/levels.ts';
import type { Skill } from '../models/skill.ts';
import type { SkillState } from '../models/skill_state.ts';
import type { CandidateConfig } from './candidates_config.ts';
import { daysBetween } from '../time.ts';

const STARTING_LEVELS: Levels = { duration: 0, distance: 0, distraction: 0 };

const ALL_NEED_DIMENSIONS: readonly NeedDimension[] = [
  'physical',
  'mentalWork',
  'scent',
  'social',
  'recovery',
];

/**
 * One skill that is „in play" this period, with the raw signals scoring
 * (planner step 5) will weigh — see `docs/specs/kandidaten-sammeln.md`.
 */
export interface SkillFocus {
  readonly skillId: string;
  readonly levels: Levels;

  /** 0–3, from the weekly check-in. */
  readonly priority: number;

  /** Days past `dueAt`, relative to the period end. 0 for a skill that is not due at all. */
  readonly overdueDays: number;

  readonly isNewSkill: boolean;

  /**
   * `notStarted` for a new skill (`isNewSkill === true`), otherwise the
   * skill's actual status — used by hard filtering (planner step 4) to
   * admit only refresher activities once a skill is `consolidated` or in
   * `maintenance`.
   */
  readonly status: SkillStatus;
}

/** One need dimension with an unmet gap from the previous period. */
export interface NeedFocus {
  readonly dimension: NeedDimension;

  /** Always > 0 — dimensions without a gap are not included. */
  readonly gap: number;
}

export interface CandidatePool {
  readonly skills: readonly SkillFocus[];
  readonly needs: readonly NeedFocus[];
}

/**
 * Collects everything „in play" for the period: due refreshers,
 * prioritized skills, newly unlocked skills, and unmet need dimensions.
 * Does not filter or score — see `docs/specs/kandidaten-sammeln.md`.
 */
export function collectCandidates(args: {
  skillStates: ReadonlyMap<string, SkillState>;
  catalog: readonly Skill[];
  dogAgeWeeks: number;
  priorities: readonly Priority[];
  periodEnd: Date;
  needCoverageLastPeriod: ReadonlyMap<NeedDimension, number>;
  config: CandidateConfig;
}): CandidatePool {
  const {
    skillStates,
    catalog,
    dogAgeWeeks,
    priorities,
    periodEnd,
    needCoverageLastPeriod,
    config,
  } = args;

  const ids = new Set<string>();
  const levelsById = new Map<string, Levels>();
  const priorityById = new Map<string, number>();
  const overdueById = new Map<string, number>();
  const newSkillIds = new Set<string>();
  const statusById = new Map<string, SkillStatus>();

  for (const [id, state] of skillStates) {
    const dueAt = state.dueAt;
    if (state.status !== 'dormant' && dueAt !== null && dueAt <= periodEnd) {
      ids.add(id);
      levelsById.set(id, state.levels);
      overdueById.set(id, daysBetween(dueAt, periodEnd));
      statusById.set(id, state.status);
    }
  }

  for (const priority of priorities) {
    const state = skillStates.get(priority.skillIdOrTopic);
    if (!state) continue;
    ids.add(priority.skillIdOrTopic);
    levelsById.set(priority.skillIdOrTopic, state.levels);
    priorityById.set(priority.skillIdOrTopic, priority.weight);
    statusById.set(priority.skillIdOrTopic, state.status);
  }

  for (const skill of catalog) {
    if (skillStates.has(skill.id)) continue;
    if (dogAgeWeeks < skill.minAgeWeeks) continue;
    const prerequisitesMet = skill.prerequisites.every((id) => {
      const state = skillStates.get(id);
      return state !== undefined && hasReachedGeneralizing(state.status);
    });
    if (!prerequisitesMet) continue;
    ids.add(skill.id);
    newSkillIds.add(skill.id);
  }

  const skills: SkillFocus[] = [...ids].map((id) => ({
    skillId: id,
    levels: levelsById.get(id) ?? STARTING_LEVELS,
    priority: priorityById.get(id) ?? 0,
    overdueDays: overdueById.get(id) ?? 0,
    isNewSkill: newSkillIds.has(id),
    status: statusById.get(id) ?? 'notStarted',
  }));

  const needs: NeedFocus[] = [];
  for (const dimension of ALL_NEED_DIMENSIONS) {
    const target = config.needTargets.get(dimension) ?? 0;
    const covered = needCoverageLastPeriod.get(dimension) ?? 0;
    const gap = target - covered;
    if (gap > 0) needs.push({ dimension, gap });
  }

  return { skills, needs };
}

function hasReachedGeneralizing(status: SkillStatus): boolean {
  return status === 'generalizing' || status === 'consolidated' || status === 'maintenance';
}
