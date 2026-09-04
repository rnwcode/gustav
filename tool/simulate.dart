// Spielt einen synthetischen Halter über mehrere Perioden durch und druckt
// jede Periode als Text. Das wichtigste Entwurfswerkzeug des Projekts.
//
// Aufruf:
//   dart run tool/simulate.dart --hund welpe11 --profil unregelmaessig --wochen 12
//   dart run tool/simulate.dart --check      # nur Invarianten, 20 Hunde
//
// Profile bestimmen, wie der simulierte Halter bewertet:
//   fleissig        — hakt fast alles ab, meist "klappte"
//   unregelmaessig  — überspringt Tage, gemischte Ergebnisse
//   gibt_auf        — die ersten Tage aktiv, danach nichts mehr
//
// Invarianten, die --check prüft:
//   - jede Periode hat mindestens einen leeren Tag
//   - kein Skill bleibt länger als 45 Tage unberührt
//   - keine Varianzgruppe wiederholt sich innerhalb ihrer Sperrfrist
//   - jede Bedarfsdimension wird über zwei Perioden mindestens einmal gedeckt
//   - nach einem Tag mit Belastung 3 folgt kein Trainingstag
//
// TODO(Phase 1): implementieren.

void main(List<String> args) {
  throw UnimplementedError('Phase 1 — siehe docs/bauplan.md');
}
