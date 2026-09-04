import 'package:meta/meta.dart';

import '../models/enums.dart';

/// Start- und Deckelwert für die Spaced-Repetition-Intervalle eines
/// Skill-Status. Angaben in Tagen.
@immutable
class IntervallKonfig {
  const IntervallKonfig({required this.start, required this.deckel});

  final int start;
  final int deckel;
}

/// Der Ausschnitt aus `content/planer.yaml`, den der Zustandsautomat
/// braucht (Abschnitte `spaced_repetition` und `stufen`). Wird hineingereicht,
/// nicht importiert (CLAUDE.md, Regel 10) — das Laden der YAML-Datei
/// gehört ins `tool/`-Paket, nicht in die Engine.
@immutable
class ZustandsautomatKonfig {
  const ZustandsautomatKonfig({
    required this.erhoehenNachErfolgen,
    required this.senkenNachMisserfolgen,
    required this.reihenfolge,
    required this.generalisierungAbAblenkung,
    required this.faktorBeiErfolg,
    required this.intervalle,
  });

  /// 3× „klappte" auf der Stufe erhöht ein D.
  final int erhoehenNachErfolgen;

  /// 2× „noch nicht" in Folge senkt das aktive D.
  final int senkenNachMisserfolgen;

  /// Reihenfolge, in der die Dimensionen erhöht werden: Dauer → Distanz →
  /// Ablenkung.
  final List<Dimension> reihenfolge;

  final int generalisierungAbAblenkung;

  /// Multiplikator auf das Intervall bei „klappte".
  final double faktorBeiErfolg;

  /// Nur für die Status mit eigener Zeile in `content/planer.yaml`:
  /// aufbau, generalisierung, gefestigt, erhaltung.
  final Map<SkillStatus, IntervallKonfig> intervalle;
}
