// Spielt einen synthetischen Halter über mehrere Perioden durch und druckt
// jede Periode als Text. Das wichtigste Entwurfswerkzeug des Projekts.
//
// ── Aufruf ──────────────────────────────────────────────────────────────────
//
//   deno run --allow-read infra/supabase/functions/_shared/planner/simulate.ts \
//       --hund welpe11 --profil unregelmaessig --wochen 12
//   deno run --allow-read infra/supabase/functions/_shared/planner/simulate.ts --check
//   deno run --allow-read infra/supabase/functions/_shared/planner/simulate.ts \
//       --hund junghund43 \
//       --konfig content/planer.yaml \
//       --gegen  content/varianten/mehr-ruhe.yaml
//
// ── Optionen ────────────────────────────────────────────────────────────────
//
//   --hund      Szenario aus fixtures/scenarios.ts (welpe11, junghund43, ausgelastet,
//               erwachsen-gefestigt, schonzeit — Vorgabe welpe11)
//   --profil    fleissig | unregelmaessig | gibt_auf (Vorgabe fleissig)
//   --wochen    Anzahl Perioden (Vorgabe 12)
//   --konfig    Pfad zur Planerkonfiguration (Vorgabe content/planer.yaml)
//   --gegen     zweite Konfiguration — druckt beide Läufe nebeneinander
//   --check     nur Invarianten, 20 synthetische Hunde, keine Textausgabe
//   --seed      Startwert für die Bewertungswürfel (Vorgabe 42, deterministisch)
//
// ── Wichtig: Konfiguration ist ein Parameter, Katalog ist eine Fixture ─────────
//
// Der Simulator LÄDT content/planer.yaml und reicht sie in plan() hinein — er
// importiert sie nicht (CLAUDE.md, Regel 10). Nur dadurch lassen sich zwei
// Konfigurationsstände gegeneinander laufen lassen (--gegen).
//
// Skills/Aktivitäten kommen dagegen aus fixtures/ (FIXTURE_SKILLS,
// FIXTURE_ACTIVITIES), nicht aus content/skills|aktivitaeten/: der echte
// Katalog hat aktuell nur eine Handvoll Einträge (Trainerarbeit, noch nicht
// geschrieben, siehe fixtures/README.md) und würde jede Simulation trivial
// leer laufen lassen.
//
// ── Invarianten, die --check prüft (siehe simulate/invariants.ts) ──────────────
//
//   - jede Periode hat mindestens einen leeren Tag
//   - kein Skill bleibt länger als 45 Tage unberührt
//   - keine Varianzgruppe wiederholt sich innerhalb ihrer Sperrfrist
//   - jede Bedarfsdimension wird über zwei Perioden mindestens einmal gedeckt
//   - nach einem Tag mit Belastung ≥ 3 folgt kein Trainingstag (innerhalb einer Periode)
//   - die Obergrenzen der Lebensphase werden nie überschritten
//
// Exit-Code 0 bei grün, 1 bei verletzter Invariante. Wird von der CI aufgerufen.

import { loadPlannerConfig, loadStateMachineConfig } from '../content/loader.ts';
import type { PlannerConfig } from './plan_config.ts';
import { FIXTURE_ACTIVITIES } from './fixtures/activities.ts';
import { FIXTURE_SKILLS } from './fixtures/skills.ts';
import { FIXTURE_SCENARIOS } from './fixtures/scenarios.ts';
import type { FixtureScenario } from './fixtures/scenarios.ts';
import { seededRng } from './simulate/rng.ts';
import { PROFILES } from './simulate/profiles.ts';
import { simulate } from './simulate/run.ts';
import { checkInvariants } from './simulate/invariants.ts';
import type { InvariantViolation } from './simulate/invariants.ts';
import { formatComparison, formatInvariantReport, formatNarrative } from './simulate/format.ts';

const DEFAULT_PLANER_YAML = new URL('../../../../../content/planer.yaml', import.meta.url);
const DEFAULT_SCENARIO_SLUG = 'welpe11';
const DEFAULT_PROFILE = 'fleissig';
const DEFAULT_WEEKS = 12;
const DEFAULT_SEED = 42;
const CHECK_PERIODS = 8;

// Four `today` weekdays against the fixtures' `planningDay: sunday`
// (docs/specs/slots-festlegen.md): steady state, Mittwochsstart,
// Samstagsstart, and the documented Donnerstags-overshoot edge case.
const CHECK_STARTS: readonly Date[] = [
  new Date('2026-03-16T00:00:00.000Z'), // Monday
  new Date('2026-03-11T00:00:00.000Z'), // Wednesday
  new Date('2026-03-14T00:00:00.000Z'), // Saturday
  new Date('2026-03-12T00:00:00.000Z'), // Thursday
];

interface CliArgs {
  readonly hund: string;
  readonly profil: string;
  readonly wochen: number;
  readonly konfig: string | null;
  readonly gegen: string | null;
  readonly check: boolean;
  readonly seed: number;
}

