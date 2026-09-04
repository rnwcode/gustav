// Test-only dependencies, re-exported from a single pinned version so
// every *_test.ts file only needs to update this file, not each other.
export {
  assertAlmostEquals,
  assertEquals,
  assertThrows,
} from 'https://deno.land/std@0.224.0/assert/mod.ts';
