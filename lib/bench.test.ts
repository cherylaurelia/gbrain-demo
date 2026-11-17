import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { cell, parseRuns, taskKeys, CONTROL, type GradedRow } from "./bench.ts";

const row = (arm: string, key: string, ok: boolean, wrong = false): GradedRow => ({ arm, key, rep: 1, ok, wrong, read_brain: ok, told_user: false });

test("totals leave the control task out; a per-task cell counts only that task", () => {
  const runs = parseRuns([row("solo", "a", true), row("solo", "b", false, true), row("solo", CONTROL, true)]);

  assert.deepEqual(cell(runs, "solo"), { right: 1, runs: 2, read: 1, wrong: 1 });
  assert.deepEqual(cell(runs, "solo", CONTROL), { right: 1, runs: 1, read: 1, wrong: 0 });
  assert.deepEqual(cell(runs, "second"), { right: 0, runs: 0, read: 0, wrong: 0 });
});

test("control sorts last", () => {
  assert.deepEqual(taskKeys(parseRuns([row("solo", CONTROL, true), row("solo", "a", true)])), ["a", CONTROL]);
});

test("a row from an arm the page does not show is rejected", () => {
  assert.throws(() => parseRuns([row("pilot", "a", true)]), /row 0 has unknown arm "pilot"/);
});

test("the published results add up to the numbers on the page", () => {
  const rows: GradedRow[] = JSON.parse(readFileSync(new URL("../bench/results.json", import.meta.url), "utf8"));
  const runs = parseRuns(rows);

  assert.equal(runs.length, 72);
  assert.deepEqual(cell(runs, "solo"), { right: 17, runs: 21, read: 21, wrong: 1 });
  assert.deepEqual(cell(runs, "second"), { right: 0, runs: 21, read: 0, wrong: 5 });
  assert.deepEqual(cell(runs, "shared"), { right: 21, runs: 21, read: 21, wrong: 0 });
  assert.equal(runs.filter((r) => r.arm === "second" && r.key !== CONTROL && r.toldUser).length, 21);
});
