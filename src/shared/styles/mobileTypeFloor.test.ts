/**
 * THE MOBILE TYPE FLOOR, AS A RATCHET.
 *
 * `src/index.css` § "MOBILE TYPE FLOOR" clamps hand-tuned sub-12px text up to
 * Tailwind's own smallest step on touch devices. It does that by naming the
 * arbitrary utility classes (`.text-\[10px\]`, `.text-\[0\.65rem\]`, …) in a
 * media query — which means it is only as complete as that list. A new
 * `text-[9px]` anywhere in `src/` would silently sit below the floor and
 * nobody would notice until someone squinted at a phone.
 *
 * So this test derives the truth from both sides and makes them agree:
 *   1. every arbitrary text size in `src/` that computes below 12px must be
 *      named in the block, and
 *   2. the block must not name sizes that no longer exist (stale selectors are
 *      how a rule rots into a lie).
 *
 * Fixing a failure is a one-line edit in the CSS block, not a debate.
 *
 * ⚠️ `rem` is converted at 16px, which is what `--font-base` clamps to at every
 * viewport at or below 1440px — i.e. every phone and tablet. Above that the
 * base grows (17.1px @ 1920), which only makes a `rem`-sized floor larger, so
 * treating 16px as the worst case stays correct. Don't "fix" this to read the
 * clamp.
 */
import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const SRC = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const CSS = join(SRC, "index.css");

/** The floor, in px. Tailwind's `text-xs`. */
const FLOOR = 12;
const REM = 16;

/**
 * The opening line of the block, verbatim. Widened past phones 2026-08-09 —
 * the iPad ships (`TARGETED_DEVICE_FAMILY = "1,2"`) and a width bound alone
 * can't describe it, since an iPad Pro in landscape is 1366px. The width arm
 * is what keeps headless Chromium (which reports `pointer: fine` unless a
 * context sets `hasTouch`) inside the query at phone viewports.
 */
const FLOOR_QUERY = "@media (max-width: 1023.98px), (pointer: coarse)";

function sourceFiles(dir: string, acc: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    if (entry === "node_modules" || entry === "_archive") continue;
    const p = join(dir, entry);
    if (statSync(p).isDirectory()) sourceFiles(p, acc);
    else if (/\.(tsx?|css)$/.test(entry) && !entry.endsWith(".test.ts") && !entry.endsWith(".test.tsx")) acc.push(p);
  }
  return acc;
}

/** `text-[10px]` / `text-[0.65rem]` → px, for every occurrence under src/. */
function usedSmallSizes(): Map<string, number> {
  const found = new Map<string, number>();
  for (const file of sourceFiles(SRC)) {
    const text = readFileSync(file, "utf8");
    for (const m of text.matchAll(/text-\[([0-9.]+)(px|rem)\]/g)) {
      const px = m[2] === "rem" ? parseFloat(m[1]) * REM : parseFloat(m[1]);
      if (px < FLOOR) found.set(`${m[1]}${m[2]}`, px);
    }
  }
  return found;
}

/** The raw values named inside the mobile-type-floor media query. */
function clampedSizes(): Set<string> {
  const css = readFileSync(CSS, "utf8");
  const start = css.indexOf(FLOOR_QUERY);
  expect(start, "the mobile type floor media query is missing from index.css").toBeGreaterThan(-1);
  const block = css.slice(start, css.indexOf("\n}", css.lastIndexOf("font-size", css.length)) + 2);
  const out = new Set<string>();
  // `.text-\[0\.65rem\]` → `0.65rem`
  for (const m of block.matchAll(/\.text-\\\[([0-9.\\]+)(px|rem)\\\]/g)) {
    out.add(m[1].replace(/\\/g, "") + m[2]);
  }
  return out;
}

