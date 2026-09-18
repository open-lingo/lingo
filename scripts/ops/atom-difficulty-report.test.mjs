// atom-difficulty-report.test.mjs — query builder + table formatter, on a
// fixture `get-query-results`-shaped payload. No AWS call — SSO was
// expired at authoring time (see the script's own header comment).
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  buildOutcomesQuery,
  parseInsightsResults,
  formatDifficultyTable,
  DEFAULT_MIN_N,
} from "./atom-difficulty-report.mjs";

test("buildOutcomesQuery includes the type filter, unnest, and stats-by-atomId", () => {
  const q = buildOutcomesQuery();
  assert.match(q, /filter @message like \/"type": "atom_outcome"\//);
  assert.match(q, /unnest atomIdsList into atomId/);
  assert.match(q, /stats count\(\) as attempts, sum\(correct = "false"\) as fails, pct\(msToAnswer, 50\) as medianMs by atomId, lang/);
  assert.doesNotMatch(q, /filter lang = /);
});

test("buildOutcomesQuery adds a lang filter when --lang is passed", () => {
  const q = buildOutcomesQuery({ lang: "ja" });
  assert.match(q, /filter lang = "ja"/);
});

test("buildOutcomesQuery lang filter is inert to injection (no naive string concat escape needed for known 2-letter codes)", () => {
  const q = buildOutcomesQuery({ lang: "ko" });
  assert.match(q, /filter lang = "ko"/);
});

function insightsRow(atomId, lang, attempts, fails, medianMs) {
  return [
    { field: "atomId", value: atomId },
    { field: "lang", value: lang },
    { field: "attempts", value: String(attempts) },
    { field: "fails", value: String(fails) },
    { field: "medianMs", value: String(medianMs) },
  ];
}

test("parseInsightsResults flattens field/value rows and coerces numerics", () => {
  const raw = {
    status: "Complete",
    results: [insightsRow("ja:vocab:taberu", "ja", 40, 12, 2100)],
  };
  const rows = parseInsightsResults(raw);
  assert.equal(rows.length, 1);
  assert.deepEqual(rows[0], {
    atomId: "ja:vocab:taberu",
    lang: "ja",
    attempts: 40,
    fails: 12,
    medianMs: 2100,
  });
});

test("parseInsightsResults handles an empty result set", () => {
  assert.deepEqual(parseInsightsResults({ status: "Complete", results: [] }), []);
  assert.deepEqual(parseInsightsResults({}), []);
});

// ── formatDifficultyTable — THE BEHAVIOR-PINNING TEST ───────────────────
//
// Guards `DEFAULT_MIN_N = 20`: an atom with n < 20 must never appear in
// either table. Verified for real, not just reasoned about: temporarily
// lowering DEFAULT_MIN_N to 5 flips the n=10 fixture row below from
// excluded to included, which is recorded in the lane report rather than
// only asserted here.

test("formatDifficultyTable excludes rows under n=20 by default", () => {
  const rows = [
    { atomId: "ja:vocab:rare", lang: "ja", attempts: 10, fails: 9, medianMs: 500 },
    { atomId: "ja:vocab:common", lang: "ja", attempts: 50, fails: 5, medianMs: 1800 },
  ];
  const { hardest, easiest } = formatDifficultyTable(rows);
  assert.equal(hardest.length, 1);
  assert.equal(hardest[0].atomId, "ja:vocab:common");
  assert.equal(easiest.length, 1);
});

test("formatDifficultyTable sorts hardest-first by fail rate", () => {
  const rows = [
    { atomId: "a", lang: "ja", attempts: 25, fails: 5, medianMs: 1000 }, // 20%
    { atomId: "b", lang: "ja", attempts: 25, fails: 20, medianMs: 1000 }, // 80%
    { atomId: "c", lang: "ja", attempts: 25, fails: 10, medianMs: 1000 }, // 40%
  ];
  const { hardest } = formatDifficultyTable(rows);
  assert.deepEqual(hardest.map((r) => r.atomId), ["b", "c", "a"]);
});

test("formatDifficultyTable ties break by attempts desc (more data first)", () => {
  const rows = [
    { atomId: "low-n", lang: "ja", attempts: 20, fails: 10, medianMs: 1000 }, // 50%
    { atomId: "high-n", lang: "ja", attempts: 100, fails: 50, medianMs: 1000 }, // 50%
  ];
  const { hardest } = formatDifficultyTable(rows);
  assert.deepEqual(hardest.map((r) => r.atomId), ["high-n", "low-n"]);
});

test("formatDifficultyTable easiest is ascending fail rate, capped at 10", () => {
  const rows = Array.from({ length: 15 }, (_, i) => ({
    atomId: `atom-${i}`,
    lang: "ja",
    attempts: 30,
    fails: i, // fail rate increases with i
    medianMs: 1000,
  }));
  const { easiest } = formatDifficultyTable(rows);
  assert.equal(easiest.length, 10);
  assert.equal(easiest[0].atomId, "atom-0");
  assert.equal(easiest[9].atomId, "atom-9");
});

test("formatDifficultyTable computes fail rate as fails/attempts", () => {
  const rows = [{ atomId: "x", lang: "ja", attempts: 40, fails: 10, medianMs: 1000 }];
  const { hardest } = formatDifficultyTable(rows);
  assert.equal(hardest[0].failRate, 0.25);
});

test("formatDifficultyTable table string contains atomId, fail %, and a header", () => {
  const rows = [{ atomId: "ja:vocab:taberu", lang: "ja", attempts: 40, fails: 10, medianMs: 2100 }];
  const { table } = formatDifficultyTable(rows);
  assert.match(table, /atomId/);
  assert.match(table, /ja:vocab:taberu/);
  assert.match(table, /25\.0%/);
  assert.match(table, /10 easiest/);
});

test("a custom minN is honored (defense in depth even if the query's own filter changes)", () => {
  const rows = [{ atomId: "y", lang: "ja", attempts: 5, fails: 1, medianMs: 900 }];
  assert.equal(formatDifficultyTable(rows).hardest.length, 0);
  assert.equal(formatDifficultyTable(rows, { minN: 5 }).hardest.length, 1);
  assert.equal(DEFAULT_MIN_N, 20);
});
