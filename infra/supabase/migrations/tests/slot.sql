begin;
select plan(6);

select has_table('public', 'slot', 'table slot exists');
select ok(
  (select relrowsecurity from pg_class where relname = 'slot'),
  'RLS is enabled on slot'
);

insert into auth.users (id) values
  ('11111111-1111-1111-1111-111111111111'),
  ('22222222-2222-2222-2222-222222222222');

insert into dog (id, owner, name, birth_date, arrival_date, origin, size_class)
values ('33333333-3333-3333-3333-333333333333', '11111111-1111-1111-1111-111111111111',
        'Gustav', '2023-01-01', '2023-01-15', 'breeder', 'medium');
insert into dog (id, owner, name, birth_date, arrival_date, origin, size_class)
values ('44444444-4444-4444-4444-444444444444', '22222222-2222-2222-2222-222222222222',
        'Bello', '2022-01-01', '2022-01-15', 'shelter', 'large');

insert into weekly_plan (id, dog_id, period_start, period_end, algorithm_version, config_version)
values ('55555555-5555-5555-5555-555555555555', '33333333-3333-3333-3333-333333333333',
        '2026-03-16', '2026-03-22', 1, 1);
insert into weekly_plan (id, dog_id, period_start, period_end, algorithm_version, config_version)
values ('66666666-6666-6666-6666-666666666666', '44444444-4444-4444-4444-444444444444',
        '2026-03-16', '2026-03-22', 1, 1);

insert into slot (weekly_plan_id, date, activity_id, reason_kind, reason_skill_id) values
  ('55555555-5555-5555-5555-555555555555', '2026-03-16', 'sniffing_mat_intro', 'newSkill', 'recall');
insert into slot (weekly_plan_id, date, reason_kind) values
  ('66666666-6666-6666-6666-666666666666', '2026-03-16', 'empty');

-- The join to the RLS policy goes through two levels (slot -> weekly_plan -> dog).
set local role authenticated;
select set_config('request.jwt.claims', json_build_object('sub', '11111111-1111-1111-1111-111111111111')::text, true);

select is(
  (select count(*)::int from slot),
  1,
  'user sees only slots from their own weekly plan (two-step join)'
);
select is(
  (select activity_id from slot limit 1),
  'sniffing_mat_intro',
  'and the right one'
);

reset role;

select throws_ok(
  $$ insert into slot (weekly_plan_id, date, reason_kind)
     values ('55555555-5555-5555-5555-555555555555', '2026-03-17', 'newSkill') $$,
  '23514',
  null,
  'a non-empty slot without activity_id is rejected'
);
select throws_ok(
  $$ insert into slot (weekly_plan_id, date, activity_id, reason_kind)
     values ('55555555-5555-5555-5555-555555555555', '2026-03-17', 'x', 'empty') $$,
  '23514',
  null,
  'an empty slot with activity_id is rejected'
);

select * from finish();
rollback;
