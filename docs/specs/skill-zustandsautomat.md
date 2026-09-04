# Skill-Zustandsautomat und Spaced Repetition

## Warum

Ein Skill ist kein Skalar (`docs/datenmodell.md`, Abschnitt „Fünf
Entscheidungen"). Nach jeder Bewertung muss der `SkillStand` neu bestimmt
werden: welche der drei Dimensionen (Dauer, Distanz, Ablenkung) als Nächstes
steigt, wann die Übung wieder fällig ist, und ob der Status wechselt. Ohne
diese Funktion kann der Planer (Schritt 3, „fällige Auffrischungen") nicht
wissen, was als Nächstes dran ist.

## Verhalten

Zwei Funktionen, beide reine Funktionen ohne Zeitzugriff — `datum` kommt als
Parameter herein.

```dart
SkillStand wende({
  required SkillStand stand,
  required Stufen zielstufen,
  required Ergebnis ergebnis,       // nur klappte | soHalb | nochNicht
  required DateTime datum,
  required ZustandsautomatKonfig konfig,
})

SkillStand meldeProblem({
  required SkillStand stand,
  required Stufen zielstufen,
  required ZustandsautomatKonfig konfig,
})
```

### Aktive Dimension

Genau eine Dimension ist zu jedem Zeitpunkt „aktiv" — diejenige, an der
gerade gearbeitet wird. Sie ist nicht gespeichert, sondern wird aus
`stufen`, `zielstufen` und `konfig.reihenfolge` (Dauer → Distanz →
Ablenkung) hergeleitet: die erste Dimension in dieser Reihenfolge, deren
Stufe die Zielstufe noch nicht erreicht hat. Haben alle drei ihre Zielstufe
erreicht, gilt die letzte Dimension der Reihenfolge (Ablenkung) als aktiv.

### `wende` — Verarbeitung einer Bewertung

1. **3× „klappte" auf der aktuellen Stufe** (gezählt an den zuletzt
   protokollierten Historieneinträgen mit identischen `stufen`, „so halb"
   unterbricht die Zählung nicht): die aktive Dimension steigt um 1. Von den
   anderen beiden sinkt nur die, die ihre Zielstufe noch **nicht** erreicht
   hat, um 1 (Untergrenze 0) — eine bereits fertige Dimension wird nicht
   wieder zurückgesetzt. Das hält „Zielstufen erreicht" erreichbar.
2. **2× „noch nicht" in Folge** auf der aktuellen Stufe: die aktive
   Dimension sinkt um 1 (Untergrenze 0). Erreicht sie dabei 0, fällt der
   Status auf `aufbau` zurück.
3. **„so halb"**: Stufen unverändert — Wiederholung ohne Bewertungsdruck.
4. Danach, in dieser Reihenfolge:
   - Ablenkung der (neuen) Stufen ≥ `generalisierungAbAblenkung` **und**
     Status ist `aufbau` → Status wird `generalisierung`.
   - neue Stufen == `zielstufen` → Status wird `gefestigt`.
5. **Intervall** (Spaced Repetition, unabhängig von einer Stufenänderung):
   - `klappte`: `intervallTage = min((altesIntervall * faktorBeiErfolg).round(), deckel[neuerStatus])`
   - `nochNicht`: `intervallTage = start[neuerStatus]`
   - `soHalb`: unverändert
   - `letzteUebungAm = datum`, `faelligAm = datum + intervallTage` — in
     allen drei Fällen, die Übung hat stattgefunden.
   - `start`/`deckel` kommen aus `konfig.intervalle[neuerStatus]`.
6. Der neue Historieneintrag `{datum, ergebnis, stufen: stand.stufen}`
   (die Stufe, **auf der** bewertet wurde, nicht die neue) wird angehängt;
   nur die letzten 10 Einträge bleiben.

### `meldeProblem` — Rückmeldung im Check-in

Trigger ist ein Nutzerhinweis im Wochen-Check-in, keine tägliche Bewertung.
Gilt für `SkillStand` in `erhaltung`: Status fällt auf `generalisierung`
zurück, die aktive Dimension sinkt um 1 (Untergrenze 0). Intervall fällt auf
`start[generalisierung]`. Für jeden anderen Status ist der Aufruf ein
Programmierfehler (`assert`) — das Problem-Melden ergibt nur Sinn, wenn der
Skill als eingespielt galt.

## Beispiele

Alle Beispiele nutzen den Skill „rueckruf"
(`content/skills/rueckruf.yaml`, Zielstufen `dauer: 1, distanz: 3,
ablenkung: 4`) und die Werte aus `content/planer.yaml`
(`erhoehen_nach_erfolgen: 3`, `senken_nach_misserfolgen: 2`,
`generalisierung_ab_ablenkung: 2`, `faktor_bei_erfolg: 1.8`,
`aufbau: {start: 1, deckel: 4}`, `generalisierung: {start: 3, deckel: 14}`,
`gefestigt: {start: 10, deckel: 45}`).

1. **3× klappte erhöht die aktive Dimension, senkt nur die unfertige.**
   Eingabe: Status `aufbau`, Stufen `{dauer: 1, distanz: 1, ablenkung: 1}`
   (Dauer bereits auf Zielstufe), Intervall 2 Tage, Historie zwei `klappte`
   auf dieser Stufe. Neues Ergebnis `klappte` am 2026-03-10.
   Aktive Dimension: `distanz` (1 < 3). Ausgabe: Stufen
   `{dauer: 1, distanz: 2, ablenkung: 0}` (Ablenkung ist die andere, noch
   unfertige Dimension und sinkt von 1 auf 0; Dauer bleibt, weil fertig).
   Intervall `round(2 × 1.8) = 4`, gedeckelt bei 4 → 4. `faelligAm`
   2026-03-14. Status bleibt `aufbau`.

2. **2× noch nicht in Folge senkt die aktive Dimension; bei 0 zurück auf
   aufbau.**
   Eingabe: Status `generalisierung`, Stufen
   `{dauer: 1, distanz: 3, ablenkung: 1}` (aktive Dimension `ablenkung`),
   Intervall 3 Tage, Historie ein `noch nicht` auf dieser Stufe. Neues
   Ergebnis `noch nicht` am 2026-03-10.
   Ausgabe: Stufen `{dauer: 1, distanz: 3, ablenkung: 0}`. Ablenkung
   erreicht 0 → Status `aufbau`. Intervall `start[aufbau] = 1`. `faelligAm`
   2026-03-11.

3. **so halb ändert weder Stufen noch Intervall.**
   Eingabe: Status `aufbau`, Stufen `{dauer: 0, distanz: 0, ablenkung: 0}`,
   Intervall 1 Tag. Ergebnis `so halb` am 2026-03-10.
   Ausgabe: Stufen unverändert, Intervall unverändert (1), Status
   unverändert. `letzteUebungAm` 2026-03-10, `faelligAm` 2026-03-11.

4. **Ablenkung erreicht die Generalisierungsschwelle.**
   Eingabe: Status `aufbau`, Stufen
   `{dauer: 1, distanz: 3, ablenkung: 1}` (Dauer und Distanz auf
   Zielstufe, aktive Dimension `ablenkung`), Intervall 1 Tag, Historie
   zwei `klappte` auf dieser Stufe. Ergebnis `klappte` am 2026-03-10.
   Ausgabe: Stufen `{dauer: 1, distanz: 3, ablenkung: 2}` (Dauer und
   Distanz bereits fertig, keine Absenkung). Ablenkung ≥ 2 und Status war
   `aufbau` → Status `generalisierung`. Intervall
   `round(1 × 1.8) = 2`, gedeckelt bei 14 (neuer Status) → 2.

5. **Zielstufen erreicht → gefestigt.**
   Eingabe: Status `generalisierung`, Stufen
   `{dauer: 1, distanz: 3, ablenkung: 3}` (aktive Dimension `ablenkung`),
   Intervall 10 Tage, Historie zwei `klappte` auf dieser Stufe. Ergebnis
   `klappte` am 2026-03-10.
   Ausgabe: Stufen `{dauer: 1, distanz: 3, ablenkung: 4}` == Zielstufen →
   Status `gefestigt`. Intervall `round(10 × 1.8) = 18`, gedeckelt bei 45
   → 18.

6. **Problem im Check-in wirft erhaltung auf generalisierung zurück.**
   Eingabe: Status `erhaltung`, Stufen
   `{dauer: 1, distanz: 3, ablenkung: 4}` (alle auf Zielstufe, aktive
   Dimension fällt auf die letzte der Reihenfolge zurück: `ablenkung`),
   Intervall 45 Tage. Aufruf `meldeProblem`.
   Ausgabe: Stufen `{dauer: 1, distanz: 3, ablenkung: 3}`. Status
   `generalisierung`. Intervall `start[generalisierung] = 3`.

## Nicht dazu gehört

- Fällige Auffrischungen erkennen und in Kandidaten übersetzen (Planer,
  Schritt 3) — diese Funktion ändert nur einen einzelnen `SkillStand`.
- `Ergebnis.uebersprungen` und `Ergebnis.nichtGeschafft` sind hier keine
  gültigen Eingaben für `wende` — sie beschreiben, ob ein Slot überhaupt
  stattgefunden hat (Belastungsbudget), nicht die Qualität einer
  Skill-Übung, und werden nicht auf `SkillStand` verrechnet.
- Der Übergang von `gefestigt` zu `erhaltung` „danach automatisch"
  (`docs/datenmodell.md`) ist zeit- oder periodengetrieben, nicht
  Ergebnis-getrieben, und ist nicht Teil dieser Funktion.
- Laden von `content/planer.yaml` — `ZustandsautomatKonfig` wird
  hineingereicht (CLAUDE.md, Regel 10), das Parsen gehört ins `tool`-Paket.

## Offene Fragen

- Ist die Rundung `round()` (kaufmännisch) für das Intervall die richtige
  Wahl, oder sollte auf ganze Tage aufgerundet werden, damit ein Intervall
  nie „zu früh" fällig wird? Für den MVP: `round()`, überprüfbar mit dem
  Simulator (`--check`), sobald er steht.
