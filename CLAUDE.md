# Projektregeln

Diese Datei wird von KI-Werkzeugen (Claude Code, Cursor, Windsurf) bei jedem
Auftrag mitgelesen. Sie ist bewusst kurz gehalten, damit sie auch gelesen wird.

## Was das Produkt ist

Ein Wochenplaner für Hundehalter. Der Nutzer sagt am Planungstag, wie die
Periode lief und was ihm wichtig ist — daraus entsteht der Plan. Jeder Tag hat
einen beschreibenden Rahmen und **genau eine** Sache. Manchmal ist diese eine
Sache: nichts.

Nicht: ein Kurskatalog zum Abarbeiten. Nicht: ein durchgetakteter Tagesplan.

## Architektur — nicht verhandelbar

**Die gesamte Business-Logik (Planer, Zustandsautomat, Scoring, Zuweisung)
läuft serverseitig als Supabase Edge Function, nicht client-seitig in
Dart.** Grund: Logik- und Gewichtsänderungen sollen sofort bei allen
Nutzern wirken, ohne an App-Release-Zyklen zu hängen. Damit einher geht
eine bewusste Abkehr vom lokal-first-Anspruch für die Plan**erzeugung**
(siehe Regel 9). Ein früherer Anlauf mit der Logik in einem Dart-Paket
(`packages/engine/`) wurde deshalb wieder abgebaut — sollten davon Reste
auftauchen, sind sie tot und gehören entfernt, nicht weitergepflegt.

1. Business-Logik lebt ausschließlich in `infra/supabase/functions/`
   (TypeScript auf Deno). Keine Abhängigkeit auf Flutter oder eine
   bestimmte App-Version — eine Edge Function bedient jeden Client, der
   sie aufruft, unabhängig vom Build-Stand seiner App.

2. Kein `new Date()` / `Date.now()` außerhalb einer injizierten Zeitquelle
   in `infra/supabase/functions/`. Verstoß = CI-Fehler. Ohne Fake-Clock ist die
   Wochenschleife nicht testbar (Simulator, Property-Tests, Zeitreise in
   der Testsuite).

3. Zustandsverwaltung in der App ausschließlich Riverpod. Kein `setState`
   in Feature-Code, kein zweites State-Management „nur hier kurz". Die
   App enthält keine Planer-Logik, nur Anzeige, Eingabe und lokales
   Caching der Server-Antworten.

4. Ordner feature-first: `apps/gustav/lib/features/<feature>/{data,domain,ui}`.
   Kein globales `widgets/` oder `utils/`.

5. Content ist Daten, nie Code. Übungen und Skills leben als YAML in
   `content/`, werden validiert und geseedet — niemals als Literale im
   Code der Edge Functions.

6. Änderungen an `infra/supabase/functions/` nur, wenn danach `deno test` UND
   der Simulator (`--check`) grün sind. Die Gewichte in
   `content/planer.yaml` ändert kein Agent eigenmächtig.

7. Jede neue Funktion beginnt mit einer Spec in `docs/specs/` und einem
   fehlschlagenden Test. Erst dann Implementierung.

8. Supabase läuft gehostet, Region Frankfurt. Trotzdem keine
   cloud-exklusiven Features verwenden: Alles muss auch gegen den lokalen
   Stack (`supabase start`) laufen. Darunter liegt Postgres — die Tür zum
   Selbsthosten bleibt damit jederzeit offen, ohne Umbau.

9. **App ist nicht mehr lokal-first für die Planerzeugung.** Ein neuer
   Wochenplan entsteht ausschließlich serverseitig und braucht eine
   Verbindung. Bereits erzeugte Pläne werden lokal gecacht und bleiben
   offline **einsehbar** (und abhakbar, siehe Sync unten) — nur das
   **Erzeugen** eines neuen Plans erfordert Netz. Das ist eine bewusste
   Produktentscheidung, keine Nebenwirkung; `docs/produkt.md` hält den
   Kompromiss fest.

