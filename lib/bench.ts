// Turns bench/results.json (one row per headless Claude Code run, written by bench/grade.py) into the page's tables.

export const ARMS = ["solo", "second", "shared"] as const;

export type Arm = (typeof ARMS)[number];

/** One row as grade.py writes it; the JSON import gives it this type. */
export type GradedRow = {
  arm: string;
  key: string;
  rep: number;
  ok: boolean;
  wrong: boolean;
  read_brain: boolean;
  told_user: boolean;
};

export type Run = {
  arm: Arm;
  key: string;
  rep: number;
  ok: boolean;
  wrong: boolean;
  readBrain: boolean;
  toldUser: boolean;
};

export type Cell = { right: number; runs: number; read: number; wrong: number };

/** The control task does not depend on the brain, so it is left out of every total. */
export const CONTROL = "control_bug";

function armOf(name: string, row: number): Arm {
  const arm = ARMS.find((a) => a === name);

  if (arm === undefined) throw new Error(`results.json row ${row} has unknown arm "${name}"`);

  return arm;
}

export function parseRuns(rows: readonly GradedRow[]): Run[] {
  return rows.map((r, i) => ({
    arm: armOf(r.arm, i),
    key: r.key,
    rep: r.rep,
    ok: r.ok,
    wrong: r.wrong,
    readBrain: r.read_brain,
    toldUser: r.told_user,
  }));
}

export function cell(runs: Run[], arm: Arm, key?: string): Cell {
  const picked = runs.filter((r) => r.arm === arm && (key === undefined ? r.key !== CONTROL : r.key === key));

  return {
    right: picked.filter((r) => r.ok).length,
    runs: picked.length,
    read: picked.filter((r) => r.readBrain).length,
    wrong: picked.filter((r) => r.wrong).length,
  };
}

/** Task keys in first-seen order, control last. */
export function taskKeys(runs: Run[]): string[] {
  const keys = [...new Set(runs.map((r) => r.key))];

  return [...keys.filter((k) => k !== CONTROL), ...keys.filter((k) => k === CONTROL)];
}
