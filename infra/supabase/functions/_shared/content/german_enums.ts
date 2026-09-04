/**
 * The German content vocabulary (`content/schema/*.yaml`) mapped onto the
 * English enum types the planner uses (CLAUDE.md, section Sprache: content
 * stays German, code stays English). Content is validated separately by
 * `tool/validate.dart` before it ever reaches this loader — these
 * functions trust the value and throw only on a genuinely unknown key.
 */
import type {
  ActivityType,
  BreedGroup,
  LifeStage,
  Location,
  NeedDimension,
  Restriction,
  SkillCategory,
} from '../planner/models/enums.ts';

function lookup<T extends string>(table: Record<string, T>, key: string, kind: string): T {
  const value = table[key];
  if (value === undefined) {
    throw new Error(`unknown ${kind} in content: "${key}"`);
  }
  return value;
}

const SKILL_CATEGORY: Record<string, SkillCategory> = {
  grundsignal: 'basicCue',
  leinenarbeit: 'leashWork',
  impulskontrolle: 'impulseControl',
  alltagsroutine: 'dailyRoutine',
  sozialverhalten: 'socialBehavior',
  kooperation: 'cooperation',
};
export function skillCategoryFromGerman(value: string): SkillCategory {
  return lookup(SKILL_CATEGORY, value, 'skill category');
}

const ACTIVITY_TYPE: Record<string, ActivityType> = {
  training: 'training',
  beschaeftigung: 'enrichment',
  alltag: 'everyday',
  ruhe: 'rest',
  pflege: 'care',
};
export function activityTypeFromGerman(value: string): ActivityType {
  return lookup(ACTIVITY_TYPE, value, 'activity type');
}

const LOCATION: Record<string, Location> = {
  drinnen: 'indoors',
  draussen: 'outdoors',
  unterwegs: 'onTheGo',
  egal: 'any',
};
export function locationFromGerman(value: string): Location {
  return lookup(LOCATION, value, 'location');
}

const BREED_GROUP: Record<string, BreedGroup> = {
  huete: 'herding',
  jagd: 'hunting',
  begleit: 'companion',
  herdenschutz: 'livestockGuardian',
  terrier: 'terrier',
  wind: 'sighthound',
  nordisch: 'nordic',
  molosser: 'molosser',
  misch: 'mixed',
};
export function breedGroupFromGerman(value: string): BreedGroup {
  return lookup(BREED_GROUP, value, 'breed group');
}

const LIFE_STAGE: Record<string, LifeStage> = {
  welpe: 'puppy',
  junghund: 'adolescent',
  pubertaet: 'puberty',
  erwachsen: 'adult',
  senior: 'senior',
};
export function lifeStageFromGerman(value: string): LifeStage {
  return lookup(LIFE_STAGE, value, 'life stage');
}

const RESTRICTION: Record<string, Restriction> = {
  schonung: 'protectiveCare',
  gelenke: 'jointIssues',
  senior: 'senior',
  rekonvaleszenz: 'recovery',
};
export function restrictionFromGerman(value: string): Restriction {
  return lookup(RESTRICTION, value, 'restriction');
}

const NEED_DIMENSION: Record<string, NeedDimension> = {
  koerperlich: 'physical',
  kopfarbeit: 'mentalWork',
  nase: 'scent',
  sozial: 'social',
  erholung: 'recovery',
};
export function needDimensionFromGerman(value: string): NeedDimension {
  return lookup(NEED_DIMENSION, value, 'need dimension');
}
