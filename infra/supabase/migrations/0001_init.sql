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
