import { notFound } from 'next/navigation';
import { getSkill, listSkillTexts } from '../../../lib/skillsRepo';
import { SkillForm } from '../SkillForm';
import { SkillTextForm } from './SkillTextForm';
import { deleteSkillAction, deleteSkillTextAction } from '../actions';

export const dynamic = 'force-dynamic';

export default async function EditSkillPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const skill = await getSkill(id);
  if (skill === null) notFound();

  const texts = await listSkillTexts(id);
  const existingLocales = new Set(texts.map((text) => text.locale));

  return (
    <div>
      <h1>Skill: {skill.id}</h1>
      <SkillForm skill={skill} />

      <form action={deleteSkillAction}>
        <input type="hidden" name="id" value={skill.id} />
        <button type="submit" className="danger">
          Skill löschen
        </button>
      </form>

      <h2>Texte je Sprache</h2>
      {texts.map((text) => (
        <div className="locale-block" key={text.locale}>
          <h3>{text.locale}</h3>
          <SkillTextForm skillId={skill.id} text={text} />
          <form action={deleteSkillTextAction}>
            <input type="hidden" name="skill_id" value={skill.id} />
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
          <SkillTextForm skillId={skill.id} defaultLocale="de" />
        </div>
      )}
      <div className="locale-block">
        <h3>Weitere Sprache hinzufügen</h3>
        <SkillTextForm skillId={skill.id} />
      </div>
    </div>
  );
}
