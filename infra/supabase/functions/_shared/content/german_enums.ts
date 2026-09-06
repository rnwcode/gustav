/**
 * The German content vocabulary (`content/schema/*.yaml`) mapped onto the
 * English enum types the planner uses (CLAUDE.md, section Sprache: content
 * stays German, code stays English). Content is validated separately by
 * `tool/validate.dart` before it ever reaches this loader — these
 * functions trust the value and throw only on a genuinely unknown key.
 */
import type {
  ActivityType,
  BodyType,
  BreedGroup,
  Dimension,
  Experience,
  Gender,
  HousingType,
  LifeStage,
  Location,
  NeedDimension,
  Origin,
  Outcome,
  ReasonKind,
  Restriction,
  SizeClass,
  SkillCategory,
  SkillStatus,
  Surroundings,
  Weekday,
  WeeklyContextSource,
} from '../planner/models/enums.ts';

function lookup<T extends string>(table: Record<string, T>, key: string, kind: string): T {
  const value = table[key];
  if (value === undefined) {
    throw new Error(`unknown ${kind} in content: "${key}"`);
  }
  return value;
}

/**
 * Builds the reverse of a `string -> T` table, for writing a `T` back out
 * as its German word — e.g. when the Edge Function persists a `SkillState`
 * or `Slot` into `hund`/`skill_stand`/`slot` (all German columns, see
 * `infra/supabase/migrations/0001_init.sql`).
 */
function reverseLookup<T extends string>(table: Record<string, T>): (value: T) => string {
  const reversed = new Map<T, string>();
  for (const [german, value] of Object.entries(table)) {
    reversed.set(value, german);
  }
  return (value: T) => {
    const german = reversed.get(value);
    if (german === undefined) {
      throw new Error(`no German word registered for "${value}"`);
    }
    return german;
  };
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

const ORIGIN: Record<string, Origin> = {
  zuechter: 'breeder',
  tierschutz: 'shelter',
  privat: 'private',
  unbekannt: 'unknown',
};
export function originFromGerman(value: string): Origin {
  return lookup(ORIGIN, value, 'origin');
}

const SIZE_CLASS: Record<string, SizeClass> = {
  klein: 'small',
  mittel: 'medium',
  gross: 'large',
};
export function sizeClassFromGerman(value: string): SizeClass {
  return lookup(SIZE_CLASS, value, 'size class');
}

const GENDER: Record<string, Gender> = {
  ruede: 'male',
  huendin: 'female',
};
export function genderFromGerman(value: string): Gender {
  return lookup(GENDER, value, 'gender');
}

const BODY_TYPE: Record<string, BodyType> = {
  brachyzephal: 'brachycephalic',
  dichte_unterwolle: 'denseUndercoat',
  langbeinig: 'longLegged',
};
export function bodyTypeFromGerman(value: string): BodyType {
  return lookup(BODY_TYPE, value, 'body type');
}

const HOUSING_TYPE: Record<string, HousingType> = {
  wohnung: 'apartment',
  haus_garten: 'houseWithGarden',
};
export function housingTypeFromGerman(value: string): HousingType {
  return lookup(HOUSING_TYPE, value, 'housing type');
}

const SURROUNDINGS: Record<string, Surroundings> = {
  stadt: 'city',
  vorort: 'suburb',
  land: 'countryside',
};
export function surroundingsFromGerman(value: string): Surroundings {
  return lookup(SURROUNDINGS, value, 'surroundings');
}

const EXPERIENCE: Record<string, Experience> = {
  ersthund: 'firstTimeOwner',
  erfahren: 'experienced',
};
export function experienceFromGerman(value: string): Experience {
  return lookup(EXPERIENCE, value, 'experience');
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
export const germanForNeedDimension = reverseLookup(NEED_DIMENSION);

const DIMENSION: Record<string, Dimension> = {
  dauer: 'duration',
  distanz: 'distance',
  ablenkung: 'distraction',
};
export function dimensionFromGerman(value: string): Dimension {
  return lookup(DIMENSION, value, 'dimension');
}

const SKILL_STATUS: Record<string, SkillStatus> = {
  nicht_begonnen: 'notStarted',
  aufbau: 'building',
  generalisierung: 'generalizing',
  gefestigt: 'consolidated',
  erhaltung: 'maintenance',
  ruht: 'dormant',
};
export function skillStatusFromGerman(value: string): SkillStatus {
  return lookup(SKILL_STATUS, value, 'skill status');
}
export const germanForSkillStatus = reverseLookup(SKILL_STATUS);

const WEEKDAY: Record<string, Weekday> = {
  mo: 'monday',
  di: 'tuesday',
  mi: 'wednesday',
  do: 'thursday',
  fr: 'friday',
  sa: 'saturday',
  so: 'sunday',
};
export function weekdayFromGerman(value: string): Weekday {
  return lookup(WEEKDAY, value, 'weekday');
}
export const germanForWeekday = reverseLookup(WEEKDAY);

/** `docs/datenmodell.md`, section „Check-in und Belastungsbudget": rueckblick[].ergebnis. */
const OUTCOME: Record<string, Outcome> = {
  klappte: 'succeeded',
  so_halb: 'partial',
  noch_nicht: 'notYet',
  uebersprungen: 'skipped',
  nicht_geschafft: 'notCompleted',
};
export function outcomeFromGerman(value: string): Outcome {
  return lookup(OUTCOME, value, 'outcome');
}
export const germanForOutcome = reverseLookup(OUTCOME);

/**
 * German words for `Reason.kind` (`infra/supabase/functions/_shared/planner/models/weekly_plan.ts`).
 * Not given by `docs/datenmodell.md` verbatim (Reason postdates it) — chosen to match the
 * vocabulary already used throughout `docs/specs/kandidaten-sammeln.md`,
 * `docs/specs/texten.md` and `docs/specs/gegenpruefen.md`.
 */
const REASON_KIND: Record<string, ReasonKind> = {
  leer: 'empty',
  neuer_skill: 'newSkill',
  faellig: 'dueRefresher',
  prioritaet: 'priority',
  bedarfsluecke: 'needGap',
  erholungsbedarf: 'recoveryNeed',
};
export function reasonKindFromGerman(value: string): ReasonKind {
  return lookup(REASON_KIND, value, 'reason kind');
}
export const germanForReasonKind = reverseLookup(REASON_KIND);

/** `docs/datenmodell.md`, section „Check-in und Belastungsbudget": wochenkontext.quelle. */
const WEEKLY_CONTEXT_SOURCE: Record<string, WeeklyContextSource> = {
  chip: 'chip',
  freitext: 'freeText',
  default: 'fallback',
};
export function weeklyContextSourceFromGerman(value: string): WeeklyContextSource {
  return lookup(WEEKLY_CONTEXT_SOURCE, value, 'weekly context source');
}
export const germanForWeeklyContextSource = reverseLookup(WEEKLY_CONTEXT_SOURCE);
