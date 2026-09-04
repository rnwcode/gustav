import { assertEquals, assertThrows } from '../planner/dev_deps.ts';
import {
  activityTypeFromGerman,
  breedGroupFromGerman,
  dimensionFromGerman,
  lifeStageFromGerman,
  locationFromGerman,
  needDimensionFromGerman,
  restrictionFromGerman,
  skillCategoryFromGerman,
  skillStatusFromGerman,
} from './german_enums.ts';

Deno.test('skill categories map from German content vocabulary', () => {
  assertEquals(skillCategoryFromGerman('grundsignal'), 'basicCue');
  assertEquals(skillCategoryFromGerman('kooperation'), 'cooperation');
  assertThrows(() => skillCategoryFromGerman('unbekannt'));
});

Deno.test('activity types map from German content vocabulary', () => {
  assertEquals(activityTypeFromGerman('beschaeftigung'), 'enrichment');
  assertEquals(activityTypeFromGerman('training'), 'training');
  assertThrows(() => activityTypeFromGerman('unbekannt'));
});

Deno.test('locations map from German content vocabulary', () => {
  assertEquals(locationFromGerman('drinnen'), 'indoors');
  assertEquals(locationFromGerman('egal'), 'any');
  assertThrows(() => locationFromGerman('unbekannt'));
});

Deno.test('breed groups map from German content vocabulary', () => {
  assertEquals(breedGroupFromGerman('huete'), 'herding');
  assertEquals(breedGroupFromGerman('jagd'), 'hunting');
  assertThrows(() => breedGroupFromGerman('unbekannt'));
});

Deno.test('life stages map from German content vocabulary', () => {
  assertEquals(lifeStageFromGerman('welpe'), 'puppy');
  assertEquals(lifeStageFromGerman('erwachsen'), 'adult');
  assertThrows(() => lifeStageFromGerman('unbekannt'));
});

Deno.test('restrictions map from German content vocabulary', () => {
  assertEquals(restrictionFromGerman('schonung'), 'protectiveCare');
  assertEquals(restrictionFromGerman('rekonvaleszenz'), 'recovery');
  assertThrows(() => restrictionFromGerman('unbekannt'));
});

Deno.test('need dimensions map from German content vocabulary', () => {
  assertEquals(needDimensionFromGerman('koerperlich'), 'physical');
  assertEquals(needDimensionFromGerman('nase'), 'scent');
  assertThrows(() => needDimensionFromGerman('unbekannt'));
});

Deno.test('dimensions map from German content vocabulary', () => {
  assertEquals(dimensionFromGerman('dauer'), 'duration');
  assertEquals(dimensionFromGerman('ablenkung'), 'distraction');
  assertThrows(() => dimensionFromGerman('unbekannt'));
});

Deno.test('skill statuses map from German content vocabulary', () => {
  assertEquals(skillStatusFromGerman('aufbau'), 'building');
  assertEquals(skillStatusFromGerman('erhaltung'), 'maintenance');
  assertThrows(() => skillStatusFromGerman('unbekannt'));
});
