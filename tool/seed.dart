// Spielt den YAML-Katalog aus content/ nach Postgres. Idempotent:
// mehrfaches Ausführen führt zum selben Ergebnis.
//
// Liest die Verbindungsdaten aus der Umgebung (siehe infra/supabase/.env.example).
// Läuft gegen den lokalen Stack, gegen Staging und gegen Produktion —
// unterschieden wird allein über die Umgebungsvariablen.
//
// TODO(Phase 3): implementieren.

void main(List<String> args) {
  throw UnimplementedError('Phase 3 — siehe docs/bauplan.md');
}
