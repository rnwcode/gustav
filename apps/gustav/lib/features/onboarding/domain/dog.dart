/// Where the dog came from. German wire values match `hund.herkunft`
/// (`infra/supabase/migrations/0001_init.sql`) and `content/schema/*.yaml`.
enum Origin { breeder, shelter, private, unknown }

enum BreedGroup {
  herding,
  hunting,
  companion,
  livestockGuardian,
  terrier,
  sighthound,
  nordic,
  molosser,
  mixed,
}

enum SizeClass { small, medium, large }

enum BodyType { brachycephalic, denseUndercoat, longLegged }

enum Restriction { protectiveCare, jointIssues, senior, recovery }

const _germanByOrigin = {
  Origin.breeder: 'zuechter',
  Origin.shelter: 'tierschutz',
  Origin.private: 'privat',
  Origin.unknown: 'unbekannt',
};

const _germanByBreedGroup = {
  BreedGroup.herding: 'huete',
  BreedGroup.hunting: 'jagd',
  BreedGroup.companion: 'begleit',
  BreedGroup.livestockGuardian: 'herdenschutz',
  BreedGroup.terrier: 'terrier',
  BreedGroup.sighthound: 'wind',
  BreedGroup.nordic: 'nordisch',
  BreedGroup.molosser: 'molosser',
  BreedGroup.mixed: 'misch',
};

const _germanBySizeClass = {
  SizeClass.small: 'klein',
  SizeClass.medium: 'mittel',
  SizeClass.large: 'gross',
};

const _germanByBodyType = {
  BodyType.brachycephalic: 'brachyzephal',
  BodyType.denseUndercoat: 'dichte_unterwolle',
  BodyType.longLegged: 'langbeinig',
};

const _germanByRestriction = {
  Restriction.protectiveCare: 'schonung',
  Restriction.jointIssues: 'gelenke',
  Restriction.senior: 'senior',
  Restriction.recovery: 'rekonvaleszenz',
};

extension OriginGerman on Origin {
  String toGerman() => _germanByOrigin[this]!;
}

extension BreedGroupGerman on BreedGroup {
  String toGerman() => _germanByBreedGroup[this]!;
}

extension SizeClassGerman on SizeClass {
  String toGerman() => _germanBySizeClass[this]!;
}

extension BodyTypeGerman on BodyType {
  String toGerman() => _germanByBodyType[this]!;
}

extension RestrictionGerman on Restriction {
  String toGerman() => _germanByRestriction[this]!;
}

/// A dog's stored profile — mirrors the `hund` table. `lifeStage` and
/// `heatSensitivity` are deliberately absent: they're derived server-side
/// from `birthDate`/`today` (`_shared/planner/models/dog_derivations.ts`),
/// never stored, and the app has no time logic of its own (CLAUDE.md, rule 2).
class Dog {
  const Dog({
    required this.name,
    required this.birthDate,
    required this.arrivalDate,
    required this.origin,
    required this.breedGroup,
    required this.sizeClass,
    this.bodyType = const {},
    this.restrictions = const {},
  });

  final String name;
  final DateTime birthDate;
  final DateTime arrivalDate;
  final Origin origin;
  final BreedGroup breedGroup;
  final SizeClass sizeClass;
  final Set<BodyType> bodyType;
  final Set<Restriction> restrictions;
}
