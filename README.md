# Gustav

Wochenplaner für Hundehalter. Gustav ist der Hund auf dem Icon — das Gesicht
des Produkts, nicht seine Stimme.

Monorepo: reine Dart-Engine, Flutter-App, Content als YAML, gehostetes Supabase.

## Aufbau

```
packages/engine/   reines Dart — Modelle, Planer, Spaced Repetition. Keine Abhängigkeiten.
apps/gustav/       Flutter-App (iOS, Android). Local-first. com.isjust.gustav
content/           Skills, Aktivitäten und Planerkonfiguration als YAML
tool/              validate.dart, simulate.dart, seed.dart
infra/supabase/    Migrationen, Seeds, Anbindung
assets/            Illustrationen (SVG, Einstrich-Tusche)
docs/              Produkt, Datenmodell, Bauplan, Specs
```

**Vor dem ersten Code `docs/` lesen** — dort steht alles, was das Produkt
ausmacht, inklusive der Entscheidungen und ihrer Begründung.

## Einrichten

```bash
# 1  Flutter-App erzeugen (füllt die Plattformordner)
cd apps
flutter create --org com.isjust --project-name gustav \
  --platforms=ios,android gustav

# 2  Engine-Abhängigkeiten
cd ../packages/engine && dart pub get

# 3  Supabase lokal (Docker)
npm i -g supabase && supabase start
```

## Täglicher Ablauf

```bash
dart test packages/engine            # Engine, < 2 s, kein Flutter nötig
dart run tool/validate.dart          # Content: Schema, Referenzen, Lücken
dart run tool/simulate.dart          # 12 Wochen als Text lesen
dart run tool/simulate.dart --check  # Invarianten über 20 synthetische Hunde
cd apps/gustav && flutter test       # Widgets und Goldens
```

## Reihenfolge

Phase 1 ist die Engine samt Simulator — ohne Oberfläche. Erst wenn zwölf
simulierte Wochen sich richtig lesen, beginnt die App. Details in
`docs/bauplan.md`.
