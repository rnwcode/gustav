-- pgTAP-Test für rasse/hund_rasse (0003_rasse.sql) und die neuen
-- hund-Spalten geschlecht/kastriert.

begin;
select plan(10);

select has_table('public', 'rasse', 'Tabelle rasse existiert');
select has_table('public', 'hund_rasse', 'Tabelle hund_rasse existiert');
select ok(
  (select relrowsecurity from pg_class where relname = 'rasse'),
  'RLS ist auf rasse aktiviert'
);
select ok(
  (select relrowsecurity from pg_class where relname = 'hund_rasse'),
  'RLS ist auf hund_rasse aktiviert'
);

-- Die neun Gruppen-Platzhalter aus der Migration selbst sind schon da.
select is(
  (select count(*)::int from rasse),
  9,
  'die neun Gruppen-Platzhalter sind geseedet'
);

insert into auth.users (id) values ('11111111-1111-1111-1111-111111111111');
insert into hund (id, besitzer, name, geburtsdatum, einzugsdatum, herkunft, groessenklasse, geschlecht, kastriert)
values (
  '33333333-3333-3333-3333-333333333333',
  '11111111-1111-1111-1111-111111111111',
  'Gustav', '2023-01-01', '2023-01-15', 'zuechter', 'mittel', 'ruede', true
);
insert into hund_rasse (hund_id, rasse_id) values
  ('33333333-3333-3333-3333-333333333333', 'gruppe_huete');

set local role authenticated;
select set_config('request.jwt.claims', json_build_object('sub', '11111111-1111-1111-1111-111111111111')::text, true);

select is(
  (select count(*)::int from rasse),
  9,
  'rasse ist auch ohne eigenen Hund oeffentlich lesbar'
);
select is(
  (select count(*)::int from hund_rasse),
  1,
  'Nutzer sieht die hund_rasse-Zeile des eigenen Hundes'
);

reset role;
insert into auth.users (id) values ('22222222-2222-2222-2222-222222222222');
insert into hund (id, besitzer, name, geburtsdatum, einzugsdatum, herkunft, groessenklasse)
values (
  '44444444-4444-4444-4444-444444444444',
  '22222222-2222-2222-2222-222222222222',
  'Bello', '2022-01-01', '2022-01-15', 'tierschutz', 'gross'
);
insert into hund_rasse (hund_id, rasse_id) values
  ('44444444-4444-4444-4444-444444444444', 'gruppe_misch');

set local role authenticated;
select set_config('request.jwt.claims', json_build_object('sub', '11111111-1111-1111-1111-111111111111')::text, true);
select is(
  (select count(*)::int from hund_rasse),
  1,
  'aber nicht die hund_rasse-Zeile des fremden Hundes'
);
reset role;

-- Ungültige Gewichtung und ungültiges Geschlecht werden abgelehnt
-- (Check-Constraints, unabhängig von RLS).
select throws_ok(
  $$ insert into hund_rasse (hund_id, rasse_id, gewichtung)
     values ('33333333-3333-3333-3333-333333333333', 'gruppe_jagd', 0) $$,
  '23514',
  null,
  'eine Gewichtung von 0 wird abgelehnt'
);
select throws_ok(
  $$ update hund set geschlecht = 'unbekannt' where id = '33333333-3333-3333-3333-333333333333' $$,
  '23514',
  null,
  'ein unbekanntes Geschlecht wird abgelehnt'
);

select * from finish();
rollback;
