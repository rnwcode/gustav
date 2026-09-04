import 'package:engine/engine.dart';
import 'package:test/test.dart';

void main() {
  Hund hund({
    DateTime? geburtsdatum,
    DateTime? einzugsdatum,
    Groessenklasse groessenklasse = Groessenklasse.mittel,
    Set<Koerperbau> koerperbau = const {},
  }) =>
      Hund(
        id: 'hund1',
        name: 'Testhund',
        geburtsdatum: geburtsdatum ?? DateTime(2026, 1, 1),
        einzugsdatum: einzugsdatum ?? geburtsdatum ?? DateTime(2026, 1, 1),
        herkunft: Herkunft.zuechter,
        rassegruppe: Rassegruppe.huete,
        groessenklasse: groessenklasse,
        koerperbau: koerperbau,
      );

  group('lebensphaseAm', () {
    test('unter 16 Wochen ist Welpe', () {
      final h = hund(geburtsdatum: DateTime(2026, 1, 1));
      final heute = DateTime(2026, 1, 1).add(const Duration(days: 10 * 7));
      expect(lebensphaseAm(h, heute), Lebensphase.welpe);
    });

    test('ab 16 bis unter 30 Wochen ist Junghund', () {
      final h = hund(geburtsdatum: DateTime(2026, 1, 1));
      final heute = DateTime(2026, 1, 1).add(const Duration(days: 20 * 7));
      expect(lebensphaseAm(h, heute), Lebensphase.junghund);
    });

    test('ab 30 bis unter 70 Wochen ist Pubertät', () {
      final h = hund(geburtsdatum: DateTime(2026, 1, 1));
      final heute = DateTime(2026, 1, 1).add(const Duration(days: 50 * 7));
      expect(lebensphaseAm(h, heute), Lebensphase.pubertaet);
    });

    test('mittlere Größe ist ab 364 Wochen Senior, davor erwachsen', () {
      final h = hund(
          geburtsdatum: DateTime(2020, 1, 1),
          groessenklasse: Groessenklasse.mittel);
      final knappDavor =
          DateTime(2020, 1, 1).add(const Duration(days: 363 * 7));
      final genauDa = DateTime(2020, 1, 1).add(const Duration(days: 364 * 7));
      expect(lebensphaseAm(h, knappDavor), Lebensphase.erwachsen);
      expect(lebensphaseAm(h, genauDa), Lebensphase.senior);
    });

    test('große Hunde werden früher Senior als kleine', () {
      final gross = hund(
          geburtsdatum: DateTime(2020, 1, 1),
          groessenklasse: Groessenklasse.gross);
      final klein = hund(
          geburtsdatum: DateTime(2020, 1, 1),
          groessenklasse: Groessenklasse.klein);
      final heute = DateTime(2020, 1, 1).add(const Duration(days: 320 * 7));
      expect(lebensphaseAm(gross, heute), Lebensphase.senior);
      expect(lebensphaseAm(klein, heute), Lebensphase.erwachsen);
    });
  });

  group('hitzeempfindlichkeitAm', () {
    test('unauffälliger erwachsener Hund hat 0', () {
      final h = hund(geburtsdatum: DateTime(2020, 1, 1));
      final heute = DateTime(2020, 1, 1).add(const Duration(days: 200 * 7));
      expect(hitzeempfindlichkeitAm(h, heute), 0);
    });

    test('brachyzephal gibt +2', () {
      final h = hund(
        geburtsdatum: DateTime(2020, 1, 1),
        koerperbau: {Koerperbau.brachyzephal},
      );
      final heute = DateTime(2020, 1, 1).add(const Duration(days: 200 * 7));
      expect(hitzeempfindlichkeitAm(h, heute), 2);
    });

    test('brachyzephal plus dichte Unterwolle plus Welpe ist bei 3 gedeckelt',
        () {
      final h = hund(
        geburtsdatum: DateTime(2026, 1, 1),
        koerperbau: {Koerperbau.brachyzephal, Koerperbau.dichteUnterwolle},
      );
      final heute = DateTime(2026, 1, 1).add(const Duration(days: 10 * 7));
      expect(hitzeempfindlichkeitAm(h, heute), 3);
    });

    test('groß gibt +1', () {
      final h = hund(
          geburtsdatum: DateTime(2020, 1, 1),
          groessenklasse: Groessenklasse.gross);
      final heute = DateTime(2020, 1, 1).add(const Duration(days: 200 * 7));
      expect(hitzeempfindlichkeitAm(h, heute), 1);
    });
  });
}
