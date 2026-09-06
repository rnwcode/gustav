import type { Weekday } from './weekday';

export const HOUSING_TYPE_OPTIONS = [
  { value: 'apartment', label: 'Wohnung' },
  { value: 'houseWithGarden', label: 'Haus' },
] as const;
export type HousingType = (typeof HOUSING_TYPE_OPTIONS)[number]['value'];

export const SURROUNDINGS_OPTIONS = [
  { value: 'city', label: 'Stadt' },
  { value: 'suburb', label: 'Stadtrand' },
  { value: 'countryside', label: 'Land' },
] as const;
export type Surroundings = (typeof SURROUNDINGS_OPTIONS)[number]['value'];

export const EXPERIENCE_OPTIONS = [
  { value: 'firstTimeOwner', label: 'Erster Hund' },
  { value: 'experienced', label: 'Schon Erfahrung' },
] as const;
export type Experience = (typeof EXPERIENCE_OPTIONS)[number]['value'];

/** Mirrors the `household` table — one per owner, not per dog (multi-dog
 * households are backlog V2, see docs/datenmodell.md). */
export type Household = {
  postalCode: string | null;
  housingType: HousingType;
  surroundings: Surroundings;
  experience: Experience;
  weekdayTimeBudgetMinutes: number;
  weekendTimeBudgetMinutes: number;
  trainingDays: readonly Weekday[];
  planningDay: Weekday;
  householdSize: number;
  equipment: readonly string[];
};
