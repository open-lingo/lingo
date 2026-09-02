/**
 * The placeholder ("I said it!") path must RECORD a result, not just continue.
 *
 * `speaking` is a graded step, and `LessonPage.handleContinue` deliberately
 * refuses to advance past a graded step with no recorded result — a
 * defence-in-depth guard whose own comment anticipates exactly this bug:
 * "a step view that fires `onContinue` without calling `onComplete` first".
 *
 * The placeholder did precisely that, so on any device where speech
 * recognition reports unsupported the step became **impassible**: the button
 * rendered, was enabled, accepted the tap, and nothing happened. Found on
 * Korean m1 ㄱ-row review, step 13.
 */
import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, cleanup } from "@testing-library/react";
import type { SpeakingStep } from "../../types";

vi.mock(import("@/shared/tts"), async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    playJaAudio: vi.fn(),
    getTtsUrl: vi.fn(() => "/tts/fake.mp3"),
    useAutoPlayJaAudio: vi.fn(),
  };
});
vi.mock("@/shared/contexts/SettingsContext", async () => {
  const { DEFAULT_SETTINGS } = await import("@/shared/settings/types");
  return { useSettings: () => ({ settings: DEFAULT_SETTINGS }) };
});
vi.mock("@/shared/contexts/LessonModuleContext", () => ({
  useLessonModuleIndex: () => null,
}));
vi.mock("@/shared/hooks/useLangPath", () => ({ useLang: () => "ko" }));

import { SpeakingStepView } from "./SpeakingStepView";

/** `stubbed: true` always renders the placeholder, regardless of the flag. */
const step: SpeakingStep = {
  id: "ko-m1-g-3-speak-1",
  type: "speaking",
  prompt: "Say it",
  targetPhrase: "고기",
  stubbed: true,
} as unknown as SpeakingStep;

describe("SpeakingStepView — placeholder continue", () => {
  it("records a result so the lesson can actually advance", () => {
    const onComplete = vi.fn();
    const onContinue = vi.fn();
    render(
      <SpeakingStepView step={step} onComplete={onComplete} onContinue={onContinue} />,
    );

    fireEvent.click(screen.getByRole("button", { name: /i said it/i }));

    // Without this the LessonPage guard silently swallows the advance and the
    // learner is stuck on the step with no way forward.
    expect(onComplete).toHaveBeenCalledWith(step.id, true);
    expect(onContinue).toHaveBeenCalled();
    cleanup();
  });
});
