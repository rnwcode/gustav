# Periode gegenprüfen (Planer, Schritt 7)

*Hinweis: Diese Spec bleibt Deutsch (CLAUDE.md, Abschnitt Sprache). Die
Codebeispiele nennen die tatsächlichen Bezeichner aus
`infra/supabase/functions/_shared/planner/` (TypeScript).*

## Warum

`assignToDays` (Schritt 6) erfüllt seine eigenen Regeln Tag für Tag, kennt
aber nie das Ergebnis über die ganze Periode. Ob am Ende wirklich alle
fünf Bedarfsdimensionen berührt wurden, ist eine Eigenschaft der *ganzen*
Woche, keines einzelnen Tages (`docs/datenmodell.md`, Abschnitt „Der
Planer", Schritt 7). Ohne diesen Schritt könnte eine Periode entstehen, in
der eine Dimension (z. B. `scent`) komplett fehlt, obwohl ein passender
Kandidat im Pool lag — einfach weil er nie die Tagesregeln „gewann".

## Verhalten

Reine Funktion, kein Zeitzugriff.

```typescript
function crossCheckPeriod(args: {
  assignments: DayAssignment[];   // aus assignToDays, chronologisch
  pool: ScoredActivity[];         // derselbe Pool wie bei assignToDays
  maxTrainingSlots: number;       // aus Period, Planer-Schritt 2
}): DayAssignment[]
```

Drei Prüfungen, in dieser Reihenfolge — die **erste fehlschlagende** löst
genau **eine** Korrektur aus, danach kehrt die Funktion sofort zurück
(„max 1 Durchlauf", `docs/datenmodell.md`). Sind alle drei Prüfungen
bereits erfüllt, kommen `assignments` unverändert zurück.

1. **Bedarfsdeckung**: für jede der fünf `NeedDimension` — berührt sie
   mindestens eine zugewiesene Aktivität (`needFor(activity.needs,
   dimension) > 0`)? Fehlt mindestens eine, wird der **schwächste
   zugewiesene Slot** (niedrigster Score, siehe „Schwächster Slot")
   gegen den bestbewerteten, noch nicht verwendeten Pool-Kandidaten
   getauscht, der **irgendeine** der fehlenden Dimensionen abdeckt. Gibt
   es keinen solchen Kandidaten, bleibt `assignments` unverändert — eine
   Deckung ohne passenden Kandidaten lässt sich nicht herbeitauschen
   (siehe „Nicht dazu gehört").
2. **Trainingsobergrenze**: Anzahl zugewiesener `type === 'training'`
   ≤ `maxTrainingSlots`? Sonst wird der schwächste zugewiesene
   **Trainings**-Slot geleert (`activityId: null`) — nicht ersetzt, denn
   das Ziel ist, einen Trainingsslot loszuwerden, nicht ihn durch einen
   anderen zu ersetzen.
3. **Mindestens ein leerer Slot**: existiert kein Tag mit `activityId ===
   null`, wird der insgesamt schwächste zugewiesene Slot geleert.

### Schwächster Slot

Unter allen Einträgen mit `activityId !== null`: niedrigster `score` aus
`pool` (nachgeschlagen über `activity.id`); bei Gleichstand entscheidet
die Aktivitäts-ID aufsteigend (derselbe deterministische Tie-Break wie
beim Scoren, `docs/specs/scoren.md`). Gibt es keinen zugewiesenen Slot,
kann keine Korrektur stattfinden — Prüfung 1 bleibt dann unerfüllt, aber
ungefixt (siehe „Nicht dazu gehört").

## Beispiele

`pool` ist der Kürze halber als `(id, type, arousal, needs, score)`
angegeben, absteigend nach Score sortiert, wie von `scoreActivities`
geliefert. `needs` nennt nur Dimensionen mit einem Wert > 0.

1. **Fehlende Bedarfsdimension wird nachgetauscht.**
   `assignments`: Tag 1 → `a` (needs: `{physical: 2}`, score 5), Tag 2 →
   `b` (needs: `{mentalWork: 2}`, score 4), Tag 3 → `null`.
   `pool` enthält zusätzlich `c` (needs: `{scent: 3}`, score 1, nicht
   zugewiesen). `scent` ist die einzige unberührte Dimension.
   Ausgabe: Tag 2 (schwächster zugewiesener Slot, Score 4 < 5) wird zu
   `c` — `b` wird verdrängt, obwohl `c` schlechter bewertet ist, weil nur
   `c` die fehlende Dimension deckt.

2. **Kein passender Kandidat — Lücke bleibt.**
   Wie oben, aber `pool` enthält keinen unbenutzten Kandidaten mit
   `scent`-Deckung. Ausgabe: `assignments` unverändert. Eine erfundene
   Deckung wäre falsch.

3. **Trainingsobergrenze überschritten.**
   `maxTrainingSlots: 1`. `assignments`: Tag 1 → `recall` (training,
   score 8), Tag 2 → `sit` (training, score 3), beide decken bereits alle
   fünf Bedarfsdimensionen ab. Ausgabe: Tag 2 (schwächster **Trainings**-
   Slot) wird `null` — Tag 1 bleibt, obwohl es ebenfalls Training ist,
   weil es der bessere der beiden ist.

4. **Kein leerer Slot vorhanden.**
   Alle Bedarfsdimensionen gedeckt, Trainingsobergrenze eingehalten, aber
   jeder Tag ist belegt. Ausgabe: der insgesamt schwächste Slot wird
   `null`.

5. **Reihenfolge — nur die erste zutreffende Prüfung korrigiert.**
   Eine Periode verletzt gleichzeitig Prüfung 1 (fehlende Dimension) und
   Prüfung 3 (kein leerer Slot). Ausgabe: nur die Bedarfslücke wird
   getauscht (Prüfung 1 zuerst) — der fehlende leere Slot bleibt für
   diesen Aufruf ungelöst. Ein zweiter Aufruf mit dem korrigierten
   Ergebnis würde ihn beim nächsten Durchlauf beheben, aber das ist
   bewusst nicht Teil dieser Funktion (siehe „Nicht dazu gehört").

## Nicht dazu gehört

- Mehr als eine Korrektur pro Aufruf, oder ein erneuter Durchlauf von
  `assignToDays` — `docs/datenmodell.md` nennt „max 1 Durchlauf"; diese
  Funktion setzt das als **einen** gebundenen Tausch um, nicht als Schleife
  über Schritt 6. Bleibt nach der einen Korrektur noch eine Prüfung offen,
  ist das ein bewusst in Kauf genommener Rest, kein Fehler dieser Funktion.
- Erneute Prüfung der Tagesregeln aus Schritt 6 (Trainingstag,
  Zeitbudget, Sperrfrist, „kürzester Tag", Belastungsfolge) für den
  eingetauschten Kandidaten — der Tausch verwendet den Tag des
  schwächsten Slots unbesehen. Eine vollständige Neuprüfung würde Schritt
  6 duplizieren; dass ein getauschter Kandidat dadurch im Einzelfall
  schlechter zum Tag passt als das, was `assignToDays` gewählt hätte, ist
  eine bewusste Vereinfachung.
- Eine Bedarfslücke ohne passenden Kandidaten im Pool zu schließen — dafür
  gibt es keine Aktivität, also gibt es nichts zu tauschen.
- Woher `pool` und `maxTrainingSlots` kommen — das sind exakt die Werte
  aus den Schritten 5 und 2, unverändert durchgereicht.

## Offene Fragen

- Bleibt nach dieser einen Korrektur eine andere Prüfung verletzt (siehe
  Beispiel 5), erfährt das aktuell niemand außer dem Simulator
  (`--check`, sobald er steht). Ob der Orchestrator (`plan()`) diese
  Funktion mehrfach aufrufen sollte, bis alle drei Prüfungen erfüllt sind
  oder ein Durchlauf nichts mehr ändert, ist eine Entscheidung für den
  Orchestrator selbst — nicht für diese reine Prüf-und-Tausch-Funktion.
