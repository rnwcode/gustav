# Import-Vorlagen für `activity`/`skill`/`breed`

Drei CSV-Dateien, eine Kopfzeile pro Tabellenspalte. `rasse.csv`: die neun
Gruppen-Platzhalter aus `0003_rasse.sql` plus 82 recherchierte, echte
Rassen (91 Zeilen insgesamt). `skill.csv`/`aktivitaet.csv`: 20 Skills und
100 Aktivitäten, aus zwei extern bereitgestellten Rohdaten-Dateien
(`gemini-code-*.txt`, KI-generierte Entwürfe) auf das DB-Schema übersetzt
— Details und Einschränkungen im Abschnitt „Woher Skills/Aktivitäten
kommen" unten. Die Dateinamen selbst (`rasse.csv`, `aktivitaet.csv`) sind
historisch und bleiben es — nur die Spaltennamen darin und die Tabellen,
in die sie münden (`breed`, `activity`), sind Englisch (CLAUDE.md,
Abschnitt Sprache).

Dieselben Daten liegen zusätzlich als fertige SQL-Inserts unter
`infra/supabase/seed/{breed,skill,activity}.sql` (siehe dortige
README) — für den schnellen Weg in eine lokale oder gehostete DB per
`psql`/Studio-SQL-Editor, ohne CSV-Import-Dialog. Erzeugt mit
`csv_to_seed_sql.py` (dieses Verzeichnis) — nach jeder Änderung an einer
der drei CSVs `python3 content/import/csv_to_seed_sql.py` (aus dem
Repo-Root) erneut ausführen, damit beide Stellen synchron bleiben.

### Woher Skills/Aktivitäten kommen

Quelle waren zwei semikolon-getrennte Dateien mit einem eigenen,
schlankeren Schema (`Skill_ID;Name;Kategorie;Voraussetzungen_Skill_ID;
Mindestalter_Monate;Zielstufe;Sicherheitshinweis` bzw. `Aktivitaet_ID;
Name;Zugehoeriger_Skill_ID;Saison;Gelenkbelastung;Hitzegeeignet;
Regengeeignet;Anleitung_Schritte;Fehlerbehebung`). Ein Python-Skript hat
das auf `content/schema/{skill,aktivitaet}.yaml` übersetzt (dort und in
den `content/{skills,aktivitaeten}/*.yaml`-Dateien bleiben die deutschen
Feldnamen — Content, keine Entwicklungssprache). Zwei grundverschiedene
Sorten von Feldern dabei:

