import type { Activity } from '../models/activity.ts';
import type { Reason } from '../models/weekly_plan.ts';
import type { Weekday } from '../models/enums.ts';
import { weekdayOf } from '../time.ts';
import type { SimulationResult } from './run.ts';
import type { InvariantViolation } from './invariants.ts';

const WEEKDAY_LABEL: Readonly<Record<Weekday, string>> = {
  monday: 'Mo',
  tuesday: 'Di',
  wednesday: 'Mi',
  thursday: 'Do',
  friday: 'Fr',
  saturday: 'Sa',
  sunday: 'So',
};

function formatDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/** The machine-readable `Reason` as the short bracketed tag the sample output uses. */
export function formatReason(reason: Reason): string {
  switch (reason.kind) {
    case 'empty':
      return '';
    case 'newSkill':
      return `[neuer skill: ${reason.skillId}]`;
    case 'dueRefresher':
      return `[fällig: ${reason.skillId}]`;
    case 'priority':
      return `[prioritaet: ${reason.skillId}]`;
    case 'needGap':
      return `[bedarfsluecke: ${reason.needDimension}]`;
    case 'recoveryNeed':
      return `[erholung]`;
  }
}

/** Twelve weeks (or however many) as readable text — the default, narrative mode. */
export function formatNarrative(
  result: SimulationResult,
  activityById: ReadonlyMap<string, Activity>,
): string {
  const lines: string[] = [];
  lines.push(`Hund: ${result.scenarioName}   Profil: ${result.profileName}`);

  for (const period of result.periods) {
    lines.push('');
    lines.push(
      `── Periode ${period.periodIndex + 1} (${formatDate(period.plan.periodStart)} bis ${
        formatDate(period.plan.periodEnd)
      }, ${period.lifeStage}, Erholungsbedarf ${period.recoveryNeed}) ──`,
    );
    for (const slot of period.plan.slots) {
      const weekday = WEEKDAY_LABEL[weekdayOf(slot.date)];
      const activity = slot.activityId === null ? null : activityById.get(slot.activityId);
      const title = activity?.title ?? '—';
      const reason = formatReason(slot.reason);
      lines.push(`${weekday.padEnd(3)} ${title.padEnd(38)} ${reason}`.trimEnd());
    }
  }

  return lines.join('\n');
}

export function formatInvariantReport(violations: readonly InvariantViolation[]): string {
  if (violations.length === 0) return 'Invarianten: ok';
  const lines = [`Invarianten: ${violations.length} Verletzung(en)`];
  for (const v of violations) {
    lines.push(`  - [${v.rule}] ${v.detail}`);
  }
  return lines.join('\n');
}

const NEED_DIMENSIONS = ['physical', 'mentalWork', 'scent', 'social', 'recovery'] as const;

interface RunTotals {
  readonly slotsTotal: number;
  readonly training: number;
  readonly emptyDays: number;
  readonly needTotals: ReadonlyMap<string, number>;
}

function totals(
  result: SimulationResult,
  activityById: ReadonlyMap<string, Activity>,
): RunTotals {
  let slotsTotal = 0;
  let training = 0;
  let emptyDays = 0;
  const needTotals = new Map<string, number>(NEED_DIMENSIONS.map((d) => [d, 0]));

  for (const period of result.periods) {
    for (const slot of period.plan.slots) {
      slotsTotal++;
      if (slot.activityId === null) {
        emptyDays++;
        continue;
      }
      const activity = activityById.get(slot.activityId);
      if (activity === undefined) continue;
      if (activity.type === 'training') training++;
      for (const dimension of NEED_DIMENSIONS) {
        needTotals.set(dimension, (needTotals.get(dimension) ?? 0) + activity.needs[dimension]);
      }
    }
  }

  return { slotsTotal, training, emptyDays, needTotals };
}

/** Side-by-side comparison of two configs against the same dog/profile/seed (`--gegen`). */
export function formatComparison(args: {
  labelA: string;
  labelB: string;
  resultA: SimulationResult;
  resultB: SimulationResult;
  activityById: ReadonlyMap<string, Activity>;
  violationsA: readonly InvariantViolation[];
  violationsB: readonly InvariantViolation[];
}): string {
  const { labelA, labelB, resultA, resultB, activityById, violationsA, violationsB } = args;
  const lines: string[] = [];

  for (let i = 0; i < resultA.periods.length; i++) {
    const periodA = resultA.periods[i]!;
    const periodB = resultB.periods[i]!;
    lines.push('');
    lines.push(
      `── Woche ${i + 1} ────────────────  A: ${labelA}   B: ${labelB}`,
    );
    for (let d = 0; d < periodA.plan.slots.length; d++) {
      const slotA = periodA.plan.slots[d]!;
      const slotB = periodB.plan.slots[d]!;
      const weekday = WEEKDAY_LABEL[weekdayOf(slotA.date)];
      const titleA = slotA.activityId === null
        ? '—'
        : activityById.get(slotA.activityId)?.title ?? '—';
      const titleB = slotB.activityId === null
        ? '—'
        : activityById.get(slotB.activityId)?.title ?? '—';
      lines.push(
        `${weekday.padEnd(3)} A  ${titleA.padEnd(35)} ${formatReason(slotA.reason)}`.trimEnd(),
      );
      lines.push(`    B  ${titleB.padEnd(35)} ${formatReason(slotB.reason)}`.trimEnd());
    }
  }

  const totalsA = totals(resultA, activityById);
  const totalsB = totals(resultB, activityById);

  lines.push('');
  lines.push(`── Unterschiede über ${resultA.periods.length} Perioden ──────────────`);
  lines.push(`Slots gesamt        A ${totalsA.slotsTotal}    B ${totalsB.slotsTotal}`);
  lines.push(`davon Training      A ${totalsA.training}    B ${totalsB.training}`);
  lines.push(`leere Tage          A ${totalsA.emptyDays}    B ${totalsB.emptyDays}`);
  for (const dimension of NEED_DIMENSIONS) {
    lines.push(
      `Bedarf ${dimension.padEnd(12)} A ${totalsA.needTotals.get(dimension) ?? 0}    B ${
        totalsB.needTotals.get(dimension) ?? 0
      }`,
    );
  }
  lines.push(
    `Invarianten         A ${violationsA.length === 0 ? 'ok' : violationsA.length}    B ${
      violationsB.length === 0 ? 'ok' : violationsB.length
    }`,
  );

  return lines.join('\n');
}
