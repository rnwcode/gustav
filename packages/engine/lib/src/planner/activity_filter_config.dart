import 'package:meta/meta.dart';

import '../models/enums.dart';

/// The slice of `content/planer.yaml` hard filtering needs (section
/// `belastungsregeln`, plus a restriction-arousal rule not yet named in
/// the content schema — see `docs/specs/hart-filtern.md`, „Offene
/// Fragen"). Passed in, not imported (CLAUDE.md, rule 10).
@immutable
class ActivityFilterConfig {
  const ActivityFilterConfig({
    required this.settlingInWeeks,
    required this.settlingInMaxArousal,
    required this.settlingInMaxDistraction,
    required this.restrictionArousalCeiling,
  });

  /// `eingewoehnung_wochen`.
  final int settlingInWeeks;

  /// `eingewoehnung_max_belastung`.
  final int settlingInMaxArousal;

  /// `eingewoehnung_max_ablenkung`.
  final int settlingInMaxDistraction;

  /// A restriction excludes activities whose `arousal` is at or above this
  /// ceiling — e.g. `protectiveCare`/`recovery` at 2
  /// (`docs/datenmodell.md`: „Schonung schließt Belastung ≥ 2 aus").
  final Map<Restriction, int> restrictionArousalCeiling;
}
