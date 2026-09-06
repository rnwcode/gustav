-- pgTAP test for skill/activity + their *_text tables (0002_content.sql).
-- Unlike the state tables, this isn't about owner isolation but about
-- "readable by everyone, writable by no one except the seed script" — for
-- content as for its (localized) text.

begin;
select plan(16);

select has_table('public', 'skill', 'table skill exists');
select has_table('public', 'skill_text', 'table skill_text exists');
select has_table('public', 'activity', 'table activity exists');
select has_table('public', 'activity_text', 'table activity_text exists');
select ok(
  (select relrowsecurity from pg_class where relname = 'skill'),
  'RLS is enabled on skill'
);
select ok(
  (select relrowsecurity from pg_class where relname = 'skill_text'),
  'RLS is enabled on skill_text'
);
select ok(
  (select relrowsecurity from pg_class where relname = 'activity'),
  'RLS is enabled on activity'
);
select ok(
  (select relrowsecurity from pg_class where relname = 'activity_text'),
  'RLS is enabled on activity_text'
);

insert into skill (id, category, min_age_weeks, is_core_skill, target_levels)
values ('recall', 'basicCue', 9, true, '{"duration": 1, "distance": 3, "distraction": 4}'::jsonb);
insert into skill_text (skill_id, locale, name, description)
values ('recall', 'de', 'Rückruf', 'Der Hund kommt zuverlässig zurück.');

insert into activity (
  id, type, trains_skill, needs, arousal, duration_min, duration_max, location, variance_group
) values (
  'sniffing_mat_intro', 'enrichment', null,
  '{"physical": 1, "mentalWork": 3, "scent": 3, "social": 0, "recovery": 1}'::jsonb,
  1, 5, 15, 'indoors', 'sniffing_mat_intro'
);
insert into activity_text (activity_id, locale, title, sentence, success_criterion)
values (
  'sniffing_mat_intro', 'de', 'Schnüffelteppich, erste Runde',
  'Futter im Teppich verstecken und suchen lassen.', 'Er sucht selbstständig weiter.'
);

set local role authenticated;
select set_config('request.jwt.claims', json_build_object('sub', '11111111-1111-1111-1111-111111111111')::text, true);

select is(
  (select count(*)::int from skill),
  1,
  'a signed-in user sees the content without having their own dog'
);
select is(
  (select count(*)::int from skill_text),
  1,
  'same for skill_text'
);
select is(
  (select count(*)::int from activity),
  1,
  'same for activity'
);
select is(
  (select count(*)::int from activity_text),
  1,
  'same for activity_text'
);

select throws_ok(
  $$ insert into skill (id, category, min_age_weeks, is_core_skill, target_levels)
     values ('sit', 'basicCue', 9, true, '{"duration":0,"distance":0,"distraction":0}'::jsonb) $$,
  '42501',
  null,
  'a signed-in user cannot create a skill'
);
-- No error, but no row hit either: RLS without an UPDATE policy filters the
-- row out of view instead of rejecting the statement (same pattern as in
-- tests/dog.sql).
update skill_text set name = 'Renamed' where skill_id = 'recall' and locale = 'de';
select is(
  (select count(*)::int from skill_text where skill_id = 'recall' and name = 'Renamed'),
  0,
  'and cannot change an existing skill_text either (RLS filters it out of view)'
);

reset role;

select is(
  (select name from skill_text where skill_id = 'recall' and locale = 'de'),
  'Rückruf',
  'the skill_text stayed untouched'
);

-- An invalid type is rejected (check constraint, independent of RLS).
select throws_ok(
  $$ insert into activity (id, type, needs, arousal, duration_min, duration_max, location, variance_group)
     values (
       'placeholder', 'unknown',
       '{"physical":0,"mentalWork":0,"scent":0,"social":0,"recovery":0}'::jsonb,
       0, 5, 10, 'indoors', 'x'
     ) $$,
  '23514',
  null,
  'an unknown type is rejected'
);

select * from finish();
rollback;
