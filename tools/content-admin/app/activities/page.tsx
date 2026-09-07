import Link from 'next/link';
import { listActivities } from '../../lib/activitiesRepo';

export const dynamic = 'force-dynamic';

export default async function ActivitiesPage() {
  const activities = await listActivities();

  return (
    <div>
      <h1>Aktivitäten</h1>
      <p>
        <Link href="/activities/new">+ Neue Aktivität</Link>
      </p>
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Typ</th>
            <th>Trainiert Skill</th>
            <th>Ort</th>
          </tr>
        </thead>
        <tbody>
          {activities.map((activity) => (
            <tr key={activity.id}>
              <td>
                <Link href={`/activities/${activity.id}`}>{activity.id}</Link>
              </td>
              <td>{activity.type}</td>
              <td>{activity.trains_skill ?? ''}</td>
              <td>{activity.location}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
