import type { Activity } from '../models/activity.ts';
import { needFor } from '../models/activity.ts';
import type { LifeStage, NeedDimension, Outcome, RecoveryNeed } from '../models/enums.ts';
import type { Skill } from '../models/skill.ts';
import type { SkillState } from '../models/skill_state.ts';
import type { WeeklyContext } from '../models/checkin.ts';
import type { WeeklyPlan } from '../models/weekly_plan.ts';
import { buildContext } from '../steps/context.ts';
import { buildPeriod } from '../steps/period.ts';
import { apply } from '../steps/state_machine.ts';
import type { StateMachineConfig } from '../steps/state_machine_config.ts';
import { addDays } from '../time.ts';
import { plan } from '../plan.ts';
import type { PlannerConfig } from '../plan_config.ts';
import type { FixtureScenario } from '../fixtures/scenarios.ts';
import type { Rng } from './rng.ts';
import type { SimulationProfile } from './profiles.ts';

const ALL_NEED_DIMENSIONS: readonly NeedDimension[] = [
  'physical',
  'mentalWork',
  'scent',
  'social',
  'recovery',
];

const FALLBACK_WEEKLY_CONTEXT: WeeklyContext = {
  priorities: [],
  constraints: { days: new Set(), minutesPerDay: null, locations: [] },
  flags: new Set(),
  source: 'fallback',
};

/** One period's plan, plus the context values that produced it — for `--check` and printing. */
export interface SimulatedPeriod {
  readonly periodIndex: number;
  readonly lifeStage: LifeStage;
  readonly recoveryNeed: RecoveryNeed;
  readonly maxActiveSlots: number;
  readonly maxTrainingSlots: number;
  readonly plan: WeeklyPlan;
}

export interface SimulationResult {
  readonly scenarioName: string;
  readonly profileName: string;
  readonly periods: readonly SimulatedPeriod[];
}

function sampleOutcome(
  rng: Rng,
  profile: SimulationProfile,
  periodIndex: number,
  isTrainingLinked: boolean,
): Outcome {
  if (rng.next() >= profile.completionRate(periodIndex)) {
    return rng.next() < profile.notCompletedShare ? 'notCompleted' : 'skipped';
  }
  if (!isTrainingLinked) return 'succeeded';
  if (rng.next() < profile.successRate(periodIndex)) return 'succeeded';
  return rng.next() < profile.partialShare ? 'partial' : 'notYet';
}

/** Whether a slot's outcome counts toward load and need coverage — see `docs/datenmodell.md`. */
function isCounted(outcome: Outcome): boolean {
  return outcome === 'succeeded' || outcome === 'partial';
}

function lastSevenDaysLoad(dailyLoads: ReadonlyMap<string, number>, periodStart: Date): number[] {
  const loads: number[] = [];
  for (let i = 7; i >= 1; i--) {
    const date = addDays(periodStart, -i);
    loads.push(dailyLoads.get(date.toISOString()) ?? 0);
  }
  return loads;
}

/**
 * Plays a synthetic owner (`profile`) through `periods` periods, starting
 * from `scenario`. Pure — the only randomness is `rng`, so the same seed
 * always replays the same run (`docs/bauplan.md`; `steps/README.md`, „no
 * unseeded random numbers").
 */
