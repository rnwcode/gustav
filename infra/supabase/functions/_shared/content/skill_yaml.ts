import type { Skill } from '../planner/models/skill.ts';
import { skillCategoryFromGerman } from './german_enums.ts';

/** The shape of one `content/skills/*.yaml` file, per `content/schema/skill.yaml`. */
interface RawSkillYaml {
  readonly id: string;
  readonly name: string;
  readonly kategorie: string;
  readonly voraussetzungen: readonly string[] | null;
  readonly min_alter_wochen: number;
  readonly ist_kernskill: boolean;
  readonly zielstufen: {
    readonly dauer: number;
    readonly distanz: number;
    readonly ablenkung: number;
  };
  readonly beschreibung: string;
}

/** Maps one already YAML-parsed skill document onto `Skill`. */
export function parseSkillYaml(raw: unknown): Skill {
  const yaml = raw as RawSkillYaml;
  return {
    id: yaml.id,
    name: yaml.name,
    category: skillCategoryFromGerman(yaml.kategorie),
    prerequisites: yaml.voraussetzungen ?? [],
    minAgeWeeks: yaml.min_alter_wochen,
    isCoreSkill: yaml.ist_kernskill,
    targetLevels: {
      duration: yaml.zielstufen.dauer,
      distance: yaml.zielstufen.distanz,
      distraction: yaml.zielstufen.ablenkung,
    },
    description: yaml.beschreibung.trim(),
  };
}
