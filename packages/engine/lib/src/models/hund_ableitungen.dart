import 'enums.dart';
import 'hund.dart';

/// Abgeleitete Werte zu [Hund] — nie gespeichert, weil sie vom aktuellen
/// Datum abhängen. `heute` kommt immer als Parameter herein, nie von der
/// Systemuhr (CLAUDE.md, Regel 2).

int alterInWochenAm(Hund hund, DateTime heute) =>
    heute.difference(hund.geburtsdatum).inDays ~/ 7;

/// `docs/datenmodell.md`, Abschnitt „hund":
/// welpe (<16 W) | junghund (<30) | pubertaet (<70) | erwachsen
/// | senior (gross ab 312 W, mittel 364, klein 416).
///
/// Bewusst unabhängig von `einzugsdatum`: Ein erwachsener Hund, der frisch
/// eingezogen ist, bleibt biologisch erwachsen — dass er sich in den ersten
/// Wochen „wie ein Welpe" verhält, regelt die Eingewöhnungsregel des
/// Planers (`content/planer.yaml`, `eingewoehnung_wochen`), nicht die
/// Lebensphase.
Lebensphase lebensphaseAm(Hund hund, DateTime heute) {
  final alterWochen = alterInWochenAm(hund, heute);
  if (alterWochen < 16) return Lebensphase.welpe;
  if (alterWochen < 30) return Lebensphase.junghund;
  if (alterWochen < 70) return Lebensphase.pubertaet;

  final seniorAbWochen = switch (hund.groessenklasse) {
    Groessenklasse.gross => 312,
    Groessenklasse.mittel => 364,
    Groessenklasse.klein => 416,
  };
  return alterWochen >= seniorAbWochen
      ? Lebensphase.senior
      : Lebensphase.erwachsen;
}

/// `docs/datenmodell.md`: brachyzephal +2, dichte Unterwolle +1, gross +1,
/// welpe/senior +1, gedeckelt bei 3.
int hitzeempfindlichkeitAm(Hund hund, DateTime heute) {
  var wert = 0;
  if (hund.koerperbau.contains(Koerperbau.brachyzephal)) wert += 2;
  if (hund.koerperbau.contains(Koerperbau.dichteUnterwolle)) wert += 1;
  if (hund.groessenklasse == Groessenklasse.gross) wert += 1;

  final phase = lebensphaseAm(hund, heute);
  if (phase == Lebensphase.welpe || phase == Lebensphase.senior) wert += 1;

  return wert > 3 ? 3 : wert;
}
