-- planer_konfig
--
-- Erzeugt aus content/planer.yaml (Version 1) per
-- infra/supabase/seed/planer_konfig.sql -- siehe docs/specs/planer-konfig-aus-db.md
-- fuer den Hintergrund. `on conflict do nothing`: erneutes Ausfuehren (z. B.
-- nach `supabase db reset`) dupliziert nichts. Eine neue Version kommt als
-- zusaetzliche Zeile dazu, ersetzt diese nicht (CLAUDE.md, Regel 10).

insert into planer_konfig (version, konfig) values
  (1, '{"version":1,"perioden":{"laenge_tage":7,"erste_periode_min_tage":5,"erste_periode_max_tage":10,"leere_slots_min":1,"leere_slots_bei_erholungsbedarf_hoch":2},"phasen":{"welpe":{"aktive_slots":4,"training":2},"junghund":{"aktive_slots":5,"training":3},"pubertaet":{"aktive_slots":6,"training":4},"erwachsen":{"aktive_slots":6,"training":4},"senior":{"aktive_slots":5,"training":3}},"belastbarkeit_pro_tag":{"welpe":1,"junghund":1.6,"pubertaet":1.8,"erwachsen":2,"senior":1.4},"einschraenkung_deckel":{"rekonvaleszenz":0.6,"schonung":1},"erholungsbedarf":{"mittel_ab_quote":0.7,"hoch_ab_quote":1},"spaced_repetition":{"faktor_bei_erfolg":1.8,"aufbau":{"start":1,"deckel":4},"generalisierung":{"start":3,"deckel":14},"gefestigt":{"start":10,"deckel":45},"erhaltung":{"start":45,"deckel":90}},"stufen":{"erhoehen_nach_erfolgen":3,"senken_nach_misserfolgen":2,"reihenfolge":["dauer","distanz","ablenkung"],"generalisierung_ab_ablenkung":2},"gewichte":{"prioritaet":3,"ueberfaelligkeit":2,"ueberfaelligkeit_deckel":3,"bedarfsluecke":2,"neuer_skill":1,"eignung_rassegruppe":1,"belastung_bei_erholungsbedarf":-3,"kuerzlich_gemacht":-2},"kuerzlich_gemacht_tage":10,"bedarf_ziel":{"koerperlich":6,"kopfarbeit":6,"nase":5,"sozial":3,"erholung":6},"belastungsregeln":{"nie_zwei_tage_in_folge_belastung":3,"nach_belastung_ab":2,"eingewoehnung_wochen":6,"eingewoehnung_max_ablenkung":1,"eingewoehnung_max_belastung":2}}'::jsonb)
on conflict (version) do nothing;
