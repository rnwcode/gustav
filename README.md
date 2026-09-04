# Gustav

Wochenplaner für Hundehalter. Gustav ist der Hund auf dem Icon — das Gesicht
des Produkts, nicht seine Stimme.

Monorepo: Business-Logik als Supabase Edge Function (TypeScript/Deno),
Flutter-App als Client, Content als YAML, gehostetes Supabase.

## Aufbau

```
infra/supabase/functions/_shared/planner/  Planer-Logik (TypeScript, Deno) — Modelle, Zustandsautomat, Scoring
infra/supabase/                            Migrationen, Seeds, Edge Functions
apps/gustav/                               Flutter-App (iOS, Android). Client gegen die Edge Function. com.isjust.gustav
content/                                   Skills, Aktivitäten und Planerkonfiguration als YAML
tool/                                      validate.dart, seed.dart (Content-Tooling, bleibt Dart)
assets/                                    Illustrationen (SVG, Einstrich-Tusche)
docs/                                      Produkt, Datenmodell, Bauplan, Specs
```

**Vor dem ersten Code `docs/` lesen** — dort steht alles, was das Produkt
ausmacht, inklusive der Entscheidungen und ihrer Begründung.

## Einrichten

```bash
# 1  Flutter-App erzeugen (füllt die Plattformordner)
cd apps
flutter create --org com.isjust --project-name gustav \
  --platforms=ios,android gustav

# 2  Deno (für die Planer-Logik)
curl -fsSL https://deno.land/install.sh | sh

# 3  Supabase lokal (Docker)
npm i -g supabase && supabase start
```

## Täglicher Ablauf

```bash
deno test --allow-read infra/supabase/functions   # Planer-Logik + Content-Loader, < 2 s
dart run tool/validate.dart                 # Content: Schema, Referenzen, Lücken
deno run infra/supabase/functions/_shared/planner/simulate.ts          # 12 Wochen als Text lesen
deno run infra/supabase/functions/_shared/planner/simulate.ts --check  # Invarianten über 20 synthetische Hunde
cd apps/gustav && flutter test              # Widgets und Goldens
```

## Reihenfolge

Phase 1 ist die Planer-Logik samt Simulator — ohne Oberfläche, aber bereits
als Edge Function gegen den lokalen Supabase-Stack. Erst wenn zwölf
simulierte Wochen sich richtig lesen, beginnt die App. Details in
`docs/bauplan.md`.
