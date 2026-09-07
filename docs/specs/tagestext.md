# Tagestext per KI

*Hinweis: Diese Spec bleibt Deutsch (CLAUDE.md, Abschnitt Sprache). Die
Codebeispiele nennen die tatsächlichen Bezeichner aus
`infra/supabase/functions/` (TypeScript).*

## Warum

`slot` trägt heute nur eine maschinenlesbare `Reason` (`docs/specs/texten.md`)
— den erklärenden deutschen Satz baut die App clientseitig aus `Reason` +
`Activity.sentence` als Template, LLM ist als V1.2-Backlog vermerkt
(`docs/datenmodell.md`). Der Nutzer möchte genau diesen einen Baustein jetzt
vorziehen: **nicht** die Wochen-Interpretation (`checkin_translator.ts`
übersetzt `review_freetext`/`intent_freetext` weiterhin per Template in
`WeeklyContext` — eigenes, unverändertes Backlog-Item), sondern den
**Tagestext**. Der soll zusätzlich tagesaktuelle Fakten einbauen können, die
es im Datenmodell heute gar nicht gibt (Impftermin, Wiege-Erinnerung).

Entscheidender Unterschied zu allem, was `weekly_plan`/`slot` bisher
garantieren: Die **Struktur** eines Plans (welche Aktivität an welchem Tag,
`reason`) bleibt exakt wie heute — einmal erzeugt, mit
`algorithm_version`/`config_version` versioniert, nie neu berechnet
(CLAUDE.md, Regel 10). Der **Tagestext** fällt ausdrücklich nicht unter diese
Reproduzierbarkeitsgarantie: er darf sich bei erneuter Generierung ändern
(andere Formulierung, eine neu eingetragene Erinnerung). Reproduzierbar
bleiben muss nur, *welche Daten* er verwendet hat — und die liegen bereits
strukturiert in `slot` und der neuen `reminder`-Tabelle, nicht in der Prosa
selbst.

Der LLM-Dienst ist Gemini, über dessen OpenAI-kompatible Schnittstelle
angesprochen — kein selbst betriebener lokaler LLM-Dienst. Ein früherer
Anlauf mit einem lokalen Ollama-Container (`infra/llm/`) wurde wieder
entfernt: Gemini ist schneller (~1–2s statt ~16s auf CPU), zuverlässiger
beim Einhalten der Fakten (kleine lokale Modelle haben in Tests eigene
Termine erfunden) und pro Anfrage im Cent-Bereich, während der lokale
Container zusätzliche, dauerhaft zu pflegende Infrastruktur war (Docker,
Auth-Proxy) ohne Netz-unabhängigen Anwendungsfall, der aktuell gebraucht
wird.

## Verhalten

**Neue Tabelle `reminder`** (Migration `0005_reminder.sql`): `id`, `dog_id`,
`kind` (`check` gegen `'vaccination' | 'weighIn'`), `due_date`,
`lead_time_days` (`int not null default 0 check (lead_time_days >= 0)`),
`done_at` (nullable `timestamptz`, wann erledigt markiert), `created_at`.
Für alle Nutzer verschieden (eigener Zustand, kein Content) — RLS wie
`skill_state`: eigene Zeilen über den Join zurück zu `dog.owner`.

`lead_time_days` unterscheidet die beiden Fälle, die der Nutzer meint, ohne
zwei verschiedene Konzepte zu brauchen: ein **fester Termin** (Impftermin am
15.9., der Tierarzt hat entschieden) setzt `lead_time_days = 0` — erwähnt
wird er erst am Tag selbst (und, sobald überfällig, weiter bis erledigt). Ein
**loser Auftrag** ("Impftermin vereinbaren", "mal wieder wiegen") setzt
`lead_time_days` höher (z. B. 14) — erwähnt wird er schon ab `due_date -
lead_time_days`. Die Zahl ist frei wählbar, nicht auf zwei feste Modi
begrenzt (siehe „Offene Fragen" in der Vorversion dieser Spec — damit
beantwortet: Vorlaufzeit ist pro Erinnerung definierbar, kein globales
Fenster).

