# Content

Die eigentliche Substanz des Produkts. Hier liegt der kritische Pfad — nicht
im Code. Vierzig Aktivitäten für den MVP, fünf pro Woche.

- `schema/` — Struktur, gegen die `tool/validate.dart` prüft
- `skills/` — was der Hund lernen kann, mit Voraussetzungen und Zielstufen
- `aktivitaeten/` — was in einem Tages-Slot landen kann
- `planer.yaml` — **alle Stellschrauben des Planers**, versioniert

## Warum die Planerkonfiguration hier liegt

Weil sie Daten sind, nicht Code (CLAUDE.md, Regel 10). Die Gewichte werden im
ersten Jahr ständig falsch sein und ständig nachjustiert. Läge das im Dart-Code,
wäre jede Korrektur ein App-Release — und Nutzer auf alten Versionen behielten
die alte Logik für immer. So kommt sie versioniert mit dem Katalog vom Server.

Der erzeugte Plan speichert `konfig_version` mit. Ein Plan wird einmal erzeugt
und dann nicht mehr angefasst, sonst schreibt eine Konfigänderung mitten in der
Periode dem Nutzer still seine Woche um.

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
