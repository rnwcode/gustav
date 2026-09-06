# generate-plan

The Edge Function the app calls after a planning-day check-in (and once, right after onboarding,
with an empty check-in) to get a new `WeeklyPlan` for one dog. Wires the pure planner
(`_shared/planner/plan.ts`) to Postgres — loads state, applies the check-in's `review` through
the state machine, calls `plan()`, persists the result.

## Request

```jsonc
POST /generate-plan
Authorization: Bearer <user JWT>
{
  "dogId": "uuid",
  "review": [{ "slotId": "uuid", "outcome": "succeeded" }],
  "reviewFreetext": null,
  "intentChips": ["leash", "shortOnTime"],
  "intentFreetext": null,
  "daysAvailable": ["monday", "wednesday", "friday"],
  "reviewChips": [],
  "debugToday": null // only the Zeitreise debug menu ever sets this
}
```

`review`/`intentChips`/`daysAvailable`/`reviewChips` use the same English vocabulary as the DB
columns and the planner's models — no translation at the wire boundary or between DB rows and the
planner (`rows.ts` maps column names, not vocabulary; the only remaining German↔English translation
left in `_shared/content/german_enums.ts` is for the still-German `content/*.yaml` files the
simulator reads, a separate path this endpoint doesn't touch).

Responses: `201` with the new plan, `401` unauthenticated, `404` dog or household not found, `409`
the dog already has a plan covering today (no silent recomputation — CLAUDE.md, rule 10), `500` on a
DB error.

## Files

- `index.ts` — the HTTP handler: auth, loads state from Postgres, calls the pieces below, persists,
  responds. The only file here with IO.
- `rows.ts` — pure `dog`/`household`/`skill_state`/`slot` row ↔ planner model mapping. Column values
  already match the planner's English vocabulary directly (unlike the German-content path in
  `_shared/content/german_enums.ts`), so this is mostly a snake_case ↔ camelCase reshape, not a
  vocabulary translation.
- `history.ts` — pure resolution of `loadOverLastSevenDays`, `needCoverageLastPeriod`,
  `lastUsedByVarianceGroup/ActivityId` from past `slot` rows — the same rules `simulate/run.ts`
  uses.
- `review.ts` — pure processing of one check-in's ratings into `SkillState` updates (via
  `apply()`) and `slot.outcome` writes.
- `checkin_translator.ts` — the minimal, honest template translator from raw check-in chips to
  `WeeklyContext`. Deliberately does not invent a chip → skill-priority mapping (no content-tagging
  system exists for that yet) and leaves `priorities` empty; `flags` carries the chips verbatim,
  matching `docs/datenmodell.md`'s "open-ended, translator- produced" description — though no
  planner step reads `flags` yet either, so today this only affects what gets stored, not the plan.

## Content and config both come from Postgres now

Skills/activities come from the `activity`/`skill` tables (`infra/supabase/migrations/
0002_content.sql`), maintained directly there (Supabase Studio/SQL, CLAUDE.md rule 5) — no import
step from files. `_shared/planner/fixtures/` still exists, but only the simulator and tests use it
now.

User-visible text (`title`/`sentence`/… resp. `name`/`description`) lives in `activity_text`/
`skill_text` instead, keyed by `(id, locale)` — the two catalog queries in `index.ts` join against
`locale = 'de'` (the only locale seeded so far; a hardcoded constant right now, the one spot a
future per-client locale would plug into). `rows.ts`'s `activityFromRow`/`skillFromRow` flatten that
join back onto one `Activity`/`Skill` directly — unlike the DB row itself, the actual
`content/{aktivitaeten,skills}/*.yaml` files stay German (they feed only the simulator, via
`_shared/content/{activity,skill}_yaml.ts`, a separate parser this file doesn't call).

The planner config (`content/planer.yaml`) comes from `planner_config`
(`infra/supabase/migrations/0004_planer_konfig.sql`), read as the row with the highest `version` and
run through the same `_shared/content/planer_yaml.ts` parsers as before — that file's own vocabulary
(weights, thresholds) stays German, the protected content CLAUDE.md rule 6 refers to; only the
table/column names wrapping it (`planner_config`, `version`, `config`) are English. This used to be
a plain `Deno.readTextFile` against the checkout — worked under `supabase functions serve` (runs
from the checkout, real filesystem) but broke every real `supabase functions deploy` with `NotFound:
/var/content/planer.yaml`, since a deployed bundle doesn't include `content/`. Caught live, not just
in theory — see `docs/specs/planer-konfig-aus-db.md`.

## Testing

`rows.ts`, `history.ts`, `review.ts` and `checkin_translator.ts` are unit-tested
(`deno test --allow-read`, no DB needed — the same command that runs everything else in
`infra/supabase/functions`). `index.ts` itself is not: exercising it needs a running PostgREST +
GoTrue, which means the real local Supabase stack (`supabase start`), not available in every
environment this was built in. Before relying on it, run it once against `supabase start` —
`supabase functions serve generate-plan` — with a real signed-up user, a seeded `dog`/`household`
row, and a POST request matching the shape above.
