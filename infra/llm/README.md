# LLM-Dienst (lokal)

`generate-day-text` (`infra/supabase/functions/generate-day-text/`) braucht
eine erreichbare OpenAI-kompatible HTTP-Schnittstelle für den Tagestext
(`docs/specs/tagestext.md`). Lokal ist das ein Ollama-Container, später ohne
Codeänderung ein extern gehosteter Dienst — nur die Env-Variablen ändern
sich.

## Starten

```sh
docker compose -f infra/llm/docker-compose.yml up -d
docker compose -f infra/llm/docker-compose.yml exec ollama ollama pull llama3.2
```

## Environment für `supabase functions serve`

```sh
LLM_BASE_URL=http://127.0.0.1:11434/v1
LLM_MODEL=llama3.2
# LLM_API_KEY bleibt leer — Ollama braucht lokal keinen Key.
```

Später, gegen einen extern gehosteten Dienst: `LLM_BASE_URL` (und ggf.
`LLM_API_KEY`) zeigen auf den neuen Endpunkt — `_shared/llm/client.ts`
ändert sich nicht, solange der Dienst OpenAI-kompatible
`/chat/completions` bedient.

## Für Tests

`deno test` und der Simulator rufen nie diesen Container auf — sie nutzen
`FakeLlmClient` (`_shared/llm/client.ts`), fest programmierte Antworten,
kein Netzwerkzugriff (CLAUDE.md, Regel 2, sinngemäß auch hier: kein
Nichtdeterminismus in Tests).
