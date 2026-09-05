import 'package:supabase_flutter/supabase_flutter.dart';

import '../domain/weekly_plan.dart';

/// A plan already exists for the current period ([wochenplanId]) — the
/// caller decides whether that's fine (nothing to do) or worth surfacing.
class PeriodStillActiveException implements Exception {
  const PeriodStillActiveException(this.wochenplanId);

  final String wochenplanId;
}

/// Talks to the `generate-plan` Edge Function — the only place a new
/// [WeeklyPlan] is produced (CLAUDE.md, Regel 9/10: never computed
/// client-side, never recomputed on open).
class PlanRepository {
  PlanRepository(this._client);

  final SupabaseClient _client;

  Future<WeeklyPlan> generatePlan(String dogId) async {
    try {
      final response = await _client.functions.invoke(
        'generate-plan',
        body: {'hundId': dogId},
      );
      return WeeklyPlan.fromGeneratePlanResponse(
        response.data as Map<String, dynamic>,
      );
    } on FunctionException catch (e) {
      final details = e.details;
      if (e.status == 409 &&
          details is Map &&
          details['wochenplanId'] is String) {
        throw PeriodStillActiveException(details['wochenplanId'] as String);
      }
      rethrow;
    }
  }

  /// Reads a plan already stored for the current period straight from the
  /// DB — used after [PeriodStillActiveException]. `titel`/`satz` are not
  /// persisted (they come from the content catalog at generation time,
  /// `generate-plan/index.ts`), so this reads dates and reasons only; a
  /// full offline redisplay needs the locally cached generate-plan
  /// response instead (not yet built, see apps/README.md).
  Future<WeeklyPlan> fetchStoredPlan(String wochenplanId) async {
    final planRow = await _client
        .from('wochenplan')
        .select('id, periode_start, periode_ende')
        .eq('id', wochenplanId)
        .single();
    final slotRows = await _client
        .from('slot')
        .select(
          'datum, aktivitaet_id, begruendung_art, begruendung_skill_id, begruendung_bedarfsdimension',
        )
        .eq('wochenplan_id', wochenplanId)
        .order('datum');

    return WeeklyPlan(
      id: planRow['id'] as String,
      periodStart: DateTime.parse(planRow['periode_start'] as String),
      periodEnd: DateTime.parse(planRow['periode_ende'] as String),
      slots: (slotRows as List<dynamic>).map((row) {
        final map = row as Map<String, dynamic>;
        return PlanSlot(
          date: DateTime.parse(map['datum'] as String),
          activityId: map['aktivitaet_id'] as String?,
          title: null,
          sentence: null,
          reason: PlanReason(
            kind: reasonKindFromGerman(map['begruendung_art'] as String),
            skillId: map['begruendung_skill_id'] as String?,
            needDimension: map['begruendung_bedarfsdimension'] as String?,
          ),
        );
      }).toList(),
    );
  }
}
