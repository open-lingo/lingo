/**
 * The "later" affordance (R9, 2026-08-24): a speaking step can swap itself
 * for a silent tile-build of the same sentence. Contracts pinned here:
 *   1. the swap pill renders only when the target splits into ≥2 tiles;
 *   2. swapping mounts a derived build_sentence carrying the same sentence
 *      and SRS atoms;
 *   3. completing the build reports the ORIGINAL speaking step id, so
 *      grading/SRS see no difference.
 * BuildSentenceStepView is mocked — its own behavior has its own suite;
 * this file pins the derivation and the id mapping.
 */
import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, cleanup } from "@testing-library/react";
import type { BuildSentenceStep, SpeakingStep } from "../../types";

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
vi.mock("@/shared/hooks/useLangPath", () => ({ useLang: () => "es" }));

const buildViewSpy = vi.fn();
vi.mock("./BuildSentenceStepView", () => ({
  BuildSentenceStepView: ({
    step,
    onComplete,
    onContinue,
  }: {
    step: BuildSentenceStep;
    onComplete?: (id: string, ok: boolean) => void;
    onContinue: () => void;
  }) => {
    buildViewSpy(step);
    return (
      <div>
        <span>MOCK-BUILD:{step.targetSentence}</span>
        <button onClick={() => onComplete?.(step.id, true)}>mock-complete</button>
        <button onClick={onContinue}>mock-continue</button>
      </div>
    );
  },
}));

import { SpeakingStepView } from "./SpeakingStepView";

const speakStep = (over: Partial<SpeakingStep> = {}): SpeakingStep => ({
  id: "es-m3-5-sp-test",
  type: "speaking",
  targetPhrase: "hay una silla aquí",
  translation: "there's a chair here",
  stubbed: true, // placeholder branch — no recognizer mocks needed
  audioKey: "hay una silla aquí",
  exercisedAtoms: ["es:hay", "es:silla"],
  modality: "production",
  ...over,
});

describe("SpeakingStepView — silent tile-build fallback", () => {
  it("offers the swap for a multi-word target and derives the same sentence", () => {
    const onComplete = vi.fn();
    render(
      <SpeakingStepView step={speakStep()} onComplete={onComplete} onContinue={() => {}} />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Can't speak now" }));
    expect(screen.getByText("MOCK-BUILD:hay una silla aquí")).toBeTruthy();
    const derived = buildViewSpy.mock.calls[0][0] as BuildSentenceStep;
    expect(derived.type).toBe("build_sentence");
    expect(derived.correctOrder).toEqual(["hay", "una", "silla", "aquí"]);
    expect(derived.exercisedAtoms).toEqual(["es:hay", "es:silla"]);
    expect(derived.modality).toBe("production");
    cleanup();
  });

  it("reports completion under the ORIGINAL speaking step id", () => {
    const onComplete = vi.fn();
    render(
      <SpeakingStepView step={speakStep()} onComplete={onComplete} onContinue={() => {}} />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Can't speak now" }));
    fireEvent.click(screen.getByRole("button", { name: "mock-complete" }));
    expect(onComplete).toHaveBeenCalledWith("es-m3-5-sp-test", true);
    cleanup();
  });

  it("hides the swap when the target is a single tile (nothing to build)", () => {
    render(
      <SpeakingStepView
        step={speakStep({ targetPhrase: "bien", audioKey: "bien" })}
        onComplete={() => {}}
        onContinue={() => {}}
      />,
    );
    expect(screen.queryByRole("button", { name: "Can't speak now" })).toBeNull();
    cleanup();
  });
});
