begin;
select plan(5);

select has_table('public', 'household', 'table household exists');
select ok(
  (select relrowsecurity from pg_class where relname = 'household'),
  'RLS is enabled on household'
);
select col_is_unique('public', 'household', 'owner', 'owner is unique (one household per user in the MVP)');

insert into auth.users (id) values
  ('11111111-1111-1111-1111-111111111111'),
  ('22222222-2222-2222-2222-222222222222');

insert into household (owner, housing_type, surroundings, experience, weekday_time_budget_min, weekend_time_budget_min)
values ('11111111-1111-1111-1111-111111111111', 'apartment', 'city', 'experienced', 30, 60);
insert into household (owner, housing_type, surroundings, experience, weekday_time_budget_min, weekend_time_budget_min)
values ('22222222-2222-2222-2222-222222222222', 'houseWithGarden', 'countryside', 'firstTimeOwner', 45, 90);

set local role authenticated;
select set_config('request.jwt.claims', json_build_object('sub', '11111111-1111-1111-1111-111111111111')::text, true);

select is(
  (select count(*)::int from household),
  1,
  'user sees only their own household'
);
select is(
  (select housing_type from household limit 1),
  'apartment',
  'and the right one'
);

reset role;
select * from finish();
rollback;
