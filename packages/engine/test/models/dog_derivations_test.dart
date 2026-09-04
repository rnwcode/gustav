import 'package:engine/engine.dart';
import 'package:test/test.dart';

void main() {
  Dog dog({
    DateTime? birthDate,
    DateTime? arrivalDate,
    SizeClass sizeClass = SizeClass.medium,
    Set<BodyType> bodyType = const {},
  }) =>
      Dog(
        id: 'dog1',
        name: 'Test Dog',
        birthDate: birthDate ?? DateTime(2026, 1, 1),
        arrivalDate: arrivalDate ?? birthDate ?? DateTime(2026, 1, 1),
        origin: Origin.breeder,
        breedGroup: BreedGroup.herding,
        sizeClass: sizeClass,
        bodyType: bodyType,
      );

  group('lifeStageAt', () {
    test('is puppy under 16 weeks', () {
      final d = dog(birthDate: DateTime(2026, 1, 1));
      final today = DateTime(2026, 1, 1).add(const Duration(days: 10 * 7));
      expect(lifeStageAt(d, today), LifeStage.puppy);
    });

    test('is adolescent from 16 up to under 30 weeks', () {
      final d = dog(birthDate: DateTime(2026, 1, 1));
      final today = DateTime(2026, 1, 1).add(const Duration(days: 20 * 7));
      expect(lifeStageAt(d, today), LifeStage.adolescent);
    });

    test('is puberty from 30 up to under 70 weeks', () {
      final d = dog(birthDate: DateTime(2026, 1, 1));
      final today = DateTime(2026, 1, 1).add(const Duration(days: 50 * 7));
      expect(lifeStageAt(d, today), LifeStage.puberty);
    });

    test('medium size becomes senior at 364 weeks, adult before that', () {
      final d =
          dog(birthDate: DateTime(2020, 1, 1), sizeClass: SizeClass.medium);
      final justBefore =
          DateTime(2020, 1, 1).add(const Duration(days: 363 * 7));
      final exactly = DateTime(2020, 1, 1).add(const Duration(days: 364 * 7));
      expect(lifeStageAt(d, justBefore), LifeStage.adult);
      expect(lifeStageAt(d, exactly), LifeStage.senior);
    });

    test('large dogs become senior earlier than small ones', () {
      final large =
          dog(birthDate: DateTime(2020, 1, 1), sizeClass: SizeClass.large);
      final small =
          dog(birthDate: DateTime(2020, 1, 1), sizeClass: SizeClass.small);
      final today = DateTime(2020, 1, 1).add(const Duration(days: 320 * 7));
      expect(lifeStageAt(large, today), LifeStage.senior);
      expect(lifeStageAt(small, today), LifeStage.adult);
    });
  });

  group('heatSensitivityAt', () {
    test('an unremarkable adult dog has 0', () {
      final d = dog(birthDate: DateTime(2020, 1, 1));
      final today = DateTime(2020, 1, 1).add(const Duration(days: 200 * 7));
      expect(heatSensitivityAt(d, today), 0);
    });

    test('brachycephalic gives +2', () {
      final d = dog(
          birthDate: DateTime(2020, 1, 1), bodyType: {BodyType.brachycephalic});
      final today = DateTime(2020, 1, 1).add(const Duration(days: 200 * 7));
      expect(heatSensitivityAt(d, today), 2);
    });

    test('brachycephalic plus dense undercoat plus puppy is capped at 3', () {
      final d = dog(
        birthDate: DateTime(2026, 1, 1),
        bodyType: {BodyType.brachycephalic, BodyType.denseUndercoat},
      );
      final today = DateTime(2026, 1, 1).add(const Duration(days: 10 * 7));
      expect(heatSensitivityAt(d, today), 3);
    });

    test('large gives +1', () {
      final d =
          dog(birthDate: DateTime(2020, 1, 1), sizeClass: SizeClass.large);
      final today = DateTime(2020, 1, 1).add(const Duration(days: 200 * 7));
      expect(heatSensitivityAt(d, today), 1);
    });
  });
}
