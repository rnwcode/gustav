import '../domain/dog.dart';
import '../domain/household.dart';
import '../domain/weekday.dart';

/// UI-only display labels — distinct from `toGerman()`, which produces the
/// snake_case wire values stored in the DB (`0001_init.sql`). Nutzersichtbare
/// Texte, kein Fachvokabular-Wire-Format.
const originLabels = {
  Origin.breeder: 'Züchter',
  Origin.shelter: 'Tierschutz',
  Origin.private: 'Privat',
  Origin.unknown: 'Unbekannt',
};

const breedGroupLabels = {
  BreedGroup.herding: 'Hütehund',
  BreedGroup.hunting: 'Jagdhund',
  BreedGroup.companion: 'Begleithund',
  BreedGroup.livestockGuardian: 'Herdenschutzhund',
  BreedGroup.terrier: 'Terrier',
  BreedGroup.sighthound: 'Windhund',
  BreedGroup.nordic: 'Nordischer Hund',
  BreedGroup.molosser: 'Molosser',
  BreedGroup.mixed: 'Mischling',
};

const sizeClassLabels = {
  SizeClass.small: 'Klein',
  SizeClass.medium: 'Mittel',
  SizeClass.large: 'Groß',
};

const bodyTypeLabels = {
  BodyType.brachycephalic: 'Kurznasig (brachyzephal)',
  BodyType.denseUndercoat: 'Dichte Unterwolle',
  BodyType.longLegged: 'Langbeinig',
};

const restrictionLabels = {
  Restriction.protectiveCare: 'Schonung',
  Restriction.jointIssues: 'Gelenkprobleme',
  Restriction.senior: 'Senior',
  Restriction.recovery: 'Rekonvaleszenz',
};

const housingTypeLabels = {
  HousingType.apartment: 'Wohnung',
  HousingType.houseWithGarden: 'Haus mit Garten',
};

const surroundingsLabels = {
  Surroundings.city: 'Stadt',
  Surroundings.suburb: 'Vorort',
  Surroundings.countryside: 'Land',
};

const experienceLabels = {
  Experience.firstTimeOwner: 'Ersthund',
  Experience.experienced: 'Erfahren',
};

const weekdayLabels = {
  Weekday.monday: 'Mo',
  Weekday.tuesday: 'Di',
  Weekday.wednesday: 'Mi',
  Weekday.thursday: 'Do',
  Weekday.friday: 'Fr',
  Weekday.saturday: 'Sa',
  Weekday.sunday: 'So',
};
