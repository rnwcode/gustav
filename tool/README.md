# Werkzeuge

Alle laufen ohne Flutter, ohne Emulator, ohne Netz.

| Kommando | Prüft |
|---|---|
| `dart run tool/validate.dart` | Content: Schema, Referenzen, Abdeckungslücken |
| `dart run tool/simulate.dart` | 12 Wochen als Text — liest sich das wie ein guter Plan? |
| `dart run tool/simulate.dart --check` | Invarianten über 20 synthetische Hunde |
| `dart run tool/seed.dart` | YAML → Postgres, idempotent |

Der Simulator ist das wichtigste Entwurfswerkzeug des Projekts. Er findet
Fehler, die kein Unit-Test findet: dreimal dasselbe Suchspiel in Woche 6,
ein Skill, der nie wieder auftaucht, eine Woche, die sich für einen
nachlässigen Nutzer wie eine Strafpredigt liest.
