# Kandidaten sammeln (Planer, Schritt 3)

*Hinweis: Diese Spec bleibt Deutsch (CLAUDE.md, Abschnitt Sprache). Die
Codebeispiele nennen die tatsächlichen Bezeichner aus
`infra/supabase/functions/_shared/planner/` (TypeScript).*

## Warum

Bevor der Planer etwas zuweisen kann, muss er wissen, welche Skills und
Bedarfsdimensionen diese Periode überhaupt „im Rennen" sind
(`docs/datenmodell.md`, Abschnitt „Der Planer", Schritt 3). Das ist
getrennt vom Filtern (Schritt 4, arbeitet auf Aktivitäten) und vom Scoren
(Schritt 5, gewichtet die hier gesammelten Rohsignale) — diese Funktion
sammelt nur, sie bewertet nicht.

## Verhalten

Reine Funktion, kein Zeitzugriff — `periodEnd` kommt als Parameter herein.
`skillStates` enthält nur bereits begonnene Skills (ein Skill ohne Eintrag
gilt als nicht begonnen); die Auflösung von Bedarfsdeckung aus der
Vorperiode (`needCoverageLastPeriod`) ist Aufgabe des Aufrufers, nicht
dieser Funktion.

```typescript
function collectCandidates(args: {
  skillStates: Map<string, SkillState>;
  catalog: Skill[];
  dogAgeWeeks: number;
  priorities: Priority[];       // aus WeeklyContext.priorities
  periodEnd: Date;
  needCoverageLastPeriod: Map<NeedDimension, number>;
  config: CandidateConfig;      // needTargets aus bedarf_ziel
}): CandidatePool
```

`CandidatePool` trägt zwei Listen:

- `skills: SkillFocus[]` — `{skillId, levels, priority (0–3),
  overdueDays (≥0), isNewSkill}`. Ein Skill erscheint höchstens einmal;
  Signale aus mehreren Quellen werden in einem Eintrag zusammengeführt.
- `needs: NeedFocus[]` — `{dimension, gap (>0)}`. Nur Dimensionen mit
  einer echten Lücke werden aufgenommen.

### Skills (a, b, d aus `docs/datenmodell.md`)

1. **Fällige Auffrischungen (a)**: jeder Eintrag in `skillStates` mit
   `dueAt !== null`, `dueAt <= periodEnd` und Status ungleich `dormant`.
   `overdueDays` = Tage zwischen `dueAt` und `periodEnd` (≥ 0, da nur
   fällige Skills überhaupt betrachtet werden).
2. **Prioritäten aus dem Check-in (b)**: jeder Eintrag in `priorities`,
   dessen `skillIdOrTopic` einem Schlüssel in `skillStates` entspricht —
   „Skill auf aktueller Stufe" setzt voraus, dass der Skill bereits
   begonnen ist. Prioritäten, die keinem begonnenen Skill entsprechen
   (freie Themen wie „mehr Ruhe"), erzeugen hier keinen `SkillFocus` (siehe
   „Nicht dazu gehört").
3. **Neue Skills (d)**: jeder Skill aus `catalog`, der **nicht** in
   `skillStates` vorkommt, dessen `minAgeWeeks` ≤ `dogAgeWeeks` ist, und
   dessen sämtliche `prerequisites` in `skillStates` mindestens
   `generalizing` erreicht haben (`generalizing`, `consolidated` oder
   `maintenance` zählen; hat `skillStates` keinen Eintrag für eine
   Voraussetzung, ist sie nicht erfüllt). `levels` ist `{0, 0, 0}`,
   `priority` und `overdueDays` sind 0.

Ein Skill kann gleichzeitig fällig und priorisiert sein (1 und 2) — dann
trägt sein `SkillFocus` beide Signale. Ein neuer Skill (3) kann nicht
gleichzeitig fällig oder priorisiert sein, weil er per Definition nicht in
`skillStates` vorkommt.

### Bedarf (c aus `docs/datenmodell.md`)

Für jede `NeedDimension`: `gap = needTargets[dimension] -
needCoverageLastPeriod[dimension]` (fehlt die Dimension in
`needCoverageLastPeriod`, gilt 0 als Deckung). Nur Dimensionen mit
`gap > 0` werden in `needs` aufgenommen.

## Beispiele

1. **Fällige Auffrischung.**
   Eingabe: `skillStates = {rueckruf: {status: 'generalizing',
   levels: {1,3,2}, dueAt: 2026-03-10}}`, `catalog = [rueckruf]`,
   `priorities = []`, `periodEnd = 2026-03-12`.
   Ausgabe: `skills = [{skillId: 'rueckruf', levels: {1,3,2},
   priority: 0, overdueDays: 2, isNewSkill: false}]`.

2. **Priorität hebt einen nicht fälligen Skill ins Rennen.**
   Eingabe: `skillStates = {leash: {status: 'building',
   levels: {0,1,0}, dueAt: 2026-03-20}}` (nach `periodEnd`),
   `priorities = [{skillIdOrTopic: 'leash', weight: 3}]`, `periodEnd =
   2026-03-12`.
   Ausgabe: `skills = [{skillId: 'leash', levels: {0,1,0},
   priority: 3, overdueDays: 0, isNewSkill: false}]`.

3. **Fällig und priorisiert verschmelzen zu einem Eintrag.**
   Eingabe: `skillStates = {rueckruf: {status: 'generalizing',
   levels: {1,3,2}, dueAt: 2026-03-10}}`,
   `priorities = [{skillIdOrTopic: 'rueckruf', weight: 2}]`, `periodEnd =
   2026-03-12`.
   Ausgabe: genau ein `{skillId: 'rueckruf', levels: {1,3,2},
   priority: 2, overdueDays: 2, isNewSkill: false}` — nicht zwei Einträge.

4. **Neuer Skill nur mit erfüllter Voraussetzung und Alter.**
   Eingabe: `catalog = [{id: 'recall', prerequisites: ['name-focus'],
   minAgeWeeks: 9, …}]`, `dogAgeWeeks = 12`.
   4a. `skillStates = {'name-focus': {status: 'generalizing', …}}`
   → `recall` erscheint als `{isNewSkill: true, levels: {0,0,0},
   priority: 0, overdueDays: 0}`.
   4b. `skillStates = {'name-focus': {status: 'building', …}}`
   (unter `generalizing`) → `recall` erscheint **nicht**.
   4c. `skillStates = {}`, `dogAgeWeeks = 7` (unter `minAgeWeeks: 9`) →
   `recall` erscheint **nicht**, unabhängig von Voraussetzungen.

5. **Bedarfslücke.**
   Eingabe: `needTargets = {scent: 5, social: 3}`,
   `needCoverageLastPeriod = {scent: 2}` (social fehlt ganz).
   Ausgabe: `needs = [{dimension: 'scent', gap: 3}, {dimension: 'social',
   gap: 3}]` — beide Lücken werden erkannt, auch die durch komplett
   fehlende Erfassung.

## Nicht dazu gehört

- Prioritäten, deren `skillIdOrTopic` keinem begonnenen Skill entspricht
  (freie Themen) — die Übersetzung von Freitext/Themen in Skill- oder
  Bedarfssignale ist Aufgabe des vorgelagerten Übersetzers
  (`docs/datenmodell.md`, Backlog V1.2), nicht dieser Funktion.
- Die Auflösung von `needCoverageLastPeriod` aus der vorherigen
  `WeeklyPlan` (welche Slots welche `Activity.needs` beigetragen haben) —
  das bleibt Aufgabe des Aufrufers, analog zu `evaluateLoadBudget`
  (`docs/specs/belastungsbudget.md`).
- Filtern (Alter, Ausrüstung, Sperrfrist, Sicherheit) und Scoren — folgen
  als eigene Schritte (4 und 5) auf einem separaten `Activity`-Pool, der
  aus diesem `CandidatePool` erst noch gebildet wird.
- Zyklenfreiheit der Voraussetzungen sicherzustellen — das prüft der
  Content-Validator (`tool/validate.dart`), nicht der Planer zur Laufzeit.

## Offene Fragen

- Begrenzt diese Funktion die Anzahl neuer Skills pro Periode? Nein — das
  ist Aufgabe der Obergrenzen je Lebensphase (`phasen.training` in
  `content/planer.yaml`), die erst beim Zuweisen (Schritt 6) greifen. Hier
  werden bewusst alle in Frage kommenden neuen Skills gesammelt; zu viele
  Kandidaten sind unkritisch, weil Scoring und Zuweisung später auswählen.
