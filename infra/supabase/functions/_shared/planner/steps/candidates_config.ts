import type { NeedDimension } from '../models/enums.ts';

/**
 * The slice of `content/planer.yaml` candidate collection needs (section
 * `bedarf_ziel`). Passed in, not imported (CLAUDE.md, rule 10).
 */
export interface CandidateConfig {
  readonly needTargets: ReadonlyMap<NeedDimension, number>;
}
