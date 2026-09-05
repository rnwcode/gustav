import { assertEquals } from '../dev_deps.ts';
import { loadPlannerConfig, loadStateMachineConfig } from '../../content/loader.ts';
import { FIXTURE_ACTIVITIES } from '../fixtures/activities.ts';
import { FIXTURE_SKILLS } from '../fixtures/skills.ts';
import { FIXTURE_SCENARIOS } from '../fixtures/scenarios.ts';
import { seededRng } from './rng.ts';
import { DILIGENT_PROFILE, GIVING_UP_PROFILE, IRREGULAR_PROFILE } from './profiles.ts';
import { simulate } from './run.ts';

const PLANER_YAML = new URL('../../../../../../content/planer.yaml', import.meta.url);

Deno.test('simulating twelve periods for every scenario and profile does not throw', async () => {
  const plannerConfig = await loadPlannerConfig(PLANER_YAML);
  const stateMachineConfig = await loadStateMachineConfig(PLANER_YAML);

  for (const scenario of FIXTURE_SCENARIOS) {
    for (const profile of [DILIGENT_PROFILE, IRREGULAR_PROFILE, GIVING_UP_PROFILE]) {
      const result = simulate({
        scenario,
        skillCatalog: FIXTURE_SKILLS,
        activityCatalog: FIXTURE_ACTIVITIES,
        plannerConfig,
        stateMachineConfig,
        profile,
        periods: 12,
        rng: seededRng(42),
      });

      assertEquals(result.periods.length, 12);
      assertEquals(result.scenarioName, scenario.name);
      assertEquals(result.profileName, profile.name);
    }
  }
});

Deno.test('the same seed replays the same simulation', async () => {
  const plannerConfig = await loadPlannerConfig(PLANER_YAML);
  const stateMachineConfig = await loadStateMachineConfig(PLANER_YAML);
  const scenario = FIXTURE_SCENARIOS[0]!;

  const args = {
    scenario,
    skillCatalog: FIXTURE_SKILLS,
    activityCatalog: FIXTURE_ACTIVITIES,
    plannerConfig,
    stateMachineConfig,
    profile: IRREGULAR_PROFILE,
    periods: 6,
  };

  const a = simulate({ ...args, rng: seededRng(7) });
  const b = simulate({ ...args, rng: seededRng(7) });

  assertEquals(a, b);
});

Deno.test('periods advance chronologically, each starting the day after the previous ends', async () => {
  const plannerConfig = await loadPlannerConfig(PLANER_YAML);
  const stateMachineConfig = await loadStateMachineConfig(PLANER_YAML);
  const scenario = FIXTURE_SCENARIOS[0]!;

  const result = simulate({
    scenario,
    skillCatalog: FIXTURE_SKILLS,
    activityCatalog: FIXTURE_ACTIVITIES,
    plannerConfig,
    stateMachineConfig,
    profile: DILIGENT_PROFILE,
    periods: 3,
    rng: seededRng(1),
  });

  for (let i = 1; i < result.periods.length; i++) {
    const previous = result.periods[i - 1]!.plan;
    const current = result.periods[i]!.plan;
    const expectedStart = new Date(previous.periodEnd.getTime() + 24 * 60 * 60 * 1000);
    assertEquals(current.periodStart, expectedStart);
  }
});
