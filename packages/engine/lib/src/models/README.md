# Models

Data classes from `docs/datenmodell.md` (product documentation, stays
German — the identifiers below are the English translation used in code):

- `enums.dart` — Weekday, LifeStage, SkillStatus, Outcome, chips, …
- `levels.dart` — the three Ds (duration, distance, distraction), 0–5 each
- `dog.dart` — profile data; `lifeStage` and `heatSensitivity` are not
  stored fields, see `dog_derivations.dart`
- `dog_derivations.dart` — `lifeStageAt`/`heatSensitivityAt`, pure functions
  of dog + date
- `household.dart` — time budget, training days, planning day
- `skill.dart` — Skill, target levels
- `skill_state.dart` — state per dog × skill, history
- `activity.dart` — the unit the planner distributes, plus `Needs`

Still open (follows with the planner steps 1–7, see `../planner/README.md`):

- `checkin.dart` — review, intent, derived weekly context
- `weekly_plan.dart` — slots, reasons, period length

Rule: no system time, no IO, no serialization against Supabase in this
package. Data and logic only — time comes in as a parameter (`today`,
`date`).
