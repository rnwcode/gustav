# Planner

Pure function: state in, weekly plan out. No network, no LLM, no unseeded
random numbers.

## Building blocks (done)

`state_machine.dart` — `apply()` and `reportProblem()` turn an assessment
into a new `SkillState` (level logic, status transitions, spaced
repetition). Spec: `docs/specs/skill-zustandsautomat.md` (German — product
documentation). Runs ahead of the actual planner and is a prerequisite for
step 3 (due refreshers).

`load_budget.dart` — `evaluateLoadBudget()` turns seven days of resolved
daily loads into a quote and a `RecoveryNeed` classification. Spec:
`docs/specs/belastungsbudget.md` (German — product documentation). Feeds
step 1 (context) and step 5 (scoring); does not itself resolve daily loads
from `Slot`/`Activity`/`Outcome` — that stays the planner's job.

`candidates.dart` — `collectCandidates()` is step 3: due refreshers,
prioritized skills, newly unlocked skills (`SkillFocus`) and unmet need
dimensions (`NeedFocus`). Spec: `docs/specs/kandidaten-sammeln.md`
(German — product documentation). Collects and merges signals only; does
not filter or score.

`activity_filter.dart` — `filterActivities()` is step 4: turns the
`Activity` catalog plus a `CandidatePool` into the admissible pool (age,
candidate linkage, equipment, second person, restrictions, cooldown,
location, season, settling-in, training distraction range, refresher-only
once consolidated/maintenance). Spec: `docs/specs/hart-filtern.md`
(German — product documentation). Deliberately does not cover heat safety
(`Hitze × Hitzeempfindlichkeit`) — no weather data source exists yet
(backlog V1.1).

## Planner steps 1–8

1. Build context — dog, household, weekly context, load budget, season
   (open — mostly assembly of the pieces above, plus season later)
2. Fix slots — period length, empty slots, phase cap (open)
3. Collect candidates — due refreshers, priorities, need gaps, new skills
   (done, see `candidates.dart` above)
4. Hard filter — age, prerequisites, equipment, restrictions, cooldown,
   safety (done except heat safety, see `activity_filter.dart` above)
5. Score — weighted sum, deterministic tie-break on the ID (open — the
   next step: scores the pool `activity_filter.dart` returns, using the
   signals already attached to each `SkillFocus`/`NeedFocus`)
6. Assign — day by day, load rules (open)
7. Cross-check the week — need coverage, training cap, empty slot (open)
8. Word it — frame and reasoning from structured data (open)

The weights in step 5 are tuned, not derived. They only change together
with a simulator run.
