import 'weekday.dart';

enum HousingType { apartment, houseWithGarden }

enum Surroundings { city, suburb, countryside }

enum Experience { firstTimeOwner, experienced }

const _germanByHousingType = {
  HousingType.apartment: 'wohnung',
  HousingType.houseWithGarden: 'haus_garten',
};

const _germanBySurroundings = {
  Surroundings.city: 'stadt',
  Surroundings.suburb: 'vorort',
  Surroundings.countryside: 'land',
};

const _germanByExperience = {
  Experience.firstTimeOwner: 'ersthund',
  Experience.experienced: 'erfahren',
};

extension HousingTypeGerman on HousingType {
  String toGerman() => _germanByHousingType[this]!;
}

extension SurroundingsGerman on Surroundings {
  String toGerman() => _germanBySurroundings[this]!;
}

extension ExperienceGerman on Experience {
  String toGerman() => _germanByExperience[this]!;
}

/// Mirrors the `haushalt` table — one per owner, not per dog (multi-dog
/// households are backlog V2, see `docs/datenmodell.md`).
class Household {
  const Household({
    this.postalCode,
    required this.housingType,
    required this.surroundings,
    required this.experience,
    required this.weekdayTimeBudgetMinutes,
    required this.weekendTimeBudgetMinutes,
    this.trainingDays = const {},
    this.planningDay = Weekday.sunday,
    this.householdSize = 1,
    this.equipment = const [],
  });

  final String? postalCode;
  final HousingType housingType;
  final Surroundings surroundings;
  final Experience experience;
  final int weekdayTimeBudgetMinutes;
  final int weekendTimeBudgetMinutes;
  final Set<Weekday> trainingDays;
  final Weekday planningDay;
  final int householdSize;
  final List<String> equipment;
}
