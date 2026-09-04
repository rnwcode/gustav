import type { Dog } from './dog.ts';
import type { LifeStage } from './enums.ts';
import { daysBetween } from '../time.ts';

/**
 * Values derived from `Dog` — never stored, because they depend on the
 * current date. `today` always comes in as a parameter, never from the
 * system clock (CLAUDE.md, rule 2).
 */

export function ageInWeeksAt(dog: Dog, today: Date): number {
  return Math.floor(daysBetween(dog.birthDate, today) / 7);
}

/**
 * `docs/datenmodell.md`, section „hund":
 * puppy (<16 w) | adolescent (<30) | puberty (<70) | adult
 * | senior (large from 312 w, medium 364, small 416).
 *
 * Deliberately independent of `arrivalDate`: an adult dog that just moved
 * in stays biologically an adult — that it behaves „like a puppy" for the
 * first few weeks is handled by the planner's settling-in rule
 * (`content/planer.yaml`, `eingewoehnung_wochen`), not by the life stage.
 */
export function lifeStageAt(dog: Dog, today: Date): LifeStage {
  const ageWeeks = ageInWeeksAt(dog, today);
  if (ageWeeks < 16) return 'puppy';
  if (ageWeeks < 30) return 'adolescent';
  if (ageWeeks < 70) return 'puberty';

  const seniorFromWeeks = { large: 312, medium: 364, small: 416 }[dog.sizeClass];
  return ageWeeks >= seniorFromWeeks ? 'senior' : 'adult';
}

/**
 * `docs/datenmodell.md`: brachycephalic +2, dense undercoat +1, large +1,
 * puppy/senior +1, capped at 3.
 */
export function heatSensitivityAt(dog: Dog, today: Date): number {
  let value = 0;
  if (dog.bodyType.has('brachycephalic')) value += 2;
  if (dog.bodyType.has('denseUndercoat')) value += 1;
  if (dog.sizeClass === 'large') value += 1;

  const stage = lifeStageAt(dog, today);
  if (stage === 'puppy' || stage === 'senior') value += 1;

  return value > 3 ? 3 : value;
}
