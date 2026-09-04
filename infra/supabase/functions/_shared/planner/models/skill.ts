import type { SkillCategory } from './enums.ts';
import type { Levels } from './levels.ts';

/**
 * Something a dog can learn. Difficulty is three-dimensional (duration,
 * distance, distraction) — content comes from `content/skills/*.yaml`, see
 * `content/schema/skill.yaml`.
 */
export interface Skill {
  readonly id: string;
  readonly name: string;
  readonly category: SkillCategory;

  /** Skill IDs that must have reached at least `generalizing` status. */
  readonly prerequisites: readonly string[];

  readonly minAgeWeeks: number;

  /**
   * Core skills are exempt from the variance-group cooldown — basic cues
   * need repetition (`docs/datenmodell.md`, section Aktivität).
   */
  readonly isCoreSkill: boolean;

  readonly targetLevels: Levels;
  readonly description: string;
}
