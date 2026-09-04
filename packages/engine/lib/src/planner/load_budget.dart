import 'package:meta/meta.dart';

import '../models/enums.dart';
import 'load_budget_config.dart';

/// The rolling load balance — see `docs/specs/belastungsbudget.md`.
@immutable
class LoadBudget {
  const LoadBudget({required this.quote, required this.recoveryNeed});

  final double quote;
  final RecoveryNeed recoveryNeed;
}

/// Evaluates the rolling load budget from seven days of already-resolved
/// daily loads. Pure function — how a daily load is derived from `Slot`,
/// `Activity.arousal` and `Outcome` is the caller's job, not this
/// function's (see the spec's „Nicht dazu gehört").
LoadBudget evaluateLoadBudget({
  required List<int> loadOverLastSevenDays,
  required LifeStage lifeStage,
  required Set<Restriction> restrictions,
  required LoadBudgetConfig config,
}) {
  assert(
    loadOverLastSevenDays.length == 7,
    'evaluateLoadBudget expects exactly 7 days, got ${loadOverLastSevenDays.length}',
  );

  var capacity = config.capacityPerDay[lifeStage]!;
  for (final restriction in restrictions) {
    final cap = config.restrictionCap[restriction];
    if (cap != null && cap < capacity) capacity = cap;
  }

  final totalLoad = loadOverLastSevenDays.fold(0, (sum, day) => sum + day);
  final quote = totalLoad / 7 / capacity;

  final recoveryNeed = quote >= config.recoveryNeedHighFrom
      ? RecoveryNeed.high
      : quote >= config.recoveryNeedMediumFrom
          ? RecoveryNeed.medium
          : RecoveryNeed.none;

  return LoadBudget(quote: quote, recoveryNeed: recoveryNeed);
}
