# Content

Die eigentliche Substanz des Produkts. Hier liegt der kritische Pfad — nicht
im Code. Vierzig Aktivitäten für den MVP, fünf pro Woche.

- `schema/` — Struktur, gegen die `tool/validate.dart` prüft
- `skills/` — was der Hund lernen kann, mit Voraussetzungen und Zielstufen
- `aktivitaeten/` — was in einem Tages-Slot landen kann

## Ablauf pro Charge

1. Zwei Aktivitäten von Hand schreiben — als Vorlage für Ton und Tiefe
2. Acht weitere per KI im selben Schema erzeugen
3. `dart run tool/validate.dart` — Struktur, Referenzen, Abdeckungslücken
4. **Jede einzelne selbst lesen.** Dieser Schritt ist nicht delegierbar,
   bei Angst, Aggression und Sicherheit erst recht nicht.

## Abdeckung

Der Validator meldet, wenn es für einen Skill auf einer Ablenkungsstufe keine
passende Aktivität gibt. Ohne diese Prüfung läuft der Planer irgendwann leer —
und zwar erst bei einem echten Nutzer in Woche 7.
