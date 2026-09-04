# Supabase

Gehostet, Region **Frankfurt (eu-central-1)**. Zwei Projekte: Staging und
Produktion. Lokal wird trotzdem gegen den Docker-Stack der CLI entwickelt —
die Cloud fasst man erst an, wenn lokal alles läuft.

**Regel 8 aus CLAUDE.md gilt weiter:** keine cloud-exklusiven Features
verwenden. Alles muss auch gegen `supabase start` laufen. Darunter liegt
Postgres; damit bleibt der Wechsel zum Selbsthosten jederzeit möglich —
Migrationen, Seeds und RLS-Policies wandern unverändert mit.

## Lokal

```bash
npm i -g supabase             # oder: scoop install supabase
supabase start                # Docker-Stack, Studio auf http://localhost:54323
supabase db reset             # Migrationen + Seeds frisch anwenden
dart run ../../tool/seed.dart # Katalog aus content/ einspielen
```

## Migrationen

Nummerierte SQL-Dateien in `migrations/`, in Reihenfolge angewendet. Eine
bereits angewendete Datei wird nie geändert — immer eine neue anlegen.

```bash
supabase migration new <name>       # neue Datei anlegen
supabase db reset                   # lokal prüfen
supabase link --project-ref <ref>   # Ziel wählen: Staging oder Produktion
supabase db push                    # anwenden
```

Migrationen werden **nie zuerst auf der Produktion angewendet.** Erst Staging,
dann nach Sichtprüfung Produktion. Das übernimmt später `deploy.yml`.

## Was du trotz gehostet nicht auslagern kannst

Der Anbieter macht Backups — aber ob du daraus tatsächlich wieder
hochkommst, weiß nur, wer es einmal gemacht hat:

1. **Restore-Test einmal durchspielen**, bevor echte Nutzerdaten drin sind.
   Backup einspielen, App dagegen laufen lassen, Zeit stoppen. Das bleibt die
   Abnahme von Phase 3.
2. **Bezahlter Plan vor dem Launch.** Kostenlose Projekte werden bei
   Inaktivität pausiert und haben keine tägliche Sicherung — für Produktion
   untauglich. Point-in-Time-Recovery ist ein Zusatz und für ein Produkt mit
   monatelanger Nutzerhistorie die Überlegung wert.
3. **Eigener Export.** Ein wöchentlicher `pg_dump` in deinen eigenen Speicher
   kostet fast nichts und ist die Versicherung gegen den Fall, dass du das
   Konto verlierst statt die Daten.
4. **Zugangsdaten nicht im Repo** — `.env` ist in `.gitignore`, Service-Role-
   Schlüssel gehören ausschließlich serverseitig.

## Vorgenerierte Wochentexte

Als geplante Edge Function. LLM-Aufrufe passieren ausschließlich dort, nie in
der App — keine Schlüssel im Client, keine personenbezogenen Daten im Prompt.
