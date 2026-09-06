# generate-day-text

Die Edge Function, die die App beim Öffnen eines Tages aufruft, um dessen
Tagestext zu bekommen. Verdrahtet einen LLM-Client (`_shared/llm/client.ts`)
mit Postgres — lädt den Slot mit seiner bereits feststehenden `reason`
(nie hier neu berechnet, CLAUDE.md Regel 10), fällige `reminder`-Zeilen,
ruft das LLM auf, cached das Ergebnis auf `slot.day_text`. Siehe
`docs/specs/tagestext.md` für das vollständige Design.

## Request

```jsonc
POST /generate-day-text
Authorization: Bearer <user JWT>
{
  "slotId": "uuid",
  "debugToday": null // nur das Zeitreise-Debugmenü setzt das
}
```

Antwort: `200` mit `{dayText, generatedAt}` — sowohl bei frischer Generierung
als auch, wenn `slot.day_text` bereits gesetzt war (kein erneuter LLM-Call,
siehe „Nicht dazu gehört" in der Spec). `401` unauthentifiziert, `404` Slot
nicht gefunden, `500` bei einem DB-Fehler, `502` wenn der LLM-Dienst
fehlschlägt.

## Dateien

- `index.ts` — der HTTP-Handler: Auth, lädt Slot/Aktivität/Erinnerungen,
  ruft die Bausteine unten auf, schreibt `day_text` zurück. Die einzige
  Datei hier mit IO.
- `rows.ts` — reines Mapping von DB-Zeilen (`slot`, `reminder`) auf die
  Formen, die `_shared/llm/day_text_prompt.ts` erwartet.
- `../_shared/llm/day_text_prompt.ts` — `reminderIsDue` (reine
  Zeitfenster-Logik über `lead_time_days`) und `buildDayTextPrompt` (baut
  den Fakten-Prompt, keine Prosa).
- `../_shared/llm/client.ts` — `LlmClient`-Interface, `HttpLlmClient`
  (OpenAI-kompatibel, lokal Ollama, später ein extern gehosteter Dienst)
  und `FakeLlmClient` für Tests.

## Lokal laufen lassen

Siehe `infra/llm/README.md` für den Ollama-Container und die nötigen
Env-Variablen (`LLM_BASE_URL`, `LLM_MODEL`, optional `LLM_API_KEY`).
