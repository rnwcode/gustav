import { supabase } from '../../../lib/supabase';
import type { PlanSlot, SlotResult, WeeklyPlan } from '../domain/weeklyPlan';
import { weeklyPlanFromGeneratePlanResponse } from '../domain/weeklyPlan';

/** A plan already exists for the current period (`wochenplanId`) — the
 * caller decides whether that's fine (nothing to do) or worth surfacing. */
export class PeriodStillActiveError extends Error {
  constructor(public readonly wochenplanId: string) {
    super('period still active');
  }
}

/** Talks to the `generate-plan` Edge Function — the only place a new
 * WeeklyPlan is produced (CLAUDE.md, Regel 9/10: never computed
 * client-side, never recomputed on open). */
export const planRepository = {
  async generatePlan(dogId: string): Promise<WeeklyPlan> {
    const { data, error } = await supabase.functions.invoke('generate-plan', {
      body: { hundId: dogId },
    });
    if (error) {
      const context = (error as { context?: { status?: number; json?: () => Promise<unknown> } }).context;
      if (context?.status === 409) {
        const body = (await context.json?.().catch(() => null)) as { wochenplanId?: string } | null;
        if (body?.wochenplanId) throw new PeriodStillActiveError(body.wochenplanId);
      }
      throw error;
    }
    return weeklyPlanFromGeneratePlanResponse(data);
  },

  /** Reads a plan already stored for the current period straight from the
   * DB — used after `PeriodStillActiveError`. `title`/`sentence` are not
   * persisted (they come from the content catalog at generation time), so
   * this reads dates and reasons only. */
  async fetchStoredPlan(wochenplanId: string): Promise<WeeklyPlan> {
    const { data: planRow, error: planError } = await supabase
      .from('wochenplan')
      .select('id, periode_start, periode_ende')
      .eq('id', wochenplanId)
      .single();
    if (planError) throw planError;

    const { data: slotRows, error: slotError } = await supabase
      .from('slot')
      .select('id, datum, aktivitaet_id, begruendung_art, begruendung_skill_id, begruendung_bedarfsdimension, ergebnis')
      .eq('wochenplan_id', wochenplanId)
      .order('datum');
    if (slotError) throw slotError;

    const slots: PlanSlot[] = (slotRows ?? []).map((row) => ({
      id: row.id as string,
      date: row.datum as string,
      activityId: row.aktivitaet_id as string | null,
      title: null,
      sentence: null,
      reason: {
        kind: row.begruendung_art,
        skillId: row.begruendung_skill_id,
        needDimension: row.begruendung_bedarfsdimension,
      },
      result: row.ergebnis as SlotResult | null,
    }));

    return {
      id: planRow.id as string,
      periodStart: planRow.periode_start as string,
      periodEnd: planRow.periode_ende as string,
      slots,
    };
  },

  /** `generate-plan`'s response has no slot ids (it returns the content the
   * planner just decided, not the rows it wrote) — fetch them once so
   * rating/relief actions have something to update. Keyed by ISO date. */
  async fetchSlotIdsByDate(wochenplanId: string): Promise<Record<string, string>> {
    const { data, error } = await supabase
      .from('slot')
      .select('id, datum')
      .eq('wochenplan_id', wochenplanId);
    if (error) throw error;
    return Object.fromEntries((data ?? []).map((row) => [row.datum as string, row.id as string]));
  },

  /** Sets or clears a slot's outcome — "Heute ist zu viel" writes
   * `uebersprungen`, "Doch wieder anzeigen" clears it, and the exercise
   * screen's rating buttons write the real result. */
  async setSlotResult(slotId: string, result: SlotResult | null): Promise<void> {
    const { error } = await supabase.from('slot').update({ ergebnis: result }).eq('id', slotId);
    if (error) throw error;
  },
};
