# Planner

Pure function: state in, weekly plan out. No network, no LLM, no unseeded
random numbers.

## State machine (done)

`state_machine.dart` — `apply()` and `reportProblem()` turn an assessment
into a new `SkillState` (level logic, status transitions, spaced
repetition). Spec: `docs/specs/skill-zustandsautomat.md` (German — product
documentation). Runs ahead of the actual planner and is a prerequisite for
step 3 (due refreshers).

## Planner steps 1–8 (open)

Flow (details in `docs/datenmodell.md`, German):

1. Build context — dog, household, weekly context, load budget, season
2. Fix slots — period length, empty slots, phase cap
3. Collect candidates — due refreshers, priorities, need gaps, new skills
4. Hard filter — age, prerequisites, equipment, restrictions, cooldown, safety
5. Score — weighted sum, deterministic tie-break on the ID
6. Assign — day by day, load rules
7. Cross-check the week — need coverage, training cap, empty slot
8. Word it — frame and reasoning from structured data

The weights in step 5 are tuned, not derived. They only change together
with a simulator run.
