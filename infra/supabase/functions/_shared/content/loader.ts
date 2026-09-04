import { parse as parseYaml } from 'https://deno.land/std@0.224.0/yaml/mod.ts';
import type { Activity } from '../planner/models/activity.ts';
import type { Skill } from '../planner/models/skill.ts';
import type { PlannerConfig } from '../planner/plan_config.ts';
import { parseActivityYaml } from './activity_yaml.ts';
import { parseSkillYaml } from './skill_yaml.ts';
import { parsePlanerConfigYaml } from './planer_yaml.ts';

/**
 * Reads and YAML-parses every `*.yaml` file directly inside `dir`. Local
 * tooling only (the simulator, a future seed script) — never called from
 * inside `_shared/planner/`, which stays free of IO (CLAUDE.md, rule 1).
 * A deployed Edge Function reads the seeded catalog from Postgres instead
 * (CLAUDE.md, rule 10), not from these files.
 */
async function readYamlDocuments(dir: string | URL): Promise<unknown[]> {
  const docs: unknown[] = [];
  for await (const entry of Deno.readDir(dir)) {
    if (!entry.isFile || !entry.name.endsWith('.yaml')) continue;
    const path = new URL(entry.name, dir instanceof URL ? dir : `file://${dir}/`);
    docs.push(parseYaml(await Deno.readTextFile(path)));
  }
  return docs;
}

/** Loads every `content/skills/*.yaml` file into `Skill[]`. */
export async function loadSkillCatalog(dir: string | URL): Promise<Skill[]> {
  const docs = await readYamlDocuments(dir);
  return docs.map(parseSkillYaml);
}

/** Loads every `content/aktivitaeten/*.yaml` file into `Activity[]`. */
export async function loadActivityCatalog(dir: string | URL): Promise<Activity[]> {
  const docs = await readYamlDocuments(dir);
  return docs.map(parseActivityYaml);
}

/** Loads `content/planer.yaml` into `PlannerConfig`. */
export async function loadPlannerConfig(path: string | URL): Promise<PlannerConfig> {
  const text = await Deno.readTextFile(path);
  return parsePlanerConfigYaml(parseYaml(text));
}
