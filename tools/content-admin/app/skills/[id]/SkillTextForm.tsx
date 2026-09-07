import { saveSkillText } from '../actions';
import type { SkillText } from '../../../lib/models';

export function SkillTextForm({
  skillId,
  text,
  defaultLocale,
}: {
  skillId: string;
  text?: SkillText;
  defaultLocale?: string;
}) {
  return (
    <form action={saveSkillText}>
      <input type="hidden" name="skill_id" value={skillId} />
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
        Name
        <input name="name" defaultValue={text?.name} required />
      </label>
      <label>
        Beschreibung
        <textarea name="description" defaultValue={text?.description} required />
      </label>
      <button type="submit">Speichern</button>
    </form>
  );
}
