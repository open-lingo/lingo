/**
 * Translation reveal on `listening_build` (Spencer, TestFlight #142: "use
 * the space: show the English when they get it right").
 *
 * The step's `translation` field is the sentence's full English gloss,
 * threaded through `listeningBuildSentence()` (grammarHelpers.ts) /
 * `moduleCompiler.ts`'s listening beat branch — carried separately from
 * `prompt` (the PRE-answer cue, often the generic "Build what you hear.")
 * so it never leaks the answer before the learner has actually built the
 * sentence. It must render only after a CORRECT submit, never before and
 * never after a wrong one (a wrong submit already tells the learner the
 * correct tile order via the "Correct: …" line — the English gloss is the
 * reward for actually getting it right).
 */
import { describe, it, expect, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import type { ListeningBuildStep } from "../../types";

import { vi } from "vitest";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (k: string, d?: string) => (typeof d === "string" ? d : k) }),
}));
vi.mock("@/shared/tts", () => ({
  getTtsUrl: vi.fn(() => null),
  hasTtsAudio: vi.fn(() => false),
  playJaAudio: vi.fn(() => Promise.resolve("ok")),
}));
vi.mock("@/shared/audio/volume", () => ({ playLocalAudio: vi.fn() }));
vi.mock("@/shared/audio/sfx", () => ({ playSfx: vi.fn() }));
vi.mock("@/shared/readingAnnotation/AnnotatedText", () => ({
  AnnotatedText: ({ text }: { text: string }) => <span>{text}</span>,
}));

import { ListeningBuildStepView } from "./ListeningBuildStepView";

afterEach(() => cleanup());

function makeStep(overrides: Partial<ListeningBuildStep> = {}): ListeningBuildStep {
  return {
    id: "lb-translation-test",
    type: "listening_build",
    prompt: "Build what you hear.",
    audioKey: "わたしは がくせいです",
    targetSentence: "わたしは がくせいです",
    tiles: ["わたし", "は", "がくせい", "です"],
    correctOrder: ["わたし", "は", "がくせい", "です"],
    granularity: "word",
    translation: "I am a student.",
    ...overrides,
  } as ListeningBuildStep;
}

const noop = () => {};

function bankButtonFor(text: string): HTMLElement {
  const el = screen
    .getAllByText(text)
    .map((n) => n.closest("button"))
    .find((b): b is HTMLButtonElement => !!b && !b.disabled);
  if (!el) throw new Error(`no enabled bank button for ${text}`);
  return el;
}

function buildInOrder(order: string[]) {
  for (const tile of order) fireEvent.click(bankButtonFor(tile));
}

describe("ListeningBuildStepView translation reveal", () => {
  it("does not show the translation before a submit", () => {
    render(<ListeningBuildStepView step={makeStep()} onComplete={noop} onContinue={noop} />);
    expect(screen.queryByText("I am a student.")).toBeNull();
  });

  it("shows the translation under the tray after a CORRECT submit", () => {
    const step = makeStep();
    render(<ListeningBuildStepView step={step} onComplete={noop} onContinue={noop} />);
    buildInOrder(step.correctOrder);
    fireEvent.click(screen.getByText("Check"));
    expect(screen.getByText("I am a student.")).toBeTruthy();
  });

  it("does NOT show the translation after a WRONG submit", () => {
    const step = makeStep();
    render(<ListeningBuildStepView step={step} onComplete={noop} onContinue={noop} />);
    // Reverse the correct order so the submit grades wrong.
    buildInOrder([...step.correctOrder].reverse());
    fireEvent.click(screen.getByText("Check"));
    expect(screen.queryByText("I am a student.")).toBeNull();
  });

  it("falls back to `prompt` when a step predates the `translation` field", () => {
    const step = makeStep({ translation: undefined, prompt: "Build: I am a student." });
    render(<ListeningBuildStepView step={step} onComplete={noop} onContinue={noop} />);
    buildInOrder(step.correctOrder);
    fireEvent.click(screen.getByText("Check"));
    // The fallback renders `prompt` verbatim in the reveal slot — it is
    // ALSO the pre-answer cue text, so assert it now appears a second time
    // (once in the prompt row, once in the reveal).
    expect(screen.getAllByText("Build: I am a student.")).toHaveLength(2);
  });
});
