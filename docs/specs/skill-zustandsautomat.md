# Skill-Zustandsautomat und Spaced Repetition

*Hinweis: Diese Spec ist Produktdokumentation und bleibt Deutsch
(CLAUDE.md, Abschnitt Sprache). Die Codebeispiele nennen die tatsächlichen
Bezeichner aus `infra/supabase/functions/_shared/planner/` (TypeScript).*

## Warum

Ein Skill ist kein Skalar (`docs/datenmodell.md`, Abschnitt „Fünf
Entscheidungen"). Nach jeder Bewertung muss der `SkillState` neu bestimmt
werden: welche der drei Dimensionen (Dauer, Distanz, Ablenkung) als Nächstes
steigt, wann die Übung wieder fällig ist, und ob der Status wechselt. Ohne
diese Funktion kann der Planer (Schritt 3, „fällige Auffrischungen") nicht
wissen, was als Nächstes dran ist.

## Verhalten

Zwei Funktionen, beide reine Funktionen ohne Zeitzugriff — `date` kommt als
Parameter herein.

```typescript
function apply(args: {
  state: SkillState;
  targetLevels: Levels;
  outcome: Outcome;       // nur succeeded | partial | notYet
  date: Date;
  config: StateMachineConfig;
}): SkillState

function reportProblem(args: {
  state: SkillState;
  targetLevels: Levels;
  config: StateMachineConfig;
}): SkillState
```

### Aktive Dimension

Genau eine Dimension ist zu jedem Zeitpunkt „aktiv" — diejenige, an der
gerade gearbeitet wird. Sie ist nicht gespeichert, sondern wird aus
`levels`, `targetLevels` und `config.order` (Dauer → Distanz → Ablenkung)
hergeleitet: die erste Dimension in dieser Reihenfolge, deren Stufe die
Zielstufe noch nicht erreicht hat. Haben alle drei ihre Zielstufe erreicht,
gilt die letzte Dimension der Reihenfolge (Ablenkung) als aktiv.

### `apply` — Verarbeitung einer Bewertung

1. **3× „succeeded" (klappte) auf der aktuellen Stufe** (gezählt an den
   zuletzt protokollierten Historieneinträgen mit identischen `levels`,
   „partial" (so halb) unterbricht die Zählung nicht): die aktive Dimension
   steigt um 1. Von den anderen beiden sinkt nur die, die ihre Zielstufe
   noch **nicht** erreicht hat, um 1 (Untergrenze 0) — eine bereits fertige
   Dimension wird nicht wieder zurückgesetzt. Das hält „Zielstufen erreicht"
   erreichbar.
2. **2× „notYet" (noch nicht) in Folge** auf der aktuellen Stufe: die
   aktive Dimension sinkt um 1 (Untergrenze 0). Erreicht sie dabei 0, fällt
   der Status auf `building` (aufbau) zurück.
3. **„partial" (so halb)**: Stufen unverändert — Wiederholung ohne
   Bewertungsdruck.
4. Danach, in dieser Reihenfolge:
   - Ablenkung der (neuen) Stufen ≥ `generalizeAtDistraction` **und**
     Status ist `building` → Status wird `generalizing` (generalisierung).
   - neue Stufen == `targetLevels` → Status wird `consolidated` (gefestigt).
5. **Intervall** (Spaced Repetition, unabhängig von einer Stufenänderung):
   - `succeeded`: `intervalDays = min((oldInterval * successFactor).round(), cap[newStatus])`
   - `notYet`: `intervalDays = start[newStatus]`
   - `partial`: unverändert
   - `lastPracticedAt = date`, `dueAt = date + intervalDays` — in allen
     drei Fällen, die Übung hat stattgefunden.
   - `start`/`cap` kommen aus `config.intervals[newStatus]`.
6. Der neue Historieneintrag `{date, outcome, levels: state.levels}` (die
   Stufe, **auf der** bewertet wurde, nicht die neue) wird angehängt; nur
   die letzten 10 Einträge bleiben.

### `reportProblem` — Rückmeldung im Check-in

Trigger ist ein Nutzerhinweis im Wochen-Check-in, keine tägliche Bewertung.
Gilt für `SkillState` in `maintenance` (erhaltung): Status fällt auf
`generalizing` zurück, die aktive Dimension sinkt um 1 (Untergrenze 0).
Intervall fällt auf `start[generalizing]`. Für jeden anderen Status ist der
Aufruf ein Programmierfehler (wirft) — das Problem-Melden ergibt nur Sinn,
wenn der Skill als eingespielt galt.

## Beispiele

Alle Beispiele nutzen den Skill „rueckruf" (`content/skills/rueckruf.yaml`
— Content-ID, bleibt Deutsch; Zielstufen `dauer: 1, distanz: 3,
ablenkung: 4`) und die Werte aus `content/planer.yaml`
(`erhoehen_nach_erfolgen: 3`, `senken_nach_misserfolgen: 2`,
`generalisierung_ab_ablenkung: 2`, `faktor_bei_erfolg: 1.8`,
`aufbau: {start: 1, deckel: 4}`, `generalisierung: {start: 3, deckel: 14}`,
`gefestigt: {start: 10, deckel: 45}`) — im Code als
`increaseAfterSuccesses`, `decreaseAfterFailures`,
`generalizeAtDistraction`, `successFactor` und `config.intervals[…]`
(`start`/`cap`).

1. **3× succeeded erhöht die aktive Dimension, senkt nur die unfertige.**
   Eingabe: Status `building`, Stufen `{duration: 1, distance: 1,
   distraction: 1}` (Dauer bereits auf Zielstufe), Intervall 2 Tage,
   Historie zwei `succeeded` auf dieser Stufe. Neues Ergebnis `succeeded`
   am 2026-03-10.
   Aktive Dimension: `distance` (1 < 3). Ausgabe: Stufen
   `{duration: 1, distance: 2, distraction: 0}` (Ablenkung ist die andere,
   noch unfertige Dimension und sinkt von 1 auf 0; Dauer bleibt, weil
   fertig). Intervall `round(2 × 1.8) = 4`, gedeckelt bei 4 → 4. `dueAt`
   2026-03-14. Status bleibt `building`.

2. **2× notYet in Folge senkt die aktive Dimension; bei 0 zurück auf
   building.**
   Eingabe: Status `generalizing`, Stufen `{duration: 1, distance: 3,
   distraction: 1}` (aktive Dimension `distraction`), Intervall 3 Tage,
   Historie ein `notYet` auf dieser Stufe. Neues Ergebnis `notYet` am
   2026-03-10.
   Ausgabe: Stufen `{duration: 1, distance: 3, distraction: 0}`. Ablenkung
   erreicht 0 → Status `building`. Intervall `start[building] = 1`.
   `dueAt` 2026-03-11.

3. **partial ändert weder Stufen noch Intervall.**
   Eingabe: Status `building`, Stufen `{duration: 0, distance: 0,
   distraction: 0}`, Intervall 1 Tag. Ergebnis `partial` am 2026-03-10.
   Ausgabe: Stufen unverändert, Intervall unverändert (1), Status
   unverändert. `lastPracticedAt` 2026-03-10, `dueAt` 2026-03-11.

4. **Ablenkung erreicht die Generalisierungsschwelle.**
   Eingabe: Status `building`, Stufen `{duration: 1, distance: 3,
   distraction: 1}` (Dauer und Distanz auf Zielstufe, aktive Dimension
   `distraction`), Intervall 1 Tag, Historie zwei `succeeded` auf dieser
   Stufe. Ergebnis `succeeded` am 2026-03-10.
   Ausgabe: Stufen `{duration: 1, distance: 3, distraction: 2}` (Dauer und
   Distanz bereits fertig, keine Absenkung). Ablenkung ≥ 2 und Status war
   `building` → Status `generalizing`. Intervall `round(1 × 1.8) = 2`,
   gedeckelt bei 14 (neuer Status) → 2.

5. **Zielstufen erreicht → consolidated.**
   Eingabe: Status `generalizing`, Stufen `{duration: 1, distance: 3,
   distraction: 3}` (aktive Dimension `distraction`), Intervall 10 Tage,
   Historie zwei `succeeded` auf dieser Stufe. Ergebnis `succeeded` am
   2026-03-10.
   Ausgabe: Stufen `{duration: 1, distance: 3, distraction: 4}` ==
   `targetLevels` → Status `consolidated`. Intervall
   `round(10 × 1.8) = 18`, gedeckelt bei 45 → 18.

6. **Problem im Check-in wirft maintenance auf generalizing zurück.**
   Eingabe: Status `maintenance`, Stufen `{duration: 1, distance: 3,
   distraction: 4}` (alle auf Zielstufe, aktive Dimension fällt auf die
   letzte der Reihenfolge zurück: `distraction`), Intervall 45 Tage.
   Aufruf `reportProblem`.
   Ausgabe: Stufen `{duration: 1, distance: 3, distraction: 3}`. Status
   `generalizing`. Intervall `start[generalizing] = 3`.

## Nicht dazu gehört

- Fällige Auffrischungen erkennen und in Kandidaten übersetzen (Planer,
  Schritt 3) — diese Funktion ändert nur einen einzelnen `SkillState`.
- `Outcome.skipped` und `Outcome.notCompleted` sind hier keine gültigen
  Eingaben für `apply` — sie beschreiben, ob ein Slot überhaupt
  stattgefunden hat (Belastungsbudget), nicht die Qualität einer
  Skill-Übung, und werden nicht auf `SkillState` verrechnet.
- Der Übergang von `consolidated` zu `maintenance` „danach automatisch"
  (`docs/datenmodell.md`) ist zeit- oder periodengetrieben, nicht
  Ergebnis-getrieben, und ist nicht Teil dieser Funktion.
- Laden von `content/planer.yaml` — `StateMachineConfig` wird
  hineingereicht (CLAUDE.md, Regel 10), das Parsen (YAML → Config) ist
  nicht Teil dieser Datei.

## Offene Fragen

- Ist die Rundung `round()` (kaufmännisch) für das Intervall die richtige
  Wahl, oder sollte auf ganze Tage aufgerundet werden, damit ein Intervall
  nie „zu früh" fällig wird? Für den MVP: `round()`, überprüfbar mit dem
  Simulator (`--check`), sobald er steht.
