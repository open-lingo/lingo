/**
 * Accessibility audit 2026-09-17 (lane A2/A2b, docs/accessibility-2026-09-17.md
 * §1 "Not done, disclosed"): BANK tiles in `BuildSentenceStepView` had no
 * `aria-label` — a screen-reader user heard only the raw glyph (or, for a
 * kanji-fied tile, the base glyph and its `<rt>` reading concatenated
 * redundantly) with no position/state context. This pins the patch: every
 * bank tile gets `"{{word}}, {{state}}, position {{position}} of {{total}}"`,
 * and the state flips available → used once the tile is placed.
 */
import { describe, it, expect, afterEach, vi } from "vitest";
import { render, fireEvent, cleanup } from "@testing-library/react";

// A real (small) interpolator, not a passthrough — the bug this test guards
// against is specifically in the INTERPOLATED string, so a mock that just
// returns the raw default (as several sibling test files' mocks do) would be
// vacuously green in either direction (regression-classes C4).
vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (_key: string, defaultOrOpts?: string | Record<string, unknown>, maybeOpts?: Record<string, unknown>) => {
      const template = typeof defaultOrOpts === "string" ? defaultOrOpts : _key;
      const opts = typeof defaultOrOpts === "object" ? defaultOrOpts : maybeOpts;
      if (!opts) return template;
      return template.replace(/\{\{(\w+)\}\}/g, (_m, name) =>
        Object.prototype.hasOwnProperty.call(opts, name) ? String(opts[name]) : `{{${name}}}`,
      );
    },
  }),
}));
vi.mock("@/shared/tts", () => ({
  getTtsUrl: vi.fn(() => null),
  hasTtsAudio: vi.fn(() => false),
  playJaAudio: vi.fn(),
  useAutoPlayJaAudio: vi.fn(),
}));
vi.mock("@/shared/audio/volume", () => ({ playLocalAudio: vi.fn() }));
vi.mock("@/shared/audio/sfx", () => ({ playSfx: vi.fn() }));
vi.mock("./BuildTileSurface", () => ({
  BuildTileSurface: ({ tile }: { tile: string }) => (
    <span data-testid={`tile-${tile}`}>{tile}</span>
  ),
  useBuildTileKanji: () => new Map(),
  useTileRomajiPeek: () => ({
    revealed: new Set(),
    reveal: () => {},
    hoverStart: () => {},
    hoverEnd: () => {},
    isRevealed: () => false,
  }),
  HOVER_REVEAL_MS: 500,
}));
vi.mock("@/shared/contexts/SettingsContext", () => ({
  useSettings: () => ({ settings: { learning: { hideBuildTileRomaji: false } } }),
}));
vi.mock("@/shared/readingAnnotation/AnnotatedText", () => ({
  AnnotatedText: ({ text }: { text: string }) => (
    <span data-testid={`tile-${text}`}>{text}</span>
  ),
}));

import { BuildSentenceStepView } from "./BuildSentenceStepView";
import type { BuildSentenceStep } from "../../types";

afterEach(() => cleanup());

// A 6-tile bank (4 answer + 2 distractors) keeps `bankTiles.length === 4`
// false, so the render takes the BANK + TRAY branch (the one this patch
// touches) rather than the single-answer-picker branch (already handled).
function makeStep(): BuildSentenceStep {
  return {
    id: "test-build-bank-a11y",
    type: "build_sentence",
    prompt: "Build: I eat rice.",
    targetSentence: "わたしは ごはんを たべます",
    tiles: ["わたしは", "ごはんを", "たべます", "みずを", "ねこが", "いえに"],
    correctOrder: ["わたしは", "ごはんを", "たべます"],
    granularity: "word",
  } as BuildSentenceStep;
}

function renderStep() {
  render(
    <BuildSentenceStepView
      step={makeStep()}
      onComplete={() => {}}
      onContinue={() => {}}
    />,
  );
}

function bankButtons(): HTMLElement[] {
  // Scope to `[data-kind="bank"]` specifically: the sentence-tray branch
  // ALSO renders an `aria-hidden` ghost pre-sizer row reusing the same
  // BuildTileSurface mock (so the same `data-testid="tile-<word>"` values),
  // but ghost tiles render as a plain `<span>`, not a `<button>` — querying
  // the whole document for every `tile-*` testid pulls those in too.
  const bank = document.querySelector('[data-tile-tray][data-kind="bank"]');
  if (!bank) throw new Error("no bank tray rendered");
  return Array.from(bank.querySelectorAll("button"));
}

describe("BuildSentenceStepView bank-tile aria-label", () => {
  it("labels every bank tile with word, state and position before any tap", () => {
    renderStep();
    const buttons = bankButtons();
    expect(buttons).toHaveLength(6);
    buttons.forEach((btn, i) => {
      expect(btn).toHaveAttribute(
        "aria-label",
        expect.stringMatching(
          new RegExp(`^.+, available, position ${i + 1} of 6$`),
        ),
      );
    });
  });

  it("flips a tapped tile's label from available to used, in place", () => {
    renderStep();
    const before = bankButtons();
    const target = before[0];
    const word = target.getAttribute("aria-label")?.split(",")[0];
    fireEvent.click(target);

    const after = bankButtons();
    // Same six buttons, same DOM order — position-stable per the file's own
    // "never reflow" comment; only the tapped one's label should change.
    expect(after).toHaveLength(6);
    expect(after[0]).toHaveAttribute(
      "aria-label",
      `${word}, used, position 1 of 6`,
    );
    expect(after[0]).toBeDisabled();
    for (let i = 1; i < after.length; i++) {
      expect(after[i].getAttribute("aria-label")).toMatch(/, available, /);
    }
  });
});
