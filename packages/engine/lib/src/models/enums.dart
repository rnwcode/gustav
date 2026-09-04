// Enums aus `docs/datenmodell.md`.
//
// Reine Aufzählungen, keine Logik. Wo die Fachdomäne betroffen ist, sind
// Namen deutsch (CLAUDE.md, Abschnitt Sprache).

/// Wochentag, unabhängig vom Kalenderdatum — der Planer rechnet in
/// `trainingstage` und `planungstag`, nicht in ISO-Wochentagen.
enum Wochentag {
  montag,
  dienstag,
  mittwoch,
  donnerstag,
  freitag,
  samstag,
  sonntag
}

enum Herkunft { zuechter, tierschutz, privat, unbekannt }

enum Rassegruppe {
  huete,
  jagd,
  begleit,
  herdenschutz,
  terrier,
  wind,
  nordisch,
  molosser,
  misch
}

enum Groessenklasse { klein, mittel, gross }

enum Koerperbau { brachyzephal, dichteUnterwolle, langbeinig }

enum Einschraenkung { schonung, gelenke, senior, rekonvaleszenz }

enum Wohnsituation { wohnung, hausGarten }

enum Umgebung { stadt, vorort, land }

enum Erfahrung { ersthund, erfahren }

/// `lebensphase` — abgeleitet aus Alter und Größenklasse, nie gespeichert.
enum Lebensphase { welpe, junghund, pubertaet, erwachsen, senior }

enum SkillStatus {
  nichtBegonnen,
  aufbau,
  generalisierung,
  gefestigt,
  erhaltung,
  ruht
}

enum SkillKategorie {
  grundsignal,
  leinenarbeit,
  impulskontrolle,
  alltagsroutine,
  sozialverhalten,
  kooperation,
}

enum AktivitaetTyp { training, beschaeftigung, alltag, ruhe, pflege }

enum Ort { drinnen, draussen, unterwegs, egal }

/// Ergebnis einer Bewertung — sowohl im täglichen Tippen als auch im
/// Rückblick am Planungstag.
enum Ergebnis { klappte, soHalb, nochNicht, uebersprungen, nichtGeschafft }

enum AbsichtChip {
  leinen,
  rueckruf,
  ruhe,
  alleinbleiben,
  besuch,
  wenigZeit,
  urlaub,
  mehrKopfarbeit,
  weissNicht,
}

enum RueckblickChip { vielLos, krank, reise, tierarzt, allesRuhig }

/// Entscheidet, ob die App „du hattest gesagt" sagen darf (siehe
/// `docs/produkt.md`, Tonalität).
enum WochenkontextQuelle { chip, freitext, standard }

/// Die drei D: Dauer, Distanz, Ablenkung — immer nur eins gleichzeitig
/// erhöhen (`docs/datenmodell.md`, Abschnitt „Skills und die drei D").
enum Dimension { dauer, distanz, ablenkung }

enum BedarfDimension { koerperlich, kopfarbeit, nase, sozial, erholung }
