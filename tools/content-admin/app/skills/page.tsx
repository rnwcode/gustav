import Link from 'next/link';
import { listSkills } from '../../lib/skillsRepo';

export const dynamic = 'force-dynamic';

export default async function SkillsPage() {
  const skills = await listSkills();

  return (
    <div>
      <h1>Skills</h1>
      <p>
        <Link href="/skills/new">+ Neuer Skill</Link>
      </p>
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Kategorie</th>
            <th>Kern-Skill</th>
            <th>Voraussetzungen</th>
          </tr>
        </thead>
        <tbody>
          {skills.map((skill) => (
            <tr key={skill.id}>
              <td>
                <Link href={`/skills/${skill.id}`}>{skill.id}</Link>
              </td>
              <td>{skill.category}</td>
              <td>{skill.is_core_skill ? 'ja' : ''}</td>
              <td>{skill.prerequisites.join(', ')}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
