# Content loader

Maps `content/*.yaml` (German, hand- and AI-authored, validated by `tool/validate.dart`) onto the
English types `_shared/planner/` expects (CLAUDE.md, section Sprache). Split in two:

- `german_enums.ts`, `skill_yaml.ts`, `activity_yaml.ts`, `planer_yaml.ts` — pure mapping functions,
  one already-YAML-parsed document in, a typed `Skill`/`Activity`/`PlannerConfig` out. No IO, easy
  to unit-test with inline fixtures mirroring the real files.
- `loader.ts` — the actual file IO (`Deno.readDir`/`Deno.readTextFile`). Local tooling only: the
  simulator (`../planner/simulate.ts`) and any future seed script read `content/` directly through
  this. A deployed Edge Function does not — it reads the seeded catalog from Postgres instead
  (CLAUDE.md, rule 10), so this file is never imported from `_shared/planner/`, which stays free of
  IO (CLAUDE.md, rule 1; enforced by the CI grep against that directory only).

`restrictionArousalCeiling` (`ActivityFilterConfig`, see `docs/specs/hart-filtern.md`) always comes
back empty: the content schema has no key for it yet, and adding one is a `tool/` content-schema
decision, not this loader's to make unilaterally (CLAUDE.md, rule 6).

`loader_test.ts` runs against the real `content/` directory rather than fixtures — it doubles as an
early warning if `content/schema/*.yaml` and this loader drift apart.
