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

1. `packages/engine/` hat KEINE Abhängigkeit außer `dart:core` und `meta`.
   Kein Flutter, kein Supabase, kein IO, kein `DateTime.now()`.
   Zeit kommt immer als Parameter oder aus der injizierten `Clock`.

2. Kein `DateTime.now()` im gesamten Repo. Verstoß = CI-Fehler.
   Das Produkt ist zeitbasiert; ohne Fake-Clock ist die Wochenschleife
   nicht testbar (Simulator, Integrationstest, Debug-Zeitreise).

3. Zustandsverwaltung ausschließlich Riverpod. Kein `setState` in
   Feature-Code, kein zweites State-Management "nur hier kurz".

4. Ordner feature-first: `apps/app/lib/features/<feature>/{data,domain,ui}`.
   Kein globales `widgets/` oder `utils/`.

5. Content ist Daten, nie Code. Übungen und Skills leben als YAML in
   `content/`, werden validiert und geseedet — niemals als Dart-Literale
   in `lib/`.

6. Änderungen an `packages/engine/` nur, wenn danach `dart test` UND
   `dart run tool/simulate.dart --check` grün sind. Die Gewichte in
   `content/planer.yaml` ändert kein Agent eigenmächtig.

7. Jede neue Funktion beginnt mit einer Spec in `docs/specs/` und einem
   fehlschlagenden Test. Erst dann Implementierung.

8. Supabase läuft selbst gehostet. Keine cloud-exklusiven Features
   verwenden — alles muss gegen den lokalen Compose-Stack laufen.
   Darunter liegt Postgres; die Tür in beide Richtungen bleibt offen.

9. App ist local-first. Sie funktioniert vollständig offline;
   Sync ist eine Ergänzung, keine Voraussetzung.

10. **Wo die Logik läuft, ist eine Deployment-Entscheidung, keine
    Architekturentscheidung.** Der Planer ist eine reine Funktion und läuft
    deshalb überall — heute in der App (offline, ohne Wartezeit), morgen
    zusätzlich serverseitig, ohne dass sich am Paket etwas ändert.
    Damit das so bleibt, gilt:

    - **Parameter sind Daten, nicht Code.** Gewichte, Obergrenzen,
      Intervalle und Schwellen stehen in `content/planer.yaml` und kommen
      versioniert mit dem Katalog vom Server. Der Planer wird dadurch
      nachjustiert, ohne dass ein App-Release nötig ist. Fest verdrahtete
      Zahlen im Dart-Code sind ein Fehler.
    - **Ein Plan wird einmal erzeugt und gespeichert**, nie bei jedem
      Öffnen neu gerechnet. Gespeichert werden `algorithmus_version` und
      `konfig_version` daneben — sonst schreibt eine Konfigänderung mitten
      in der Periode dem Nutzer still seine Woche um.
    - **Serverseitig gehören immer:** LLM-Aufrufe (keine Schlüssel in der
      App), der Content-Katalog samt Planerkonfiguration, und die
      Abo-Prüfung. Entitlements sind nie clientseitig autoritativ —
      das ist die eine Stelle, an der Manipulation direkt Geld kostet.

## Sprache

Code, Bezeichner und Kommentare auf Deutsch, wo es die Fachdomäne betrifft
(Skill, Aktivitaet, Wochenplan, Belastung) — sonst Englisch nach Dart-Konvention.
Alle nutzersichtbaren Texte auf Deutsch.

## Tonalität der nutzersichtbaren Texte

Beschreiben, nicht anweisen. Die App behauptet nur, was sie belegen kann:
was sie selbst geplant hat, was abgehakt wurde, was der Nutzer gesagt hat.
Kein Streak-Druck, keine Ermahnung nach einer Pause, keine Schuldrhetorik.
Der Nutzer trägt nie etwas ein, damit die App rechnen kann — er drückt einen
Knopf, weil er selbst etwas davon hat.
