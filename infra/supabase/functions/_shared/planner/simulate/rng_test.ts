import { assertEquals } from '../dev_deps.ts';
import { seededRng } from './rng.ts';

Deno.test('the same seed always replays the same sequence', () => {
  const a = seededRng(42);
  const b = seededRng(42);
  const sequenceA = Array.from({ length: 10 }, () => a.next());
  const sequenceB = Array.from({ length: 10 }, () => b.next());
  assertEquals(sequenceA, sequenceB);
});

Deno.test('every value stays within [0, 1)', () => {
  const rng = seededRng(7);
  for (let i = 0; i < 1000; i++) {
    const value = rng.next();
    assertEquals(value >= 0 && value < 1, true);
  }
});

Deno.test('different seeds produce different sequences', () => {
  const a = seededRng(1);
  const b = seededRng(2);
  assertEquals(a.next() === b.next(), false);
});
