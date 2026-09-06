# Datenmodell

Abgeleitet aus den Sätzen, die die App sagen können soll — nicht abstrakt
entworfen. Wer ein Feld hinzufügen will, muss den Satz nennen, der ohne dieses
Feld nicht schreibbar wäre. Wer ein Feld findet, das in keinem Satz vorkommt,
löscht es.

## Fünf Entscheidungen, aus denen alles folgt

1. **Ein Skill ist kein Skalar.** Hunde generalisieren schlecht: „Sitz" im
   Wohnzimmer und „Sitz" mit Radfahrer sind für den Hund zwei verschiedene
   Dinge. Der Zustand wird pro Skill × Schwierigkeit geführt, nicht als
   Level 3 von 5. Wer das als Skalar modelliert, baut das zentrale Prinzip von
   Hundetraining aus dem Produkt heraus.
2. **Zwei Währungen.** Der Planer bilanziert Skill-Fortschritt *und*
   Bedarfsdeckung. In der Welpenphase dominiert die erste, später die zweite —
   die Wochenschleife bleibt identisch, nur der Pool verschiebt sich. Deshalb
   trägt dasselbe Modell später den erwachsenen Hund.
3. **Ein Slot pro Tag**, der leer sein darf. Der Planer verteilt intern alles,
   gibt aber pro Tag genau eine Sache aus. Sieben Entscheidungen pro Periode
   statt zwanzig — jede muss sitzen.
4. **Belastung ist eine Bilanz**, kein Häkchen. Rollierendes Budget über
   Erregung und Anstrengung, gespeist aus dem, was die App selbst geplant hat
   und was abgehakt wurde.
5. **Der Plan ist deterministisch.** Auswahl, Reihenfolge und Fälligkeit sind
   Code und testbar. LLMs übersetzen Freitext hinein und formulieren Text
   heraus — sie entscheiden nie, was trainiert wird.

Dazu: **jede Ausgabe kennt ihren Grund.** Jeder Slot trägt eine
maschinenlesbare Begründung. Ohne die ist der erklärende Satz nicht schreibbar,
und ohne den Satz fühlt sich der Plan wie eine Anweisung an.

## Beispieltage — die Herleitung

### Mittwoch, Junghund 9 Monate
> Heute wird's warm. Geh früh oder spät — mittags ist der Asphalt nichts für
> Pfoten. Deine eine Sache: fünf Minuten Leinenführigkeit im Schatten, kurze
> Strecke reicht völlig.

Setzt voraus: `wetter.hitze_stufe` (aus Prognose + PLZ, nicht GPS),
`hund.hitzeempfindlichkeit` (aus Rassegruppe, Körperbau, Alter, Gewicht),
`aktivitaet.{ort, dauer_min, hitzetauglich}`, `slot.begruendung`.

### Donnerstag, nach einem vollen Tag
> Gestern war die lange Runde dran, und du hast sie gemacht. Heute darf weniger
> passieren — kurze Runde, viel schnüffeln lassen. Deine eine Sache: nichts.
> Das ist die Übung.

Setzt voraus: `belastungsbudget` (rollierend über 7 Tage), `slot.ergebnis`
(was geplant war und was abgehakt wurde), `slot.aktivitaet = null` als
gültiges Ergebnis.

*Wichtig:* Der Satz nennt bewusst nur, was die App selbst geplant hat. „Gestern
war viel los" wäre nur zulässig, wenn der Nutzer es im Rückblick gesagt hat.

### Samstag, Generalisierung
> Sitz klappt inzwischen sicher im Wohnzimmer. Heute einmal draußen an der
> Straße probieren — wenn jemand vorbeigeht und es nicht klappt, ist das kein
> Rückschritt, sondern genau der Test.

Setzt voraus: `skillstand.stufen.ablenkung`, `skillstand.status`,
`aktivitaet.erfolgskriterium`.

### Montag, Auffrischung von allein
> Rückruf hattest du zuletzt vor zwei Wochen, und da lief er gut. Heute nur
> einmal kurz abrufen, wenn er ohnehin bei dir ist — mehr braucht es nicht,
> damit es drin bleibt.

Setzt voraus: `skillstand.{faellig_am, intervall_tage}`, `skillstand.historie`,
`aktivitaet.ist_auffrischung`.

