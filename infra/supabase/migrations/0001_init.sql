-- 0001_init.sql
--
-- Zustandstabellen aus docs/datenmodell.md — NICHT der Content: Skills und
-- Aktivitäten kommen per tool/seed.dart aus content/ und sind für alle
-- Nutzer gleich; die Tabellen dafür (skill, aktivitaet) sind eine eigene,
-- spätere Migration.
--
-- Tabellen hier: hund, haushalt, skill_stand, checkin, wochenplan, slot.
--
-- Sprache: Tabellen- und Spaltennamen sowie Enum-Werte bleiben Deutsch,
-- wie schon in docs/datenmodell.md — das ist Fachvokabular, keine
-- Entwicklungssprache (CLAUDE.md, Abschnitt Sprache). Die Edge Function
-- übersetzt beim Lesen/Schreiben in die englischen Typen aus
-- infra/supabase/functions/_shared/planner/models/ (Task „Edge Function
-- Endpoint").
--
-- Jede Zustandstabelle: RLS aktiviert, Policy gegen auth.uid() (direkt bei
-- hund/haushalt, sonst über einen Join zurück zu hund.besitzer).
-- aktivitaet_id/skill_id sind bewusst ohne Fremdschlüssel: die Tabellen,
-- auf die sie zeigen würden, existieren erst in der Content-Migration.

-- ── hund ────────────────────────────────────────────────────────────────────

create table hund (
  id uuid primary key default gen_random_uuid(),
  -- default auth.uid(): der Client muss besitzer nicht selbst mitschicken;
  -- die RLS-Policy unten verhindert ohnehin jeden anderen Wert.
  besitzer uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name text not null,
  geburtsdatum date not null,
  einzugsdatum date not null,
  herkunft text not null
    check (herkunft in ('zuechter', 'tierschutz', 'privat', 'unbekannt')),
  rassegruppe text not null
    check (rassegruppe in (
      'huete', 'jagd', 'begleit', 'herdenschutz', 'terrier',
      'wind', 'nordisch', 'molosser', 'misch'
    )),
  groessenklasse text not null
    check (groessenklasse in ('klein', 'mittel', 'gross')),
  koerperbau text[] not null default '{}'
    check (koerperbau <@ array['brachyzephal', 'dichte_unterwolle', 'langbeinig']),
  einschraenkungen text[] not null default '{}'
    check (einschraenkungen <@ array['schonung', 'gelenke', 'senior', 'rekonvaleszenz']),
  erstellt_am timestamptz not null default now(),

  check (einzugsdatum >= geburtsdatum)
);

alter table hund enable row level security;

create policy "eigene hunde" on hund
  for all using (besitzer = auth.uid()) with check (besitzer = auth.uid());

-- ── haushalt ────────────────────────────────────────────────────────────────
--
-- An besitzer gehängt, nicht an hund: Zeitbudget und Wohnsituation gehören
-- dem Halter, nicht dem einzelnen Hund. Mehrhundehaushalte sind Backlog V2
-- (docs/datenmodell.md) — bis dahin genügt ein Haushalt pro Nutzer.

create table haushalt (
  id uuid primary key default gen_random_uuid(),
  besitzer uuid not null default auth.uid() unique references auth.users(id) on delete cascade,
  plz text,
  wohnsituation text not null
    check (wohnsituation in ('wohnung', 'haus_garten')),
  umgebung text not null
    check (umgebung in ('stadt', 'vorort', 'land')),
  erfahrung text not null
    check (erfahrung in ('ersthund', 'erfahren')),
  zeitbudget_werktag_min int not null check (zeitbudget_werktag_min >= 0),
  zeitbudget_wochenende_min int not null check (zeitbudget_wochenende_min >= 0),
  trainingstage text[] not null default '{}'
    check (trainingstage <@ array['mo', 'di', 'mi', 'do', 'fr', 'sa', 'so']),
  planungstag text not null default 'so'
    check (planungstag in ('mo', 'di', 'mi', 'do', 'fr', 'sa', 'so')),
  personen int not null default 1 check (personen >= 1),
  equipment text[] not null default '{}',
  erstellt_am timestamptz not null default now()
);

alter table haushalt enable row level security;

create policy "eigener haushalt" on haushalt
  for all using (besitzer = auth.uid()) with check (besitzer = auth.uid());

-- ── skill_stand ─────────────────────────────────────────────────────────────

create table skill_stand (
  hund_id uuid not null references hund(id) on delete cascade,
  skill_id text not null,
  status text not null default 'aufbau'
    check (status in (
      'nicht_begonnen', 'aufbau', 'generalisierung',
      'gefestigt', 'erhaltung', 'ruht'
    )),
  stufe_dauer int not null default 0 check (stufe_dauer between 0 and 5),
  stufe_distanz int not null default 0 check (stufe_distanz between 0 and 5),
  stufe_ablenkung int not null default 0 check (stufe_ablenkung between 0 and 5),
  -- [{datum, ergebnis, stufe_dauer, stufe_distanz, stufe_ablenkung}], letzte 10 genügen
  historie jsonb not null default '[]'::jsonb,
  letzte_uebung_am date,
  faellig_am date,
  intervall_tage int not null default 1 check (intervall_tage > 0),
  aktualisiert_am timestamptz not null default now(),

  primary key (hund_id, skill_id)
);

alter table skill_stand enable row level security;

create policy "eigene skill-staende" on skill_stand
  for all using (
    exists (select 1 from hund where hund.id = skill_stand.hund_id and hund.besitzer = auth.uid())
  ) with check (
    exists (select 1 from hund where hund.id = skill_stand.hund_id and hund.besitzer = auth.uid())
  );

-- ── checkin ─────────────────────────────────────────────────────────────────
--
-- Rohantwort des Planungstag-Screens plus der daraus übersetzte
-- Wochenkontext (Template im MVP, LLM später — docs/datenmodell.md).
-- Einmal geschrieben, danach unveränderlich; ein Plan wird aus genau
-- einem checkin erzeugt (siehe wochenplan.checkin_id).

create table checkin (
  id uuid primary key default gen_random_uuid(),
  hund_id uuid not null references hund(id) on delete cascade,
  periode_start date not null,

  -- Rohantwort.
  rueckblick jsonb not null default '[]'::jsonb, -- [{slot_id, ergebnis}]
  freitext_rueckblick text,
  absicht_chips text[] not null default '{}'
    check (absicht_chips <@ array[
      'leinen', 'rueckruf', 'ruhe', 'alleinbleiben', 'besuch',
      'wenig_zeit', 'urlaub', 'mehr_kopfarbeit', 'weiss_nicht'
    ]),
  freitext_absicht text,
  tage_verfuegbar text[] not null default '{}'
    check (tage_verfuegbar <@ array['mo', 'di', 'mi', 'do', 'fr', 'sa', 'so']),
  rueckblick_chips text[] not null default '{}'
    check (rueckblick_chips <@ array['viel_los', 'krank', 'reise', 'tierarzt', 'alles_ruhig']),

  -- Abgeleiteter Wochenkontext.
  prioritaeten jsonb not null default '[]'::jsonb, -- [{skill_id_oder_thema, gewicht}]
  constraints_tage text[] not null default '{}'
    check (constraints_tage <@ array['mo', 'di', 'mi', 'do', 'fr', 'sa', 'so']),
  constraints_minuten_pro_tag int check (constraints_minuten_pro_tag > 0),
  constraints_orte text[] not null default '{}'
    check (constraints_orte <@ array['drinnen', 'draussen', 'unterwegs', 'egal']),
  flags text[] not null default '{}',
  quelle text not null default 'default'
    check (quelle in ('chip', 'freitext', 'default')),

  erstellt_am timestamptz not null default now(),

  unique (hund_id, periode_start)
);

alter table checkin enable row level security;

create policy "eigene checkins" on checkin
  for all using (
    exists (select 1 from hund where hund.id = checkin.hund_id and hund.besitzer = auth.uid())
  ) with check (
    exists (select 1 from hund where hund.id = checkin.hund_id and hund.besitzer = auth.uid())
  );

-- ── wochenplan ──────────────────────────────────────────────────────────────
--
-- Einmal erzeugt und gespeichert, nie bei jedem Öffnen neu gerechnet
-- (CLAUDE.md, Regel 10) — algorithmus_version/konfig_version stehen fest,
-- sobald die Zeile existiert.

create table wochenplan (
  id uuid primary key default gen_random_uuid(),
  hund_id uuid not null references hund(id) on delete cascade,
  checkin_id uuid references checkin(id) on delete set null,
  periode_start date not null,
  periode_ende date not null,
  algorithmus_version int not null,
  konfig_version int not null,
  erstellt_am timestamptz not null default now(),

  unique (hund_id, periode_start),
  check (periode_ende >= periode_start)
);

alter table wochenplan enable row level security;

create policy "eigene wochenplaene" on wochenplan
  for all using (
    exists (select 1 from hund where hund.id = wochenplan.hund_id and hund.besitzer = auth.uid())
  ) with check (
    exists (select 1 from hund where hund.id = wochenplan.hund_id and hund.besitzer = auth.uid())
  );

-- ── slot ────────────────────────────────────────────────────────────────────
--
-- Ein Slot pro Tag, der leer sein darf (docs/datenmodell.md, „Fünf
-- Entscheidungen"). begruendung_* bildet Reason aus
-- _shared/planner/models/weekly_plan.ts ab: kind/skillId/needDimension.

create table slot (
  id uuid primary key default gen_random_uuid(),
  wochenplan_id uuid not null references wochenplan(id) on delete cascade,
  datum date not null,
  aktivitaet_id text, -- null = bewusst leerer Tag
  begruendung_art text not null
    check (begruendung_art in (
      'leer', 'neuer_skill', 'faellig', 'prioritaet', 'bedarfsluecke', 'erholungsbedarf'
    )),
  begruendung_skill_id text,
  begruendung_bedarfsdimension text
    check (begruendung_bedarfsdimension in ('koerperlich', 'kopfarbeit', 'nase', 'sozial', 'erholung')),
  ergebnis text
    check (ergebnis in ('klappte', 'so_halb', 'noch_nicht', 'uebersprungen', 'nicht_geschafft')),

  unique (wochenplan_id, datum),
  check ((aktivitaet_id is null) = (begruendung_art = 'leer')),
  check (begruendung_skill_id is null or begruendung_art in ('neuer_skill', 'faellig', 'prioritaet')),
  check (begruendung_bedarfsdimension is null or begruendung_art = 'bedarfsluecke')
);

alter table slot enable row level security;

create policy "eigene slots" on slot
  for all using (
    exists (
      select 1 from wochenplan
      join hund on hund.id = wochenplan.hund_id
      where wochenplan.id = slot.wochenplan_id and hund.besitzer = auth.uid()
    )
  ) with check (
    exists (
      select 1 from wochenplan
      join hund on hund.id = wochenplan.hund_id
      where wochenplan.id = slot.wochenplan_id and hund.besitzer = auth.uid()
    )
  );

-- ── Indizes für die RLS-Joins und die üblichen Zugriffe ─────────────────────

create index skill_stand_hund_id_idx on skill_stand(hund_id);
create index checkin_hund_id_idx on checkin(hund_id);
create index wochenplan_hund_id_idx on wochenplan(hund_id);
create index slot_wochenplan_id_idx on slot(wochenplan_id);
