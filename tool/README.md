# Werkzeuge

Läuft ohne Flutter, ohne Emulator, ohne Netz.

| Kommando | Prüft |
|---|---|
| `dart run tool/validate.dart` | Content: Schema, Referenzen, Abdeckungslücken, `planer.yaml` |
| `dart run tool/seed.dart` | YAML → Postgres, idempotent |

Der Simulator (`simulate.ts`) lebt seit dem Architekturwechsel auf
Supabase Edge Functions nicht mehr hier, sondern direkt neben der
Planer-Logik, die er durchspielt:

| Kommando | Prüft |
|---|---|
| `deno run --allow-read infra/supabase/functions/_shared/planner/simulate.ts` | 12 Wochen als Text — liest sich das wie ein guter Plan? |
| `deno run --allow-read infra/supabase/functions/_shared/planner/simulate.ts --check` | Invarianten über 20 synthetische Hunde |
| `deno run --allow-read infra/supabase/functions/_shared/planner/simulate.ts --gegen <datei>` | zwei Konfigurationsstände nebeneinander |

Der Simulator ist das wichtigste Entwurfswerkzeug des Projekts. Er findet
Fehler, die kein Unit-Test findet: dreimal dasselbe Suchspiel in Woche 6,
ein Skill, der nie wieder auftaucht, eine Woche, die sich für einen
nachlässigen Nutzer wie eine Strafpredigt liest.

## Konfiguration ist ein Parameter

Der Simulator lädt `content/planer.yaml` und reicht sie in den Planer hinein —
er importiert sie nicht. Das ist die praktische Durchsetzung von Regel 10:
Steht ein Gewicht fest verdrahtet im Code der Edge Function, lässt sich der
Vergleichsmodus nicht bauen.

```bash
deno run --allow-read infra/supabase/functions/_shared/planner/simulate.ts \
    --hund junghund43 --profil unregelmaessig \
    --konfig content/planer.yaml \
    --gegen  content/varianten/mehr-ruhe.yaml
```

Beide Läufe verwenden denselben Hund, dasselbe Profil und denselben Seed —
der einzige Unterschied ist die Konfiguration. Beim Einstellen der Gewichte
ist das deutlich schneller als ändern, neu starten, lesen.

Varianten liegen in `content/varianten/` und werden nie ausgeliefert.
