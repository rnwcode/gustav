# Models

Data types from `docs/datenmodell.md` (product documentation, stays German — the identifiers below
are the English translation used in code). Plain `interface`s and string-literal unions, no classes
— TypeScript needs no ceremony for immutable data, and `structuredClone`/spread cover what Dart
needed `copyWith` for.

- `enums.ts` — Weekday, LifeStage, SkillStatus, Outcome, chips, …
- `levels.ts` — the three Ds (duration, distance, distraction), 0–5 each, plus
  `levelFor`/`withLevel` (TS has no operator overloading)
- `dog.ts` — profile data; `lifeStage` and `heatSensitivity` are not stored fields, see
  `dog_derivations.ts`
- `dog_derivations.ts` — `lifeStageAt`/`heatSensitivityAt`, pure functions of dog + date
- `household.ts` — time budget (in minutes — Dart's `Duration` has no TS equivalent), training days,
  planning day
- `skill.ts` — Skill, target levels
- `skill_state.ts` — state per dog × skill, history
- `activity.ts` — the unit the planner distributes, plus `Needs`
- `checkin.ts` — `WeeklyCheckin` (review, intent) and the derived `WeeklyContext` (priorities,
  constraints, flags, source)
- `weekly_plan.ts` — `WeeklyPlan`, `Slot`, machine-readable `Reason`

Rule: no system time, no IO, no Supabase client import in this directory. Data and logic only — time
comes in as a parameter (`today`, `date`).
