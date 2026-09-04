import 'package:engine/engine.dart';
import 'package:test/test.dart';

void main() {
  group('FakeClock', () {
    test('returns the point it was set to', () {
      final clock = Clock.fixed(DateTime(2026, 9, 6, 18, 30));
      expect(clock.now, DateTime(2026, 9, 6, 18, 30));
    });

    test('today strips the time of day', () {
      final clock = Clock.fixed(DateTime(2026, 9, 6, 18, 30));
      expect(clock.today, DateTime(2026, 9, 6));
    });

    test('advanceBy() moves forward in days', () {
      final clock = Clock.fixed(DateTime(2026, 9, 6)) as FakeClock;
      clock.advanceBy(days: 9);
      expect(clock.today, DateTime(2026, 9, 15));
    });
  });
}
