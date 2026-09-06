-- 0002_content.sql
--
-- Die Content-Migration, die 0001_init.sql schon ankündigt: skill und
-- aktivitaet, für alle Nutzer identisch (Content, kein Nutzerzustand).
-- Gefüllt wird per `tool/seed_content.ts` aus content/*.yaml — nie von
-- Hand, nie über anon/authenticated (CLAUDE.md, Regel 5 und 10).
--
-- Spaltennamen und verschachtelte Struktur (bedarf, eignung, zielstufen,
-- troubleshooting als jsonb) spiegeln content/schema/{aktivitaet,skill}.yaml
-- eins zu eins — eine aus Postgres gelesene Zeile hat exakt die Form eines
-- bereits YAML-geparsten Dokuments und läuft durch denselben Übersetzer
-- (_shared/content/{activity,skill}_yaml.ts über rows.ts,
-- siehe docs/specs/content-aus-db-laden.md).
--
-- RLS ist aktiv, aber anders als bei den Zustandstabellen: keine
-- besitzer-Policy, sondern eine einzige „für alle lesbar" — es gibt keine
-- Schreib-Policy für anon/authenticated, also bleibt Schreiben dem
-- Service-Role-Key des Seed-Skripts vorbehalten (der RLS ohnehin umgeht).
--
-- Bewusst ohne Fremdschlüssel auf voraussetzungen (Array, referenziert u.
-- U. noch nicht existierende Skills, z. B. rueckruf.yaml → namensauf-
-- merksamkeit) — das prüft der künftige Content-Validator, nicht die DB.

-- ── skill ───────────────────────────────────────────────────────────────────

create table skill (
  id text primary key,
  name text not null,
  kategorie text not null
    check (kategorie in (
      'grundsignal', 'leinenarbeit', 'impulskontrolle',
      'alltagsroutine', 'sozialverhalten', 'kooperation'
    )),
  voraussetzungen text[] not null default '{}',
  min_alter_wochen int not null default 0 check (min_alter_wochen >= 0),
  ist_kernskill bool not null default false,
  zielstufen jsonb not null, -- {dauer, distanz, ablenkung}, je 0–5
  beschreibung text not null,
  erstellt_am timestamptz not null default now()
);

alter table skill enable row level security;

create policy "skill ist oeffentlich lesbar" on skill
  for select using (true);

-- ── aktivitaet ──────────────────────────────────────────────────────────────

create table aktivitaet (
  id text primary key,
  titel text not null,
  satz text not null,
  typ text not null
    check (typ in ('training', 'beschaeftigung', 'alltag', 'ruhe', 'pflege')),
  trainiert_skill text references skill(id), -- null bei Beschäftigung
  bedarf jsonb not null, -- {koerperlich, kopfarbeit, nase, sozial, erholung}, je 0–3
  belastung int not null check (belastung between 0 and 3),
  dauer_min int not null check (dauer_min >= 0),
  dauer_max int not null check (dauer_max >= dauer_min),
  ort text not null check (ort in ('drinnen', 'draussen', 'unterwegs', 'egal')),
  fuer_ablenkung jsonb, -- [min, max] — nur bei typ = training
  ist_auffrischung bool not null default false,
  hitzetauglich bool not null default true,
  regentauglich bool not null default true,
  dunkeltauglich bool not null default true,
  gelenkbelastend bool not null default false,
  saisonfenster jsonb, -- [monat, …] oder null
  equipment text[] not null default '{}',
  zweite_person bool not null default false,
  min_alter_wochen int not null default 0 check (min_alter_wochen >= 0),
  max_alter_wochen int,
  eignung jsonb not null default '{}'::jsonb, -- {rassegruppe: gewicht -1…+2}
  varianzgruppe text not null,
  sperrfrist_tage int not null default 0 check (sperrfrist_tage >= 0),
  illustration text,
  anleitung text[] not null default '{}',
  erfolgskriterium text not null,
  haeufige_fehler text[] not null default '{}',
  troubleshooting jsonb not null default '[]'::jsonb, -- [{problem, antwort}]
  erstellt_am timestamptz not null default now()
);

alter table aktivitaet enable row level security;

create policy "aktivitaet ist oeffentlich lesbar" on aktivitaet
  for select using (true);

create index aktivitaet_trainiert_skill_idx on aktivitaet(trainiert_skill);
