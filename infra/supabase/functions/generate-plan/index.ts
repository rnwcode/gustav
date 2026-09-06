// generate-plan — the endpoint the app calls after a planning-day check-in
// (and once, right after onboarding, with an empty check-in) to get a new
// WeeklyPlan for one dog.
//
// ── Catalog: activity/skill (Postgres) ──────────────────────────────────────
//
// Skills/activities come from the `activity`/`skill` tables
// (infra/supabase/migrations/0002_content.sql) — not from
// `_shared/planner/fixtures/`, which continues to serve only the simulator
// and tests (docs/specs/content-aus-db-laden.md). Maintained directly in
// the DB (CLAUDE.md, rule 5); `infra/supabase/seed/{skill,activity}.sql`
// bootstraps a local/hosted DB from `content/import/*.csv` (see the READMEs
// there for the data's origin and limitations).
//
// ── Configuration: planner_config (Postgres) ────────────────────────────────
//
// content/planer.yaml now comes from the `planner_config` table
// (infra/supabase/migrations/0004_planer_konfig.sql) instead of filesystem
// access: a `supabase functions deploy` bundle contains no content/
// anymore, the previous file read failed after every real deploy with
// `NotFound: /var/content/planer.yaml` (only under `supabase functions
// serve`, which runs from the checkout, did it work). Always reads the
// highest `version` — the values themselves are never changed by an agent
// on its own (CLAUDE.md, rule 6).

import { createClient } from 'jsr:@supabase/supabase-js@2';
import { FakeClock, systemClock } from '../_shared/planner/clock.ts';
import type { Clock } from '../_shared/planner/clock.ts';
import { plan } from '../_shared/planner/plan.ts';
import {
  parsePlanerConfigYaml,
  parseStateMachineConfigYaml,
} from '../_shared/content/planer_yaml.ts';
import {
  activityFromRow,
  dogFromRow,
  householdFromRow,
  reasonJsonFromReason,
  skillFromRow,
  skillStateFromRow,
  skillStateRowFromState,
  slotRowFromSlot,
  toDateString,
} from './rows.ts';
import { resolveDailyLoads, resolveLastUsed, resolveNeedCoverage } from './history.ts';
import type { PastSlotRow } from './history.ts';
import { applyReview } from './review.ts';
import type { RatedSlotRow, ReviewEntry } from './review.ts';
import { translateCheckin } from './checkin_translator.ts';

interface RequestBody {
  readonly dogId: string;
  readonly review?: readonly ReviewEntry[];
  readonly reviewFreetext?: string | null;
  readonly intentChips?: readonly string[];
  readonly intentFreetext?: string | null;
  readonly daysAvailable?: readonly string[];
  readonly reviewChips?: readonly string[];
  /** Only for the debug menu's time travel (apps/README.md) — otherwise omitted. */
  readonly debugToday?: string;
}

