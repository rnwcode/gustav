begin;
select plan(5);

select has_table('public', 'checkin', 'Tabelle checkin existiert');
select ok(
  (select relrowsecurity from pg_class where relname = 'checkin'),
  'RLS ist auf checkin aktiviert'
);

insert into auth.users (id) values
  ('11111111-1111-1111-1111-111111111111'),
  ('22222222-2222-2222-2222-222222222222');

insert into hund (id, besitzer, name, geburtsdatum, einzugsdatum, herkunft, groessenklasse)
values ('33333333-3333-3333-3333-333333333333', '11111111-1111-1111-1111-111111111111',
        'Gustav', '2023-01-01', '2023-01-15', 'zuechter', 'mittel');
insert into hund (id, besitzer, name, geburtsdatum, einzugsdatum, herkunft, groessenklasse)
values ('44444444-4444-4444-4444-444444444444', '22222222-2222-2222-2222-222222222222',
        'Bello', '2022-01-01', '2022-01-15', 'tierschutz', 'gross');

insert into checkin (hund_id, periode_start, quelle) values
  ('33333333-3333-3333-3333-333333333333', '2026-03-16', 'chip');
insert into checkin (hund_id, periode_start, quelle) values
  ('44444444-4444-4444-4444-444444444444', '2026-03-16', 'default');

set local role authenticated;
select set_config('request.jwt.claims', json_build_object('sub', '11111111-1111-1111-1111-111111111111')::text, true);

select is(
  (select count(*)::int from checkin),
  1,
  'Nutzer sieht nur die eigenen Checkins'
);
select is(
  (select quelle from checkin limit 1),
  'chip',
  'und zwar den richtigen'
);

reset role;

select throws_ok(
  $$ insert into checkin (hund_id, periode_start)
     values ('33333333-3333-3333-3333-333333333333', '2026-03-16') $$,
  '23505',
  null,
  'derselbe Hund kann nicht zweimal fuer denselben Periodenstart eingecheckt werden'
);

select * from finish();
rollback;
