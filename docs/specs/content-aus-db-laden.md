# Content aus der Datenbank laden

*Hinweis: Diese Spec bleibt Deutsch (CLAUDE.md, Abschnitt Sprache). Die
Codebeispiele nennen die tatsächlichen Bezeichner aus
`infra/supabase/functions/` (TypeScript).*

## Warum

`generate-plan` liest Skills und Aktivitäten bisher aus
`_shared/planner/fixtures/{activities,skills}.ts` — synthetischen Daten für
Simulator und Tests. Das widerspricht CLAUDE.md, Regel 5 direkt: „Content
ist Daten, nie Code … niemals als Literale im Code der Edge Functions.“
Ohne echten DB-Katalog bekommt kein Nutzer je einen Plan aus den 40
echten Aktivitäten, egal wie viele Trainer Content anlegen — die Function
sieht ihn nie.

## Verhalten

Zwei neue Tabellen, `skill` und `aktivitaet` (Migration `0002_content.sql`),
mit denselben Feldern wie `content/schema/{skill,aktivitaet}.yaml` — gleiche
deutsche Spaltennamen, gleiche verschachtelte Struktur für zusammengesetzte
Felder (`bedarf`, `eignung`, `zielstufen`, `troubleshooting` als `jsonb`).
Sie sind für alle Nutzer identisch (Content, kein Nutzerzustand): RLS ist
aktiv, aber mit genau einer Policy — öffentlich lesbar, nirgends
schreibbar über `anon`/`authenticated`.

**Die DB ist die Quelle der Wahrheit, kein Import-Ziel.** Content wird
direkt in `aktivitaet`/`skill` angelegt und gepflegt (Supabase Studio/SQL,
mit dem Service-Role- bzw. Postgres-Zugang, der RLS ohnehin umgeht) — es
gibt bewusst keinen Datei→DB-Importschritt. `content/{aktivitaeten,skills}/
*.yaml` bleibt bestehen, dient aber nur noch als Schema-Dokumentation und
als synthetischer Katalog für den Simulator — nicht als Quelle für die
Produktionsdaten. Ein Seed aus Dateien kann als eigenes, späteres Stück
Arbeit zurückkommen (siehe „Nicht dazu gehört“), ist hier bewusst nicht
gebaut.

`generate-plan/index.ts` liest `activityCatalog`/`skillCatalog` per
`select('*')` aus diesen beiden Tabellen statt aus den Fixtures. Weil eine
Tabellenzeile dieselbe Form hat wie ein bereits YAML-geparstes Dokument,
durchläuft sie exakt denselben Übersetzer wie der Content-Loader
(`_shared/content/{activity,skill}_yaml.ts`) — keine zweite
Übersetzungslogik für den DB-Pfad.

```typescript
// rows.ts
export function activityFromRow(row: unknown): Activity; // = parseActivityYaml(row)
export function skillFromRow(row: unknown): Skill;        // = parseSkillYaml(row)
```

## Beispiele

1. **Eine Zeile in der DB, dann ein `generate-plan`-Aufruf.**
   `aktivitaet` enthält eine Zeile mit `id =
   'schnueffelteppich_einfuehrung'` (von Hand angelegt, gleiche Felder wie
   `content/aktivitaeten/schnueffelteppich_einfuehrung.yaml`), `skill` eine
   Zeile mit `id = 'rueckruf'`. Ein `generate-plan`-Aufruf sieht
   `activityCatalog = [Activity{id: 'schnueffelteppich_einfuehrung', …}]`
   — identisch zu dem, was `loadActivityCatalog(ACTIVITIES_DIR)` heute im
   Simulator aus der gleichnamigen YAML-Datei liefert.

2. **Eine Änderung wirkt sofort.**
   Jemand ändert `zielstufen.distanz` der `skill`-Zeile `rueckruf` von 3
   auf 4 direkt in Supabase Studio. Der nächste `generate-plan`-Aufruf für
   irgendeinen Hund sieht sofort `targetLevels.distance = 4` — kein Deploy,
   kein Seed-Lauf nötig.

3. **Öffentlich lesbar, nicht schreibbar über die App.**
   Ein `SELECT * FROM aktivitaet` mit dem `anon`-Key (kein eingeloggter
   Nutzer nötig) liefert die vorhandenen Zeilen. Ein `INSERT INTO
   aktivitaet …` mit dem `anon`- oder einem `authenticated`-Token schlägt
   fehl (RLS: keine Policy erlaubt Schreiben) — nur der direkte
   DB-Zugriff (Studio/SQL, Service-Role) kann schreiben.

## Nicht dazu gehört

- Die 40 echten Aktivitäten selbst zu schreiben — Trainerarbeit
  (`content/README.md`, Abschnitt „Ablauf pro Charge“).
- Ein Seed-/Import-Skript von `content/*.yaml` in die DB. War Teil eines
  früheren Anlaufs dieser Spec, wurde bewusst wieder verworfen: Content
  soll direkt in der DB gepflegt werden, nicht aus Dateien importiert
  (CLAUDE.md, Regel 5). Kann als eigenes Stück Arbeit zurückkommen, wenn
  z. B. Staging/Produktion synchron gehalten werden müssen — nicht jetzt.
- Ein Content-Validator (`tool/validate.dart`s Nachfolger) — prüft Struktur,
  Referenzen, Zyklenfreiheit, Abdeckung. Bleibt vorerst Dart-Stub, ist ein
  eigenes Stück Arbeit; müsste ohnehin auf die DB umgestellt werden, nicht
  mehr auf `content/*.yaml`.
- `content/planer.yaml` (Planerkonfiguration) aus einer DB-Tabelle statt
  Datei zu lesen — betrifft `generate-plan`s separat dokumentierten Shim
  (README dort, Abschnitt „Ein temporärer Shim“), nicht diese Spec.
- Fremdschlüssel auf `voraussetzungen`/`trainiert_skill` streng zu
  erzwingen, wenn referenzierte Skills selbst noch fehlen (aktuell
  verweist `rueckruf` auf `namensaufmerksamkeit`, das es noch nicht gibt)
  — Referenzen validiert der künftige Content-Validator, nicht die DB per
  FK-Constraint auf einem Array-Feld.

## Offene Fragen

- Wie werden Staging und Produktion synchron gehalten, wenn Content direkt
  in der jeweiligen DB gepflegt wird (kein gemeinsames Dateiformat mehr als
  Quelle)? Für den MVP mit einem Projekt (CLAUDE.md, Regel 8: gehostet,
  Region Frankfurt) nicht akut — wird relevant, sobald ein zweites
  Environment dazukommt.
