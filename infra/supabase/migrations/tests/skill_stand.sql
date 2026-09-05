begin;
select plan(5);

select has_table('public', 'skill_stand', 'Tabelle skill_stand existiert');
select ok(
  (select relrowsecurity from pg_class where relname = 'skill_stand'),
  'RLS ist auf skill_stand aktiviert'
);

insert into auth.users (id) values
  ('11111111-1111-1111-1111-111111111111'),
  ('22222222-2222-2222-2222-222222222222');

insert into hund (id, besitzer, name, geburtsdatum, einzugsdatum, herkunft, rassegruppe, groessenklasse)
values ('33333333-3333-3333-3333-333333333333', '11111111-1111-1111-1111-111111111111',
        'Gustav', '2023-01-01', '2023-01-15', 'zuechter', 'huete', 'mittel');
insert into hund (id, besitzer, name, geburtsdatum, einzugsdatum, herkunft, rassegruppe, groessenklasse)
values ('44444444-4444-4444-4444-444444444444', '22222222-2222-2222-2222-222222222222',
        'Bello', '2022-01-01', '2022-01-15', 'tierschutz', 'misch', 'gross');

insert into skill_stand (hund_id, skill_id, status) values
  ('33333333-3333-3333-3333-333333333333', 'rueckruf', 'aufbau');
insert into skill_stand (hund_id, skill_id, status) values
  ('44444444-4444-4444-4444-444444444444', 'sitz', 'gefestigt');

set local role authenticated;
select set_config('request.jwt.claims', json_build_object('sub', '11111111-1111-1111-1111-111111111111')::text, true);

select is(
  (select count(*)::int from skill_stand),
  1,
  'Nutzer sieht nur die Skill-Staende des eigenen Hundes'
);
select is(
  (select skill_id from skill_stand limit 1),
  'rueckruf',
  'und zwar den richtigen'
);

reset role;

-- Ungueltiger Status wird abgelehnt (Check-Constraint, unabhaengig von RLS).
select throws_ok(
  $$ insert into skill_stand (hund_id, skill_id, status)
     values ('33333333-3333-3333-3333-333333333333', 'platzhalten', 'unbekannt') $$,
  '23514',
  null,
  'ein unbekannter status wird abgelehnt'
);

select * from finish();
rollback;
