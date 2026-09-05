-- NUR für lokale/CI-Testläufe ohne den echten Supabase-Stack (der `auth`-
-- Schema, `auth.uid()`, `authenticated`/`anon` bereits mitbringt). Niemals
-- gegen ein echtes Supabase-Projekt anwenden — dort existiert das alles
-- schon, mit einer richtigen Verbindung zu GoTrue.
--
-- Verwendet von: CI-Job "Migrationen" (.github/workflows/ci.yml). Für einen
-- vollständigeren, offiziellen Testlauf: `supabase test db` gegen den
-- lokalen Stack (`supabase start`), siehe infra/supabase/README.md.
--
-- Reihenfolge: dieses Skript zuerst (auth.users muss existieren, bevor die
-- Migration darauf verweist), dann die Migration(en), dann
-- local_grants.sql (kann erst greifen, wenn die Tabellen existieren).

create extension if not exists pgcrypto;
create extension if not exists pgtap;

create schema if not exists auth;

create table if not exists auth.users (
  id uuid primary key default gen_random_uuid()
);

create or replace function auth.uid() returns uuid
  language sql stable
  as $$
    select nullif(current_setting('request.jwt.claims', true)::json ->> 'sub', '')::uuid
  $$;

do $$
begin
  if not exists (select 1 from pg_roles where rolname = 'authenticated') then
    create role authenticated nologin;
  end if;
  if not exists (select 1 from pg_roles where rolname = 'anon') then
    create role anon nologin;
  end if;
end
$$;

grant usage on schema auth to authenticated, anon;
grant select on auth.users to authenticated, anon;