function jsonResponse(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

function resolveClock(body: RequestBody): Clock {
  if (body.debugToday === undefined) return systemClock();
  return new FakeClock(new Date(body.debugToday));
}

Deno.serve(async (req: Request) => {
  if (req.method !== 'POST') {
    return jsonResponse({ error: 'method_not_allowed' }, 405);
  }

  let body: RequestBody;
  try {
    body = await req.json();
  } catch {
    return jsonResponse({ error: 'invalid_json' }, 400);
  }
  if (typeof body.dogId !== 'string' || body.dogId.length === 0) {
    return jsonResponse({ error: 'dogId_required' }, 400);
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } },
  });

  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || userData.user === null) {
    return jsonResponse({ error: 'unauthenticated' }, 401);
  }
  const userId = userData.user.id;

  // RLS already lets a user see only their own dog/household rows — the
  // .eq() filters here are defensive, not additional authorization.
  const { data: dogRow, error: dogError } = await supabase
    .from('dog')
    .select('*')
    .eq('id', body.dogId)
    .maybeSingle();
  if (dogError) {
    return jsonResponse({ error: 'dog_query_failed', detail: dogError.message }, 500);
  }
  if (dogRow === null) return jsonResponse({ error: 'dog_not_found' }, 404);

  const { data: dogBreedRows, error: dogBreedError } = await supabase
    .from('dog_breed')
    .select('weight, breed:breed_id(breed_group)')
    .eq('dog_id', body.dogId);
  if (dogBreedError) {
    return jsonResponse(
      { error: 'dog_breed_query_failed', detail: dogBreedError.message },
      500,
    );
  }

  const { data: householdRow, error: householdError } = await supabase
    .from('household')
    .select('*')
    .eq('owner', userId)
    .maybeSingle();
  if (householdError) {
    return jsonResponse({ error: 'household_query_failed', detail: householdError.message }, 500);
  }
  if (householdRow === null) return jsonResponse({ error: 'household_not_found' }, 404);

  const clock = resolveClock(body);
  const today = clock.today();

  const { data: previousPlanRow, error: previousPlanError } = await supabase
    .from('weekly_plan')
    .select('id, period_start, period_end')
    .eq('dog_id', body.dogId)
    .order('period_start', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (previousPlanError) {
    return jsonResponse(
      { error: 'weekly_plan_query_failed', detail: previousPlanError.message },
      500,
    );
  }
  if (previousPlanRow !== null && previousPlanRow.period_end >= toDateString(today)) {
    return jsonResponse(
      { error: 'period_still_active', weeklyPlanId: previousPlanRow.id },
      409,
    );
  }

  const { data: allPlanRows, error: allPlanRowsError } = await supabase
    .from('weekly_plan')
    .select('id')
    .eq('dog_id', body.dogId);
  if (allPlanRowsError) {
    return jsonResponse(
      { error: 'weekly_plan_query_failed', detail: allPlanRowsError.message },
      500,
    );
  }
  const allPlanIds = (allPlanRows ?? []).map((row) => row.id as string);

  let allSlotRows: (PastSlotRow & { id: string; weekly_plan_id: string })[] = [];
  if (allPlanIds.length > 0) {
    const { data, error } = await supabase
      .from('slot')
      .select('id, weekly_plan_id, date, activity_id, outcome')
      .in('weekly_plan_id', allPlanIds);
    if (error) return jsonResponse({ error: 'slot_query_failed', detail: error.message }, 500);
    allSlotRows = data ?? [];
  }

  const { data: skillStateRows, error: skillStateError } = await supabase
    .from('skill_state')
    .select('*')
    .eq('dog_id', body.dogId);
  if (skillStateError) {
    return jsonResponse(
      { error: 'skill_state_query_failed', detail: skillStateError.message },
      500,
    );
  }

  // Publicly readable content (RLS: "activity/skill is publicly readable")
  // — no relation to body.dogId needed. Text comes fixed from locale = 'de'
  // (0002_content.sql) — the client doesn't send a language today, this is
  // the one spot a later locale picker would plug into.
  const CONTENT_LOCALE = 'de';
  const { data: skillRows, error: skillCatalogError } = await supabase.from('skill')
    .select('*, skill_text!inner(*)')
    .eq('skill_text.locale', CONTENT_LOCALE);
  if (skillCatalogError) {
    return jsonResponse(
      { error: 'skill_catalog_query_failed', detail: skillCatalogError.message },
      500,
    );
  }
  const { data: activityRows, error: activityCatalogError } = await supabase.from('activity')
    .select('*, activity_text!inner(*)')
    .eq('activity_text.locale', CONTENT_LOCALE);
  if (activityCatalogError) {
    return jsonResponse(
      { error: 'activity_catalog_query_failed', detail: activityCatalogError.message },
      500,
    );
  }

  const breeds = (dogBreedRows ?? []).map((row) => ({
    breed_group: (row.breed as unknown as { breed_group: string }).breed_group,
    weight: row.weight as number | null,
  }));
  // dogFromRow → resolveBreedGroups (rows.ts) throws on an empty list — a
  // real, reachable state if the onboarding's dog_breed insert ever failed
  // partway through (onboardingRepository.createDog). Catching it here turns
  // an unhandled exception (opaque 500, no plan ever generated) into a
  // diagnosable error instead of a silent dead end.
  if (breeds.length === 0) {
    return jsonResponse({ error: 'dog_breed_missing' }, 500);
  }
  const dog = dogFromRow(dogRow, breeds);
  const household = householdFromRow(householdRow);
  const activityCatalog = (activityRows ?? []).map(activityFromRow);
  const skillCatalog = (skillRows ?? []).map(skillFromRow);
  const activityById = new Map(activityCatalog.map((a) => [a.id, a]));
  const skillById = new Map(skillCatalog.map((s) => [s.id, s]));

  const skillStates = new Map(
    (skillStateRows ?? []).map((
      row,
    ) => [row.skill_id as string, skillStateFromRow(row, body.dogId)]),
  );

  const previousPeriodSlots = previousPlanRow === null
    ? []
    : allSlotRows.filter((row) => row.weekly_plan_id === previousPlanRow.id);

  const reviewEntries = body.review ?? [];
  const slotsById = new Map<string, RatedSlotRow>(
    previousPeriodSlots.map((
      row,
    ) => [row.id, { id: row.id, date: row.date, activity_id: row.activity_id }]),
  );

  const { data: plannerConfigRow, error: plannerConfigError } = await supabase
    .from('planner_config')
    .select('config')
    .order('version', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (plannerConfigError) {
    return jsonResponse(
      { error: 'planner_config_query_failed', detail: plannerConfigError.message },
      500,
    );
  }
  if (plannerConfigRow === null) return jsonResponse({ error: 'planner_config_missing' }, 500);
  const plannerConfig = parsePlanerConfigYaml(plannerConfigRow.config);
  const stateMachineConfig = parseStateMachineConfigYaml(plannerConfigRow.config);

  const { updatedSkillStates, slotOutcomeUpdates } = applyReview({
    entries: reviewEntries,
    slotsById,
    activityById,
    skillById,
    skillStates,
    stateMachineConfig,
    dogId: body.dogId,
  });

  for (const update of slotOutcomeUpdates) {
    const { error } = await supabase
      .from('slot')
      .update({ outcome: update.outcome })
      .eq('id', update.slotId);
    if (error) return jsonResponse({ error: 'slot_update_failed', detail: error.message }, 500);
  }

  if (updatedSkillStates.size > 0) {
    const rows = [...updatedSkillStates.values()].map((state) =>
      skillStateRowFromState(body.dogId, state)
    );
    const { error } = await supabase.from('skill_state').upsert(rows, {
      onConflict: 'dog_id,skill_id',
    });
    if (error) {
      return jsonResponse({ error: 'skill_state_upsert_failed', detail: error.message }, 500);
    }
  }

  const weeklyContext = translateCheckin({
    intentChips: body.intentChips ?? [],
    daysAvailable: body.daysAvailable ?? [],
  });

  const loadOverLastSevenDays = resolveDailyLoads({ pastSlots: allSlotRows, activityById, today });
  const needCoverageLastPeriod = resolveNeedCoverage({ previousPeriodSlots, activityById });
  const { lastUsedByVarianceGroup, lastUsedByActivityId } = resolveLastUsed({
    allSlots: allSlotRows,
    activityById,
  });

  const result = plan({
    dog,
    household,
    weeklyContext,
    today,
    loadOverLastSevenDays,
    skillStates: updatedSkillStates,
    skillCatalog,
    activityCatalog,
    needCoverageLastPeriod,
    lastUsedByVarianceGroup,
    lastUsedByActivityId,
    config: plannerConfig,
  });

  const { data: checkinRow, error: checkinError } = await supabase
    .from('checkin')
    .insert({
      dog_id: body.dogId,
      period_start: toDateString(today),
      review: reviewEntries.map((e) => ({ slot_id: e.slotId, outcome: e.outcome })),
      review_freetext: body.reviewFreetext ?? null,
      intent_chips: body.intentChips ?? [],
      intent_freetext: body.intentFreetext ?? null,
      days_available: body.daysAvailable ?? [],
      review_chips: body.reviewChips ?? [],
      priorities: weeklyContext.priorities.map((p) => ({
        skillIdOrTopic: p.skillIdOrTopic,
        weight: p.weight,
      })),
      constraint_days: [...weeklyContext.constraints.days],
      flags: [...weeklyContext.flags],
      source: weeklyContext.source,
    })
    .select('id')
    .single();
  if (checkinError) {
    return jsonResponse({ error: 'checkin_insert_failed', detail: checkinError.message }, 500);
  }

  const { data: weeklyPlanRow, error: weeklyPlanInsertError } = await supabase
    .from('weekly_plan')
    .insert({
      dog_id: body.dogId,
      checkin_id: checkinRow.id,
      period_start: toDateString(result.periodStart),
      period_end: toDateString(result.periodEnd),
      algorithm_version: result.algorithmVersion,
      config_version: result.configVersion,
    })
    .select('id')
    .single();
  if (weeklyPlanInsertError) {
    return jsonResponse({
      error: 'weekly_plan_insert_failed',
      detail: weeklyPlanInsertError.message,
    }, 500);
  }

  const slotRows = result.slots.map((slot) => slotRowFromSlot(weeklyPlanRow.id, slot));
  const { error: slotInsertError } = await supabase.from('slot').insert(slotRows);
  if (slotInsertError) {
    return jsonResponse({ error: 'slot_insert_failed', detail: slotInsertError.message }, 500);
  }

  return jsonResponse({
    weeklyPlanId: weeklyPlanRow.id,
    periodStart: toDateString(result.periodStart),
    periodEnd: toDateString(result.periodEnd),
    algorithmVersion: result.algorithmVersion,
    configVersion: result.configVersion,
    slots: result.slots.map((slot) => ({
      date: toDateString(slot.date),
      activityId: slot.activityId,
      title: slot.activityId === null ? null : activityById.get(slot.activityId)?.title ?? null,
      sentence: slot.activityId === null ? null : activityById.get(slot.activityId)?.sentence ?? null,
      reason: reasonJsonFromReason(slot.reason),
    })),
  }, 201);
});
