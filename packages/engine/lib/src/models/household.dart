import 'package:meta/meta.dart';

import 'enums.dart';

/// The circumstances of the household the dog lives in.
@immutable
class Household {
  const Household({
    required this.id,
    this.postalCode,
    required this.housingType,
    required this.surroundings,
    required this.experience,
    required this.weekdayTimeBudget,
    required this.weekendTimeBudget,
    required this.trainingDays,
    required this.planningDay,
    this.householdSize = 1,
    this.equipment = const [],
  });

  final String id;

  /// Only for weather — no GPS (`docs/datenmodell.md`).
  final String? postalCode;

  final HousingType housingType;
  final Surroundings surroundings;
  final Experience experience;

  final Duration weekdayTimeBudget;
  final Duration weekendTimeBudget;

  final Set<Weekday> trainingDays;

  /// Defaults to Sunday, changeable — e.g. for shift work.
  final Weekday planningDay;

  /// Multiple people training the same dog is a consistency problem, not a
  /// bonus.
  final int householdSize;

  final List<String> equipment;
}
