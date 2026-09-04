import 'dog.dart';
import 'enums.dart';

/// Values derived from [Dog] — never stored, because they depend on the
/// current date. `today` always comes in as a parameter, never from the
/// system clock (CLAUDE.md, rule 2).

int ageInWeeksAt(Dog dog, DateTime today) =>
    today.difference(dog.birthDate).inDays ~/ 7;

/// `docs/datenmodell.md`, section „hund":
/// puppy (<16 w) | adolescent (<30) | puberty (<70) | adult
/// | senior (large from 312 w, medium 364, small 416).
///
/// Deliberately independent of `arrivalDate`: an adult dog that just moved
/// in stays biologically an adult — that it behaves „like a puppy" for the
/// first few weeks is handled by the planner's settling-in rule
/// (`content/planer.yaml`, `eingewoehnung_wochen`), not by the life stage.
LifeStage lifeStageAt(Dog dog, DateTime today) {
  final ageWeeks = ageInWeeksAt(dog, today);
  if (ageWeeks < 16) return LifeStage.puppy;
  if (ageWeeks < 30) return LifeStage.adolescent;
  if (ageWeeks < 70) return LifeStage.puberty;

  final seniorFromWeeks = switch (dog.sizeClass) {
    SizeClass.large => 312,
    SizeClass.medium => 364,
    SizeClass.small => 416,
  };
  return ageWeeks >= seniorFromWeeks ? LifeStage.senior : LifeStage.adult;
}

/// `docs/datenmodell.md`: brachycephalic +2, dense undercoat +1, large +1,
/// puppy/senior +1, capped at 3.
int heatSensitivityAt(Dog dog, DateTime today) {
  var value = 0;
  if (dog.bodyType.contains(BodyType.brachycephalic)) value += 2;
  if (dog.bodyType.contains(BodyType.denseUndercoat)) value += 1;
  if (dog.sizeClass == SizeClass.large) value += 1;

  final stage = lifeStageAt(dog, today);
  if (stage == LifeStage.puppy || stage == LifeStage.senior) value += 1;

  return value > 3 ? 3 : value;
}
