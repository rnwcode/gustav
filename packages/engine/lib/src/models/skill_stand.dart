import 'package:meta/meta.dart';

import 'enums.dart';
import 'stufen.dart';

/// Ein Eintrag in der Historie eines Skill-Stands — die letzten zehn
/// genügen (`docs/datenmodell.md`).
@immutable
class HistorienEintrag {
  const HistorienEintrag(
      {required this.datum, required this.ergebnis, required this.stufen});

  final DateTime datum;
  final Ergebnis ergebnis;
  final Stufen stufen;
}

/// Zustand eines Skills für einen bestimmten Hund. Ein Skill ist kein
/// Skalar — der Zustand wird pro Skill × Schwierigkeit geführt
/// (`docs/datenmodell.md`, Abschnitt „Fünf Entscheidungen").
@immutable
class SkillStand {
  const SkillStand({
    required this.hundId,
    required this.skillId,
    required this.status,
    required this.stufen,
    this.historie = const [],
    this.letzteUebungAm,
    this.faelligAm,
    required this.intervallTage,
  });

  final String hundId;
  final String skillId;
  final SkillStatus status;
  final Stufen stufen;

  /// Neuester Eintrag zuletzt.
  final List<HistorienEintrag> historie;

  final DateTime? letzteUebungAm;
  final DateTime? faelligAm;
  final int intervallTage;

  SkillStand kopieMit({
    SkillStatus? status,
    Stufen? stufen,
    List<HistorienEintrag>? historie,
    DateTime? letzteUebungAm,
    DateTime? faelligAm,
    int? intervallTage,
  }) =>
      SkillStand(
        hundId: hundId,
        skillId: skillId,
        status: status ?? this.status,
        stufen: stufen ?? this.stufen,
        historie: historie ?? this.historie,
        letzteUebungAm: letzteUebungAm ?? this.letzteUebungAm,
        faelligAm: faelligAm ?? this.faelligAm,
        intervallTage: intervallTage ?? this.intervallTage,
      );
}
