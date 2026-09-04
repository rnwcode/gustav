import 'package:meta/meta.dart';

import 'enums.dart';

/// A dog's stored profile data. `lifeStage` and `heatSensitivity` are
/// deliberately not part of this class: they depend on the current date,
/// which comes in as a parameter everywhere in the repo instead of from the
/// system clock (CLAUDE.md, rule 2). See `dog_derivations.dart`.
@immutable
class Dog {
  const Dog({
    required this.id,
    required this.name,
    required this.birthDate,
    required this.arrivalDate,
    required this.origin,
    required this.breedGroup,
    required this.sizeClass,
    this.bodyType = const {},
    this.restrictions = const {},
  });

  final String id;
  final String name;
  final DateTime birthDate;

  /// For an adult dog from a shelter, settling-in is counted from here, not
  /// from birth — „3 years old, home for 2 weeks" behaves like a puppy
  /// (`docs/datenmodell.md`).
  final DateTime arrivalDate;

  final Origin origin;
  final BreedGroup breedGroup;
  final SizeClass sizeClass;
  final Set<BodyType> bodyType;
  final Set<Restriction> restrictions;
}
