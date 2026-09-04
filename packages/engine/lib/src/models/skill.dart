import 'package:meta/meta.dart';

import 'enums.dart';
import 'stufen.dart';

/// Etwas, das der Hund lernen kann. Schwierigkeit ist dreidimensional
/// (Dauer, Distanz, Ablenkung) — Inhalt aus `content/skills/*.yaml`, siehe
/// `content/schema/skill.yaml`.
@immutable
class Skill {
  const Skill({
    required this.id,
    required this.name,
    required this.kategorie,
    this.voraussetzungen = const [],
    required this.minAlterWochen,
    required this.istKernskill,
    required this.zielstufen,
    required this.beschreibung,
  });

  final String id;
  final String name;
  final SkillKategorie kategorie;

  /// Skill-IDs, die mindestens Status `generalisierung` haben müssen.
  final List<String> voraussetzungen;

  final int minAlterWochen;

  /// Kernskills unterliegen keiner Sperrfrist — Grundsignale brauchen
  /// Wiederholung (`docs/datenmodell.md`, Abschnitt Aktivität).
  final bool istKernskill;

  final Stufen zielstufen;
  final String beschreibung;
}
