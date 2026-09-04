# Konfigurationsvarianten

Experimentelle Stände der Planerkonfiguration zum Vergleichen. Sie werden
**nicht ausgeliefert** — `tool/seed.dart` spielt nur `content/planer.yaml` ein.

```bash
dart run tool/simulate.dart --hund junghund43 \
    --konfig content/planer.yaml \
    --gegen  content/varianten/mehr-ruhe.yaml
```

Eine Variante ist eine vollständige Kopie von `planer.yaml` mit geänderten
Werten und einer eigenen `version` (Konvention: `1-e1`, `1-e2`, …, damit sie
nie mit einer ausgelieferten Version verwechselt wird).

Wenn eine Variante gewinnt, wandern ihre Werte nach `content/planer.yaml`,
`version` wird hochgezählt, und die Variante wird gelöscht. Varianten sind
Notizzettel, kein Archiv.
