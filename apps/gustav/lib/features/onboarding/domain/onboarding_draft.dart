import 'dog.dart';
import 'household.dart';
import 'weekday.dart';

/// Immutable draft of the onboarding form — filled in step by step via
/// [copyWith], only turned into a [Dog]/[Household] once [isComplete].
class OnboardingDraft {
  const OnboardingDraft({
    this.dogName,
    this.birthDate,
    this.arrivalDate,
    this.origin,
    this.breedGroup,
    this.sizeClass,
    this.bodyType = const {},
    this.restrictions = const {},
    this.postalCode,
    this.housingType,
    this.surroundings,
    this.experience,
    this.weekdayTimeBudgetMinutes,
    this.weekendTimeBudgetMinutes,
    this.trainingDays = const {},
    this.planningDay = Weekday.sunday,
    this.householdSize = 1,
    this.equipment = const [],
  });

  final String? dogName;
  final DateTime? birthDate;
  final DateTime? arrivalDate;
  final Origin? origin;
  final BreedGroup? breedGroup;
  final SizeClass? sizeClass;
  final Set<BodyType> bodyType;
  final Set<Restriction> restrictions;

  final String? postalCode;
  final HousingType? housingType;
  final Surroundings? surroundings;
  final Experience? experience;
  final int? weekdayTimeBudgetMinutes;
  final int? weekendTimeBudgetMinutes;
  final Set<Weekday> trainingDays;
  final Weekday planningDay;
  final int householdSize;
  final List<String> equipment;

  bool get isDogStepComplete =>
      dogName != null &&
      dogName!.trim().isNotEmpty &&
      birthDate != null &&
      arrivalDate != null &&
      origin != null;

  bool get isBreedStepComplete => breedGroup != null && sizeClass != null;

  bool get isHouseholdStepComplete =>
      housingType != null && surroundings != null && experience != null;

  bool get isBudgetStepComplete =>
      weekdayTimeBudgetMinutes != null && weekendTimeBudgetMinutes != null;

  bool get isComplete =>
      isDogStepComplete &&
      isBreedStepComplete &&
      isHouseholdStepComplete &&
      isBudgetStepComplete;

  Dog toDog() {
    return Dog(
      name: dogName!,
      birthDate: birthDate!,
      arrivalDate: arrivalDate!,
      origin: origin!,
      breedGroup: breedGroup!,
      sizeClass: sizeClass!,
      bodyType: bodyType,
      restrictions: restrictions,
    );
  }

  Household toHousehold() {
    return Household(
      postalCode: postalCode,
      housingType: housingType!,
      surroundings: surroundings!,
      experience: experience!,
      weekdayTimeBudgetMinutes: weekdayTimeBudgetMinutes!,
      weekendTimeBudgetMinutes: weekendTimeBudgetMinutes!,
      trainingDays: trainingDays,
      planningDay: planningDay,
      householdSize: householdSize,
      equipment: equipment,
    );
  }

  OnboardingDraft copyWith({
    String? dogName,
    DateTime? birthDate,
    DateTime? arrivalDate,
    Origin? origin,
    BreedGroup? breedGroup,
    SizeClass? sizeClass,
    Set<BodyType>? bodyType,
    Set<Restriction>? restrictions,
    String? postalCode,
    HousingType? housingType,
    Surroundings? surroundings,
    Experience? experience,
    int? weekdayTimeBudgetMinutes,
    int? weekendTimeBudgetMinutes,
    Set<Weekday>? trainingDays,
    Weekday? planningDay,
    int? householdSize,
    List<String>? equipment,
  }) {
    return OnboardingDraft(
      dogName: dogName ?? this.dogName,
      birthDate: birthDate ?? this.birthDate,
      arrivalDate: arrivalDate ?? this.arrivalDate,
      origin: origin ?? this.origin,
      breedGroup: breedGroup ?? this.breedGroup,
      sizeClass: sizeClass ?? this.sizeClass,
      bodyType: bodyType ?? this.bodyType,
      restrictions: restrictions ?? this.restrictions,
      postalCode: postalCode ?? this.postalCode,
      housingType: housingType ?? this.housingType,
      surroundings: surroundings ?? this.surroundings,
      experience: experience ?? this.experience,
      weekdayTimeBudgetMinutes:
          weekdayTimeBudgetMinutes ?? this.weekdayTimeBudgetMinutes,
      weekendTimeBudgetMinutes:
          weekendTimeBudgetMinutes ?? this.weekendTimeBudgetMinutes,
      trainingDays: trainingDays ?? this.trainingDays,
      planningDay: planningDay ?? this.planningDay,
      householdSize: householdSize ?? this.householdSize,
      equipment: equipment ?? this.equipment,
    );
  }
}
