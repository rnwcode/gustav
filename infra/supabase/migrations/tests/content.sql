-- pgTAP-Test für skill/aktivitaet (0002_content.sql). Anders als bei den
-- Zustandstabellen geht es hier nicht um Besitzer-Isolation, sondern um
-- „für alle lesbar, für niemanden außer dem Seed-Skript schreibbar".

begin;
select plan(10);

select has_table('public', 'skill', 'Tabelle skill existiert');
select has_table('public', 'aktivitaet', 'Tabelle aktivitaet existiert');
select ok(
  (select relrowsecurity from pg_class where relname = 'skill'),
  'RLS ist auf skill aktiviert'
);
select ok(
  (select relrowsecurity from pg_class where relname = 'aktivitaet'),
  'RLS ist auf aktivitaet aktiviert'
);

insert into skill (id, name, kategorie, min_alter_wochen, ist_kernskill, zielstufen, beschreibung)
values (
  'rueckruf', 'Rückruf', 'grundsignal', 9, true,
  '{"dauer": 1, "distanz": 3, "ablenkung": 4}'::jsonb,
  'Der Hund kommt zuverlässig zurück.'
);

insert into aktivitaet (
  id, titel, satz, typ, trainiert_skill, bedarf, belastung,
  dauer_min, dauer_max, ort, varianzgruppe, erfolgskriterium
) values (
  'schnueffelteppich_einfuehrung', 'Schnüffelteppich, erste Runde',
  'Futter im Teppich verstecken und suchen lassen.', 'beschaeftigung', null,
  '{"koerperlich": 1, "kopfarbeit": 3, "nase": 3, "sozial": 0, "erholung": 1}'::jsonb,
  1, 5, 15, 'drinnen', 'nasenarbeit_drinnen', 'Er sucht selbstständig weiter.'
);

set local role authenticated;
select set_config('request.jwt.claims', json_build_object('sub', '11111111-1111-1111-1111-111111111111')::text, true);

select is(
  (select count(*)::int from skill),
  1,
  'ein eingeloggter Nutzer sieht den Content, ohne einen eigenen Hund zu haben'
);
select is(
  (select count(*)::int from aktivitaet),
  1,
  'dasselbe für aktivitaet'
);

select throws_ok(
  $$ insert into skill (id, name, kategorie, min_alter_wochen, ist_kernskill, zielstufen, beschreibung)
     values ('sitz', 'Sitz', 'grundsignal', 9, true, '{"dauer":0,"distanz":0,"ablenkung":0}'::jsonb, 'x') $$,
  '42501',
  null,
  'ein eingeloggter Nutzer kann keinen Skill anlegen'
);
-- Kein Fehler, aber auch keine getroffene Zeile: RLS ohne UPDATE-Policy
-- filtert die Zeile aus der Sicht heraus, statt die Anweisung abzulehnen
-- (dasselbe Muster wie in tests/hund.sql).
update skill set name = 'Umbenannt' where id = 'rueckruf';
select is(
  (select count(*)::int from skill where id = 'rueckruf' and name = 'Umbenannt'),
  0,
  'und auch keinen bestehenden Skill ändern (RLS filtert ihn aus der Sicht heraus)'
);

reset role;

select is(
  (select name from skill where id = 'rueckruf'),
  'Rückruf',
  'der Skill blieb dabei unangetastet'
);

-- Ungültiger typ wird abgelehnt (Check-Constraint, unabhängig von RLS).
select throws_ok(
  $$ insert into aktivitaet (
       id, titel, satz, typ, bedarf, belastung, dauer_min, dauer_max, ort,
       varianzgruppe, erfolgskriterium
     ) values (
       'platzhalter', 'x', 'x', 'unbekannt',
       '{"koerperlich":0,"kopfarbeit":0,"nase":0,"sozial":0,"erholung":0}'::jsonb,
       0, 5, 10, 'drinnen', 'x', 'x'
     ) $$,
  '23514',
  null,
  'ein unbekannter typ wird abgelehnt'
);

select * from finish();
rollback;
