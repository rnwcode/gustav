# Content-Admin-Tool

*Hinweis: Diese Spec bleibt Deutsch (CLAUDE.md, Abschnitt Sprache). Das
Tool selbst (`tools/content-admin/`) ist TypeScript/Next.js — Englisch,
wie jeder andere Code im Repo.

## Warum

`skill`/`activity` (und ihre `*_text`-Tabellen) werden laut CLAUDE.md,
Regel 5, direkt in der DB gepflegt — bisher hieß das: Supabase Studio oder
rohes SQL. Für Hundetrainerinnen ohne SQL-Kenntnisse und für Felder wie
`suitability` (JSONB, Rassegruppe → Gewicht) oder `troubleshooting`
(JSON-Array von Paaren) ist das mühsam und fehleranfällig. Dieses Tool ist
eine reine Bedienoberfläche für genau dieselben Tabellen — keine neue
Quelle der Wahrheit, kein Import-/Export-Schritt.

## Verhalten

**Läuft ausschließlich lokal**, spricht aber direkt die gehostete DB an
(nie lokal via `supabase start`) — es gibt nur einen Content-Stand, und der
lebt gehostet. `tools/content-admin/.env.local` (git-ignoriert) trägt
`SUPABASE_URL` und `SUPABASE_SERVICE_ROLE_KEY`. Der Service-Role-Key ist
nötig, weil `skill`/`activity`/ihre `*_text`-Tabellen keine Schreib-Policy
für `anon`/`authenticated` haben (CLAUDE.md, Regel 5 und 10) — dasselbe
Prinzip wie beim Seed-Skript, nur interaktiv statt einmalig.

**Datenmodelle**: `tools/content-admin/lib/models.ts` spiegelt exakt die
Spaltennamen und Enum-Werte aus `infra/supabase/migrations/0002_content.sql`
und aus `infra/supabase/functions/_shared/planner/models/enums.ts` — dieselbe
Vokabular-Wahl, nicht dieselbe Datei. Next.js läuft auf Node, nicht Deno,
und importiert deshalb nicht direkt aus `infra/supabase/functions/` — kein
neuer Bruch, sondern dieselbe Grenze, die Expo-App und Edge Functions schon
haben (CLAUDE.md, Abschnitt Sprache: „beide Laufzeiten sprechen nur über
[...] Datenstrukturen miteinander, nie über geteilten Code").

**Umfang**: volles Schema von `skill`/`skill_text`/`activity`/
`activity_text` — Kategorie, Voraussetzungen, Zielstufen, Bedarfsdeckung,
Eignung je Rassegruppe, Ausrüstung, Saisonfenster, und die Texte
(`title`/`sentence`/`instructions`/…) je `locale`. Mehrsprachigkeit ist kein
Sonderfall: jede `*_text`-Zeile trägt ihre `locale`, das Tool zeigt
bestehende Sprachen als eigene Blöcke und bietet einen Block „weitere
Sprache hinzufügen" — exakt das Schema, das `0002_content.sql` schon dafür
vorsieht (CLAUDE.md, Abschnitt Sprache: „eine weitere Sprache ist reine
Dateneingabe").

**Nicht Teil der Reproduzierbarkeit** (anders als `weekly_plan`/`slot`):
Content-Änderungen wirken sofort auf den nächsten `generate-plan`-Aufruf,
es gibt keine Versionierung wie bei `planner_config`. Das ist bewusst —
Content ist bereits so gedacht (CLAUDE.md, Regel 5), das Tool ändert daran
nichts.

## Beispiele

1. **Neuer Skill.** Formular unter `/skills/new`: ID (Slug), Kategorie,
   Voraussetzungen, Mindestalter, Zielstufen. Nach dem Speichern existiert
   die `skill`-Zeile, aber noch kein Text — die Bearbeitungsseite zeigt
   direkt darunter ein Formular „Neue Sprache: de".
2. **Übersetzung ergänzen.** Auf `/activities/schnueffelteppich` existiert
   bereits `locale = 'de'`. Ein neuer Block „Weitere Sprache hinzufügen"
   mit `locale = 'en'` legt eine zusätzliche `activity_text`-Zeile an, ohne
   die deutsche zu berühren.
3. **Aktivität löschen.** Der „Aktivität löschen"-Button entfernt die
   `activity`-Zeile; `activity_text` folgt per `on delete cascade`
   (`0002_content.sql`). Referenziert `slot.activity_id` diese Aktivität
   noch (keine Fremdschlüssel-Beziehung dorthin), bleibt der Verweis als
   toter String stehen — dieselbe Konsequenz wie beim Löschen über SQL,
   das Tool verhindert das nicht extra.

## Nicht dazu gehört

- `breed`/`planner_config` — nicht Teil dieser Spec, bleiben Studio/SQL.
- Ein Login/Auth-Layer — das Tool läuft nur lokal auf dem Rechner der
  Person mit dem Service-Role-Key, dieselbe Vertrauensstufe wie Supabase
  Studio.
- Validierung gegen `content/schema/*.yaml` — der künftige
  Content-Validator (`tool/validate.dart`) prüft das separat, dieses Tool
  verlässt sich auf die DB-Constraints (`check`, `not null`).
- Ein Import/Export-Pfad von/nach `content/*.yaml` — bewusst nicht gebaut,
  hieße die DB wäre nicht mehr allein die Quelle der Wahrheit.

## Offene Fragen

Keine — Umfang, Auth-Ansatz (Service-Role-Key, lokal) und die
Datenmodell-Entscheidung (eigene, aber vokabular-gleiche Typen statt
geteiltem Code über Laufzeitgrenzen) sind mit dem Nutzer geklärt.
