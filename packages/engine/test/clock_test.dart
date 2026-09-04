import 'package:engine/engine.dart';
import 'package:test/test.dart';

void main() {
  group('FakeClock', () {
    test('liefert den gestellten Zeitpunkt', () {
      final uhr = Clock.fixed(DateTime(2026, 9, 6, 18, 30));
      expect(uhr.jetzt, DateTime(2026, 9, 6, 18, 30));
    });

    test('heute schneidet die Uhrzeit ab', () {
      final uhr = Clock.fixed(DateTime(2026, 9, 6, 18, 30));
      expect(uhr.heute, DateTime(2026, 9, 6));
    });

    test('vor() dreht in Tagen weiter', () {
      final uhr = Clock.fixed(DateTime(2026, 9, 6)) as FakeClock;
      uhr.vor(tage: 9);
      expect(uhr.heute, DateTime(2026, 9, 15));
    });
  });
}
