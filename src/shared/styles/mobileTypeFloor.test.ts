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
    // `.kana-helper` is `0.65em`, so its computed size follows whatever tile it
    // rides — 15.6px on an MCQ card, 10.4px on a word-build tile. It is the one
    // case the class-name list above cannot catch.
    const css = readFileSync(CSS, "utf8");
    const start = css.indexOf(FLOOR_QUERY);
    expect(css.slice(start)).toMatch(
      /\.kana-helper\s*\{\s*font-size:\s*max\(0\.65em,\s*0\.75rem\)/,
    );
  });

  it("states the floor in rem so the accessibility font-size control reaches it", () => {
    // ThemeContext scales the ROOT font size (`calc(var(--font-base) * scale)`),
    // so a px floor is frozen: measured at 430x932, going from 1.0x to 1.5x
    // moved the median text 13px -> 18px and left the minimum at exactly 12px.
    // The user who most needs larger text got none on the smallest text.
    // Reverting these to px silently reintroduces that, and nothing else would
    // fail — hence this assertion.
    const css = readFileSync(CSS, "utf8");
    const block = css.slice(css.indexOf(FLOOR_QUERY));
    const decls = [...block.matchAll(/font-size:\s*([^;]+);/g)].map((m) => m[1].trim());
    expect(decls.length, "no font-size declarations found — did the block move?")
      .toBeGreaterThanOrEqual(3);
    expect(decls.filter((d) => /\d\s*px/.test(d)), "px in the type floor").toEqual([]);
  });
});
