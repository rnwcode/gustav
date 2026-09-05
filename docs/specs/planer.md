# Der Planer (Orchestrator)

*Hinweis: Diese Spec bleibt Deutsch (CLAUDE.md, Abschnitt Sprache). Die
Codebeispiele nennen die tatsächlichen Bezeichner aus
`infra/supabase/functions/_shared/planner/` (TypeScript).*

## Warum

Die acht Schritte aus `docs/datenmodell.md`, Abschnitt „Der Planer", sind
einzeln spezifiziert, getestet und implementiert (`docs/specs/kontext-
bauen.md` bis `docs/specs/texten.md`) — aber niemand verbindet sie zu
einem `WeeklyPlan`. Ohne diese eine Funktion müsste jeder Aufrufer (der
Simulator, die spätere Edge Function) die Verdrahtung selbst nachbauen,
mit dem Risiko, einen Schritt zu vergessen oder in falscher Reihenfolge
aufzurufen.

## Verhalten

Reine Funktion, kein Zeitzugriff — `today` (zugleich der erste Tag der
neuen Periode) kommt als Parameter herein, wie überall im Planer.

```typescript
function plan(args: {
  dog: Dog;
  household: Household;
  weeklyContext: WeeklyContext;
  today: Date;
  loadOverLastSevenDays: number[];
  skillStates: Map<string, SkillState>;
  skillCatalog: Skill[];
  activityCatalog: Activity[];
  needCoverageLastPeriod: Map<NeedDimension, number>;
  lastUsedByVarianceGroup: Map<string, Date>;
  lastUsedByActivityId: Map<string, Date>;
  config: PlannerConfig;
}): WeeklyPlan
```

`PlannerConfig` bündelt genau die Config-Ausschnitte, die die acht
Schritte einzeln schon kennen (`LoadBudgetConfig`, `PeriodConfig`,
`CandidateConfig`, `ActivityFilterConfig`, `ScoringConfig`, dazu
`assignment: {heavyArousalThreshold, maxArousalThreshold}` aus
`belastungsregeln`, siehe `docs/specs/zuweisen.md`), plus `version` —
`content/planer.yaml`s eigenes `version`-Feld, das unverändert als
`configVersion` im Ergebnis landet.

Ruft die acht Schritte in genau der Reihenfolge aus `docs/datenmodell.md`
auf und reicht deren Ausgaben als Eingaben des nächsten Schritts durch:

1. `buildContext` — `today` und `dog`/`household`/`weeklyContext`
   hinein, `PlanningContext` heraus.
2. `buildPeriod` — `startDate: today`, `lifeStage`/`recoveryNeed` aus dem
   Kontext.
3. `collectCandidates` — `dogAgeWeeks` aus dem Kontext, `periodEnd` aus
   der Periode, `priorities` aus `weeklyContext`.
4. `filterActivities` — `coreSkillIds` wird **hier**, nicht vom Aufrufer,
   aus `skillCatalog` gebildet (`skill.isCoreSkill`) — eine vom Aufrufer
   separat übergebene Menge könnte vom Katalog abweichen.
5. `scoreActivities` — `breedGroup` aus `dog`, `recoveryNeed` aus dem
   Kontext.
6. `assignToDays` — `days` und die drei Obergrenzen aus der `Period`,
   `heavyArousalThreshold`/`maxArousalThreshold` aus
   `config.assignment`.
7. `crossCheckPeriod` — derselbe `pool` wie in Schritt 5/6,
   `maxTrainingSlots` aus der `Period`.
8. `buildSlots` — das Ergebnis aus Schritt 7, derselbe `pool`, dieselben
   `candidates` aus Schritt 3.

Das Ergebnis ist ein `WeeklyPlan`: `dogId: dog.id`, `periodStart: today`,
`periodEnd` aus der `Period`, `algorithmVersion` (eine in `plan.ts`
verdrahtete Konstante — Code-Version dieser Funktion, keine
Content-Config), `configVersion: config.version`, `slots` aus Schritt 8.

## Beispiele

Konfiguration durchgehend mit den echten Werten aus
`content/planer.yaml` (siehe die einzelnen Schritt-Specs für die
Herkunft jedes Werts), `version: 1`.

