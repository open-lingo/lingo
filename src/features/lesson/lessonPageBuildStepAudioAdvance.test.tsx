/**
 * TestFlight #151 (founder, b19/b20 iPad walk): "it's still playing audio
 * into the next step, audio from previous tile should be prevented the
 * moment continue is clicked, no audio needed on build steps either where
 * you instantly continue."
 *
 * We don't render `LessonPage` (it's the GOD-file — see CLAUDE.md, and the
 * same call `lessonPage-srs-wiring.test.ts` already made for the SRS
 * gate): instead we mirror `LessonPage.handleContinue`'s audio-cutoff line
 * (`stopAllAudio()`, called synchronously before the step advances) around
 * the REAL `StepRenderer` → `BuildSentenceStepView` pipeline, and use the
 * REAL `shared/tts` module rather than a mock — this is the one thing a
 * mocked `playJaAudio` can't prove: that nothing was ever scheduled for it
 * to guard.
 */
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import * as tts from "@/shared/tts";
import { stopAllAudio } from "@/shared/tts";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (k: string, d?: string) => (typeof d === "string" ? d : k) }),
}));
vi.mock("@/shared/audio/sfx", () => ({ playSfx: vi.fn() }));
vi.mock("@/features/lesson/components/steps/BuildTileSurface", () => ({
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
  useSettings: () => ({
    settings: {
      learning: { hideBuildTileRomaji: false },
      audio: { silentMode: false },
    },
  }),
}));
vi.mock("@/shared/readingAnnotation/AnnotatedText", () => ({
  AnnotatedText: ({ text }: { text: string }) => (
    <span data-testid={`tile-${text}`}>{text}</span>
  ),
}));

import { BuildSentenceStepView } from "./components/steps/BuildSentenceStepView";
import type { BuildSentenceStep } from "./types";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

// "こんにちは" is a real manifest entry (locked in by shared/tts/index.test.ts)
// — using it means `getTtsUrl(step.targetSentence)` resolves a real URL, so
// the assertion below proves the SKIP is the step-type rule, not just an
// empty manifest lookup.
function makeStep(): BuildSentenceStep {
  return {
    id: "lesson-page-audio-advance",
    type: "build_sentence",
    prompt: "Build: hello",
    targetSentence: "こんにちは",
    tiles: ["こんにちは", "さようなら"],
    correctOrder: ["こんにちは"],
    granularity: "word",
  } as BuildSentenceStep;
}

describe("advancing from a build step: audio never scheduled, registry stays cut", () => {
  it("a correct Check followed by an instant Continue calls stopAllAudio and never calls playJaAudio", () => {
    const playSpy = vi.spyOn(tts, "playJaAudio");
    const onComplete = vi.fn();
    let onContinueCalls = 0;

    render(
      <BuildSentenceStepView
        step={makeStep()}
        onComplete={onComplete}
        onContinue={() => {
          onContinueCalls++;
        }}
      />,
    );

    // Only one tile is correct — tap it, then Check.
    fireEvent.click(screen.getByTestId("tile-こんにちは").closest("button")!);
    fireEvent.click(screen.getByRole("button", { name: /check/i }));
    expect(onComplete).toHaveBeenCalledWith(
      "lesson-page-audio-advance",
      true,
      undefined,
      "こんにちは",
    );

    // The answer-sentence auto-play must NEVER have been scheduled — this is
    // the actual TestFlight #151 defect: BuildSentenceStepView used to call
    // `playJaAudio(step.targetSentence)` directly here, unguarded.
    expect(playSpy).not.toHaveBeenCalled();

    // Continue, tapped immediately — mirrors LessonPage.handleContinue,
    // which calls `stopAllAudio()` synchronously BEFORE advancing the step.
    fireEvent.click(screen.getByRole("button", { name: /continue/i }));
    stopAllAudio();
    expect(onContinueCalls).toBe(1);

    // Still nothing scheduled — the registry has nothing to have missed.
    expect(playSpy).not.toHaveBeenCalled();
  });
});
