import 'package:meta/meta.dart';

import '../models/enums.dart';

/// The slice of `content/planer.yaml` the load budget needs (sections
/// `belastbarkeit_pro_tag`, `einschraenkung_deckel` and `erholungsbedarf`).
/// Passed in, not imported (CLAUDE.md, rule 10).
@immutable
class LoadBudgetConfig {
  const LoadBudgetConfig({
    required this.capacityPerDay,
    required this.restrictionCap,
    required this.recoveryNeedMediumFrom,
    required this.recoveryNeedHighFrom,
  });

  final Map<LifeStage, double> capacityPerDay;

  /// Only restrictions that cap capacity have an entry here — others (e.g.
  /// `jointIssues`, `senior`) act elsewhere in the planner (filtering).
  final Map<Restriction, double> restrictionCap;

  final double recoveryNeedMediumFrom;
  final double recoveryNeedHighFrom;
}
