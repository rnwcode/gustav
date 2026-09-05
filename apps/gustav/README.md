# Gustav

Expo (React Native, TypeScript) client for Gustav — a weekly planner for
dog owners. Holds no planner logic itself; see the repo-root `CLAUDE.md`
and `apps/README.md`.

## Getting started

```bash
npm install
cp .env.example .env.local   # fill in EXPO_PUBLIC_SUPABASE_ANON_KEY
npm run start
```

Point `EXPO_PUBLIC_SUPABASE_URL` at a local `supabase start` stack (the
`.env.example` default) or a hosted project.

## Layout

- `app/` — Expo Router routes. Thin: each route wires a feature's screen
  component to navigation, nothing else.
- `src/design/` — tokens (`tokens.ts`), the light/dark hook (`useTheme.ts`),
  and the shared component primitives (`components/`).
- `src/features/<feature>/{data,domain,ui}` — one folder per feature.
  `domain/` holds wire-format types and German enum values shared with the
  backend; `data/` holds Supabase repositories and Zustand stores; `ui/`
  holds screens and step components.
- `src/lib/` — the Supabase client and env config.
- `src/state/` — cross-feature state (session bootstrap).

## Scripts

- `npm run start` — Metro/Expo dev server.
- `npm run lint` — ESLint (`eslint-config-expo`).
- `npx tsc --noEmit` — type-check.
