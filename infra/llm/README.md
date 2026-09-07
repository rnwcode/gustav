# LLM-Dienst (lokal)

`generate-day-text` (`infra/supabase/functions/generate-day-text/`) braucht
eine erreichbare OpenAI-kompatible HTTP-Schnittstelle für den Tagestext
(`docs/specs/tagestext.md`). Lokal ist das ein in sich geschlossener
Ollama-Container — das Modell (`llama3.2`) ist bereits beim Image-Build
eingebacken (`Dockerfile`), kein separater `ollama pull`-Schritt nötig.
Später ohne Codeänderung ein extern gehosteter Dienst — nur die
Env-Variablen ändern sich.

## Abgesichert: ein Auth-Proxy vor Ollama

Ollama selbst prüft nie einen Schlüssel — jeder, der den Port erreicht,
kann es benutzen. Deshalb ist Ollama hier nie direkt erreichbar (`expose:`,
kein `ports:` in `docker-compose.yml`): `auth-proxy` (Caddy, `Caddyfile`)
ist der einzige Weg nach außen und leitet nur weiter, wenn der
`Authorization`-Header exakt `Bearer $LLM_API_KEY` trägt — alles andere
bekommt `401`, ohne dass Ollama die Anfrage je sieht. Dieselbe Aufteilung
bleibt gültig, wenn der Dienst später auf einem externen Server läuft; nur
die Adresse im `Caddyfile` wird dann eine echte Domain (Caddy holt sich
automatisch ein TLS-Zertifikat, sobald eine Domain statt `:11434`
drinsteht) — dieser Teil ist bewusst noch nicht gebaut, da Domain/Provider
noch nicht feststehen.

## Starten

```sh
cp infra/llm/.env.example infra/llm/.env   # LLM_API_KEY darin auf einen echten Wert setzen
docker compose -f infra/llm/docker-compose.yml up -d --build
```

Ein anderes Modell: `docker compose -f infra/llm/docker-compose.yml build
--build-arg MODEL=<name>` vor dem Start.

## Environment für `supabase functions serve`

```sh
LLM_ENDPOINT=http://127.0.0.1:11434/v1
LLM_MODEL=llama3.2
LLM_API_KEY=<derselbe Wert wie in infra/llm/.env>
```

Später, gegen einen extern gehosteten Dienst: `LLM_ENDPOINT` (und
`LLM_API_KEY`) zeigen auf den neuen Endpunkt — `_shared/llm/client.ts`
ändert sich nicht, solange der Dienst OpenAI-kompatible
`/chat/completions` bedient und den `Authorization`-Header prüft (oder,
wie hier, ein Proxy davor das für ihn tut).

## Für Tests

`deno test` und der Simulator rufen nie diesen Container auf — sie nutzen
`FakeLlmClient` (`_shared/llm/client.ts`), fest programmierte Antworten,
kein Netzwerkzugriff (CLAUDE.md, Regel 2, sinngemäß auch hier: kein
Nichtdeterminismus in Tests).
