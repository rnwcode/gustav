import 'package:supabase_flutter/supabase_flutter.dart';

import '../domain/dog.dart';
import '../domain/household.dart';
import '../domain/weekday.dart';

/// Talks to the `hund`/`haushalt` tables directly (CLAUDE.md: the app holds
/// no planner logic, only data access) — `besitzer` is never sent, the
/// column default (`auth.uid()`, `0001_init.sql`) fills it in server-side.
class OnboardingRepository {
  OnboardingRepository(this._client);

  final SupabaseClient _client;

  String _formatDate(DateTime date) {
    return '${date.year.toString().padLeft(4, '0')}-'
        '${date.month.toString().padLeft(2, '0')}-'
        '${date.day.toString().padLeft(2, '0')}';
  }

  /// The signed-in owner's dog id, or `null` if none exists yet — RLS
  /// already scopes the query to `auth.uid()`.
  Future<String?> findExistingDogId() async {
    final row = await _client.from('hund').select('id').maybeSingle();
    return row?['id'] as String?;
  }

  Future<String> createDog(Dog dog) async {
    final row = await _client
        .from('hund')
        .insert({
          'name': dog.name,
          'geburtsdatum': _formatDate(dog.birthDate),
          'einzugsdatum': _formatDate(dog.arrivalDate),
          'herkunft': dog.origin.toGerman(),
          'rassegruppe': dog.breedGroup.toGerman(),
          'groessenklasse': dog.sizeClass.toGerman(),
          'koerperbau': dog.bodyType.map((e) => e.toGerman()).toList(),
          'einschraenkungen': dog.restrictions
              .map((e) => e.toGerman())
              .toList(),
        })
        .select('id')
        .single();
    return row['id'] as String;
  }

  Future<void> createHousehold(Household household) async {
    await _client.from('haushalt').insert({
      'plz': household.postalCode,
      'wohnsituation': household.housingType.toGerman(),
      'umgebung': household.surroundings.toGerman(),
      'erfahrung': household.experience.toGerman(),
      'zeitbudget_werktag_min': household.weekdayTimeBudgetMinutes,
      'zeitbudget_wochenende_min': household.weekendTimeBudgetMinutes,
      'trainingstage': household.trainingDays.map((e) => e.toGerman()).toList(),
      'planungstag': household.planningDay.toGerman(),
      'personen': household.householdSize,
      'equipment': household.equipment,
    });
  }
}
