import { assertEquals } from '../_shared/planner/dev_deps.ts';
import type { Activity, Needs } from '../_shared/planner/models/activity.ts';
import { resolveDailyLoads, resolveLastUsed, resolveNeedCoverage } from './history.ts';

const ZERO_NEEDS: Needs = { physical: 0, mentalWork: 0, scent: 0, social: 0, recovery: 0 };

function activity(
  overrides: { id: string; arousal?: number; needs?: Needs; varianceGroup?: string },
): Activity {
  return {
    id: overrides.id,
    title: overrides.id,
    sentence: 'sentence',
    type: 'enrichment',
    trainsSkill: null,
    needs: overrides.needs ?? ZERO_NEEDS,
    arousal: overrides.arousal ?? 1,
    durationMin: 5,
    durationMax: 10,
    location: 'any',
    forDistraction: null,
    isRefresher: false,
    heatSuitable: true,
    rainSuitable: true,
    darknessSuitable: true,
    jointStraining: false,
    seasonalWindow: null,
    equipment: [],
    secondPerson: false,
    minAgeWeeks: 8,
    maxAgeWeeks: null,
    suitability: new Map(),
    varianceGroup: overrides.varianceGroup ?? overrides.id,
    cooldownDays: 10,
    illustration: null,
    instructions: [],
    successCriterion: 'criterion',
    commonMistakes: [],
    troubleshooting: [],
  };
}

const today = new Date('2026-03-16T00:00:00.000Z');
const activityById = new Map([['a', activity({ id: 'a', arousal: 2 })]]);

Deno.test('resolveDailyLoads only counts succeeded/partial, zero elsewhere', () => {
  const loads = resolveDailyLoads({
    pastSlots: [
      { datum: '2026-03-15', aktivitaet_id: 'a', ergebnis: 'klappte' },
      { datum: '2026-03-14', aktivitaet_id: 'a', ergebnis: 'noch_nicht' },
      { datum: '2026-03-13', aktivitaet_id: null, ergebnis: null },
    ],
    activityById,
    today,
  });

  // 7 entries, oldest first: 03-09 .. 03-15
  assertEquals(loads.length, 7);
  assertEquals(loads[loads.length - 1], 2); // 03-15, succeeded, arousal 2
  assertEquals(loads[loads.length - 2], 0); // 03-14, notYet -> 0
  assertEquals(loads[loads.length - 3], 0); // 03-13, empty day
});

Deno.test('resolveNeedCoverage sums Needs for counted slots only', () => {
  const scentActivity = activity({ id: 'sniff', needs: { ...ZERO_NEEDS, scent: 3 } });
  const coverage = resolveNeedCoverage({
    previousPeriodSlots: [
      { datum: '2026-03-10', aktivitaet_id: 'sniff', ergebnis: 'klappte' },
      { datum: '2026-03-11', aktivitaet_id: 'sniff', ergebnis: 'uebersprungen' },
    ],
    activityById: new Map([['sniff', scentActivity]]),
  });

  assertEquals(coverage.get('scent'), 3);
});

Deno.test('resolveLastUsed takes the most recent date per activity and variance group, any outcome', () => {
  const a = activity({ id: 'a', varianceGroup: 'grp' });
  const { lastUsedByActivityId, lastUsedByVarianceGroup } = resolveLastUsed({
    allSlots: [
      { datum: '2026-03-01', aktivitaet_id: 'a', ergebnis: 'uebersprungen' },
      { datum: '2026-03-10', aktivitaet_id: 'a', ergebnis: null },
    ],
    activityById: new Map([['a', a]]),
  });

  assertEquals(lastUsedByActivityId.get('a'), new Date('2026-03-10'));
  assertEquals(lastUsedByVarianceGroup.get('grp'), new Date('2026-03-10'));
});
