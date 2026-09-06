
drop table if exists slot cascade;
drop table if exists weekly_plan cascade;
drop table if exists checkin cascade;
drop table if exists skill_state cascade;
drop table if exists dog_breed cascade;
drop table if exists breed cascade;
drop table if exists activity_text cascade;
drop table if exists activity cascade;
drop table if exists skill_text cascade;
drop table if exists skill cascade;
drop table if exists dog cascade;
drop table if exists household cascade;
drop table if exists planner_config cascade;
-- old German-named tables from before this rename, if still present
drop table if exists hund_rasse cascade;
drop table if exists rasse cascade;
drop table if exists aktivitaet_text cascade;
drop table if exists aktivitaet cascade;
drop table if exists skill_stand cascade;
drop table if exists wochenplan cascade;
drop table if exists haushalt cascade;
drop table if exists hund cascade;
drop table if exists planer_konfig cascade;

-- 0001_init.sql
--
-- State tables from docs/datenmodell.md — NOT content: skills and
-- activities come from their own tables (0002_content.sql), the same for
-- all users; the tables here are per-user state.
--
-- Tables here: dog, household, skill_state, checkin, weekly_plan, slot.
--
-- Language: table/column names and enum values are English (CLAUDE.md,
-- section Sprache) — development vocabulary, not content. Only the actual
-- content values (aktivitaet_text/skill_text, content/planer.yaml,
-- user-visible app text) stay German.
--
-- Every state table: RLS enabled, policy against auth.uid() (directly on
-- dog/household, otherwise via a join back to dog.owner).
-- activity_id/skill_id are deliberately without a foreign key (the tables
-- they'd point to don't exist yet in this migration).

-- ── dog ─────────────────────────────────────────────────────────────────────

create table dog (
  id uuid primary key default gen_random_uuid(),
  -- default auth.uid(): the client never has to send owner itself; the RLS
  -- policy below prevents any other value anyway.
  owner uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name text not null,
  birth_date date not null,
  arrival_date date not null,
  origin text not null
    check (origin in ('breeder', 'shelter', 'private', 'unknown')),
  size_class text not null
    check (size_class in ('small', 'medium', 'large')),
  body_type text[] not null default '{}'
    check (body_type <@ array['brachycephalic', 'denseUndercoat', 'longLegged']),
  restrictions text[] not null default '{}'
    check (restrictions <@ array['protectiveCare', 'jointIssues', 'senior', 'recovery']),
  created_at timestamptz not null default now(),

  check (arrival_date >= birth_date)
);

alter table dog enable row level security;

create policy "own dogs" on dog
  for all using (owner = auth.uid()) with check (owner = auth.uid());

-- ── household ───────────────────────────────────────────────────────────────
--
-- Hangs off the owner, not the dog: time budget and housing situation
-- belong to the owner, not the individual dog. Multi-dog households are
-- backlog V2 (docs/datenmodell.md) — one household per user is enough
-- until then.

create table household (
  id uuid primary key default gen_random_uuid(),
  owner uuid not null default auth.uid() unique references auth.users(id) on delete cascade,
  postal_code text,
  housing_type text not null
    check (housing_type in ('apartment', 'houseWithGarden')),
  surroundings text not null
    check (surroundings in ('city', 'suburb', 'countryside')),
  experience text not null
    check (experience in ('firstTimeOwner', 'experienced')),
  weekday_time_budget_min int not null check (weekday_time_budget_min >= 0),
  weekend_time_budget_min int not null check (weekend_time_budget_min >= 0),
  training_days text[] not null default '{}'
    check (training_days <@ array['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']),
  planning_day text not null default 'sunday'
    check (planning_day in ('monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday')),
  household_size int not null default 1 check (household_size >= 1),
  equipment text[] not null default '{}',
  created_at timestamptz not null default now()
);

alter table household enable row level security;

create policy "own household" on household
  for all using (owner = auth.uid()) with check (owner = auth.uid());

-- ── skill_state ─────────────────────────────────────────────────────────────

create table skill_state (
  dog_id uuid not null references dog(id) on delete cascade,
  skill_id text not null,
  status text not null default 'building'
    check (status in (
      'notStarted', 'building', 'generalizing',
      'consolidated', 'maintenance', 'dormant'
    )),
  level_duration int not null default 0 check (level_duration between 0 and 5),
  level_distance int not null default 0 check (level_distance between 0 and 5),
  level_distraction int not null default 0 check (level_distraction between 0 and 5),
  -- [{date, outcome, levelDuration, levelDistance, levelDistraction}], last 10 is enough
  history jsonb not null default '[]'::jsonb,
  last_practiced_at date,
  due_at date,
  interval_days int not null default 1 check (interval_days > 0),
  updated_at timestamptz not null default now(),

  primary key (dog_id, skill_id)
);

alter table skill_state enable row level security;

create policy "own skill states" on skill_state
  for all using (
    exists (select 1 from dog where dog.id = skill_state.dog_id and dog.owner = auth.uid())
  ) with check (
    exists (select 1 from dog where dog.id = skill_state.dog_id and dog.owner = auth.uid())
  );

