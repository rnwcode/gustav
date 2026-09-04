# Modelle

Datenklassen aus `docs/datenmodell.md`:

- `enums.dart` — Wochentag, Lebensphase, SkillStatus, Ergebnis, Chips, …
- `stufen.dart` — die drei D (Dauer, Distanz, Ablenkung), je 0–5
- `hund.dart` — Stammdaten; `lebensphase` und `hitzeempfindlichkeit` sind
  keine gespeicherten Felder, siehe `hund_ableitungen.dart`
- `hund_ableitungen.dart` — `lebensphaseAm`/`hitzeempfindlichkeitAm`, reine
  Funktionen von Hund + Datum
- `haushalt.dart` — Zeitbudget, Trainingstage, Planungstag
- `skill.dart` — Skill, Zielstufen
- `skill_stand.dart` — Zustand pro Hund × Skill, Historie
- `aktivitaet.dart` — die Einheit, die der Planer verteilt, plus `Bedarf`

Noch offen (folgt mit den Planer-Schritten 1–7, siehe `../planer/README.md`):

- `checkin.dart` — Rückblick, Absicht, abgeleiteter Wochenkontext
- `wochenplan.dart` — Slots, Begründungen, Periodenlänge

Regel: keine Systemzeit, keine IO, keine Serialisierung gegen Supabase in
diesem Paket. Nur Daten und Logik — Zeit kommt als Parameter (`heute`,
`datum`) herein.