function parseArgs(argv: readonly string[]): CliArgs {
  const values = new Map<string, string>();
  let check = false;
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--check') {
      check = true;
      continue;
    }
    if (arg?.startsWith('--')) {
      const key = arg.slice(2);
      const value = argv[i + 1];
      if (value === undefined) throw new Error(`--${key} braucht einen Wert`);
      values.set(key, value);
      i++;
    }
  }

  return {
    hund: values.get('hund') ?? DEFAULT_SCENARIO_SLUG,
    profil: values.get('profil') ?? DEFAULT_PROFILE,
    wochen: Number(values.get('wochen') ?? DEFAULT_WEEKS),
    konfig: values.get('konfig') ?? null,
    gegen: values.get('gegen') ?? null,
    check,
    seed: Number(values.get('seed') ?? DEFAULT_SEED),
  };
}

function findScenario(slug: string): FixtureScenario {
  const scenario = FIXTURE_SCENARIOS.find((s) => s.slug === slug);
  if (scenario === undefined) {
    const available = FIXTURE_SCENARIOS.map((s) => s.slug).join(', ');
    throw new Error(`Unbekannter Hund "${slug}". Verfügbar: ${available}`);
  }
  return scenario;
}

function findProfile(name: string) {
  const profile = PROFILES[name];
  if (profile === undefined) {
    throw new Error(`Unbekanntes Profil "${name}". Verfügbar: ${Object.keys(PROFILES).join(', ')}`);
  }
  return profile;
}

function labelFor(path: string | URL, config: PlannerConfig): string {
  const raw = path instanceof URL ? path.pathname : path;
  const base = raw.split('/').pop() ?? raw;
  return `${base} v${config.version}`;
}

async function runNarrativeOrComparison(args: CliArgs): Promise<void> {
  const scenario = findScenario(args.hund);
  const profile = findProfile(args.profil);
  const konfigPath = args.konfig ?? DEFAULT_PLANER_YAML;

  const plannerConfig = await loadPlannerConfig(konfigPath);
  const stateMachineConfig = await loadStateMachineConfig(konfigPath);
  const activityById = new Map(FIXTURE_ACTIVITIES.map((a) => [a.id, a]));

  const resultA = simulate({
    scenario,
    skillCatalog: FIXTURE_SKILLS,
    activityCatalog: FIXTURE_ACTIVITIES,
    plannerConfig,
    stateMachineConfig,
    profile,
    periods: args.wochen,
    rng: seededRng(args.seed),
  });

  if (args.gegen === null) {
    console.log(formatNarrative(resultA, activityById));
    return;
  }

  const gegenConfig = await loadPlannerConfig(args.gegen);
  const gegenStateMachineConfig = await loadStateMachineConfig(args.gegen);
  const resultB = simulate({
    scenario,
    skillCatalog: FIXTURE_SKILLS,
    activityCatalog: FIXTURE_ACTIVITIES,
    plannerConfig: gegenConfig,
    stateMachineConfig: gegenStateMachineConfig,
    profile,
    periods: args.wochen,
    rng: seededRng(args.seed),
  });

  const violationsA = checkInvariants({
    result: resultA,
    skillCatalog: FIXTURE_SKILLS,
    activityCatalog: FIXTURE_ACTIVITIES,
  });
  const violationsB = checkInvariants({
    result: resultB,
    skillCatalog: FIXTURE_SKILLS,
    activityCatalog: FIXTURE_ACTIVITIES,
  });

  console.log(
    formatComparison({
      labelA: labelFor(konfigPath, plannerConfig),
      labelB: labelFor(args.gegen, gegenConfig),
      resultA,
      resultB,
      activityById,
      violationsA,
      violationsB,
    }),
  );
}

/** Twenty synthetic dogs: every fixture scenario against every check-mode start weekday. */
async function runCheck(seed: number): Promise<void> {
  const plannerConfig = await loadPlannerConfig(DEFAULT_PLANER_YAML);
  const stateMachineConfig = await loadStateMachineConfig(DEFAULT_PLANER_YAML);
  const profile = findProfile(DEFAULT_PROFILE);

  const allViolations: InvariantViolation[] = [];
  let dogCount = 0;

  for (const scenario of FIXTURE_SCENARIOS) {
    for (const today of CHECK_STARTS) {
      dogCount++;
      const variant: FixtureScenario = { ...scenario, today };
      const result = simulate({
        scenario: variant,
        skillCatalog: FIXTURE_SKILLS,
        activityCatalog: FIXTURE_ACTIVITIES,
        plannerConfig,
        stateMachineConfig,
        profile,
        periods: CHECK_PERIODS,
        rng: seededRng(seed),
      });
      const violations = checkInvariants({
        result,
        skillCatalog: FIXTURE_SKILLS,
        activityCatalog: FIXTURE_ACTIVITIES,
      });
      for (const v of violations) {
        allViolations.push({
          rule: v.rule,
          detail: `[${scenario.slug} @ ${today.toISOString().slice(0, 10)}] ${v.detail}`,
        });
      }
    }
  }

  console.log(`Geprüft: ${dogCount} synthetische Hunde über ${CHECK_PERIODS} Perioden.`);
  console.log(formatInvariantReport(allViolations));

  if (allViolations.length > 0) Deno.exit(1);
}

async function main(): Promise<void> {
  const args = parseArgs(Deno.args);
  if (args.check) {
    await runCheck(args.seed);
    return;
  }
  await runNarrativeOrComparison(args);
}

if (import.meta.main) {
  await main();
}
