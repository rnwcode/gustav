/**
 * A small seeded PRNG (mulberry32) — the simulator needs randomness for
 * outcomes, but never *unseeded* randomness (`steps/README.md`): the same
 * seed must always replay the same run, or `--gegen` couldn't isolate a
 * config change from noise.
 */
export interface Rng {
  /** A float in [0, 1). */
  next(): number;
}

export function seededRng(seed: number): Rng {
  let state = seed >>> 0;
  return {
    next(): number {
      state = (state + 0x6d2b79f5) >>> 0;
      let t = state;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    },
  };
}