-- ── checkin ─────────────────────────────────────────────────────────────────
--
-- Raw answer from the planning-day screen, plus the weekly context derived
-- from it (template in the MVP, an LLM later — docs/datenmodell.md). Written
-- once, immutable after that; a plan is generated from exactly one checkin
-- (see weekly_plan.checkin_id).

create table checkin (
  id uuid primary key default gen_random_uuid(),
  dog_id uuid not null references dog(id) on delete cascade,
  period_start date not null,

  -- Raw answer.
  review jsonb not null default '[]'::jsonb, -- [{slot_id, outcome}]
  review_freetext text,
  intent_chips text[] not null default '{}'
    check (intent_chips <@ array[
      'leash', 'recall', 'calm', 'homeAlone', 'visitors',
      'shortOnTime', 'vacation', 'moreMentalWork', 'notSure'
    ]),
  intent_freetext text,
  days_available text[] not null default '{}'
    check (days_available <@ array['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']),
  review_chips text[] not null default '{}'
    check (review_chips <@ array['busyWeek', 'illness', 'travel', 'vetVisit', 'calmWeek']),

  -- Derived weekly context.
  priorities jsonb not null default '[]'::jsonb, -- [{skillIdOrTopic, weight}]
  constraint_days text[] not null default '{}'
    check (constraint_days <@ array['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']),
  constraint_minutes_per_day int check (constraint_minutes_per_day > 0),
  constraint_locations text[] not null default '{}'
    check (constraint_locations <@ array['indoors', 'outdoors', 'onTheGo', 'any']),
  flags text[] not null default '{}',
  source text not null default 'fallback'
    check (source in ('chip', 'freeText', 'fallback')),

  created_at timestamptz not null default now(),

  unique (dog_id, period_start)
);

alter table checkin enable row level security;

create policy "own checkins" on checkin
  for all using (
    exists (select 1 from dog where dog.id = checkin.dog_id and dog.owner = auth.uid())
  ) with check (
    exists (select 1 from dog where dog.id = checkin.dog_id and dog.owner = auth.uid())
  );

-- ── weekly_plan ─────────────────────────────────────────────────────────────
--
-- Generated and stored once, never recomputed on open (CLAUDE.md, rule
-- 10) — algorithm_version/config_version are fixed the moment the row
-- exists.

create table weekly_plan (
  id uuid primary key default gen_random_uuid(),
  dog_id uuid not null references dog(id) on delete cascade,
  checkin_id uuid references checkin(id) on delete set null,
  period_start date not null,
  period_end date not null,
  algorithm_version int not null,
  config_version int not null,
  created_at timestamptz not null default now(),

  unique (dog_id, period_start),
  check (period_end >= period_start)
);

alter table weekly_plan enable row level security;

create policy "own weekly plans" on weekly_plan
  for all using (
    exists (select 1 from dog where dog.id = weekly_plan.dog_id and dog.owner = auth.uid())
  ) with check (
    exists (select 1 from dog where dog.id = weekly_plan.dog_id and dog.owner = auth.uid())
  );

