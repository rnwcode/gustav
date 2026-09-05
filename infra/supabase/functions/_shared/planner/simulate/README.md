# Simulator internals

Supports `../simulate.ts` (the CLI). Split out so each piece is a pure, testable function —
`simulate.ts` itself is thin: parse args, load `content/planer.yaml`, call these, print.

- `rng.ts` — a small seeded PRNG (mulberry32). The simulator needs randomness for outcomes, never
  _unseeded_ randomness: the same seed must always replay the same run, or `--gegen` couldn't
  isolate a config change from noise.
- `profiles.ts` — `fleissig` / `unregelmaessig` / `gibt_auf`: how a synthetic owner's check-in rate
  and outcome distribution behave over time. Not part of the planner — `plan()` never sees a
  profile.
- `run.ts` — `simulate()` plays a profile through N periods starting from a `FixtureScenario`
  (`../fixtures/`): calls `plan()` each period, then resolves outcomes, feeds the state machine
  (`apply()`), and carries load/need-coverage/cooldown history into the next period.
- `invariants.ts` — `checkInvariants()`, the `--check` mode: empty slot per period, no skill
  untouched > 45 days, variance-group cooldowns (core skills exempt, as in `filterActivities`), need
  coverage over any two-period window, no training right after an arousal-3 day (scoped to within
  one period — `assignToDays` does not carry arousal across separate `plan()` calls, so that is what
  the code actually guarantees), life-stage caps.
- `format.ts` — turns a `SimulationResult` into the narrative text or the `--gegen` side-by-side
  comparison table.
