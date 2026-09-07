import { notFound } from 'next/navigation';
import { getActivity, listActivityTexts } from '../../../lib/activitiesRepo';
import { ActivityForm } from '../ActivityForm';
import { ActivityTextForm } from './ActivityTextForm';
import { deleteActivityAction, deleteActivityTextAction } from '../actions';

export const dynamic = 'force-dynamic';

export default async function EditActivityPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const activity = await getActivity(id);
  if (activity === null) notFound();

  const texts = await listActivityTexts(id);
  const existingLocales = new Set(texts.map((text) => text.locale));

  return (
    <div>
      <h1>Aktivität: {activity.id}</h1>
      <ActivityForm activity={activity} />

      <form action={deleteActivityAction}>
        <input type="hidden" name="id" value={activity.id} />
        <button type="submit" className="danger">
          Aktivität löschen
        </button>
      </form>

      <h2>Texte je Sprache</h2>
      {texts.map((text) => (
        <div className="locale-block" key={text.locale}>
          <h3>{text.locale}</h3>
          <ActivityTextForm activityId={activity.id} text={text} />
          <form action={deleteActivityTextAction}>
            <input type="hidden" name="activity_id" value={activity.id} />
            <input type="hidden" name="locale" value={text.locale} />
            <button type="submit" className="danger">
              Diese Sprache löschen
            </button>
          </form>
        </div>
      ))}

      {!existingLocales.has('de') && (
        <div className="locale-block">
          <h3>Neue Sprache: de</h3>
          <ActivityTextForm activityId={activity.id} defaultLocale="de" />
        </div>
      )}
      <div className="locale-block">
        <h3>Weitere Sprache hinzufügen</h3>
        <ActivityTextForm activityId={activity.id} />
      </div>
    </div>
  );
}
