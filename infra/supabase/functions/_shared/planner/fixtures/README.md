# Fixtures

Synthetic skills, activities and dog/household scenarios for the simulator (`../simulate.ts`) and
integration tests — **not the real content catalog**. Writing the forty real MVP activities is
trainer work (`docs/bauplan.md`, section „Zusammenarbeit mit KI": „fachliche Richtigkeit der
Hundeinhalte" is „Schlecht" for AI) and happens by hand in `content/skills/` and
`content/aktivitaeten/`, never here.

Every id in this directory is prefixed `fixture_` (skills, activities) or `fixture-` (dogs,
households) so it can never be mistaken for production content or a real user.

- `skills.ts` / `activities.ts` — a small but varied synthetic catalog: all five `ActivityType`s,
  all five `NeedDimension`s, a short prerequisite chain, training activities across a spread of
  distraction ranges for every fixture skill.
- `scenarios.ts` — five named dog/household/check-in bundles (`FixtureScenario`), matching the five
  fixtures `docs/datenmodell.md` describes under „Test-Fixtures" (Welpe Periode 1, Junghund in der
  Pubertät, Volle Periode, Erwachsener Hund alles gefestigt, Schonzeit). The three period-length
  fixtures listed there (Mittwochsstart, Samstagsstart, Wiedereinstieg) are about `today`'s weekday,
  not the dog — the simulator exercises those by varying `today` against any of the five scenarios
  here, rather than needing separate dog fixtures.
- `scenarios_test.ts` — runs `plan()` against every scenario with the real `content/planer.yaml`
  config (loaded through `../../content/loader.ts`). A smoke test, and a consistency check between
  these fixtures and the planner/content-loader.

The exact per-scenario expectations from `docs/datenmodell.md` (e.g. „höchstens zwei
Trainingsslots") are the simulator's `--check` job, not asserted here — this directory only
guarantees the fixtures are valid and runnable.
