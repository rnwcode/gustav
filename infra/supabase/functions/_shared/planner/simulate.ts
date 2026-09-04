// Spielt einen synthetischen Halter über mehrere Perioden durch und druckt
// jede Periode als Text. Das wichtigste Entwurfswerkzeug des Projekts.
//
// ── Aufruf ──────────────────────────────────────────────────────────────────
//
//   deno run infra/supabase/functions/_shared/planner/simulate.ts \
//       --hund welpe11 --profil unregelmaessig --wochen 12
//   deno run infra/supabase/functions/_shared/planner/simulate.ts --check
//   deno run infra/supabase/functions/_shared/planner/simulate.ts \
//       --hund junghund43 \
//       --konfig content/planer.yaml \
//       --gegen  content/varianten/mehr-ruhe.yaml
//
// ── Optionen ────────────────────────────────────────────────────────────────
//
//   --hund      Fixture-Name aus infra/supabase/functions/_shared/planner/fixtures/
//   --profil    fleissig | unregelmaessig | gibt_auf
//   --wochen    Anzahl Perioden (Vorgabe 12)
//   --konfig    Pfad zur Planerkonfiguration (Vorgabe content/planer.yaml)
//   --gegen     zweite Konfiguration — druckt beide Läufe nebeneinander
//   --check     nur Invarianten, 20 synthetische Hunde, keine Textausgabe
//   --seed      Startwert für die Bewertungswürfel (Vorgabe 42, deterministisch)
//
// ── Wichtig: Konfiguration ist ein Parameter ────────────────────────────────
//
// Der Simulator LÄDT die Konfiguration und reicht sie in den Planer hinein.
// Er importiert sie nicht. Nur dadurch lassen sich zwei Stände gegeneinander
// laufen lassen, und nur dadurch bleibt Regel 10 aus CLAUDE.md durchsetzbar:
// Kein Gewicht steht fest verdrahtet im Code der Edge Function.
//
//   const config = configFromYaml(datei);
//   const plan = plan({ dog, household, catalog, config, ... });
//
// Beim Einstellen der Gewichte ist der Vergleichsmodus deutlich schneller als
// ändern, neu starten, lesen — man sieht direkt, was die Änderung bewirkt.
//
// ── Ausgabe im Vergleichsmodus ──────────────────────────────────────────────
//
//   ── Woche 3 ────────────────  A: planer.yaml v1   B: mehr-ruhe.yaml v1-e2
//   Mo   A  Leinenführigkeit, Stufe abl 1      [prioritaet]
//        B  Leinenführigkeit, Stufe abl 1      [prioritaet]
//   Di   A  Futterbeutel-Suche                 [bedarfsluecke: nase]
//        B  —                                  [erholung]
//   ...
//   ── Unterschiede über 12 Wochen ──────────────────────
//   Slots gesamt        A 48    B 41
//   davon Training      A 22    B 16
//   leere Tage          A 36    B 43
//   Bedarf nase         A 61    B 52
//   Invarianten         A ok    B ok
//
// ── Invarianten, die --check prüft ──────────────────────────────────────────
//
//   - jede Periode hat mindestens einen leeren Tag
//   - kein Skill bleibt länger als 45 Tage unberührt
//   - keine Varianzgruppe wiederholt sich innerhalb ihrer Sperrfrist
//   - jede Bedarfsdimension wird über zwei Perioden mindestens einmal gedeckt
//   - nach einem Tag mit Belastung 3 folgt kein Trainingstag
//   - die Obergrenzen der Lebensphase werden nie überschritten
//
// Exit-Code 0 bei grün, 1 bei verletzter Invariante. Wird von der CI aufgerufen.
//
// TODO(Phase 1): implementieren — Schritte 1, 2, 7, 8 des Planers fehlen noch
// (siehe infra/supabase/functions/_shared/planner/README.md), erst danach
// lässt sich eine ganze Periode erzeugen statt nur einzelne Schritte zu testen.

if (import.meta.main) {
  throw new Error('Phase 1 — siehe docs/bauplan.md');
}
