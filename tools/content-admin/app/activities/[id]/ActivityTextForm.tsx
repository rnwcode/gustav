import { saveActivityText } from '../actions';
import { troubleshootingToLines } from '../../../lib/formParsing';
import type { ActivityText } from '../../../lib/models';

export function ActivityTextForm({
  activityId,
  text,
  defaultLocale,
}: {
  activityId: string;
  text?: ActivityText;
  defaultLocale?: string;
}) {
  return (
    <form action={saveActivityText}>
      <input type="hidden" name="activity_id" value={activityId} />
      <label>
        Sprache (locale)
        <input
          name="locale"
          defaultValue={text?.locale ?? defaultLocale}
          required
          readOnly={text !== undefined}
        />
      </label>
      <label>
        Titel
        <input name="title" defaultValue={text?.title} required />
      </label>
      <label>
        Kernsatz
        <textarea name="sentence" defaultValue={text?.sentence} required />
      </label>
      <label>
        Anleitung (eine Zeile pro Schritt)
        <textarea name="instructions" defaultValue={text?.instructions.join('\n')} />
      </label>
      <label>
        Erfolgskriterium
        <textarea name="success_criterion" defaultValue={text?.success_criterion} required />
      </label>
      <label>
        Häufige Fehler (eine Zeile pro Fehler)
        <textarea name="common_mistakes" defaultValue={text?.common_mistakes.join('\n')} />
      </label>
      <label>
        Troubleshooting (eine Zeile pro Eintrag: <code>Problem =&gt; Antwort</code>)
        <textarea
          name="troubleshooting"
          defaultValue={text ? troubleshootingToLines(text.troubleshooting) : undefined}
        />
      </label>
      <button type="submit">Speichern</button>
    </form>
  );
}
