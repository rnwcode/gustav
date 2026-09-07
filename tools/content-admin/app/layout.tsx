import type { Metadata } from 'next';
import Link from 'next/link';
import './globals.css';

export const metadata: Metadata = {
  title: 'Gustav Content Admin',
  description: 'Lokales Tool zum Pflegen von skill/activity gegen die gehostete DB.',
};

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="de">
      <body>
        <header className="topbar">
          <Link href="/">Gustav Content Admin</Link>
          <nav>
            <Link href="/skills">Skills</Link>
            <Link href="/activities">Aktivitäten</Link>
          </nav>
        </header>
        <main className="content">{children}</main>
      </body>
    </html>
  );
}
