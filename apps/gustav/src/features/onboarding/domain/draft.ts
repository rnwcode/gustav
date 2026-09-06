import type { BodyType, BreedGroup, Dog, Gender, Origin, Restriction, SizeClass } from './dog';
import type { Experience, Household, HousingType, Surroundings } from './household';
import type { Weekday } from './weekday';

/** Mutable-in-the-store draft of the onboarding form, filled in step by
 * step — only turned into a Dog/Household once `isComplete`. */
export type OnboardingDraft = {
  dogName: string | null;
  birthDate: string | null; // ISO yyyy-mm-dd
  arrivalDate: string | null;
  origin: Origin | null;
  breedGroup: BreedGroup | null;
  sizeClass: SizeClass | null;
  bodyType: ReadonlySet<BodyType>;
  restrictions: ReadonlySet<Restriction>;
  gender: Gender | null;
  neutered: boolean | null;

  postalCode: string | null;
  housingType: HousingType | null;
  surroundings: Surroundings | null;
  experience: Experience | null;
  weekdayTimeBudgetMinutes: number | null;
  weekendTimeBudgetMinutes: number | null;
  trainingDays: ReadonlySet<Weekday>;
  planningDay: Weekday;
  householdSize: number;
  equipment: readonly string[];
};

export const initialDraft: OnboardingDraft = {
  dogName: null,
  birthDate: null,
  arrivalDate: null,
  origin: null,
  breedGroup: null,
  sizeClass: null,
  bodyType: new Set(),
  restrictions: new Set(),
  gender: null,
  neutered: null,
  postalCode: null,
  housingType: null,
  surroundings: null,
  experience: null,
  weekdayTimeBudgetMinutes: null,
  weekendTimeBudgetMinutes: null,
  trainingDays: new Set(),
  planningDay: 'sunday',
  householdSize: 1,
  equipment: [],
};

// Step grouping follows the design's six screens, not the domain's own
// natural groupings — s1/s2 both feed `Dog`, s3 feeds the rest of `Dog`.
export function isStep1Complete(d: OnboardingDraft): boolean {
  return Boolean(d.dogName?.trim() && d.birthDate);
}

export function isStep2Complete(d: OnboardingDraft): boolean {
  return Boolean(d.origin && d.breedGroup && d.arrivalDate);
}

export function isStep3Complete(d: OnboardingDraft): boolean {
  return Boolean(d.sizeClass);
}

export function isStep4Complete(d: OnboardingDraft): boolean {
  return Boolean(d.housingType && d.surroundings && d.experience);
}

export function isStep5Complete(d: OnboardingDraft): boolean {
  return d.weekdayTimeBudgetMinutes !== null && d.weekendTimeBudgetMinutes !== null;
}

export function isDraftComplete(d: OnboardingDraft): boolean {
  return (
    isStep1Complete(d) &&
    isStep2Complete(d) &&
    isStep3Complete(d) &&
    isStep4Complete(d) &&
    isStep5Complete(d)
  );
}

export function draftToDog(d: OnboardingDraft): Dog {
  if (!isStep1Complete(d) || !isStep2Complete(d) || !isStep3Complete(d)) {
    throw new Error('draft is not complete enough to become a Dog');
  }
  return {
    name: d.dogName!.trim(),
    birthDate: d.birthDate!,
    arrivalDate: d.arrivalDate!,
    origin: d.origin!,
    breedGroup: d.breedGroup!,
    sizeClass: d.sizeClass!,
    bodyType: [...d.bodyType],
    restrictions: [...d.restrictions],
    gender: d.gender,
    neutered: d.neutered,
  };
}

export function draftToHousehold(d: OnboardingDraft): Household {
  if (!isStep4Complete(d) || !isStep5Complete(d)) {
    throw new Error('draft is not complete enough to become a Household');
  }
  return {
    postalCode: d.postalCode,
    housingType: d.housingType!,
    surroundings: d.surroundings!,
    experience: d.experience!,
    weekdayTimeBudgetMinutes: d.weekdayTimeBudgetMinutes!,
    weekendTimeBudgetMinutes: d.weekendTimeBudgetMinutes!,
    trainingDays: [...d.trainingDays],
    planningDay: d.planningDay,
    householdSize: d.householdSize,
    equipment: d.equipment,
  };
}
