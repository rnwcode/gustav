-- pgTAP-Test für planer_konfig (0004_planer_konfig.sql).

begin;
select plan(5);

select has_table('public', 'planer_konfig', 'Tabelle planer_konfig existiert');
select ok(
  (select relrowsecurity from pg_class where relname = 'planer_konfig'),
  'RLS ist auf planer_konfig aktiviert'
);

insert into planer_konfig (version, konfig) values (1, '{"version": 1, "perioden": {"laenge_tage": 7}}'::jsonb);

insert into auth.users (id) values ('11111111-1111-1111-1111-111111111111');
set local role authenticated;
select set_config('request.jwt.claims', json_build_object('sub', '11111111-1111-1111-1111-111111111111')::text, true);

select is(
  (select count(*)::int from planer_konfig),
  1,
  'ein eingeloggter Nutzer sieht die Konfiguration, ohne einen eigenen Hund zu haben'
);

select throws_ok(
  $$ insert into planer_konfig (version, konfig) values (2, '{}'::jsonb) $$,
  '42501',
  null,
  'ein eingeloggter Nutzer kann keine Konfiguration anlegen'
);

reset role;

select is(
  (select konfig ->> 'version' from planer_konfig where version = 1),
  '1',
  'konfig traegt die vollstaendige geparste YAML-Struktur'
);

select * from finish();
rollback;
