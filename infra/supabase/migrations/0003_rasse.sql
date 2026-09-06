-- 0003_rasse.sql
--
-- Pulls the breed-specific paths flagged "not in MVP" in docs/produkt.md
-- forward (owner's decision, see docs/specs/rasse-modellieren.md): breed
-- group is a property of its own `breed` table, not a plain column on
-- `dog`, and a dog links to one or more breeds via `dog_breed`. That makes
-- the path to real, individually named breeds (instead of just nine
-- groups) later a matter of pure data entry, no further schema change.
--
-- `size_class`/`body_type` deliberately stay on `dog`: they're already
-- given by the owner independent of breed group today, so they're
-- properties of the individual animal, not of the breed.
--
-- `breed` is content (identical for every user), like `skill`/`activity`
-- (0002_content.sql): publicly readable, maintained directly in the DB, no
-- import script (CLAUDE.md, rule 5).

-- ── breed ───────────────────────────────────────────────────────────────────

create table breed (
  id text primary key,
  name text not null,
  breed_group text not null
    check (breed_group in (
      'herding', 'hunting', 'companion', 'livestockGuardian', 'terrier',
      'sighthound', 'nordic', 'molosser', 'mixed'
    )),
  created_at timestamptz not null default now()
);

alter table breed enable row level security;

create policy "breed is publicly readable" on breed
  for select using (true);

-- ── dog_breed ───────────────────────────────────────────────────────────────
--
-- weight is deliberately nullable: null means "spread evenly across all of
-- this dog's breeds" — a mixed-breed dog with two linked breeds and no
-- weight set counts both at 50%, without anyone having to maintain that
-- (resolveBreedGroups(), infra/supabase/functions/generate-plan/rows.ts).
-- Only relative ratios matter, not a fixed scale — {3, 1} means the same as
-- {75, 25}.

create table dog_breed (
  dog_id uuid not null references dog(id) on delete cascade,
  breed_id text not null references breed(id),
  weight numeric check (weight > 0),

  primary key (dog_id, breed_id)
);

alter table dog_breed enable row level security;

create policy "own dog_breed" on dog_breed
  for all using (
    exists (select 1 from dog where dog.id = dog_breed.dog_id and dog.owner = auth.uid())
  ) with check (
    exists (select 1 from dog where dog.id = dog_breed.dog_id and dog.owner = auth.uid())
  );

create index dog_breed_dog_id_idx on dog_breed(dog_id);

-- ── dog ─────────────────────────────────────────────────────────────────────

-- Both nullable: "unknown" is a legitimate state, especially for shelter
-- dogs without papers.
alter table dog add column gender text check (gender in ('male', 'female'));
alter table dog add column neutered bool;

-- ── nine group placeholders ──────────────────────────────────────────────────
--
-- So onboarding (same breed-group picker as before, Step2Origin.tsx) keeps
-- working unchanged. Real, individually named breeds are trainer knowledge
-- about correct group assignment, not engineering work — deliberately left
-- open (docs/specs/rasse-modellieren.md, "Nicht dazu gehört").

insert into breed (id, name, breed_group) values
  ('group_herding', 'Hüte', 'herding'),
  ('group_hunting', 'Jagd', 'hunting'),
  ('group_companion', 'Begleit', 'companion'),
  ('group_livestock_guardian', 'Herdenschutz', 'livestockGuardian'),
  ('group_terrier', 'Terrier', 'terrier'),
  ('group_sighthound', 'Wind', 'sighthound'),
  ('group_nordic', 'Nordisch', 'nordic'),
  ('group_molosser', 'Molosser', 'molosser'),
  ('group_mixed', 'Mischling', 'mixed');
