import type { Activity } from '../_shared/planner/models/activity.ts';
import { needFor } from '../_shared/planner/models/activity.ts';
import type { NeedDimension } from '../_shared/planner/models/enums.ts';
import { addDays } from '../_shared/planner/time.ts';
import { toDateString } from './rows.ts';

/** One past `slot` row — only the columns the history resolution needs. */
export interface PastSlotRow {
  readonly date: string;
  readonly activity_id: string | null;
  readonly outcome: string | null;
}

const ALL_NEED_DIMENSIONS: readonly NeedDimension[] = [
  'physical',
  'mentalWork',
  'scent',
  'social',
  'recovery',
];

/**
 * A slot only "counts" toward load/need coverage on `succeeded`/`partial`
 * (`docs/datenmodell.md`, table „Das Budget speist sich ohne Logbuch";
 * matches `docs/specs/belastungsbudget.md`, „Nicht dazu gehört").
 */
function isCounted(outcome: string | null): boolean {
  return outcome === 'succeeded' || outcome === 'partial';
}

/** Resolves `loadOverLastSevenDays` (step 1 input) from past slot rows. */
export function resolveDailyLoads(args: {
  pastSlots: readonly PastSlotRow[];
  activityById: ReadonlyMap<string, Activity>;
  today: Date;
}): number[] {
  const { pastSlots, activityById, today } = args;
  const loadByDate = new Map<string, number>();
  for (const row of pastSlots) {
    if (row.activity_id === null) continue;
    const activity = activityById.get(row.activity_id);
    if (activity === undefined) continue;
    loadByDate.set(row.date, isCounted(row.outcome) ? activity.arousal : 0);
  }

  const loads: number[] = [];
  for (let i = 7; i >= 1; i--) {
    loads.push(loadByDate.get(toDateString(addDays(today, -i))) ?? 0);
  }
  return loads;
}

/** Resolves `needCoverageLastPeriod` (step 3 input) from the previous period's slot rows. */
export function resolveNeedCoverage(args: {
  previousPeriodSlots: readonly PastSlotRow[];
  activityById: ReadonlyMap<string, Activity>;
}): Map<NeedDimension, number> {
  const coverage = new Map<NeedDimension, number>();
  for (const row of args.previousPeriodSlots) {
    if (row.activity_id === null || !isCounted(row.outcome)) continue;
    const activity = args.activityById.get(row.activity_id);
    if (activity === undefined) continue;
    for (const dimension of ALL_NEED_DIMENSIONS) {
      const contribution = needFor(activity.needs, dimension);
      if (contribution > 0) {
        coverage.set(dimension, (coverage.get(dimension) ?? 0) + contribution);
      }
    }
  }
  return coverage;
}

/**
 * Resolves `lastUsedByVarianceGroup`/`lastUsedByActivityId` (step 4/5
 * inputs) from every past slot row, regardless of period or outcome — the
 * cooldown is about repetition, not achievement (`docs/specs/hart-
 * filtern.md`).
 */
export function resolveLastUsed(args: {
  allSlots: readonly PastSlotRow[];
  activityById: ReadonlyMap<string, Activity>;
}): {
  lastUsedByVarianceGroup: Map<string, Date>;
  lastUsedByActivityId: Map<string, Date>;
} {
  const lastUsedByVarianceGroup = new Map<string, Date>();
  const lastUsedByActivityId = new Map<string, Date>();

  for (const row of args.allSlots) {
    if (row.activity_id === null) continue;
    const activity = args.activityById.get(row.activity_id);
    if (activity === undefined) continue;
    const date = new Date(row.date);

    const previousActivityDate = lastUsedByActivityId.get(activity.id);
    if (previousActivityDate === undefined || date > previousActivityDate) {
      lastUsedByActivityId.set(activity.id, date);
    }
    const previousGroupDate = lastUsedByVarianceGroup.get(activity.varianceGroup);
    if (previousGroupDate === undefined || date > previousGroupDate) {
      lastUsedByVarianceGroup.set(activity.varianceGroup, date);
    }
  }

  return { lastUsedByVarianceGroup, lastUsedByActivityId };
}
