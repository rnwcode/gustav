// Enum-like types from `docs/datenmodell.md`.
//
// Plain string-literal unions, no logic. Development language is English
// (CLAUDE.md, section Sprache); the domain content itself (content/*.yaml)
// stays German.

/**
 * Day of the week, independent of a calendar date — the planner reasons in
 * `trainingDays` and `planningDay`, not ISO weekdays.
 */
export type Weekday =
  | 'monday'
  | 'tuesday'
  | 'wednesday'
  | 'thursday'
  | 'friday'
  | 'saturday'
  | 'sunday';

export type Origin = 'breeder' | 'shelter' | 'private' | 'unknown';

export type BreedGroup =
  | 'herding'
  | 'hunting'
  | 'companion'
  | 'livestockGuardian'
  | 'terrier'
  | 'sighthound'
  | 'nordic'
  | 'molosser'
  | 'mixed';

export type SizeClass = 'small' | 'medium' | 'large';

export type Gender = 'male' | 'female';

export type BodyType = 'brachycephalic' | 'denseUndercoat' | 'longLegged';

export type Restriction = 'protectiveCare' | 'jointIssues' | 'senior' | 'recovery';

export type HousingType = 'apartment' | 'houseWithGarden';

export type Surroundings = 'city' | 'suburb' | 'countryside';

export type Experience = 'firstTimeOwner' | 'experienced';

/** `lifeStage` — derived from age and size class, never stored. */
export type LifeStage = 'puppy' | 'adolescent' | 'puberty' | 'adult' | 'senior';

export type SkillStatus =
  | 'notStarted'
  | 'building'
  | 'generalizing'
  | 'consolidated'
  | 'maintenance'
  | 'dormant';

export type SkillCategory =
  | 'basicCue'
  | 'leashWork'
  | 'impulseControl'
  | 'dailyRoutine'
  | 'socialBehavior'
  | 'cooperation';

export type ActivityType = 'training' | 'enrichment' | 'everyday' | 'rest' | 'care';

export type Location = 'indoors' | 'outdoors' | 'onTheGo' | 'any';

/**
 * Outcome of an assessment — both in the daily tap-to-rate and in the
 * weekly review.
 */
export type Outcome = 'succeeded' | 'partial' | 'notYet' | 'skipped' | 'notCompleted';

export type IntentChip =
  | 'leash'
  | 'recall'
  | 'calm'
  | 'homeAlone'
  | 'visitors'
  | 'shortOnTime'
  | 'vacation'
  | 'moreMentalWork'
  | 'notSure';

export type ReviewChip = 'busyWeek' | 'illness' | 'travel' | 'vetVisit' | 'calmWeek';

/**
 * Decides whether the app is allowed to say „you told us" (see
 * `docs/produkt.md`, section Tonalität).
 */
export type WeeklyContextSource = 'chip' | 'freeText' | 'fallback';

/**
 * The three Ds: duration, distance, distraction — only ever raise one at a
 * time (`docs/datenmodell.md`, section „Skills und die drei D").
 */
export type Dimension = 'duration' | 'distance' | 'distraction';

export type NeedDimension = 'physical' | 'mentalWork' | 'scent' | 'social' | 'recovery';

/** Classification of the rolling load budget — see `docs/specs/belastungsbudget.md`. */
export type RecoveryNeed = 'none' | 'medium' | 'high';

/**
 * Kind of machine-readable reason attached to a `Slot` — see
 * `docs/datenmodell.md`, section „Der Planer", step 5.
 */
export type ReasonKind =
  | 'priority'
  | 'dueRefresher'
  | 'needGap'
  | 'newSkill'
  | 'recoveryNeed'
  | 'empty';
