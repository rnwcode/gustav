// generate-day-text — the endpoint the app calls when a day is opened, to
// get its daily prose text. Wires an LLM client (`_shared/llm/client.ts`)
// to Postgres: loads the slot's structural reason (never recomputed here,
// CLAUDE.md rule 10 — this endpoint only adds prose around it), any due
// `reminder` rows, calls the LLM, caches the result on `slot.day_text`.
// See docs/specs/tagestext.md for the design.

import { createClient } from 'jsr:@supabase/supabase-js@2';
import { FakeClock, systemClock } from '../_shared/planner/clock.ts';
import type { Clock } from '../_shared/planner/clock.ts';
import {
  buildDayTextPrompt,
  reminderIsDue,
  SYSTEM_PROMPT,
} from '../_shared/llm/day_text_prompt.ts';
import { HttpLlmClient } from '../_shared/llm/client.ts';
import type { LlmClient } from '../_shared/llm/client.ts';
import { reasonFromSlotRow, reminderFromRow } from './rows.ts';
import type { ActivityTextRow, ReminderRow, SlotRow } from './rows.ts';

interface RequestBody {
  readonly slotId: string;
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

function resolveLlmClient(): LlmClient {
  const baseUrl = Deno.env.get('LLM_BASE_URL') ?? '';
  const model = Deno.env.get('LLM_MODEL') ?? '';
  const apiKey = Deno.env.get('LLM_API_KEY') ?? null;
  return new HttpLlmClient({ baseUrl, apiKey, model });
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
  if (typeof body.slotId !== 'string' || body.slotId.length === 0) {
    return jsonResponse({ error: 'slotId_required' }, 400);
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

  // RLS ("own slots", 0001_init.sql) already restricts this to the caller's
  // own dog — the query itself carries no additional owner filter.
  const { data: slotRow, error: slotError } = await supabase
    .from('slot')
    .select('*, weekly_plan:weekly_plan_id(dog_id, dog:dog_id(name))')
    .eq('id', body.slotId)
    .maybeSingle();
  if (slotError) {
    return jsonResponse({ error: 'slot_query_failed', detail: slotError.message }, 500);
  }
  if (slotRow === null) return jsonResponse({ error: 'slot_not_found' }, 404);
  const slot = slotRow as unknown as SlotRow;

  // Already generated: return the cached text, never re-call the LLM
  // (docs/specs/tagestext.md, "Trigger" — cost and non-determinism).
  if (slot.day_text !== null) {
    return jsonResponse({ dayText: slot.day_text, generatedAt: slot.day_text_generated_at }, 200);
  }

  let activity: ActivityTextRow | null = null;
  if (slot.activity_id !== null) {
    const CONTENT_LOCALE = 'de';
    const { data: activityRow, error: activityError } = await supabase
      .from('activity')
      .select('activity_text!inner(title, sentence)')
      .eq('id', slot.activity_id)
      .eq('activity_text.locale', CONTENT_LOCALE)
      .maybeSingle();
    if (activityError) {
      return jsonResponse({ error: 'activity_query_failed', detail: activityError.message }, 500);
    }
    if (activityRow === null) return jsonResponse({ error: 'activity_not_found' }, 500);
    // activity_text!inner(...) with .eq('activity_text.locale', CONTENT_LOCALE)
    // guarantees exactly one row.
    const text = (activityRow as unknown as { activity_text: ActivityTextRow[] }).activity_text[0]!;
    activity = { title: text.title, sentence: text.sentence };
  }

  const { data: reminderRows, error: reminderError } = await supabase
    .from('reminder')
    .select('kind, due_date, lead_time_days, done_at')
    .eq('dog_id', slot.weekly_plan.dog_id)
    .is('done_at', null);
  if (reminderError) {
    return jsonResponse({ error: 'reminder_query_failed', detail: reminderError.message }, 500);
  }

  const clock = resolveClock(body);
  const today = clock.today();
  const reminders = (reminderRows ?? []).map((row) => reminderFromRow(row as ReminderRow));
  const dueReminders = reminders
    .filter((reminder) => reminderIsDue(reminder, today))
    .map((reminder) => ({ kind: reminder.kind, dueDate: reminder.dueDate }));

  const userPrompt = buildDayTextPrompt({
    dogName: slot.weekly_plan.dog.name,
    date: new Date(slot.date),
    reason: reasonFromSlotRow(slot),
    activity,
    dueReminders,
  });

  const llmClient = resolveLlmClient();
  let dayText: string;
  try {
    dayText = await llmClient.generateText({ systemPrompt: SYSTEM_PROMPT, userPrompt });
  } catch (error) {
    return jsonResponse({ error: 'llm_request_failed', detail: String(error) }, 502);
  }

  const generatedAt = clock.now().toISOString();
  const { error: updateError } = await supabase
    .from('slot')
    .update({ day_text: dayText, day_text_generated_at: generatedAt })
    .eq('id', body.slotId);
  if (updateError) {
    return jsonResponse({ error: 'slot_update_failed', detail: updateError.message }, 500);
  }

  return jsonResponse({ dayText, generatedAt }, 200);
});
