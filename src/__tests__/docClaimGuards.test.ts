/**
 * doc-claim guards — EXTENSION of docReferences.test.ts (stale-reference
 * audit 2026-07-29). Same design rules as that file (canonical phrasings,
 * first capture group = the claimed number, minMatches floor so a doc
 * rewrite can't make a matcher vacuous). New file rather than an edit so the
 * original gate stays untouched.
 *
 * Covers the constant-drift classes the 2026-07-29 audit found UNGATED:
 *   - MATCH_PAIRS_FLOOR (the guide said "4 pairs" for three days after the
 *     code moved to 6 — invariant 36's own text calls this out),
 *   - the XP mirror defaults CLAUDE.md states in prose,
 *   - the pinned-invariants COUNT (a guide that says "25 invariants" while
 *     the file holds 47 misleads every dispatched agent about how much law
 *     there is).
 */
import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { MATCH_PAIRS_FLOOR } from "../features/lesson/data/matchPairsFloor";
import {
  XP_LESSON_COMPLETE,
  XP_PERFECT_BONUS,
  XP_TEST_BONUS,
  XP_PER_LEVEL,
} from "../features/progress/xpRules";

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

const SCANNED_DOCS = [
  "docs/lesson-authoring-guide.md",
  "docs/authoring-invariants-pinned.md",
  "docs/authoring-workflow.md",
  "CLAUDE.md",
] as const;

function readDoc(rel: string): string {
  return fs.readFileSync(path.join(REPO_ROOT, rel), "utf8");
}

/** Collapse newlines + blockquote markers so line-wrapped claims match. */
function normalize(text: string): string {
  return text.replace(/\n>?[ \t]*/g, " ");
}

/**
 * The number of pinned invariants, derived from the pinned doc itself:
 * highest "N." numbered-list ordinal at line start. (The list is
 * non-contiguous in file order — 21 follows 12 — so MAX, not count.)
 */
function pinnedInvariantCount(): number {
  const text = readDoc("docs/authoring-invariants-pinned.md");
  let max = 0;
  for (const m of text.matchAll(/^(\d+)\.\s/gm)) max = Math.max(max, Number(m[1]));
  return max;
}

const CLAIM_MATCHERS: {
  name: string;
  pattern: RegExp;
  expected: number;
  minMatches?: number;
}[] = [
  {
    name: "match-pairs floor — 'below <n> pairs' / '≥<n> pairs' / literal constant",
    pattern: /\b(?:grid below|Auto-padded to ≥|MATCH_PAIRS_FLOOR = )(\d+)\b/g,
    expected: MATCH_PAIRS_FLOOR,
    minMatches: 2,
  },
  {
    name: "XP base — 'base <n>, perfect'",
    pattern: /\bbase (\d+), perfect\b/g,
    expected: XP_LESSON_COMPLETE,
  },
  {
    name: "XP perfect bonus — 'perfect +<n>'",
    pattern: /\bperfect \+(\d+)\b/g,
    expected: XP_PERFECT_BONUS,
  },
  {
    name: "XP test/recap bonus — 'recap +<n>'",
    pattern: /\brecap \+(\d+)\b/g,
    expected: XP_TEST_BONUS,
  },
  {
    name: "XP per level — '<n>/level linear'",
    pattern: /\b(\d+)\/level linear\b/g,
    expected: XP_PER_LEVEL,
  },
  {
    name: "pinned invariant count — '(<n> invariants'",
    pattern: /\((\d+) invariants\b/g,
    expected: pinnedInvariantCount(),
  },
];

describe("doc-claim guards: prose numbers match code (audit 2026-07-29)", () => {
  it("instrument control: the invariant counter reads a real list", () => {
    // 47 as of 2026-07-26; anything under 40 means the parse broke, not that
    // the law shrank.
    expect(pinnedInvariantCount()).toBeGreaterThanOrEqual(40);
  });

  const docs = SCANNED_DOCS.map((rel) => ({ rel, text: normalize(readDoc(rel)) }));

  for (const matcher of CLAIM_MATCHERS) {
    it(matcher.name, () => {
      let total = 0;
      for (const { rel, text } of docs) {
        for (const m of text.matchAll(new RegExp(matcher.pattern))) {
          total++;
          expect(
            Number(m[1]),
            `${rel}: "${m[0]}" claims ${m[1]} but code says ${matcher.expected}. ` +
              `Fix the doc, or sweep all docs in src/__tests__/docClaimGuards.test.ts ` +
              `if the constant legitimately moved.`,
          ).toBe(matcher.expected);
        }
      }
      expect(
        total,
        `No scanned doc states the canonical claim for [${matcher.name}] anymore — ` +
          `restore the phrasing or update this matcher.`,
      ).toBeGreaterThanOrEqual(matcher.minMatches ?? 1);
    });
  }
});
