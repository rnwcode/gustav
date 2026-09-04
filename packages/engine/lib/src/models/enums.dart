// Enums from `docs/datenmodell.md`.
//
// Plain enumerations, no logic. Development language is English (CLAUDE.md,
// section Sprache); the domain content itself (content/*.yaml) stays German.

/// Day of the week, independent of a calendar date — the planner reasons in
/// `trainingDays` and `planningDay`, not ISO weekdays.
enum Weekday { monday, tuesday, wednesday, thursday, friday, saturday, sunday }

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

enum HousingType { apartment, houseWithGarden }

enum Surroundings { city, suburb, countryside }

enum Experience { firstTimeOwner, experienced }

/// `lifeStage` — derived from age and size class, never stored.
enum LifeStage { puppy, adolescent, puberty, adult, senior }

enum SkillStatus {
  notStarted,
  building,
  generalizing,
  consolidated,
  maintenance,
  dormant
}

enum SkillCategory {
  basicCue,
  leashWork,
  impulseControl,
  dailyRoutine,
  socialBehavior,
  cooperation,
}

enum ActivityType { training, enrichment, everyday, rest, care }

enum Location { indoors, outdoors, onTheGo, any }

/// Outcome of an assessment — both in the daily tap-to-rate and in the
/// weekly review.
enum Outcome { succeeded, partial, notYet, skipped, notCompleted }

enum IntentChip {
  leash,
  recall,
  calm,
  homeAlone,
  visitors,
  shortOnTime,
  vacation,
  moreMentalWork,
  notSure,
}

enum ReviewChip { busyWeek, illness, travel, vetVisit, calmWeek }

/// Decides whether the app is allowed to say „you told us" (see
/// `docs/produkt.md`, section Tonalität).
enum WeeklyContextSource { chip, freeText, fallback }

/// The three Ds: duration, distance, distraction — only ever raise one at a
/// time (`docs/datenmodell.md`, section „Skills und die drei D").
enum Dimension { duration, distance, distraction }

enum NeedDimension { physical, mentalWork, scent, social, recovery }

/// Classification of the rolling load budget — see
/// `docs/specs/belastungsbudget.md`.
enum RecoveryNeed { none, medium, high }

/// Kind of machine-readable reason attached to a [Slot] — see
/// `docs/datenmodell.md`, section „Der Planer", step 5.
enum ReasonKind {
  priority,
  dueRefresher,
  needGap,
  newSkill,
  recoveryNeed,
  empty
}
