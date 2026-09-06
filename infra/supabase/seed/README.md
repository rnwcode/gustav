# Seeds

Reproduzierbare Ausgangszustände für lokale Entwicklung und Staging.

- `breed.sql` — 82 recherchierte, echte Hunderassen (die neun
  Gruppen-Platzhalter legt `0003_rasse.sql` selbst per Migration an,
  stehen nicht hier).
- `skill.sql` — 20 Skills, je zwei Inserts: die sprachneutrale `skill`-Zeile,
  dann ihr deutscher Text in `skill_text` (`locale = 'de'`,
  `0002_content.sql`) — eine weitere Sprache ist später eine zusätzliche
  Zeile pro Skill, kein Schema-Umbau.
- `activity.sql` — 100 Aktivitäten, genauso zweigeteilt (`activity` +
  `activity_text`). Referenziert `skill.id` per Fremdschlüssel — **erst
  `skill.sql`, dann `activity.sql`** ausführen.
- `planner_config.sql` — der komplette Inhalt von `content/planer.yaml`,
  YAML-zu-JSON geparst, als eine Zeile (`version = 1`). Siehe
  `docs/specs/planer-konfig-aus-db.md` für den Hintergrund: `generate-plan`
  liest diese Tabelle statt der Datei. Eine neue `content/planer.yaml`-Version
  bekommt eine zusätzliche Zeile hier, von Hand erzeugt — kein Importskript
  (CLAUDE.md, Regel 5).
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

`infra/supabase/config.toml` trägt unter `[db.seed] sql_paths` eine
explizite, geordnete Liste aller Dateien hier — `supabase db reset` (und
`supabase start` beim ersten Hochfahren) seedet damit lokal automatisch,
in genau dieser Reihenfolge (`breed.sql`, `skill.sql`, `activity.sql`,
`planner_config.sql`).

Gegen die gehostete Instanz läuft kein automatischer Reset — dort von Hand:

```sh
psql "$LOCAL_SUPABASE_DB_URL" -f infra/supabase/seed/breed.sql
psql "$LOCAL_SUPABASE_DB_URL" -f infra/supabase/seed/skill.sql
psql "$LOCAL_SUPABASE_DB_URL" -f infra/supabase/seed/activity.sql
psql "$LOCAL_SUPABASE_DB_URL" -f infra/supabase/seed/planner_config.sql
```

Oder Inhalt einer Datei in Supabase Studios SQL Editor einfügen und
ausführen — funktioniert identisch, lokal wie gehostet.
