import { ActivityForm } from '../ActivityForm';

export const dynamic = 'force-dynamic';

export default function NewActivityPage() {
  return (
    <div>
      <h1>Neue Aktivität</h1>
      <ActivityForm />
    </div>
  );
}
