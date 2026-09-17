// TestFlight #147 (founder, build 18, iPad Air landscape — "What is the
// word for 'love'?" 2×2 emoji grid: "this feels a little small for the box
// size... see if bigger scale works"). This view predates the
// `Tile`/`TileTray` primitive and sizes its cards with literal Tailwind
// arbitrary values, so the "tokens only" doctrine (CLAUDE.md) lives here as
// a class-string pin, same pattern as `scriptClass.test.tsx`.
//
// `var(--wordimg-word-font, 2.25rem)` / `var(--wordimg-emoji-font, 6rem)` /
// `var(--wordimg-art-w, 50%)` / `var(--wordimg-art-max, 13rem)` — every
// fallback IS the value that shipped before #147 (`sm:text-4xl` = 2.25rem,
// `sm:text-8xl` = 6rem, `w-1/2` = 50%, `max-h-52`/`max-w-52` = 13rem), so
// this also pins that phone and mouse-desktop stay byte-identical; only the
// landscape-tablet media query in index.css (not exercised by happy-dom,
// which applies no stylesheet) sets a bigger value.
import { describe, expect, it, vi } from "vitest";
import { render, cleanup } from "@testing-library/react";
import { afterEach } from "vitest";
import { WordImageMcqStepView } from "./WordImageMcqStepView";
import type { WordImageMcqStep } from "../../types";

vi.mock(import("@/shared/tts"), async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    playJaAudio: vi.fn(),
    getTtsUrl: vi.fn(() => null),
  };
});
vi.mock("@/shared/contexts/SettingsContext", async () => {
  const { DEFAULT_SETTINGS } = await import("@/shared/settings/types");
  return { useSettings: () => ({ settings: DEFAULT_SETTINGS }) };
});
vi.mock("@/shared/contexts/LanguageContext", () => ({
  useLanguage: () => ({ language: { id: "ja" } }),
}));

const jaStep: WordImageMcqStep = {
  id: "t-ja-love",
  type: "word_image_mcq",
  meaningEn: "love",
  options: [
    { id: "correct", word: "あい", emoji: "❤️" },
    { id: "opt-1", word: "いぬ", emoji: "🐶" },
    { id: "opt-2", word: "ねこ", emoji: "🐱" },
    { id: "opt-3", word: "がっこう", emoji: "🏫" },
  ],
  correctOptionId: "correct",
};

afterEach(cleanup);

describe("WordImageMcqStepView — token-driven sizing (#147)", () => {
  // MIGRATED 2026-09-16 (phase 2B): the card is a `Tile` (`variant="option"
  // size="image"`), so the word's size, its FIT floor and its colour all come
  // from `index.css` § the `image` tier — including `--wordimg-word-font`,
  // which that tier reads as its `sm:` `--fit-font`. #147's dial therefore
  // still reaches this label; what is gone is the private, cqw-based
  // `clamp(1rem,17cqw,1.5rem)` fit system that used to sit beside it and that
  // nothing in the sweep could measure. What this pins now is the thing that
  // would silently undo that: a size or colour class back on the label.
  it("hands the word label no size and no colour class — the image tier owns both", () => {
    const { container } = render(
      <WordImageMcqStepView step={jaStep} onComplete={() => {}} onContinue={() => {}} />,
    );
    const labelSpans = [...container.querySelectorAll('button span[lang="ja"]')];
    expect(labelSpans.length).toBeGreaterThan(0);
    for (const span of labelSpans) {
      expect(span.className).not.toMatch(/\btext-\[/);
      expect(span.className).not.toMatch(/\bsm:text-/);
      expect(span.className).not.toMatch(/\btext-(accent|error|text-primary)\b/);
    }
  });

  it("renders each option as an image-tier option Tile", () => {
    const { container } = render(
      <WordImageMcqStepView step={jaStep} onComplete={() => {}} onContinue={() => {}} />,
    );
    const tiles = [...container.querySelectorAll("[data-tile]")];
    expect(tiles.length).toBe(jaStep.options.length);
    for (const tile of tiles) {
      expect(tile.getAttribute("data-variant")).toBe("option");
      expect(tile.getAttribute("data-size")).toBe("image");
      // The card's palette is a disclosed divergence, carried as a tone.
      expect(tile.getAttribute("data-tone")).toBe("card");
      expect(tile.className ?? "").not.toMatch(/aspect-square|rounded-|border-|bg-|p-3/);
    }
  });

  // ON `TileTray` since review P3 (2026-09-17): the grid container carries
  // `data-tile-tray`/`data-kind="grid"` (the `--option-gap` hook, replacing
  // a literal `gap-3`) while the adaptive `cols`/`rows`/width/height budget
  // stays inline `style` on that same element — the one bespoke-geometry
  // case `TileTray`'s own doc comment expects (see `match-grid`).
  it("the option grid is a [data-tile-tray][data-kind=\"grid\"], with every option Tile inside it and state-mapped correctly", () => {
    const { container } = render(
      <WordImageMcqStepView step={jaStep} onComplete={() => {}} onContinue={() => {}} />,
    );
    const tray = container.querySelector('[data-tile-tray][data-kind="grid"]');
    expect(tray).not.toBeNull();
    const tiles = [...container.querySelectorAll("[data-tile]")];
    expect(tiles.length).toBe(jaStep.options.length);
    for (const tile of tiles) {
      expect(tray!.contains(tile)).toBe(true);
      // Nothing submitted/selected yet — every option starts idle.
      expect(tile.getAttribute("data-state")).toBe("idle");
    }
  });

  it("the emoji/art node reads the --wordimg-* tokens, not literal sm:text-8xl / w-1/2 / max-h-52", () => {
    const { container } = render(
      <WordImageMcqStepView step={jaStep} onComplete={() => {}} onContinue={() => {}} />,
    );
    const img = container.querySelector("button img");
    const fallback = container.querySelector('button span[aria-hidden]');
    expect(img ?? fallback, "neither the <img> nor the fallback glyph rendered").toBeTruthy();
    if (img) {
      expect(img.className).toContain("w-[var(--wordimg-art-w,50%)]");
      expect(img.className).toContain("max-h-[var(--wordimg-art-max,13rem)]");
      expect(img.className).not.toMatch(/\bw-1\/2\b/);
      expect(img.className).not.toMatch(/\bmax-h-52\b/);
    }
    if (fallback) {
      expect(fallback.className).toContain("sm:text-[length:var(--wordimg-emoji-font,6rem)]");
      expect(fallback.className).not.toMatch(/\bsm:text-8xl\b/);
    }
  });
});
