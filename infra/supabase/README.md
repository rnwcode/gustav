# Supabase

Gehostet, Region **Frankfurt (eu-central-1)**. Gestartet wird auf dem
**kostenlosen Plan**; vor dem Launch wird auf Pro gewechselt.

**Regel 8 aus CLAUDE.md gilt weiter:** keine cloud-exklusiven Features
verwenden. Alles muss auch gegen `supabase start` laufen. Darunter liegt
Postgres — damit bleibt sowohl der Wechsel zum Selbsthosten als auch zu einem
anderen Anbieter jederzeit möglich, ohne Umbau.

## Lokal entwickeln

```bash
npm i -g supabase             # oder: scoop install supabase
supabase start                # Docker-Stack, Studio auf http://localhost:54323
supabase db reset             # Migrationen + Seeds frisch anwenden
dart run ../../tool/seed.dart # Katalog aus content/ einspielen
```

Der lokale Stack ist der Normalfall beim Entwickeln. Die Cloud fasst man erst
an, wenn lokal alles läuft.

## Migrationen

Nummerierte SQL-Dateien in `migrations/`, in Reihenfolge angewendet. Eine
bereits angewendete Datei wird nie geändert — immer eine neue anlegen.

```bash
supabase migration new <name>       # neue Datei anlegen
supabase db reset                   # lokal prüfen
supabase link --project-ref <ref>   # Ziel: Staging oder Produktion
supabase db push                    # anwenden
```

Migrationen werden **nie zuerst auf der Produktion angewendet.** Erst Staging,
dann nach Sichtprüfung Produktion.

## Migrationstests

Jede Zustandstabelle hat einen eigenen pgTAP-Test in `migrations/tests/`
(RLS aktiviert, eigene Zeilen sichtbar, fremde nicht, die wichtigsten
Check-Constraints). Offizieller Testlauf gegen den echten Stack:

```bash
supabase start
supabase test db
```

`migrations/tests/helpers/` stubt `auth.uid()`/`auth.users` und die Rollen
`authenticated`/`anon` nur für einen CI-Lauf **ohne** den vollen
Supabase-Stack (kein Docker-in-Docker nötig, siehe der Job „Migrationen" in
`.github/workflows/ci.yml`) — gegen ein echtes Supabase-Projekt nie
anwenden, dort existiert das alles schon.

## Der kostenlose Plan — was er kann und wo er endet

Zum Entwickeln und für Staging reicht er bequem. Die Grenzen, die man kennen
muss (Stand September 2026):

| | Free | Pro (ab 25 $/Monat) |
|---|---|---|
| Datenbank | 500 MB | 8 GB |
| Monatlich aktive Nutzer | 50.000 | 100.000 |
| Dateispeicher | 1 GB | 100 GB |
| Egress | 5 GB | 250 GB |
| Aktive Projekte | 2 | unbegrenzt |
| Backups | **keine** | täglich, 7 Tage Aufbewahrung |
| Pausierung | **nach 1 Woche Inaktivität** | nie |

Zwei Konsequenzen für den Aufbau:

- **Zwei aktive Projekte** heißt: Staging und Produktion gehen gerade so, ein
  drittes nicht. Solange nur entwickelt wird, genügt ein einziges Projekt
  neben dem lokalen Stack.
- **Pausierung nach einer Woche** ist der Stolperstein. Ein Staging-Projekt,
  das man zwei Wochen nicht anfasst, ist beim nächsten Zugriff schlafen
  gelegt und muss von Hand geweckt werden. Beim Entwickeln harmlos, in einer
  Beta ärgerlich.

## Vor dem Launch: Pflichtprogramm

1. **Auf Pro wechseln.** Ohne tägliche Sicherung und mit Pausierung ist der
   kostenlose Plan für Produktion untauglich. Das ist kein Optimierungs-,
   sondern ein Ausschlusskriterium.
2. **Restore einmal durchspielen.** Der Anbieter sichert — ob du daraus wieder
   hochkommst, weiß nur, wer es gemacht hat. Backup einspielen, App dagegen
   laufen lassen, Zeit stoppen. Das ist die Abnahme von Phase 3.
3. **Eigener Export.** Ein wöchentlicher `pg_dump` in deinen eigenen Speicher
   kostet fast nichts und ist die Versicherung für den Fall, dass du das
   Konto verlierst statt die Daten.
4. **Point-in-Time-Recovery erwägen** (Zusatz, 100 $/Monat). Bei einem Produkt
   mit monatelanger Nutzerhistorie ist der Unterschied zwischen "gestern
   Nacht" und "vor fünf Minuten" möglicherweise den Preis wert — spätestens
   dann, wenn es zahlende Kunden gibt.
5. **Service-Role-Schlüssel** nur serverseitig. Niemals im Client, niemals im
   Repo. `.env` steht in `.gitignore`.

## Vorgenerierte Wochentexte

Als geplante Edge Function. LLM-Aufrufe passieren ausschließlich dort, nie in
der App — keine Schlüssel im Client, keine personenbezogenen Daten im Prompt.