-- ── slot ────────────────────────────────────────────────────────────────────
--
-- One slot per day, allowed to be empty (docs/datenmodell.md, „Fünf
-- Entscheidungen"). reason_* mirrors Reason from
-- _shared/planner/models/weekly_plan.ts: kind/skillId/needDimension.

create table slot (
  id uuid primary key default gen_random_uuid(),
  weekly_plan_id uuid not null references weekly_plan(id) on delete cascade,
  date date not null,
  activity_id text, -- null = deliberately empty day
  reason_kind text not null
    check (reason_kind in (
      'empty', 'newSkill', 'dueRefresher', 'priority', 'needGap', 'recoveryNeed'
    )),
  reason_skill_id text,
  reason_need_dimension text
    check (reason_need_dimension in ('physical', 'mentalWork', 'scent', 'social', 'recovery')),
  outcome text
    check (outcome in ('succeeded', 'partial', 'notYet', 'skipped', 'notCompleted')),

  unique (weekly_plan_id, date),
  check ((activity_id is null) = (reason_kind = 'empty')),
  check (reason_skill_id is null or reason_kind in ('newSkill', 'dueRefresher', 'priority')),
  check (reason_need_dimension is null or reason_kind = 'needGap')
);

alter table slot enable row level security;

create policy "own slots" on slot
  for all using (
    exists (
      select 1 from weekly_plan
      join dog on dog.id = weekly_plan.dog_id
      where weekly_plan.id = slot.weekly_plan_id and dog.owner = auth.uid()
    )
  ) with check (
    exists (
      select 1 from weekly_plan
      join dog on dog.id = weekly_plan.dog_id
      where weekly_plan.id = slot.weekly_plan_id and dog.owner = auth.uid()
    )
  );

-- ── Indexes for the RLS joins and the usual access patterns ─────────────────

create index skill_state_dog_id_idx on skill_state(dog_id);
create index checkin_dog_id_idx on checkin(dog_id);
create index weekly_plan_dog_id_idx on weekly_plan(dog_id);
create index slot_weekly_plan_id_idx on slot(weekly_plan_id);

-- 0002_content.sql
--
-- The content migration 0001_init.sql already announces: skill and
-- activity, identical for every user (content, not user state). Filled via
-- `infra/supabase/seed/{skill,activity}.sql` (`content/import/*.csv`) or by
-- hand in Supabase Studio — never over anon/authenticated (CLAUDE.md, rules
-- 5 and 10).
--
-- ── Language ─────────────────────────────────────────────────────────────
--
-- Table/column names and structural enum values (`type`, `category`, …) are
-- English, like the rest of the schema (CLAUDE.md, section Sprache) — only
-- the actual trainer-authored text (`skill_text`/`activity_text` below,
-- `content/planer.yaml`, user-visible app text) stays German.
--
-- User-visible text columns (`title`, `sentence`, `instructions`,
-- `success_criterion`, `common_mistakes`, `troubleshooting` on activity;
-- `name`, `description` on skill) live in their own `*_text` table keyed by
-- `(id, locale)` instead of on `skill`/`activity` themselves — a second
-- language later is just more rows, never a schema change. So far there is
-- only `locale = 'de'`. `generate-plan/index.ts` joins against
-- `locale = 'de'` when reading; a later locale picker would plug in there.
--
-- RLS is active, but unlike the state tables: no owner policy, one single
-- "readable by everyone" — there is no write policy for anon/authenticated,
-- so writing stays with the seed script's service-role key (which bypasses
-- RLS anyway).
--
-- Deliberately without a foreign key on prerequisites (array, may reference
-- a skill that doesn't exist yet) — the future content validator checks
-- that, not the DB.

-- ── skill ───────────────────────────────────────────────────────────────────

create table skill (
  id text primary key,
  category text not null
    check (category in (
      'basicCue', 'leashWork', 'impulseControl',
      'dailyRoutine', 'socialBehavior', 'cooperation'
    )),
  prerequisites text[] not null default '{}',
  min_age_weeks int not null default 0 check (min_age_weeks >= 0),
  is_core_skill bool not null default false,
  target_levels jsonb not null, -- {duration, distance, distraction}, each 0-5
  created_at timestamptz not null default now()
);

alter table skill enable row level security;

create policy "skill is publicly readable" on skill
  for select using (true);

create table skill_text (
  skill_id text not null references skill(id) on delete cascade,
  locale text not null default 'de',
  name text not null,
  description text not null,

  primary key (skill_id, locale)
);

alter table skill_text enable row level security;

create policy "skill_text is publicly readable" on skill_text
  for select using (true);

create index skill_text_skill_id_idx on skill_text(skill_id);

-- ── activity ────────────────────────────────────────────────────────────────

create table activity (
  id text primary key,
  type text not null
    check (type in ('training', 'enrichment', 'everyday', 'rest', 'care')),
  trains_skill text references skill(id), -- null for enrichment
  needs jsonb not null, -- {physical, mentalWork, scent, social, recovery}, each 0-3
  arousal int not null check (arousal between 0 and 3),
  duration_min int not null check (duration_min >= 0),
  duration_max int not null check (duration_max >= duration_min),
  location text not null check (location in ('indoors', 'outdoors', 'onTheGo', 'any')),
  for_distraction jsonb, -- [min, max] — only when type = training
  is_refresher bool not null default false,
  heat_suitable bool not null default true,
  rain_suitable bool not null default true,
  darkness_suitable bool not null default true,
  joint_straining bool not null default false,
  seasonal_window jsonb, -- [month, …] or null
  equipment text[] not null default '{}',
  second_person bool not null default false,
  min_age_weeks int not null default 0 check (min_age_weeks >= 0),
  max_age_weeks int,
  suitability jsonb not null default '{}'::jsonb, -- {breedGroup: weight -1…+2}
  variance_group text not null,
  cooldown_days int not null default 0 check (cooldown_days >= 0),
  illustration text,
  created_at timestamptz not null default now()
);

alter table activity enable row level security;

create policy "activity is publicly readable" on activity
  for select using (true);

create index activity_trains_skill_idx on activity(trains_skill);

create table activity_text (
  activity_id text not null references activity(id) on delete cascade,
  locale text not null default 'de',
  title text not null,
  sentence text not null,
  instructions text[] not null default '{}',
  success_criterion text not null,
  common_mistakes text[] not null default '{}',
  troubleshooting jsonb not null default '[]'::jsonb, -- [{problem, answer}]

  primary key (activity_id, locale)
);

alter table activity_text enable row level security;

create policy "activity_text is publicly readable" on activity_text
  for select using (true);

create index activity_text_activity_id_idx on activity_text(activity_id);

-- 0003_rasse.sql
--
-- Pulls the breed-specific paths flagged "not in MVP" in docs/produkt.md
-- forward (owner's decision, see docs/specs/rasse-modellieren.md):
-- `dog.breed_group` becomes a property of its own `breed` table, and a dog
-- links to one or more breeds via `dog_breed`. That makes the path to real,
-- individually named breeds (instead of just nine groups) later a matter of
-- pure data entry, no further schema change.
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

alter table dog drop column breed_group;

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
