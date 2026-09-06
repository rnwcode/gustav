-- pgTAP-Test für die Tabelle hund. Läuft über `supabase test db`
-- (nutzt den lokalen Supabase-Stack, der auth.uid()/auth.users und die
-- Rollen anon/authenticated bereits mitbringt).

begin;
select plan(6);

select has_table('public', 'hund', 'Tabelle hund existiert');
select ok(
  (select relrowsecurity from pg_class where relname = 'hund'),
  'RLS ist auf hund aktiviert'
);
select isnt_empty(
  $$ select 1 from pg_policies where tablename = 'hund' $$,
  'hund hat mindestens eine Policy'
);

-- Zwei Nutzer, je ein Hund.
insert into auth.users (id) values
  ('11111111-1111-1111-1111-111111111111'),
  ('22222222-2222-2222-2222-222222222222');

insert into hund (id, besitzer, name, geburtsdatum, einzugsdatum, herkunft, groessenklasse)
values (
  '33333333-3333-3333-3333-333333333333',
  '11111111-1111-1111-1111-111111111111',
  'Gustav', '2023-01-01', '2023-01-15', 'zuechter', 'mittel'
);
insert into hund (id, besitzer, name, geburtsdatum, einzugsdatum, herkunft, groessenklasse)
values (
  '44444444-4444-4444-4444-444444444444',
  '22222222-2222-2222-2222-222222222222',
  'Bello', '2022-01-01', '2022-01-15', 'tierschutz', 'gross'
);

set local role authenticated;
select set_config('request.jwt.claims', json_build_object('sub', '11111111-1111-1111-1111-111111111111')::text, true);

select is(
  (select count(*)::int from hund),
  1,
  'Nutzer sieht nur den eigenen Hund'
);
select is(
  (select name from hund limit 1),
  'Gustav',
  'und zwar den richtigen'
);

update hund set name = 'Umbenannt' where id = '44444444-4444-4444-4444-444444444444';
select is(
  (select count(*)::int from hund where id = '44444444-4444-4444-4444-444444444444' and name = 'Umbenannt'),
  0,
  'ein Update auf den fremden Hund trifft keine Zeile (RLS filtert ihn aus der Sicht heraus)'
);

reset role;
select * from finish();
rollback;
