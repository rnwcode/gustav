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
