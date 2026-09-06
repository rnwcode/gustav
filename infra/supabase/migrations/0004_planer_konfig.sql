-- 0004_planer_konfig.sql
--
-- Closes the second shim already announced in generate-plan/README.md
-- ("Ein temporaerer Shim") and docs/specs/content-aus-db-laden.md ("Nicht
-- dazu gehoert"): `content/planer.yaml` used to be read via
-- Deno.readTextFile — works under `supabase functions serve` (real
-- filesystem access from the checkout), but NOT after a real
-- `supabase functions deploy` (the bundle doesn't contain content/).
-- That caused a real, live-observed 500 (NotFound: /var/content/planer.yaml).
--
-- The entire parsed YAML structure moves unchanged as one JSONB blob per
-- version into this table — generate-plan reads exactly the same structure
-- as before, just from Postgres instead of disk, and runs it through the
-- same parsers (_shared/content/planer_yaml.ts). Identical for every user
-- (content/configuration, not user state) — RLS like skill/activity/breed:
-- publicly readable, maintained directly in the DB (CLAUDE.md, rules 5 and
-- 10).
--
-- `version` stays the version number maintained by hand in
-- content/planer.yaml (CLAUDE.md, rule 6: weights are never changed by an
-- agent on its own) — generate-plan always reads the highest version.

create table planner_config (
  version int primary key,
  config jsonb not null,
  created_at timestamptz not null default now()
);

alter table planner_config enable row level security;

create policy "planner_config is publicly readable" on planner_config
  for select using (true);
