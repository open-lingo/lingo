/**
 * Tile-sizing QA page tokens (TestFlight #137, b16 2026-09-15) — pins that
 * `BuildSentenceStepView`'s dense/hugeBank tile classes actually READ the
 * shared CSS custom properties from `src/index.css` (`--tile-font`,
 * `--tile-px`, `--tile-py`, `--tile-radius`) rather than hard-coded px
 * values. A future edit that reverts to a literal number would fail this
 * test even though the rendered pixels might look unchanged locally,
 * catching a regression the visual screenshots alone would not.
 */
import { describe, it, expect, vi } from "vitest";
import { render } from "@testing-library/react";

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

function bankButtons(container: HTMLElement): HTMLButtonElement[] {
  return Array.from(container.querySelectorAll("button")).filter((b) =>
    b.className.includes("build-tile-dense"),
  ) as HTMLButtonElement[];
}

describe("BuildSentenceStepView tile-sizing tokens", () => {
  it("dense (non-hugeBank) bank tiles read --tile-font/--tile-px/--tile-py/--tile-radius", () => {
    const step: BuildSentenceStep = {
      id: "tok-dense",
      type: "build_sentence",
      prompt: "Build it",
      targetSentence: "あいうえお かきくけこ さしすせそ",
      tiles: ["あいうえお", "かきくけこ", "さしすせそ", "たちつてと", "なにぬねの", "はひふへほ", "まみむめも"],
      correctOrder: ["あいうえお", "かきくけこ", "さしすせそ"],
      granularity: "word",
    };
    const { container } = render(
      <BuildSentenceStepView step={step} onComplete={noop} onContinue={noop} />,
    );
    const buttons = bankButtons(container);
    expect(buttons.length).toBeGreaterThan(0);
    for (const btn of buttons) {
      expect(btn.className).toContain("var(--tile-font)");
      expect(btn.className).toContain("var(--tile-px)");
      expect(btn.className).toContain("var(--tile-py)");
      expect(btn.className).toContain("var(--tile-radius)");
      // Non-hugeBank must NOT carry the hugeBank sm-multiplier calc.
      expect(btn.className).not.toContain("calc(var(--tile-py)*0.75)");
    }
  });

  it("hugeBank (12+ tiles) bank tiles carry the sm ratio multiplier against the same tokens", () => {
    const tiles = Array.from({ length: 13 }, (_, i) => `たいる${i}`);
    const step: BuildSentenceStep = {
      id: "tok-huge",
      type: "build_sentence",
      prompt: "Build the long one",
      targetSentence: tiles.slice(0, 5).join(" "),
      tiles,
      correctOrder: tiles.slice(0, 5),
      granularity: "word",
    };
    const { container } = render(
      <BuildSentenceStepView step={step} onComplete={noop} onContinue={noop} />,
    );
    const buttons = bankButtons(container);
    expect(buttons.length).toBeGreaterThan(0);
    for (const btn of buttons) {
      expect(btn.className).toContain("var(--tile-font)");
      expect(btn.className).toContain("var(--tile-px)");
      expect(btn.className).toContain("var(--tile-py)");
      expect(btn.className).toContain("sm:py-[calc(var(--tile-py)*0.75)]");
      expect(btn.className).toContain(
        "sm:text-[length:calc(var(--tile-font)*0.833333)]",
      );
    }
  });

  it("dense AND hugeBank bank tiles carry the --tile-box-h uniform-height floor (TestFlight #137)", () => {
    const denseStep: BuildSentenceStep = {
      id: "tok-box-h-dense",
      type: "build_sentence",
      prompt: "Build it",
      targetSentence: "あいうえお かきくけこ さしすせそ",
      tiles: ["あいうえお", "かきくけこ", "さしすせそ", "たちつてと", "なにぬねの", "はひふへほ", "まみむめも"],
      correctOrder: ["あいうえお", "かきくけこ", "さしすせそ"],
      granularity: "word",
    };
    const { container: denseContainer } = render(
      <BuildSentenceStepView step={denseStep} onComplete={noop} onContinue={noop} />,
    );
    for (const btn of bankButtons(denseContainer)) {
      expect(btn.className).toContain("min-h-[var(--tile-box-h)]");
    }

    const hugeTiles = Array.from({ length: 13 }, (_, i) => `たいる${i}`);
    const hugeStep: BuildSentenceStep = {
      id: "tok-box-h-huge",
      type: "build_sentence",
      prompt: "Build the long one",
      targetSentence: hugeTiles.slice(0, 5).join(" "),
      tiles: hugeTiles,
      correctOrder: hugeTiles.slice(0, 5),
      granularity: "word",
    };
    const { container: hugeContainer } = render(
      <BuildSentenceStepView step={hugeStep} onComplete={noop} onContinue={noop} />,
    );
    for (const btn of bankButtons(hugeContainer)) {
      expect(btn.className).toContain("min-h-[var(--tile-box-h)]");
    }
  });

  it("bigTiles (≤6-tile) bank reads --tile-box-h and the --tile-big-scale multiplier", () => {
    const step: BuildSentenceStep = {
      id: "tok-big-scale",
      type: "build_sentence",
      prompt: "Pick the word",
      targetSentence: "たべる",
      tiles: ["たべる", "のむ", "みる", "いく"],
      correctOrder: ["たべる", "のむ"],
      granularity: "word",
    };
    const { container } = render(
      <BuildSentenceStepView step={step} onComplete={noop} onContinue={noop} />,
    );
    // Exclude the primary CTA ("Check") — it's a <button> too, but it's not
    // a tile and never reads these tokens.
    const buttons = Array.from(container.querySelectorAll("button")).filter(
      (b) => !b.closest('[data-testid="primary-cta"]'),
    ) as HTMLButtonElement[];
    expect(buttons.length).toBeGreaterThan(0);
    for (const btn of buttons) {
      expect(btn.className).toContain("min-h-[var(--tile-box-h)]");
      expect(btn.className).toContain("var(--tile-big-scale)");
    }
  });
});
