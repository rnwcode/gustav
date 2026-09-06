-- pgTAP test for breed/dog_breed (0003_rasse.sql) and the new dog columns
-- gender/neutered.

begin;
select plan(10);

select has_table('public', 'breed', 'table breed exists');
select has_table('public', 'dog_breed', 'table dog_breed exists');
select ok(
  (select relrowsecurity from pg_class where relname = 'breed'),
  'RLS is enabled on breed'
);
select ok(
  (select relrowsecurity from pg_class where relname = 'dog_breed'),
  'RLS is enabled on dog_breed'
);

-- The nine group placeholders from the migration itself are already there.
select is(
  (select count(*)::int from breed),
  9,
  'the nine group placeholders are seeded'
);

insert into auth.users (id) values ('11111111-1111-1111-1111-111111111111');
insert into dog (id, owner, name, birth_date, arrival_date, origin, size_class, gender, neutered)
values (
  '33333333-3333-3333-3333-333333333333',
  '11111111-1111-1111-1111-111111111111',
  'Gustav', '2023-01-01', '2023-01-15', 'breeder', 'medium', 'male', true
);
insert into dog_breed (dog_id, breed_id) values
  ('33333333-3333-3333-3333-333333333333', 'group_herding');

set local role authenticated;
select set_config('request.jwt.claims', json_build_object('sub', '11111111-1111-1111-1111-111111111111')::text, true);

select is(
  (select count(*)::int from breed),
  9,
  'breed is publicly readable even without an own dog'
);
select is(
  (select count(*)::int from dog_breed),
  1,
  'user sees the dog_breed row for their own dog'
);

reset role;
insert into auth.users (id) values ('22222222-2222-2222-2222-222222222222');
insert into dog (id, owner, name, birth_date, arrival_date, origin, size_class)
values (
  '44444444-4444-4444-4444-444444444444',
  '22222222-2222-2222-2222-222222222222',
  'Bello', '2022-01-01', '2022-01-15', 'shelter', 'large'
);
insert into dog_breed (dog_id, breed_id) values
  ('44444444-4444-4444-4444-444444444444', 'group_mixed');

set local role authenticated;
select set_config('request.jwt.claims', json_build_object('sub', '11111111-1111-1111-1111-111111111111')::text, true);
select is(
  (select count(*)::int from dog_breed),
  1,
  'but not the dog_breed row of someone else''s dog'
);
reset role;

-- An invalid weight and an invalid gender are rejected (check constraints,
-- independent of RLS).
select throws_ok(
  $$ insert into dog_breed (dog_id, breed_id, weight)
     values ('33333333-3333-3333-3333-333333333333', 'group_hunting', 0) $$,
  '23514',
  null,
  'a weight of 0 is rejected'
);
select throws_ok(
  $$ update dog set gender = 'unknown' where id = '33333333-3333-3333-3333-333333333333' $$,
  '23514',
  null,
  'an unknown gender is rejected'
);

select * from finish();
rollback;