export function simulate(args: {
  scenario: FixtureScenario;
  skillCatalog: readonly Skill[];
  activityCatalog: readonly Activity[];
  plannerConfig: PlannerConfig;
  stateMachineConfig: StateMachineConfig;
  profile: SimulationProfile;
  periods: number;
  rng: Rng;
}): SimulationResult {
  const {
    scenario,
    skillCatalog,
    activityCatalog,
    plannerConfig,
    stateMachineConfig,
    profile,
    periods,
    rng,
  } = args;

  const activityById = new Map(activityCatalog.map((a) => [a.id, a]));
  const skillById = new Map(skillCatalog.map((s) => [s.id, s]));

  let skillStates = new Map(scenario.skillStates);
  let lastUsedByVarianceGroup = new Map(scenario.lastUsedByVarianceGroup);
  let lastUsedByActivityId = new Map(scenario.lastUsedByActivityId);
  let needCoverageLastPeriod = new Map(scenario.needCoverageLastPeriod);
  const dailyLoads = new Map<string, number>();
  let today = scenario.today;

  const simulatedPeriods: SimulatedPeriod[] = [];

  for (let periodIndex = 0; periodIndex < periods; periodIndex++) {
    const loadOverLastSevenDays = lastSevenDaysLoad(dailyLoads, today);
    const weeklyContext = periodIndex === 0 || rng.next() < profile.checkInRate(periodIndex)
      ? scenario.weeklyContext
      : FALLBACK_WEEKLY_CONTEXT;

    // Recomputed alongside plan() only to expose it for --check/printing —
    // plan() already does this internally, this does not change the result.
    const context = buildContext({
      dog: scenario.dog,
      household: scenario.household,
      weeklyContext,
      today,
      loadOverLastSevenDays,
      loadBudgetConfig: plannerConfig.loadBudget,
    });
    const period = buildPeriod({
      startDate: today,
      household: scenario.household,
      lifeStage: context.lifeStage,
      recoveryNeed: context.loadBudget.recoveryNeed,
      config: plannerConfig.period,
    });

    const weeklyPlan = plan({
      dog: scenario.dog,
      household: scenario.household,
      weeklyContext,
      today,
      loadOverLastSevenDays,
      skillStates,
      skillCatalog,
      activityCatalog,
      needCoverageLastPeriod,
      lastUsedByVarianceGroup,
      lastUsedByActivityId,
      config: plannerConfig,
    });

    simulatedPeriods.push({
      periodIndex,
      lifeStage: context.lifeStage,
      recoveryNeed: context.loadBudget.recoveryNeed,
      maxActiveSlots: period.maxActiveSlots,
      maxTrainingSlots: period.maxTrainingSlots,
      plan: weeklyPlan,
    });

    const nextNeedCoverage = new Map<NeedDimension, number>();
    const nextVarianceGroup = new Map(lastUsedByVarianceGroup);
    const nextActivityId = new Map(lastUsedByActivityId);
    let nextSkillStates = skillStates;

    for (const slot of weeklyPlan.slots) {
      if (slot.activityId === null) continue;
      const activity = activityById.get(slot.activityId);
      if (activity === undefined) continue;

      const isTrainingLinked = activity.trainsSkill !== null;
      const outcome = sampleOutcome(rng, profile, periodIndex, isTrainingLinked);

      nextVarianceGroup.set(activity.varianceGroup, slot.date);
      nextActivityId.set(activity.id, slot.date);

      const counted = isCounted(outcome);
      dailyLoads.set(slot.date.toISOString(), counted ? activity.arousal : 0);

      if (counted) {
        for (const dimension of ALL_NEED_DIMENSIONS) {
          const contribution = needFor(activity.needs, dimension);
          if (contribution > 0) {
            nextNeedCoverage.set(dimension, (nextNeedCoverage.get(dimension) ?? 0) + contribution);
          }
        }
      }

      if (
        activity.trainsSkill !== null &&
        (outcome === 'succeeded' || outcome === 'partial' || outcome === 'notYet')
      ) {
        const skill = skillById.get(activity.trainsSkill);
        if (skill !== undefined) {
          const state: SkillState = skillStates.get(skill.id) ?? freshSkillState({
            dogId: scenario.dog.id,
            skillId: skill.id,
            stateMachineConfig,
          });
          if (nextSkillStates === skillStates) nextSkillStates = new Map(skillStates);
          nextSkillStates.set(
            skill.id,
            apply({
              state,
              targetLevels: skill.targetLevels,
              outcome,
              date: slot.date,
              config: stateMachineConfig,
            }),
          );
        }
      }
    }

    skillStates = nextSkillStates;
    lastUsedByVarianceGroup = nextVarianceGroup;
    lastUsedByActivityId = nextActivityId;
    needCoverageLastPeriod = nextNeedCoverage;
    today = addDays(weeklyPlan.periodEnd, 1);
  }

  return { scenarioName: scenario.name, profileName: profile.name, periods: simulatedPeriods };
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
    // 'notStarted' means "no SkillState row exists yet" (collectCandidates
    // treats a missing entry that way) — the row itself starts at
    // 'building' the moment a first assessment creates it.
    status: 'building',
    levels: { duration: 0, distance: 0, distraction: 0 },
    history: [],
    lastPracticedAt: null,
    dueAt: null,
    intervalDays: buildingInterval?.start ?? 1,
  };
}
