/**
 * Build-step grading leniency (Spencer walk 2026-07-24): builds grade
 * against the SAME expanded-answer machinery as typed translation, so
 * correct Japanese with a leftover optional tile (temporal-は-drop:
 * きょう これを しない built from a bank containing は) is no longer
 * marked wrong. Exact sequence still passes; garbage still fails.
 */
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (k: string, d?: string) => (typeof d === "string" ? d : k) }),
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

function makeStep(): BuildSentenceStep {
  return {
    id: "test-build-leniency",
    type: "build_sentence",
    prompt: "Build: Today I won't do this one.",
    targetSentence: "きょうは これを しない",
    tiles: ["きょう", "は", "これ", "を", "しない", "てがみ"],
    correctOrder: ["きょう", "は", "これ", "を", "しない"],
    granularity: "word",
  } as BuildSentenceStep;
}

function bankButtonFor(text: string): HTMLElement {
  const tile = screen.getAllByTestId(`tile-${text}`).find((el) => {
    const b = el.closest("button");
    return b !== null && !b.hasAttribute("disabled");
  });
  const btn = tile?.closest("button");
  if (!btn) throw new Error(`no clickable bank tile for ${text}`);
  return btn;
}

function buildAnswer(tiles: string[]) {
  const onComplete = vi.fn();
  render(
    <BuildSentenceStepView step={makeStep()} onComplete={onComplete} onContinue={() => {}} />,
  );
  for (const t of tiles) fireEvent.click(bankButtonFor(t));
  fireEvent.click(screen.getByRole("button", { name: /check/i }));
  return onComplete;
}

describe("build_sentence grading leniency", () => {
  it("accepts the exact authored sequence", () => {
    const onComplete = buildAnswer(["きょう", "は", "これ", "を", "しない"]);
    expect(onComplete).toHaveBeenCalledWith("test-build-leniency", true);
  });

  it("accepts the temporal-は-drop build (は left in the bank)", () => {
    const onComplete = buildAnswer(["きょう", "これ", "を", "しない"]);
    expect(onComplete).toHaveBeenCalledWith("test-build-leniency", true);
  });

  it("still rejects wrong orders", () => {
    const onComplete = buildAnswer(["しない", "きょう", "これ", "を"]);
    expect(onComplete).toHaveBeenCalledWith("test-build-leniency", false);
  });
});
