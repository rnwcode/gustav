# Apps

`gustav/` is an Expo (React Native, TypeScript) app — see
`gustav/README.md` and the repo-root `CLAUDE.md` (Architektur-Abschnitt)
for why it holds no planner logic: that lives as an Edge Function in
`infra/supabase/functions/`, the app only calls it and reads/writes the
state rows RLS already scopes to the signed-in user.

```bash
cd apps/gustav
npm install
cp .env.example .env.local   # fill in EXPO_PUBLIC_SUPABASE_ANON_KEY
npm run start
```

State management is Zustand (`src/state/`, and each feature's own
`data/*Store.ts`), routing is Expo Router (`app/`), feature code is
feature-first (`src/features/<feature>/{data,domain,ui}`), and the design
system lives in `src/design/` — every screen sources color/type/spacing
from `src/design/tokens.ts` so a palette change never touches a screen
file.

Implemented features: `onboarding` (six steps), `plan` (Tagesansicht +
Übung/Bewertung). Not yet built, but the module layout is meant to take
them the same way: `periode` (Wochenübersicht), `checkin`
(Planungstag-Check-in), `fortschritt`, `debug` (time travel — jumps the
local Edge Function's fake clock, not the device clock; the app itself
has no time logic, CLAUDE.md Regel 2).
