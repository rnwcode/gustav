# Texten (Planer, Schritt 8)

*Hinweis: Diese Spec bleibt Deutsch (CLAUDE.md, Abschnitt Sprache). Die
Codebeispiele nennen die tatsächlichen Bezeichner aus
`infra/supabase/functions/_shared/planner/` (TypeScript).*

## Warum

„Jede Ausgabe kennt ihren Grund. Jeder Slot trägt eine **maschinenlesbare**
Begründung. Ohne die ist der erklärende Satz nicht schreibbar"
(`docs/datenmodell.md`, Abschnitt „Fünf Entscheidungen"). Dieser Schritt
liefert genau diese maschinenlesbare `Reason` — **nicht** den fertigen
deutschen Satz. Der Satz selbst ist Template im MVP, LLM später
(`docs/datenmodell.md`, Schritt 8) und braucht Lokalisierung
(CLAUDE.md, Abschnitt Sprache); beides ist Sache der aufrufenden Schicht
(App oder ein späterer Formulierungs-Schritt), nicht dieser reinen
TypeScript-Funktion. `Activity.sentence` trägt bereits den vorformulierten
Kernsatz je Aktivität — diese Funktion entscheidet nur, *warum* diese
Aktivität an diesem Tag steht.

## Verhalten

Reine Funktion, kein Zeitzugriff.

```typescript
function buildSlots(args: {
  assignments: DayAssignment[];   // aus crossCheckPeriod, Schritt 7
  pool: ScoredActivity[];         // derselbe Pool wie bei assignToDays
  candidates: CandidatePool;      // aus collectCandidates, Schritt 3
}): Slot[]
```

`Slot` = `{date, activityId, reason, outcome: null}` — `outcome` ist zum
Erzeugungszeitpunkt immer `null`, es entsteht erst durch das spätere
Abhaken. Für jeden Eintrag in `assignments`:

1. **`activityId === null`** → `Reason {kind: 'empty', skillId: null,
   needDimension: null}`.
2. Sonst wird die Aktivität in `pool` nachgeschlagen. Trainiert sie einen
   Skill (`activity.trainsSkill !== null`), wird der passende `SkillFocus`
   in `candidates.skills` gesucht. In dieser Rangfolge zählt die **erste**
   zutreffende Regel:
   1. `focus.isNewSkill` → `Reason {kind: 'newSkill', skillId:
      focus.skillId, needDimension: null}`
   2. `focus.overdueDays > 0` → `Reason {kind: 'dueRefresher', skillId:
      focus.skillId, needDimension: null}`
   3. `focus.priority > 0` → `Reason {kind: 'priority', skillId:
      focus.skillId, needDimension: null}`
3. Trifft keine der drei Skill-Regeln zu (kein `trainsSkill`, kein
   passender `SkillFocus`, oder ein Focus ohne eines der drei Signale):
   deckt die Aktivität eine der in `candidates.needs` gelisteten
   Bedarfslücken (`needFor(activity.needs, dimension) > 0`)? Bei mehreren
   zutreffenden Dimensionen gewinnt die mit der größten `gap`, bei
   Gleichstand die zuerst genannte (`physical, mentalWork, scent, social,
   recovery`, dieselbe feste Reihenfolge wie in `collectCandidates`) →
   `Reason {kind: 'needGap', skillId: null, needDimension: dimension}`.
4. **Fallback**: keines der obigen Signale trifft zu — die Aktivität wurde
   von `assignToDays` gewählt, ohne dass sie fällig, priorisiert, neu oder
   bedarfsdeckend im obigen Sinn war (z. B. reine Beschäftigung ohne
   erfasste Bedarfslücke). `Reason {kind: 'recoveryNeed', skillId: null,
   needDimension: null}` — ein ehrlicher, generischer Grund („das war zu
   dem Zeitpunkt einfach dran"), keine erfundene Priorität oder Lücke. Ein
   eigener `ReasonKind` für „einfach am besten bewertet" existiert nicht;
   `recoveryNeed` ist der einzige Fallback-Wert von `ReasonKind`, der ohne
   Skill- oder Bedarfsbezug auskommt (siehe „Offene Fragen").

## Beispiele

`ZERO_NEEDS` deckt keine Dimension. `candidates` durchgehend:
`skills: [{skillId: 'recall', priority: 0, overdueDays: 0, isNewSkill:
false, levels: {0,0,0}, status: 'building'}]`,
`needs: [{dimension: 'scent', gap: 3}]`, sofern nicht anders angegeben.

1. **Leerer Tag.**
   `assignments = [{date: d1, activityId: null}]`. Ausgabe:
   `slots[0].reason = {kind: 'empty', skillId: null, needDimension:
   null}`.

2. **Neuer Skill.**
   Aktivität `intro` trainiert `recall`, `candidates.skills` enthält
   `{skillId: 'recall', isNewSkill: true, priority: 0, overdueDays: 0,
   …}`. Ausgabe: `{kind: 'newSkill', skillId: 'recall', needDimension:
   null}`.

3. **Fällige Auffrischung schlägt Priorität.**
   `candidates.skills = [{skillId: 'recall', overdueDays: 5, priority: 2,
   isNewSkill: false, …}]`. Ausgabe: `{kind: 'dueRefresher', skillId:
   'recall', needDimension: null}` — nicht `priority`, obwohl beide
   Signale vorliegen; „fällig" steht in der Rangfolge vor „priorisiert".

4. **Nur Priorität.**
   `candidates.skills = [{skillId: 'recall', overdueDays: 0, priority: 3,
   isNewSkill: false, …}]`. Ausgabe: `{kind: 'priority', skillId:
   'recall', needDimension: null}`.

5. **Bedarfsdeckung, kein Skill.**
   Aktivität `schnueffelteppich` (`trainsSkill: null`, `needs: {…,
   scent: 3}`). Ausgabe: `{kind: 'needGap', skillId: null,
   needDimension: 'scent'}`.

6. **Größte Lücke gewinnt.**
   `candidates.needs = [{dimension: 'scent', gap: 1}, {dimension:
   'social', gap: 4}]`, Aktivität deckt beide (`needs: {scent: 2, social:
   1, …}`). Ausgabe: `needDimension: 'social'` (`gap: 4 > 1`), obwohl die
   Aktivität `scent` stärker abdeckt (`2 > 1`) — die Begründung folgt der
   Lücke, nicht der Deckungsstärke.

7. **Fallback.**
   Aktivität `ruhetag` (`trainsSkill: null`, `needs: ZERO_NEEDS`).
   Ausgabe: `{kind: 'recoveryNeed', skillId: null, needDimension: null}`.

8. **Ein `SkillFocus` ohne eines der drei Signale fällt durch zu
   Bedarf/Fallback.**
   Aktivität trainiert `recall`, aber `candidates.skills` enthält für
   `recall` nur `{priority: 0, overdueDays: 0, isNewSkill: false, …}`
   (z. B. weil ein neuer Skill zwar im Rennen war, aber bereits an einem
   anderen Tag der Periode vergeben wurde und hier ein zweiter,
   generischer Kandidat lief — konstruiert für dieses Beispiel). Deckt
   die Aktivität zusätzlich `needs: {scent: 2}`: Ausgabe: `{kind:
   'needGap', skillId: null, needDimension: 'scent'}` — der Skill-Bezug
   geht hier bewusst verloren, da keines der drei Skill-Signale zutrifft.

## Nicht dazu gehört

- Der eigentliche deutsche Satz und der Rahmen („Heute wird's warm…") —
  Template im MVP, LLM später (`docs/datenmodell.md`), und in jedem Fall
  lokalisierbarer Text, kein TypeScript-Code (CLAUDE.md, Abschnitt
  Sprache). Diese Funktion liefert nur `Reason`, keine Prosa.
- `outcome` zu setzen — bei der Erzeugung immer `null`; wird erst durch
  das Abhaken befüllt.
- Die Auswahl der Aktivität selbst (Schritte 5–7) — diese Funktion
  begründet nur, was bereits feststeht.

## Offene Fragen

- Der Fallback (`recoveryNeed` ohne Skill- oder Bedarfsbezug) ist ein
  Zweckentfremden eines vorhandenen `ReasonKind`, kein eigens dafür
  gedachter Wert — es gibt keinen `ReasonKind.other` oder ähnliches. Ein
  eigener Wert wäre ehrlicher, aber solange Filtern und Scoren
  (`docs/specs/hart-filtern.md`, `docs/specs/scoren.md`) kaum Aktivitäten
  ohne jedes Signal in den Pool lassen, ist unklar, wie oft dieser Fall
  in der Praxis überhaupt auftritt. Zeigt der Simulator, dass er häufig
  ist, ist das ein Grund, `ReasonKind` um einen eigenen Wert zu erweitern
  — nicht, ihn jetzt ohne Beleg zu erfinden.
