/**
 * Romaji hover-peek on character-build tiles (Spencer 2026-07-19, m1 walk:
 * "we need romaji above these single tile builds in the earlier modules …
 * maybe we make them hoverable for the romaji hint").
 *
 * Two seams under test on ListeningBuildStepView:
 *   1. hover-dwell on a bank tile FORCES its romaji helper on (via
 *      AnnotatedText's forceShowHelper), so the peek works even when the
 *      global script guard (hiragana@M7 auto-off) or the tile-fade setting
 *      has hidden romaji — the pre-existing sentence-view reveal only
 *      cleared its local hide flag, which the global gate silently
 *      overrode for post-cutoff learners.
 *   2. tap-reveal: placing a tile reveals it the same way.
 * A passing cursor must NOT reveal (dwell shorter than HOVER_REVEAL_MS).
 */
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup, act } from "@testing-library/react";
import type { ListeningBuildStep } from "../../types";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (k: string, d?: string) => (typeof d === "string" ? d : k) }),
}));
vi.mock("@/shared/tts", () => ({
  getTtsUrl: vi.fn(() => null),
  hasTtsAudio: vi.fn(() => false),
  playJaAudio: vi.fn(),
}));
vi.mock("@/shared/audio/volume", () => ({ playLocalAudio: vi.fn() }));
vi.mock("@/shared/audio/sfx", () => ({ playSfx: vi.fn() }));
vi.mock("@/shared/readingAnnotation/AnnotatedText", () => ({
  AnnotatedText: ({ text, forceShowHelper }: { text: string; forceShowHelper?: boolean }) => (
    <span data-testid={`tile-${text}`} data-force-helper={forceShowHelper ? "true" : "false"}>
      {text}
    </span>
  ),
}));

import { ListeningBuildStepView } from "./ListeningBuildStepView";
import { HOVER_REVEAL_MS } from "./BuildTileSurface";

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

function makeStep(): ListeningBuildStep {
  return {
    id: "lb-peek-test",
    type: "listening_build",
    prompt: "Listen and build the word for 'love'",
    tiles: ["あ", "い", "う", "え", "お"],
    correctOrder: ["あ", "い"],
    granularity: "character",
  } as ListeningBuildStep;
}

const noop = () => {};

/** The bank button wrapping a mocked tile span. */
function bankButtonFor(text: string): HTMLElement {
  const el = screen
    .getAllByTestId(`tile-${text}`)
    .map((n) => n.closest("button"))
    .find((b): b is HTMLButtonElement => !!b && !b.disabled);
  if (!el) throw new Error(`no enabled bank button for ${text}`);
  return el;
}

describe("ListeningBuildStepView romaji peek", () => {
  it("hover dwell forces the tile's romaji helper on; a passing cursor does not", () => {
    vi.useFakeTimers();
    render(<ListeningBuildStepView step={makeStep()} onComplete={noop} onContinue={noop} />);

    const btn = bankButtonFor("え");
    // Passing cursor: enter then leave before the dwell elapses.
    fireEvent.mouseEnter(btn);
    fireEvent.mouseLeave(btn);
    act(() => vi.advanceTimersByTime(HOVER_REVEAL_MS + 100));
    expect(screen.getAllByTestId("tile-え")[0].dataset.forceHelper).toBe("false");

    // Intentional peek: dwell past the threshold.
    fireEvent.mouseEnter(btn);
    act(() => vi.advanceTimersByTime(HOVER_REVEAL_MS + 100));
    expect(screen.getAllByTestId("tile-え")[0].dataset.forceHelper).toBe("true");
  });

  it("tapping a tile reveals its romaji", () => {
    render(<ListeningBuildStepView step={makeStep()} onComplete={noop} onContinue={noop} />);
    fireEvent.click(bankButtonFor("お"));
    // Bank instance (now ghosted) and the placed tray copy both reveal.
    const spans = screen.getAllByTestId("tile-お");
    expect(spans.some((s) => s.dataset.forceHelper === "true")).toBe(true);
  });
});
