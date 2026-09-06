# Import-Vorlagen für `aktivitaet`/`skill`/`rasse`

Drei CSV-Dateien, eine Kopfzeile pro Tabellenspalte. `rasse.csv`: die neun
Gruppen-Platzhalter aus `0003_rasse.sql` plus 82 recherchierte, echte
Rassen (91 Zeilen insgesamt). `skill.csv`/`aktivitaet.csv`: 20 Skills und
100 Aktivitäten, aus zwei extern bereitgestellten Rohdaten-Dateien
(`gemini-code-*.txt`, KI-generierte Entwürfe) auf das DB-Schema übersetzt
— Details und Einschränkungen im Abschnitt „Woher Skills/Aktivitäten
kommen" unten.

Dieselben Daten liegen zusätzlich als fertige SQL-Inserts unter
`infra/supabase/seed/{rasse,skill,aktivitaet}.sql` (siehe dortige
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
das auf `content/schema/{skill,aktivitaet}.yaml` übersetzt. Zwei
grundverschiedene Sorten von Feldern dabei:

**Direkt übernommen** (keine Interpretation nötig): Name, Kategorie/
zugehöriger Skill, Voraussetzungen, Mindestalter (Monate → Wochen,
`× 4.345`), Saison → `saisonfenster`, Gelenkbelastung → `gelenkbelastend`
(nur bei „Hoch"), Hitze-/Regeneignung, Anleitungsschritte, sowie die
Problem/Lösung-Angabe aus `Fehlerbehebung` (füllt sowohl `haeufige_fehler`
als auch `troubleshooting`, da die Quelle nur einen Tipp pro Aktivität
liefert).

**Mechanisch abgeleitet, NICHT trainerisch geprüft** — das Quellschema
kennt diese Felder schlicht nicht, das Skript füllt sie mit einfachen,
dokumentierten Faustregeln statt Fachwissen:

- `kategorie` (Skill): die Quell-Kategorien (Grundgehorsam, Kognition,
  Trickdogging, Koerperbewusstsein, Nasenarbeit, Agility, …) passen nicht
  1:1 auf die sechs Schema-Werte. Abbildung: Grundgehorsam → `grundsignal`
  (außer Leinenführigkeit → `leinenarbeit`), Impulskontrolle/
  Distanzkontrolle → `impulskontrolle`, alles andere → `kooperation`
  (der Sammelbegriff für „gemeinsam mit dem Halter erarbeitet", da
  `alltagsroutine`/`sozialverhalten` in der Quelle keine Entsprechung haben).
- `ist_kernskill`: `true` für Grundgehorsam/Impulskontrolle/Distanzkontrolle,
  sonst `false`.
- `zielstufen` (Skill): die Quelle kennt nur eine einzige Schwierigkeits-
  stufe (Anfänger/Fortgeschritten/Profi) statt drei D's — auf alle drei
  Dimensionen dieselbe grobe Eskalation gelegt (1/1/2 · 2/3/3 · 3/4/5).
- `beschreibung` (Skill) und `satz`/`erfolgskriterium` (Aktivität): von
  Hand bzw. aus dem ersten Anleitungsschritt generiert, da die Quelle keine
  eigene Nutzertext-Spalte hat.
- `bedarf`, `belastung`, `dauer_min/max`: aus der Skill-Kategorie bzw.
  `Gelenkbelastung` grob abgeleitet (z. B. Nasenarbeit → hoher `nase`-Wert;
  „Hoch" Gelenkbelastung → kürzere, intensivere Dauer).
- `ort`, `fuer_ablenkung`, `equipment`, `zweite_person`, `dunkeltauglich`:
  per Stichwortsuche in Name/Anleitung (z. B. „Wald" → draußen, „Ablenkung"/
  „Stadt"/„Reizangel" → hohe Ablenkungsstufe, „Sprung"/„Schwimmen" →
  nicht dunkeltauglich).
- `eignung`: überall `{}` (neutral) — die Quelle enthält keinerlei
  Rasseinformation, eine erfundene Gewichtung wäre unbegründet.
- `varianzgruppe`: jede Aktivität ihre eigene Gruppe (= eigene `id`) — ob
  mehrere der 100 Aktivitäten eigentlich austauschbare Varianten
  derselben Übung sind (und sich eine Sperrfrist teilen sollten), ist
  Trainereinschätzung, keine Textanalyse.
- `sperrfrist_tage`: 3 Tage bei einem Kernskill-Training, sonst 7, bei
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

| FCI-Gruppe | → Produkt-`rassegruppe` |
|---|---|
| 1 | `huete` |
| 2, Sektion 2.2 (Berghunde/Herdenschutz) | `herdenschutz` |
| 2, sonst (Pinscher/Schnauzer, Doggenartige, Sennenhunde) | `molosser` |
| 3 | `terrier` |
| 4, 6, 7, 8 | `jagd` |
| 5 | `nordisch` |
| 9 | `begleit` |
| 10 | `wind` |

Das ist eine **grobe, mechanische Übersetzung** einer 10- auf eine
9-Werte-Systematik — an einzelnen Rändern Ermessenssache (z. B. der
Bernhardiner teilt sich FCI-Sektion 2.2 mit echten Herdenschutzhunden,
landet hier aber bewusst bei `molosser`, weil er heute kein
Herdenschutzhund im eigentlichen Sinn ist; der Boston Terrier ist trotz
FCI-Molossoid-Abstammung offiziell in Gruppe 9 und landet entsprechend
bei `begleit`). Die Rassegruppe **filtert nie hart, sie gewichtet nur**
(`docs/datenmodell.md`) — eine im Einzelfall diskutable Zuordnung verzerrt
Vorschläge leicht, bricht aber nichts. Einzelne Zeilen lassen sich jederzeit
direkt im Table Editor korrigieren, ganz ohne Migration.

Zum Anlegen neuer Zeilen: Datei in Excel/Numbers/Google Sheets öffnen,
eine neue Zeile darunter anfügen, als CSV speichern, dann importieren —
direkt in die DB, kein Code, kein Deploy (CLAUDE.md, Regel 5: Content wird
in der DB gepflegt, nicht aus Dateien importiert; diese Vorlagen sind nur
die Abkürzung für den Weg dorthin).

## Import in Supabase Studio

1. Table Editor öffnen → Tabelle `skill`, `aktivitaet` bzw. `rasse` →
   **Insert** → **Import data via CSV**.
2. Die Datei auswählen. Studio erkennt die Kopfzeile automatisch.
3. Bei neuen Zeilen ist die `id` frei wählbar (kleinbuchstaben_mit_unterstrich,
   wie im Content-Schema, `content/schema/{aktivitaet,skill}.yaml`) — bei
   einer bestehenden `id` schlägt der Import fehl (Primary Key), das ist
   beabsichtigt: ein Update ist eine bewusste Zeilen-Bearbeitung im
   Table Editor, kein CSV-Reimport. Für `rasse.csv` heißt das konkret: die
   neun `gruppe_*`-Zeilen existieren schon (Migration) — beim Import
   entweder nur die 82 Rassen-Zeilen auswählen, oder die neun `gruppe_*`-
   Zeilen vorher aus der CSV löschen.
4. `skill.csv` vor `aktivitaet.csv` importieren — `aktivitaet.trainiert_skill`
   verweist per Fremdschlüssel auf `skill.id`.

Alternativ per `psql`/`\copy` (z. B. lokal gegen `supabase start`):

```sh
psql "$LOCAL_SUPABASE_DB_URL" -c "\copy skill from 'content/import/skill.csv' with (format csv, header true, null '')"
psql "$LOCAL_SUPABASE_DB_URL" -c "\copy aktivitaet from 'content/import/aktivitaet.csv' with (format csv, header true, null '')"
psql "$LOCAL_SUPABASE_DB_URL" -c "\copy rasse from 'content/import/rasse.csv' with (format csv, header true)"
```

`null ''` sorgt dafür, dass leere Zellen (`trainiert_skill` bei Ruhe-Aktivitäten,
`fuer_ablenkung`, `saisonfenster`, `max_alter_wochen`, `illustration`) als
SQL-`NULL` ankommen statt als leerer String — Supabase Studios CSV-Import
macht das automatisch, nur `\copy` von Hand braucht die Option.

## Format der Zellen

Die meisten Spalten sind einfacher Text/Zahl/Wahrheitswert. Drei Formen
brauchen genaues Hinsehen, weil sie verschachtelte Werte in eine einzelne
Zelle packen:

- **Feste Objekte** (`bedarf`, `eignung`, `zielstufen`, `troubleshooting`):
  JSON in der Zelle, z. B. `{"koerperlich": 1, "kopfarbeit": 3, "nase": 3,
  "sozial": 0, "erholung": 1}`. `troubleshooting` ist eine JSON-**Liste**
  von `{"problem": "...", "antwort": "..."}`.
- **Listen von Text** (`voraussetzungen`, `equipment`, `anleitung`,
  `haeufige_fehler`): Postgres-Array-Schreibweise mit geschweiften Klammern,
  jedes Element in Anführungszeichen, wenn es ein Komma oder selbst
  Anführungszeichen enthält: `{"Erster Schritt, mit Komma.","Zweiter
  Schritt."}`. Leer: `{}`.
- **Zahlenpaar** (`fuer_ablenkung`, nur bei `typ = training`): JSON-Array
  aus zwei Zahlen, z. B. `[2, 3]`. Sonst leer lassen.

Leere Zelle = `null` (z. B. `trainiert_skill` bei Beschäftigung,
`max_alter_wochen`, `saisonfenster`, `illustration`).

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
`aktivitaet.trainiert_skill → skill.id` — keine verwaiste Referenz, sonst
hätte der Import abgebrochen), alle Check-Constraints grün. Jede
importierte Zeile wurde anschließend über `activityFromRow`/`skillFromRow`
bzw. `resolveBreedGroups` (`infra/supabase/functions/generate-plan/rows.ts`
— derselbe Code, den `generate-plan` zur Laufzeit nutzt) gelesen: 100
Aktivitäten + 20 Skills ohne einen einzigen Übersetzungsfehler. Das
bestätigt nur die **strukturelle** Korrektheit (Format, Enums,
Fremdschlüssel) — keine inhaltliche Prüfung der mechanisch abgeleiteten
Felder, siehe „Woher Skills/Aktivitäten kommen" oben.
