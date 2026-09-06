import type { NeedDimension, ReasonKind } from '../planner/models/enums.ts';

/**
 * The framing/tone instructions for the daily prose text — a first draft,
 * not a final wording (`docs/specs/tagestext.md`). Lives here as a named
 * constant, not inline in the caller, so it can be revised without
 * touching the orchestration code.
 */
export const SYSTEM_PROMPT = `Du schreibst den kurzen Rahmentext für einen einzelnen Tag in einem
Wochenplaner für Hundehalter. Du beschreibst nur, was feststeht — nie
Ratschläge, Ermahnungen oder Motivationssprüche.

- Nenne den Hund immer beim echten Namen, nie "Gustav" (das ist nur das
  Maskottchen auf dem Icon, keine Figur, die spricht).
- Wenn heute eine Aktivität geplant ist: beschreibe in ein bis zwei Sätzen,
  warum sie heute dran ist (der mitgelieferte Grund) — erfinde keinen
  eigenen Grund dazu.
- Wenn heute nichts geplant ist: sag das einfach so, ohne es zu
  rechtfertigen oder schönzureden.
- Wenn eine Erinnerung mitgegeben wurde (Termin oder Erledigung): erwähne
  sie sachlich an passender Stelle im Text, nicht als separate Mahnung.
- Kein Lob, kein Tadel, kein Streak-Bezug, keine Ausrufezeichen, keine
  Emojis.
- Antworte ausschließlich mit dem fertigen deutschen Fließtext, ohne
  Anführungszeichen, Überschrift oder Erklärung drumherum.`;

export type ReminderKind = 'vaccination' | 'weighIn';

/**
 * Whether a `reminder` (`infra/supabase/migrations/0005_reminder.sql`) is
 * worth mentioning `asOf` a given date. A fixed appointment
 * (`leadTimeDays: 0`) is due only from `dueDate` on; a loose task
 * (`leadTimeDays > 0`) is due starting that many days before `dueDate`.
 * Either way, once due it stays due until `doneAt` is set — an overdue
 * reminder does not quietly disappear.
 */
export function reminderIsDue(
  reminder: { readonly dueDate: Date; readonly leadTimeDays: number; readonly doneAt: Date | null },
  asOf: Date,
): boolean {
  if (reminder.doneAt !== null) return false;
  const worthMentioningFrom = new Date(reminder.dueDate);
  worthMentioningFrom.setDate(worthMentioningFrom.getDate() - reminder.leadTimeDays);
  return asOf >= worthMentioningFrom;
}

function toDateString(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/**
 * Builds the user-turn prompt for the daily text — plain facts, no prose.
 * Pure function, no network/IO/clock access (mirrors the planner's rule
 * 1/2 discipline even though this lives outside `_shared/planner/`): the
 * caller resolves "today" and which reminders are due before calling in.
 */
export function buildDayTextPrompt(args: {
  readonly dogName: string;
  readonly date: Date;
  readonly reason: {
    readonly kind: ReasonKind;
    readonly skillId: string | null;
    readonly needDimension: NeedDimension | null;
  };
  readonly activity: { readonly title: string; readonly sentence: string } | null;
  readonly dueReminders: readonly { readonly kind: ReminderKind; readonly dueDate: Date }[];
}): string {
  const lines: string[] = [];
  lines.push(`Hund: ${args.dogName}`);
  lines.push(`Datum: ${toDateString(args.date)}`);

  if (args.activity === null) {
    lines.push('Heute ist kein Slot geplant (nichts geplant), Grund: ' + args.reason.kind + '.');
  } else {
    lines.push(`Geplante Aktivität: ${args.activity.title}`);
    lines.push(`Kernsatz der Aktivität: ${args.activity.sentence}`);
    lines.push(`Grund (maschinenlesbar): ${args.reason.kind}`);
    if (args.reason.skillId !== null) lines.push(`Betroffener Skill: ${args.reason.skillId}`);
    if (args.reason.needDimension !== null) {
      lines.push(`Betroffene Bedarfsdimension: ${args.reason.needDimension}`);
    }
  }

  if (args.dueReminders.length > 0) {
    lines.push('Fällige Erinnerungen:');
    for (const reminder of args.dueReminders) {
      lines.push(`- ${reminder.kind}, fällig am ${toDateString(reminder.dueDate)}`);
    }
  }

  return lines.join('\n');
}
