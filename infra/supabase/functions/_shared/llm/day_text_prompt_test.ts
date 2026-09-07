import { assertEquals } from './dev_deps.ts';
import { buildDayTextPrompt, reminderIsDue } from './day_text_prompt.ts';

const NO_REMINDERS: readonly { kind: 'vaccination' | 'weighIn'; dueDate: Date }[] = [];

Deno.test('reminderIsDue: a fixed appointment (lead time 0) is due only from its date on', () => {
  const reminder = { dueDate: new Date('2026-01-15'), leadTimeDays: 0, doneAt: null };
  assertEquals(reminderIsDue(reminder, new Date('2026-01-14')), false);
  assertEquals(reminderIsDue(reminder, new Date('2026-01-15')), true);
  assertEquals(reminderIsDue(reminder, new Date('2026-01-20')), true, 'stays due once overdue');
});

Deno.test('reminderIsDue: a loose task is due starting lead_time_days before due_date', () => {
  const reminder = { dueDate: new Date('2026-02-01'), leadTimeDays: 14, doneAt: null };
  assertEquals(reminderIsDue(reminder, new Date('2026-01-17')), false);
  assertEquals(reminderIsDue(reminder, new Date('2026-01-18')), true);
});

Deno.test('reminderIsDue: a done reminder is never due, however close the date', () => {
  const reminder = {
    dueDate: new Date('2026-01-01'),
    leadTimeDays: 30,
    doneAt: new Date('2026-01-05'),
  };
  assertEquals(reminderIsDue(reminder, new Date('2026-01-01')), false);
});

Deno.test('buildDayTextPrompt: empty day, no reminders', () => {
  const prompt = buildDayTextPrompt({
    dogName: 'Bello',
    dogLifeStage: 'adult',
    date: new Date('2026-01-15'),
    reason: { kind: 'empty', skillId: null, needDimension: null },
    activity: null,
    dueReminders: NO_REMINDERS,
  });
  assertEquals(prompt.includes('Bello'), true);
  assertEquals(prompt.includes('nichts geplant'), true);
});

Deno.test('buildDayTextPrompt: the life stage is named in plain German', () => {
  const prompt = buildDayTextPrompt({
    dogName: 'Bello',
    dogLifeStage: 'adolescent',
    date: new Date('2026-01-15'),
    reason: { kind: 'empty', skillId: null, needDimension: null },
    activity: null,
    dueReminders: NO_REMINDERS,
  });
  assertEquals(prompt.includes('Junghund'), true);
});

Deno.test('buildDayTextPrompt: an activity carries its sentence and a plain-language reason, no jargon', () => {
  const prompt = buildDayTextPrompt({
    dogName: 'Nala',
    dogLifeStage: 'adult',
    date: new Date('2026-01-15'),
    reason: { kind: 'dueRefresher', skillId: 'recall', needDimension: null },
    activity: { title: 'Rückruf üben', sentence: 'Rückruf an der Schleppleine, mit Ablenkung.' },
    dueReminders: NO_REMINDERS,
  });
  assertEquals(prompt.includes('Rückruf üben'), true);
  assertEquals(prompt.includes('Rückruf an der Schleppleine'), true);
  assertEquals(prompt.includes('fällig'), true);
  // No raw enum values or internal ids leak into the prompt — those are
  // planner vocabulary, not something to phrase prose around.
  assertEquals(prompt.includes('dueRefresher'), false);
  assertEquals(prompt.includes('recall'), false);
});

Deno.test('buildDayTextPrompt: a needGap reason names the need dimension in plain language', () => {
  const prompt = buildDayTextPrompt({
    dogName: 'Nala',
    dogLifeStage: 'adult',
    date: new Date('2026-01-15'),
    reason: { kind: 'needGap', skillId: null, needDimension: 'scent' },
    activity: { title: 'Schnüffelteppich', sentence: 'Leckerlis im Teppich suchen.' },
    dueReminders: NO_REMINDERS,
  });
  assertEquals(prompt.includes('Nasenarbeit'), true);
  assertEquals(prompt.includes('needGap'), false);
  assertEquals(prompt.includes('scent'), false);
});

Deno.test('buildDayTextPrompt: due reminders are listed in plain language with their date', () => {
  const prompt = buildDayTextPrompt({
    dogName: 'Nala',
    dogLifeStage: 'adult',
    date: new Date('2026-01-15'),
    reason: { kind: 'empty', skillId: null, needDimension: null },
    activity: null,
    dueReminders: [{ kind: 'vaccination', dueDate: new Date('2026-01-16') }],
  });
  assertEquals(prompt.includes('Impftermin'), true);
  assertEquals(prompt.includes('2026-01-16'), true);
  assertEquals(prompt.includes('vaccination'), false);
});
