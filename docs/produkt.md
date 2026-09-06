# Gustav — was das Produkt ist

Diese Datei ist die Grundlage für alles Weitere. Wer hier anfängt zu bauen,
ohne sie gelesen zu haben, baut das falsche Produkt — die Unterschiede sind
subtil und entscheidend.

## In drei Sätzen

Eine App, die dem Halter jede Woche sagt, was er mit seinem Hund macht. Am
Planungstag erzählt er in drei Minuten, wie die Periode lief und was ihm
wichtig ist — **daraus** entsteht der Plan. Jeder Tag hat einen beschreibenden
Rahmen und genau eine Sache; manchmal ist diese eine Sache: nichts.

Der Kern ist nicht der Übungskatalog, sondern die Entscheidung, die dem Halter
abgenommen wird.

## Was es ausdrücklich nicht ist

- **Kein Kurskatalog zum Abarbeiten.** Wettbewerber (Dogo, Hundeo, Rütter DOGS)
  sind Katalog-förmig. Genau da nicht konkurrieren.
- **Kein durchgetakteter Tagesplan.** Fünf Punkte am Tag sind fünf
  Gelegenheiten zu versagen. Einer ist eine Gelegenheit, es zu schaffen.
- **Keine Streak-Maschine.** Das Ritual am Planungstag trägt, nicht der Zähler.
- **Kein Ratgeber-Maskottchen.** Siehe Tonalität.

## Zielgruppe und Umfang des MVP

Welpe und Junghund, deutschsprachig (DACH), ein Pfad. Rund 40 Aktivitäten.
Ersthundehalter in den ersten Monaten haben akuten Leidensdruck, suchen aktiv
und zahlen — der erwachsene Hund hat kein Problem, sondern ein diffuses
schlechtes Gewissen und konvertiert schlechter.

Nicht im MVP: KI-Coach, Add-on-Module, Wetterlogik, erwachsener Hund,
zweite Sprache. Alles davon ist im Datenmodell vorgesehen (siehe
`datenmodell.md`, Abschnitt Backlog) und wird erst nach den ersten
100 zahlenden Kunden gebaut.

**Rasse statt Rassegruppe ist vorgezogen** (`docs/specs/rasse-modellieren.md`):
Eine eigene `breed`-Tabelle (ehemals `rasse`, seit der Umstellung auf
englische Tabellennamen) trägt die Rassegruppe, ein Hund kann mehrere
Rassen verknüpfen (Mischling, gewichtet). Echte, einzeln benannte Rassen
sind trotzdem noch nicht befüllt — nur neun Gruppen-Platzhalter — weil das
Fachwissen erfordert, keine Engineering-Arbeit. Die Scope-Grenze war
richtig, den Aufwand für 300 Rassen jetzt nicht zu treiben; die
Tabellenstruktur schon zu haben, kostet nichts und macht das Nachliefern
später zu reiner Dateneingabe.

## Die Wochenschleife

1. **Rückblick** — jede Einheit wurde schon täglich mit einem Tippen bewertet;
   am Planungstag wird nur zusammengefasst.
