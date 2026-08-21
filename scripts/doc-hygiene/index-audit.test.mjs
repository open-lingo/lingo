// node --test scripts/doc-hygiene/index-audit.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { auditIndex } from "./index-audit.mjs";

const repoFiles = [
  "docs/INDEX.md",
  "docs/here.md",
  "docs/orphan.md",
  "docs/archive/old.md",
  "docs/context/m11-context.md",
  "docs/learner-sim/STATE.md",
];

test("flags a backtick ref whose file does not exist", () => {
  const { deadLinks } = auditIndex({
    indexText: "See `docs/gone.md` for details.",
    repoFiles,
  });
  assert.ok(deadLinks.includes("docs/gone.md"), "docs/gone.md should be dead");
});

test("does not flag a ref whose file exists", () => {
  const { deadLinks } = auditIndex({
    indexText: "See `docs/here.md`.",
    repoFiles,
  });
  assert.equal(deadLinks.length, 0);
});

test("resolves a bare ref against the index dir (docs/)", () => {
  const { deadLinks } = auditIndex({
    indexText: "See `here.md`.",
    repoFiles,
  });
  assert.equal(deadLinks.length, 0, "here.md resolves to docs/here.md");
});

test("skips template/placeholder refs", () => {
  const { deadLinks } = auditIndex({
    indexText: "Template: `context/mN-context.md` and `docs/<lang>-guide.md`.",
    repoFiles,
  });
  assert.equal(deadLinks.length, 0);
});

test("a bare-name ref resolves to a file living in a subdir (not dead)", () => {
  const { deadLinks } = auditIndex({
    indexText: "learner state lives in `STATE.md`.",
    repoFiles,
  });
  assert.ok(!deadLinks.includes("STATE.md"), "STATE.md resolves to docs/learner-sim/STATE.md");
});

test("a ref on a self-documented dead-link line is not flagged", () => {
  const { deadLinks } = auditIndex({
    indexText: "**Dead links:** `docs/GONE.md` doesn't exist — don't chase it.",
    repoFiles,
  });
  assert.equal(deadLinks.length, 0, "intentional dead link is skipped");
});

test("reports top-level docs not mentioned in the index as unlisted", () => {
  const { unlistedDocs } = auditIndex({
    indexText: "Only `docs/here.md` is linked.",
    repoFiles,
  });
  assert.ok(unlistedDocs.includes("docs/orphan.md"), "orphan is unlisted");
  assert.ok(!unlistedDocs.includes("docs/here.md"), "here.md is listed");
  assert.ok(
    !unlistedDocs.includes("docs/archive/old.md"),
    "nested archive docs are not top-level unlisted",
  );
  assert.ok(!unlistedDocs.includes("docs/INDEX.md"), "the index is not unlisted against itself");
});
