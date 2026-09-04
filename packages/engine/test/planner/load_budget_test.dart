import 'package:engine/engine.dart';
import 'package:test/test.dart';

// Fixtures from docs/specs/belastungsbudget.md. Examples 1-4 use the real
// values from content/planer.yaml; example 5 uses deliberately simple
// numbers to isolate the boundary behavior.
void main() {
  const realConfig = LoadBudgetConfig(
    capacityPerDay: {
      LifeStage.puppy: 1.0,
      LifeStage.adolescent: 1.6,
      LifeStage.puberty: 1.8,
      LifeStage.adult: 2.0,
      LifeStage.senior: 1.4,
    },
    restrictionCap: {
      Restriction.recovery: 0.6,
      Restriction.protectiveCare: 1.0
    },
    recoveryNeedMediumFrom: 0.7,
    recoveryNeedHighFrom: 1.0,
  );

  test('normally loaded adult dog has no elevated recovery need', () {
    final result = evaluateLoadBudget(
      loadOverLastSevenDays: [1, 1, 1, 1, 1, 1, 3],
      lifeStage: LifeStage.adult,
      restrictions: const {},
      config: realConfig,
    );

    expect(result.quote, closeTo(0.643, 0.001));
    expect(result.recoveryNeed, RecoveryNeed.none);
  });

  test('medium recovery need', () {
    final result = evaluateLoadBudget(
      loadOverLastSevenDays: [2, 1, 1, 2, 1, 1, 2],
      lifeStage: LifeStage.adult,
      restrictions: const {},
      config: realConfig,
    );

    expect(result.quote, closeTo(0.714, 0.001));
    expect(result.recoveryNeed, RecoveryNeed.medium);
  });

  test('fully loaded means high recovery need', () {
    final result = evaluateLoadBudget(
      loadOverLastSevenDays: [2, 2, 2, 2, 2, 2, 2],
      lifeStage: LifeStage.adult,
      restrictions: const {},
      config: realConfig,
    );

    expect(result.quote, 1.0);
    expect(result.recoveryNeed, RecoveryNeed.high);
  });

  test('a restriction lowers capacity and thus the recovery-need class', () {
    final result = evaluateLoadBudget(
      loadOverLastSevenDays: [1, 0, 1, 0, 1, 0, 0],
      lifeStage: LifeStage.adult,
      restrictions: const {Restriction.recovery},
      config: realConfig,
    );

    expect(result.quote, closeTo(0.714, 0.001));
    expect(result.recoveryNeed, RecoveryNeed.medium);

    final withoutRestriction = evaluateLoadBudget(
      loadOverLastSevenDays: [1, 0, 1, 0, 1, 0, 0],
      lifeStage: LifeStage.adult,
      restrictions: const {},
      config: realConfig,
    );
    expect(withoutRestriction.quote, closeTo(0.214, 0.001));
    expect(withoutRestriction.recoveryNeed, RecoveryNeed.none);
  });

  test('thresholds are inclusive at the boundary', () {
    const config = LoadBudgetConfig(
      capacityPerDay: {LifeStage.adult: 2.0},
      restrictionCap: {},
      recoveryNeedMediumFrom: 0.5,
      recoveryNeedHighFrom: 1.0,
    );

    final result = evaluateLoadBudget(
      loadOverLastSevenDays: [1, 1, 1, 1, 1, 1, 1],
      lifeStage: LifeStage.adult,
      restrictions: const {},
      config: config,
    );

    expect(result.quote, 0.5);
    expect(result.recoveryNeed, RecoveryNeed.medium);
  });
}
