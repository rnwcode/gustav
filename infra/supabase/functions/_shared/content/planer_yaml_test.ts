import { assertEquals } from '../planner/dev_deps.ts';
import type {
  LifeStage,
  NeedDimension,
  Restriction,
  SkillStatus,
} from '../planner/models/enums.ts';
import { parsePlanerConfigYaml, parseStateMachineConfigYaml } from './planer_yaml.ts';

// Mirrors the real content/planer.yaml.
const raw = {
  version: 1,
  perioden: {
    laenge_tage: 7,
    erste_periode_min_tage: 5,
    erste_periode_max_tage: 10,
    leere_slots_min: 1,
    leere_slots_bei_erholungsbedarf_hoch: 2,
  },
  phasen: {
    welpe: { aktive_slots: 4, training: 2 },
    junghund: { aktive_slots: 5, training: 3 },
    pubertaet: { aktive_slots: 6, training: 4 },
    erwachsen: { aktive_slots: 6, training: 4 },
    senior: { aktive_slots: 5, training: 3 },
  },
  belastbarkeit_pro_tag: {
    welpe: 1.0,
    junghund: 1.6,
    pubertaet: 1.8,
    erwachsen: 2.0,
    senior: 1.4,
  },
  einschraenkung_deckel: {
    rekonvaleszenz: 0.6,
    schonung: 1.0,
  },
  erholungsbedarf: { mittel_ab_quote: 0.7, hoch_ab_quote: 1.0 },
  spaced_repetition: {
    faktor_bei_erfolg: 1.8,
    aufbau: { start: 1, deckel: 4 },
    generalisierung: { start: 3, deckel: 14 },
    gefestigt: { start: 10, deckel: 45 },
    erhaltung: { start: 45, deckel: 90 },
  },
  stufen: {
    erhoehen_nach_erfolgen: 3,
    senken_nach_misserfolgen: 2,
    reihenfolge: ['dauer', 'distanz', 'ablenkung'],
    generalisierung_ab_ablenkung: 2,
  },
  gewichte: {
    prioritaet: 3.0,
    ueberfaelligkeit: 2.0,
    ueberfaelligkeit_deckel: 3.0,
    bedarfsluecke: 2.0,
    neuer_skill: 1.0,
    eignung_rassegruppe: 1.0,
    belastung_bei_erholungsbedarf: -3.0,
    kuerzlich_gemacht: -2.0,
  },
  kuerzlich_gemacht_tage: 10,
  bedarf_ziel: {
    koerperlich: 6,
    kopfarbeit: 6,
    nase: 5,
    sozial: 3,
    erholung: 6,
  },
  belastungsregeln: {
    nie_zwei_tage_in_folge_belastung: 3,
    nach_belastung_ab: 2,
    eingewoehnung_wochen: 6,
    eingewoehnung_max_ablenkung: 1,
    eingewoehnung_max_belastung: 2,
  },
};

Deno.test('parses content/planer.yaml into PlannerConfig', () => {
  const config = parsePlanerConfigYaml(raw);

  assertEquals(config.version, 1);

  assertEquals(config.loadBudget, {
    capacityPerDay: new Map<LifeStage, number>([
      ['puppy', 1.0],
      ['adolescent', 1.6],
      ['puberty', 1.8],
      ['adult', 2.0],
      ['senior', 1.4],
    ]),
    restrictionCap: new Map<Restriction, number>([
      ['recovery', 0.6],
      ['protectiveCare', 1.0],
    ]),
    recoveryNeedMediumFrom: 0.7,
    recoveryNeedHighFrom: 1.0,
  });

  assertEquals(config.period, {
    regularLengthDays: 7,
    firstPeriodMinDays: 5,
    minEmptySlots: 1,
    minEmptySlotsAtHighRecoveryNeed: 2,
    maxActiveSlotsByLifeStage: new Map<LifeStage, number>([
      ['puppy', 4],
      ['adolescent', 5],
      ['puberty', 6],
      ['adult', 6],
      ['senior', 5],
    ]),
    maxTrainingSlotsByLifeStage: new Map<LifeStage, number>([
      ['puppy', 2],
      ['adolescent', 3],
      ['puberty', 4],
      ['adult', 4],
      ['senior', 3],
    ]),
  });

  assertEquals(
    config.candidates.needTargets,
    new Map<NeedDimension, number>([
      ['physical', 6],
      ['mentalWork', 6],
      ['scent', 5],
      ['social', 3],
      ['recovery', 6],
    ]),
  );

  assertEquals(config.activityFilter, {
    settlingInWeeks: 6,
    settlingInMaxArousal: 2,
    settlingInMaxDistraction: 1,
    restrictionArousalCeiling: new Map(),
  });

  assertEquals(config.scoring, {
    priorityWeight: 3.0,
    overdueWeight: 2.0,
    overdueCap: 3.0,
    needGapWeight: 2.0,
    newSkillWeight: 1.0,
    suitabilityWeight: 1.0,
    arousalAtRecoveryNeedWeight: -3.0,
    recentlyDoneWeight: -2.0,
    recentlyDoneDays: 10,
  });

  assertEquals(config.assignment, {
    heavyArousalThreshold: 2,
    maxArousalThreshold: 3,
  });
});

Deno.test('parses content/planer.yaml into StateMachineConfig', () => {
  const config = parseStateMachineConfigYaml(raw);

  assertEquals(config.increaseAfterSuccesses, 3);
  assertEquals(config.decreaseAfterFailures, 2);
  assertEquals(config.order, ['duration', 'distance', 'distraction']);
  assertEquals(config.generalizeAtDistraction, 2);
  assertEquals(config.successFactor, 1.8);

  assertEquals(
    config.intervals,
    new Map<SkillStatus, { start: number; cap: number }>([
      ['building', { start: 1, cap: 4 }],
      ['generalizing', { start: 3, cap: 14 }],
      ['consolidated', { start: 10, cap: 45 }],
      ['maintenance', { start: 45, cap: 90 }],
    ]),
  );
});
