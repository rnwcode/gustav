# Dokumente

Hier steht alles, was das Produkt ausmacht. Wer neu dazukommt — Mensch oder
Agent — liest in dieser Reihenfolge:

1. **`produkt.md`** — was Gustav ist, was er ausdrücklich nicht ist,
   Produkthaltung, Tonalität, Geschäftsmodell, offene Punkte und Risiken.
   Ohne diese Datei baut man das falsche Produkt.
2. **`datenmodell.md`** — die Beispieltage und das daraus abgeleitete Modell,
   Skill-Zustände mit den drei D, Planer-Ablauf mit Scoring, Test-Fixtures,
   Backlog.
3. **`bauplan.md`** — Phasen, Testebenen, Content-Strang, Abbruchkriterien.
4. **`../CLAUDE.md`** — die zehn Invarianten. Kurz, verbindlich, von der CI
   teilweise erzwungen.

Dazu:

- `specs/` — eine Spec je Funktion, bevor Code entsteht (CLAUDE.md, Regel 7).
  Vorlage in `specs/_vorlage.md`. Eine Spec ist fertig, wenn daraus ein
  fehlschlagender Test geschrieben werden kann — nicht vorher.
- `content/README.md` — Ablauf beim Schreiben der Übungen
- `assets/illustrationen/README.md` — die Einstrich-Regeln
- `infra/supabase/README.md` — Plan-Grenzen und Pflichtprogramm vor Launch

## Womit man anfängt

Die restlichen sieben Beispieltage in `datenmodell.md` schreiben. Dort zeigen
sich die Lücken im Modell — bei den ersten fünf waren es `einzugsdatum` und
`wochenkontext.quelle`, die abstrakt nie modelliert worden wären.

Danach Phase 1: Engine und Simulator.
