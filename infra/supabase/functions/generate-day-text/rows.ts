import type { NeedDimension, ReasonKind } from '../_shared/planner/models/enums.ts';
import type { ReminderKind } from '../_shared/llm/day_text_prompt.ts';

export interface SlotRow {
  readonly id: string;
  readonly date: string;
  readonly activity_id: string | null;
  readonly reason_kind: string;
  readonly reason_skill_id: string | null;
  readonly reason_need_dimension: string | null;
  readonly day_text: string | null;
  readonly day_text_generated_at: string | null;
  readonly weekly_plan: {
    readonly dog_id: string;
    readonly dog: {
      readonly name: string;
      readonly birth_date: string;
      readonly size_class: string;
    };
  };
}

export interface ReminderRow {
  readonly kind: string;
  readonly due_date: string;
  readonly lead_time_days: number;
  readonly done_at: string | null;
}

export interface ActivityTextRow {
  readonly title: string;
  readonly sentence: string;
}

/** `slot.reason_*` → the `Reason` shape `buildDayTextPrompt` expects. */
export function reasonFromSlotRow(
  row: SlotRow,
): {
  readonly kind: ReasonKind;
  readonly skillId: string | null;
  readonly needDimension: NeedDimension | null;
} {
  return {
    kind: row.reason_kind as ReasonKind,
    skillId: row.reason_skill_id,
    needDimension: row.reason_need_dimension as NeedDimension | null,
  };
}

export function reminderFromRow(
  row: ReminderRow,
): {
  readonly kind: ReminderKind;
  readonly dueDate: Date;
  readonly leadTimeDays: number;
  readonly doneAt: Date | null;
} {
  return {
    kind: row.kind as ReminderKind,
    dueDate: new Date(row.due_date),
    leadTimeDays: row.lead_time_days,
    doneAt: row.done_at === null ? null : new Date(row.done_at),
  };
}
