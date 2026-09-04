import 'package:meta/meta.dart';

import 'enums.dart';

/// Stammdaten eines Hundes — gespeicherte Felder. `lebensphase` und
/// `hitzeempfindlichkeit` sind bewusst nicht Teil dieser Klasse: Sie hängen
/// vom aktuellen Datum ab, das im ganzen Repo als Parameter hereinkommt statt
/// von der Systemuhr (CLAUDE.md, Regel 2). Siehe `hund_ableitungen.dart`.
@immutable
class Hund {
  const Hund({
    required this.id,
    required this.name,
    required this.geburtsdatum,
    required this.einzugsdatum,
    required this.herkunft,
    required this.rassegruppe,
    required this.groessenklasse,
    this.koerperbau = const {},
    this.einschraenkungen = const {},
  });

  final String id;
  final String name;
  final DateTime geburtsdatum;

  /// Bei einem erwachsenen Hund aus dem Tierschutz zählt die Eingewöhnung ab
  /// hier, nicht ab der Geburt — „3 Jahre alt, seit 2 Wochen da" verhält
  /// sich wie ein Welpe (`docs/datenmodell.md`).
  final DateTime einzugsdatum;

  final Herkunft herkunft;
  final Rassegruppe rassegruppe;
  final Groessenklasse groessenklasse;
  final Set<Koerperbau> koerperbau;
  final Set<Einschraenkung> einschraenkungen;
}
