# Hart filtern (Planer, Schritt 4)

*Hinweis: Diese Spec bleibt Deutsch (CLAUDE.md, Abschnitt Sprache). Die
Codebeispiele nennen die tatsächlichen Bezeichner aus
`infra/supabase/functions/_shared/planner/` (TypeScript).*

## Warum

Schritt 3 sagt, welche Skills und Bedarfsdimensionen diese Periode im
Rennen sind. Schritt 4 sagt, welche `Activity`-Einträge aus dem Katalog
dafür überhaupt in Frage kommen — Alter, Ausrüstung, Sicherheit,
Sperrfrist. Erst danach kann Schritt 5 sinnvoll scoren: Scoren auf
ungeeigneten Aktivitäten wäre nur ein Umweg zum selben Fehler
(`docs/datenmodell.md`, Abschnitt „Der Planer").

## Verhalten

Reine Funktion, kein Zeitzugriff — `today` kommt als Parameter herein. Alle
Signale, die eine Historie voraussetzen (`lastUsedByVarianceGroup`), löst
der Aufrufer auf, nicht diese Funktion — analog zu `evaluateLoadBudget` und
`collectCandidates`.

```typescript
function filterActivities(args: {
  catalog: Activity[];
  candidates: CandidatePool;
  coreSkillIds: Set<string>;
  dogAgeWeeks: number;
  restrictions: Set<Restriction>;
  weeksSinceArrival: number;
  householdEquipment: string[];
  householdSize: number;
  allowedLocations: Location[];   // WeeklyContext.constraints.locations
  today: Date;
  lastUsedByVarianceGroup: Map<string, Date>;
  config: ActivityFilterConfig;
}): Activity[]
```

Eine Aktivität übersteht den Filter nur, wenn **alle** zutreffenden Regeln
erfüllt sind:

| # | Regel | Bedingung zum Ausschluss |
|---|---|---|
| 1 | Alter | `dogAgeWeeks < minAgeWeeks` oder (`maxAgeWeeks` gesetzt und `dogAgeWeeks > maxAgeWeeks`) |
| 2 | Kandidatenbindung | `trainsSkill !== null` und keine `SkillFocus` in `candidates.skills` mit dieser `skillId` — der Skill ist diese Periode nicht im Rennen |
| 3 | Ausrüstung | `equipment` enthält einen Eintrag, der nicht in `householdEquipment` steckt |
| 4 | Zweite Person | `secondPerson === true` und `householdSize < 2` |
| 5 | Einschränkung — Belastung | `restrictions` enthält einen Schlüssel aus `config.restrictionArousalCeiling` und `arousal >= restrictionArousalCeiling[Schlüssel]` |
| 6 | Einschränkung — Gelenke | `restrictions` enthält `jointIssues` und `jointStraining === true` |
| 7 | Sperrfrist der Varianzgruppe | `trainsSkill` ist **kein** Kernskill (`coreSkillIds`), `lastUsedByVarianceGroup[varianceGroup]` ist gesetzt, und `today.difference(lastUsedAt).inDays < cooldownDays` |
| 8 | Ort | `allowedLocations` ist nicht leer, `location !== 'any'`, und `location` steht nicht in `allowedLocations` |
| 9 | Saisonfenster | `seasonalWindow` ist gesetzt und der Monat von `today` (1–12) steht nicht darin |
| 10 | Eingewöhnung — Belastung | `weeksSinceArrival < config.settlingInWeeks` und `arousal > config.settlingInMaxArousal` |
| 11 | Eingewöhnung — Ablenkung | zusätzlich zu 10, bei `type === 'training'`: obere Grenze von `forDistraction` `> config.settlingInMaxDistraction` |
| 12 | Trainingsstufe | `type === 'training'`, `trainsSkill` ist im Rennen, und die aktuelle Ablenkungsstufe des `SkillFocus` liegt außerhalb von `forDistraction` (oder `forDistraction` fehlt) |
| 13 | Nur Auffrischung | der zugehörige `SkillFocus.status` ist `consolidated` oder `maintenance`, und `isRefresher === false` |

Regeln 2, 7, 12 und 13 brauchen den `SkillFocus`, der zu `trainsSkill`
gehört; sie greifen nicht bei `trainsSkill === null` (Beschäftigung).

## Beispiele

Basisaktivität (sofern nicht anders angegeben): `{minAgeWeeks: 8,
maxAgeWeeks: null, equipment: [], secondPerson: false, arousal: 1,
jointStraining: false, location: 'any', seasonalWindow: null,
varianceGroup: 'default', cooldownDays: 10, trainsSkill: null, type:
'enrichment', isRefresher: false}`. `ActivityFilterConfig` nutzt
`settlingInWeeks: 6, settlingInMaxArousal: 2, settlingInMaxDistraction: 1,
restrictionArousalCeiling: {protectiveCare: 2, recovery: 2}` — Werte aus
`content/planer.yaml` (`eingewoehnung_*`) bzw. direkt aus
`docs/datenmodell.md` (Schonung/Rekonvaleszenz schließt Belastung ≥ 2 aus).

1. **Unauffällige Aktivität besteht alle Regeln.**
   Eingabe: Basisaktivität, `dogAgeWeeks: 40`, keine Restrictions,
   `weeksSinceArrival: 52`, `householdEquipment: []`, `householdSize: 1`,
   `allowedLocations: []`. Ausgabe: Aktivität ist im Ergebnis enthalten.

2. **Zu jung fällt heraus.**
   Wie 1, aber `minAgeWeeks: 20`, `dogAgeWeeks: 12`. Ausgabe: nicht
   enthalten.

3. **Skill nicht im Rennen.**
   Aktivität mit `trainsSkill: 'sitz'`, `candidates.skills` enthält
   keinen Eintrag für `'sitz'`. Ausgabe: nicht enthalten — unabhängig
   davon, wie gut die Aktivität sonst passen würde.

4. **Fehlende Ausrüstung.**
   Aktivität mit `equipment: ['clicker']`, `householdEquipment: []`.
   Ausgabe: nicht enthalten. Mit `householdEquipment: ['clicker']`:
   enthalten.

5. **Einschränkung senkt die zulässige Belastung.**
   Aktivität mit `arousal: 2`, `restrictions: {protectiveCare}`. Ausgabe:
   nicht enthalten (`2 >= 2`). Mit `arousal: 1`: enthalten.

6. **Sperrfrist, mit Ausnahme für Kernskills.**
   Aktivität A: `trainsSkill: 'schnueffeln'` (kein Kernskill),
   `varianceGroup: 'nasenarbeit'`, `cooldownDays: 10`,
   `lastUsedByVarianceGroup: {'nasenarbeit': today - 3 Tage}`. Ausgabe: A
   nicht enthalten (3 < 10). Aktivität B: identisch, aber `trainsSkill:
   'rueckruf'` und `coreSkillIds: {'rueckruf'}`. Ausgabe: B enthalten —
   Kernskills sind von der Sperrfrist ausgenommen.

7. **Eingewöhnung deckelt Belastung und Ablenkung.**
   `weeksSinceArrival: 2` (< 6). Aktivität A: `arousal: 3`. Ausgabe: A
   nicht enthalten. Aktivität B: `type: 'training'`, `trainsSkill:
   'rueckruf'` im Rennen mit `SkillFocus.levels.distraction: 1`,
   `forDistraction: [0, 3]` (die obere Grenze 3 > `settlingInMaxDistraction
   1`). Ausgabe: B nicht enthalten, obwohl die aktuelle Stufe selbst
   innerhalb von `forDistraction` läge — die Eingewöhnungsgrenze ist
   strenger als die reguläre Trainingsstufen-Regel.

8. **Trainingsstufe muss die aktuelle Ablenkung enthalten.**
   `type: 'training'`, `trainsSkill: 'rueckruf'`, `SkillFocus.levels.
   distraction: 2`. Aktivität A: `forDistraction: [0, 1]`. Ausgabe: A
   nicht enthalten (2 liegt außerhalb). Aktivität B: `forDistraction: [2,
   4]`. Ausgabe: B enthalten.

9. **Gefestigter Skill lässt nur Auffrischung zu.**
   `SkillFocus.status: consolidated`. Aktivität A: `isRefresher: false`.
   Ausgabe: A nicht enthalten. Aktivität B: `isRefresher: true`. Ausgabe:
   B enthalten (sofern sonst zulässig).

## Nicht dazu gehört

- **Sicherheit (Hitze × Hitzeempfindlichkeit)** — aus
  `docs/datenmodell.md` explizit als harte Regel genannt, aber ohne
  Wetterdaten (Backlog V1.1: „Wetterprognose über PLZ") nicht umsetzbar.
  Kein Schwellenwert dafür existiert bislang in `content/planer.yaml`.
  Diese Funktion nimmt bewusst keinen Platzhalter-Schwellenwert an, um
  keine unbelegte fachliche Entscheidung zu treffen.
- Auflösung von `lastUsedByVarianceGroup` aus vergangenen `WeeklyPlan`s —
  Aufgabe des Aufrufers.
- Scoren der verbliebenen Aktivitäten (Schritt 5) und Zuweisung auf Tage
  (Schritt 6).
- Zyklenfreiheit und Vollständigkeit des Katalogs — Aufgabe von
  `tool/validate.dart`.

## Offene Fragen

- `restrictionArousalCeiling` und die Eingewöhnungswerte referenzieren
  Konzepte, die in `content/schema/planer.yaml` heute nur teilweise
  benannt sind (`eingewoehnung_max_ablenkung`,
  `eingewoehnung_max_belastung` existieren; ein Schlüssel für „Belastung
  ab X durch Einschränkung Y ausschließen" existiert noch nicht). Das ist
  eine Content-Schema-Entscheidung für `tool/`, kein Alleingang dieser
  Engine-Änderung (CLAUDE.md, Regel 6) — die Engine-Seite ist so gebaut,
  dass sie den Wert nur entgegennimmt, gleich woher er später kommt.
