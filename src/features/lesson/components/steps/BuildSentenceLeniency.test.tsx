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
    expect(onComplete).toHaveBeenCalledWith(
      "test-build-leniency",
      true,
      undefined,
      "きょう は これ を しない",
    );
  });

  it("accepts the temporal-は-drop build (は left in the bank)", () => {
    const onComplete = buildAnswer(["きょう", "これ", "を", "しない"]);
    expect(onComplete).toHaveBeenCalledWith(
      "test-build-leniency",
      true,
      undefined,
      "きょう これ を しない",
    );
  });

  it("still rejects wrong orders", () => {
    const onComplete = buildAnswer(["しない", "きょう", "これ", "を"]);
    expect(onComplete).toHaveBeenCalledWith(
      "test-build-leniency",
      false,
      undefined,
      "しない きょう これ を",
    );
  });

  // The 4th arg is what the learner actually assembled — the reactive
  // grammar tip gates on it (reactiveTipGate), so a build reporting only a
  // verdict silently re-opens the canned-anti-pattern bug. Assert the text,
  // not just its presence.
  it("reports the assembled tray as the answer text", () => {
    const onComplete = buildAnswer(["きょう", "これ"]);
    expect(onComplete.mock.calls[0][3]).toBe("きょう これ");
  });
});

describe("build_sentence alsoAccepted (TestFlight #21)", () => {
  // あさが いそがしいから is correct Japanese beside the authored あさ
  // いそがしいから; the が tile is a floor distractor. The IR's `alsoAccept`
  // reached translate steps only — builds ignored it.
  function makeAsaStep(): BuildSentenceStep {
    return {
      id: "test-build-also",
      type: "build_sentence",
      prompt: "Build: The morning is busy, so I bought the ticket in advance",
      targetSentence: "あさ いそがしいから きっぷを かっておいた",
      tiles: ["あさ", "いそがしい", "から", "きっぷ", "を", "かっておいた", "が"],
      correctOrder: ["あさ", "いそがしい", "から", "きっぷ", "を", "かっておいた"],
      granularity: "word",
      alsoAccepted: ["あさが いそがしいから きっぷを かっておいた"],
    } as BuildSentenceStep;
  }
  it("accepts an author-listed alternative surface", () => {
    const onComplete = vi.fn();
    render(
      <BuildSentenceStepView step={makeAsaStep()} onComplete={onComplete} onContinue={() => {}} />,
    );
    for (const t of ["あさ", "が", "いそがしい", "から", "きっぷ", "を", "かっておいた"]) fireEvent.click(bankButtonFor(t));
    fireEvent.click(screen.getByRole("button", { name: /check/i }));
    expect(onComplete).toHaveBeenCalledWith("test-build-also", true, undefined, "あさ が いそがしい から きっぷ を かっておいた");
  });
});
