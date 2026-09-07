import type { LifeStage, NeedDimension, ReasonKind } from '../planner/models/enums.ts';

/**
 * The framing/tone instructions for the daily prose text — a first draft,
 * not a final wording (`docs/specs/tagestext.md`). Lives here as a named
 * constant, not inline in the caller, so it can be revised without
 * touching the orchestration code.
 */
export const SYSTEM_PROMPT = `Du schreibst den kurzen Rahmentext für einen einzelnen Tag in einem
Wochenplaner für Hundehalter — im Ton eines guten Freundes, der kurz
Bescheid gibt: warm, manchmal humorvoll, manchmal einfach nur nett, aber
nie aufdringlich (CLAUDE.md, Abschnitt Tonalität). Du beschreibst nur, was
feststeht und erfindest keine Fakten dazu — die Wärme liegt im Ton, nicht
im Dazuerfinden.

- Nenne den Hund immer beim echten Namen, nie "Gustav" (das ist nur das
  Maskottchen auf dem Icon, keine Figur, die spricht — die persönliche
  Stimme ist deine, keine erfundene Figur).
- Wenn heute eine Aktivität geplant ist: erzähl in ein bis zwei Sätzen,
  warum sie heute dran ist (der mitgelieferte Grund) — erfinde keinen
  eigenen Grund dazu, aber formuliere ihn mit eigener Note statt trocken
  abzuschreiben.
- Wenn heute nichts geplant ist: sag das einfach so, gern mit einem
  kleinen Augenzwinkern, aber ohne es zu rechtfertigen oder schönzureden.
- Wenn eine Erinnerung mitgegeben wurde (Termin oder Erledigung): erwähne
  sie sachlich an passender Stelle im Text, nicht als separate Mahnung.
- Humor ist willkommen, aber sparsam und nie auf Kosten von Hund oder
  Halter — kein Spott, keine Ironie, die wie eine Zurechtweisung klingt.
- Kein Streak-Bezug, keine Ermahnung, keine Schuldrhetorik, kein
  Leistungsdruck ("super gemacht!", Ausrufezeichen-Kaskaden, Emojis).
- Schreib wie eine kurze, persönliche Nachricht, nicht wie ein Formular:
  keine Planer-/Fachbegriffe wie "Priorität", "Bedarfslücke" oder "Slot"
  im Text, auch wenn sie so im Input stehen — das ist interne Sprache,
  keine, die ein Hundehalter benutzt.
- Fang nicht jedes Mal mit derselben Satzstruktur an (z. B. immer "Heute
  steht für [Name]…") — variiere Einstieg und Satzbau von Tag zu Tag.
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

const NEED_DIMENSION_DESCRIPTIONS: Record<NeedDimension, string> = {
  physical: 'körperliche Auslastung',
  mentalWork: 'Kopfarbeit',
  scent: 'Nasenarbeit',
  social: 'sozialer Kontakt',
  recovery: 'Erholung',
};

/**
 * Translates a machine-readable `Reason` (`_shared/planner/models/weekly_plan.ts`)
 * into a plain-language clause for the prompt — the LLM gets "das war in der
 * letzten Zeit zu kurz gekommen", not the enum value "needGap", so it has no
 * jargon to echo back verbatim (docs/specs/tagestext.md, "mehr Persönlichkeit"
 * ohne Charakterstimme: natürlichere Sprache statt Planer-Vokabular).
 */
function describeReason(
  reason: { readonly kind: ReasonKind; readonly needDimension: NeedDimension | null },
): string {
  switch (reason.kind) {
    case 'empty':
      return 'Für heute ist bewusst nichts geplant.';
    case 'newSkill':
      return 'Der Hund lernt dabei etwas Neues.';
    case 'dueRefresher':
      return 'Diese Übung ist mal wieder fällig, sie wurde länger nicht wiederholt.';
    case 'priority':
      return 'Der Halter hatte das im letzten Check-in als wichtig genannt.';
    case 'needGap':
      return reason.needDimension === null
        ? 'Das kam in der letzten Zeit zu kurz.'
        : `${NEED_DIMENSION_DESCRIPTIONS[reason.needDimension]} kam in der letzten Zeit zu kurz.`;
    case 'recoveryNeed':
      return 'Das hat für heute einfach am besten gepasst.';
  }
}

const REMINDER_KIND_DESCRIPTIONS: Record<ReminderKind, string> = {
  vaccination: 'ein Impftermin',
  weighIn: 'mal wieder wiegen',
};

const LIFE_STAGE_DESCRIPTIONS: Record<LifeStage, string> = {
  puppy: 'Welpe',
  adolescent: 'Junghund',
  puberty: 'in der Pubertät',
  adult: 'erwachsen',
  senior: 'Senior',
};

/**
 * Builds the user-turn prompt for the daily text — plain facts, no prose.
 * Pure function, no network/IO/clock access (mirrors the planner's rule
 * 1/2 discipline even though this lives outside `_shared/planner/`): the
 * caller resolves "today" and which reminders are due before calling in.
 */
export function buildDayTextPrompt(args: {
  readonly dogName: string;
  readonly dogLifeStage: LifeStage;
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
  lines.push(`Hund: ${args.dogName} (${LIFE_STAGE_DESCRIPTIONS[args.dogLifeStage]})`);
  lines.push(`Datum: ${toDateString(args.date)}`);

  if (args.activity === null) {
    lines.push('Heute ist bewusst nichts geplant.');
  } else {
    lines.push(`Geplante Aktivität: ${args.activity.title}`);
    lines.push(`Kernsatz der Aktivität: ${args.activity.sentence}`);
    lines.push(`Warum das heute dran ist: ${describeReason(args.reason)}`);
  }

  if (args.dueReminders.length > 0) {
    lines.push('Außerdem noch offen:');
    for (const reminder of args.dueReminders) {
      lines.push(
        `- ${REMINDER_KIND_DESCRIPTIONS[reminder.kind]}, fällig am ${
          toDateString(reminder.dueDate)
        }`,
      );
    }
  }

  return lines.join('\n');
}
