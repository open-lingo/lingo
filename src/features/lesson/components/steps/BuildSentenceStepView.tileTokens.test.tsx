/**
 * Tile-sizing tokens, as a two-sided ratchet (TestFlight #137; rewritten for
 * the `Tile` primitive, b16.2 2026-09-15).
 *
 * BEFORE b16.2 this file asserted that `BuildSentenceStepView`'s class
 * strings contained `var(--tile-font)` etc. Those class strings no longer
 * exist: the view picks a tier (`density`) and the numbers live in ONE CSS
 * block. A class-substring test would now pass on a view that renders the
 * wrong tier, and fail on a correct refactor — so it is replaced by the two
 * halves that actually matter:
 *
 *   1. THE VIEW side — each tile tier renders the `data-variant`/
 *      `data-density`/`data-slot` the CSS selects on, for the bank, the tray
 *      and the invisible pre-sizers. Get this wrong and a 16-tile bank
 *      silently renders at the 8-tile size.
 *   2. THE CSS side — each of those selectors really does read the shared
 *      tokens. This is the half the old test was defending: a future edit
 *      that pastes a literal `16.5px` back in would keep the QA page's
 *      sliders rendering but stop them reaching the tiles, and the
 *      screenshots would look fine locally.
 *
 * Geometry itself is verified by measurement in Chromium (the b16.2 lane's
 * `scripts/_tileparity.tmp.mjs`: every tier/state's computed style against
 * the pre-migration class strings, 430×932 and 1280×900), not here — happy-dom
 * applies no stylesheet.
 */
import { describe, it, expect, vi } from "vitest";
import { render } from "@testing-library/react";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, def?: unknown) => (typeof def === "string" ? def : key),
  }),
}));
vi.mock("@/shared/tts", () => ({
  playJaAudio: vi.fn(),
  getTtsUrl: vi.fn(() => "tts-url"),
  hasTtsAudio: vi.fn(() => true),
  useAutoPlayJaAudio: vi.fn(),
}));
vi.mock("@/shared/audio/sfx", () => ({ playSfx: vi.fn() }));
vi.mock("@/shared/contexts/SettingsContext", () => ({
  useSettings: () => ({
    settings: { learning: { showRomanization: { ja: false } } },
    updateSetting: vi.fn(),
  }),
}));

import { BuildSentenceStepView } from "./BuildSentenceStepView";
import type { BuildSentenceStep } from "../../types";

const noop = () => {};

const CSS = readFileSync(
  resolve(dirname(fileURLToPath(import.meta.url)), "../../../../index.css"),
  "utf8",
);

/**
 * Every declaration block whose selector list contains `sel`, joined — a
 * selector legitimately appears in more than one rule (the base geometry, the
 * `sm:` step inside a media query, the shared row-baseline rule), so the
 * ratchet asserts "some rule selecting this declares that", not "the first
 * one does".
 */
function ruleBody(sel: string): string {
  const bodies: string[] = [];
  let from = 0;
  for (;;) {
    const at = CSS.indexOf(sel, from);
    if (at < 0) break;
    const open = CSS.indexOf("{", at);
    const close = CSS.indexOf("}", open);
    bodies.push(CSS.slice(open, close));
    from = close;
  }
  expect(bodies.length, `no CSS rule selects on ${sel}`).toBeGreaterThan(0);
  return bodies.join("\n");
}

function tiles(container: HTMLElement): HTMLElement[] {
  return Array.from(container.querySelectorAll("[data-tile]")).filter(
    (n) => n instanceof HTMLElement,
  ) as HTMLElement[];
}

function bankTiles(container: HTMLElement): HTMLElement[] {
  return tiles(container).filter((n) => n.getAttribute("data-slot") === "bank");
}

function step(tileCount: number, overrides: Partial<BuildSentenceStep> = {}): BuildSentenceStep {
  const all = Array.from({ length: tileCount }, (_, i) => `たいる${i}`);
  return {
    id: `tok-${tileCount}`,
    type: "build_sentence",
    prompt: "Build it",
    targetSentence: all.slice(0, 3).join(" "),
    tiles: all,
    correctOrder: all.slice(0, 3),
    granularity: "word",
    ...overrides,
  } as BuildSentenceStep;
}

