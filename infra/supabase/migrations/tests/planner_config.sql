-- pgTAP test for planner_config (0004_planer_konfig.sql).

begin;
select plan(5);

select has_table('public', 'planner_config', 'table planner_config exists');
select ok(
  (select relrowsecurity from pg_class where relname = 'planner_config'),
  'RLS is enabled on planner_config'
);

insert into planner_config (version, config) values (1, '{"version": 1, "perioden": {"laenge_tage": 7}}'::jsonb);

insert into auth.users (id) values ('11111111-1111-1111-1111-111111111111');
set local role authenticated;
select set_config('request.jwt.claims', json_build_object('sub', '11111111-1111-1111-1111-111111111111')::text, true);

select is(
  (select count(*)::int from planner_config),
  1,
  'a signed-in user sees the config without having their own dog'
);

select throws_ok(
  $$ insert into planner_config (version, config) values (2, '{}'::jsonb) $$,
  '42501',
  null,
  'a signed-in user cannot create a config'
);

reset role;

select is(
  (select config ->> 'version' from planner_config where version = 1),
  '1',
  'config carries the full parsed YAML structure'
);

select * from finish();
rollback;