### Dienstag, wenig Zeit angesagt
> Du hattest gesagt, diese Woche wird eng. Heute steht nichts an, was
> Vorbereitung braucht. Wenn zwischendurch zwei Minuten übrig sind: Handtouch
> in der Küche, das geht im Vorbeigehen.

Setzt voraus: `wochenkontext.constraints`, `aktivitaet.{equipment,
zweite_person}`, `wochenkontext.quelle` (nur bei `chip` oder `freitext` darf
„du hattest gesagt" fallen).

> **Die restlichen sieben Beispieltage fehlen noch.** Sie zu schreiben ist der
> nächste Schritt am Modell — bei den ersten fünf tauchten dabei
> `einzugsdatum` und `wochenkontext.quelle` auf, die abstrakt nie modelliert
> worden wären.

## Inhalt und Zustand sind getrennte Welten

**Inhalt** (`content/`): Skills, Aktivitäten, Planerkonfiguration. Für alle
Nutzer gleich, als YAML in Git, validiert und per Seed-Script nach Postgres.
Damit lässt sich KI-Tooling voll nutzen, es gibt Versionierung und Review, und
Übungen ändern sich ohne App-Release.

**Zustand** (Supabase): Hund, Haushalt, Skill-Stände, Perioden, Slots,
Check-ins. Gehört einem Nutzer, RLS-geschützt; die App cached eine
schreibgeschützte Kopie lokal für Ansicht und Abhaken offline (CLAUDE.md,
Regel 9) — Quelle der Wahrheit bleibt Supabase.

Der Planer selbst ist eine reine TypeScript-Funktion (Supabase Edge
Function, Deno) ohne eigenen Netzwerkzugriff nach außen — deshalb testbar,
trotz serverseitiger Ausführung.

## Hund und Haushalt

```
# hund
id                    uuid
name                  text
geburtsdatum          date        # → alter_wochen, treibt die Welpenphase
einzugsdatum          date        # 3 Jahre alt, seit 2 Wochen da = wie ein Welpe
herkunft              enum züchter | tierschutz | privat | unbekannt
groessenklasse        enum klein | mittel | gross
koerperbau[]          enum brachyzephal | dichte_unterwolle | langbeinig
einschraenkungen[]    enum schonung | gelenke | senior | rekonvaleszenz
geschlecht            enum ruede | huendin | null   # null = nicht angegeben
kastriert             bool | null                   # null = nicht angegeben

# rasse — für alle Hunde gleich, kein Nutzerzustand (docs/specs/rasse-modellieren.md)
id                    text
name                  text
rassegruppe           enum hüte | jagd | begleit | herdenschutz | terrier
                           | wind | nordisch | molosser | misch

# hund_rasse — Verknüpfung, mehrere Zeilen pro Hund bei einem Mischling
hund_id               uuid
rasse_id              text
gewichtung            numeric?    # null = gleichmäßig verteilt auf alle
                                  # Rassen dieses Hundes, kein Pflegeaufwand
                                  # im Normalfall

# abgeleitet, nicht gespeichert
hitzeempfindlichkeit  0–3   # brachyzephal +2, dichte Unterwolle +1,
                            # gross +1, welpe/senior +1, gedeckelt bei 3
lebensphase           enum welpe (<16 W) | junghund (<30) | pubertaet (<70)
                           | erwachsen | senior (gross ab 312 W, mittel 364,
                             klein 416)

# haushalt
plz                   text?       # optional, nur für Wetter — kein GPS
wohnsituation         enum wohnung | haus_garten
umgebung              enum stadt | vorort | land
erfahrung             enum ersthund | erfahren
zeitbudget_werktag    minuten     # realistisch gefragt, nicht ambitioniert
zeitbudget_wochenende minuten
trainingstage[]       enum mo…so
planungstag           enum mo…so  # Vorgabe so — Schichtdienst
personen              int         # mehrere Trainierende = Konsistenzproblem
equipment[]           text
```

**Rassegruppe statt Rasse:** Neun Gruppen decken den Nutzen von 300 Rassen zu
einem Bruchteil des Aufwands. Die Gruppe **filtert nie hart**, sie gewichtet
nur — sonst baut man Vorurteile ins Produkt ein. Einzige harte Verwendung ist
Sicherheit: brachyzephale Hunde bei Hitze.

**Rasse statt Rassegruppe direkt am Hund** (vorgezogen aus dem Backlog, siehe
`produkt.md`, Abschnitt „Zielgruppe und Umfang des MVP", und
`docs/specs/rasse-modellieren.md`): Die Rassegruppe hängt jetzt an einer
eigenen `rasse`-Zeile, nicht mehr direkt am Hund — ein Mischling kann über
`hund_rasse` mehrere Rassen verknüpfen, gewichtet. `groessenklasse` und
`koerperbau` bleiben am Hund: sie werden unabhängig von der Rassegruppe
direkt vom Halter angegeben, sind also Eigenschaften des einzelnen Tieres,
keine Rasseeigenschaften. Echte, einzeln benannte Rassen (statt nur der
neun Gruppen) sind noch nicht befüllt — das ist Fachwissen über korrekte
Gruppen-Zuordnung, keine Engineering-Arbeit.

## Skills und die drei D

Schwierigkeit ist dreidimensional — **Dauer, Distanz, Ablenkung**. Das ist das
gängige Handwerksprinzip, mit einer Regel, die direkt in den Planer wandert:
*immer nur ein D gleichzeitig erhöhen, und wenn eins steigt, gehen die anderen
einen Schritt zurück.*

| Stufe | Ablenkung | Konkret |
|---|---|---|
| 0 | keine | Wohnzimmer, nichts los, Hund entspannt |
| 1 | minimal | Wohnung mit Alltagsgeräuschen, eigener Garten |
| 2 | gering | bekannte ruhige Strecke, niemand in Sicht |
| 3 | alltäglich | Gehweg, Passanten in Entfernung, Autos |
| 4 | hoch | anderer Hund, Radfahrer, Spielplatz, Wildgeruch |
| 5 | Ernstfall | unerwartet, nah, schnell — der eigentliche Zweck |

Skill-Schema siehe `content/schema/skill.yaml`.

## Skill-Zustand pro Hund

```
hund_id            uuid
skill_id           text
status             enum nicht_begonnen | aufbau | generalisierung
                        | gefestigt | erhaltung | ruht
stufen             { dauer: 0–5, distanz: 0–5, ablenkung: 0–5 }
historie[]         { datum, ergebnis, stufen }   # letzte 10 genügen
letzte_uebung_am   date
faellig_am         date
intervall_tage     int
```

### Zustandsübergänge

| Auslöser | Wirkung |
|---|---|
| 3× „klappte" auf der Stufe | ein D erhöhen (Reihenfolge Dauer → Distanz → Ablenkung), die anderen beiden je −1 |
| 2× „noch nicht" in Folge | aktives D um 1 zurück; bei Stufe 0 Status auf `aufbau` |
| „so halb" | Stufe bleibt, Intervall bleibt — Wiederholung ohne Bewertungsdruck |
| Ablenkung ≥ 2 sicher | `aufbau` → `generalisierung` |
| Zielstufen erreicht | → `gefestigt`, danach automatisch `erhaltung` |
| Nutzer meldet Problem im Check-in | `erhaltung` → `generalisierung`, Stufe −1 |

### Intervalle (Spaced Repetition)

Bei „klappte" wird das Intervall mit `faktor_bei_erfolg` multipliziert und am
Deckel gekappt; bei „noch nicht" fällt es auf den Startwert zurück; bei
„so halb" bleibt es. Werte stehen in `content/planer.yaml`.

Bewusst grob: Es geht nicht um Vokabeln, sondern darum, dass nichts wochenlang
liegen bleibt.

## Aktivität

Die Einheit, die der Planer verteilt: Trainingseinheit, Suchspiel,
Alltagsroutine, Ruhevorschlag. **Nicht jede trainiert einen Skill** — genau
deshalb trägt dasselbe Modell später den erwachsenen Hund, bei dem die Frage
nicht mehr „was muss er können" lautet, sondern „wie beschäftige ich ihn".

Vollständiges Schema mit allen Feldern: `content/schema/aktivitaet.yaml`.
Ausgeschriebenes Beispiel: `content/aktivitaeten/schnueffelteppich_einfuehrung.yaml`.

**Sperrfrist gilt nicht für alles.** Die 14-Tage-Regel gegen Monotonie ist für
Beschäftigung und Trickvarianten richtig, für Grundsignale falsch — die
brauchen Wiederholung. Deshalb hängt die Sperrfrist an der **Varianzgruppe**,
nicht an der Aktivität, und Kernskills sind ausgenommen.

## Check-in und Belastungsbudget

```
# wochen_checkin
rueckblick[]       { slot_id, ergebnis }
                   ergebnis: klappte | so_halb | noch_nicht
                           | uebersprungen | nicht_geschafft
freitext_rueckblick text?
absicht_chips[]    leinen | rueckruf | ruhe | alleinbleiben | besuch
                   | wenig_zeit | urlaub | mehr_kopfarbeit | weiss_nicht
freitext_absicht   text?
tage_verfuegbar[]  enum mo…so
rueckblick_chips[] viel_los | krank | reise | tierarzt | alles_ruhig
                   # optional, im Planungstag-Screen — nie täglich abgefragt

# wochenkontext — abgeleitet; das Ergebnis des LLM-Übersetzers
prioritaeten[]     { skill_id | thema, gewicht 0–3 }
constraints        { tage[], minuten_pro_tag, orte[] }
flags[]            radfahrer | hitze | schonung | ueberdreht | …
quelle             enum chip | freitext | default
                   # entscheidet, ob die App „du hattest gesagt" sagen darf
```

### Das Budget speist sich ohne Logbuch

| Signal | Herkunft | Kosten für den Nutzer |
|---|---|---|
| geplant + abgehakt | eigener Plan, `slot.ergebnis` | der Tipp, der ohnehin passiert |
| nicht abgehakt | Ausbleiben des Tipps | keine — die Nicht-Handlung ist das Signal |
| Rückblick-Chips | Planungstag-Screen | optional, im vorhandenen Screen |
| „Heute ist zu viel" | Tagesansicht | Entlastungsknopf, keine Abfrage |

Drei übersprungene Tage in Folge sagen der App nicht, *warum* die Woche voll
war — aber dass sie es war, und das genügt, um leiser zu werden.

Quote = Summe der Belastung über 7 Tage / 7 / `belastbarkeit_pro_tag`.
Schwellen in `content/planer.yaml`.

## Der Planer

Reine Funktion: Zustand rein, Wochenplan raus. Kein Netzwerk, keine
ungeseedeten Zufallszahlen, kein LLM. Alle Parameter kommen aus
`content/planer.yaml` und werden **hineingereicht, nicht importiert**
(CLAUDE.md, Regel 10).

```
1  Kontext bauen
   Hund, Haushalt, Wochenkontext, Belastungsbudget, Saison,
   später Wetterprognose

2  Slots festlegen
   Periodenlänge: bis zum nächsten planungstag, min 5, max 10 — danach 7
   verfügbare Tage × 1 Slot
   mindestens 1 bewusst leerer Slot; bei erholungsbedarf hoch: 2
   Obergrenzen je Lebensphase (aktive Slots, Trainingseinheiten)

3  Kandidaten sammeln
   a) fällige Auffrischungen        (faellig_am ≤ Periodenende)
   b) Prioritäten aus dem Check-in  (Skill auf aktueller Stufe)
   c) Bedarfslücken der Vorperiode  (welche Dimension kam zu kurz)
   d) neue Skills                   (Voraussetzungen + Alter erfüllt)

4  Hart filtern
   Alter · Voraussetzungen · Equipment · zweite Person
   Einschränkungen (Schonung schließt Belastung ≥ 2 aus)
   Sperrfrist der Varianzgruppe · Ort · Saisonfenster
   Eingewöhnung (< 6 Wochen im Haushalt: max Ablenkung 1)
   Sicherheit (Hitze × Hitzeempfindlichkeit)
   bei typ=training: fuer_ablenkung muss die aktuelle Stufe enthalten
   gefestigt/erhaltung → nur ist_auffrischung

5  Scoren   (Gewichte aus content/planer.yaml)
   score =  w_prioritaet   · prioritaet
          + w_faellig      · min(ueberfaellig_tage / 7, deckel)
          + w_bedarf       · bedarfsluecke
          + w_neu          · ist_neuer_skill
          + w_eignung      · Σ eignung[rassegruppe] · anteil[rassegruppe]
                             (eine Rasse: anteil = 1; Mischling: Anteile
                             summieren sich zu 1, `hund_rasse.gewichtung`)
          − w_belastung    · belastung      (nur bei erholungsbedarf ≥ mittel)
          − w_kuerzlich    · kuerzlich_gemacht
   Tie-Break deterministisch über die Aktivitäts-ID.

6  Zuweisen, Tag für Tag
   nie zwei Tage in Folge mit maximaler Belastung
   nach einem Tag mit Belastung ≥ 2 folgt typ = ruhe oder beschaeftigung
   anspruchsvolle Einheiten nicht auf den kürzesten Tag
   Trainingseinheit nur auf Tagen aus trainingstage[]
   Dauer ≤ Zeitbudget des Tages

7  Periode gegenprüfen
   alle fünf Bedarfsdimensionen mindestens einmal berührt?
   Trainingsobergrenze der Lebensphase eingehalten?
   mindestens ein leerer Slot vorhanden?
   sonst: schwächsten Slot tauschen, ab Schritt 6 wiederholen (max 1 Durchlauf)

8  Texten
   Rahmen und Begründung je Slot aus strukturierten Daten
   Template im MVP, LLM später — die Auswahl steht da längst fest
```

**Täglich, nicht periodisch:** Prognosen über sieben Tage sind unzuverlässig.
Ein leichter Tageslauf passt den Rahmen an, ohne den Plan umzuwerfen: bei
Hitze oder Dauerregen wird gegen eine gleichwertige Aktivität mit anderem
`ort` getauscht (gleiche Absicht, gleicher Skill), sonst ändert sich nur der
Satz. Das ergibt nebenbei einen zweiten täglichen Kontaktpunkt, der nach
Service klingt statt nach Erinnerung.

**Ein Plan wird einmal erzeugt und gespeichert**, mit `algorithmus_version`
und `konfig_version` daneben — nie bei jedem Öffnen neu gerechnet.

## Test-Fixtures

Diese fünf entstehen, bevor die erste UI existiert. Besteht der Planer sie,
ist das Produkt im Kern fertig.

1. **Welpe, Periode 1.** 11 Wochen, kein Rückblick, Ersthund, 20 min werktags,
   Einzug vor 10 Tagen. Erwartung: höchstens zwei Trainingsslots, nichts über
   Ablenkung 1, mindestens zwei leere Tage.
2. **Junghund in der Pubertät.** 10 Monate, Rückruf 3× „noch nicht", Chip
   „Leine". Erwartung: Rückruf fällt eine Stufe zurück und wird auf Ablenkung 1
   wiederholt statt fallengelassen; Leinenarbeit bekommt zwei Slots.
3. **Volle Periode.** Belastungsbudget hoch, Chip „wenig Zeit". Erwartung: kein
   Slot mit maximaler Belastung, mindestens drei leere oder Ruhe-Slots, keine
   neuen Skills.
4. **Erwachsener Hund, alles gefestigt.** 4 Jahre, Chip „mehr Kopfarbeit".
   Erwartung: Beschäftigung plus zwei Auffrischungen aus `erhaltung`; keine
   Aktivität aus den letzten 10 Tagen.
5. **Schonzeit.** `rekonvaleszenz` nach OP. Erwartung: keine Aktivität mit
   Belastung ≥ 2, Nasen- und Kopfarbeit dominieren, Rahmen erklärt warum.

Dazu drei aus der Periodenlogik: **Mittwochsstart** (5 Tage),
**Samstagsstart** (9 Tage), **Wiedereinstieg** nach drei Wochen Pause — der
letzte ist der Fall, in dem eine App normalerweise unangenehm wird.

## Backlog — im Schema vorgesehen, nicht gebaut

| Wann | Was |
|---|---|
| V1.1 | Wetterprognose über PLZ (Open-Meteo oder offene DWD-Daten, Lizenz prüfen) |
| V1.1 | Saison- und Regionalwissen ohne API: Dunkelheit im Herbst, Brut- und Setzzeit März–Juli, Streusalz, Grannen, Zecken |
| V1.2 | LLM-Übersetzer für den Freitext → `wochenkontext` |
| V1.2 | „Ich hab noch Zeit" — Zusatzvorschlag auf Abruf |
| V2 | Add-on-Module, die sich in den Plan einweben; Silvester als Saisongeschäft |
| V2 | Erwachsenen- und Seniorenpool; Wiedereinstiegspunkte Pubertät, Zweithund, Umzug, Schonzeit |
| V2 | Zweiter Mensch im Haushalt, Mehrhundehaushalt, Züchter- und Hundeschul-Codes |
| offen | KI-Coach als Chat — erst mit Nutzungsdaten, striktem Scope und Eskalation an Trainer oder Tierarzt |
