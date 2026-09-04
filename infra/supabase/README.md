# Supabase, selbst gehostet

Drei Stufen: lokal → Staging → Produktion. Alles läuft gegen denselben
Compose-Stack; unterschieden wird nur über `.env`.

**Regel:** keine cloud-exklusiven Features verwenden. Darunter liegt Postgres,
und solange das gilt, ist ein Umzug in beide Richtungen eine Sache von Stunden.

## Lokal einrichten

Die offizielle Compose-Datei wird bewusst **nicht** eingecheckt — sie ändert
sich mit jeder Supabase-Version, und eine handkopierte Fassung veraltet still.
Stattdessen holen:

```bash
cd infra/supabase
git clone --depth 1 https://github.com/supabase/supabase .supabase-upstream
cp .supabase-upstream/docker/docker-compose.yml .
cp .env.example .env          # dann Werte setzen, siehe unten
docker compose up -d
```

Studio läuft danach auf http://localhost:8000.

```bash
dart run ../../tool/seed.dart   # Katalog aus content/ einspielen
```

## Migrationen

Liegen als nummerierte SQL-Dateien in `migrations/` und werden in
Reihenfolge angewendet. Niemals eine bereits angewendete Datei ändern —
immer eine neue anlegen.

Migrationen werden **nie auf der Produktion getestet**. Dafür gibt es Staging.

## Was beim Selbsthosten nicht optional ist

Der Self-Hosted-Stack hat keine Parität mit der gehosteten Variante. Was dort
im Preis enthalten ist, baust du hier selbst:

1. **Backups außer Haus** — pgBackRest oder wal-g auf S3-kompatiblen Speicher,
   plus ein **durchgeführter Restore-Test**. Ein Backup, das nie zurückgespielt
   wurde, ist keines. Das ist die Abnahme von Phase 3, nicht das Deployment.
2. **Monitoring mit Alarm aufs Handy** — Erreichbarkeit, Plattenplatz,
   Postgres-Verbindungen.
3. **Staging-Instanz** als eigener Stack.
4. **Reverse Proxy mit automatischem TLS** (Caddy oder Traefik), Firewall,
   fail2ban, automatische Sicherheitsupdates.
5. **Secrets nicht im Repo** — sops/age oder ein Secret-Manager.
6. **SMTP-Anbieter**, sobald es Accounts gibt (Brevo, Mailjet, Postmark).

## Vorgenerierte Wochentexte

Statt selbst gehosteter Edge Functions ein schlichter Cron-Container neben
dem Stack. Du kontrollierst die Maschine ohnehin, und ein Skript, das nachts
einmal durchläuft, ist deutlich weniger fummelig als der Deno-Relay.

LLM-Aufrufe passieren ausschließlich hier, nie in der App. Keine
personenbezogenen Daten im Prompt.
