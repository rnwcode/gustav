/**
 * The only allowed time source in the planner.
 *
 * Reading the system clock directly is forbidden everywhere in
 * `_shared/planner/` and rejected by CI. Without this indirection, the
 * simulator and property tests could not be built — the product is
 * inherently time-based (CLAUDE.md, rule 2).
 */
export interface Clock {
  now(): Date;
  /** Today without a time component — the planner reasons in days, not hours. */
  today(): Date;
}

class SystemClock implements Clock {
  now(): Date {
    // The only place in the repo allowed to read the system clock.
    return new Date();
  }

  today(): Date {
    const n = this.now();
    return new Date(n.getFullYear(), n.getMonth(), n.getDate());
  }
}

/** A clock that can be set and advanced — for tests and the simulator. */
export class FakeClock implements Clock {
  #now: Date;

  constructor(point: Date) {
    this.#now = point;
  }

  now(): Date {
    return this.#now;
  }

  today(): Date {
    const n = this.#now;
    return new Date(n.getFullYear(), n.getMonth(), n.getDate());
  }

  /** Jumps forward by `days` and `hours`. For the simulator and time travel. */
  advanceBy({ days = 0, hours = 0 }: { days?: number; hours?: number }): void {
    this.#now = new Date(this.#now.getTime() + (days * 24 + hours) * 60 * 60 * 1000);
  }

  setTo(point: Date): void {
    this.#now = point;
  }
}

export function systemClock(): Clock {
  return new SystemClock();
}
