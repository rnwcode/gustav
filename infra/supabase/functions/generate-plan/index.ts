// generate-plan — the endpoint the app calls after a planning-day check-in
// (and once, right after onboarding, with an empty check-in) to get a new
// WeeklyPlan for one dog.
//
// ── Katalog: aktivitaet/skill (Postgres) ────────────────────────────────────
//
// Skills/Aktivitäten kommen aus den Tabellen `aktivitaet`/`skill`
// (infra/supabase/migrations/0002_content.sql) — nicht mehr aus
// `_shared/planner/fixtures/`, die weiterhin nur Simulator und Tests
// bedienen (docs/specs/content-aus-db-laden.md). Direkt in der DB
// gepflegt (CLAUDE.md, Regel 5); `infra/supabase/seed/{skill,aktivitaet}.sql`
// bootstrapt eine lokale/gehostete DB aus `content/import/*.csv` (siehe
// dortige READMEs für Herkunft und Einschränkungen der Daten).
//
// ── Konfiguration: planer_konfig (Postgres) ─────────────────────────────────
//
// content/planer.yaml kommt jetzt aus der Tabelle `planer_konfig`
// (infra/supabase/migrations/0004_planer_konfig.sql) statt per Dateisystem-
// zugriff: ein `supabase functions deploy`-Bundle enthält kein content/
// mehr, der bisherige Datei-Read schlug nach jedem echten Deploy mit
// `NotFound: /var/content/planer.yaml` fehl (nur unter `supabase functions
// serve`, das aus dem Checkout heraus läuft, funktionierte er). Gelesen
// wird immer die höchste `version` — die Werte selbst ändert kein Agent
// eigenmächtig (CLAUDE.md, Regel 6).

import { createClient } from 'jsr:@supabase/supabase-js@2';
import { FakeClock, systemClock } from '../_shared/planner/clock.ts';
import type { Clock } from '../_shared/planner/clock.ts';
import { plan } from '../_shared/planner/plan.ts';
import {
  parsePlanerConfigYaml,
  parseStateMachineConfigYaml,
} from '../_shared/content/planer_yaml.ts';
import { germanForWeekday, germanForWeeklyContextSource } from '../_shared/content/german_enums.ts';
import {
  activityFromRow,
  dogFromRow,
  householdFromRow,
  skillFromRow,
  skillStandRowFromState,
  skillStateFromRow,
  slotRowFromSlot,
  toDateString,
} from './rows.ts';
import { resolveDailyLoads, resolveLastUsed, resolveNeedCoverage } from './history.ts';
import type { PastSlotRow } from './history.ts';
import { applyRueckblick } from './rueckblick.ts';
import type { RatedSlotRow, RueckblickEntry } from './rueckblick.ts';
import { translateCheckin } from './checkin_translator.ts';

