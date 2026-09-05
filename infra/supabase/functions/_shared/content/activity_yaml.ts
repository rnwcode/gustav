import type { Activity } from '../planner/models/activity.ts';
import type { BreedGroup } from '../planner/models/enums.ts';
import {
  activityTypeFromGerman,
  breedGroupFromGerman,
  locationFromGerman,
} from './german_enums.ts';

interface RawTroubleshootingYaml {
  readonly problem: string;
  readonly antwort: string;
}

interface RawBedarfYaml {
  readonly koerperlich: number;
  readonly kopfarbeit: number;
  readonly nase: number;
  readonly sozial: number;
  readonly erholung: number;
}

/** The shape of one `content/aktivitaeten/*.yaml` file, per `content/schema/aktivitaet.yaml`. */
interface RawActivityYaml {
  readonly id: string;
  readonly titel: string;
  readonly satz: string;
  readonly typ: string;
  readonly trainiert_skill: string | null;
  readonly bedarf: RawBedarfYaml;
  readonly belastung: number;
  readonly dauer_min: number;
  readonly dauer_max: number;
  readonly ort: string;
  readonly fuer_ablenkung: readonly [number, number] | null;
  readonly ist_auffrischung: boolean;
  readonly hitzetauglich: boolean;
  readonly regentauglich: boolean;
  readonly dunkeltauglich: boolean;
  readonly gelenkbelastend: boolean;
  readonly saisonfenster: readonly number[] | null;
  readonly equipment: readonly string[];
  readonly zweite_person: boolean;
  readonly min_alter_wochen: number;
  readonly max_alter_wochen: number | null;
  readonly eignung: Readonly<Record<string, number>>;
  readonly varianzgruppe: string;
  readonly sperrfrist_tage: number;
  readonly illustration: string | null;
  readonly anleitung: readonly string[];
  readonly erfolgskriterium: string;
  readonly haeufige_fehler: readonly string[];
  readonly troubleshooting: readonly RawTroubleshootingYaml[];
}

/** Maps one already YAML-parsed activity document onto `Activity`. */
export function parseActivityYaml(raw: unknown): Activity {
  const yaml = raw as RawActivityYaml;

  const suitability = new Map<BreedGroup, number>();
  for (const [key, value] of Object.entries(yaml.eignung)) {
    suitability.set(breedGroupFromGerman(key), value);
  }

  return {
    id: yaml.id,
    title: yaml.titel,
    sentence: yaml.satz.trim(),
    type: activityTypeFromGerman(yaml.typ),
    trainsSkill: yaml.trainiert_skill ?? null,
    needs: {
      physical: yaml.bedarf.koerperlich,
      mentalWork: yaml.bedarf.kopfarbeit,
      scent: yaml.bedarf.nase,
      social: yaml.bedarf.sozial,
      recovery: yaml.bedarf.erholung,
    },
    arousal: yaml.belastung,
    durationMin: yaml.dauer_min,
    durationMax: yaml.dauer_max,
    location: locationFromGerman(yaml.ort),
    forDistraction: yaml.fuer_ablenkung ?? null,
    isRefresher: yaml.ist_auffrischung,
    heatSuitable: yaml.hitzetauglich,
    rainSuitable: yaml.regentauglich,
    darknessSuitable: yaml.dunkeltauglich,
    jointStraining: yaml.gelenkbelastend,
    seasonalWindow: yaml.saisonfenster ?? null,
    equipment: yaml.equipment,
    secondPerson: yaml.zweite_person,
    minAgeWeeks: yaml.min_alter_wochen,
    maxAgeWeeks: yaml.max_alter_wochen ?? null,
    suitability,
    varianceGroup: yaml.varianzgruppe,
    cooldownDays: yaml.sperrfrist_tage,
    illustration: yaml.illustration ?? null,
    instructions: yaml.anleitung,
    successCriterion: yaml.erfolgskriterium.trim(),
    commonMistakes: yaml.haeufige_fehler,
    troubleshooting: yaml.troubleshooting.map((entry) => ({
      problem: entry.problem.trim(),
      answer: entry.antwort.trim(),
    })),
  };
}
