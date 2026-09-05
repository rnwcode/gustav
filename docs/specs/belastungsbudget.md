# Belastungsbudget

*Hinweis: Diese Spec bleibt Deutsch (CLAUDE.md, Abschnitt Sprache). Die
Codebeispiele nennen die tatsächlichen Bezeichner aus
`infra/supabase/functions/_shared/planner/` (TypeScript).*

## Warum

„Belastung ist eine Bilanz, kein Häkchen" (`docs/datenmodell.md`, Abschnitt
„Fünf Entscheidungen"). Der Planer muss vor jeder Periode wissen, wie
ausgelastet ein Hund gerade ist — sonst kann Schritt 5 (Scoren) die
Belastung nicht gegen die Priorität aufwiegen, und Schritt 2 (Slots
festlegen) weiß nicht, ob ein zweiter leerer Tag nötig ist. Ein überdrehter
Hund bekommt keine Trainingseinheit, egal was der Halter sich vorgenommen
hat (`docs/produkt.md`, Abschnitt Produkthaltung) — das Belastungsbudget ist
die Zahl, an der das hängt.

## Verhalten

Reine Funktion, kein Zeitzugriff — die sieben Tageslasten kommen fertig
berechnet herein; wie sie aus `Slot` + `Activity` + `Outcome` entstehen, ist
nicht Teil dieser Funktion (siehe „Nicht dazu gehört").

```typescript
function evaluateLoadBudget(args: {
  loadOverLastSevenDays: number[];  // genau 7, ältester Tag zuerst
  lifeStage: LifeStage;
  restrictions: Set<Restriction>;
  config: LoadBudgetConfig;
}): LoadBudget
```

1. **Tageskapazität**: `config.capacityPerDay[lifeStage]`, danach für jede
   in `restrictions` vorhandene Einschränkung, die in
   `config.restrictionCap` einen Wert hat, auf das Minimum gedeckelt. Eine
   Einschränkung ohne Eintrag in `restrictionCap` (z. B. `jointIssues`,
   `senior`) verändert die Kapazität hier nicht — sie wirkt an anderer
   Stelle im Planer (Filter, Schritt 4).
2. **Quote**: `Summe(loadOverLastSevenDays) / 7 / Tageskapazität`.
3. **Erholungsbedarf**:
   - Quote ≥ `config.recoveryNeedHighFrom` → `RecoveryNeed.high`
   - sonst Quote ≥ `config.recoveryNeedMediumFrom` → `RecoveryNeed.medium`
   - sonst → `RecoveryNeed.none`
   Beide Schwellen sind inklusiv („ab").

`LoadBudget` trägt `quote` (double) und `recoveryNeed` (RecoveryNeed).

## Beispiele

Die ersten vier nutzen die echten Werte aus `content/planer.yaml`:
`capacityPerDay` (`belastbarkeit_pro_tag`) `{puppy: 1.0, adolescent: 1.6,
puberty: 1.8, adult: 2.0, senior: 1.4}`, `restrictionCap`
(`einschraenkung_deckel`) `{recovery: 0.6, protectiveCare: 1.0}`,
`recoveryNeedMediumFrom` (`mittel_ab_quote`) `0.7`, `recoveryNeedHighFrom`
(`hoch_ab_quote`) `1.0`.

1. **Normal ausgelasteter erwachsener Hund → kein erhöhter Erholungsbedarf.**
   Eingabe: `lifeStage: adult` (Kapazität 2.0), keine Restrictions,
   Tageslasten `[1, 1, 1, 1, 1, 1, 3]` (Summe 9).
   Quote `9 / 7 / 2.0 = 0.643`. Ausgabe: `recoveryNeed: none`.

2. **Mittlerer Erholungsbedarf.**
   Eingabe: wie oben, Tageslasten `[2, 1, 1, 2, 1, 1, 2]` (Summe 10).
   Quote `10 / 7 / 2.0 = 0.714`. Ausgabe: `recoveryNeed: medium` (≥ 0.7).

3. **Voll ausgelastet → hoher Erholungsbedarf.**
   Eingabe: wie oben, Tageslasten `[2, 2, 2, 2, 2, 2, 2]` (Summe 14).
   Quote `14 / 7 / 2.0 = 1.0`. Ausgabe: `recoveryNeed: high` (≥ 1.0, die
   Schwelle ist inklusiv).

4. **Einschränkung senkt die Kapazität und damit die Quote-Klasse.**
   Eingabe: `lifeStage: adult` (Basis 2.0), `restrictions: {recovery}`
   (Rekonvaleszenz, Deckel 0.6 → Kapazität `min(2.0, 0.6) = 0.6`),
   Tageslasten `[1, 0, 1, 0, 1, 0, 0]` (Summe 3).
   Quote `3 / 7 / 0.6 = 0.714`. Ausgabe: `recoveryNeed: medium`. Ohne die
   Einschränkung wäre dieselbe Summe bei Kapazität 2.0 nur `0.214`
   (`none`) — die Einschränkung ist hier der entscheidende Faktor.

5. **Schwellen sind inklusiv (Grenzfall mit eigens gewählten, einfachen
   Zahlen, nicht aus `content/planer.yaml`).**
   Eingabe: `LoadBudgetConfig` mit `capacityPerDay: {adult: 2.0}`,
   `recoveryNeedMediumFrom: 0.5`, `recoveryNeedHighFrom: 1.0`, keine
   Restrictions, Tageslasten `[1, 1, 1, 1, 1, 1, 1]` (Summe 7).
   Quote `7 / 7 / 2.0 = 0.5` — exakt auf der Schwelle. Ausgabe:
   `recoveryNeed: medium`. Zeigt, dass „ab" als `>=` und nicht `>`
   ausgewertet wird.

## Nicht dazu gehört

- Wie die sieben Tageslasten aus `Slot`, `Activity.arousal` und `Outcome`
  entstehen (nur `succeeded`/`partial` zählen, `skipped`/`notCompleted`
  tragen 0 bei — `docs/datenmodell.md`, Tabelle „Das Budget speist sich
  ohne Logbuch") — das ist Aufgabe des Aufrufers (Planer, Schritt 1).
- Die Verwendung von `recoveryNeed` im Scoring (Planer, Schritt 5,
  Gewicht `belastung_bei_erholungsbedarf`) oder bei der Anzahl leerer
  Slots (Schritt 2) — diese Funktion liefert nur die Bilanz.
- Wetter- oder Saisoneinfluss auf die Kapazität.

## Offene Fragen

- Tage ganz ohne Slot (Periode kürzer als 7 Tage, z. B. Mittwochsstart)
  tragen hier `0` bei, wie ein übersprungener Tag. Richtig so, oder sollte
  ein Periodenstart die Quote auf einen kürzeren Zeitraum normieren? Für
  den MVP: `0`, der erste Periodenwechsel ist ohnehin die Ausnahme.