1. **Ein einzelner Kandidat, durchgängig verfolgt bis zum fertigen
   `WeeklyPlan`.**

   Eingabe: erwachsener Hund ohne Einschränkungen, `breedGroup:
   companion`, lange im Haushalt (Eingewöhnung längst vorbei),
   `household.planningDay: sunday`, `trainingDays: {monday}`,
   `weekdayTimeBudgetMinutes: 30`, `weekendTimeBudgetMinutes: 30`,
   `householdSize: 1`. `weeklyContext` ohne Prioritäten, Constraints oder
   Flags (`source: fallback`). `today`: ein Montag (2026-03-16, damit die
   Periode reguläre 7 Tage lang ist, siehe
   `docs/specs/slots-festlegen.md`). `loadOverLastSevenDays: [0,0,0,0,0,0,0]`
   → `recoveryNeed: none`. `skillStates: {}`, `skillCatalog: []` (keine
   Skills im Rennen). `activityCatalog`: genau eine Aktivität `sniff`
   (`type: enrichment`, `trainsSkill: null`, `needs: {scent: 3}`, sonst
   neutral/unbeschränkt). `needCoverageLastPeriod: {}` (alle fünf
   Dimensionen mit Lücke, `bedarf_ziel`: `{physical: 6, mentalWork: 6,
   scent: 5, social: 3, recovery: 6}`). Keine Historie
   (`lastUsedByVarianceGroup`/`lastUsedByActivityId: {}`).

   Durchlauf: `sniff` besteht den Filter (nichts davon greift), Score
   `6.0` (`needGapWeight 2.0 × needFor(sniff, scent) 3`, alle anderen
   Terme 0 — `sniff` ist der einzige Kandidat). `assignToDays` legt ihn
   auf Tag 1 (Montag); Tag 2–7 bleiben leer, weil `sniff` die einzige
   Aktivität im Pool ist und nicht zweimal vergeben wird. Gegenprüfung:
   vier der fünf Dimensionen (`physical`, `mentalWork`, `social`,
   `recovery`) sind unberührt — aber der Pool enthält keinen weiteren,
   noch nicht verwendeten Kandidaten, der sie decken könnte
   (`docs/specs/gegenpruefen.md`, Beispiel 2), also bleibt die Periode
   unverändert.

   Ausgabe: `WeeklyPlan` mit `periodStart: 2026-03-16`,
   `periodEnd: 2026-03-22`, `algorithmVersion` (Konstante),
   `configVersion: 1`, sieben `Slot`s — Tag 1 `{activityId: 'sniff',
   reason: {kind: 'needGap', skillId: null, needDimension: 'scent'}}`
   (`scent`-Ziel 5, Deckung 0 → größte, hier einzige Lücke), Tag 2–7
   `{activityId: null, reason: {kind: 'empty', …}}`. Zeigt zugleich
   ehrlich, dass eine dünn besetzte Aktivitätsliste zu einer Periode
   führt, die ihre eigene Bedarfsdeckung nicht vollständig erfüllt —
   kein Fehler dieser Funktion, sondern eine erwartbare Folge eines
   kleinen Katalogs (siehe `docs/specs/gegenpruefen.md`, „Nicht dazu
   gehört").

2. **`configVersion` folgt `config.version`, unabhängig vom Inhalt.**
   Dieselbe Eingabe wie oben, aber `config.version: 2` (z. B. nach einer
   Gewichtsänderung in `content/planer.yaml`, CLAUDE.md Regel 6).
   Ausgabe: identischer Plan, aber `configVersion: 2` — der Planer selbst
   liest `version` nur durch, er interpretiert die Zahl nicht.

## Nicht dazu gehört

- Wie `loadOverLastSevenDays`, `needCoverageLastPeriod`,
  `lastUsedByVarianceGroup` und `lastUsedByActivityId` aus vergangenen
  `WeeklyPlan`s aufgelöst werden — bleibt, wie bei jedem einzelnen
  Schritt schon festgehalten, Aufgabe des Aufrufers (Simulator oder
  Edge Function).
- Laden von `content/planer.yaml`, `content/skills/*.yaml`,
  `content/aktivitaeten/*.yaml` in `PlannerConfig`/`Skill[]`/
  `Activity[]` — das ist ein eigener Content-Loader, kein Teil dieser
  reinen Funktion.
- Speichern des `WeeklyPlan` — „ein Plan wird einmal erzeugt und
  gespeichert" (`docs/datenmodell.md`), aber das Speichern selbst ist
  Aufgabe der Edge Function, die IO dieser Funktion fernhält
  (CLAUDE.md, Regel 1).
- Mehrfaches Aufrufen von `crossCheckPeriod`, bis alle drei Prüfungen
  erfüllt sind — `docs/specs/gegenpruefen.md`, „Offene Fragen" hält das
  bewusst als Entscheidung des Orchestrators offen; dieser Orchestrator
  trifft sie hier: **ein** Aufruf, kein Wiederholen.

## Offene Fragen

- Siehe `docs/specs/gegenpruefen.md`: ob `plan()` `crossCheckPeriod`
  mehrfach aufrufen sollte, bleibt offen. Für den MVP ruft `plan()` es
  genau einmal auf — dieselbe „max 1 Durchlauf"-Lesart wie in Schritt 7
  selbst. Zeigt der Simulator systematisch unvollständige Perioden trotz
  ausreichendem Katalog, ist das ein Grund, das zu überdenken.
