begin;
select plan(6);

select has_table('public', 'slot', 'Tabelle slot existiert');
select ok(
  (select relrowsecurity from pg_class where relname = 'slot'),
  'RLS ist auf slot aktiviert'
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

insert into wochenplan (id, hund_id, periode_start, periode_ende, algorithmus_version, konfig_version)
values ('55555555-5555-5555-5555-555555555555', '33333333-3333-3333-3333-333333333333',
        '2026-03-16', '2026-03-22', 1, 1);
insert into wochenplan (id, hund_id, periode_start, periode_ende, algorithmus_version, konfig_version)
values ('66666666-6666-6666-6666-666666666666', '44444444-4444-4444-4444-444444444444',
        '2026-03-16', '2026-03-22', 1, 1);

insert into slot (wochenplan_id, datum, aktivitaet_id, begruendung_art, begruendung_skill_id) values
  ('55555555-5555-5555-5555-555555555555', '2026-03-16', 'schnueffelteppich_einfuehrung', 'neuer_skill', 'rueckruf');
insert into slot (wochenplan_id, datum, begruendung_art) values
  ('66666666-6666-6666-6666-666666666666', '2026-03-16', 'leer');

-- Der Join zur RLS-Policy geht ueber zwei Ebenen (slot -> wochenplan -> hund).
set local role authenticated;
select set_config('request.jwt.claims', json_build_object('sub', '11111111-1111-1111-1111-111111111111')::text, true);

select is(
  (select count(*)::int from slot),
  1,
  'Nutzer sieht nur Slots aus dem eigenen Wochenplan (zweistufiger Join)'
);
select is(
  (select aktivitaet_id from slot limit 1),
  'schnueffelteppich_einfuehrung',
  'und zwar den richtigen'
);

reset role;

select throws_ok(
  $$ insert into slot (wochenplan_id, datum, begruendung_art)
     values ('55555555-5555-5555-5555-555555555555', '2026-03-17', 'neuer_skill') $$,
  '23514',
  null,
  'ein nicht-leerer Slot ohne aktivitaet_id wird abgelehnt'
);
select throws_ok(
  $$ insert into slot (wochenplan_id, datum, aktivitaet_id, begruendung_art)
     values ('55555555-5555-5555-5555-555555555555', '2026-03-17', 'x', 'leer') $$,
  '23514',
  null,
  'ein leerer Slot mit aktivitaet_id wird abgelehnt'
);

select * from finish();
rollback;
