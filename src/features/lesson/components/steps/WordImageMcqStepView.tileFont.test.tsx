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
  it("the option word label reads --wordimg-word-font, not a literal sm:text-4xl", () => {
    const { container } = render(
      <WordImageMcqStepView step={jaStep} onComplete={() => {}} onContinue={() => {}} />,
    );
    const labelSpans = [...container.querySelectorAll('button span[lang="ja"]')];
    expect(labelSpans.length).toBeGreaterThan(0);
    for (const span of labelSpans) {
      expect(span.className).toContain("sm:text-[length:var(--wordimg-word-font,2.25rem)]");
      expect(span.className).not.toMatch(/\bsm:text-4xl\b/);
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
