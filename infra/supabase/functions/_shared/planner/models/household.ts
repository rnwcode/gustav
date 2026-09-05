import type { Experience, HousingType, Surroundings, Weekday } from './enums.ts';

/**
 * The circumstances of the household the dog lives in.
 *
 * Time budgets are in minutes — Dart's `Duration` type has no natural TS
 * equivalent, and minutes is what `content/planer.yaml` and the assignment
 * step (`PeriodDay.timeBudgetMinutes`) already reason in.
 */
export interface Household {
  readonly id: string;

  /** Only for weather — no GPS (`docs/datenmodell.md`). */
  readonly postalCode: string | null;

  readonly housingType: HousingType;
  readonly surroundings: Surroundings;
  readonly experience: Experience;

  readonly weekdayTimeBudgetMinutes: number;
  readonly weekendTimeBudgetMinutes: number;

  readonly trainingDays: ReadonlySet<Weekday>;

  /** Defaults to Sunday, changeable — e.g. for shift work. */
  readonly planningDay: Weekday;

  /** Multiple people training the same dog is a consistency problem, not a bonus. */
  readonly householdSize: number;

  readonly equipment: readonly string[];
}