describe("mobile type floor", () => {
  it("clamps every sub-12px arbitrary text size used in src/", () => {
    const used = usedSmallSizes();
    const clamped = clampedSizes();
    // Guard the guard: a regex that stops matching must fail loudly rather
    // than reporting a vacuous pass.
    expect(used.size).toBeGreaterThan(5);

    const uncovered = [...used.keys()].filter((k) => !clamped.has(k)).sort();
    expect(
      uncovered,
      `these sizes render below ${FLOOR}px on a phone and are not clamped by ` +
        `index.css § "MOBILE TYPE FLOOR". Add each to the block.`,
    ).toEqual([]);
  });

  it("names no size that src/ no longer uses", () => {
    const used = usedSmallSizes();
    const stale = [...clampedSizes()].filter((k) => !used.has(k)).sort();
    expect(stale, "stale selectors in the type-floor block — delete them").toEqual([]);
  });

  it("keeps the em-sized reading aid above the floor too", () => {
    // `.kana-helper` is `0.55em` (TestFlight #70a/#73 2026-09-14 shrink, was
    // 0.65em), so its computed size follows whatever tile it rides. It is the
    // one case the class-name list above cannot catch. The `max(…, 0.75rem)`
    // floor is Spencer's 2026-09-09 "keep 12px" call and must stay present
    // regardless of the em ratio.
    //
    // TOKENIZED (b16 2026-09-15, tile-sizing QA page, TestFlight #137):
    // both numbers now live in `:root` as `--ruby-font` and
    // `--ruby-floor-romaji: 0.75rem` (see the token block near the top of
    // index.css) — this rule reads them via `var()` instead of repeating
    // the literals. The regex below pins the VARIABLE NAMES; a separate
    // assertion pins the `:root` defaults so the effective value is still
    // checked end to end. `--ruby-font` is 0.62em on mobile (b16.3,
    // 2026-09-15 — Spencer's second live dial-in on the QA page, saved to
    // docs/qa/tile-sizing.json; b16.1 was 0.72em, b16 was 0.55em) and the
    // desktop `sm` block restates 0.55em.
    const css = readFileSync(CSS, "utf8");
    const start = css.indexOf(FLOOR_QUERY);
    expect(css.slice(start)).toMatch(
      /\.kana-helper\s*\{\s*font-size:\s*max\(var\(--ruby-font\),\s*var\(--ruby-floor-romaji\)\)/,
    );
    expect(css).toMatch(/--ruby-font:\s*0\.62em;/);
    expect(css).toMatch(/--ruby-font:\s*0\.55em;/);
    // PX SINCE 2026-09-16, and this line is the record of the trade.
    // As `0.75rem` the floor tracked the root font that the accessibility
    // slider multiplies by 0.85-1.4, while `--tile-font` beside it is px and
    // did not. Measured on the 15 Pro Max: the kanji word held at 23px through
    // 100/125% and fell to 22px at 140% (the fit rule shrinking it) while the
    // floor went 12 -> 15 -> 16.8px, so reading:word ran 0.62 -> 0.65 -> 0.76
    // — TestFlight #87 ("we didn't shrink the furigana small enough… needed to
    // be the other way around") re-created by a unit. 12px is what the rem
    // resolved to at root 16px, so 100% is unchanged. What this COSTS is
    // stated in the test below; it is a real cost and it is deliberate.
    expect(css).toMatch(/--ruby-floor-romaji:\s*12px;/);
  });

  it("states the type floor itself in rem so the accessibility control still reaches it", () => {
    // ThemeContext scales the ROOT font size (`calc(var(--font-base) * scale)`),
    // so a px floor is frozen: measured at 430x932, going from 1.0x to 1.5x
    // moved the median text 13px -> 18px and left the minimum at exactly 12px.
    // The user who most needs larger text got none on the smallest text.
    // Reverting THESE to px silently reintroduces that, and nothing else would
    // fail — hence this assertion.
    //
    // ⚠️ SCOPE, 2026-09-16. This used to slice from the media query TO THE END
    // OF THE FILE, so it was really asserting "no px font-size anywhere below
    // line ~1198", which swept in the whole TILE PRIMITIVE block a thousand
    // lines later. That is the opposite of the tile system's own rule
    // (`docs/mobile-sizing-spec.md` §8: type in px or em of `--tile-font`,
    // never rem — rem is what decoupled tile TYPE from tile BOXES under the
    // slider and produced #87, #89 and #152). The slice is now bounded to the
    // block this test is named after.
    //
    // THE COST, AND HOW IT WAS PAID BACK (2026-09-16, phase 2B). For one
    // afternoon the tile system was frozen under the accessibility slider —
    // 85-140% moved no tile type at all, because every tile size is px or em
    // of a px `--tile-font`. That bought the thing 20 of 143 TestFlight items
    // were about (a tile's box and its word can no longer drift apart) at the
    // price of a real WCAG 1.4.4 loss. It is no longer the trade: `ThemeContext`
    // writes ONE unitless `--tile-a11y-scale` and `index.css` folds it into
    // `--tile-type-scale` (= fit × a11y), which every tile `font-size` reads —
    // so TYPE leads and the box follows it through the measured #137 row
    // height. That is the multiplier this comment used to prescribe. What is
    // still true, and is what this test guards: the way to reach tiles is that
    // multiplier, NOT putting rem back in one token at a time. See
    // `tileFit.test.ts` "folds the accessibility multiplier into tile TYPE".
    const css = readFileSync(CSS, "utf8");
    const start = css.indexOf(FLOOR_QUERY);
    const end = css.indexOf("\n}", css.indexOf(".kanji-ruby .kana-helper", start));
    const block = css.slice(start, end);
    const decls = [...block.matchAll(/font-size:\s*([^;]+);/g)].map((m) => m[1].trim());
    expect(decls.length, "no font-size declarations found — did the block move?")
      .toBeGreaterThanOrEqual(3);
    expect(decls.filter((d) => /\d\s*px/.test(d)), "px in the type floor").toEqual([]);
  });
});
