/**
 * doc-references-code gate (retrospective-2026-07-17 §5, "Doc hygiene" item 2).
 *
 * Machine-checks the load-bearing docs' script-ladder claims against the
 * exported code constants, so a threshold move (like the 2026-07-16 hiragana
 * M10→M7 shift) can never again leave stale numbers in the orientation docs.
 *
 * Design notes — read before editing:
 *
 * - LOW FALSE-POSITIVE by construction: each matcher targets a specific
 *   canonical inline phrasing ("hiragana @ M7", "romaji off at m7",
 *   "kanji recognition starts at m8", "unlock+2", ...). Generic
 *   module-numbering prose ("M10 — past tense", "modules M3–M12") does NOT
 *   match. Historical phrasings deliberately don't match either:
 *   "hiragana moved M10→M7" and "hira@M10 at ship time" are records of the
 *   old value, not claims about the current one.
 *
 * - ADDING A CHECKED CLAIM is a 3-line change: push one entry onto
 *   `CLAIM_MATCHERS` below ({ name, pattern, expected }). The pattern's FIRST
 *   capture group must be the module number the doc claims. Every match in
 *   every scanned doc is asserted equal to `expected`; each matcher must also
 *   match at least `minMatches` (default 1) times across the doc set, so a
 *   doc rewrite that silently drops the canonical phrasing fails loudly
 *   instead of making the gate vacuous.
 *
 * - ADDING A SCANNED DOC: push its repo-relative path onto `SCANNED_DOCS`.
 *   Docs must state cutoffs in one of the canonical forms below (preferred:
 *   "hiragana @ M7" / "katakana @ M17" / "build-tiles @ M5" /
 *   "kanji recognition at m8" / "furigana unlock+2").
 */
import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  BUILD_TILE_ROMAJI_FADE_MODULE,
  HIRAGANA_ROMAJI_OFF_MODULE,
  KATAKANA_ROMAJI_OFF_MODULE,
} from "../shared/settings/romajiAutoFlip";
import {
  FURIGANA_WINDOW,
  KANJI_RECOGNITION_MODULE,
} from "../features/languages/ja/secondScript/kanjiRollout";

const REPO_ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../..",
);

/** Load-bearing docs whose ladder claims are machine-checked. */
const SCANNED_DOCS = [
  "docs/lesson-authoring-guide.md",
  "docs/pedagogy-principles-2026-07-05.md",
  "CLAUDE.md",
  "docs/emoji-blocked-words-2026-05-18.md",
] as const;

interface ClaimMatcher {
  /** Human-readable name shown in failure messages. */
  name: string;
  /**
   * Canonical claim phrasing. First capture group = the number the doc
   * claims. Applied with /gi against whitespace-normalized doc text (so
   * blockquote line-wraps like "kanji renders live\n> from M8" still match).
   */
  pattern: RegExp;
  /** The exported code constant the claim must equal. */
  expected: number;
  /** Minimum total matches across all SCANNED_DOCS (default 1). */
  minMatches?: number;
}

