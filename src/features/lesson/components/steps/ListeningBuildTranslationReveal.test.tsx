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
 *
 * TestFlight #199 (Spencer, b30): "Buttons resize when the translation
 * pops up, we need a way to place the translation near the build what you
 * hear spot ... so it doesn't take up new space." The reveal used to be a
 * SEPARATE paragraph below the tile bank — on a correct submit that added
 * new height to the scrolling cluster, and the `mt-auto` split pushed the
 * CTA block down. It now REPLACES the `[data-lesson-prompt]` row in place
 * (same slot the "Build what you hear." cue occupies pre-answer) instead
 * of appending a new element, so a correct submit changes what that one
 * row says without changing the page's total height.
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

  it("shows the translation IN the prompt row after a CORRECT submit, with no new paragraph added", () => {
    const step = makeStep();
    const { container } = render(
      <ListeningBuildStepView step={step} onComplete={noop} onContinue={noop} />,
    );
    const pCountBefore = container.querySelectorAll("p").length;
    buildInOrder(step.correctOrder);
    fireEvent.click(screen.getByText("Check"));
    expect(screen.getByText("I am a student.")).toBeTruthy();
    // #199: the reveal replaces `[data-lesson-prompt]`'s content — it must
    // not add a sibling element that would push the CTA block down.
    expect(
      document.querySelector('[data-lesson-prompt]')?.textContent,
    ).toBe("I am a student.");
    expect(container.querySelectorAll("p").length).toBe(pCountBefore);
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
    // The fallback renders `prompt` verbatim IN PLACE of itself (#199: the
    // reveal now replaces the prompt row rather than duplicating below it),
    // so it appears exactly once, not twice.
    expect(screen.getAllByText("Build: I am a student.")).toHaveLength(1);
  });
});

/**
 * TestFlight #165 (founder, build 20): the play button + one-line prompt
 * now route through the shared `ListenPromptHeader` primitive (also used by
 * ListeningComprehensionStepView) — button sized off THIS view's own
 * text-lg/leading-snug prompt font, prompt wraps beside it.
 */
describe("ListeningBuildStepView listen header (#165)", () => {
  it("sizes the play button from the prompt's own font token (1.125rem/leading-snug), not a fixed h-11/h-12", () => {
    render(<ListeningBuildStepView step={makeStep()} onComplete={noop} onContinue={noop} />);
    const btn = screen.getByRole("button", { name: "Play audio" });
    expect(btn.className).toContain("h-[var(--lph-btn)]");
    expect(btn.className).not.toContain("h-11");
    const row = btn.parentElement as HTMLElement;
    expect(row.style.getPropertyValue("--lph-btn")).toBe(
      "max(44px, calc(1.125rem * 1.375 * 2))",
    );
  });
});
