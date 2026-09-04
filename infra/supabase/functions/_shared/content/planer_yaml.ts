import type { LifeStage, NeedDimension, Restriction } from '../planner/models/enums.ts';
import type { PlannerConfig } from '../planner/plan_config.ts';
import {
  lifeStageFromGerman,
  needDimensionFromGerman,
  restrictionFromGerman,
} from './german_enums.ts';

interface RawPhaseYaml {
  readonly aktive_slots: number;
  readonly training: number;
}

interface RawPeriodenYaml {
  readonly laenge_tage: number;
  readonly erste_periode_min_tage: number;
  readonly leere_slots_min: number;
  readonly leere_slots_bei_erholungsbedarf_hoch: number;
}

interface RawErholungsbedarfYaml {
  readonly mittel_ab_quote: number;
  readonly hoch_ab_quote: number;
}

interface RawBelastungsregelnYaml {
  readonly nie_zwei_tage_in_folge_belastung: number;
  readonly nach_belastung_ab: number;
  readonly eingewoehnung_wochen: number;
  readonly eingewoehnung_max_ablenkung: number;
  readonly eingewoehnung_max_belastung: number;
}

interface RawGewichteYaml {
  readonly prioritaet: number;
  readonly ueberfaelligkeit: number;
  readonly ueberfaelligkeit_deckel: number;
  readonly bedarfsluecke: number;
  readonly neuer_skill: number;
  readonly eignung_rassegruppe: number;
  readonly belastung_bei_erholungsbedarf: number;
  readonly kuerzlich_gemacht: number;
}

/** The shape of `content/planer.yaml`, per `content/schema/planer.yaml`. */
interface RawPlanerYaml {
  readonly version: number;
  readonly perioden: RawPeriodenYaml;
  readonly phasen: Readonly<Record<string, RawPhaseYaml>>;
  readonly belastbarkeit_pro_tag: Readonly<Record<string, number>>;
  readonly einschraenkung_deckel: Readonly<Record<string, number>>;
  readonly erholungsbedarf: RawErholungsbedarfYaml;
  readonly gewichte: RawGewichteYaml;
  readonly kuerzlich_gemacht_tage: number;
  readonly bedarf_ziel: Readonly<Record<string, number>>;
  readonly belastungsregeln: RawBelastungsregelnYaml;
}

/**
 * Maps the already YAML-parsed `content/planer.yaml` document onto
 * `PlannerConfig`. `restrictionArousalCeiling` is deliberately empty: the
 * content schema has no key for it yet — see `docs/specs/hart-filtern.md`,
 * „Offene Fragen". Adding one is a `tool/` content-schema decision, not
 * this loader's to make (CLAUDE.md, rule 6).
 */
export function parsePlanerConfigYaml(raw: unknown): PlannerConfig {
  const yaml = raw as RawPlanerYaml;

  const maxActiveSlotsByLifeStage = new Map<LifeStage, number>();
  const maxTrainingSlotsByLifeStage = new Map<LifeStage, number>();
  for (const [key, phase] of Object.entries(yaml.phasen)) {
    const lifeStage = lifeStageFromGerman(key);
    maxActiveSlotsByLifeStage.set(lifeStage, phase.aktive_slots);
    maxTrainingSlotsByLifeStage.set(lifeStage, phase.training);
  }

  const capacityPerDay = new Map<LifeStage, number>();
  for (const [key, value] of Object.entries(yaml.belastbarkeit_pro_tag)) {
    capacityPerDay.set(lifeStageFromGerman(key), value);
  }

  const restrictionCap = new Map<Restriction, number>();
  for (const [key, value] of Object.entries(yaml.einschraenkung_deckel)) {
    restrictionCap.set(restrictionFromGerman(key), value);
  }

  const needTargets = new Map<NeedDimension, number>();
  for (const [key, value] of Object.entries(yaml.bedarf_ziel)) {
    needTargets.set(needDimensionFromGerman(key), value);
  }

  return {
    version: yaml.version,
    loadBudget: {
      capacityPerDay,
      restrictionCap,
      recoveryNeedMediumFrom: yaml.erholungsbedarf.mittel_ab_quote,
      recoveryNeedHighFrom: yaml.erholungsbedarf.hoch_ab_quote,
    },
    period: {
      regularLengthDays: yaml.perioden.laenge_tage,
      firstPeriodMinDays: yaml.perioden.erste_periode_min_tage,
      minEmptySlots: yaml.perioden.leere_slots_min,
      minEmptySlotsAtHighRecoveryNeed: yaml.perioden.leere_slots_bei_erholungsbedarf_hoch,
      maxActiveSlotsByLifeStage,
      maxTrainingSlotsByLifeStage,
    },
    candidates: { needTargets },
    activityFilter: {
      settlingInWeeks: yaml.belastungsregeln.eingewoehnung_wochen,
      settlingInMaxArousal: yaml.belastungsregeln.eingewoehnung_max_belastung,
      settlingInMaxDistraction: yaml.belastungsregeln.eingewoehnung_max_ablenkung,
      restrictionArousalCeiling: new Map(),
    },
    scoring: {
      priorityWeight: yaml.gewichte.prioritaet,
      overdueWeight: yaml.gewichte.ueberfaelligkeit,
      overdueCap: yaml.gewichte.ueberfaelligkeit_deckel,
      needGapWeight: yaml.gewichte.bedarfsluecke,
      newSkillWeight: yaml.gewichte.neuer_skill,
      suitabilityWeight: yaml.gewichte.eignung_rassegruppe,
      arousalAtRecoveryNeedWeight: yaml.gewichte.belastung_bei_erholungsbedarf,
      recentlyDoneWeight: yaml.gewichte.kuerzlich_gemacht,
      recentlyDoneDays: yaml.kuerzlich_gemacht_tage,
    },
    assignment: {
      heavyArousalThreshold: yaml.belastungsregeln.nach_belastung_ab,
      maxArousalThreshold: yaml.belastungsregeln.nie_zwei_tage_in_folge_belastung,
    },
  };
}
