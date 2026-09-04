import 'package:meta/meta.dart';

/// The slice of `content/planer.yaml` day-by-day assignment needs
/// (sections `phasen` and `belastungsregeln`). Passed in, not imported
/// (CLAUDE.md, rule 10).
@immutable
class AssignmentConfig {
  const AssignmentConfig({
    required this.maxActiveSlots,
    required this.maxTrainingSlots,
    required this.minEmptySlots,
    required this.heavyArousalThreshold,
    required this.maxArousalThreshold,
  });

  /// `phasen[lifeStage].aktive_slots`.
  final int maxActiveSlots;

  /// `phasen[lifeStage].training`.
  final int maxTrainingSlots;

  /// 1 normally, 2 at `RecoveryNeed.high` — resolved by the caller, since
  /// this function does not know about recovery need.
  final int minEmptySlots;

  /// `belastungsregeln.nach_belastung_ab`. Serves two rules that share the
  /// same „that was demanding" threshold: only rest/enrichment the day
  /// after, and no placement on the period's shortest day.
  final int heavyArousalThreshold;

  /// `belastungsregeln.nie_zwei_tage_in_folge_belastung`.
  final int maxArousalThreshold;
}
