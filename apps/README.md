# Apps

`app/` wird lokal erzeugt, weil `flutter create` die Plattformordner für
iOS und Android generiert:

```bash
mkdir -p app && cd app
flutter create --org de.hundeplaner --project-name hundeplaner \
  --platforms=ios,android .
```

Danach in `app/pubspec.yaml` die Engine einhängen:

```yaml
dependencies:
  engine:
    path: ../../packages/engine
  flutter_riverpod: ^2.5.0
  drift: ^2.20.0
```

Ordner feature-first (CLAUDE.md, Regel 4):

```
lib/features/<feature>/{data,domain,ui}
```

Vorgesehene Features für den MVP: `onboarding`, `periode`, `tag`,
`aktivitaet`, `checkin`, `fortschritt`, `debug`.

`debug` enthält die Zeitreise — Periode springen, Zustand zurücksetzen,
Plan neu erzeugen. Ohne die ist ein zeitbasiertes Produkt nicht bedienbar
zu testen.