**Neue Spalten an `slot`**: `day_text` (nullable `text`) und
`day_text_generated_at` (nullable `timestamptz`). Beide außerhalb jeder
`unique`/Reproduzierbarkeits-Constraint von `slot` — überschreibbar, ohne
dass das etwas an `reason` oder `outcome` ändert.

**Neue Edge Function `generate-day-text`**: Input `{slotId}`. Lädt den Slot,
seine `reason`, die verknüpfte `activity`/`activity_text` (falls
`activity_id` gesetzt) und alle `reminder`-Zeilen des Hundes mit `done_at is
null` und `due_date - lead_time_days <= slot.date` (fällt also entweder in
ihr Vorlauffenster oder ist bereits überfällig). Baut daraus einen Prompt
(Tonalität: CLAUDE.md, „Beschreiben, nicht anweisen", kein
Gustav-Sprechen), ruft den LLM-Client auf, schreibt das Ergebnis in
`slot.day_text`/`day_text_generated_at` und gibt den Text zurück.

**LLM-Client-Abstraktion** (`_shared/llm/client.ts`): ein Interface
`generateText(prompt: string): Promise<string>`. Die echte Implementierung
(`HttpLlmClient`) spricht Gemini über dessen OpenAI-kompatible
Chat-Completions-Schnittstelle (`generativelanguage.googleapis.com/v1beta/openai`)
an — Endpunkt, Modell und API-Key kommen aus Env-Variablen (`LLM_ENDPOINT`,
`LLM_MODEL`, `LLM_API_KEY`, `infra/supabase/.env.example`), nie fest im
Code. Absicherung ist damit Googles Sache, nicht unsere: der API-Key ist
das Auth, es gibt keine eigene Infrastruktur davor.

Für `deno test` und den Simulator: ein `FakeLlmClient` mit fest
programmierten Antworten — kein echter Netzwerkzugriff in Tests, analog zur
injizierten Zeitquelle (Regel 2), nur gegen Nichtdeterminismus statt Zeit.

**Trigger**: Die App ruft `generate-day-text` beim Öffnen eines Tages auf,
wenn `slot.day_text` noch `null` ist. Ist bereits ein Text vorhanden, wird
er nicht automatisch neu erzeugt (Kosten, Nichtdeterminismus begrenzen) —
ein manuelles "neu generieren" wäre ein späteres, eigenes Feature.

**Systemprompt** (Ausgangspunkt, `_shared/llm/day_text_prompt.ts`):

```
Du schreibst den kurzen Rahmentext für einen einzelnen Tag in einem
Wochenplaner für Hundehalter. Du beschreibst nur, was feststeht — nie
Ratschläge, Ermahnungen oder Motivationssprüche.

- Nenne den Hund immer beim echten Namen, nie "Gustav" (das ist nur das
  Maskottchen auf dem Icon, keine Figur, die spricht).
- Wenn heute eine Aktivität geplant ist: beschreibe in ein bis zwei Sätzen,
  warum sie heute dran ist (der mitgelieferte Grund) — erfinde keinen
  eigenen Grund dazu.
- Wenn heute nichts geplant ist: sag das einfach so, ohne es zu
  rechtfertigen oder schönzureden.
- Wenn eine Erinnerung mitgegeben wurde (Termin oder Erledigung): erwähne
  sie sachlich an passender Stelle im Text, nicht als separate Mahnung.
- Kein Lob, kein Tadel, kein Streak-Bezug, keine Ausrufezeichen, keine
  Emojis.
- Antworte ausschließlich mit dem fertigen deutschen Fließtext, ohne
  Anführungszeichen, Überschrift oder Erklärung drumherum.
```

Dieser Text ist ein erster Entwurf, keine endgültige Fassung — er lebt als
Konstante im Code, nicht hart im Prompt-Aufruf verstreut, damit er sich
leicht überarbeiten lässt (z. B. mit einer Hundetrainerin abgestimmt).

## Beispiele

1. **Aktivität, keine fällige Erinnerung.** `slot.activityId` gesetzt,
   `reason = {kind: 'priority', skillId: 'recall', needDimension: null}`,
   keine `reminder`-Zeile fällig. Prompt enthält `Activity.sentence` +
   Reason-Kontext, keine Erinnerung. `day_text` wird gesetzt,
   `day_text_generated_at = jetzt`.

