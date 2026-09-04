// Prüft den Content in content/ gegen das Schema und auf Abdeckungslücken.
//
// TODO(Phase 1): implementieren. Geprüft werden muss:
//   1. Struktur — jedes Pflichtfeld vorhanden, Enums gültig, Zahlen in Bereich
//   2. Referenzen — trainiert_skill, voraussetzungen und illustration existieren
//   3. Zyklenfreiheit der Voraussetzungen
//   4. ABDECKUNG — für jeden Skill auf jeder erreichbaren Ablenkungsstufe
//      mindestens eine passende Aktivität, plus eine Auffrischungsvariante.
//      Ohne diese Prüfung läuft der Planer bei einem echten Nutzer leer.
//   5. Varianzgruppen — jede Gruppe hat genug Mitglieder für ihre Sperrfrist
//   6. planer.yaml — vollständig, konsistent, version hochgezählt
//      (siehe content/schema/planer.yaml)
//
// Rückgabe: Exit-Code 0 bei grün, 1 bei Fehlern. Wird von der CI aufgerufen.

void main(List<String> args) {
  throw UnimplementedError('Phase 1 — siehe docs/bauplan.md');
}
