import { assertEquals } from '../_shared/planner/dev_deps.ts';
import { translateCheckin } from './checkin_translator.ts';

Deno.test('chips become flags verbatim, source is chip', () => {
  const context = translateCheckin({ intentChips: ['leash', 'shortOnTime'], daysAvailable: [] });
  assertEquals(context.flags, new Set(['leash', 'shortOnTime']));
  assertEquals(context.source, 'chip');
  assertEquals(context.priorities, []);
});

Deno.test('no chips means a fallback source', () => {
  const context = translateCheckin({ intentChips: [], daysAvailable: [] });
  assertEquals(context.source, 'fallback');
});

Deno.test('available days become constraints.days', () => {
  const context = translateCheckin({ intentChips: [], daysAvailable: ['monday', 'wednesday', 'friday'] });
  assertEquals(context.constraints.days, new Set(['monday', 'wednesday', 'friday']));
  assertEquals(context.constraints.minutesPerDay, null);
  assertEquals(context.constraints.locations, []);
});
