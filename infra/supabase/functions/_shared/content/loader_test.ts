import { assertEquals } from '../planner/dev_deps.ts';
import {
  loadActivityCatalog,
  loadPlannerConfig,
  loadSkillCatalog,
  loadStateMachineConfig,
} from './loader.ts';

// Integration test against the real repo content — doubles as an early
// warning if content/schema/*.yaml and this loader drift apart.

const SKILLS_DIR = new URL('../../../../../content/skills/', import.meta.url);
const ACTIVITIES_DIR = new URL('../../../../../content/aktivitaeten/', import.meta.url);
const PLANER_YAML = new URL('../../../../../content/planer.yaml', import.meta.url);

Deno.test('loads the real skill catalog', async () => {
  const skills = await loadSkillCatalog(SKILLS_DIR);
  assertEquals(skills.length > 0, true);

  const rueckruf = skills.find((s) => s.id === 'rueckruf');
  assertEquals(rueckruf?.category, 'basicCue');
  assertEquals(rueckruf?.isCoreSkill, true);
});

Deno.test('loads the real activity catalog', async () => {
  const activities = await loadActivityCatalog(ACTIVITIES_DIR);
  assertEquals(activities.length > 0, true);

  const sniff = activities.find((a) => a.id === 'schnueffelteppich_einfuehrung');
  assertEquals(sniff?.type, 'enrichment');
  assertEquals(sniff?.trainsSkill, null);
  assertEquals(sniff?.needs.scent, 3);
});

Deno.test('loads the real planner config', async () => {
  const config = await loadPlannerConfig(PLANER_YAML);
  assertEquals(config.version >= 1, true);
  assertEquals(config.period.regularLengthDays, 7);
});

Deno.test('loads the real state machine config', async () => {
  const config = await loadStateMachineConfig(PLANER_YAML);
  assertEquals(config.order, ['duration', 'distance', 'distraction']);
  assertEquals(config.intervals.get('building')?.start, 1);
});
