import 'package:flutter_test/flutter_test.dart';
import 'package:gustav/features/onboarding/domain/dog.dart';
import 'package:gustav/features/onboarding/domain/household.dart';
import 'package:gustav/features/onboarding/domain/onboarding_draft.dart';

void main() {
  test('a fresh draft is incomplete', () {
    expect(const OnboardingDraft().isComplete, isFalse);
  });

  test('a draft with all required fields set is complete', () {
    final draft = const OnboardingDraft().copyWith(
      dogName: 'Gustav',
      birthDate: DateTime(2023, 1, 1),
      arrivalDate: DateTime(2023, 1, 15),
      origin: Origin.breeder,
      breedGroup: BreedGroup.herding,
      sizeClass: SizeClass.medium,
      housingType: HousingType.apartment,
      surroundings: Surroundings.city,
      experience: Experience.firstTimeOwner,
      weekdayTimeBudgetMinutes: 20,
      weekendTimeBudgetMinutes: 45,
    );

    expect(draft.isComplete, isTrue);
    expect(draft.toDog().name, 'Gustav');
    expect(draft.toHousehold().housingType, HousingType.apartment);
  });

  test('optional fields do not affect completeness', () {
    final draft = const OnboardingDraft().copyWith(
      dogName: 'Gustav',
      birthDate: DateTime(2023, 1, 1),
      arrivalDate: DateTime(2023, 1, 15),
      origin: Origin.unknown,
      breedGroup: BreedGroup.mixed,
      sizeClass: SizeClass.small,
      housingType: HousingType.houseWithGarden,
      surroundings: Surroundings.countryside,
      experience: Experience.experienced,
      weekdayTimeBudgetMinutes: 10,
      weekendTimeBudgetMinutes: 30,
    );

    expect(draft.postalCode, isNull);
    expect(draft.bodyType, isEmpty);
    expect(draft.isComplete, isTrue);
  });
}
