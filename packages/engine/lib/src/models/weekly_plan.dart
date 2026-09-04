import 'package:meta/meta.dart';

import 'enums.dart';

/// Machine-readable reason a slot was assigned what it was — every output
/// knows its reason, or the explaining sentence (planner step 8) could not
/// be written honestly (`docs/datenmodell.md`, section „Fünf
/// Entscheidungen").
@immutable
class Reason {
  const Reason({required this.kind, this.skillId, this.needDimension});

  final ReasonKind kind;
  final String? skillId;
  final NeedDimension? needDimension;
}

/// One day's slot. Deliberately allowed to be empty — that is a valid
/// outcome, not a gap (`docs/produkt.md`).
@immutable
class Slot {
  const Slot(
      {required this.date,
      this.activityId,
      required this.reason,
      this.outcome});

  final DateTime date;

  /// `null` for a deliberately empty day.
  final String? activityId;

  final Reason reason;
  final Outcome? outcome;
}

/// A period's plan: generated once, then stored — never recomputed on every
/// open (CLAUDE.md, rule 10). `algorithmVersion` and `configVersion` are
/// stored alongside so a later config change never silently rewrites a
/// period already handed to the owner.
@immutable
class WeeklyPlan {
  const WeeklyPlan({
    required this.dogId,
    required this.periodStart,
    required this.periodEnd,
    required this.algorithmVersion,
    required this.configVersion,
    required this.slots,
  });

  final String dogId;
  final DateTime periodStart;
  final DateTime periodEnd;
  final int algorithmVersion;
  final int configVersion;
  final List<Slot> slots;
}
