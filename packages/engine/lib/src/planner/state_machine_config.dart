import 'package:meta/meta.dart';

import '../models/enums.dart';

/// Start value and cap for the spaced-repetition interval of one skill
/// status. In days.
@immutable
class IntervalConfig {
  const IntervalConfig({required this.start, required this.cap});

  final int start;
  final int cap;
}

/// The slice of `content/planer.yaml` the state machine needs (sections
/// `spaced_repetition` and `stufen`). Passed in, not imported (CLAUDE.md,
/// rule 10) — loading the YAML file belongs in the `tool` package, not the
/// engine.
@immutable
class StateMachineConfig {
  const StateMachineConfig({
    required this.increaseAfterSuccesses,
    required this.decreaseAfterFailures,
    required this.order,
    required this.generalizeAtDistraction,
    required this.successFactor,
    required this.intervals,
  });

  /// 3× „succeeded" at the current level raises one dimension.
  final int increaseAfterSuccesses;

  /// 2× „not yet" in a row lowers the active dimension.
  final int decreaseAfterFailures;

  /// Order in which dimensions are raised: duration → distance →
  /// distraction.
  final List<Dimension> order;

  final int generalizeAtDistraction;

  /// Multiplier applied to the interval on „succeeded".
  final double successFactor;

  /// Only for the statuses that have their own row in `content/planer.yaml`:
  /// building, generalizing, consolidated, maintenance.
  final Map<SkillStatus, IntervalConfig> intervals;
}
