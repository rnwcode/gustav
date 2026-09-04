import 'package:meta/meta.dart';

import 'enums.dart';

/// Die drei D eines Skills: Dauer, Distanz, Ablenkung, je 0–5.
///
/// Immer nur eine Dimension gleichzeitig erhöhen — das ist Aufgabe des
/// Zustandsautomaten, nicht dieser Klasse. `Stufen` ist reiner Datenträger.
@immutable
class Stufen {
  const Stufen(
      {required this.dauer, required this.distanz, required this.ablenkung});

  final int dauer;
  final int distanz;
  final int ablenkung;

  int operator [](Dimension d) => switch (d) {
        Dimension.dauer => dauer,
        Dimension.distanz => distanz,
        Dimension.ablenkung => ablenkung,
      };

  Stufen mit(Dimension d, int wert) => switch (d) {
        Dimension.dauer =>
          Stufen(dauer: wert, distanz: distanz, ablenkung: ablenkung),
        Dimension.distanz =>
          Stufen(dauer: dauer, distanz: wert, ablenkung: ablenkung),
        Dimension.ablenkung =>
          Stufen(dauer: dauer, distanz: distanz, ablenkung: wert),
      };

  @override
  bool operator ==(Object other) =>
      other is Stufen &&
      other.dauer == dauer &&
      other.distanz == distanz &&
      other.ablenkung == ablenkung;

  @override
  int get hashCode => Object.hash(dauer, distanz, ablenkung);

  @override
  String toString() =>
      'Stufen(dauer: $dauer, distanz: $distanz, ablenkung: $ablenkung)';
}
