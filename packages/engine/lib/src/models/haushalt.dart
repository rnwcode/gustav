import 'package:meta/meta.dart';

import 'enums.dart';

/// Rahmenbedingungen des Haushalts, in dem der Hund lebt.
@immutable
class Haushalt {
  const Haushalt({
    required this.id,
    this.plz,
    required this.wohnsituation,
    required this.umgebung,
    required this.erfahrung,
    required this.zeitbudgetWerktag,
    required this.zeitbudgetWochenende,
    required this.trainingstage,
    required this.planungstag,
    this.personen = 1,
    this.equipment = const [],
  });

  final String id;

  /// Nur für Wetter — kein GPS (`docs/datenmodell.md`).
  final String? plz;

  final Wohnsituation wohnsituation;
  final Umgebung umgebung;
  final Erfahrung erfahrung;

  final Duration zeitbudgetWerktag;
  final Duration zeitbudgetWochenende;

  final Set<Wochentag> trainingstage;

  /// Vorgabe Sonntag, änderbar — z. B. wegen Schichtdienst.
  final Wochentag planungstag;

  /// Mehrere Trainierende sind ein Konsistenzproblem, kein Bonus.
  final int personen;

  final List<String> equipment;
}
