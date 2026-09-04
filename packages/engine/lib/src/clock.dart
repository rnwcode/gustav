import 'package:meta/meta.dart';

/// The only allowed time source in the project.
///
/// Reading the system clock directly is forbidden everywhere and rejected by
/// CI. Without this indirection, the simulator, integration tests and the
/// in-app debug time travel could not be built — the product is inherently
/// time-based.
abstract class Clock {
  const Clock();

  /// Creates a clock that returns the real system time.
  ///
  /// The only place in the repo allowed to read the system clock.
  factory Clock.system() = _SystemClock;

  /// Creates a settable clock for tests and the simulator.
  factory Clock.fixed(DateTime point) = FakeClock;

  DateTime get now;

  /// Today without a time component — the planner reasons in days, not hours.
  DateTime get today {
    final n = now;
    return DateTime(n.year, n.month, n.day);
  }
}

class _SystemClock extends Clock {
  const _SystemClock();

  @override
  // ignore: avoid_datetime_now
  DateTime get now => DateTime.now();
}

/// A clock that can be set and advanced.
@visibleForTesting
class FakeClock extends Clock {
  FakeClock(this._now);

  DateTime _now;

  @override
  DateTime get now => _now;

  /// Jumps forward by [days] and [hours]. For the simulator and time travel.
  void advanceBy({int days = 0, int hours = 0}) {
    _now = _now.add(Duration(days: days, hours: hours));
  }

  void setTo(DateTime point) => _now = point;
}
