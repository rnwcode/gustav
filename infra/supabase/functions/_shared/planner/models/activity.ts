import type { ActivityType, BreedGroup, Location, NeedDimension } from './enums.ts';

/**
 * The second currency: how much an activity covers each of the five need
 * dimensions, 0–3 (`docs/datenmodell.md`, section „Fünf Entscheidungen").
 */
export interface Needs {
  readonly physical: number;
  readonly mentalWork: number;
  readonly scent: number;
  readonly social: number;
  readonly recovery: number;
}

export function needFor(needs: Needs, dimension: NeedDimension): number {
  switch (dimension) {
    case 'physical':
      return needs.physical;
    case 'mentalWork':
      return needs.mentalWork;
    case 'scent':
      return needs.scent;
    case 'social':
      return needs.social;
    case 'recovery':
      return needs.recovery;
  }
}

export interface TroubleshootingEntry {
  readonly problem: string;
  readonly answer: string;
}

/**
 * Anything that can fill a day's slot: a training session, a sniffing game,
 * a daily routine, a rest suggestion. Not every activity trains a skill.
 * Content comes from `content/aktivitaeten/*.yaml`, see
 * `content/schema/aktivitaet.yaml`.
 */
export interface Activity {
  readonly id: string;
  readonly title: string;

  /** THE sentence for the day view, one or two lines. */
  readonly sentence: string;

  readonly type: ActivityType;

  /** `null` for enrichment. */
  readonly trainsSkill: string | null;

  readonly needs: Needs;

  /** 0–3, how much arousal is left afterwards. */
  readonly arousal: number;

  readonly durationMin: number;
  readonly durationMax: number;
  readonly location: Location;

  /** Only for `type === 'training'`: the matching distraction levels, as [min, max]. */
  readonly forDistraction: readonly [number, number] | null;

  readonly isRefresher: boolean;

  readonly heatSuitable: boolean;
  readonly rainSuitable: boolean;
  readonly darknessSuitable: boolean;
  readonly jointStraining: boolean;

  /** e.g. `[10, 11, 12]` for New Year's Eve preparation. */
  readonly seasonalWindow: readonly number[] | null;

  readonly equipment: readonly string[];
  readonly secondPerson: boolean;
  readonly minAgeWeeks: number;
  readonly maxAgeWeeks: number | null;

  /** Weighted, NEVER filters hard (`docs/datenmodell.md`). */
  readonly suitability: ReadonlyMap<BreedGroup, number>;

  /**
   * The cooldown is tied to the variance group, not the activity — basic
   * cues need repetition, enrichment doesn't.
   */
  readonly varianceGroup: string;
  readonly cooldownDays: number;

  readonly illustration: string | null;
  readonly instructions: readonly string[];
  readonly successCriterion: string;
  readonly commonMistakes: readonly string[];
  readonly troubleshooting: readonly TroubleshootingEntry[];
}
