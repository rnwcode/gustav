begin;
select plan(5);

select has_table('public', 'wochenplan', 'Tabelle wochenplan existiert');
select ok(
  (select relrowsecurity from pg_class where relname = 'wochenplan'),
  'RLS ist auf wochenplan aktiviert'
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

insert into wochenplan (hund_id, periode_start, periode_ende, algorithmus_version, konfig_version)
values ('33333333-3333-3333-3333-333333333333', '2026-03-16', '2026-03-22', 1, 1);
insert into wochenplan (hund_id, periode_start, periode_ende, algorithmus_version, konfig_version)
values ('44444444-4444-4444-4444-444444444444', '2026-03-16', '2026-03-22', 1, 1);

set local role authenticated;
select set_config('request.jwt.claims', json_build_object('sub', '11111111-1111-1111-1111-111111111111')::text, true);

select is(
  (select count(*)::int from wochenplan),
  1,
  'Nutzer sieht nur die eigenen Wochenplaene'
);
select is(
  (select hund_id from wochenplan limit 1),
  '33333333-3333-3333-3333-333333333333',
  'und zwar fuer den richtigen Hund'
);

reset role;

select throws_ok(
  $$ insert into wochenplan (hund_id, periode_start, periode_ende, algorithmus_version, konfig_version)
     values ('33333333-3333-3333-3333-333333333333', '2026-03-16', '2026-03-10', 1, 1) $$,
  '23514',
  null,
  'periode_ende vor periode_start wird abgelehnt'
);

select * from finish();
rollback;
