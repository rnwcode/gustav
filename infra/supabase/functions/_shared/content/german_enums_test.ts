import { assertEquals, assertThrows } from '../planner/dev_deps.ts';
import {
  activityTypeFromGerman,
  bodyTypeFromGerman,
  breedGroupFromGerman,
  dimensionFromGerman,
  experienceFromGerman,
  germanForNeedDimension,
  germanForOutcome,
  germanForReasonKind,
  germanForSkillStatus,
  germanForWeekday,
  housingTypeFromGerman,
  lifeStageFromGerman,
  locationFromGerman,
  needDimensionFromGerman,
  originFromGerman,
  outcomeFromGerman,
  reasonKindFromGerman,
  restrictionFromGerman,
  sizeClassFromGerman,
  skillCategoryFromGerman,
  skillStatusFromGerman,
  surroundingsFromGerman,
  weekdayFromGerman,
  weeklyContextSourceFromGerman,
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

Deno.test('need dimensions and skill statuses round-trip back to German', () => {
  assertEquals(germanForNeedDimension('scent'), 'nase');
  assertEquals(germanForSkillStatus('maintenance'), 'erhaltung');
});

Deno.test('weekdays map both ways', () => {
  assertEquals(weekdayFromGerman('mo'), 'monday');
  assertEquals(weekdayFromGerman('so'), 'sunday');
  assertEquals(germanForWeekday('monday'), 'mo');
  assertThrows(() => weekdayFromGerman('unbekannt'));
});

Deno.test('outcomes map both ways', () => {
  assertEquals(outcomeFromGerman('klappte'), 'succeeded');
  assertEquals(outcomeFromGerman('nicht_geschafft'), 'notCompleted');
  assertEquals(germanForOutcome('partial'), 'so_halb');
  assertThrows(() => outcomeFromGerman('unbekannt'));
});

Deno.test('dog/household classification vocabulary maps from German', () => {
  assertEquals(originFromGerman('zuechter'), 'breeder');
  assertEquals(sizeClassFromGerman('gross'), 'large');
  assertEquals(bodyTypeFromGerman('brachyzephal'), 'brachycephalic');
  assertEquals(housingTypeFromGerman('haus_garten'), 'houseWithGarden');
  assertEquals(surroundingsFromGerman('land'), 'countryside');
  assertEquals(experienceFromGerman('ersthund'), 'firstTimeOwner');
  assertThrows(() => originFromGerman('unbekannt-falsch'));
});

Deno.test('weekly context source maps from German', () => {
  assertEquals(weeklyContextSourceFromGerman('chip'), 'chip');
  assertEquals(weeklyContextSourceFromGerman('default'), 'fallback');
  assertThrows(() => weeklyContextSourceFromGerman('unbekannt'));
});

Deno.test('reason kinds map both ways', () => {
  assertEquals(reasonKindFromGerman('bedarfsluecke'), 'needGap');
  assertEquals(germanForReasonKind('newSkill'), 'neuer_skill');
  assertEquals(germanForReasonKind('empty'), 'leer');
  assertThrows(() => reasonKindFromGerman('unbekannt'));
});
