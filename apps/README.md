# Apps

`gustav/` wird lokal erzeugt, weil `flutter create` die Plattformordner für
iOS und Android generiert:

```bash
cd apps
flutter create --org com.isjust --project-name gustav \
  --platforms=ios,android gustav
```

**Die Application-ID ist `com.isjust.gustav`** — auf beiden Plattformen
dieselbe. Sie lässt sich nach dem ersten Store-Upload nie wieder ändern.
Der Anzeigename ist davon unabhängig und jederzeit änderbar; Bindestriche
sind in Android-IDs verboten, deshalb `isjust` statt `is-just`.

Danach in `gustav/pubspec.yaml` die Abhängigkeiten für Client und lokales
Caching einhängen — keine Planer-Logik in der App (CLAUDE.md,
Architektur-Abschnitt): die liegt als Edge Function in
`infra/supabase/functions/`, die App ruft sie nur auf.

```yaml
dependencies:
  supabase_flutter: ^2.5.0
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
Plan neu erzeugen. Die Zeitreise stellt die Fake-Clock der (lokalen)
Edge Function, nicht die Uhr des Geräts — die App selbst hat keine
Zeitlogik. Ohne die ist ein zeitbasiertes Produkt nicht bedienbar zu
testen.
