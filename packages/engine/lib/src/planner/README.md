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

## Planner steps 1–8

1. Build context — dog, household, weekly context, load budget, season
   (open — mostly assembly of the pieces above, plus season later)
2. Fix slots — period length, empty slots, phase cap (open)
3. Collect candidates — due refreshers, priorities, need gaps, new skills
   (done, see `candidates.dart` above)
4. Hard filter — age, prerequisites, equipment, restrictions, cooldown,
   safety (open — turns `CandidatePool` + the `Activity` catalog into an
   admissible `Activity` pool)
5. Score — weighted sum, deterministic tie-break on the ID (open)
6. Assign — day by day, load rules (open)
7. Cross-check the week — need coverage, training cap, empty slot (open)
8. Word it — frame and reasoning from structured data (open)

The weights in step 5 are tuned, not derived. They only change together
with a simulator run.
