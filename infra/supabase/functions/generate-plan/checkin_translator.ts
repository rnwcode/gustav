import type { WeeklyContext } from '../_shared/planner/models/checkin.ts';
import { weekdayFromGerman } from '../_shared/content/german_enums.ts';

/**
 * Translates the raw planning-day check-in into `WeeklyContext` — template
 * for the MVP, an LLM later (`docs/datenmodell.md`, backlog V1.2). This is
 * deliberately the simplest translation that is still honest:
 *
 * - `absichtChips` become `flags` verbatim. `docs/datenmodell.md` describes
 *   flags as open-ended ("produced by the translator", not enumerated up
 *   front) — and no planner step currently reads `WeeklyContext.flags` at
 *   all, so inventing a chip → skill-priority mapping now would have zero
 *   effect on the plan and would guess at a content-tagging system
 *   (which skill "belongs" to which chip) that doesn't exist yet.
 * - `priorities` stays empty for the same reason: matching a chip to a
 *   `skillIdOrTopic` needs that tagging system.
 * - `constraints.minutesPerDay`/`.locations` stay empty/null: no chip
 *   carries either today.
 */
export function translateCheckin(input: {
  readonly absichtChips: readonly string[];
  readonly tageVerfuegbar: readonly string[];
}): WeeklyContext {
  return {
    priorities: [],
    constraints: {
      days: new Set(input.tageVerfuegbar.map(weekdayFromGerman)),
      minutesPerDay: null,
      locations: [],
    },
    flags: new Set(input.absichtChips),
    source: input.absichtChips.length > 0 ? 'chip' : 'fallback',
  };
}
