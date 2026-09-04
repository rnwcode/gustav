# Modelle

Hier entstehen die Datenklassen aus `docs/datenmodell.md`:

- `hund.dart` — Hund, Lebensphase, Hitzeempfindlichkeit, Belastbarkeit
- `haushalt.dart` — Zeitbudget, Trainingstage, Planungstag
- `skill.dart` — Skill, Stufen (Dauer/Distanz/Ablenkung), Zielstufen
- `skill_stand.dart` — Zustand pro Hund × Skill, Spaced Repetition
- `aktivitaet.dart` — die Einheit, die der Planer verteilt
- `checkin.dart` — Rückblick, Absicht, abgeleiteter Wochenkontext
- `wochenplan.dart` — Slots, Begründungen, Periodenlänge

Regel: keine `DateTime.now()`, keine IO, keine Serialisierung gegen Supabase
in diesem Paket. Nur Daten und Logik.
