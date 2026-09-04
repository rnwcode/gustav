# Planer

Reine Funktion: Zustand rein, Wochenplan raus. Kein Netzwerk, kein LLM,
keine ungeseedeten Zufallszahlen.

Ablauf (Details in `docs/datenmodell.md`):

1. Kontext bauen — Hund, Haushalt, Wochenkontext, Belastungsbudget, Saison
2. Slots festlegen — Periodenlänge, leere Slots, Phasenkappe
3. Kandidaten sammeln — fällige Auffrischungen, Prioritäten, Bedarfslücken, neue Skills
4. Hart filtern — Alter, Voraussetzungen, Equipment, Einschränkungen, Sperrfrist, Sicherheit
5. Scoren — gewichtete Summe, deterministischer Tie-Break über die ID
6. Zuweisen — Tag für Tag, Belastungsregeln
7. Woche gegenprüfen — Bedarfsabdeckung, Trainingsobergrenze, leerer Slot
8. Texten — Rahmen und Begründung aus strukturierten Daten

Die Gewichte in Schritt 5 sind eingestellt, nicht hergeleitet. Sie werden
nur zusammen mit einem Simulatorlauf geändert.
