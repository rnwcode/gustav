import { assertEquals } from '../_shared/planner/dev_deps.ts';
import { translateCheckin } from './checkin_translator.ts';

Deno.test('chips become flags verbatim, source is chip', () => {
  const context = translateCheckin({ absichtChips: ['leinen', 'wenig_zeit'], tageVerfuegbar: [] });
  assertEquals(context.flags, new Set(['leinen', 'wenig_zeit']));
  assertEquals(context.source, 'chip');
  assertEquals(context.priorities, []);
});

Deno.test('no chips means a fallback source', () => {
  const context = translateCheckin({ absichtChips: [], tageVerfuegbar: [] });
  assertEquals(context.source, 'fallback');
});

Deno.test('available days become constraints.days', () => {
  const context = translateCheckin({ absichtChips: [], tageVerfuegbar: ['mo', 'mi', 'fr'] });
  assertEquals(context.constraints.days, new Set(['monday', 'wednesday', 'friday']));
  assertEquals(context.constraints.minutesPerDay, null);
  assertEquals(context.constraints.locations, []);
});
