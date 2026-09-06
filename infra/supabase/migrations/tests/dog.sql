-- pgTAP test for the dog table. Runs via `supabase test db` (uses the
-- local Supabase stack, which already brings auth.uid()/auth.users and the
-- anon/authenticated roles).

begin;
select plan(6);

select has_table('public', 'dog', 'table dog exists');
select ok(
  (select relrowsecurity from pg_class where relname = 'dog'),
  'RLS is enabled on dog'
);
select isnt_empty(
  $$ select 1 from pg_policies where tablename = 'dog' $$,
  'dog has at least one policy'
);

-- Two users, one dog each.
insert into auth.users (id) values
  ('11111111-1111-1111-1111-111111111111'),
  ('22222222-2222-2222-2222-222222222222');

insert into dog (id, owner, name, birth_date, arrival_date, origin, size_class)
values (
  '33333333-3333-3333-3333-333333333333',
  '11111111-1111-1111-1111-111111111111',
  'Gustav', '2023-01-01', '2023-01-15', 'breeder', 'medium'
);
insert into dog (id, owner, name, birth_date, arrival_date, origin, size_class)
values (
  '44444444-4444-4444-4444-444444444444',
  '22222222-2222-2222-2222-222222222222',
  'Bello', '2022-01-01', '2022-01-15', 'shelter', 'large'
);

set local role authenticated;
select set_config('request.jwt.claims', json_build_object('sub', '11111111-1111-1111-1111-111111111111')::text, true);

select is(
  (select count(*)::int from dog),
  1,
  'user sees only their own dog'
);
select is(
  (select name from dog limit 1),
  'Gustav',
  'and the right one'
);

update dog set name = 'Renamed' where id = '44444444-4444-4444-4444-444444444444';
select is(
  (select count(*)::int from dog where id = '44444444-4444-4444-4444-444444444444' and name = 'Renamed'),
  0,
  'an update on someone else''s dog hits no row (RLS filters it out of view)'
);

reset role;
select * from finish();
rollback;
