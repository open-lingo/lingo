// node --test scripts/doc-hygiene/refs.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { docStem, mentionsDoc, inboundRefs } from "./refs.mjs";

test("docStem strips the doc extension", () => {
  assert.equal(docStem("docs/card-agnostic-reviews-2026-05-21.md"), "card-agnostic-reviews-2026-05-21");
});

// The exact regression: an inbound reference that DROPS the .md extension.
test("mentionsDoc matches a reference written without the extension", () => {
  const text = "See `card-agnostic-reviews-2026-05-21`, `m3-m7-audit-synthesis-2026-05-18`, and others.";
  assert.equal(mentionsDoc(text, "docs/card-agnostic-reviews-2026-05-21.md"), true);
});

test("mentionsDoc matches a reference written WITH the extension too", () => {
  const text = "moved to docs/archive/card-agnostic-reviews-2026-05-21.md";
  assert.equal(mentionsDoc(text, "docs/card-agnostic-reviews-2026-05-21.md"), true);
});

test("mentionsDoc does not match an unrelated doc", () => {
  assert.equal(mentionsDoc("nothing about it here", "docs/card-agnostic-reviews-2026-05-21.md"), false);
});

test("inboundRefs finds the extension-less referrer and excludes self", () => {
  const corpus = [
    { f: "docs/card-agnostic-reviews-2026-05-21.md", text: "self reference card-agnostic-reviews-2026-05-21" },
    { f: "docs/plan-code-reconciliation-2026-07-20.md", text: "`card-agnostic-reviews-2026-05-21`, others" },
    { f: "docs/unrelated.md", text: "nothing" },
  ];
  const refs = inboundRefs(corpus, "docs/card-agnostic-reviews-2026-05-21.md");
  assert.deepEqual(refs, ["docs/plan-code-reconciliation-2026-07-20.md"]);
});
