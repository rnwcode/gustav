begin;
select plan(5);

select has_table('public', 'haushalt', 'Tabelle haushalt existiert');
select ok(
  (select relrowsecurity from pg_class where relname = 'haushalt'),
  'RLS ist auf haushalt aktiviert'
);
select col_is_unique('public', 'haushalt', 'besitzer', 'besitzer ist eindeutig (ein Haushalt pro Nutzer im MVP)');

insert into auth.users (id) values
  ('11111111-1111-1111-1111-111111111111'),
  ('22222222-2222-2222-2222-222222222222');

insert into haushalt (besitzer, wohnsituation, umgebung, erfahrung, zeitbudget_werktag_min, zeitbudget_wochenende_min)
values ('11111111-1111-1111-1111-111111111111', 'wohnung', 'stadt', 'erfahren', 30, 60);
insert into haushalt (besitzer, wohnsituation, umgebung, erfahrung, zeitbudget_werktag_min, zeitbudget_wochenende_min)
values ('22222222-2222-2222-2222-222222222222', 'haus_garten', 'land', 'ersthund', 45, 90);

set local role authenticated;
select set_config('request.jwt.claims', json_build_object('sub', '11111111-1111-1111-1111-111111111111')::text, true);

select is(
  (select count(*)::int from haushalt),
  1,
  'Nutzer sieht nur den eigenen Haushalt'
);
select is(
  (select wohnsituation from haushalt limit 1),
  'wohnung',
  'und zwar den richtigen'
);

reset role;
select * from finish();
rollback;
