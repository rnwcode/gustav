import type { Dog } from './models/dog.ts';
import type { Household } from './models/household.ts';
import type { WeeklyContext } from './models/checkin.ts';
import type { Activity } from './models/activity.ts';
import type { Skill } from './models/skill.ts';
import type { SkillState } from './models/skill_state.ts';
import type { NeedDimension } from './models/enums.ts';
import type { WeeklyPlan } from './models/weekly_plan.ts';
import type { PlannerConfig } from './plan_config.ts';
import { buildContext } from './steps/context.ts';
import { buildPeriod } from './steps/period.ts';
import { collectCandidates } from './steps/candidates.ts';
import { filterActivities } from './steps/activity_filter.ts';
import { scoreActivities } from './steps/scoring.ts';
import { assignToDays } from './steps/assignment.ts';
import { crossCheckPeriod } from './steps/cross_check.ts';
import { buildSlots } from './steps/wording.ts';

/**
 * Code version of `plan()` itself — bumped when the step chain or its
 * logic changes meaningfully. Not content, so it lives here rather than
 * in `content/planer.yaml` (CLAUDE.md, rule 10 governs *config* values,
 * not the identity of the code that interprets them).
 */
export const ALGORITHM_VERSION = 1;

/**
 * The whole planner: chains the eight steps from `docs/datenmodell.md`,
 * section „Der Planer", into one `WeeklyPlan` — see `docs/specs/planer.md`.
 * Pure function, no IO, no time access of its own (CLAUDE.md, rules 1–2).
 */
export function plan(args: {
  dog: Dog;
  household: Household;
  weeklyContext: WeeklyContext;
  today: Date;
  loadOverLastSevenDays: readonly number[];
  skillStates: ReadonlyMap<string, SkillState>;
  skillCatalog: readonly Skill[];
  activityCatalog: readonly Activity[];
  needCoverageLastPeriod: ReadonlyMap<NeedDimension, number>;
  lastUsedByVarianceGroup: ReadonlyMap<string, Date>;
  lastUsedByActivityId: ReadonlyMap<string, Date>;
  config: PlannerConfig;
}): WeeklyPlan {
  const {
    dog,
    household,
    weeklyContext,
    today,
    loadOverLastSevenDays,
    skillStates,
    skillCatalog,
    activityCatalog,
    needCoverageLastPeriod,
    lastUsedByVarianceGroup,
    lastUsedByActivityId,
    config,
  } = args;

  const context = buildContext({
    dog,
    household,
    weeklyContext,
    today,
    loadOverLastSevenDays,
    loadBudgetConfig: config.loadBudget,
  });

  const period = buildPeriod({
    startDate: today,
    household,
    lifeStage: context.lifeStage,
    recoveryNeed: context.loadBudget.recoveryNeed,
    config: config.period,
  });

  const candidates = collectCandidates({
    skillStates,
    catalog: skillCatalog,
    dogAgeWeeks: context.ageWeeks,
    priorities: weeklyContext.priorities,
    periodEnd: period.periodEnd,
    needCoverageLastPeriod,
    config: config.candidates,
  });

  const coreSkillIds = new Set(
    skillCatalog.filter((skill) => skill.isCoreSkill).map((skill) => skill.id),
  );

  const admissible = filterActivities({
    catalog: activityCatalog,
    candidates,
    coreSkillIds,
    dogAgeWeeks: context.ageWeeks,
    restrictions: dog.restrictions,
    weeksSinceArrival: context.weeksSinceArrival,
    householdEquipment: household.equipment,
    householdSize: household.householdSize,
    allowedLocations: weeklyContext.constraints.locations,
    today,
    lastUsedByVarianceGroup,
    config: config.activityFilter,
  });

  const scored = scoreActivities({
    pool: admissible,
    candidates,
    breedGroups: dog.breedGroups,
    recoveryNeed: context.loadBudget.recoveryNeed,
    lastUsedByActivityId,
    today,
    config: config.scoring,
  });

  const assignments = assignToDays({
    days: period.days,
    pool: scored,
    config: {
      maxActiveSlots: period.maxActiveSlots,
      maxTrainingSlots: period.maxTrainingSlots,
      minEmptySlots: period.minEmptySlots,
      heavyArousalThreshold: config.assignment.heavyArousalThreshold,
      maxArousalThreshold: config.assignment.maxArousalThreshold,
    },
  });

  const checked = crossCheckPeriod({
    assignments,
    pool: scored,
    maxTrainingSlots: period.maxTrainingSlots,
  });

  const slots = buildSlots({ assignments: checked, pool: scored, candidates });

  return {
    dogId: dog.id,
    periodStart: today,
    periodEnd: period.periodEnd,
    algorithmVersion: ALGORITHM_VERSION,
    configVersion: config.version,
    slots,
  };
}
