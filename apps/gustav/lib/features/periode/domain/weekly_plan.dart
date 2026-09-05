/// Why a day looks the way it does — mirrors `Reason`
/// (`_shared/planner/models/weekly_plan.ts`) and `slot.begruendung_*`
/// (`0001_init.sql`). German wire values, matching the DB check constraint.
enum ReasonKind { empty, newSkill, due, priority, needGap, recoveryNeeded }

const _reasonKindByGerman = {
  'leer': ReasonKind.empty,
  'neuer_skill': ReasonKind.newSkill,
  'faellig': ReasonKind.due,
  'prioritaet': ReasonKind.priority,
  'bedarfsluecke': ReasonKind.needGap,
  'erholungsbedarf': ReasonKind.recoveryNeeded,
};

ReasonKind reasonKindFromGerman(String value) {
  final kind = _reasonKindByGerman[value];
  if (kind == null) throw ArgumentError('unknown reason kind: $value');
  return kind;
}

class PlanReason {
  const PlanReason({required this.kind, this.skillId, this.needDimension});

  final ReasonKind kind;
  final String? skillId;
  final String? needDimension;

  factory PlanReason.fromJson(Map<String, dynamic> json) {
    return PlanReason(
      kind: reasonKindFromGerman(json['kind'] as String),
      skillId: json['skillId'] as String?,
      needDimension: json['needDimension'] as String?,
    );
  }
}

/// One day of the plan. `activityId == null` is a deliberately empty day —
/// not missing data (docs/datenmodell.md, „Fünf Entscheidungen").
class PlanSlot {
  const PlanSlot({
    required this.date,
    required this.activityId,
    required this.title,
    required this.sentence,
    required this.reason,
  });

  final DateTime date;
  final String? activityId;
  final String? title;
  final String? sentence;
  final PlanReason reason;

  bool get isEmpty => activityId == null;

  factory PlanSlot.fromJson(Map<String, dynamic> json) {
    return PlanSlot(
      date: DateTime.parse(json['datum'] as String),
      activityId: json['aktivitaetId'] as String?,
      title: json['titel'] as String?,
      sentence: json['satz'] as String?,
      reason: PlanReason.fromJson(json['begruendung'] as Map<String, dynamic>),
    );
  }
}

/// One generated period — stored once, never recomputed on open
/// (CLAUDE.md, Regel 10).
class WeeklyPlan {
  const WeeklyPlan({
    required this.id,
    required this.periodStart,
    required this.periodEnd,
    required this.slots,
  });

  final String id;
  final DateTime periodStart;
  final DateTime periodEnd;
  final List<PlanSlot> slots;

  factory WeeklyPlan.fromGeneratePlanResponse(Map<String, dynamic> json) {
    return WeeklyPlan(
      id: json['wochenplanId'] as String,
      periodStart: DateTime.parse(json['periodeStart'] as String),
      periodEnd: DateTime.parse(json['periodeEnde'] as String),
      slots: (json['slots'] as List<dynamic>)
          .map((slot) => PlanSlot.fromJson(slot as Map<String, dynamic>))
          .toList(),
    );
  }
}
