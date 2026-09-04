import type { Outcome, SkillStatus } from './enums.ts';
import type { Levels } from './levels.ts';

/**
 * One entry in a skill state's history — the last ten are enough
 * (`docs/datenmodell.md`).
 */
export interface HistoryEntry {
  readonly date: Date;
  readonly outcome: Outcome;
  readonly levels: Levels;
}

/**
 * The state of one skill for one dog. A skill is not a scalar — state is
 * tracked per skill × difficulty (`docs/datenmodell.md`, section „Fünf
 * Entscheidungen").
 *
 * Updates are plain object spreads (`{ ...state, status: 'building' }") —
 * TypeScript needs no dedicated `copyWith` helper for that.
 */
export interface SkillState {
  readonly dogId: string;
  readonly skillId: string;
  readonly status: SkillStatus;
  readonly levels: Levels;

  /** Most recent entry last. */
  readonly history: readonly HistoryEntry[];

  readonly lastPracticedAt: Date | null;
  readonly dueAt: Date | null;
  readonly intervalDays: number;
}