interface RequestBody {
  readonly hundId: string;
  readonly rueckblick?: readonly RueckblickEntry[];
  readonly freitextRueckblick?: string | null;
  readonly absichtChips?: readonly string[];
  readonly freitextAbsicht?: string | null;
  readonly tageVerfuegbar?: readonly string[];
  readonly rueckblickChips?: readonly string[];
  /** Nur für die Zeitreise im Debug-Menü (apps/README.md) — sonst weggelassen. */
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
  if (typeof body.hundId !== 'string' || body.hundId.length === 0) {
    return jsonResponse({ error: 'hundId_required' }, 400);
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

  // RLS lässt hund/haushalt ohnehin nur die eigenen Zeilen sehen — die
  // .eq()-Filter hier sind defensiv, keine zusätzliche Autorisierung.
  const { data: hundRow, error: hundError } = await supabase
    .from('hund')
    .select('*')
    .eq('id', body.hundId)
    .maybeSingle();
  if (hundError) {
    return jsonResponse({ error: 'hund_query_failed', detail: hundError.message }, 500);
  }
  if (hundRow === null) return jsonResponse({ error: 'hund_not_found' }, 404);

  const { data: hundRasseRows, error: hundRasseError } = await supabase
    .from('hund_rasse')
    .select('gewichtung, rasse:rasse_id(rassegruppe)')
    .eq('hund_id', body.hundId);
  if (hundRasseError) {
    return jsonResponse(
      { error: 'hund_rasse_query_failed', detail: hundRasseError.message },
      500,
    );
  }

  const { data: haushaltRow, error: haushaltError } = await supabase
    .from('haushalt')
    .select('*')
    .eq('besitzer', userId)
    .maybeSingle();
  if (haushaltError) {
    return jsonResponse({ error: 'haushalt_query_failed', detail: haushaltError.message }, 500);
  }
  if (haushaltRow === null) return jsonResponse({ error: 'haushalt_not_found' }, 404);

  const clock = resolveClock(body);
  const today = clock.today();

  const { data: previousPlanRow, error: previousPlanError } = await supabase
    .from('wochenplan')
    .select('id, periode_start, periode_ende')
    .eq('hund_id', body.hundId)
    .order('periode_start', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (previousPlanError) {
    return jsonResponse(
      { error: 'wochenplan_query_failed', detail: previousPlanError.message },
      500,
    );
  }
  if (previousPlanRow !== null && previousPlanRow.periode_ende >= toDateString(today)) {
    return jsonResponse(
      { error: 'period_still_active', wochenplanId: previousPlanRow.id },
      409,
    );
  }

  const { data: allPlanRows, error: allPlanRowsError } = await supabase
    .from('wochenplan')
    .select('id')
    .eq('hund_id', body.hundId);
  if (allPlanRowsError) {
    return jsonResponse(
      { error: 'wochenplan_query_failed', detail: allPlanRowsError.message },
      500,
    );
  }
  const allPlanIds = (allPlanRows ?? []).map((row) => row.id as string);

  let allSlotRows: (PastSlotRow & { id: string; wochenplan_id: string })[] = [];
  if (allPlanIds.length > 0) {
    const { data, error } = await supabase
      .from('slot')
      .select('id, wochenplan_id, datum, aktivitaet_id, ergebnis')
      .in('wochenplan_id', allPlanIds);
    if (error) return jsonResponse({ error: 'slot_query_failed', detail: error.message }, 500);
    allSlotRows = data ?? [];
  }

  const { data: skillStandRows, error: skillStandError } = await supabase
    .from('skill_stand')
    .select('*')
    .eq('hund_id', body.hundId);
  if (skillStandError) {
    return jsonResponse(
      { error: 'skill_stand_query_failed', detail: skillStandError.message },
      500,
    );
  }

  // Öffentlich lesbarer Content (RLS: "aktivitaet/skill ist oeffentlich
  // lesbar") — kein Bezug zu body.hundId nötig.
  const { data: skillRows, error: skillCatalogError } = await supabase.from('skill').select('*');
  if (skillCatalogError) {
    return jsonResponse(
      { error: 'skill_catalog_query_failed', detail: skillCatalogError.message },
      500,
    );
  }
  const { data: activityRows, error: activityCatalogError } = await supabase.from('aktivitaet')
    .select('*');
  if (activityCatalogError) {
    return jsonResponse(
      { error: 'activity_catalog_query_failed', detail: activityCatalogError.message },
      500,
    );
  }

  const breeds = (hundRasseRows ?? []).map((row) => ({
    rassegruppe: (row.rasse as unknown as { rassegruppe: string }).rassegruppe,
    gewichtung: row.gewichtung as number | null,
  }));
  const dog = dogFromRow(hundRow, breeds);
  const household = householdFromRow(haushaltRow);
  const activityCatalog = (activityRows ?? []).map(activityFromRow);
  const skillCatalog = (skillRows ?? []).map(skillFromRow);
  const activityById = new Map(activityCatalog.map((a) => [a.id, a]));
  const skillById = new Map(skillCatalog.map((s) => [s.id, s]));

  const skillStates = new Map(
    (skillStandRows ?? []).map((
      row,
    ) => [row.skill_id as string, skillStateFromRow(row, body.hundId)]),
  );

  const previousPeriodSlots = previousPlanRow === null
    ? []
    : allSlotRows.filter((row) => row.wochenplan_id === previousPlanRow.id);

  const rueckblickEntries = body.rueckblick ?? [];
  const slotsById = new Map<string, RatedSlotRow>(
    previousPeriodSlots.map((
      row,
    ) => [row.id, { id: row.id, datum: row.datum, aktivitaet_id: row.aktivitaet_id }]),
  );

  const { data: planerKonfigRow, error: planerKonfigError } = await supabase
    .from('planer_konfig')
    .select('konfig')
    .order('version', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (planerKonfigError) {
    return jsonResponse(
      { error: 'planer_konfig_query_failed', detail: planerKonfigError.message },
      500,
    );
  }
  if (planerKonfigRow === null) return jsonResponse({ error: 'planer_konfig_missing' }, 500);
  const plannerConfig = parsePlanerConfigYaml(planerKonfigRow.konfig);
  const stateMachineConfig = parseStateMachineConfigYaml(planerKonfigRow.konfig);

  const { updatedSkillStates, slotErgebnisUpdates } = applyRueckblick({
    entries: rueckblickEntries,
    slotsById,
    activityById,
    skillById,
    skillStates,
    stateMachineConfig,
    dogId: body.hundId,
  });

  for (const update of slotErgebnisUpdates) {
    const { error } = await supabase
      .from('slot')
      .update({ ergebnis: update.ergebnis })
      .eq('id', update.slotId);
    if (error) return jsonResponse({ error: 'slot_update_failed', detail: error.message }, 500);
  }

  if (updatedSkillStates.size > 0) {
    const rows = [...updatedSkillStates.values()].map((state) =>
      skillStandRowFromState(body.hundId, state)
    );
    const { error } = await supabase.from('skill_stand').upsert(rows, {
      onConflict: 'hund_id,skill_id',
    });
    if (error) {
      return jsonResponse({ error: 'skill_stand_upsert_failed', detail: error.message }, 500);
    }
  }

  const weeklyContext = translateCheckin({
    absichtChips: body.absichtChips ?? [],
    tageVerfuegbar: body.tageVerfuegbar ?? [],
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
      hund_id: body.hundId,
      periode_start: toDateString(today),
      rueckblick: rueckblickEntries.map((e) => ({ slot_id: e.slotId, ergebnis: e.ergebnis })),
      freitext_rueckblick: body.freitextRueckblick ?? null,
      absicht_chips: body.absichtChips ?? [],
      freitext_absicht: body.freitextAbsicht ?? null,
      tage_verfuegbar: body.tageVerfuegbar ?? [],
      rueckblick_chips: body.rueckblickChips ?? [],
      prioritaeten: weeklyContext.priorities.map((p) => ({
        skill_id_oder_thema: p.skillIdOrTopic,
        gewicht: p.weight,
      })),
      constraints_tage: [...weeklyContext.constraints.days].map(germanForWeekday),
      flags: [...weeklyContext.flags],
      quelle: germanForWeeklyContextSource(weeklyContext.source),
    })
    .select('id')
    .single();
  if (checkinError) {
    return jsonResponse({ error: 'checkin_insert_failed', detail: checkinError.message }, 500);
  }

  const { data: wochenplanRow, error: wochenplanInsertError } = await supabase
    .from('wochenplan')
    .insert({
      hund_id: body.hundId,
      checkin_id: checkinRow.id,
      periode_start: toDateString(result.periodStart),
      periode_ende: toDateString(result.periodEnd),
      algorithmus_version: result.algorithmVersion,
      konfig_version: result.configVersion,
    })
    .select('id')
    .single();
  if (wochenplanInsertError) {
    return jsonResponse({
      error: 'wochenplan_insert_failed',
      detail: wochenplanInsertError.message,
    }, 500);
  }

  const slotRows = result.slots.map((slot) => slotRowFromSlot(wochenplanRow.id, slot));
  const { error: slotInsertError } = await supabase.from('slot').insert(slotRows);
  if (slotInsertError) {
    return jsonResponse({ error: 'slot_insert_failed', detail: slotInsertError.message }, 500);
  }

  return jsonResponse({
    wochenplanId: wochenplanRow.id,
    periodeStart: toDateString(result.periodStart),
    periodeEnde: toDateString(result.periodEnd),
    algorithmusVersion: result.algorithmVersion,
    konfigVersion: result.configVersion,
    slots: result.slots.map((slot) => ({
      datum: toDateString(slot.date),
      aktivitaetId: slot.activityId,
      titel: slot.activityId === null ? null : activityById.get(slot.activityId)?.title ?? null,
      satz: slot.activityId === null ? null : activityById.get(slot.activityId)?.sentence ?? null,
      begruendung: slot.reason,
    })),
  }, 201);
});
