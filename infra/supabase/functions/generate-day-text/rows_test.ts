import { assertEquals } from '../_shared/planner/dev_deps.ts';
import { reasonFromSlotRow, reminderFromRow } from './rows.ts';
import type { ReminderRow, SlotRow } from './rows.ts';

const BASE_SLOT: SlotRow = {
  id: 'slot-1',
  date: '2026-01-15',
  activity_id: 'recall-basics',
  reason_kind: 'dueRefresher',
  reason_skill_id: 'recall',
  reason_need_dimension: null,
  day_text: null,
  day_text_generated_at: null,
  weekly_plan: {
    dog_id: 'dog-1',
    dog: { name: 'Nala', birth_date: '2023-01-01', size_class: 'medium' },
  },
};

Deno.test('reasonFromSlotRow maps reason_* columns onto Reason', () => {
  assertEquals(reasonFromSlotRow(BASE_SLOT), {
    kind: 'dueRefresher',
    skillId: 'recall',
    needDimension: null,
  });
});

Deno.test('reasonFromSlotRow tolerates an empty reason with no skill/need', () => {
  const row: SlotRow = {
    ...BASE_SLOT,
    activity_id: null,
    reason_kind: 'empty',
    reason_skill_id: null,
    reason_need_dimension: null,
  };
  assertEquals(reasonFromSlotRow(row), { kind: 'empty', skillId: null, needDimension: null });
});

Deno.test('reminderFromRow decodes dates and a null done_at', () => {
  const row: ReminderRow = {
    kind: 'vaccination',
    due_date: '2026-02-01',
    lead_time_days: 14,
    done_at: null,
  };
  const reminder = reminderFromRow(row);
  assertEquals(reminder.kind, 'vaccination');
  assertEquals(reminder.dueDate.toISOString().slice(0, 10), '2026-02-01');
  assertEquals(reminder.leadTimeDays, 14);
  assertEquals(reminder.doneAt, null);
});

Deno.test('reminderFromRow decodes a set done_at', () => {
  const row: ReminderRow = {
    kind: 'weighIn',
    due_date: '2026-02-01',
    lead_time_days: 0,
    done_at: '2026-01-20T10:00:00Z',
  };
  const reminder = reminderFromRow(row);
  assertEquals(reminder.doneAt?.toISOString(), '2026-01-20T10:00:00.000Z');
});
