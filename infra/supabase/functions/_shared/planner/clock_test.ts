import { assertEquals } from './dev_deps.ts';
import { FakeClock } from './clock.ts';

Deno.test('FakeClock returns the point it was set to', () => {
  const clock = new FakeClock(new Date(2026, 8, 6, 18, 30));
  assertEquals(clock.now(), new Date(2026, 8, 6, 18, 30));
});

Deno.test('FakeClock today strips the time of day', () => {
  const clock = new FakeClock(new Date(2026, 8, 6, 18, 30));
  assertEquals(clock.today(), new Date(2026, 8, 6));
});

Deno.test('FakeClock advanceBy() moves forward in days', () => {
  const clock = new FakeClock(new Date(2026, 8, 6));
  clock.advanceBy({ days: 9 });
  assertEquals(clock.today(), new Date(2026, 8, 15));
});
