# generate-plan

The Edge Function the app calls after a planning-day check-in (and once, right after onboarding,
with an empty check-in) to get a new `WeeklyPlan` for one dog. Wires the pure planner
(`_shared/planner/plan.ts`) to Postgres — loads state, applies the check-in's `rueckblick` through
the state machine, calls `plan()`, persists the result.

## Request

```jsonc
POST /generate-plan
Authorization: Bearer <user JWT>
{
  "hundId": "uuid",
  "rueckblick": [{ "slotId": "uuid", "ergebnis": "klappte" }],
  "freitextRueckblick": null,
  "absichtChips": ["leinen", "wenig_zeit"],
  "freitextAbsicht": null,
  "tageVerfuegbar": ["mo", "mi", "fr"],
  "rueckblickChips": [],
  "debugToday": null // only the Zeitreise debug menu ever sets this
}
```

`rueckblick`/`absichtChips`/`tageVerfuegbar`/`rueckblickChips` all use the same German words as the
DB columns and `content/*.yaml` — no translation at the wire boundary, only between DB rows and the
planner's English models (`rows.ts`, `_shared/content/german_enums.ts`).

Responses: `201` with the new plan, `401` unauthenticated, `404` dog or household not found, `409`
the dog already has a plan covering today (no silent recomputation — CLAUDE.md, rule 10), `500` on a
DB error.

## Files

- `index.ts` — the HTTP handler: auth, loads state from Postgres, calls the pieces below, persists,
  responds. The only file here with IO.
- `rows.ts` — pure `hund`/`haushalt`/`skill_stand`/`slot` row ↔ planner model mapping (uses
  `_shared/content/german_enums.ts` for vocabulary).
- `history.ts` — pure resolution of `loadOverLastSevenDays`, `needCoverageLastPeriod`,
  `lastUsedByVarianceGroup/ActivityId` from past `slot` rows — the same rules `simulate/run.ts`
  uses.
- `rueckblick.ts` — pure processing of one check-in's ratings into `SkillState` updates (via
  `apply()`) and `slot.ergebnis` writes.
- `checkin_translator.ts` — the minimal, honest template translator from raw check-in chips to
  `WeeklyContext`. Deliberately does not invent a chip → skill-priority mapping (no content-tagging
  system exists for that yet) and leaves `priorities` empty; `flags` carries the chips verbatim,
  matching `docs/datenmodell.md`'s "open-ended, translator- produced" description — though no
  planner step reads `flags` yet either, so today this only affects what gets stored, not the plan.

## Two temporary shims — read before deploying for real

Both are called out where they happen in `index.ts`, repeated here because they matter for anyone
building on this:

1. **Catalog**: skills/activities come from `_shared/planner/fixtures/`
   (`FIXTURE_SKILLS`/`FIXTURE_ACTIVITIES`), not `content/` or a DB table — the real forty-activity
   catalog doesn't exist yet (trainer work, see `_shared/planner/fixtures/README.md`), and there's
   no content migration yet either (`infra/supabase/migrations/0001_init.sql`'s own header comment
   scopes it out). Swap this import for a DB read once both exist; nothing else changes.
2. **Config**: `content/planer.yaml` is read from disk via the existing loader. That works under
   `supabase functions serve` (runs from the checkout, real filesystem) but **not** after
   `supabase functions deploy` — a deployed function's bundle doesn't include `content/`. Move this
   to a DB-backed config table before a real deploy; it's the same missing content migration as
   above.

## Testing

`rows.ts`, `history.ts`, `rueckblick.ts` and `checkin_translator.ts` are unit-tested
(`deno test --allow-read`, no DB needed — the same command that runs everything else in
`infra/supabase/functions`). `index.ts` itself is not: exercising it needs a running PostgREST +
GoTrue, which means the real local Supabase stack (`supabase start`), not available in every
environment this was built in. Before relying on it, run it once against `supabase start` —
`supabase functions serve generate-plan` — with a real signed-up user, a seeded `hund`/`haushalt`
row, and a POST request matching the shape above.
