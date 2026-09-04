import 'package:engine/engine.dart';
import 'package:test/test.dart';

// Fixtures aus docs/specs/skill-zustandsautomat.md: Skill „rueckruf",
// Werte aus content/planer.yaml.
void main() {
  const zielstufen = Stufen(dauer: 1, distanz: 3, ablenkung: 4);

  const konfig = ZustandsautomatKonfig(
    erhoehenNachErfolgen: 3,
    senkenNachMisserfolgen: 2,
    reihenfolge: [Dimension.dauer, Dimension.distanz, Dimension.ablenkung],
    generalisierungAbAblenkung: 2,
    faktorBeiErfolg: 1.8,
    intervalle: {
      SkillStatus.aufbau: IntervallKonfig(start: 1, deckel: 4),
      SkillStatus.generalisierung: IntervallKonfig(start: 3, deckel: 14),
      SkillStatus.gefestigt: IntervallKonfig(start: 10, deckel: 45),
      SkillStatus.erhaltung: IntervallKonfig(start: 45, deckel: 90),
    },
  );

  List<HistorienEintrag> historieMit(
          int anzahl, Ergebnis ergebnis, Stufen stufen) =>
      List.generate(
        anzahl,
        (_) => HistorienEintrag(
            datum: DateTime(2026, 3, 1), ergebnis: ergebnis, stufen: stufen),
      );

  test('3x klappte erhoeht die aktive Dimension, senkt nur die unfertige', () {
    const stufen = Stufen(dauer: 1, distanz: 1, ablenkung: 1);
    final stand = SkillStand(
      hundId: 'hund1',
      skillId: 'rueckruf',
      status: SkillStatus.aufbau,
      stufen: stufen,
      historie: historieMit(2, Ergebnis.klappte, stufen),
      intervallTage: 2,
    );

    final neu = wende(
      stand: stand,
      zielstufen: zielstufen,
      ergebnis: Ergebnis.klappte,
      datum: DateTime(2026, 3, 10),
      konfig: konfig,
    );

    expect(neu.stufen, const Stufen(dauer: 1, distanz: 2, ablenkung: 0));
    expect(neu.status, SkillStatus.aufbau);
    expect(neu.intervallTage, 4);
    expect(neu.letzteUebungAm, DateTime(2026, 3, 10));
    expect(neu.faelligAm, DateTime(2026, 3, 14));
    expect(neu.historie.last.ergebnis, Ergebnis.klappte);
    expect(neu.historie.last.stufen, stufen);
  });

  test(
      '2x noch nicht in Folge senkt die aktive Dimension, bei 0 zurueck auf aufbau',
      () {
    const stufen = Stufen(dauer: 1, distanz: 3, ablenkung: 1);
    final stand = SkillStand(
      hundId: 'hund1',
      skillId: 'rueckruf',
      status: SkillStatus.generalisierung,
      stufen: stufen,
      historie: historieMit(1, Ergebnis.nochNicht, stufen),
      intervallTage: 3,
    );

    final neu = wende(
      stand: stand,
      zielstufen: zielstufen,
      ergebnis: Ergebnis.nochNicht,
      datum: DateTime(2026, 3, 10),
      konfig: konfig,
    );

    expect(neu.stufen, const Stufen(dauer: 1, distanz: 3, ablenkung: 0));
    expect(neu.status, SkillStatus.aufbau);
    expect(neu.intervallTage, 1);
    expect(neu.faelligAm, DateTime(2026, 3, 11));
  });

  test('so halb aendert weder Stufen noch Intervall', () {
    const stufen = Stufen(dauer: 0, distanz: 0, ablenkung: 0);
    final stand = SkillStand(
      hundId: 'hund1',
      skillId: 'rueckruf',
      status: SkillStatus.aufbau,
      stufen: stufen,
      intervallTage: 1,
    );

    final neu = wende(
      stand: stand,
      zielstufen: zielstufen,
      ergebnis: Ergebnis.soHalb,
      datum: DateTime(2026, 3, 10),
      konfig: konfig,
    );

    expect(neu.stufen, stufen);
    expect(neu.status, SkillStatus.aufbau);
    expect(neu.intervallTage, 1);
    expect(neu.letzteUebungAm, DateTime(2026, 3, 10));
    expect(neu.faelligAm, DateTime(2026, 3, 11));
  });

  test('Ablenkung erreicht die Generalisierungsschwelle', () {
    const stufen = Stufen(dauer: 1, distanz: 3, ablenkung: 1);
    final stand = SkillStand(
      hundId: 'hund1',
      skillId: 'rueckruf',
      status: SkillStatus.aufbau,
      stufen: stufen,
      historie: historieMit(2, Ergebnis.klappte, stufen),
      intervallTage: 1,
    );

    final neu = wende(
      stand: stand,
      zielstufen: zielstufen,
      ergebnis: Ergebnis.klappte,
      datum: DateTime(2026, 3, 10),
      konfig: konfig,
    );

    expect(neu.stufen, const Stufen(dauer: 1, distanz: 3, ablenkung: 2));
    expect(neu.status, SkillStatus.generalisierung);
    expect(neu.intervallTage, 2);
  });

  test('Zielstufen erreicht fuehrt zu gefestigt', () {
    const stufen = Stufen(dauer: 1, distanz: 3, ablenkung: 3);
    final stand = SkillStand(
      hundId: 'hund1',
      skillId: 'rueckruf',
      status: SkillStatus.generalisierung,
      stufen: stufen,
      historie: historieMit(2, Ergebnis.klappte, stufen),
      intervallTage: 10,
    );

    final neu = wende(
      stand: stand,
      zielstufen: zielstufen,
      ergebnis: Ergebnis.klappte,
      datum: DateTime(2026, 3, 10),
      konfig: konfig,
    );

    expect(neu.stufen, zielstufen);
    expect(neu.status, SkillStatus.gefestigt);
    expect(neu.intervallTage, 18);
  });

  test('meldeProblem wirft erhaltung auf generalisierung zurueck', () {
    final stand = SkillStand(
      hundId: 'hund1',
      skillId: 'rueckruf',
      status: SkillStatus.erhaltung,
      stufen: zielstufen,
      intervallTage: 45,
    );

    final neu =
        meldeProblem(stand: stand, zielstufen: zielstufen, konfig: konfig);

    expect(neu.stufen, const Stufen(dauer: 1, distanz: 3, ablenkung: 3));
    expect(neu.status, SkillStatus.generalisierung);
    expect(neu.intervallTage, 3);
  });

  test('historie behaelt nur die letzten zehn Eintraege', () {
    const stufen = Stufen(dauer: 0, distanz: 0, ablenkung: 0);
    final stand = SkillStand(
      hundId: 'hund1',
      skillId: 'rueckruf',
      status: SkillStatus.aufbau,
      stufen: stufen,
      historie: historieMit(10, Ergebnis.soHalb, stufen),
      intervallTage: 1,
    );

    final neu = wende(
      stand: stand,
      zielstufen: zielstufen,
      ergebnis: Ergebnis.soHalb,
      datum: DateTime(2026, 3, 10),
      konfig: konfig,
    );

    expect(neu.historie.length, 10);
  });
}
