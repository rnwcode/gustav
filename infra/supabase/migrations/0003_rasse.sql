-- 0003_rasse.sql
--
-- Zieht die in docs/produkt.md als "Nicht im MVP" vorgesehenen
-- Rasse-Spezialpfade bewusst vor (Nutzerentscheidung, siehe
-- docs/specs/rasse-modellieren.md): `hund.rassegruppe` wird zur
-- Eigenschaft einer eigenen `rasse`-Tabelle, ein Hund verweist über
-- `hund_rasse` auf eine oder mehrere Rassen. Damit wird der Weg zu
-- echten, einzeln benannten Rassen (statt nur neun Gruppen) später zu
-- reiner Dateneingabe, ohne weitere Schema-Änderung.
--
-- `groessenklasse`/`koerperbau` bleiben bewusst am Hund: sie werden schon
-- heute unabhängig von der Rassegruppe direkt vom Halter angegeben, sind
-- also Eigenschaften des einzelnen Tieres, keine Rasseeigenschaften.
--
-- `rasse` ist Content (für alle Nutzer identisch), wie `skill`/
-- `aktivitaet` (0002_content.sql): öffentlich lesbar, direkt in der DB
-- gepflegt, kein Import-Skript (CLAUDE.md, Regel 5).

-- ── rasse ───────────────────────────────────────────────────────────────────

create table rasse (
  id text primary key,
  name text not null,
  rassegruppe text not null
    check (rassegruppe in (
      'huete', 'jagd', 'begleit', 'herdenschutz', 'terrier',
      'wind', 'nordisch', 'molosser', 'misch'
    )),
  erstellt_am timestamptz not null default now()
);

alter table rasse enable row level security;

create policy "rasse ist oeffentlich lesbar" on rasse
  for select using (true);

-- ── hund_rasse ──────────────────────────────────────────────────────────────
--
-- gewichtung ist bewusst nullable: null heißt "gleichmäßig verteilt auf
-- alle Rassen dieses Hundes" — ein Mischling mit zwei verknüpften Rassen
-- ohne gesetzte Gewichtung zählt beide zu je 50 %, ohne dass das jemand
-- pflegen muss (resolveBreedGroups(), infra/supabase/functions/
-- generate-plan/rows.ts). Nur absolute Verhältnisse zählen, keine feste
-- Skala — {3, 1} bedeutet dasselbe wie {75, 25}.

create table hund_rasse (
  hund_id uuid not null references hund(id) on delete cascade,
  rasse_id text not null references rasse(id),
  gewichtung numeric check (gewichtung > 0),

  primary key (hund_id, rasse_id)
);

alter table hund_rasse enable row level security;

create policy "eigene hund_rasse" on hund_rasse
  for all using (
    exists (select 1 from hund where hund.id = hund_rasse.hund_id and hund.besitzer = auth.uid())
  ) with check (
    exists (select 1 from hund where hund.id = hund_rasse.hund_id and hund.besitzer = auth.uid())
  );

create index hund_rasse_hund_id_idx on hund_rasse(hund_id);

-- ── hund ────────────────────────────────────────────────────────────────────

alter table hund drop column rassegruppe;

-- Beide nullable: "unbekannt" ist ein legitimer Zustand, gerade bei
-- Tierschutzhunden ohne Papiere.
alter table hund add column geschlecht text check (geschlecht in ('ruede', 'huendin'));
alter table hund add column kastriert bool;

-- ── neun Gruppen-Platzhalter ─────────────────────────────────────────────────
--
-- Damit das Onboarding (dieselbe Rassegruppen-Auswahl wie bisher,
-- Step2Origin.tsx) unverändert weiterläuft. Echte, einzeln benannte
-- Rassen sind Fachwissen über korrekte Gruppen-Zuordnung, keine
-- Engineering-Arbeit — bleiben bewusst offen (docs/specs/
-- rasse-modellieren.md, "Nicht dazu gehört").

insert into rasse (id, name, rassegruppe) values
  ('gruppe_huete', 'Hüte', 'huete'),
  ('gruppe_jagd', 'Jagd', 'jagd'),
  ('gruppe_begleit', 'Begleit', 'begleit'),
  ('gruppe_herdenschutz', 'Herdenschutz', 'herdenschutz'),
  ('gruppe_terrier', 'Terrier', 'terrier'),
  ('gruppe_wind', 'Wind', 'wind'),
  ('gruppe_nordisch', 'Nordisch', 'nordisch'),
  ('gruppe_molosser', 'Molosser', 'molosser'),
  ('gruppe_misch', 'Mischling', 'misch');
