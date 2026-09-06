begin;
select plan(5);

select has_table('public', 'skill_state', 'table skill_state exists');
select ok(
  (select relrowsecurity from pg_class where relname = 'skill_state'),
  'RLS is enabled on skill_state'
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

insert into skill_state (dog_id, skill_id, status) values
  ('33333333-3333-3333-3333-333333333333', 'recall', 'building');
insert into skill_state (dog_id, skill_id, status) values
  ('44444444-4444-4444-4444-444444444444', 'sit', 'consolidated');

set local role authenticated;
select set_config('request.jwt.claims', json_build_object('sub', '11111111-1111-1111-1111-111111111111')::text, true);

select is(
  (select count(*)::int from skill_state),
  1,
  'user sees only their own dog''s skill states'
);
select is(
  (select skill_id from skill_state limit 1),
  'recall',
  'and the right one'
);

reset role;

-- An invalid status is rejected (check constraint, independent of RLS).
select throws_ok(
  $$ insert into skill_state (dog_id, skill_id, status)
     values ('33333333-3333-3333-3333-333333333333', 'placeholder', 'unknown') $$,
  '23514',
  null,
  'an unknown status is rejected'
);

select * from finish();
rollback;