const CLAIM_MATCHERS: ClaimMatcher[] = [
  // --- hiragana romaji cutoff -------------------------------------------
  {
    name: "hiragana romaji cutoff — 'hiragana @/at M<n>'",
    pattern: /\bhiragana (?:@|at) m(\d+)\b/gi,
    expected: HIRAGANA_ROMAJI_OFF_MODULE,
  },
  {
    name: "hiragana romaji cutoff — 'romaji off (at) m<n>' / 'romaji dies entering m<n>'",
    pattern: /\bromaji (?:off (?:at )?|dies entering )m(\d+)\b/gi,
    expected: HIRAGANA_ROMAJI_OFF_MODULE,
  },
  // --- katakana romaji cutoff -------------------------------------------
  {
    name: "katakana romaji cutoff — 'katakana @/at M<n>'",
    pattern: /\bkatakana (?:@|at) m(\d+)\b/gi,
    expected: KATAKANA_ROMAJI_OFF_MODULE,
  },
  {
    name: "katakana romaji cutoff — 'katakana romaji persists to m<n>'",
    pattern: /\bkatakana romaji persists to m(\d+)\b/gi,
    expected: KATAKANA_ROMAJI_OFF_MODULE,
  },
  // --- build-tile romaji fade -------------------------------------------
  {
    name: "build-tile fade — 'build(-)tile(s) @/fade ... M<n>'",
    pattern: /\bbuild[- ]tiles? (?:@|fade(?: romaji)? (?:from|at)) m(\d+)\b/gi,
    expected: BUILD_TILE_ROMAJI_FADE_MODULE,
  },
  // --- kanji recognition start ------------------------------------------
  {
    name: "kanji start — 'kanji recognition (starts/begins) (at) m<n>'",
    pattern: /\bkanji recognition (?:(?:starts|begins) )?(?:at )?m(\d+)\b/gi,
    expected: KANJI_RECOGNITION_MODULE,
  },
  {
    name: "kanji start — 'kanji ... live from m<n>'",
    pattern: /\bkanji (?:recognition is |renders )?live from m(\d+)\b/gi,
    expected: KANJI_RECOGNITION_MODULE,
  },
  {
    name: "kanji start — literal 'KANJI_RECOGNITION_MODULE=<n>' in prose",
    pattern: /KANJI_RECOGNITION_MODULE\s*=\s*(\d+)/g,
    expected: KANJI_RECOGNITION_MODULE,
  },
  // --- furigana window ---------------------------------------------------
  {
    name: "furigana window — 'unlock+<n>'",
    pattern: /\bunlock\s*\+\s*(\d+)\b/g,
    expected: FURIGANA_WINDOW,
  },
];

/**
 * Docs required to carry the audit's status front-matter line
 * (`**Status:** <LIVE|SHIPPED|STALE|HISTORICAL> · **Last-verified:** <date>`).
 */
const STATUS_STAMPED_DOCS = [
  ...SCANNED_DOCS,
  "docs/PROJECT_STATE.md",
  "docs/TODO.md",
  "docs/katakana-rollout-romaji-fade-spec-2026-06-30.md",
  "docs/kanji-implementation-spec-2026-07-16.md",
  "docs/n5-content-spec-2026-05-25.md",
] as const;

const STATUS_LINE =
  /^\*\*Status:\*\* (LIVE|SHIPPED|STALE|HISTORICAL) · \*\*Last-verified:\*\* \d{4}-\d{2}-\d{2}\s*$/m;

function readDoc(rel: string): string {
  return fs.readFileSync(path.join(REPO_ROOT, rel), "utf8");
}

/** Collapse newlines + blockquote markers so line-wrapped claims match. */
function normalize(text: string): string {
  return text.replace(/\n>?[ \t]*/g, " ");
}

describe("doc-references-code: script-ladder claims match exported constants", () => {
  const docs = SCANNED_DOCS.map((rel) => ({ rel, text: normalize(readDoc(rel)) }));

  for (const matcher of CLAIM_MATCHERS) {
    it(matcher.name, () => {
      let total = 0;
      for (const { rel, text } of docs) {
        for (const m of text.matchAll(new RegExp(matcher.pattern))) {
          total++;
          const claimed = Number(m[1]);
          expect(
            claimed,
            `${rel}: "${m[0]}" claims ${claimed} but code exports ${matcher.expected}. ` +
              `Fix the doc (or, if the constant legitimately moved, sweep ALL docs listed in ` +
              `src/__tests__/docReferences.test.ts).`,
          ).toBe(matcher.expected);
        }
      }
      expect(
        total,
        `No doc states the canonical claim for [${matcher.name}] anymore. ` +
          `Either restore the canonical phrasing in a scanned doc or update this matcher.`,
      ).toBeGreaterThanOrEqual(matcher.minMatches ?? 1);
    });
  }
});

describe("doc hygiene: status front-matter", () => {
  for (const rel of STATUS_STAMPED_DOCS) {
    it(`${rel} carries a '**Status:** ... · **Last-verified:** ...' line`, () => {
      const head = readDoc(rel).split("\n").slice(0, 15).join("\n");
      expect(
        head,
        `${rel} is missing the one-line status header near the top ` +
          `('**Status:** <LIVE|SHIPPED|STALE|HISTORICAL> · **Last-verified:** YYYY-MM-DD').`,
      ).toMatch(STATUS_LINE);
    });
  }
});
