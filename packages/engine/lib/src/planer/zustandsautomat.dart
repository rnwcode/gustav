import '../models/enums.dart';
import '../models/skill_stand.dart';
import '../models/stufen.dart';
import 'zustandsautomat_konfig.dart';

/// Skill-Zustandsautomat und Spaced Repetition.
///
/// Spec: `docs/specs/skill-zustandsautomat.md`. Reine Funktionen — `datum`
/// kommt als Parameter herein, nie von der Systemuhr (CLAUDE.md, Regel 2).

const int _maxHistorienLaenge = 10;

/// Die Dimension, an der gerade gearbeitet wird: die erste in `reihenfolge`,
/// deren Stufe die Zielstufe noch nicht erreicht hat. Haben alle drei ihre
/// Zielstufe erreicht, gilt die letzte der Reihenfolge als aktiv.
Dimension aktiveDimension(
    Stufen stufen, Stufen zielstufen, List<Dimension> reihenfolge) {
  for (final d in reihenfolge) {
    if (stufen[d] < zielstufen[d]) return d;
  }
  return reihenfolge.last;
}

/// Verarbeitet eine Bewertung (`klappte`, `soHalb` oder `nochNicht`) und
/// liefert den neuen `SkillStand`.
SkillStand wende({
  required SkillStand stand,
  required Stufen zielstufen,
  required Ergebnis ergebnis,
  required DateTime datum,
  required ZustandsautomatKonfig konfig,
}) {
  assert(
    ergebnis == Ergebnis.klappte ||
        ergebnis == Ergebnis.soHalb ||
        ergebnis == Ergebnis.nochNicht,
    'wende erwartet klappte, soHalb oder nochNicht, war $ergebnis',
  );

  final historieVoll = [
    ...stand.historie,
    HistorienEintrag(datum: datum, ergebnis: ergebnis, stufen: stand.stufen),
  ];

  final aktiv = aktiveDimension(stand.stufen, zielstufen, konfig.reihenfolge);

  var neueStufen = stand.stufen;
  var neuerStatus = stand.status;

  if (ergebnis == Ergebnis.klappte) {
    final erfolgeInFolge =
        _zaehleInFolge(historieVoll, stand.stufen, Ergebnis.klappte);
    if (erfolgeInFolge >= konfig.erhoehenNachErfolgen) {
      neueStufen = _mitErhoehterDimension(stand.stufen, zielstufen, aktiv);
    }
  } else if (ergebnis == Ergebnis.nochNicht) {
    final misserfolgeInFolge =
        _zaehleInFolge(historieVoll, stand.stufen, Ergebnis.nochNicht);
    if (misserfolgeInFolge >= konfig.senkenNachMisserfolgen) {
      final neuerWert = _ungefloort(stand.stufen[aktiv] - 1);
      neueStufen = stand.stufen.mit(aktiv, neuerWert);
      if (neuerWert == 0) neuerStatus = SkillStatus.aufbau;
    }
  }

  if (neuerStatus == SkillStatus.aufbau &&
      neueStufen.ablenkung >= konfig.generalisierungAbAblenkung) {
    neuerStatus = SkillStatus.generalisierung;
  }
  if (neueStufen == zielstufen) {
    neuerStatus = SkillStatus.gefestigt;
  }

  final intervallKonfig = konfig.intervalle[neuerStatus]!;
  final neuesIntervall = switch (ergebnis) {
    Ergebnis.klappte => _gedeckelt(
        (stand.intervallTage * konfig.faktorBeiErfolg).round(),
        intervallKonfig.deckel,
      ),
    Ergebnis.nochNicht => intervallKonfig.start,
    _ => stand.intervallTage,
  };

  final historieGetrimmt = historieVoll.length > _maxHistorienLaenge
      ? historieVoll.sublist(historieVoll.length - _maxHistorienLaenge)
      : historieVoll;

  return stand.kopieMit(
    status: neuerStatus,
    stufen: neueStufen,
    historie: historieGetrimmt,
    letzteUebungAm: datum,
    faelligAm: datum.add(Duration(days: neuesIntervall)),
    intervallTage: neuesIntervall,
  );
}

/// Rückmeldung eines Problems im Wochen-Check-in: wirft `erhaltung` auf
/// `generalisierung` zurück und senkt die aktive Dimension um eine Stufe.
SkillStand meldeProblem({
  required SkillStand stand,
  required Stufen zielstufen,
  required ZustandsautomatKonfig konfig,
}) {
  assert(
    stand.status == SkillStatus.erhaltung,
    'meldeProblem gilt nur für Skills in erhaltung, war ${stand.status}',
  );

  final aktiv = aktiveDimension(stand.stufen, zielstufen, konfig.reihenfolge);
  final neueStufen =
      stand.stufen.mit(aktiv, _ungefloort(stand.stufen[aktiv] - 1));
  final intervallKonfig = konfig.intervalle[SkillStatus.generalisierung]!;

  return stand.kopieMit(
    status: SkillStatus.generalisierung,
    stufen: neueStufen,
    intervallTage: intervallKonfig.start,
  );
}

/// Erhöht [aktiv] um 1 und senkt jede andere Dimension um 1 (Untergrenze 0)
/// — aber nur, wenn diese ihre Zielstufe noch nicht erreicht hat. Eine
/// bereits fertige Dimension bleibt unangetastet, sonst wäre „Zielstufen
/// erreicht" nie gleichzeitig erreichbar.
Stufen _mitErhoehterDimension(
    Stufen stufen, Stufen zielstufen, Dimension aktiv) {
  var neu = stufen.mit(aktiv, stufen[aktiv] + 1);
  for (final d in Dimension.values) {
    if (d == aktiv) continue;
    if (stufen[d] < zielstufen[d]) {
      neu = neu.mit(d, _ungefloort(stufen[d] - 1));
    }
  }
  return neu;
}

/// Zählt, wie oft [ziel] am Ende von [historie] in Folge auftritt, solange
/// die Einträge auf derselben Stufe [stufen] bewertet wurden. `soHalb`
/// unterbricht die Zählung nicht.
int _zaehleInFolge(
    List<HistorienEintrag> historie, Stufen stufen, Ergebnis ziel) {
  var anzahl = 0;
  for (final eintrag in historie.reversed) {
    if (eintrag.stufen != stufen) break;
    if (eintrag.ergebnis == ziel) {
      anzahl++;
    } else if (eintrag.ergebnis == Ergebnis.soHalb) {
      continue;
    } else {
      break;
    }
  }
  return anzahl;
}

int _ungefloort(int wert) => wert < 0 ? 0 : wert;

int _gedeckelt(int wert, int deckel) => wert > deckel ? deckel : wert;
