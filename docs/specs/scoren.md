# Scoren (Planer, Schritt 5)

*Hinweis: Diese Spec bleibt Deutsch (CLAUDE.md, Abschnitt Sprache). Die
Codebeispiele nennen die tatsächlichen, englischen Bezeichner aus
`packages/engine`.*

## Warum

Schritt 4 liefert einen zulässigen `Activity`-Pool, aber noch keine
Reihenfolge. Schritt 6 (Zuweisen) muss wissen, welche Aktivität an einem
Tag die beste Wahl ist — dafür braucht jede Aktivität einen Score
(`docs/datenmodell.md`, Abschnitt „Der Planer", Schritt 5). Die Gewichte
sind eingestellt, nicht hergeleitet, und stehen in `content/planer.yaml`
(CLAUDE.md, Regel 6) — diese Funktion wertet sie nur aus.

## Verhalten

Reine Funktion, kein Zeitzugriff — `today` kommt als Parameter herein.
`recoveryNeed` (aus `evaluateLoadBudget`) und die Auflösung von „kürzlich
gemacht" pro Aktivität sind bereits fertige Eingaben, analog zu den
vorherigen Schritten.

```dart
List<ScoredActivity> scoreActivities({
  required List<Activity> pool,             // aus filterActivities
  required CandidatePool candidates,
  required BreedGroup breedGroup,
  required RecoveryNeed recoveryNeed,
  required Map<String, DateTime> lastUsedByActivityId,
  required DateTime today,
  required ScoringConfig config,
})
```

Für jede Aktivität in `pool`:

```
score =  config.priorityWeight        · priority
       + config.overdueWeight         · min(overdueDays / 7, config.overdueCap)
       + config.needGapWeight         · needGapScore
       + config.newSkillWeight        · (isNewSkill ? 1 : 0)
       + config.suitabilityWeight     · suitability
       + (recoveryNeed == none ? 0 : config.arousalAtRecoveryNeedWeight · arousal)
       + (recentlyDone ? config.recentlyDoneWeight : 0)
```

Herkunft der Terme, wenn `trainsSkill` einen `SkillFocus` in
`candidates.skills` trifft — sonst sind `priority`, `overdueDays` und
`isNewSkill` 0/`false`:

- `priority` = `SkillFocus.priority`
- `overdueDays` = `SkillFocus.overdueDays`
- `isNewSkill` = `SkillFocus.isNewSkill`

Unabhängig von einem Skill:

- `needGapScore` = Summe von `activity.needs[dimension]` über alle
  `dimension`, für die `candidates.needs` eine Lücke führt. Dimensionen
  ohne Lücke tragen nichts bei — das ist eine bewusste, einfache
  Auslegung von „bedarfsluecke": wie viel diese Aktivität von dem liefert,
  was gerade fehlt, nicht wie stark die Lücke selbst ist (siehe „Offene
  Fragen").
- `suitability` = `activity.suitability[breedGroup] ?? 0` — fehlt der
  Eintrag, gilt neutral 0 (`docs/datenmodell.md`: „gewichtet, filtert NIE
  hart").
- `recentlyDone` = `lastUsedByActivityId[activity.id]` ist gesetzt und
  `today.difference(lastUsedAt).inDays < config.recentlyDoneDays`.

**Zu den Vorzeichen:** `content/planer.yaml` speichert
`belastung_bei_erholungsbedarf` und `kuerzlich_gemacht` bereits negativ
(`-3.0`, `-2.0`). Die Pseudocode-Schreibweise in `docs/datenmodell.md`
(„− w_belastung · belastung") ist beschreibend, nicht operational — die
Implementierung addiert alle Terme gleich; das negative Vorzeichen im
Gewicht selbst erzeugt den Abzug. Kein Term wird hier zusätzlich negiert.

**Tie-Break**: Das Ergebnis ist nach `score` absteigend sortiert; bei
gleichem Score entscheidet `activity.id` aufsteigend (lexikografisch) —
deterministisch, unabhängig von der Reihenfolge in `pool`
(`docs/datenmodell.md`: „Tie-Break deterministisch über die
Aktivitäts-ID").

`ScoredActivity` trägt `activity` und `score`.

## Beispiele

Gewichte aus `content/planer.yaml`: `priorityWeight: 3.0, overdueWeight:
2.0, overdueCap: 3.0, needGapWeight: 2.0, newSkillWeight: 1.0,
suitabilityWeight: 1.0, arousalAtRecoveryNeedWeight: -3.0,
recentlyDoneWeight: -2.0, recentlyDoneDays: 10`.

1. **Priorität.**
   Eingabe: Aktivität trainiert einen Skill mit `SkillFocus.priority: 3`,
   sonst neutral (kein Bedarf, keine Überfälligkeit, kein neuer Skill,
   keine Eignung, `recoveryNeed: none`, nicht kürzlich gemacht).
   Ausgabe: `score = 3.0 × 3 = 9.0`.

2. **Überfälligkeit wird gedeckelt.**
   2a. `overdueDays: 7` (eine Woche): `score = 2.0 × min(1.0, 3.0) = 2.0`.
   2b. `overdueDays: 28` (vier Wochen): `score = 2.0 × min(4.0, 3.0) =
   6.0` — nicht `8.0`, der Deckel greift.

3. **Bedarfslücke zählt nur, was gerade fehlt.**
   Eingabe: `candidates.needs = [NeedFocus(scent, gap: 3),
   NeedFocus(social, gap: 2)]`. Aktivität A: `needs = {scent: 2, social:
   1, physical: 0, mentalWork: 0, recovery: 0}` → `needGapScore = 2 + 1 =
   3` → `score = 2.0 × 3 = 6.0`. Aktivität B: `needs = {physical: 3, …
   sonst 0}` (physical hat keine Lücke) → `needGapScore = 0` → `score =
   0.0`.

4. **Neuer Skill.**
   Eingabe: `SkillFocus.isNewSkill: true`, sonst neutral.
   Ausgabe: `score = 1.0 × 1 = 1.0`.

5. **Eignung, mit fehlendem Eintrag als neutral.**
   Eingabe: `breedGroup: herding`. Aktivität A: `suitability: {herding:
   2}` → `score = 1.0 × 2 = 2.0`. Aktivität B: `suitability: {}` (kein
   Eintrag für `herding`) → `score = 1.0 × 0 = 0.0`.

6. **Belastungsabzug nur ab erhöhtem Erholungsbedarf.**
   Eingabe: `arousal: 3`. Bei `recoveryNeed: none`: `score = 0.0` (der
   Term entfällt komplett). Bei `recoveryNeed: medium`: `score = -3.0 × 3
   = -9.0`.

7. **„Kürzlich gemacht"-Abzug.**
   Eingabe: `lastUsedByActivityId['sniff'] = today - 5 Tage`,
   `recentlyDoneDays: 10`. Ausgabe: `score = -2.0` (5 < 10). Bei
   `today - 15 Tage`: `score = 0.0` (15 ≥ 10, kein Abzug).

8. **Alles zusammen.**
   Eingabe: Aktivität trainiert einen fälligen, priorisierten Skill
   (`priority: 2`, `overdueDays: 14`), `breedGroup`-Eignung `1`,
   `recoveryNeed: none`, nicht kürzlich gemacht, keine Bedarfslücke
   getroffen, kein neuer Skill.
   Ausgabe: `score = 3.0×2 + 2.0×min(2.0, 3.0) + 1.0×1 = 6.0 + 4.0 + 1.0 =
   11.0`.

9. **Deterministischer Tie-Break.**
   Eingabe: zwei neutrale Aktivitäten mit identischem Score 0.0, IDs
   `'zebra'` und `'apple'`, in dieser Reihenfolge in `pool`.
   Ausgabe: `['apple', 'zebra']` — aufsteigend nach ID, unabhängig von der
   Eingabereihenfolge.

## Nicht dazu gehört

- Zuweisen auf Tage, Obergrenzen je Lebensphase, „nie zwei Tage in Folge
  maximale Belastung" — Schritt 6, arbeitet auf dem sortierten Ergebnis
  dieser Funktion.
- Auflösung von `lastUsedByActivityId` aus vergangenen `WeeklyPlan`s —
  Aufgabe des Aufrufers, analog zu `lastUsedByVarianceGroup` in
  `docs/specs/hart-filtern.md`.
- Die Interpretation von `bedarfsluecke` als „Deckungsbeitrag" statt
  „gewichtet nach Lückengröße" ist eine Modellentscheidung dieser Spec,
  keine reine Ableitung aus `docs/datenmodell.md` — siehe „Offene Fragen".

## Offene Fragen

- Sollte `needGapScore` mit der Lückengröße (`NeedFocus.gap`) gewichtet
  werden statt nur binär „hat eine Lücke / hat keine"? Eine größere Lücke
  (z. B. `gap: 5` bei Nase) könnte einen stärkeren Ausschlag verdienen als
  eine kleine (`gap: 1` bei Sozialkontakt). Für den MVP: ungewichtet, weil
  `docs/datenmodell.md` keine Formel dafür vorgibt und eine erfundene
  Gewichtung hier fachlich wäre (CLAUDE.md, Bauplan: „Scoring-Gewichte des
  Planers" sind kein Ort für KI-Entscheidungen). Überprüfbar mit dem
  Simulator, sobald er steht.
