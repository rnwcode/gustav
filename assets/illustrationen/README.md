# Illustrationen

Einstrich-Tusche: ein Hund, mit einer durchgehenden kalligraphischen Linie
gezeichnet. Bewusst rasse-uneindeutig — kein Fellansatz, keine Farbe, keine
Größe, über die sich jemand ärgern kann.

## Regeln

- **SVG**, optimiert (SVGO). Ziel: unter 8 KB je Datei.
- **Einfarbig** über `currentColor`, transparenter Hintergrund. Damit folgt
  die Zeichnung dem Theme, hell wie dunkel, ohne zweiten Satz Assets.
- **Genau ein Element in der Akzentfarbe**, wo es der Anleitung dient —
  die Leine, die Hand, der Punkt worauf es ankommt. Information, keine Deko.
- **Quadratische Zeichenfläche**, gleiche Innenabstände über alle Assets.
- Dateiname = `illustration`-Feld der Aktivität.

## Zwei Register

- *Ausdruck* — freier Strich für Tagesheader, leere Zustände, Meilensteine
- *Anleitung* — sachlicher, gleiche Tuschesprache, zeigt Position und Griff

## Monolinie oder Pinselstrich

Echte Kalligraphie mit schwellender Strichstärke ist im SVG eine gefüllte
Fläche — schöner, aber nicht als „sich selbst zeichnender Strich" animierbar.
Gleichmäßige Strichstärke ist animierbar (`stroke-dasharray`) und trivial
umfärbbar. Für die wenigen bewegungskritischen Übungen deshalb Monolinie.

## Nicht per KI

Durchgehende Einzelstrich-Zeichnungen sind genau die Disziplin, an der
Bildmodelle scheitern. Diese Assets entstehen von Hand — rund fünfzehn bis
zwanzig Grundposen, aus denen sich der Rest zusammensetzen lässt.
