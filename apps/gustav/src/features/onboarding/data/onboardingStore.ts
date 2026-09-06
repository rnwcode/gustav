import { create } from 'zustand';

import type { BodyType, BreedGroup, Gender, Origin, Restriction, SizeClass } from '../domain/dog';
import {
  draftToDog,
  draftToHousehold,
  initialDraft,
  isDraftComplete,
  isStep1Complete,
  isStep2Complete,
  isStep3Complete,
  isStep4Complete,
  isStep5Complete,
  type OnboardingDraft,
} from '../domain/draft';
import type { Experience, HousingType, Surroundings } from '../domain/household';
import type { Weekday } from '../domain/weekday';
import { onboardingRepository } from './onboardingRepository';

export const ONBOARDING_STEP_COUNT = 6;

const STEP_COMPLETE_CHECKS = [
  isStep1Complete,
  isStep2Complete,
  isStep3Complete,
  isStep4Complete,
  isStep5Complete,
  isDraftComplete,
];

export function isStepComplete(step: number, draft: OnboardingDraft): boolean {
  return STEP_COMPLETE_CHECKS[step](draft);
}

type SubmitState = { status: 'idle' | 'submitting' | 'error'; error: string | null };

type OnboardingState = {
  step: number;
  draft: OnboardingDraft;
  submit: SubmitState;

  next: () => void;
  back: () => void;
  setDogBasics: (
    patch: {
      dogName?: string;
      birthDate?: string;
      arrivalDate?: string;
      origin?: Origin;
      gender?: Gender;
      neutered?: boolean;
    },
  ) => void;
  setBreed: (patch: { breedGroup?: BreedGroup; sizeClass?: SizeClass }) => void;
  toggleBodyType: (value: BodyType) => void;
  toggleRestriction: (value: Restriction) => void;
  setHousehold: (patch: { postalCode?: string; housingType?: HousingType; surroundings?: Surroundings; experience?: Experience }) => void;
  setBudget: (patch: { weekdayTimeBudgetMinutes?: number; weekendTimeBudgetMinutes?: number }) => void;
  toggleTrainingDay: (day: Weekday) => void;
  setPlanningDay: (day: Weekday) => void;
  /** Creates the dog + household rows; the caller generates the first plan. */
  submitDraft: () => Promise<string>;
  reset: () => void;
};

export const useOnboardingStore = create<OnboardingState>((set, get) => ({
  step: 0,
  draft: initialDraft,
  submit: { status: 'idle', error: null },

  next: () => set((s) => ({ step: Math.min(s.step + 1, ONBOARDING_STEP_COUNT - 1) })),
  back: () => set((s) => ({ step: Math.max(s.step - 1, 0) })),

  setDogBasics: (patch) => set((s) => ({ draft: { ...s.draft, ...patch } })),
  setBreed: (patch) => set((s) => ({ draft: { ...s.draft, ...patch } })),
  toggleBodyType: (value) =>
    set((s) => {
      const next = new Set(s.draft.bodyType);
      if (next.has(value)) next.delete(value);
      else next.add(value);
      return { draft: { ...s.draft, bodyType: next } };
    }),
  toggleRestriction: (value) =>
    set((s) => {
      const next = new Set(s.draft.restrictions);
      if (next.has(value)) next.delete(value);
      else next.add(value);
      return { draft: { ...s.draft, restrictions: next } };
    }),
  setHousehold: (patch) => set((s) => ({ draft: { ...s.draft, ...patch } })),
  setBudget: (patch) => set((s) => ({ draft: { ...s.draft, ...patch } })),
  toggleTrainingDay: (day) =>
    set((s) => {
      const next = new Set(s.draft.trainingDays);
      if (next.has(day)) next.delete(day);
      else next.add(day);
      return { draft: { ...s.draft, trainingDays: next } };
    }),
  setPlanningDay: (day) => set((s) => ({ draft: { ...s.draft, planningDay: day } })),

  submitDraft: async () => {
    const { draft } = get();
    if (!isDraftComplete(draft)) {
      throw new Error('onboarding draft is incomplete');
    }
    set({ submit: { status: 'submitting', error: null } });
    try {
      const dogId = await onboardingRepository.createDog(draftToDog(draft));
      await onboardingRepository.createHousehold(draftToHousehold(draft));
      set({ submit: { status: 'idle', error: null } });
      return dogId;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'unknown error';
      set({ submit: { status: 'error', error: message } });
      throw err;
    }
  },

  reset: () => set({ step: 0, draft: initialDraft, submit: { status: 'idle', error: null } }),
}));
