-- skill
--
-- Generiert aus content/import/skill.csv per csv_to_seed_sql.py -- siehe dort
-- (README) fuer Herkunft und Einschraenkungen der Daten. `on conflict do
-- nothing`: erneutes Ausfuehren (z. B. nach `supabase db reset`)
-- dupliziert nichts.

insert into skill (id, category, prerequisites, min_age_weeks, is_core_skill, target_levels) values
  ('sitz', 'basicCue', '{}', 9, true, '{"duration": 1, "distance": 1, "distraction": 2}'::jsonb),
  ('platz', 'basicCue', '{"sitz"}', 9, true, '{"duration": 1, "distance": 1, "distraction": 2}'::jsonb),
  ('bleib', 'basicCue', '{"sitz","platz"}', 13, true, '{"duration": 1, "distance": 1, "distraction": 2}'::jsonb),
  ('rueckruf', 'basicCue', '{}', 9, true, '{"duration": 1, "distance": 1, "distraction": 2}'::jsonb),
  ('leinenfuehrigkeit', 'leashWork', '{}', 9, true, '{"duration": 1, "distance": 1, "distraction": 2}'::jsonb),
  ('aus_loslassen', 'impulseControl', '{}', 9, true, '{"duration": 1, "distance": 1, "distraction": 2}'::jsonb),
  ('abbruchsignal_nein', 'impulseControl', '{}', 9, true, '{"duration": 1, "distance": 1, "distraction": 2}'::jsonb),
  ('apportieren', 'cooperation', '{"aus_loslassen"}', 17, false, '{"duration": 2, "distance": 3, "distraction": 3}'::jsonb),
  ('hand_target_touch', 'cooperation', '{}', 9, false, '{"duration": 1, "distance": 1, "distraction": 2}'::jsonb),
  ('blickkontakt_fokus', 'cooperation', '{}', 9, false, '{"duration": 1, "distance": 1, "distraction": 2}'::jsonb),
  ('maennchen', 'cooperation', '{"sitz"}', 52, false, '{"duration": 2, "distance": 3, "distraction": 3}'::jsonb),
  ('rolle', 'cooperation', '{"platz"}', 26, false, '{"duration": 2, "distance": 3, "distraction": 3}'::jsonb),
  ('slalom_durch_die_beine', 'cooperation', '{}', 26, false, '{"duration": 2, "distance": 3, "distraction": 3}'::jsonb),
  ('kriechen', 'cooperation', '{"platz"}', 26, false, '{"duration": 2, "distance": 3, "distraction": 3}'::jsonb),
  ('pfote_geben', 'cooperation', '{"sitz"}', 13, false, '{"duration": 1, "distance": 1, "distraction": 2}'::jsonb),
  ('faehrtensuche_mantrailing', 'cooperation', '{}', 17, false, '{"duration": 2, "distance": 3, "distraction": 3}'::jsonb),
  ('gegenstandsanzeige_zos', 'cooperation', '{"platz"}', 26, false, '{"duration": 3, "distance": 4, "distraction": 5}'::jsonb),
  ('sprung_ueber_hindernis', 'cooperation', '{}', 52, false, '{"duration": 3, "distance": 4, "distraction": 5}'::jsonb),
  ('stopp_auf_distanz', 'impulseControl', '{"bleib"}', 26, true, '{"duration": 3, "distance": 4, "distraction": 5}'::jsonb),
  ('rueckwaertsgehen', 'cooperation', '{}', 26, false, '{"duration": 2, "distance": 3, "distraction": 3}'::jsonb)
on conflict (id) do nothing;

insert into skill_text (skill_id, locale, name, description) values
  ('sitz', 'de', 'Sitz', 'Der Hund setzt sich auf Kommando und bleibt sitzen, bis er freigegeben wird.'),
  ('platz', 'de', 'Platz', 'Der Hund legt sich auf Kommando ab — die Grundlage für Ruhe und Bleib-Übungen.'),
  ('bleib', 'de', 'Bleib', 'Der Hund hält Sitz oder Platz, bis er aktiv freigegeben wird, auch wenn etwas ablenkt.'),
  ('rueckruf', 'de', 'Rückruf', 'Der Hund kommt auf ein Signal zuverlässig zurück, auch mit Ablenkung — anfangs an der Schleppleine gesichert.'),
  ('leinenfuehrigkeit', 'de', 'Leinenführigkeit', 'Der Hund geht an lockerer Leine, ohne zu ziehen — am besten mit Geschirr statt Halsband.'),
  ('aus_loslassen', 'de', 'Aus / Loslassen', 'Der Hund gibt einen Gegenstand ab, ohne dass er ihm weggenommen werden muss.'),
  ('abbruchsignal_nein', 'de', 'Abbruchsignal (Nein)', 'Ein Signal, das eine unerwünschte Handlung sofort stoppt — rein positiv aufgebaut, ohne Strafe.'),
  ('apportieren', 'de', 'Apportieren', 'Der Hund bringt einen geworfenen Gegenstand zurück und gibt ihn ab.'),
  ('hand_target_touch', 'de', 'Hand-Target (Touch)', 'Der Hund berührt die Handfläche mit der Nase — Grundlage für viele weitere Übungen.'),
  ('blickkontakt_fokus', 'de', 'Blickkontakt / Fokus', 'Der Hund sucht von sich aus Blickkontakt zum Halter, auch mit Ablenkung in der Nähe.'),
  ('maennchen', 'de', 'Männchen', 'Der Hund setzt sich auf und hält die Vorderpfoten in der Luft.'),
  ('rolle', 'de', 'Rolle', 'Der Hund rollt sich auf Kommando einmal um die eigene Achse.'),
  ('slalom_durch_die_beine', 'de', 'Slalom durch die Beine', 'Der Hund läuft im Slalom durch die Beine des Halters.'),
  ('kriechen', 'de', 'Kriechen', 'Der Hund robbt flach am Boden vorwärts.'),
  ('pfote_geben', 'de', 'Pfote geben', 'Der Hund reicht auf Kommando eine Pfote.'),
  ('faehrtensuche_mantrailing', 'de', 'Fährtensuche / Mantrailing', 'Der Hund folgt einer Geruchsspur über Distanz — im eigenen Tempo, mit Geschirr statt Halsband.'),
  ('gegenstandsanzeige_zos', 'de', 'Gegenstandsanzeige (ZOS)', 'Der Hund findet einen bestimmten Gegenstand per Nase und zeigt ihn an.'),
  ('sprung_ueber_hindernis', 'de', 'Sprung über Hindernis', 'Der Hund springt kontrolliert über ein Hindernis — erst ab geschlossenen Wachstumsfugen (ca. 12–15 Monate).'),
  ('stopp_auf_distanz', 'de', 'Stopp auf Distanz', 'Der Hund stoppt sofort auf Signal, auch auf Distanz und in Bewegung.'),
  ('rueckwaertsgehen', 'de', 'Rückwärtsgehen', 'Der Hund geht auf Kommando rückwärts.')
on conflict (skill_id, locale) do nothing;
