# Zuweisen (Planer, Schritt 6)

*Hinweis: Diese Spec bleibt Deutsch (CLAUDE.md, Abschnitt Sprache). Die
Codebeispiele nennen die tatsächlichen Bezeichner aus
`infra/supabase/functions/_shared/planner/` (TypeScript).*

## Warum

Schritt 5 liefert eine sortierte, bewertete Liste von Aktivitäten — aber
noch keinen Wochenplan. Schritt 6 verteilt sie Tag für Tag, unter
Beachtung der Belastungsregeln (`docs/datenmodell.md`, Abschnitt „Der
Planer", Schritt 6): **ein Slot pro Tag, der leer sein darf**, nie zwei
harte Tage in Folge, anspruchsvolle Einheiten nicht auf den kürzesten Tag.

## Verhalten

Reine Funktion, kein Zeitzugriff. Welcher Tag „Trainingstag" ist und wie
groß sein Zeitbudget ist, löst der Aufrufer aus `Household` auf (analog zu
den vorherigen Schritten) — diese Funktion bekommt beides fertig herein.

```typescript
function assignToDays(args: {
  days: PeriodDay[];          // chronologisch, ein Eintrag pro Periodentag
  pool: ScoredActivity[];     // aus scoreActivities, absteigend sortiert
  config: AssignmentConfig;
}): DayAssignment[]
```

`PeriodDay` = `{date, isTrainingDay, timeBudgetMinutes}`. `DayAssignment` =
`{date, activityId}` — `activityId === null` heißt bewusst leer.
`AssignmentConfig`:

- `maxActiveSlots` — `phasen[lebensphase].aktive_slots`
- `maxTrainingSlots` — `phasen[lebensphase].training`
- `minEmptySlots` — 1, oder 2 bei `erholungsbedarf: hoch`
  (`perioden.leere_slots_min` / `leere_slots_bei_erholungsbedarf_hoch`);
  vom Aufrufer aufgelöst, da diese Funktion `RecoveryNeed` nicht kennt
- `heavyArousalThreshold` — `belastungsregeln.nach_belastung_ab` (2):
  sowohl „danach nur Ruhe/Beschäftigung" als auch „nicht auf den
  kürzesten Tag" hängen an derselben Schwelle „das war anstrengend"
- `maxArousalThreshold` — `belastungsregeln.nie_zwei_tage_in_folge_
  belastung` (3): Belastung, ab der ein Tag als „maximal" zählt

### Ablauf

Die Tage werden **chronologisch** einmal durchlaufen, mit drei
mitgeführten Zuständen: bereits vergebene Aktivitäts-IDs (jede Aktivität
höchstens einmal pro Periode), Anzahl belegter Slots, Anzahl
Trainingsslots, und die Belastung des Vortags.

`assignableCap = min(maxActiveSlots, Periodenlänge − minEmptySlots)` —
sind bereits so viele Tage belegt, bleiben alle weiteren Tage leer, egal
wie gut ein Kandidat noch passt. Das garantiert `minEmptySlots`, ohne dass
diese Funktion weiß, warum.

Für jeden Tag, solange `assignableCap` noch nicht erreicht ist, wird die
**erste** Aktivität aus `pool` gewählt (also die bestbewertete zuerst),
die **alle** zutreffenden Regeln erfüllt:

1. noch nicht in dieser Periode verwendet
2. `type === 'training'` ⇒ `isTrainingDay === true` **und** noch nicht
   `maxTrainingSlots` Trainingsslots vergeben
3. `durationMin ≤ timeBudgetMinutes` des Tages
4. **Kürzester Tag**: Aktivitäten mit `arousal ≥ heavyArousalThreshold`
   werden nicht auf den kürzesten Tag der Periode gelegt — **nur, wenn
   die Tage sich überhaupt in der Dauer unterscheiden.** Haben alle Tage
   dasselbe Zeitbudget, entfällt die Regel (es gibt dann keinen
   „kürzesten" Tag im gemeinten Sinn).
5. **Nach Belastung nur Ruhe/Beschäftigung**: war der Vortag belegt mit
   `arousal ≥ heavyArousalThreshold`, sind heute nur `type ∈ {rest,
   enrichment}` zulässig.
6. **Nie zwei harte Tage in Folge**: war der Vortag belegt mit
   `arousal ≥ maxArousalThreshold`, darf die heutige Aktivität nicht
   ebenfalls `arousal ≥ maxArousalThreshold` haben.
7. **Tag 1 ist nie ein Ruhetag — außer es gibt wirklich nichts anderes**:
   für den ersten Tag der Periode (Index 0) scheidet `type === 'rest'`
   zunächst aus, unabhängig vom Score. Eine neue Periode (erst recht die
   allererste, direkt nach dem Onboarding) soll sichtbar mit etwas
   beginnen, nicht mit „heute ist nichts". Das ist eine Präferenz, keine
   absolute Regel: Findet sich unter Ausschluss von `rest` **gar kein**
   Kandidat für Tag 1 (z. B. weil Tag 1 kein Trainingstag ist und alles
   andere im Pool `training` ist), wird ein zweiter Durchlauf ohne den
   Ausschluss versucht — ein passender Ruhetag schlägt einen leeren Tag 1
   immer noch. Gilt nur für Tag 1; ab Tag 2 ist `rest` von Anfang an ein
   normaler Kandidat.

Findet sich keine passende Aktivität (oder ist `assignableCap` erreicht),
bleibt der Tag leer. Ein leerer Tag setzt die Belastung des Vortags für
die Folgetage auf 0 zurück — nach einer bewussten Pause ist die nächste
Einheit wieder uneingeschränkt möglich.

## Beispiele

`{maxActiveSlots: 5, maxTrainingSlots: 3, minEmptySlots: 1,
heavyArousalThreshold: 2, maxArousalThreshold: 3}`, sofern nicht anders
angegeben. Aktivitäten sind der Kürze halber als `(id, type, arousal,
durationMin)` angegeben, `pool` bereits nach Score absteigend sortiert.

Beispiele 5 und 6 zeigen eine Regel isoliert an einer kurzen,
zweitägigen Sequenz und setzen dafür `minEmptySlots: 0` — sonst würde
`assignableCap` bei nur zwei Tagen bereits den ersten Tag verbrauchen und
die eigentlich geprüfte Regel gar nicht mehr zeigen können.

1. **Grundfall — die besten Aktivitäten zuerst, Rest bleibt leer.**
   7 Tage, alle `isTrainingDay: true`, `timeBudgetMinutes: 30`. Pool:
   `[(a, enrichment, 1, 10), (b, enrichment, 1, 10), (c, enrichment, 1,
   10), (d, enrichment, 1, 10)]`.
   `assignableCap = min(5, 7 − 1) = 5`, aber nur 4 Aktivitäten vorhanden
   → Tag 1–4 bekommen `a, b, c, d`, Tag 5–7 bleiben leer (keine
   Kandidaten mehr).

2. **Training nur an Trainingstagen — die Aktivität wartet, statt zu
   verfallen.**
   Tag 1: `isTrainingDay: false`. Tag 2: `isTrainingDay: true`. Pool:
   `[(recall, training, 1, 10)]`, beide Tage `timeBudgetMinutes: 30`.
   Ausgabe: Tag 1 leer, Tag 2 bekommt `recall` — dieselbe Aktivität wird
   nicht verworfen, nur weil der erste Tag nicht passt.

3. **Obergrenze Trainingsslots.**
   3 Trainingstage, Pool: vier Trainingsaktivitäten mit `arousal: 1,
   durationMin: 10`, `maxTrainingSlots: 3`... aus Grundfall-Config aber
   hier direkt mit `maxTrainingSlots: 2` konfiguriert. Ausgabe: nur die
   ersten zwei (nach Score) werden zugewiesen, der dritte Trainingstag
   bleibt leer, obwohl noch eine passende Trainingsaktivität im Pool
   wäre — die Obergrenze ist erreicht.

4. **Zeitbudget.** (`minEmptySlots: 0`)
   Ein Tag mit `timeBudgetMinutes: 5`. Pool: `[(long, enrichment, 1,
   durationMin: 15), (short, enrichment, 1, durationMin: 5)]`. Ausgabe:
   `long` wird übersprungen (passt nicht), `short` wird zugewiesen.

5. **Nach Belastung nur Ruhe/Beschäftigung.** (`minEmptySlots: 0`)
   Tag 1 bekommt eine Aktivität mit `arousal: 2` (≥
   `heavyArousalThreshold`). Pool für Tag 2: `[(training-hard, training,
   2, 10), (rest-easy, rest, 0, 10)]`, Tag 2 ist Trainingstag. Ausgabe:
   Tag 2 bekommt `rest-easy` — `training-hard` wird übersprungen, obwohl
   es besser bewertet sein könnte, weil Tag 1 bereits ≥ 2 war.

6. **Nie zwei maximale Tage in Folge.** (`minEmptySlots: 0`)
   Tag 1 bekommt eine Aktivität mit `arousal: 3`. Pool für Tag 2 (Typen
   `rest`/`enrichment`, damit Regel 5 kein Hindernis ist): `[(also-max,
   enrichment, 3, 10), (moderate, enrichment, 2, 10)]`. Ausgabe: Tag 2
   bekommt `moderate` — `also-max` wird übersprungen (Vortag war bereits
   3).

7. **Kürzester Tag, nur bei echtem Unterschied.**
   7a. Tag 1: `timeBudgetMinutes: 10` (kürzester), Tag 2:
   `timeBudgetMinutes: 60`. Pool: `[(hard, enrichment, 2, 10)]`
   (`arousal ≥ heavyArousalThreshold`, passt zeitlich auf beide Tage).
   Ausgabe: Tag 1 bleibt leer (kürzester Tag, `hard` ist anspruchsvoll),
   Tag 2 bekommt `hard`.
   7b. Gleiches Beispiel, aber alle Tage `timeBudgetMinutes: 10`.
   Ausgabe: Tag 1 bekommt `hard` — ohne echten Unterschied im Zeitbudget
   gibt es keinen „kürzesten Tag" im gemeinten Sinn, die Regel entfällt.

8. **`minEmptySlots` wird respektiert, auch wenn Kandidaten reichen
   würden.**
   3 Tage, `minEmptySlots: 1`, `maxActiveSlots: 5` (kein Engpass dort).
   Pool: drei passende, unterschiedliche Aktivitäten. `assignableCap =
   min(5, 3 − 1) = 2`. Ausgabe: Tag 1 und 2 werden belegt, Tag 3 bleibt
   leer — obwohl eine dritte passende Aktivität im Pool wäre.

9. **Jede Aktivität höchstens einmal pro Periode.**
   Pool enthält nur eine Aktivität. Zwei Tage stehen offen. Ausgabe: Der
   erste Tag bekommt sie, der zweite bleibt leer — die Aktivität wird
   nicht am zweiten Tag wiederholt.

10. **Tag 1 ist nie ein Ruhetag, außer nichts anderes passt.** (`minEmptySlots: 0`)
    Pool: `[(rest-best, rest, 1, 10), (enrichment-second, enrichment, 1,
    10)]`, `rest-best` bewertet höher. Ausgabe: Tag 1 bekommt
    `enrichment-second`, obwohl `rest-best` besser bewertet war — die
    Regel schlägt den Score. Enthält der Pool dagegen **nur**
    `rest-best`, bekommt Tag 1 trotzdem `rest-best` — ein passender
    Ruhetag ist besser als ein leerer Tag 1. Ab Tag 2 gilt die
    Bevorzugung nicht mehr, `rest` ist von Anfang an zulässig.

## Nicht dazu gehört

- Wie `isTrainingDay` und `timeBudgetMinutes` aus `Household` und dem
  Kalenderdatum aufgelöst werden — Aufgabe des Aufrufers.
- Die Begründung (`Reason`) je Slot — das bleibt Schritt 8 („Texten"):
  diese Funktion liefert nur `activityId`, keine `Slot`-Objekte mit
  Begründung. Ein `Reason` ohne belastbare Herleitung (z. B. bei einer
  Aktivität, die weder überfällig noch priorisiert noch bedarfsdeckend
  ist, sondern einfach am besten passte) wäre erfunden.
- Schritt 7 (Gegenprüfen: Bedarfsabdeckung, Trainingsobergrenze über die
  ganze Periode, „sonst schwächsten Slot tauschen") — diese Funktion
  prüft das Ergebnis nicht nach, sie erzeugt nur einen ersten Durchlauf.
- Wie leere Tage über die Woche verteilt sind — siehe „Offene Fragen".

## Offene Fragen

- Diese Implementierung füllt Tage chronologisch von vorne, bis
  `assignableCap` erreicht ist; leere Tage sammeln sich dadurch eher am
  Ende der Periode statt über die Woche verteilt zu sein. Ob das „wie ein
  guter Plan" liest, prüft der Simulator
  (`deno run infra/supabase/functions/_shared/planner/simulate.ts`),
  sobald er steht — nicht diese Spec. Eine Verteilungsheuristik ohne
  Beleg aus dem Simulator wäre eine erfundene Verfeinerung.
