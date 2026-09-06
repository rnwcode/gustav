-- 0005_reminder.sql
--
-- docs/specs/tagestext.md: `reminder` is per-dog state (not content) that
-- `generate-day-text` reads to fold real-world facts (a due vaccination, a
-- weigh-in) into the daily prose text. RLS follows the same pattern as
-- `skill_state`: no direct owner column, own rows via a join back to
-- `dog.owner`.
--
-- `lead_time_days` replaces a fixed "how many days ahead is this worth
-- mentioning" window: a fixed appointment (the vet already set a date)
-- uses 0 — worth mentioning only from that day on, and, once overdue,
-- until done. A loose task ("get a vaccination appointment") sets a
-- higher lead_time_days — worth mentioning starting that many days before
-- due_date. One column covers both without two separate concepts.
--
-- `slot.day_text`/`day_text_generated_at`: the daily prose text
-- `generate-day-text` produces. Deliberately outside slot's
-- reproducibility guarantee (rule 10 in CLAUDE.md covers `reason`/
-- `outcome`, not this) — overwritable, no version tracked alongside it.

create table reminder (
  id uuid primary key default gen_random_uuid(),
  dog_id uuid not null references dog(id) on delete cascade,
  kind text not null check (kind in ('vaccination', 'weighIn')),
  due_date date not null,
  lead_time_days int not null default 0 check (lead_time_days >= 0),
  done_at timestamptz,
  created_at timestamptz not null default now()
);

alter table reminder enable row level security;

create policy "own reminders" on reminder
  for all using (
    exists (select 1 from dog where dog.id = reminder.dog_id and dog.owner = auth.uid())
  ) with check (
    exists (select 1 from dog where dog.id = reminder.dog_id and dog.owner = auth.uid())
  );

alter table slot add column day_text text;
alter table slot add column day_text_generated_at timestamptz;
