import { assertEquals } from '../dev_deps.ts';
import type { BodyType, SizeClass } from './enums.ts';
import type { Dog } from './dog.ts';
import { heatSensitivityAt, lifeStageAt } from './dog_derivations.ts';

function dog(overrides: {
  birthDate?: Date;
  arrivalDate?: Date;
  sizeClass?: SizeClass;
  bodyType?: Set<BodyType>;
}): Dog {
  const birthDate = overrides.birthDate ?? new Date(2026, 0, 1);
  return {
    id: 'dog1',
    name: 'Test Dog',
    birthDate,
    arrivalDate: overrides.arrivalDate ?? birthDate,
    origin: 'breeder',
    breedGroup: 'herding',
    sizeClass: overrides.sizeClass ?? 'medium',
    bodyType: overrides.bodyType ?? new Set(),
    restrictions: new Set(),
  };
}

function daysAfter(date: Date, days: number): Date {
  return new Date(date.getTime() + days * 24 * 60 * 60 * 1000);
}

Deno.test('lifeStageAt is puppy under 16 weeks', () => {
  const d = dog({ birthDate: new Date(2026, 0, 1) });
  const today = daysAfter(new Date(2026, 0, 1), 10 * 7);
  assertEquals(lifeStageAt(d, today), 'puppy');
});

Deno.test('lifeStageAt is adolescent from 16 up to under 30 weeks', () => {
  const d = dog({ birthDate: new Date(2026, 0, 1) });
  const today = daysAfter(new Date(2026, 0, 1), 20 * 7);
  assertEquals(lifeStageAt(d, today), 'adolescent');
});

Deno.test('lifeStageAt is puberty from 30 up to under 70 weeks', () => {
  const d = dog({ birthDate: new Date(2026, 0, 1) });
  const today = daysAfter(new Date(2026, 0, 1), 50 * 7);
  assertEquals(lifeStageAt(d, today), 'puberty');
});

Deno.test('lifeStageAt: medium size becomes senior at 364 weeks, adult before that', () => {
  const d = dog({ birthDate: new Date(2020, 0, 1), sizeClass: 'medium' });
  const justBefore = daysAfter(new Date(2020, 0, 1), 363 * 7);
  const exactly = daysAfter(new Date(2020, 0, 1), 364 * 7);
  assertEquals(lifeStageAt(d, justBefore), 'adult');
  assertEquals(lifeStageAt(d, exactly), 'senior');
});

Deno.test('lifeStageAt: large dogs become senior earlier than small ones', () => {
  const large = dog({ birthDate: new Date(2020, 0, 1), sizeClass: 'large' });
  const small = dog({ birthDate: new Date(2020, 0, 1), sizeClass: 'small' });
  const today = daysAfter(new Date(2020, 0, 1), 320 * 7);
  assertEquals(lifeStageAt(large, today), 'senior');
  assertEquals(lifeStageAt(small, today), 'adult');
});

Deno.test('heatSensitivityAt: an unremarkable adult dog has 0', () => {
  const d = dog({ birthDate: new Date(2020, 0, 1) });
  const today = daysAfter(new Date(2020, 0, 1), 200 * 7);
  assertEquals(heatSensitivityAt(d, today), 0);
});

Deno.test('heatSensitivityAt: brachycephalic gives +2', () => {
  const d = dog({ birthDate: new Date(2020, 0, 1), bodyType: new Set(['brachycephalic']) });
  const today = daysAfter(new Date(2020, 0, 1), 200 * 7);
  assertEquals(heatSensitivityAt(d, today), 2);
});

Deno.test('heatSensitivityAt: brachycephalic plus dense undercoat plus puppy is capped at 3', () => {
  const d = dog({
    birthDate: new Date(2026, 0, 1),
    bodyType: new Set(['brachycephalic', 'denseUndercoat']),
  });
  const today = daysAfter(new Date(2026, 0, 1), 10 * 7);
  assertEquals(heatSensitivityAt(d, today), 3);
});

Deno.test('heatSensitivityAt: large gives +1', () => {
  const d = dog({ birthDate: new Date(2020, 0, 1), sizeClass: 'large' });
  const today = daysAfter(new Date(2020, 0, 1), 200 * 7);
  assertEquals(heatSensitivityAt(d, today), 1);
});
