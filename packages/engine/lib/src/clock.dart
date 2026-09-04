import 'package:meta/meta.dart';

/// Einzige erlaubte Zeitquelle im Projekt.
///
/// `DateTime.now()` ist überall verboten und wird von der CI abgelehnt.
/// Ohne diese Indirektion sind Simulator, Integrationstest und die
/// Debug-Zeitreise im Gerät nicht baubar — das Produkt ist zeitbasiert.
abstract class Clock {
  const Clock();

  /// Erzeugt eine Uhr, die die echte Systemzeit liefert.
  ///
  /// Der einzige Ort im Repo, an dem die Systemzeit gelesen werden darf.
  factory Clock.system() = _SystemClock;

  /// Erzeugt eine feststellbare Uhr für Tests und den Simulator.
  factory Clock.fixed(DateTime zeitpunkt) = FakeClock;

  DateTime get jetzt;

  /// Heutiger Tag ohne Uhrzeit — der Planer rechnet in Tagen, nicht Stunden.
  DateTime get heute {
    final n = jetzt;
    return DateTime(n.year, n.month, n.day);
  }
}

class _SystemClock extends Clock {
  const _SystemClock();

  @override
  // ignore: avoid_datetime_now
  DateTime get jetzt => DateTime.now();
}

/// Uhr, die sich stellen und weiterdrehen lässt.
@visibleForTesting
class FakeClock extends Clock {
  FakeClock(this._jetzt);

  DateTime _jetzt;

  @override
  DateTime get jetzt => _jetzt;

  /// Springt um [tage] Tage vorwärts. Für Simulator und Zeitreise.
  void vor({int tage = 0, int stunden = 0}) {
    _jetzt = _jetzt.add(Duration(days: tage, hours: stunden));
  }

  void stelleAuf(DateTime zeitpunkt) => _jetzt = zeitpunkt;
}
