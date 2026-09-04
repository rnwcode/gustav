import { assertAlmostEquals, assertEquals } from '../dev_deps.ts';
import type { LoadBudgetConfig } from './load_budget_config.ts';
import { evaluateLoadBudget } from './load_budget.ts';

// Fixtures from docs/specs/belastungsbudget.md. Examples 1-4 use the real
// values from content/planer.yaml; example 5 uses deliberately simple
// numbers to isolate the boundary behavior.

const realConfig: LoadBudgetConfig = {
  capacityPerDay: new Map([
    ['puppy', 1.0],
    ['adolescent', 1.6],
    ['puberty', 1.8],
    ['adult', 2.0],
    ['senior', 1.4],
  ]),
  restrictionCap: new Map([
    ['recovery', 0.6],
    ['protectiveCare', 1.0],
  ]),
  recoveryNeedMediumFrom: 0.7,
  recoveryNeedHighFrom: 1.0,
};

Deno.test('normally loaded adult dog has no elevated recovery need', () => {
  const result = evaluateLoadBudget({
    loadOverLastSevenDays: [1, 1, 1, 1, 1, 1, 3],
    lifeStage: 'adult',
    restrictions: new Set(),
    config: realConfig,
  });

  assertAlmostEquals(result.quote, 0.643, 0.001);
  assertEquals(result.recoveryNeed, 'none');
});

Deno.test('medium recovery need', () => {
  const result = evaluateLoadBudget({
    loadOverLastSevenDays: [2, 1, 1, 2, 1, 1, 2],
    lifeStage: 'adult',
    restrictions: new Set(),
    config: realConfig,
  });

  assertAlmostEquals(result.quote, 0.714, 0.001);
  assertEquals(result.recoveryNeed, 'medium');
});

Deno.test('fully loaded means high recovery need', () => {
  const result = evaluateLoadBudget({
    loadOverLastSevenDays: [2, 2, 2, 2, 2, 2, 2],
    lifeStage: 'adult',
    restrictions: new Set(),
    config: realConfig,
  });

  assertEquals(result.quote, 1.0);
  assertEquals(result.recoveryNeed, 'high');
});

Deno.test('a restriction lowers capacity and thus the recovery-need class', () => {
  const result = evaluateLoadBudget({
    loadOverLastSevenDays: [1, 0, 1, 0, 1, 0, 0],
    lifeStage: 'adult',
    restrictions: new Set(['recovery']),
    config: realConfig,
  });

  assertAlmostEquals(result.quote, 0.714, 0.001);
  assertEquals(result.recoveryNeed, 'medium');

  const withoutRestriction = evaluateLoadBudget({
    loadOverLastSevenDays: [1, 0, 1, 0, 1, 0, 0],
    lifeStage: 'adult',
    restrictions: new Set(),
    config: realConfig,
  });
  assertAlmostEquals(withoutRestriction.quote, 0.214, 0.001);
  assertEquals(withoutRestriction.recoveryNeed, 'none');
});

Deno.test('thresholds are inclusive at the boundary', () => {
  const config: LoadBudgetConfig = {
    capacityPerDay: new Map([['adult', 2.0]]),
    restrictionCap: new Map(),
    recoveryNeedMediumFrom: 0.5,
    recoveryNeedHighFrom: 1.0,
  };

  const result = evaluateLoadBudget({
    loadOverLastSevenDays: [1, 1, 1, 1, 1, 1, 1],
    lifeStage: 'adult',
    restrictions: new Set(),
    config,
  });

  assertEquals(result.quote, 0.5);
  assertEquals(result.recoveryNeed, 'medium');
});
