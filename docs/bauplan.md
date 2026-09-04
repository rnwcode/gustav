# Bauplan

Fünf Phasen, jede mit einem Abschluss, den ein Kommando grün oder rot macht.
Annahmen: 20+ Stunden pro Woche, Mac vorhanden (iOS und Android), Validierung
läuft nebenher.

## Karte

| Strang | Woche |
|---|---|
| Validierung (Markt, Gespräche, Trainerin) | 1–4, nebenher |
| Phase 1 — Engine, reines Dart | 1–3 |
| **Content — kritischer Pfad, 40 Aktivitäten** | **1–8** |
| Phase 2 — App, Flutter, lokal | 3–7 |
| Phase 3 — Backend und Sync | 7–9 |
| Phase 4 — Geld und Beta | 9–12 |
| Phase 5 — Launch DACH | ab 12 |

Der Code ist bei diesem Zeitbudget nicht der Engpass — **der Content ist es**.
Deshalb startet er in Woche 1.

## Testebenen

Ebene 1 bis 3 laufen ohne Flutter, ohne Emulator, ohne Netz, in unter zwei
Sekunden.

| Ebene | Kommando | Prüft |
|---|---|---|
| 1 Engine | `dart test packages/engine` | Zustandsautomat, Intervalle, Filter, Fixtures |
| 2 Content | `dart run tool/validate.dart` | Schema, Referenzen, Abdeckungslücken, `planer.yaml` |
| 3 Simulator | `dart run tool/simulate.dart` | 12 Wochen als Text — liest sich das gut? |
| 4 Widgets | `flutter test` | Screens, Goldens hell und dunkel |
| 5 Integration | `flutter test integration_test` | Onboarding → Periode 1 → Check-in → Periode 2 |
| 6 Gerät | Debug-Menü | Zeitreise, Periode springen, Zustand zurücksetzen |

### Der Simulator ist das wichtigste Werkzeug

Er spielt einen synthetischen Halter über zwölf Perioden durch, würfelt
Bewertungen nach einem Profil (fleissig, unregelmaessig, gibt_auf), schreibt
die Skill-Stände fort und druckt jede Periode als Text. Damit beurteilt man in
Sekunden, ob sich die Progression richtig anfühlt — und sieht Fehler, die kein
Unit-Test findet: dreimal dasselbe Suchspiel in Woche 6, ein Skill, der nie
wieder auftaucht, eine Periode, die sich für einen nachlässigen Nutzer wie eine
Strafpredigt liest.

`--check` läuft über zwanzig synthetische Hunde und prüft nur die Invarianten
— Property-Testing für den Planer, einmal zwei Stunden Bauzeit, bestes
Verhältnis im ganzen Projekt.

`--konfig` und `--gegen` lassen zwei Konfigurationsstände nebeneinander laufen,
bei identischem Hund, Profil und Seed. Beim Einstellen der Gewichte ist das
erheblich schneller als ändern, neu starten, lesen. Details in `tool/README.md`.

### Die Fake-Clock ist keine Kür

Ruft auch nur eine Stelle `DateTime.now()` auf, lassen sich weder Simulator
noch Integrationstest noch Debug-Menü bauen. Die Regel steht in CLAUDE.md und
wird von der CI erzwungen. Nachträglich ist das eine Woche Arbeit.

## Phase 1 — Engine, ohne Oberfläche (Woche 1–3)

Ein reines Dart-Paket, das aus Zustand einen Wochenplan macht. Am Ende dieser
Phase ist das Produkt im Kern fertig; alles Weitere ist Oberfläche und Content.

- Datenklassen und Enums aus `datenmodell.md`
- Zustandsautomat und Spaced Repetition
- Planer, Schritte 1–7; Texten (Schritt 8) als Template
- `tool/validate.dart`, `tool/simulate.dart`
- Die acht Fixtures aus `datenmodell.md`

**Fertig, wenn** `dart test && dart run tool/simulate.dart --check` grün ist
und zwölf simulierte Wochen gelesen wurden, ohne zusammenzuzucken.

## Phase 2 — App, vollständig lokal (Woche 3–7)

Läuft komplett offline gegen lokale Persistenz (Drift oder Isar) und den
YAML-Katalog. Das ist keine Zwischenstufe, sondern die Zielarchitektur: Der
Plan muss auf der Hundewiese ohne Empfang funktionieren.

Sechs Screens: Onboarding, Periodenübersicht, Tagesansicht, Übungsdetail mit
Selbsteinschätzung, Check-in, Fortschritt. Dazu das Debug-Menü mit Zeitreise.

