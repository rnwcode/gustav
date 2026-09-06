-- pgTAP test for reminder + slot.day_text (0005_reminder.sql).

begin;
select plan(8);

select has_table('public', 'reminder', 'table reminder exists');
select ok(
  (select relrowsecurity from pg_class where relname = 'reminder'),
  'RLS is enabled on reminder'
);
select has_column('public', 'slot', 'day_text', 'slot has day_text');
select has_column('public', 'slot', 'day_text_generated_at', 'slot has day_text_generated_at');

insert into auth.users (id) values
  ('11111111-1111-1111-1111-111111111111'),
  ('22222222-2222-2222-2222-222222222222');

insert into dog (id, owner, name, birth_date, arrival_date, origin, size_class)
values ('33333333-3333-3333-3333-333333333333', '11111111-1111-1111-1111-111111111111',
        'Gustav', '2023-01-01', '2023-01-15', 'breeder', 'medium');
insert into dog (id, owner, name, birth_date, arrival_date, origin, size_class)
values ('44444444-4444-4444-4444-444444444444', '22222222-2222-2222-2222-222222222222',
        'Bello', '2022-01-01', '2022-01-15', 'shelter', 'large');

insert into reminder (dog_id, kind, due_date, lead_time_days) values
  ('33333333-3333-3333-3333-333333333333', 'vaccination', '2026-01-15', 0);
insert into reminder (dog_id, kind, due_date, lead_time_days) values
  ('44444444-4444-4444-4444-444444444444', 'weighIn', '2026-02-01', 14);

set local role authenticated;
select set_config('request.jwt.claims', json_build_object('sub', '11111111-1111-1111-1111-111111111111')::text, true);

select is(
  (select count(*)::int from reminder),
  1,
  'user sees only their own dog''s reminders'
);
select is(
  (select kind from reminder limit 1),
  'vaccination',
  'and the right one'
);

reset role;

-- An unknown kind is rejected (check constraint, independent of RLS).
select throws_ok(
  $$ insert into reminder (dog_id, kind, due_date)
     values ('33333333-3333-3333-3333-333333333333', 'placeholder', '2026-01-01') $$,
  '23514',
  null,
  'an unknown kind is rejected'
);

-- A negative lead time is rejected.
select throws_ok(
  $$ insert into reminder (dog_id, kind, due_date, lead_time_days)
     values ('33333333-3333-3333-3333-333333333333', 'weighIn', '2026-01-01', -1) $$,
  '23514',
  null,
  'a negative lead_time_days is rejected'
);

select * from finish();
rollback;
