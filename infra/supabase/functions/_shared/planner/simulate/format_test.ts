import { assertEquals } from '../dev_deps.ts';
import { formatInvariantReport, formatReason } from './format.ts';

Deno.test('formatReason renders every ReasonKind as a short bracketed tag', () => {
  assertEquals(formatReason({ kind: 'empty', skillId: null, needDimension: null }), '');
  assertEquals(
    formatReason({ kind: 'newSkill', skillId: 'recall', needDimension: null }),
    '[neuer skill: recall]',
  );
  assertEquals(
    formatReason({ kind: 'needGap', skillId: null, needDimension: 'scent' }),
    '[bedarfsluecke: scent]',
  );
  assertEquals(
    formatReason({ kind: 'recoveryNeed', skillId: null, needDimension: null }),
    '[erholung]',
  );
});

Deno.test('formatInvariantReport says ok for an empty violation list', () => {
  assertEquals(formatInvariantReport([]), 'Invarianten: ok');
});

Deno.test('formatInvariantReport lists every violation', () => {
  const report = formatInvariantReport([
    { rule: 'leerer-slot', detail: 'Periode 1: kein leerer Tag' },
  ]);
  assertEquals(report.includes('leerer-slot'), true);
  assertEquals(report.includes('Periode 1'), true);
});
