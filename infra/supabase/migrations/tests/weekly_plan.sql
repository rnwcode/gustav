begin;
select plan(5);

select has_table('public', 'weekly_plan', 'table weekly_plan exists');
select ok(
  (select relrowsecurity from pg_class where relname = 'weekly_plan'),
  'RLS is enabled on weekly_plan'
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

insert into weekly_plan (dog_id, period_start, period_end, algorithm_version, config_version)
values ('33333333-3333-3333-3333-333333333333', '2026-03-16', '2026-03-22', 1, 1);
insert into weekly_plan (dog_id, period_start, period_end, algorithm_version, config_version)
values ('44444444-4444-4444-4444-444444444444', '2026-03-16', '2026-03-22', 1, 1);

set local role authenticated;
select set_config('request.jwt.claims', json_build_object('sub', '11111111-1111-1111-1111-111111111111')::text, true);

select is(
  (select count(*)::int from weekly_plan),
  1,
  'user sees only their own weekly plans'
);
select is(
  (select dog_id from weekly_plan limit 1),
  '33333333-3333-3333-3333-333333333333',
  'and for the right dog'
);

reset role;

select throws_ok(
  $$ insert into weekly_plan (dog_id, period_start, period_end, algorithm_version, config_version)
     values ('33333333-3333-3333-3333-333333333333', '2026-03-16', '2026-03-10', 1, 1) $$,
  '23514',
  null,
  'period_end before period_start is rejected'
);

select * from finish();
rollback;
