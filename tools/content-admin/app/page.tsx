import Link from 'next/link';

export default function HomePage() {
  return (
    <div>
      <h1>Gustav Content Admin</h1>
      <p className="hint">
        Lokales Tool gegen die gehostete DB — pflegt <code>skill</code>/<code>activity</code> samt
        ihrer Texte je Sprache. Siehe <code>docs/specs/content-admin.md</code>.
      </p>
      <ul>
        <li>
          <Link href="/skills">Skills</Link>
        </li>
        <li>
          <Link href="/activities">Aktivitäten</Link>
        </li>
      </ul>
    </div>
  );
}
