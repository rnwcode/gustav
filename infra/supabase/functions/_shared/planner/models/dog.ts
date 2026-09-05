import type { BodyType, BreedGroup, Origin, Restriction, SizeClass } from './enums.ts';

/**
 * A dog's stored profile data. `lifeStage` and `heatSensitivity` are
 * deliberately not part of this type: they depend on the current date,
 * which comes in as a parameter everywhere in the repo instead of from the
 * system clock (CLAUDE.md, rule 2). See `dog_derivations.ts`.
 */
export interface Dog {
  readonly id: string;
  readonly name: string;
  readonly birthDate: Date;

  /**
   * For an adult dog from a shelter, settling-in is counted from here, not
   * from birth — „3 years old, home for 2 weeks" behaves like a puppy
   * (`docs/datenmodell.md`).
   */
  readonly arrivalDate: Date;

  readonly origin: Origin;
  readonly breedGroup: BreedGroup;
  readonly sizeClass: SizeClass;
  readonly bodyType: ReadonlySet<BodyType>;
  readonly restrictions: ReadonlySet<Restriction>;
}
