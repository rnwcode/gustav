# Kontext bauen (Planer, Schritt 1)

*Hinweis: Diese Spec bleibt Deutsch (CLAUDE.md, Abschnitt Sprache). Die
Codebeispiele nennen die tatsächlichen Bezeichner aus
`infra/supabase/functions/_shared/planner/` (TypeScript).*

## Warum

Jeder spätere Schritt braucht dieselben abgeleiteten Werte — Lebensphase,
Hitzeempfindlichkeit, Wochen seit Einzug, Erholungsbedarf — und keiner von
ihnen soll sie sich selbst herleiten. Ohne einen Ort, an dem das einmal
passiert, würde `ageInWeeksAt`/`lifeStageAt` (und `today`) an fünf Stellen
im Aufrufer dupliziert, mit dem Risiko, dass zwei Schritte mit
unterschiedlichem `today` rechnen (`docs/datenmodell.md`, Abschnitt „Der
Planer", Schritt 1). `buildContext` bündelt das einmal.

## Verhalten

Reine Funktion, kein Zeitzugriff — `today` kommt als Parameter herein, wie
überall im Planer (CLAUDE.md, Regel 2). Reine Zusammensetzung: leitet nichts
neu her, was `dog_derivations.ts` oder `evaluateLoadBudget`
(`docs/specs/belastungsbudget.md`) nicht schon können, sondern ruft sie nur
mit denselben Eingaben auf und trägt das Ergebnis in einer Struktur
zusammen.

```typescript
function buildContext(args: {
  dog: Dog;
  household: Household;
  weeklyContext: WeeklyContext;
  today: Date;
  loadOverLastSevenDays: number[];  // siehe belastungsbudget.md — genau 7
  loadBudgetConfig: LoadBudgetConfig;
}): PlanningContext
```

1. **Hund-Ableitungen**: `ageWeeks = ageInWeeksAt(dog, today)`,
   `lifeStage = lifeStageAt(dog, today)`,
   `heatSensitivity = heatSensitivityAt(dog, today)`.
2. **Wochen seit Einzug**: `weeksSinceArrival = daysBetween(dog.arrivalDate,
   today) / 7`, abgerundet — dieselbe Rechnung wie `ageInWeeksAt`, nur auf
   `arrivalDate` statt `birthDate` (`docs/datenmodell.md`: „3 Jahre alt,
   seit 2 Wochen da = wie ein Welpe"). Nutzt `daysBetween` aus `time.ts`.
3. **Belastungsbudget**: `evaluateLoadBudget({loadOverLastSevenDays,
   lifeStage, restrictions: dog.restrictions, config: loadBudgetConfig})`.
4. **Durchreichen**: `dog`, `today`, `household` und `weeklyContext` landen
   unverändert in `PlanningContext` — sie werden hier nur gebündelt, nicht
   transformiert.

`PlanningContext` trägt `dog`, `today`, `ageWeeks`, `lifeStage`,
`heatSensitivity`, `weeksSinceArrival`, `household`, `weeklyContext` und
`loadBudget`.

## Beispiele

1. **Erwachsener Hund, normal ausgelastet.**
   Eingabe: `dog.birthDate` 3 Jahre vor `today`, `dog.arrivalDate` 2 Jahre
   vor `today`, `dog.restrictions = {}`, `today = 2026-03-12`,
   `loadOverLastSevenDays = [1, 1, 1, 1, 1, 1, 3]` (Summe 9),
   `loadBudgetConfig` wie in `docs/specs/belastungsbudget.md` (Beispiel 1).
   Ausgabe: `ageWeeks ≈ 156`, `lifeStage: adult`, `heatSensitivity: 0`,
   `weeksSinceArrival ≈ 104`, `loadBudget: {quote: 0.643,
   recoveryNeed: none}`. `household` und `weeklyContext` erscheinen
   unverändert im Ergebnis.

2. **Welpe, kurz nach Einzug — Lebensphase treibt die Kapazität.**
   Eingabe: `dog.birthDate` 10 Wochen vor `today`, `dog.arrivalDate` 10 Tage
   vor `today`, `today = 2026-03-12`, `loadOverLastSevenDays = [1, 0, 1, 0,
   0, 1, 0]` (Summe 3), `loadBudgetConfig.capacityPerDay.puppy = 1.0`.
   Ausgabe: `ageWeeks: 10`, `lifeStage: puppy`, `weeksSinceArrival: 1`
   (10 Tage abgerundet), `loadBudget.quote = 3 / 7 / 1.0 = 0.429`. Zeigt,
   dass die Lebensphase aus Schritt 1 (nicht `adult`) in die
   Kapazitätswahl des Belastungsbudgets einfließt — ein reiner
   Verdrahtungsfehler (falsches `lifeStage` durchgereicht) würde hier eine
   andere Kapazität und damit eine andere Quote ergeben.

3. **Einschränkung wirkt durch bis ins Ergebnis.**
   Eingabe: wie Beispiel 1, zusätzlich `dog.restrictions = {recovery}`,
   `loadBudgetConfig.restrictionCap.recovery = 0.6`,
   `loadOverLastSevenDays = [1, 0, 1, 0, 1, 0, 0]` (Summe 3).
   Ausgabe: `loadBudget.quote = 3 / 7 / 0.6 = 0.714`,
   `recoveryNeed: medium` — `dog.restrictions` muss aus `dog`, nicht separat
   übergeben werden, sonst würde die Einschränkung hier verloren gehen.

## Nicht dazu gehört

- Wie `loadOverLastSevenDays` aus vergangenen `Slot`/`Activity`/`Outcome`
  entsteht — bleibt Aufgabe des Aufrufers, wie schon in
  `docs/specs/belastungsbudget.md` festgehalten.
- Die Übersetzung von `WeeklyCheckin` in `WeeklyContext` (Chips/Freitext →
  Prioritäten, Constraints, Flags) — das ist ein vorgelagerter Schritt
  (Template im MVP, LLM später, `docs/datenmodell.md`, Backlog V1.2).
  `buildContext` nimmt `WeeklyContext` bereits übersetzt entgegen.
- Saison und Wetterprognose. `docs/datenmodell.md` nennt beides für
  Schritt 1, aber es existiert noch keine Datenquelle dafür (Backlog V1.1)
  und kein späterer Schritt liest ein Saisonfeld — anlegen, ohne dass ein
  Satz es braucht, widerspricht der eigenen Regel des Datenmodells („Wer
  ein Feld hinzufügen will, muss den Satz nennen"). Kommt mit der
  Wetteranbindung.
