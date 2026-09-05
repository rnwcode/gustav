import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../app/supabase_providers.dart';
import '../domain/weekly_plan.dart';
import 'plan_repository.dart';

final planRepositoryProvider = Provider<PlanRepository>((ref) {
  return PlanRepository(ref.watch(supabaseClientProvider));
});

/// Fetches the current period's plan for [dogId] — generates one if none
/// exists yet, or reads the one already stored if the period is still
/// active (`PeriodStillActiveException`).
final currentPlanProvider = FutureProvider.autoDispose
    .family<WeeklyPlan, String>((ref, dogId) async {
      final repository = ref.watch(planRepositoryProvider);
      try {
        return await repository.generatePlan(dogId);
      } on PeriodStillActiveException catch (e) {
        return repository.fetchStoredPlan(e.wochenplanId);
      }
    });
