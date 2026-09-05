import type { Dimension } from './enums.ts';

/**
 * The three Ds of a skill: duration, distance, distraction, each 0–5.
 *
 * Only ever raising one dimension at a time is the state machine's job, not
 * this type's — `Levels` is a plain data holder.
 */
export interface Levels {
  readonly duration: number;
  readonly distance: number;
  readonly distraction: number;
}

export function levelFor(levels: Levels, dimension: Dimension): number {
  switch (dimension) {
    case 'duration':
      return levels.duration;
    case 'distance':
      return levels.distance;
    case 'distraction':
      return levels.distraction;
  }
}

export function withLevel(levels: Levels, dimension: Dimension, value: number): Levels {
  switch (dimension) {
    case 'duration':
      return { ...levels, duration: value };
    case 'distance':
      return { ...levels, distance: value };
    case 'distraction':
      return { ...levels, distraction: value };
  }
}

export function levelsEqual(a: Levels, b: Levels): boolean {
  return a.duration === b.duration && a.distance === b.distance && a.distraction === b.distraction;
}