describe("build tiles pick a tier; the tier reads the tokens", () => {
  it("a 7-11 tile bank is the `dense` tier", () => {
    const { container } = render(
      <BuildSentenceStepView step={step(7)} onComplete={noop} onContinue={noop} />,
    );
    const bank = bankTiles(container);
    expect(bank.length).toBe(7);
    for (const el of bank) {
      expect(el.getAttribute("data-variant")).toBe("build");
      expect(el.getAttribute("data-density")).toBe("dense");
    }
  });

  it("a 12+ tile bank is the `huge` tier — its own step down at sm:", () => {
    const { container } = render(
      <BuildSentenceStepView step={step(13)} onComplete={noop} onContinue={noop} />,
    );
    const bank = bankTiles(container);
    expect(bank.length).toBe(13);
    for (const el of bank) expect(el.getAttribute("data-density")).toBe("huge");
  });

  it("a <=6 tile bank is the `big` tier", () => {
    const { container } = render(
      <BuildSentenceStepView step={step(5)} onComplete={noop} onContinue={noop} />,
    );
    const bank = bankTiles(container);
    expect(bank.length).toBe(5);
    for (const el of bank) expect(el.getAttribute("data-density")).toBe("big");
  });

  it("the tray's invisible pre-sizer is the SAME tier as the tiles it reserves for", () => {
    // If the ghost and the real tiles ever disagree, the tray mis-sizes and
    // placing a tile reflows the bank underneath it.
    const { container } = render(
      <BuildSentenceStepView step={step(8)} onComplete={noop} onContinue={noop} />,
    );
    const ghosts = tiles(container).filter(
      (n) => n.getAttribute("data-state") === "ghost",
    );
    expect(ghosts.length).toBe(3); // one per answer tile
    for (const g of ghosts) {
      expect(g.getAttribute("data-density")).toBe("dense");
      expect(g.tagName).toBe("SPAN");
      expect(g.getAttribute("aria-hidden")).toBe("true");
    }
  });

  it("a single-answer word build renders OPTIONS, not a tray and bank", () => {
    const { container } = render(
      <BuildSentenceStepView
        step={step(4, { correctOrder: ["たいる0"] })}
        onComplete={noop}
        onContinue={noop}
      />,
    );
    const all = tiles(container);
    expect(all.length).toBe(4);
    for (const el of all) {
      expect(el.getAttribute("data-variant")).toBe("option");
      expect(el.getAttribute("data-size")).toBe("pick");
    }
  });

  it("CSS: the dense/huge tier reads --tile-px/--tile-py/--tile-font", () => {
    const dense = ruleBody(
      '[data-tile][data-variant="build"][data-density="dense"],\n[data-tile][data-variant="build"][data-density="huge"] {',
    );
    expect(dense).toContain("var(--tile-py) var(--tile-px)");
    expect(dense).toContain("font-size: var(--tile-font)");
  });

  it("CSS: hugeBank steps down at sm: as an exact multiple of the same tokens", () => {
    const huge = ruleBody('[data-tile][data-variant="build"][data-density="huge"] {');
    expect(huge).toContain("var(--huge-py-abs, calc(var(--tile-py) * var(--huge-py-scale)))");
    expect(huge).toContain("var(--huge-font-abs, calc(var(--tile-font) * var(--huge-font-scale)))");
  });

  it("CSS: the big tier scales off the base tokens like huge and listen (b16.3)", () => {
    const big = ruleBody('[data-tile][data-variant="build"][data-density="big"] {');
    expect(big).toContain("var(--big-py-abs, calc(var(--tile-py) * var(--big-py-scale)))");
    expect(big).toContain("var(--big-px-abs, calc(var(--tile-px) * var(--big-px-scale)))");
    expect(big).toContain("var(--big-font-abs, calc(var(--tile-font) * var(--big-font-scale)))");
    expect(big).not.toContain("cqh");
  });

  it("CSS: build and listen carry the #137 uniform-height floor", () => {
    const floor = ruleBody(
      '[data-tile][data-variant="build"],\n[data-tile][data-variant="listen"] {',
    );
    expect(floor).toContain("min-height: var(--tile-box-h)");
  });

  it("CSS: the listen tier is expressed as ratios of the build tokens", () => {
    const listen = ruleBody('[data-tile][data-variant="listen"] {');
    expect(listen).toContain("var(--listen-py-abs, calc(var(--tile-py) * var(--listen-py-scale)))");
    expect(listen).toContain("var(--listen-px-abs, calc(var(--tile-px) * var(--listen-px-scale)))");
    expect(listen).toContain("var(--listen-font-abs, calc(var(--tile-font) * var(--listen-font-scale)))");
  });

  it("CSS: every tile reads --tile-radius, and options their own group", () => {
    expect(ruleBody("[data-tile] {")).toContain("border-radius: var(--tile-radius)");
    const option = ruleBody('[data-tile][data-variant="option"] {');
    expect(option).toContain("var(--option-radius)");
    expect(option).toContain("var(--option-px)");
    const sentence = ruleBody(
      '[data-tile][data-variant="option"][data-size="sentence"] {',
    );
    expect(sentence).toContain("var(--option-py)");
    expect(sentence).toContain("var(--option-font)");
  });

  it("CSS: TestFlight #149 — the sm tier brings listen scales to parity with build (1/1/1/1)", () => {
    // Measured wrong identically on the desktop control (1280×800, no
    // touch) and the landscape iPad (1180×820, touch) — both read this `sm`
    // `:root` block, which is why the fix lives here rather than in a new
    // landscape-only tier. Mobile (`base`) keeps its own dial-in and is
    // asserted separately, below, to still differ from 1.
    const css = readFileSync(
      resolve(dirname(fileURLToPath(import.meta.url)), "../../../../index.css"),
      "utf8",
    );
    const smStart = css.indexOf("@media (min-width: 640px) {");
    const smBlock = css.slice(smStart, css.indexOf("\n}", smStart) + 2);
    expect(smBlock).toContain("--listen-font-scale: 1;");
    expect(smBlock).toContain("--listen-px-scale: 1;");
    expect(smBlock).toContain("--listen-py-scale: 1;");
    expect(smBlock).toContain("--listen-bank-py-scale: 1;");
    // The mobile dial-in must stay untouched (Spencer's numbers, not part
    // of this report) — these are NOT 1.
    expect(css).toContain("--listen-font-scale: 1.103825;");
    expect(css).toContain("--listen-px-scale: 2.4;");
    expect(css).toContain("--listen-py-scale: 0.8;");
    expect(css).toContain("--listen-bank-py-scale: 1.066667;");
  });

  it("CSS: TestFlight #149 — the listen tray's min-height is a token, not a literal 54/68px", () => {
    const trayListen = ruleBody('[data-tile-tray][data-kind="tray"][data-variant="listen"] {');
    expect(trayListen).toContain("min-height: var(--listen-tray-min-h)");
    expect(trayListen).not.toMatch(/min-height:\s*(54|68)px/);
  });

  it("CSS: TestFlight #147/#148 — the landscape-tablet tap-bump query also carries the wordimg/lc-option tokens", () => {
    const css = readFileSync(
      resolve(dirname(fileURLToPath(import.meta.url)), "../../../../index.css"),
      "utf8",
    );
    const gate = "@media (min-width: 1024px) and (orientation: landscape) and (pointer: coarse) {";
    const start = css.indexOf(gate);
    expect(start, "the landscape-tablet tap-bump query is missing").toBeGreaterThan(-1);
    const block = css.slice(start, css.indexOf("\n}", start) + 2);
    expect(block).toContain("--tap-bump: 3px;");
    expect(block).toContain("--wordimg-word-font: 2.625rem;");
    expect(block).toContain("--wordimg-emoji-font: 6.75rem;");
    expect(block).toContain("--wordimg-art-w: 58%;");
    expect(block).toContain("--wordimg-art-max: 15rem;");
    expect(block).toContain("--lc-option-py: 0.625rem;");
    // Only one such gated query exists — these tokens are inert (fall back
    // to the shipped value) everywhere else, by construction (var(--x,
    // <shipped>) at every call site).
    expect(css.indexOf(gate, start + 1)).toBe(-1);
  });

  it("CSS: all eight match tiers scale with --match-font-scale", () => {
    for (const side of ["source", "target"]) {
      for (const audio of ["true", "false"]) {
        for (const density of ["dense", "wide"]) {
          const body = ruleBody(
            `[data-tile][data-variant="match"][data-side="${side}"][data-audio="${audio}"][data-density="${density}"] {`,
          );
          expect(body).toContain("var(--match-font-scale)");
          expect(body).toContain("cqh");
        }
      }
    }
  });
});
