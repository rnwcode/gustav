# Content Admin

Lokales Next.js-Tool zum Pflegen von `skill`/`activity` (samt ihrer
`*_text`-Tabellen je Sprache) direkt gegen die gehostete Supabase-DB. Keine
neue Quelle der Wahrheit — dieselben Tabellen, die auch Supabase Studio/SQL
bearbeiten würde. Siehe `docs/specs/content-admin.md` für das Design.

**Läuft nur lokal, wird nie deployed.**

## Setup

```bash
npm install
cp .env.local.example .env.local
```

`.env.local` braucht `SUPABASE_URL` und `SUPABASE_SERVICE_ROLE_KEY`
(Supabase Dashboard → Project Settings → API → „Legacy service_role API
key"). Der Service-Role-Key umgeht RLS — nötig, weil `skill`/`activity`
keine Schreib-Policy für `anon`/`authenticated` haben (CLAUDE.md, Regel 5).
Niemals mit `NEXT_PUBLIC_` präfixen, niemals committen (`.env*` ist
git-ignoriert).

```bash
npm run dev
```

Öffnet auf `http://localhost:3000`.

## Aufbau

- `lib/models.ts` — Typen/Enums, die exakt die Spaltennamen und
  Enum-Werte aus `infra/supabase/migrations/0002_content.sql` und
  `_shared/planner/models/enums.ts` spiegeln (gleiche Vokabeln, kein
  geteilter Code über die Node/Deno-Grenze hinweg).
- `lib/supabaseAdmin.ts` — Service-Role-Client, `server-only` markiert
  (kann nicht versehentlich in einen Client-Bundle geraten).
- `lib/skillsRepo.ts` / `lib/activitiesRepo.ts` — reine DB-Zugriffsfunktionen.
- `lib/formParsing.ts` — `FormData` → typisierte Werte (Zahlen, Checkboxen,
  kommagetrennte Listen, das `Problem => Antwort`-Zeilenformat für
  `troubleshooting`).
- `app/skills/`, `app/activities/` — Liste, Anlegen, Bearbeiten (inklusive
  Text je Sprache), jeweils über Server Actions (`actions.ts`).
