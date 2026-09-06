# Seeds

Reproduzierbare Ausgangszustände für lokale Entwicklung und Staging.

- `rasse.sql` — 82 recherchierte, echte Hunderassen (die neun
  `gruppe_*`-Platzhalter legt `0003_rasse.sql` selbst per Migration an,
  stehen nicht hier).
- `skill.sql` — 20 Skills.
- `aktivitaet.sql` — 100 Aktivitäten (referenziert `skill.id` per
  Fremdschlüssel — **erst `skill.sql`, dann `aktivitaet.sql`** ausführen).
- `entwicklung.sql` — noch nicht angelegt. Geplant: ein Testnutzer mit drei
  Hunden in verschiedenen Lebensphasen (Welpe 11 Wochen, Junghund in der
  Pubertät, erwachsen mit allem gefestigt).

Alle drei Content-Seeds sind erzeugt aus `content/import/*.csv` — dort
(README) steht die Herkunft der Daten und, wichtig, welche Spalten nur
mechanisch abgeleitet und noch nicht trainerisch geprüft sind
(CLAUDE.md, Regel 7: „Jede einzelne selbst lesen" gilt weiter). Jede
Datei ist idempotent (`on conflict (id) do nothing`) — mehrfaches
Ausführen dupliziert nichts.

## Ausführen

Dieses Repo hat noch kein `infra/supabase/config.toml` (nie
`supabase init` gelaufen) — die Dateien hier laufen deshalb **nicht**
automatisch bei `supabase db reset`. Bis das nachgeholt ist
(`[db.seed] sql_paths = ["./seed/*.sql"]` in einer künftigen
`config.toml`), von Hand ausführen:

```sh
psql "$LOCAL_SUPABASE_DB_URL" -f infra/supabase/seed/rasse.sql
psql "$LOCAL_SUPABASE_DB_URL" -f infra/supabase/seed/skill.sql
psql "$LOCAL_SUPABASE_DB_URL" -f infra/supabase/seed/aktivitaet.sql
```

Oder Inhalt einer Datei in Supabase Studios SQL Editor einfügen und
ausführen — funktioniert identisch, lokal wie gehostet.
