import 'package:meta/meta.dart';

import 'enums.dart';

/// Die zweite Währung: wie sehr eine Aktivität die fünf Bedarfsdimensionen
/// deckt, je 0–3 (`docs/datenmodell.md`, Abschnitt „Fünf Entscheidungen").
@immutable
class Bedarf {
  const Bedarf({
    required this.koerperlich,
    required this.kopfarbeit,
    required this.nase,
    required this.sozial,
    required this.erholung,
  });

  final int koerperlich;
  final int kopfarbeit;
  final int nase;
  final int sozial;
  final int erholung;

  int operator [](BedarfDimension d) => switch (d) {
        BedarfDimension.koerperlich => koerperlich,
        BedarfDimension.kopfarbeit => kopfarbeit,
        BedarfDimension.nase => nase,
        BedarfDimension.sozial => sozial,
        BedarfDimension.erholung => erholung,
      };
}

@immutable
class TroubleshootingEintrag {
  const TroubleshootingEintrag({required this.problem, required this.antwort});

  final String problem;
  final String antwort;
}

/// Alles, was in einem Tages-Slot landen kann: Trainingseinheit, Suchspiel,
/// Alltagsroutine, Ruhevorschlag. Nicht jede Aktivität trainiert einen
/// Skill. Inhalt aus `content/aktivitaeten/*.yaml`, siehe
/// `content/schema/aktivitaet.yaml`.
@immutable
class Aktivitaet {
  const Aktivitaet({
    required this.id,
    required this.titel,
    required this.satz,
    required this.typ,
    this.trainiertSkill,
    required this.bedarf,
    required this.belastung,
    required this.dauerMin,
    required this.dauerMax,
    required this.ort,
    this.fuerAblenkung,
    required this.istAuffrischung,
    required this.hitzetauglich,
    required this.regentauglich,
    required this.dunkeltauglich,
    required this.gelenkbelastend,
    this.saisonfenster,
    this.equipment = const [],
    required this.zweitePerson,
    required this.minAlterWochen,
    this.maxAlterWochen,
    this.eignung = const {},
    required this.varianzgruppe,
    required this.sperrfristTage,
    this.illustration,
    this.anleitung = const [],
    required this.erfolgskriterium,
    this.haeufigeFehler = const [],
    this.troubleshooting = const [],
  });

  final String id;
  final String titel;

  /// DER Satz für die Tagesansicht, ein bis zwei Zeilen.
  final String satz;

  final AktivitaetTyp typ;

  /// `null` bei Beschäftigung.
  final String? trainiertSkill;

  final Bedarf bedarf;

  /// 0–3, wie viel Erregung danach übrig bleibt.
  final int belastung;

  final int dauerMin;
  final int dauerMax;
  final Ort ort;

  /// Nur bei `typ == training`: passende Ablenkungsstufen als [min, max].
  final (int, int)? fuerAblenkung;

  final bool istAuffrischung;

  final bool hitzetauglich;
  final bool regentauglich;
  final bool dunkeltauglich;
  final bool gelenkbelastend;

  /// z. B. `[10, 11, 12]` für Silvestervorbereitung.
  final List<int>? saisonfenster;

  final List<String> equipment;
  final bool zweitePerson;
  final int minAlterWochen;
  final int? maxAlterWochen;

  /// Gewichtet, filtert NIE hart (`docs/datenmodell.md`).
  final Map<Rassegruppe, int> eignung;

  /// Die Sperrfrist hängt an der Varianzgruppe, nicht an der Aktivität —
  /// Grundsignale brauchen Wiederholung, Beschäftigung nicht.
  final String varianzgruppe;
  final int sperrfristTage;

  final String? illustration;
  final List<String> anleitung;
  final String erfolgskriterium;
  final List<String> haeufigeFehler;
  final List<TroubleshootingEintrag> troubleshooting;
}
