// Display-only approximation for the onboarding hint text ("16 Wochen —
// Welpenphase"). The real life stage used for planning is derived
// server-side from `birthDate`/`today` and never computed here (CLAUDE.md,
// Regel 2) — this exists purely so the birthdate field can explain itself
// before the dog is even saved.
export function lifeStageHint(birthDateIso: string, today: Date = new Date()): string {
  const birth = new Date(birthDateIso);
  const weeks = Math.max(0, Math.floor((today.getTime() - birth.getTime()) / (7 * 24 * 60 * 60 * 1000)));
  const stage = weeks < 26 ? 'Welpenphase' : weeks < 78 ? 'Junghund' : 'Erwachsen';
  return `${weeks} Wochen — ${stage}`;
}

export function formatDateDe(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('de-DE', { day: 'numeric', month: 'long', year: 'numeric' });
}