10. **Serverseitig gehören immer:** die Planer-Logik selbst (siehe oben),
    LLM-Aufrufe (keine Schlüssel in der App), der Content-Katalog samt
    Planerkonfiguration, und die Abo-Prüfung. Entitlements sind nie
    clientseitig autoritativ — das ist die eine Stelle, an der
    Manipulation direkt Geld kostet.

    - **Parameter sind Daten, nicht Code.** Gewichte, Obergrenzen,
      Intervalle und Schwellen stehen in `content/planer.yaml`, nicht
      fest verdrahtet im Code der Edge Function — Content und
      Planerkonfiguration bleiben zusammen versionierbar und für den
      Simulator vergleichbar (`--gegen`), unabhängig davon, dass ein
      Deploy der Function ohnehin sofort bei allen Nutzern wirkt.
    - **Ein Plan wird einmal erzeugt und gespeichert**, nie bei jedem
      Öffnen neu gerechnet. Gespeichert werden `algorithmus_version` und
      `konfig_version` daneben — sonst schreibt eine Konfigänderung mitten
      in der Periode dem Nutzer still seine Woche um.
    - Was lokal gecacht wird, dient ausschließlich der **Anzeige und dem
      Abhaken** offline — nie der Neuberechnung. Ein Tageshäkchen wird
      lokal zwischengespeichert und synchronisiert, sobald wieder Netz da
      ist; es löst clientseitig keine Planer-Logik aus.

## Sprache

**Entwicklungssprache ist Englisch.** Code, Bezeichner, Kommentare,
Commit-Nachrichten und Testbeschreibungen in `infra/supabase/functions/`,
`apps/` und `tool/` sind durchgängig Englisch — auch dort, wo es die
Fachdomäne betrifft (also `Skill`, `Activity`, `WeeklyPlan`, `Load`, nicht
`Aktivitaet`/`Wochenplan`/`Belastung`). Kein Denglisch, keine gemischten
Bezeichner. Die Business-Logik ist TypeScript auf Deno
(`infra/supabase/functions/`), die App ist Dart/Flutter (`apps/`) — beide
Laufzeiten sprechen nur über die in `docs/datenmodell.md` beschriebenen
Datenstrukturen miteinander, nie über geteilten Code.

**Nur der Content selbst bleibt Deutsch:** die YAML-Dateien in `content/`
(Skills, Aktivitäten, `planer.yaml`) und alle nutzersichtbaren Texte in der
App. Das ist Fachvokabular für Hundetrainerinnen und Nutzer, keine
Entwicklungssprache.

`docs/` (Produkt- und Prozessdokumentation, inklusive `docs/specs/`) bleibt
ebenfalls Deutsch — das sind Texte für Menschen im Projekt, kein Code.

**Spätere Mehrsprachigkeit mitdenken:** `id`-Felder im Content sind bereits
sprachneutrale Slugs, keine deutschen Wörter — daran ändert sich nichts.
Nutzersichtbare Textfelder (`titel`, `satz`, `beschreibung`, Rahmentexte
usw.) sind die Stellen, die später pro Locale dazukommen. Kein Schema dafür
vorab bauen — nur beim Content-Schema keine Annahme treffen, die eine
spätere Übersetzung erschwert (z. B. Text nicht mit Fachdaten vermischen).

## Tonalität der nutzersichtbaren Texte

Beschreiben, nicht anweisen. Die App behauptet nur, was sie belegen kann:
was sie selbst geplant hat, was abgehakt wurde, was der Nutzer gesagt hat.
Kein Streak-Druck, keine Ermahnung nach einer Pause, keine Schuldrhetorik.
Der Nutzer trägt nie etwas ein, damit die App rechnen kann — er drückt einen
Knopf, weil er selbst etwas davon hat.

**Gustav spricht nicht.** Gustav ist der Hund auf dem Icon und in den
Illustrationen — das Gesicht des Produkts, nicht seine Stimme. Die App redet
nie als Gustav, gibt keine Ratschläge in seiner Rolle und hat keine
Maskottchen-Sprechblasen. Im Plan steht immer der Name des echten Hundes.
Eine Charakterstimme wäre genau die Bevormundung, die das Produkt vermeiden
will — nur mit Kuschelfaktor.
