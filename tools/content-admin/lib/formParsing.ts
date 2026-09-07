import { BREED_GROUPS } from './models';
import type { BreedGroup, TroubleshootingEntry } from './models';

export function requiredString(form: FormData, key: string): string {
  const value = form.get(key);
  if (typeof value !== 'string' || value.trim() === '') {
    throw new Error(`${key} ist ein Pflichtfeld.`);
  }
  return value.trim();
}

export function optionalString(form: FormData, key: string): string | null {
  const value = form.get(key);
  if (typeof value !== 'string' || value.trim() === '') return null;
  return value.trim();
}

export function requiredNumber(form: FormData, key: string): number {
  const value = Number(form.get(key));
  if (Number.isNaN(value)) throw new Error(`${key} muss eine Zahl sein.`);
  return value;
}

export function optionalNumber(form: FormData, key: string): number | null {
  const raw = form.get(key);
  if (typeof raw !== 'string' || raw.trim() === '') return null;
  const value = Number(raw);
  if (Number.isNaN(value)) throw new Error(`${key} muss eine Zahl sein.`);
  return value;
}

export function checkbox(form: FormData, key: string): boolean {
  return form.get(key) === 'on';
}

/** One entry per non-empty line. */
export function linesToArray(form: FormData, key: string): readonly string[] {
  const raw = form.get(key);
  if (typeof raw !== 'string') return [];
  return raw
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
}

/** Comma-separated list, trimmed, empty entries dropped. */
export function commaListToArray(form: FormData, key: string): readonly string[] {
  const raw = form.get(key);
  if (typeof raw !== 'string') return [];
  return raw
    .split(',')
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0);
}

/** Comma-separated integers (e.g. seasonal months 1-12). */
export function commaListToNumbers(form: FormData, key: string): readonly number[] | null {
  const entries = commaListToArray(form, key);
  if (entries.length === 0) return null;
  return entries.map((entry) => {
    const value = Number(entry);
    if (Number.isNaN(value)) throw new Error(`${key}: "${entry}" ist keine Zahl.`);
    return value;
  });
}

/**
 * One "problem => answer" pair per line — a compact textarea format instead
 * of a dynamic add-row UI, matches `activity.troubleshooting`'s shape.
 */
export function parseTroubleshooting(form: FormData, key: string): readonly TroubleshootingEntry[] {
  const raw = form.get(key);
  if (typeof raw !== 'string') return [];
  return raw
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .map((line) => {
      const [problem, ...rest] = line.split('=>');
      if (rest.length === 0) {
        throw new Error(`Troubleshooting-Zeile ohne "=>": "${line}"`);
      }
      return { problem: problem.trim(), answer: rest.join('=>').trim() };
    });
}

export function troubleshootingToLines(entries: readonly TroubleshootingEntry[]): string {
  return entries.map((entry) => `${entry.problem} => ${entry.answer}`).join('\n');
}

/** One number input per breed group; blank or 0 means "not listed" (`docs/datenmodell.md`: missing entry counts as neutral). */
export function parseSuitability(form: FormData): Readonly<Partial<Record<BreedGroup, number>>> {
  const suitability: Partial<Record<BreedGroup, number>> = {};
  for (const group of BREED_GROUPS) {
    const raw = form.get(`suitability_${group}`);
    if (typeof raw !== 'string' || raw.trim() === '') continue;
    const value = Number(raw);
    if (Number.isNaN(value)) throw new Error(`Eignung ${group}: keine Zahl.`);
    if (value !== 0) suitability[group] = value;
  }
  return suitability;
}

export function parseForDistraction(form: FormData): readonly [number, number] | null {
  const min = optionalNumber(form, 'for_distraction_min');
  const max = optionalNumber(form, 'for_distraction_max');
  if (min === null && max === null) return null;
  if (min === null || max === null) {
    throw new Error('for_distraction: entweder beide (min und max) angeben oder keins.');
  }
  return [min, max];
}