Die Reihenfolge im Einstieg steht schon jetzt fest, auch wenn hier noch nichts
verkauft wird: Onboarding, **Plan erzeugen, Plan zeigen**, dann erst der Punkt,
an dem später die Paywall sitzt. Dieser Punkt existiert ab Phase 2 als eigene
Route, vorerst ohne Wirkung.

**Fertig, wenn** `flutter test integration_test` Onboarding bis Periode 2 im
Flugmodus durchläuft — und die App eine Woche lang mit einem echten Hund
benutzt wurde.

## Phase 3 — Backend und Sync (Woche 7–9)

Supabase gehostet, Region Frankfurt, Start auf dem kostenlosen Plan. Lokal
wird gegen `supabase start` entwickelt; die Cloud kommt erst dran, wenn lokal
alles läuft. Auth beginnt anonym, Account erst beim Kauf.

Details, Grenzen des kostenlosen Plans und das Pflichtprogramm vor dem Launch:
`infra/supabase/README.md`.

**Fertig, wenn** ein Restore aus dem Backup auf eine frische Instanz gelaufen
ist und die App dagegen läuft — nicht wenn das Deployment steht.

## Phase 4 — Geld und Beta (Woche 9–12)

RevenueCat statt StoreKit und Play Billing selbst. Ein Preis, ein Angebot.

Die Paywall-Position ist ein Remote-Config-Schalter, beide Varianten sind ab
Tag eins im Build. Start weich, Umschalten bei etwa 50 Bewertungen und einem
Schnitt über 4,3. Drei Kennzahlen je Variante: `onboarding_abgeschlossen /
install`, `trial_gestartet / onboarding_abgeschlossen`, `zahlend / install` —
nur die letzte macht beide vergleichbar. Die harte Variante gewinnt oft trotz
schlechterer Funnel-Zahlen; beim Umschalten also nicht vorher zucken.

Dazu PostHog oder Matomo, Sentry, und 20–30 Beta-Tester.

**Fertig, wenn** nach zwei Wochen Beta mindestens die Hälfte den zweiten
Check-in gemacht hat. Das ist die einzige Zahl, die in der Beta zählt.

## Phase 5 — Launch DACH (ab Woche 12)

Kein Big Bang. Store-Launch, dann Content-Marketing und Partnerschaften.
Bezahlte Anzeigen rechnen sich beim aktuellen LTV nicht.

Was danach kommt, steht im Backlog von `datenmodell.md` und wird erst
angefasst, wenn **100 zahlende Kunden** erreicht sind.

## Content-Strang (Woche 1–8)

Vierzig Aktivitäten, fünf pro Woche, jede mit Anleitung, Erfolgskriterium,
typischen Fehlern und drei bis fünf Troubleshooting-Einträgen.

Ablauf pro Charge: zwei von Hand als Vorlage schreiben, acht per KI im selben
Schema erzeugen, Validator laufen lassen, **jede einzelne selbst lesen**. Der
letzte Schritt ist nicht delegierbar — bei Angst, Aggression und Sicherheit
erst recht nicht.

Die Abdeckungsprüfung im Validator ist wichtiger, als sie klingt: Sie meldet,
wenn es für einen Skill auf einer Ablenkungsstufe keine passende Aktivität
gibt. Ohne sie läuft der Planer irgendwann leer — und zwar erst bei einem
echten Nutzer in Woche 7.

## Zusammenarbeit mit KI

| Gut | Schlecht |
|---|---|
| Flutter-UI aus Entwurf oder Spec | Scoring-Gewichte des Planers |
| Serialisierung, Migrationen, RLS-Policies | Tonalität der Rahmentexte |
| Testgerüste aus einer Spec | fachliche Richtigkeit der Hundeinhalte |
| Content-Rohentwürfe im Schema | Entscheidungen über Modelländerungen |
| Validator- und Tooling-Skripte | alles, wo „plausibel" nicht reicht |

Die rechte Spalte ist Handarbeit. Wer sie delegiert, bekommt ein Produkt, das
funktioniert und sich nach niemandem anfühlt.

## Was den Plan kippen kann

| Risiko | Frühwarnzeichen | Reaktion |
|---|---|---|
| Content zu langsam | Woche 3: unter 10 Aktivitäten fertig | MVP auf 25 kürzen, Skill-Umfang halbieren |
| Plan liest sich generisch | Simulator-Wochen wirken austauschbar | zurück ins Modell — meist fehlt eine Bedarfsdimension oder Varianz |
| Codebasis driftet | KI-Änderungen brechen regelmäßig Goldens | Slices verkleinern, Spec vor Code erzwingen |
| Beta bricht ab | zweiter Check-in unter 50 % | nicht launchen — erst die Schleife reparieren |
| Rechtliche Unsicherheit | Positionierung als „Hundetrainer" | früh anwaltlich klären |
