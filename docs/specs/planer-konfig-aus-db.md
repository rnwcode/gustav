# Planerkonfiguration aus der Datenbank

*Hinweis: Diese Spec bleibt Deutsch (CLAUDE.md, Abschnitt Sprache). Die
Codebeispiele nennen die tatsächlichen Bezeichner aus
`infra/supabase/functions/` (TypeScript).*

*Update: Tabellen-/Spaltennamen sind seit der Umstellung auf englische
Schemabezeichner Englisch — `planer_konfig`→`planner_config`,
`konfig`→`config`. `skill`/`aktivitaet`/`rasse` weiter unten heißen heute
`skill`/`activity`/`breed`. Der Inhalt der `config`-Spalte selbst (geparstes
`content/planer.yaml`) bleibt Deutsch — das ist geschütztes Content/Gewicht,
CLAUDE.md Regel 6. Aktuell maßgeblich: `infra/supabase/migrations/
0004_planer_konfig.sql`.*

## Warum

`generate-plan` las `content/planer.yaml` bisher per `Deno.readTextFile`
direkt aus dem Checkout — dokumentiert als „temporärer Shim", der vor
einem echten Deploy noch behoben werden musste
(`docs/specs/content-aus-db-laden.md`, „Nicht dazu gehört"). Genau das ist
jetzt live passiert: nach `supabase functions deploy generate-plan`
schlug jeder Aufruf mit `NotFound: /var/content/planer.yaml` fehl — das
Deploy-Bundle einer Edge Function enthält nur `functions/`, nicht
`content/` eine Ebene darüber. Jeder erzeugte Plan blieb leer, weil die
Function nie bis zum eigentlichen `plan()`-Aufruf kam.

## Verhalten

Neue Tabelle `planer_konfig` (Migration `0004_planer_konfig.sql`):
`version` (Primärschlüssel, dieselbe von Hand gepflegte Nummer wie bisher
`content/planer.yaml`s `version`-Feld) und `konfig` (`jsonb`) — die
komplette geparste YAML-Struktur unverändert als ein Blob. Für alle
Nutzer identisch (Content/Konfiguration, kein Nutzerzustand): RLS wie
`skill`/`aktivitaet`/`rasse` — öffentlich lesbar, keine Schreib-Policy für
`anon`/`authenticated`.

`generate-plan/index.ts` liest die Zeile mit der höchsten `version` und
reicht `konfig` unverändert durch dieselben Parser wie bisher
(`parsePlanerConfigYaml`, `parseStateMachineConfigYaml` aus
`_shared/content/planer_yaml.ts`) — diese Funktionen ändern sich nicht,
sie bekommen ihren Input nur aus der DB statt aus `parseYaml(file)`.

```typescript
// generate-plan/index.ts
const { data: planerKonfigRow } = await supabase
  .from('planer_konfig')
  .select('konfig')
  .order('version', { ascending: false })
  .limit(1)
  .maybeSingle();
const plannerConfig = parsePlanerConfigYaml(planerKonfigRow.konfig);
const stateMachineConfig = parseStateMachineConfigYaml(planerKonfigRow.konfig);
```

`content/planer.yaml` bleibt bestehen — der Simulator
(`_shared/planner/simulate.ts`) liest weiterhin die Datei direkt, völlig
unabhängig von `generate-plan`. Ein `--gegen`-Vergleich im Simulator
bleibt damit unverändert möglich, ohne die DB anzufassen.

## Beispiele

1. **Ein Deploy, ein Aufruf.** `planer_konfig` enthält eine Zeile
   (`version = 1`, `konfig` = der komplette Inhalt von
   `content/planer.yaml`, YAML-geparst zu JSON). Ein `generate-plan`-Aufruf
   liest genau diese Zeile und produziert denselben Plan wie vorher unter
   `supabase functions serve` — nur jetzt auch nach einem echten Deploy.

2. **Eine neue Version.** Jemand pflegt `content/planer.yaml` von Hand auf
   `version: 2` hoch (CLAUDE.md, Regel 6: kein Agent eigenmächtig) und legt
   eine zweite Zeile `planer_konfig(version=2, konfig=...)` an, ohne die
   erste zu löschen. `generate-plan` liest ab sofort Version 2 (höchste
   Version); bereits erzeugte Pläne bleiben unverändert (`wochenplan.
   konfig_version` verweist weiter auf 1, CLAUDE.md Regel 10).

## Nicht dazu gehört

- Ein Import-/Sync-Skript, das `content/planer.yaml` automatisch in
  `planer_konfig` schreibt — dieselbe Entscheidung wie bei `aktivitaet`/
  `skill`/`rasse` (CLAUDE.md, Regel 5): direkt in der DB pflegen, kein
  Importpfad aus Dateien. Ein Seed für den Erststand liegt unter
  `infra/supabase/seed/planer_konfig.sql`, einmalig aus der aktuellen
  `content/planer.yaml` erzeugt.
- Alte `konfig_version`-Zeilen zu löschen oder zu bereinigen — jede
  historische Version bleibt greifbar, solange irgendein `wochenplan`
  noch darauf verweist.
