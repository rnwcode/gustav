import { supabase } from '../../../lib/supabase';
import type { PlanSlot, SlotResult, WeeklyPlan } from '../domain/weeklyPlan';
import { weeklyPlanFromGeneratePlanResponse } from '../domain/weeklyPlan';

/** A plan already exists for the current period (`weeklyPlanId`) — the
 * caller decides whether that's fine (nothing to do) or worth surfacing. */
export class PeriodStillActiveError extends Error {
  constructor(public readonly weeklyPlanId: string) {
    super('period still active');
  }
}

/** Talks to the `generate-plan` Edge Function — the only place a new
 * WeeklyPlan is produced (CLAUDE.md, Regel 9/10: never computed
 * client-side, never recomputed on open). */
export const planRepository = {
  async generatePlan(dogId: string): Promise<WeeklyPlan> {
    const { data, error } = await supabase.functions.invoke('generate-plan', {
      body: { dogId },
    });
    if (error) {
      const context = (error as { context?: { status?: number; json?: () => Promise<unknown> } }).context;
      if (context?.status === 409) {
        const body = (await context.json?.().catch(() => null)) as { weeklyPlanId?: string } | null;
        if (body?.weeklyPlanId) throw new PeriodStillActiveError(body.weeklyPlanId);
      }
      throw error;
    }
    return weeklyPlanFromGeneratePlanResponse(data);
  },

  /** Reads a plan already stored for the current period straight from the
   * DB — used after `PeriodStillActiveError`. `title`/`sentence` are not
   * persisted (they come from the content catalog at generation time), so
   * this reads dates and reasons only. */
  async fetchStoredPlan(weeklyPlanId: string): Promise<WeeklyPlan> {
    const { data: planRow, error: planError } = await supabase
      .from('weekly_plan')
      .select('id, period_start, period_end')
      .eq('id', weeklyPlanId)
      .single();
    if (planError) throw planError;

    const { data: slotRows, error: slotError } = await supabase
      .from('slot')
      .select('id, date, activity_id, reason_kind, reason_skill_id, reason_need_dimension, outcome')
      .eq('weekly_plan_id', weeklyPlanId)
      .order('date');
    if (slotError) throw slotError;

    const slots: PlanSlot[] = (slotRows ?? []).map((row) => ({
      id: row.id as string,
      date: row.date as string,
      activityId: row.activity_id as string | null,
      title: null,
      sentence: null,
      reason: {
        kind: row.reason_kind,
        skillId: row.reason_skill_id,
        needDimension: row.reason_need_dimension,
      },
      result: row.outcome as SlotResult | null,
    }));

    return {
      id: planRow.id as string,
      periodStart: planRow.period_start as string,
      periodEnd: planRow.period_end as string,
      slots,
    };
  },

  /** `generate-plan`'s response has no slot ids (it returns the content the
   * planner just decided, not the rows it wrote) — fetch them once so
   * rating/relief actions have something to update. Keyed by ISO date. */
  async fetchSlotIdsByDate(weeklyPlanId: string): Promise<Record<string, string>> {
    const { data, error } = await supabase
      .from('slot')
      .select('id, date')
      .eq('weekly_plan_id', weeklyPlanId);
    if (error) throw error;
    return Object.fromEntries((data ?? []).map((row) => [row.date as string, row.id as string]));
  },

  /** Sets or clears a slot's outcome — "Heute ist zu viel" writes
   * `skipped`, "Doch wieder anzeigen" clears it, and the exercise screen's
   * rating buttons write the real result. */
  async setSlotResult(slotId: string, result: SlotResult | null): Promise<void> {
    const { error } = await supabase.from('slot').update({ outcome: result }).eq('id', slotId);
    if (error) throw error;
  },
};
