-- 0004_planer_konfig.sql
--
-- Schliesst den zweiten, in generate-plan/README.md ("Ein temporaerer
-- Shim") und docs/specs/content-aus-db-laden.md ("Nicht dazu gehoert")
-- bereits angekuendigten Shim: `content/planer.yaml` wurde per
-- Deno.readTextFile gelesen -- funktioniert unter `supabase functions
-- serve` (echter Dateisystemzugriff aus dem Checkout), aber NICHT nach
-- einem echten `supabase functions deploy` (das Bundle enthaelt kein
-- content/). Genau das hat einen echten, live beobachteten 500er
-- verursacht (NotFound: /var/content/planer.yaml).
--
-- Die gesamte geparste YAML-Struktur wandert unveraendert als ein JSONB-
-- Blob pro Version in diese Tabelle -- generate-plan liest damit exakt
-- dieselbe Struktur wie bisher, nur aus Postgres statt von der Platte,
-- und laesst sie durch dieselben Parser (_shared/content/planer_yaml.ts)
-- laufen. Fuer alle Nutzer identisch (Content/Konfiguration, kein
-- Nutzerzustand) -- RLS wie bei skill/aktivitaet/rasse: oeffentlich
-- lesbar, direkt in der DB gepflegt (CLAUDE.md, Regel 5 und 10).
--
-- version bleibt weiterhin die in content/planer.yaml von Hand gepflegte
-- Versionsnummer (CLAUDE.md, Regel 6: Gewichte aendert kein Agent
-- eigenmaechtig) -- generate-plan liest immer die hoechste Version.

create table planer_konfig (
  version int primary key,
  konfig jsonb not null,
  erstellt_am timestamptz not null default now()
);

alter table planer_konfig enable row level security;

create policy "planer_konfig ist oeffentlich lesbar" on planer_konfig
  for select using (true);
