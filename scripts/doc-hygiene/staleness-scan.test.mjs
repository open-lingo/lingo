// node --test scripts/doc-hygiene/staleness-scan.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { isSelfDeclaration } from "./staleness-scan.mjs";

// Real banners that SHOULD count as the doc declaring itself dead:
test("line-1 Status: STALE SNAPSHOT banner is a self-declaration", () => {
  assert.equal(isSelfDeclaration("> **Status: STALE SNAPSHOT (2026-07-20).** Point-in-time record; some specifics are now wrong.", 0), true);
});
test("bold SUPERSEDED banner at top is a self-declaration", () => {
  assert.equal(isSelfDeclaration("⏵ SUPERSEDED 2026-08-06 — THE GOAL CHANGED", 0), true);
});

// Real FALSE POSITIVES pass 1 got wrong — content mentions, NOT self-declarations:
test("INDEX.md line describing the corpus is NOT a self-declaration", () => {
  assert.equal(isSelfDeclaration("Don't grep docs/ blind: ~half of the 160 md files are stale or archival, and most self-flag it.", 4), false);
});
test("README doc-hygiene guidance mentioning stale is NOT a self-declaration", () => {
  assert.equal(isSelfDeclaration("This directory accumulates dated handoffs — most go *stale*, and stale-but-plausible docs mislead agents.", 4), false);
});

// Position guard: a banner buried deep in the file is not a whole-doc declaration.
test("a supersession note about an internal section deep in the file is not self-declaration", () => {
  assert.equal(isSelfDeclaration("**The 2026-07-27 cancellation below is SUPERSEDED.** N5 is complete.", 9), false);
});
