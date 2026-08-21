// node --test scripts/doc-hygiene/repoint.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { extractSuccessor, mentionLines } from "./repoint.mjs";

test("extracts a successor named after 'see' in a STALE SNAPSHOT banner", () => {
  const head = "> **Status: STALE SNAPSHOT (2026-07-20).** Point-in-time record; some specifics are now wrong. Kept for history — see docs/plan-code-reconciliation-2026-07-20.md §4.";
  assert.equal(extractSuccessor(head), "docs/plan-code-reconciliation-2026-07-20.md");
});

test("extracts a successor after 'superseded by' with backticks", () => {
  assert.equal(extractSuccessor("SUPERSEDED by `docs/new-plan.md` as of 2026-08."), "docs/new-plan.md");
});

test("prefixes docs/ when the successor is given bare", () => {
  assert.equal(extractSuccessor("see foo-bar.md for the current version"), "docs/foo-bar.md");
});

test("returns null when only a date supersedes it (no doc named)", () => {
  assert.equal(extractSuccessor("**Status:** STALE · **Last-verified:** 2026-07-17"), null);
});

test("mentionLines finds stem references with line numbers", () => {
  const text = "intro\n`card-agnostic-reviews-2026-05-21`, `x` in the list\nother";
  const ms = mentionLines(text, "docs/card-agnostic-reviews-2026-05-21.md");
  assert.equal(ms.length, 1);
  assert.equal(ms[0].line, 2);
});