**Direkt übernommen** (keine Interpretation nötig): Name, Kategorie/
zugehöriger Skill, Voraussetzungen, Mindestalter (Monate → Wochen,
`× 4.345`), Saison → `seasonal_window`, Gelenkbelastung →
`joint_straining` (nur bei „Hoch"), Hitze-/Regeneignung,
Anleitungsschritte, sowie die Problem/Lösung-Angabe aus `Fehlerbehebung`
(füllt sowohl `common_mistakes` als auch `troubleshooting`, da die Quelle
nur einen Tipp pro Aktivität liefert).

**Mechanisch abgeleitet, NICHT trainerisch geprüft** — das Quellschema
kennt diese Felder schlicht nicht, das Skript füllt sie mit einfachen,
dokumentierten Faustregeln statt Fachwissen:

- `category` (Skill): die Quell-Kategorien (Grundgehorsam, Kognition,
  Trickdogging, Koerperbewusstsein, Nasenarbeit, Agility, …) passen nicht
  1:1 auf die sechs Schema-Werte. Abbildung: Grundgehorsam → `basicCue`
  (außer Leinenführigkeit → `leashWork`), Impulskontrolle/
  Distanzkontrolle → `impulseControl`, alles andere → `cooperation`
  (der Sammelbegriff für „gemeinsam mit dem Halter erarbeitet", da
  `dailyRoutine`/`socialBehavior` in der Quelle keine Entsprechung haben).
- `is_core_skill`: `true` für Grundgehorsam/Impulskontrolle/Distanzkontrolle,
  sonst `false`.
- `target_levels` (Skill): die Quelle kennt nur eine einzige Schwierigkeits-
  stufe (Anfänger/Fortgeschritten/Profi) statt drei D's — auf alle drei
  Dimensionen dieselbe grobe Eskalation gelegt (1/1/2 · 2/3/3 · 3/4/5).
- `description` (Skill) und `sentence`/`success_criterion` (Aktivität): von
  Hand bzw. aus dem ersten Anleitungsschritt generiert, da die Quelle keine
  eigene Nutzertext-Spalte hat.
- `needs`, `arousal`, `duration_min/max`: aus der Skill-Kategorie bzw.
  `Gelenkbelastung` grob abgeleitet (z. B. Nasenarbeit → hoher `scent`-Wert;
  „Hoch" Gelenkbelastung → kürzere, intensivere Dauer).
- `location`, `for_distraction`, `equipment`, `second_person`,
  `darkness_suitable`: per Stichwortsuche in Name/Anleitung (z. B. „Wald" →
  draußen, „Ablenkung"/„Stadt"/„Reizangel" → hohe Ablenkungsstufe,
  „Sprung"/„Schwimmen" → nicht dunkeltauglich).
- `suitability`: überall `{}` (neutral) — die Quelle enthält keinerlei
  Rasseinformation, eine erfundene Gewichtung wäre unbegründet.
- `variance_group`: jede Aktivität ihre eigene Gruppe (= eigene `id`) — ob
  mehrere der 100 Aktivitäten eigentlich austauschbare Varianten
  derselben Übung sind (und sich eine Sperrfrist teilen sollten), ist
  Trainereinschätzung, keine Textanalyse.
- `cooldown_days`: 3 Tage bei einem Kernskill-Training, sonst 7, bei
  den zwei Ruhe-Aktivitäten 0 (dieselbe Faustregel wie in
  `_shared/planner/fixtures/activities.ts`).

**Vor echtem Einsatz nötig:** genau der Schritt, den `content/README.md`
für jede Content-Charge ohnehin vorschreibt — „Jede einzelne selbst
lesen." Diese Übersetzung ist strukturell korrekt (importiert sauber,
läuft durch den echten Row-Parser, siehe „Geprüft" unten), aber
inhaltlich ungeprüft bei allem, was oben als „mechanisch abgeleitet"
steht.

### Woher die 82 Rassen kommen

Recherchiert über die FCI-Systematik (10 Gruppen: 1 Schäfer-/Hütehunde,
2 Pinscher/Schnauzer/Molossoide/Sennenhunde, 3 Terrier, 4 Dachshunde,
5 Spitze/Urtyp, 6 Laufhunde, 7 Vorstehhunde, 8 Apportier-/Stöber-/
Wasserhunde, 9 Gesellschafts-/Begleithunde, 10 Windhunde) und
mechanisch auf die neun Produkt-Gruppen übersetzt:

| FCI-Gruppe | → Produkt-`breed_group` |
|---|---|
| 1 | `herding` |
| 2, Sektion 2.2 (Berghunde/Herdenschutz) | `livestockGuardian` |
| 2, sonst (Pinscher/Schnauzer, Doggenartige, Sennenhunde) | `molosser` |
| 3 | `terrier` |
| 4, 6, 7, 8 | `hunting` |
| 5 | `nordic` |
| 9 | `companion` |
| 10 | `sighthound` |

Das ist eine **grobe, mechanische Übersetzung** einer 10- auf eine
9-Werte-Systematik — an einzelnen Rändern Ermessenssache (z. B. der
Bernhardiner teilt sich FCI-Sektion 2.2 mit echten Herdenschutzhunden,
landet hier aber bewusst bei `molosser`, weil er heute kein
Herdenschutzhund im eigentlichen Sinn ist; der Boston Terrier ist trotz
FCI-Molossoid-Abstammung offiziell in Gruppe 9 und landet entsprechend
bei `companion`). Die Rassegruppe **filtert nie hart, sie gewichtet nur**
(`docs/datenmodell.md`) — eine im Einzelfall diskutable Zuordnung verzerrt
Vorschläge leicht, bricht aber nichts. Einzelne Zeilen lassen sich jederzeit
direkt im Table Editor korrigieren, ganz ohne Migration.

Zum Anlegen neuer Zeilen: Datei in Excel/Numbers/Google Sheets öffnen,
eine neue Zeile darunter anfügen, als CSV speichern, dann importieren —
direkt in die DB, kein Code, kein Deploy (CLAUDE.md, Regel 5: Content wird
in der DB gepflegt, nicht aus Dateien importiert; diese Vorlagen sind nur
die Abkürzung für den Weg dorthin).

## Import in Supabase Studio

**Nur für `rasse.csv`** funktioniert der direkte CSV-Import, weil `breed`
eine einzelne Tabelle ist:

1. Table Editor öffnen → Tabelle `breed` → **Insert** → **Import data via CSV**.
2. Die Datei auswählen. Studio erkennt die Kopfzeile automatisch.
3. Bei neuen Zeilen ist die `id` frei wählbar (kleinbuchstaben_mit_unterstrich,
   wie im Content-Schema, `content/schema/rasse.yaml`) — bei einer
   bestehenden `id` schlägt der Import fehl (Primary Key), das ist
   beabsichtigt: ein Update ist eine bewusste Zeilen-Bearbeitung im
   Table Editor, kein CSV-Reimport. Konkret: die neun Gruppen-Platzhalter
   (`group_*`) existieren schon (Migration) — beim Import entweder nur die
   82 Rassen-Zeilen auswählen, oder die neun `gruppe_*`-Zeilen vorher aus
   der CSV löschen.

**Für `skill.csv`/`aktivitaet.csv` geht das nicht mehr direkt:** ihr Inhalt
verteilt sich seit der Mehrsprachigkeit auf zwei Tabellen (`skill`/
`skill_text`, `activity`/`activity_text`, `0002_content.sql`) — Studios
CSV-Import kennt aber nur „eine Datei → eine Tabelle". Stattdessen: nach
jeder Änderung an einer der beiden CSVs `python3 content/import/
csv_to_seed_sql.py` laufen lassen (schreibt `infra/supabase/seed/
{skill,activity}.sql` mit je zwei `insert`-Anweisungen neu) und diese
Datei in Studios SQL Editor einfügen und ausführen, oder per `psql`:

```sh
psql "$LOCAL_SUPABASE_DB_URL" -f infra/supabase/seed/skill.sql
psql "$LOCAL_SUPABASE_DB_URL" -f infra/supabase/seed/activity.sql
```

`rasse.csv` lässt sich alternativ auch per `\copy` einspielen (z. B. lokal
gegen `supabase start`):

```sh
psql "$LOCAL_SUPABASE_DB_URL" -c "\copy breed from 'content/import/rasse.csv' with (format csv, header true)"
```

`null ''` sorgt dafür, dass leere Zellen (`trains_skill` bei Ruhe-Aktivitäten,
`for_distraction`, `seasonal_window`, `max_age_weeks`, `illustration`) als
SQL-`NULL` ankommen statt als leerer String — Supabase Studios CSV-Import
macht das automatisch, nur `\copy` von Hand braucht die Option.

## Format der Zellen

Die meisten Spalten sind einfacher Text/Zahl/Wahrheitswert. Drei Formen
brauchen genaues Hinsehen, weil sie verschachtelte Werte in eine einzelne
Zelle packen:

- **Feste Objekte** (`needs`, `suitability`, `target_levels`,
  `troubleshooting`): JSON in der Zelle, z. B. `{"physical": 1,
  "mentalWork": 3, "scent": 3, "social": 0, "recovery": 1}`.
  `troubleshooting` ist eine JSON-**Liste** von `{"problem": "...",
  "answer": "..."}`.
- **Listen von Text** (`prerequisites`, `equipment`, `instructions`,
  `common_mistakes`): Postgres-Array-Schreibweise mit geschweiften Klammern,
  jedes Element in Anführungszeichen, wenn es ein Komma oder selbst
  Anführungszeichen enthält: `{"Erster Schritt, mit Komma.","Zweiter
  Schritt."}`. Leer: `{}`.
- **Zahlenpaar** (`for_distraction`, nur bei `type = training`): JSON-Array
  aus zwei Zahlen, z. B. `[2, 3]`. Sonst leer lassen.

Leere Zelle = `null` (z. B. `trains_skill` bei Beschäftigung,
`max_age_weeks`, `seasonal_window`, `illustration`).

**Wichtig für Excel/Sheets:** Speichern als **CSV UTF-8**, nicht als
Standard-CSV — sonst werden Umlaute/„—" beim nächsten Öffnen falsch
dargestellt. Zellen mit Kommas oder Anführungszeichen behält die
Tabellenkalkulation beim Speichern automatisch korrekt in
Anführungszeichen; von Hand nichts zusätzlich escapen.

## Geprüft

Die generierten `infra/supabase/seed/*.sql`-Dateien laufen zweimal
hintereinander sauber gegen eine lokale Postgres-Instanz mit
`0001_init.sql`–`0003_rasse.sql` (erster Lauf: 82/20/100 Inserts, zweiter
Lauf: `on conflict do nothing` greift, 0 neue Zeilen — Idempotenz
bestätigt). Zusätzlich, unabhängig davon: alle drei Dateien wurden per
`\copy` in eine lokale Postgres-Instanz mit
`0001_init.sql`–`0003_rasse.sql` importiert: `rasse.csv` alle 91 Zeilen,
`skill.csv` alle 20, `aktivitaet.csv` alle 100 (inklusive Fremdschlüssel
`activity.trains_skill → skill.id` — keine verwaiste Referenz, sonst
hätte der Import abgebrochen), alle Check-Constraints grün. Jede
importierte Zeile wurde anschließend über `activityFromRow`/`skillFromRow`
bzw. `resolveBreedGroups` (`infra/supabase/functions/generate-plan/rows.ts`
— derselbe Code, den `generate-plan` zur Laufzeit nutzt) gelesen: 100
Aktivitäten + 20 Skills ohne einen einzigen Übersetzungsfehler. Das
bestätigt nur die **strukturelle** Korrektheit (Format, Enums,
Fremdschlüssel) — keine inhaltliche Prüfung der mechanisch abgeleiteten
Felder, siehe „Woher Skills/Aktivitäten kommen" oben.
