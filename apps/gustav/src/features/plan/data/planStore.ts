import { create } from 'zustand';

import type { SlotResult, WeeklyPlan } from '../domain/weeklyPlan';
import { PeriodStillActiveError, planRepository } from './planRepository';

type Status = 'idle' | 'loading' | 'ready' | 'error';

type PlanState = {
  dogId: string | null;
  plan: WeeklyPlan | null;
  status: Status;
  error: string | null;

  /** Generates a plan if none is active yet for this dog, otherwise loads
   * the one already stored — the app never recomputes a plan on open
   * (CLAUDE.md, Regel 10). */
  loadOrGeneratePlan: (dogId: string) => Promise<void>;
  setSlotResult: (slotId: string, result: SlotResult | null) => Promise<void>;
};

export const usePlanStore = create<PlanState>((set, get) => ({
  dogId: null,
  plan: null,
  status: 'idle',
  error: null,

  loadOrGeneratePlan: async (dogId: string) => {
    set({ status: 'loading', error: null, dogId });
    try {
      let plan: WeeklyPlan;
      try {
        plan = await planRepository.generatePlan(dogId);
      } catch (err) {
        if (err instanceof PeriodStillActiveError) {
          plan = await planRepository.fetchStoredPlan(err.wochenplanId);
          set({ plan, status: 'ready' });
          return;
        }
        throw err;
      }
      const idsByDate = await planRepository.fetchSlotIdsByDate(plan.id);
      plan = { ...plan, slots: plan.slots.map((slot) => ({ ...slot, id: idsByDate[slot.date] ?? slot.id })) };
      set({ plan, status: 'ready' });
    } catch (err) {
      set({ status: 'error', error: err instanceof Error ? err.message : 'unknown error' });
    }
  },

  setSlotResult: async (slotId, result) => {
    const { plan } = get();
    if (!plan) return;
    const previous = plan.slots;
    set({
      plan: { ...plan, slots: plan.slots.map((s) => (s.id === slotId ? { ...s, result } : s)) },
    });
    try {
      await planRepository.setSlotResult(slotId, result);
    } catch (err) {
      set({ plan: { ...plan, slots: previous }, error: err instanceof Error ? err.message : 'unknown error' });
    }
  },
}));
