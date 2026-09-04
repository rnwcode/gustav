import { assertEquals } from '../dev_deps.ts';
import { loadPlannerConfig } from '../../content/loader.ts';
import { plan } from '../plan.ts';
import { FIXTURE_ACTIVITIES } from './activities.ts';
import { FIXTURE_SKILLS } from './skills.ts';
import { FIXTURE_SCENARIOS } from './scenarios.ts';

// Runs plan() against every fixture scenario with the real
// content/planer.yaml config — a smoke test that doubles as a consistency
// check between the fixtures in this directory and the planner itself.

const PLANER_YAML = new URL('../../../../../../content/planer.yaml', import.meta.url);

for (const scenario of FIXTURE_SCENARIOS) {
  Deno.test(`fixture scenario "${scenario.name}" produces a plan without throwing`, async () => {
    const config = await loadPlannerConfig(PLANER_YAML);

    const result = plan({
      dog: scenario.dog,
      household: scenario.household,
      weeklyContext: scenario.weeklyContext,
      today: scenario.today,
      loadOverLastSevenDays: scenario.loadOverLastSevenDays,
      skillStates: scenario.skillStates,
      skillCatalog: FIXTURE_SKILLS,
      activityCatalog: FIXTURE_ACTIVITIES,
      needCoverageLastPeriod: scenario.needCoverageLastPeriod,
      lastUsedByVarianceGroup: scenario.lastUsedByVarianceGroup,
      lastUsedByActivityId: scenario.lastUsedByActivityId,
      config,
    });

    assertEquals(result.dogId, scenario.dog.id);
    assertEquals(result.slots.length > 0, true);
    for (const slot of result.slots) {
      assertEquals(slot.outcome, null);
    }
  });
}
