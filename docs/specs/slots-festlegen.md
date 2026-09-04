# Slots festlegen (Planer, Schritt 2)

*Hinweis: Diese Spec bleibt Deutsch (CLAUDE.md, Abschnitt Sprache). Die
Codebeispiele nennen die tatsächlichen Bezeichner aus
`infra/supabase/functions/_shared/planner/` (TypeScript).*

## Warum

Schritt 6 (`assignToDays`, `docs/specs/zuweisen.md`) braucht fertige
`PeriodDay[]` und ein `AssignmentConfig` — aber woher die Periode ihre
Länge nimmt, welcher Tag Trainingstag ist und wie viele Slots je
Lebensphase überhaupt aktiv sein dürfen, war bislang nirgends festgelegt.
„Der Zyklus hängt am `planungstag` des Haushalts, nicht am Kalender"
(`content/planer.yaml`, Abschnitt „Perioden") — dieser Schritt löst genau
das auf, einmal, damit `assignToDays` es nicht wissen muss.

## Verhalten

Reine Funktion, kein Zeitzugriff — `startDate` (der erste Tag der neuen
Periode) kommt als Parameter herein.

```typescript
function buildPeriod(args: {
  startDate: Date;
  household: Household;
  lifeStage: LifeStage;
  recoveryNeed: RecoveryNeed;
  config: PeriodConfig;         // perioden, phasen aus content/planer.yaml
}): Period
```

`Period` trägt `days: PeriodDay[]` (chronologisch, `startDate` bis
`periodEnd` inklusive), `periodEnd: Date`, `minEmptySlots`,
`maxActiveSlots`, `maxTrainingSlots`.

### 1. Periodenlänge

`household.planningDay` ist der Tag, an dem der nächste Check-in
stattfindet — die Periode endet am Tag davor... nein: **die Periode endet
genau am `planningDay`** (der Check-in-Tag selbst zählt noch zur
auslaufenden Periode, `content/planer.yaml`: „Der Zyklus hängt am
planungstag"). Länge = Anzahl Tage von `startDate` bis zum nächsten
`planningDay`, beide Tage eingeschlossen:

```
distance = ((planningDayIndex − startWeekdayIndex + 7) % 7) + 1
length   = distance < config.firstPeriodMinDays
             ? distance + config.regularLengthDays
             : distance
```

(Indizes: Sonntag = 0 … Samstag = 6, wie `Date.getUTCDay()` — siehe
`weekdayOf` in `time.ts`.)

Im eingeschwungenen Zustand (jede Periode beginnt exakt am Tag nach
`planningDay`, weil die vorherige Periode exakt auf `planningDay` endete)
ergibt dieselbe Formel immer `config.regularLengthDays` (7) — es braucht
also **keine** Fallunterscheidung „erste Periode vs. spätere Periode",
die Formel trifft beides. Nur beim allerersten Start (Onboarding an einem
beliebigen Wochentag) oder nach einem geänderten `planningDay` weicht
`startWeekday` vom eingeschwungenen Wert ab und die `firstPeriodMinDays`-
Korrektur greift.

### 2. Tage der Periode

Für jeden Tag `d` von `startDate` bis `periodEnd`:
`isTrainingDay = household.trainingDays.has(weekdayOf(d))`,
`timeBudgetMinutes = weekdayOf(d) ∈ {saturday, sunday} ?
household.weekendTimeBudgetMinutes : household.weekdayTimeBudgetMinutes`.

### 3. Leere Slots

`minEmptySlots = recoveryNeed === 'high' ?
config.minEmptySlotsAtHighRecoveryNeed : config.minEmptySlots`
(`leere_slots_bei_erholungsbedarf_hoch` / `leere_slots_min`).

### 4. Obergrenzen je Lebensphase

`maxActiveSlots = config.maxActiveSlotsByLifeStage[lifeStage]`,
`maxTrainingSlots = config.maxTrainingSlotsByLifeStage[lifeStage]`
(`phasen[lebensphase].aktive_slots` / `.training`). Fehlt ein Eintrag für
die Lebensphase, wirft die Funktion — ein unvollständiges `PeriodConfig`
ist ein Konfigurationsfehler, kein Laufzeitfall.

## Beispiele

`config` durchgehend mit den echten Werten aus `content/planer.yaml`:
`regularLengthDays: 7` (`laenge_tage`), `firstPeriodMinDays: 5`
(`erste_periode_min_tage`), `minEmptySlots: 1` (`leere_slots_min`),
`minEmptySlotsAtHighRecoveryNeed: 2`
(`leere_slots_bei_erholungsbedarf_hoch`),
`maxActiveSlotsByLifeStage/maxTrainingSlotsByLifeStage` aus `phasen`
(`{puppy: {4, 2}, adolescent: {5, 3}, puberty: {6, 4}, adult: {6, 4},
senior: {5, 3}}`). `household.planningDay: sunday` (Standardwert), sofern
nicht anders angegeben.

1. **Mittwochsstart.** `startDate` ein Mittwoch. `distance = 5` (Mi, Do,
   Fr, Sa, So) — bereits ≥ `firstPeriodMinDays`, keine Korrektur.
   Ausgabe: `days.length: 5`, `periodEnd`: der folgende Sonntag.

2. **Samstagsstart — zu kurz, springt eine Woche weiter.**
   `startDate` ein Samstag. `distance = 2` (Sa, So) < 5 → `length = 2 + 7
   = 9`. Ausgabe: `days.length: 9`, `periodEnd`: der übernächste Sonntag
   — genau die zwei Werte, die `content/planer.yaml` in den Kommentaren
   zu `erste_periode_min_tage`/`erste_periode_max_tage` nennt.

3. **Eingeschwungener Zustand.** `startDate` ein Montag (der Tag nach
   `planningDay: sunday`). `distance = 7`, keine Korrektur nötig.
   Ausgabe: `days.length: 7` — jede reguläre Folgeperiode, ohne
   Sonderfall im Code.

4. **Trainingstage und Zeitbudget je Wochentag.**
   `household.trainingDays: {monday, wednesday, friday}`,
   `weekdayTimeBudgetMinutes: 20`, `weekendTimeBudgetMinutes: 45`,
   `startDate` ein Montag, Periode 7 Tage.
   Ausgabe: `days[0]` (Montag) `{isTrainingDay: true,
   timeBudgetMinutes: 20}`, `days[5]` (Samstag)
   `{isTrainingDay: false, timeBudgetMinutes: 45}`.

5. **Hoher Erholungsbedarf verdoppelt die leeren Slots.**
   `recoveryNeed: 'high'`. Ausgabe: `minEmptySlots: 2` statt 1 — alles
   andere wie Beispiel 3.

6. **Welpe bekommt engere Obergrenzen als ein erwachsener Hund.**
   `lifeStage: 'puppy'`. Ausgabe: `maxActiveSlots: 4, maxTrainingSlots:
   2`. Mit `lifeStage: 'adult'` bei sonst gleicher Eingabe: `maxActiveSlots:
   6, maxTrainingSlots: 4`.

## Nicht dazu gehört

- Die Zusammensetzung des vollständigen `AssignmentConfig` für Schritt 6 —
  `heavyArousalThreshold` und `maxArousalThreshold` sind statische Werte
  aus `belastungsregeln`, unabhängig von Periode oder Lebensphase; sie
  hinzuzufügen ist Aufgabe des Orchestrators (`plan()`), der `Period` mit
  ihnen zu einem `AssignmentConfig` zusammenführt.
- Woher `startDate` für die *nächste* Periode kommt, wenn ein Nutzer
  mehrere Wochen keinen Check-in macht („Wiedereinstieg", siehe
  `docs/datenmodell.md`, Test-Fixtures) — das ist eine Frage an den
  Aufrufer/Orchestrator, nicht an die reine Periodenlängen-Formel hier.
- Ob die Periodenlänge tatsächlich „wie ein guter Plan" liest — das prüft
  der Simulator, sobald er steht (analog zu `docs/specs/zuweisen.md`,
  Abschnitt „Offene Fragen").

## Offene Fragen

- **Die Formel kann `firstPeriodMaxDays` (10) überschreiten.** Für
  `planningDay: sunday` liefert `startWeekday: thursday` `distance = 4 <
  5`, also `length = 4 + 7 = 11` — einen Tag mehr, als
  `erste_periode_max_tage` in `content/planer.yaml` dokumentiert. Das
  betrifft ausschließlich eine einmalige, irreguläre erste Periode
  (Onboarding an einem Donnerstag, oder ein geänderter `planningDay`):
  im eingeschwungenen Zustand endet jede Periode exakt auf
  `planningDay`, also beginnt die nächste exakt einen Tag danach, und
  dieser Sonderfall kann nicht wiederkehren. Ein Deckel auf 10 würde die
  Periode entweder einen Tag vor `planningDay` enden lassen (verletzt
  „endet immer am planungstag") oder den überzähligen Tag verschlucken
  (erfundene Sonderregel ohne Beleg). Für den MVP: `erste_periode_max_tage`
  bleibt dokumentarisch, wird hier nicht durchgesetzt. Zeigt der Simulator,
  dass das in der Praxis stört, ist das ein Grund, die Konstante zu
  überdenken — nicht, sie stillschweigend zu erzwingen.