2. **Leerer Tag, aber ein fester Termin heute.** `reason.kind = 'empty'`,
   eine `reminder`-Zeile `{kind: 'vaccination', due_date: heute,
   lead_time_days: 0}`. Der generierte Text erwähnt den Impftermin, obwohl
   der Tag sonst planerisch leer ist — die Erinnerung ist unabhängig von
   `reason` sichtbar, solange sie im Fenster liegt.

2a. **Loser Auftrag mit Vorlauf.** `reminder = {kind: 'weighIn', due_date:
   in 20 Tagen, lead_time_days: 14}`. An Tag 5 (noch 15 Tage bis
   `due_date`) wird sie nicht erwähnt (`due_date - lead_time_days` liegt
   noch in der Zukunft); ab Tag 6 (noch 14 Tage) taucht sie im Tagestext
   auf und bleibt es, bis `done_at` gesetzt wird — auch über `due_date`
   hinaus, falls niemand abgehakt hat.

3. **Zweites Öffnen desselben Tages.** `slot.day_text` ist bereits gesetzt.
   Die App zeigt den gecachten Wert, ruft `generate-day-text` nicht erneut
   auf — auch dann nicht, wenn zwischenzeitlich eine neue `reminder`
   eingetragen wurde (siehe „Nicht dazu gehört").

4. **Erstes Öffnen offline.** `slot.day_text = null`, kein Netz. Die App
   zeigt den heutigen Template-Text aus `reason` + `Activity.sentence`
   (unverändertes Verhalten aus `docs/specs/texten.md`) statt eines leeren
   Bildschirms oder Fehlers. Sobald wieder Netz da ist, kann `day_text`
   nachträglich generiert werden.

## Nicht dazu gehört

- Checkin-Freitext (`review_freetext`/`intent_freetext`) per LLM in
  `WeeklyContext` zu übersetzen (`checkin_translator.ts`) — eigenes,
  unverändertes Backlog-Item (V1.2, `docs/datenmodell.md`). Dessen
  Ausgabe fließt in die Planer-*Struktur* ein und muss deshalb
  reproduzierbar bleiben; das ist ein anderes Problem als der Tagestext
  hier.
- Ein UI zum Verwalten von `reminder` (Wiederholungen, Benachrichtigungen,
  Bearbeiten/Löschen) — nur das Datenmodell und dass `generate-day-text`
  fällige Zeilen lesen kann.
- Automatisches Neugenerieren von `day_text`, sobald sich `reminder`
  ändert oder Zeit vergeht — siehe „Trigger".
- Prompt-/Modellversion zwecks Reproduzierbarkeit der Prosa zu
  persistieren — bewusste Nutzerentscheidung: nur die Daten dahinter
  (`slot`, `reminder`) müssen nachvollziehbar bleiben, nicht der Wortlaut.
- Den heutigen Client-seitigen Template-Text (`docs/specs/texten.md`)
  abzuschaffen — er bleibt als Offline-/Fallback-Pfad bestehen.
- Ein selbst betriebener LLM-Dienst (lokal oder gehostet) — Gemini deckt
  das ab, siehe „Warum".

## Offene Fragen

- Genauer Prompt-Wortlaut und wie die Tonalitätsregeln (CLAUDE.md:
  beschreibend statt anweisend, kein Streak-Druck, kein
  Gustav-Sprechen) dem Modell mitgegeben werden — vor der Implementierung
  zu klären, damit sie sich in einem Systemprompt statt verstreut im
  Code wiederfindet.

Geklärt: `reminder.kind` startet mit `vaccination`/`weighIn` (weitere Werte
später per Migration, kein `custom` jetzt). Das Zeitfenster ist keine feste
Konstante, sondern pro Zeile über `lead_time_days` definierbar — deckt
sowohl den festen Termin (`lead_time_days = 0`) als auch den losen Auftrag
mit Vorlauf ab, ohne zwei getrennte Konzepte zu brauchen (siehe
„Verhalten").
