import 'package:meta/meta.dart';

/// The slice of `content/planer.yaml` scoring needs (section `gewichte`
/// plus `kuerzlich_gemacht_tage`). Passed in, not imported (CLAUDE.md,
/// rule 10). `arousalAtRecoveryNeedWeight` and `recentlyDoneWeight` are
/// already negative in the YAML — see `docs/specs/scoren.md`, „Zu den
/// Vorzeichen".
@immutable
class ScoringConfig {
  const ScoringConfig({
    required this.priorityWeight,
    required this.overdueWeight,
    required this.overdueCap,
    required this.needGapWeight,
    required this.newSkillWeight,
    required this.suitabilityWeight,
    required this.arousalAtRecoveryNeedWeight,
    required this.recentlyDoneWeight,
    required this.recentlyDoneDays,
  });

  final double priorityWeight;
  final double overdueWeight;
  final double overdueCap;
  final double needGapWeight;
  final double newSkillWeight;
  final double suitabilityWeight;
  final double arousalAtRecoveryNeedWeight;
  final double recentlyDoneWeight;
  final int recentlyDoneDays;
}
