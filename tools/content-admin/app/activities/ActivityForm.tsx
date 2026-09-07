import { createOrUpdateActivity } from './actions';
import { listSkills } from '../../lib/skillsRepo';
import { ACTIVITY_TYPES, BREED_GROUPS, LOCATIONS } from '../../lib/models';
import type { Activity } from '../../lib/models';

const NEEDS_KEYS = ['physical', 'mentalWork', 'scent', 'social', 'recovery'] as const;

/** Shared create/edit form — `activity` present means edit (id read-only). */
export async function ActivityForm({ activity }: { activity?: Activity }) {
  const skills = await listSkills();

  return (
    <form action={createOrUpdateActivity}>
      <label>
        ID (Slug)
        <input name="id" defaultValue={activity?.id} required readOnly={activity !== undefined} />
      </label>

      <div className="row">
        <label>
          Typ
          <select name="type" defaultValue={activity?.type ?? ACTIVITY_TYPES[0]}>
            {ACTIVITY_TYPES.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </label>
        <label>
          Trainiert Skill
          <select name="trains_skill" defaultValue={activity?.trains_skill ?? ''}>
            <option value="">— keiner (enrichment) —</option>
            {skills.map((skill) => (
              <option key={skill.id} value={skill.id}>
                {skill.id}
              </option>
            ))}
          </select>
        </label>
      </div>

      <fieldset>
        <legend>Bedarfsdeckung (0–3)</legend>
        <div className="grid5">
          {NEEDS_KEYS.map((key) => (
            <label key={key}>
              {key}
              <input
                type="number"
                name={`needs_${key}`}
                min={0}
                max={3}
                defaultValue={activity?.needs[key] ?? 0}
                required
              />
            </label>
          ))}
        </div>
      </fieldset>

      <div className="row">
        <label>
          Erregung (0–3)
          <input type="number" name="arousal" min={0} max={3} defaultValue={activity?.arousal ?? 0} required />
        </label>
        <label>
          Ort
          <select name="location" defaultValue={activity?.location ?? LOCATIONS[0]}>
            {LOCATIONS.map((location) => (
              <option key={location} value={location}>
                {location}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="row">
        <label>
          Dauer min (Minuten)
          <input type="number" name="duration_min" min={0} defaultValue={activity?.duration_min ?? 5} required />
        </label>
        <label>
          Dauer max (Minuten)
          <input type="number" name="duration_max" min={0} defaultValue={activity?.duration_max ?? 10} required />
        </label>
      </div>

      <fieldset>
        <legend>Ablenkungsstufen (nur bei Typ training)</legend>
        <div className="row">
          <label>
            Min
            <input type="number" name="for_distraction_min" defaultValue={activity?.for_distraction?.[0]} />
          </label>
          <label>
            Max
            <input type="number" name="for_distraction_max" defaultValue={activity?.for_distraction?.[1]} />
          </label>
        </div>
        <p className="hint">Beide leer lassen, wenn nicht zutreffend.</p>
      </fieldset>

      <div className="row">
        <label className="inline">
          <input type="checkbox" name="is_refresher" defaultChecked={activity?.is_refresher} />
          Auffrischung
        </label>
        <label className="inline">
          <input type="checkbox" name="second_person" defaultChecked={activity?.second_person} />
          Zweite Person nötig
        </label>
        <label className="inline">
          <input type="checkbox" name="joint_straining" defaultChecked={activity?.joint_straining} />
          Gelenkbelastend
        </label>
      </div>

      <div className="row">
        <label className="inline">
          <input type="checkbox" name="heat_suitable" defaultChecked={activity?.heat_suitable ?? true} />
          Hitzetauglich
        </label>
        <label className="inline">
          <input type="checkbox" name="rain_suitable" defaultChecked={activity?.rain_suitable ?? true} />
          Regentauglich
        </label>
        <label className="inline">
          <input
            type="checkbox"
            name="darkness_suitable"
            defaultChecked={activity?.darkness_suitable ?? true}
          />
          Dunkelheitstauglich
        </label>
      </div>

      <label>
        Saisonfenster (Monate 1–12, kommagetrennt)
        <input name="seasonal_window" defaultValue={activity?.seasonal_window?.join(', ')} />
      </label>

      <label>
        Ausrüstung (kommagetrennt)
        <input name="equipment" defaultValue={activity?.equipment.join(', ')} />
      </label>

      <div className="row">
        <label>
          Mindestalter (Wochen)
          <input type="number" name="min_age_weeks" min={0} defaultValue={activity?.min_age_weeks ?? 0} required />
        </label>
        <label>
          Höchstalter (Wochen, optional)
          <input type="number" name="max_age_weeks" defaultValue={activity?.max_age_weeks ?? undefined} />
        </label>
      </div>

      <fieldset>
        <legend>Eignung je Rassegruppe (-1…+2, leer = neutral)</legend>
        <div className="grid3">
          {BREED_GROUPS.map((group) => (
            <label key={group}>
              {group}
              <input
                type="number"
                name={`suitability_${group}`}
                min={-1}
                max={2}
                defaultValue={activity?.suitability[group] ?? ''}
              />
            </label>
          ))}
        </div>
      </fieldset>

      <div className="row">
        <label>
          Varianzgruppe
          <input name="variance_group" defaultValue={activity?.variance_group} required />
        </label>
        <label>
          Sperrfrist (Tage)
          <input type="number" name="cooldown_days" min={0} defaultValue={activity?.cooldown_days ?? 0} required />
        </label>
      </div>

      <label>
        Illustration (optional)
        <input name="illustration" defaultValue={activity?.illustration ?? undefined} />
      </label>

      <button type="submit">Speichern</button>
    </form>
  );
}
