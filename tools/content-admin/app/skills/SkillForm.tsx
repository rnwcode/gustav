import { createOrUpdateSkill } from './actions';
import { SKILL_CATEGORIES } from '../../lib/models';
import type { Skill } from '../../lib/models';

/** Shared create/edit form — `skill` present means edit (id becomes read-only). */
export function SkillForm({ skill }: { skill?: Skill }) {
  return (
    <form action={createOrUpdateSkill}>
      <label>
        ID (Slug)
        <input name="id" defaultValue={skill?.id} required readOnly={skill !== undefined} />
      </label>

      <label>
        Kategorie
        <select name="category" defaultValue={skill?.category ?? SKILL_CATEGORIES[0]}>
          {SKILL_CATEGORIES.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>
      </label>

      <label>
        Voraussetzungen (Skill-IDs, kommagetrennt)
        <input name="prerequisites" defaultValue={skill?.prerequisites.join(', ')} />
      </label>

      <label>
        Mindestalter (Wochen)
        <input
          type="number"
          name="min_age_weeks"
          defaultValue={skill?.min_age_weeks ?? 0}
          min={0}
          required
        />
      </label>

      <label className="inline">
        <input type="checkbox" name="is_core_skill" defaultChecked={skill?.is_core_skill} />
        Kern-Skill
      </label>

      <fieldset>
        <legend>Zielstufen (0–5)</legend>
        <div className="grid3">
          <label>
            Dauer
            <input
              type="number"
              name="target_duration"
              min={0}
              max={5}
              defaultValue={skill?.target_levels.duration ?? 0}
              required
            />
          </label>
          <label>
            Distanz
            <input
              type="number"
              name="target_distance"
              min={0}
              max={5}
              defaultValue={skill?.target_levels.distance ?? 0}
              required
            />
          </label>
          <label>
            Ablenkung
            <input
              type="number"
              name="target_distraction"
              min={0}
              max={5}
              defaultValue={skill?.target_levels.distraction ?? 0}
              required
            />
          </label>
        </div>
      </fieldset>

      <button type="submit">Speichern</button>
    </form>
  );
}
