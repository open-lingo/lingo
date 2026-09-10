import { describe, expect, it } from "vitest";
import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import en from "@/shared/i18n/locales/en.json";
import ko from "@/shared/i18n/locales/ko.json";

/**
 * Locale-parity guard for the lesson surface (Rung 0, ko-source-learner
 * scope 2026-09-10). Before this test existed, `t()` keys under
 * `src/features/lesson/` could silently miss both `en.json` and `ko.json`
 * — react-i18next just renders the bare key string, so a typo or a
 * forgotten translation shipped invisibly. This is the "no locale-parity
 * test exists" gap called out in
 * `docs/reverse-teaching-readiness-2026-07-29.md` §1G.
 *
 * Two collection strategies, both needed:
 *   1. `t("some.key", "fallback")` / `t("some.key", { ... })` call-site
 *      literals — the vast majority of usages.
 *   2. Bare `"lesson.…"` / `"alphabet.…"` string literals anywhere in the
 *      file — catches indirect lookups, e.g. `SpeakingStepView.tsx`'s
 *      `CUE_LANGUAGE_KEYS` record (`{ ja: "lesson.speaking.lang.ja", ... }`)
 *      whose values are handed to `t()` through a variable, not inline.
 *
 * Deliberately excludes `SpeechDebugPanel` — it isn't scoped out of this
 * FILE, only out of the localization PASS (it's a `?speech-debug=1`
 * developer overlay, not learner-facing chrome); any `t()` keys it does
 * carry are still checked like everything else.
 */

const LESSON_DIR = path.resolve(__dirname);

const CALL_KEY_RE = /\bt\(\s*(["'`])((?:[a-zA-Z0-9_]+\.)+[a-zA-Z0-9_]+)\1/g;
const NAMESPACE_LITERAL_RE =
  /(["'`])((?:lesson|alphabet)\.[a-zA-Z0-9_.]+)\1/g;

// `dev/` is QA/dev tooling (visual-QA contract generation, dev-only proto
// pages) — confirmed zero `t()` calls anywhere under it. It's excluded
// rather than scanned-and-ignored because `visualQaContracts.ts` embeds
// illustrative example text like "unresolved i18n keys (e.g.
// 'lesson.something')" inside a QA-contract description string — a quoted
// substring that isn't a real key lookup, but which the (deliberately
// broad) NAMESPACE_LITERAL_RE can't distinguish from one without full
// parsing. No genuine coverage is lost: nothing under `dev/` calls `t()`.
const EXCLUDED_DIRS = new Set(["dev"]);

function walk(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    if (EXCLUDED_DIRS.has(entry)) continue;
    const full = path.join(dir, entry);
    const st = statSync(full);
    if (st.isDirectory()) {
      walk(full, out);
    } else if (/\.(ts|tsx)$/.test(entry) && !/\.test\.(ts|tsx)$/.test(entry)) {
      out.push(full);
    }
  }
  return out;
}

function flatten(obj: unknown, prefix = "", out: Record<string, unknown> = {}) {
  if (obj && typeof obj === "object" && !Array.isArray(obj)) {
    for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
      flatten(v, prefix ? `${prefix}.${k}` : k, out);
    }
  } else {
    out[prefix] = obj;
  }
  return out;
}

/**
 * Strips `//` and `/* *\/` comments before scanning. Without this, doc
 * comments that reference a key path for illustration — e.g.
 * `` // for `lesson.languageId` (getMatchPadContext caches one per language) ``
 * in `matchPairsFloor.ts`, or the example text `'lesson.something'` inside
 * `visualQaContracts.ts`'s QA-contract description — get picked up by
 * `NAMESPACE_LITERAL_RE` as if they were real key usages, producing
 * false-positive test failures. Safe for this directory: confirmed no
 * `//` occurs inside a string literal here (no embedded URLs).
 */
function stripComments(src: string): string {
  return src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "");
}

function collectKeys(): Set<string> {
  const keys = new Set<string>();
  for (const file of walk(LESSON_DIR)) {
    const src = stripComments(readFileSync(file, "utf-8"));
    for (const m of src.matchAll(CALL_KEY_RE)) keys.add(m[2]);
    for (const m of src.matchAll(NAMESPACE_LITERAL_RE)) keys.add(m[2]);
  }
  return keys;
}

describe("lesson t() keys resolve in every shipped locale", () => {
  const flatEn = flatten(en);
  const flatKo = flatten(ko);
  const usedKeys = Array.from(collectKeys()).sort();

  it("found a non-trivial number of keys (sanity check on the scanner itself)", () => {
    // Guards against the scanner silently matching nothing (e.g. a path
    // typo) and the two checks below passing vacuously.
    expect(usedKeys.length).toBeGreaterThan(100);
  });

  it.each(usedKeys)("en.json has %s", (key) => {
    expect(Object.prototype.hasOwnProperty.call(flatEn, key)).toBe(true);
  });

  it.each(usedKeys)("ko.json has %s", (key) => {
    expect(Object.prototype.hasOwnProperty.call(flatKo, key)).toBe(true);
  });
});
