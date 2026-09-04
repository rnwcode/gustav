import { assertEquals } from '../planner/dev_deps.ts';
import { parseSkillYaml } from './skill_yaml.ts';

// Mirrors content/skills/rueckruf.yaml.
const rueckruf = {
  id: 'rueckruf',
  name: 'Rückruf',
  kategorie: 'grundsignal',
  voraussetzungen: ['namensaufmerksamkeit'],
  min_alter_wochen: 9,
  ist_kernskill: true,
  zielstufen: { dauer: 1, distanz: 3, ablenkung: 4 },
  beschreibung: 'Der Hund kommt auf ein Signal zuverlässig zurück.\n',
};

Deno.test('parses a skill document into Skill', () => {
  const skill = parseSkillYaml(rueckruf);

  assertEquals(skill, {
    id: 'rueckruf',
    name: 'Rückruf',
    category: 'basicCue',
    prerequisites: ['namensaufmerksamkeit'],
    minAgeWeeks: 9,
    isCoreSkill: true,
    targetLevels: { duration: 1, distance: 3, distraction: 4 },
    description: 'Der Hund kommt auf ein Signal zuverlässig zurück.',
  });
});

Deno.test('a skill without prerequisites gets an empty array', () => {
  const skill = parseSkillYaml({ ...rueckruf, voraussetzungen: null });
  assertEquals(skill.prerequisites, []);
});
