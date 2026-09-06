# Rasse statt Rassegruppe am Hund

*Hinweis: Diese Spec bleibt Deutsch (CLAUDE.md, Abschnitt Sprache). Die
Codebeispiele nennen die tatsächlichen Bezeichner aus
`infra/supabase/functions/` (TypeScript).*

## Warum

`hund.rassegruppe` ist heute ein einzelner, von Hand gewählter Wert aus
neun Gruppen. `docs/produkt.md` listet „Rasse-Spezialpfade" bewusst als
„Nicht im MVP … erst nach den ersten 100 zahlenden Kunden". Diese
Entscheidung wird hiermit bewusst vorgezogen (Nutzerentscheidung,
`docs/produkt.md`/`docs/datenmodell.md` werden entsprechend aktualisiert):
Rassegruppe wird zur Eigenschaft einer eigenen `rasse`-Tabelle, ein Hund
verweist auf eine oder mehrere Rassen (Mischling: mehrere, mit Gewicht).
Das macht den Weg zu echten, einzeln benannten Rassen (statt nur neun
Gruppen) später zu einer reinen Dateneingabe — ohne Schema-Änderung.

**Ausdrücklich nicht Teil dieser Änderung:** `groessenklasse` und
`koerperbau` bleiben am Hund. Sie werden heute unabhängig von der
Rassegruppe direkt vom Halter angegeben (`Step3Body.tsx` — ein Hund der
Gruppe „hüte" kann klein oder groß, kurznasig oder nicht sein), sind also
Eigenschaften des einzelnen Tieres, keine Rasseeigenschaften. Sie in die
`rasse`-Tabelle zu verschieben würde echte, heute vom Halter direkt
beobachtete Information durch eine grobe Rasse-Annahme ersetzen — ein
Rückschritt, kein Fortschritt.

## Verhalten

**Neue Tabelle `rasse`** (Migration `0003_rasse.sql`): `id` (Slug),
`name`, `rassegruppe` (dieselben neun Werte wie bisher). Für alle Nutzer
identisch (Content, kein Nutzerzustand) — RLS: öffentlich lesbar, wie
`skill`/`aktivitaet` (`docs/specs/content-aus-db-laden.md`). Gepflegt
direkt in der DB (CLAUDE.md, Regel 5), kein Import-Skript.

**Neue Verknüpfungstabelle `hund_rasse`**: `hund_id`, `rasse_id`,
`gewichtung` (nullable `numeric`). `null` bedeutet „gleichmäßig verteilt
auf alle Rassen dieses Hundes" — ein Mischling mit zwei verknüpften Rassen
ohne gesetzte Gewichtung zählt beide zu je 50 %, ganz ohne dass das jemand
pflegen muss. Ein Gewicht wird nur gesetzt, wenn tatsächlich ein Anteil
bekannt ist (z. B. „zu drei Vierteln Border Collie"). RLS wie
`skill_stand`: eigene Zeilen über den Join zurück zu `hund.besitzer`.

**`hund`**: Spalte `rassegruppe` entfällt. Neu: `geschlecht` (`ruede` |
`huendin`, nullable) und `kastriert` (`bool`, nullable) — beide nullable,
weil „unbekannt" ein legitimer Zustand ist, gerade bei Tierschutzhunden.

**Planer-Modell**: `Dog.breedGroup: BreedGroup` (ein Wert) wird zu
`Dog.breedGroups: ReadonlyMap<BreedGroup, number>` (normierte Gewichte,
Summe 1). `scoreActivities()` summiert `activity.suitability.get(group) *
weight` über alle Gruppen des Hundes, statt eines einzelnen Lookups
(`steps/scoring.ts`). `Dog` bekommt zusätzlich `gender: Gender | null` und
`neutered: boolean | null` — vorerst rein informativ, keine Planer-Logik
liest sie (analog zu `restrictions`, die auch nicht bei jedem Schritt
gebraucht werden).

```typescript
// rows.ts
export function resolveBreedGroups(
  breeds: readonly { rassegruppe: string; gewichtung: number | null }[],
): ReadonlyMap<BreedGroup, number>;

export function dogFromRow(
  row: HundRow,
  breeds: readonly { rassegruppe: string; gewichtung: number | null }[],
): Dog;
```

**App**: Keine UI-Änderung für die Rassegruppen-Auswahl —
`Step2Origin.tsx`s Chip-Reihe bleibt exakt wie heute. Nur
`onboardingRepository.createDog()` ändert sich: statt `rassegruppe` auf
`hund` zu schreiben, legt sie nach dem Hund eine `hund_rasse`-Zeile an,
die auf einen von neun generischen Platzhatzern in `rasse` verweist (einer
pro bisheriger Gruppe, `id`s wie `gruppe_huete`). Echte, einzeln benannte
Rassen kommen später als zusätzliche Wahlmöglichkeiten dazu, ohne dass sich
an dieser Schreib-Logik etwas ändert (`hund_rasse` unterstützt schon jetzt
mehrere Zeilen pro Hund). Geschlecht/Kastration bekommen zwei neue, kleine
Felder in `Step1Dog.tsx`.

## Beispiele

1. **Ein Hund, eine Rasse (heutiger Normalfall).**
   `hund_rasse` hat eine Zeile: `{rasse_id: 'gruppe_huete', gewichtung:
   null}`. `resolveBreedGroups` liefert `{herding: 1}` — `scoreActivities`
   verhält sich exakt wie vorher mit `breedGroup: 'herding'`.

2. **Mischling, zwei bekannte Rassen, keine Gewichtung gepflegt.**
   `hund_rasse` hat zwei Zeilen mit `gewichtung: null` für die Rassen X
   (Gruppe `herding`) und Y (Gruppe `hunting`). `resolveBreedGroups`
   liefert `{herding: 0.5, hunting: 0.5}` — eine Aktivität mit
   `suitability = {herding: 2, hunting: -1}` bekommt einen
   Eignungs-Score von `2 * 0.5 + (-1) * 0.5 = 0.5`.

3. **Mischling mit bekanntem Anteil.**
   Dieselben zwei Zeilen, aber `gewichtung: 3` für X und `gewichtung: 1`
   für Y (macht das Verhältnis 3:1 explizit, die absoluten Zahlen sind
   egal, nur das Verhältnis zählt). `resolveBreedGroups` liefert
   `{herding: 0.75, hunting: 0.25}`.

4. **Geschlecht/Kastration unbekannt.**
   `hund.geschlecht = null`, `hund.kastriert = null` (z. B. Tierschutzhund
   ohne Papiere) — `dogFromRow` liefert `gender: null, neutered: null`,
   kein Fehler.

## Nicht dazu gehört

- Echte, einzeln benannte Rassen zu befüllen (Labrador, Border Collie, …)
  — das ist Fachwissen über korrekte Rassegruppen-Zuordnung, nicht
  Engineering-Arbeit. Nur die neun Gruppen-Platzhalter werden geseedet,
  damit das Onboarding weiterläuft.
- Eine Rasse-Auswahl-UI (Suche/Autocomplete über hunderte Rassen) im
  Onboarding zu bauen. Die Chip-Auswahl bleibt, bis echte Rassen als
  Content existieren UND jemand entscheidet, wie eine Suche über
  hunderte Einträge aussehen soll.
- `groessenklasse`/`koerperbau` in die `rasse`-Tabelle zu verschieben —
  s. „Warum".
- Geschlecht/Kastration in irgendeine Planer-Regel einfließen zu lassen
  (z. B. Läufigkeit, OP-Erholung als `Restriction`) — reine Datenerfassung
  für später, `restrictions` (`rekonvaleszenz`) deckt akute
  Nachsorge-Fälle schon ab, unabhängig vom Kastrationsstatus.

## Offene Fragen

Keine — alle Designentscheidungen (Gewichtung nullable mit
Gleichverteilung als Default, `groessenklasse`/`koerperbau` bleiben am
Hund, keine echten Rassen jetzt) sind mit dem Nutzer geklärt.
