import '../domain/weekly_plan.dart';

/// UI-only descriptions of why a day looks the way it does — describing,
/// not instructing (CLAUDE.md, Tonalität).
const reasonKindLabels = {
  ReasonKind.empty: 'Bewusst frei',
  ReasonKind.newSkill: 'Neuer Skill',
  ReasonKind.due: 'Fällig zur Wiederholung',
  ReasonKind.priority: 'Aus dem Check-in',
  ReasonKind.needGap: 'Bedarfslücke',
  ReasonKind.recoveryNeeded: 'Erholung',
};
