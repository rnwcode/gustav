'use client';

export default function ErrorBoundary({ error }: { error: Error & { digest?: string } }) {
  return (
    <div className="error">
      <strong>Fehler:</strong> {error.message}
    </div>
  );
}