2. **Absicht** — eine Handvoll Chips („Leine", „Rückruf", „mehr Ruhe",
   „wenig Zeit", „Besuch", „weiß nicht") plus optionaler Freitext.
   *„Weiß nicht" muss eine gültige Antwort sein und eine gute Woche ergeben.*
3. **Plan** — deterministisch erzeugt, einmal, und dann gespeichert.
4. **Begründung** — zwei Sätze, warum die Periode so aussieht.

Die Periode hängt am `planungstag` des Haushalts (Vorgabe Sonntag, änderbar),
nicht am Kalender. Die erste Periode läuft bis zum nächsten Planungstag,
mindestens 5 und höchstens 10 Tage; ab der zweiten sind es 7.

## Produkthaltung

**Weniger statt mehr.** In der deutschen Hundeszene wird „auslasten" als
Dauerbespaßung missverstanden; viele Hunde sind überdreht, nicht
unterfordert. Eine App, die sagt „dein Hund braucht diese Woche weniger",
steht erkennbar gegen den Mainstream. Das ist die Differenzierung — nicht der
Übungsumfang.

Deshalb schlägt das Belastungsbudget die Nutzerabsicht: Ein überdrehter Hund
bekommt keine Trainingseinheit, egal was sich der Halter vorgenommen hat.
Das wird sich für manche Nutzer nach Bevormundung anfühlen. Es bleibt trotzdem
so.

## Tonalität

**Beschreiben, nicht anweisen.** Der Tagesrahmen erzählt, wie der Tag
aussieht; die eine Sache wird angeboten, nicht befohlen.

**Die App behauptet nur, was sie belegen kann:** was sie selbst geplant hat,
was abgehakt wurde, was der Nutzer gesagt hat. „Gestern war die lange Runde
dran, und du hast sie gemacht" ist gedeckt. „Gestern war viel los" nur dann,
wenn er es im Rückblick selbst gesagt hat — dafür gibt es
`wochenkontext.quelle`. Ohne dieses Feld erfindet der Textbaustein früher oder
später etwas, und das merkt der Nutzer sofort.

**Kein Logbuch.** Der Nutzer trägt nie etwas ein, damit die App rechnen kann.
Er drückt einen Knopf, weil er selbst etwas davon hat — „Heute ist zu viel"
leert den Tag, ohne Nachfrage. Dass die App daraus lernt, ist Nebeneffekt.

**Kein Vorwurf.** Wer drei Wochen nicht hineinschaut, bekommt beim
Zurückkommen weder den abgelaufenen Plan noch eine Ermahnung, sondern eine
frische, bewusst leichte Periode. Kommentarlos.

**Gustav spricht nicht.** Gustav ist der Hund auf dem Icon und in den
Illustrationen — das Gesicht des Produkts, nicht seine Stimme. Keine
Maskottchen-Sprechblasen, keine Ratschläge in seiner Rolle. Im Plan steht
immer der Name des echten Hundes.

## Geschäftsmodell

- **Ein Preis, alles drin.** 12,99 €/Monat oder 89,99 €/Jahr, jahresorientiert.
  Keine Stufen: „begrenzte Wochenplan-Anpassungen" bestrafen genau die
  Nutzer, die es ernst meinen.
- **Anker ist die Trainingsstunde**, nicht der Monatspreis. Eine Welpengruppe
  kostet 15–25 € pro Termin, eine Einzelstunde 60–90 €.
- **Der Plan wird vor der Paywall erzeugt und gezeigt** — personalisiert, mit
  dem Namen des Hundes. Der Nutzer zahlt für etwas Sichtbares, nicht für ein
  Versprechen.
- **Paywall-Position ist ein Remote-Config-Schalter.** Start weich (erste
  Periode frei, Paywall beim Erzeugen der zweiten), Umschalten auf hart
  (14 Tage Store-Trial direkt nach dem ersten Plan) bei etwa 50 Bewertungen
  und einem Schnitt über 4,3.
- **Rechengrundlage:** 5,50–6,50 € netto je Zahler nach Steuer und Store-Anteil.
  Für 8.000 € also 1.300–1.500 Kunden. Zwischenziel sind **100 zahlende
  Kunden** — die beweisen das Modell.
- **Keine bezahlten Anzeigen** zum Start; der LTV trägt sie nicht. Organisch
  plus Züchter, Welpengruppen, Hundeschulen, Tierärzte.

## Illustrationen

Einstrich-Tusche: Gustav, mit einer durchgehenden kalligraphischen Linie
gezeichnet. Rasse-uneindeutig von Natur aus, einfarbig über `currentColor`
(folgt dem Theme), als SVG wenige Kilobyte groß. Details und Regeln in
`assets/illustrationen/README.md`.

Nicht per KI erzeugbar — durchgehende Einzelstrich-Zeichnungen sind genau die
Disziplin, an der Bildmodelle scheitern. Rund 15–20 Grundposen von Hand,
daraus setzt sich der Rest zusammen.

## Offene Punkte

| Punkt | Status |
|---|---|
| Fachliches Review durch eine Trainerin | **blockierend**, bis Woche 6 nötig |
| Rechtliche Klärung: Positionierung, Haftung, Disclaimer | **blockierend** vor Außenauftritt |
| Wer zeichnet die Illustrationen | offen — Zeitposten im Content-Strang |
| Markenrecherche „Gustav" (DPMA Klassen 9 und 41), Domain, Store-Kollision | offen |
| Tonalität der Rahmentexte: Prinzip steht, Templates fehlen | offen |
| Die restlichen sieben Beispieltage | offen — dort zeigen sich Modelllücken |

## Risiken

- **Der Wettbewerb ist besetzt.** Der Planer-Ansatz ist die Antwort darauf,
  muss aber auch als solcher vermarktet werden.
- **Content ist der kritische Pfad**, nicht Code.
- **Fachliche Glaubwürdigkeit** ohne Trainerhintergrund, in einer besonders
  meinungsstarken Szene.
- **Haftung** bei Themen wie Angst, Aggression, Silvester, Anti-Giftköder.

**Das ehrliche Abbruchkriterium:** Wenn nach der Beta weniger als die Hälfte
der Tester den zweiten Check-in gemacht hat, trägt die Kernschleife nicht —
und dann hilft kein weiteres Feature.
