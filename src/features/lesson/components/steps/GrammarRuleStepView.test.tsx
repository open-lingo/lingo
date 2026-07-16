/**
 * GrammarRuleStepView contract: the read gate (QA critique, 2026-07-11 —
 * "we might want a timer to skip forcing them to read... 5 second timer
 * max"). Continue (click AND Enter) must stay locked for a duration scaled
 * to card length, capped at 5s, and a StrictMode double-mount must not
 * stack gate timers or fire `onContinue` early. TTS read-aloud is
 * capability-gated browser `speechSynthesis` — covered separately.
 *
 * i18n + shared JA TTS + reading annotation are mocked, same reason
 * AgreementClozeStepView.test.tsx stubs them: none of those spin up in
 * happy-dom without their real providers.
 */
import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";
import { StrictMode } from "react";
import { render, screen, fireEvent, cleanup, act } from "@testing-library/react";
import type { GrammarRuleStep } from "../../types";

vi.mock("@/shared/tts", () => ({
  playJaAudio: vi.fn(),
  getTtsUrl: vi.fn(() => null),
}));
vi.mock("@/shared/readingAnnotation/AnnotatedText", () => ({
  AnnotatedText: ({ text }: { text: string }) => <>{text}</>,
}));

import { GrammarRuleStepView } from "./GrammarRuleStepView";

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

function makeStep(overrides: Partial<GrammarRuleStep> = {}): GrammarRuleStep {
  return {
    id: "gr-test",
    type: "grammar_rule",
    title: "は marks the topic",
    rule:
      "は marks the TOPIC of the sentence — 'as for X, …'. It doesn't mark the grammatical subject the way が does; は sets up what the rest of the sentence is about.",
    examples: [
      { ja: "わたしは がくせいです。", romaji: "watashi wa gakusei desu.", en: "I am a student." },
    ],
    ...overrides,
  };
}

describe("GrammarRuleStepView — read gate", () => {
  it("keeps Continue disabled immediately after mount and enables it once the gate elapses", () => {
    vi.useFakeTimers();
    const step = makeStep();
    render(<GrammarRuleStepView step={step} onContinue={vi.fn()} variant="compact" />);

    const button = screen.getByRole("button", { name: "Reading…" });
    expect(button).toBeDisabled();

    // Whatever the exact word-count-derived duration is, it can never
    // exceed the 5s ceiling — advancing just short of it must still leave
    // Continue locked, and advancing past it must unlock.
    act(() => {
      vi.advanceTimersByTime(1499);
    });
    expect(screen.getByRole("button", { name: "Reading…" })).toBeDisabled();

    act(() => {
      vi.advanceTimersByTime(5000);
    });
    expect(screen.getByRole("button", { name: "Got it" })).toBeEnabled();
  });

  it("clamps the gate to 5s even for a very long rule", () => {
    vi.useFakeTimers();
    const longRule = Array(300).fill("word").join(" ");
    const step = makeStep({ rule: longRule });
    render(<GrammarRuleStepView step={step} onContinue={vi.fn()} variant="compact" />);

    act(() => {
      vi.advanceTimersByTime(4999);
    });
    expect(screen.getByRole("button", { name: "Reading…" })).toBeDisabled();

    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(screen.getByRole("button", { name: "Got it" })).toBeEnabled();
  });

  it("floors the gate at 1.5s even for a one-word rule", () => {
    vi.useFakeTimers();
    const step = makeStep({ title: "か", rule: "Flip." });
    render(<GrammarRuleStepView step={step} onContinue={vi.fn()} variant="compact" />);

    act(() => {
      vi.advanceTimersByTime(1499);
    });
    expect(screen.getByRole("button", { name: "Reading…" })).toBeDisabled();

    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(screen.getByRole("button", { name: "Got it" })).toBeEnabled();
  });

  it("blocks click AND Enter while gated, and both work once unlocked", () => {
    vi.useFakeTimers();
    const onContinue = vi.fn();
    const step = makeStep({ title: "か", rule: "Flip." }); // floors to 1.5s
    render(<GrammarRuleStepView step={step} onContinue={onContinue} variant="compact" />);

    fireEvent.click(screen.getByRole("button", { name: "Reading…" }));
    expect(onContinue).not.toHaveBeenCalled();

    fireEvent.keyDown(document, { key: "Enter" });
    expect(onContinue).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(1500);
    });

    fireEvent.keyDown(document, { key: "Enter" });
    expect(onContinue).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole("button", { name: "Got it" }));
    expect(onContinue).toHaveBeenCalledTimes(2);
  });

  it("does not stack gate timers under a StrictMode double-mount", () => {
    vi.useFakeTimers();
    const onContinue = vi.fn();
    const step = makeStep({ title: "か", rule: "Flip." }); // floors to 1.5s
    render(
      <StrictMode>
        <GrammarRuleStepView step={step} onContinue={onContinue} variant="compact" />
      </StrictMode>,
    );

    // Exactly at the floor: enabled, not fired early or twice-scheduled.
    act(() => {
      vi.advanceTimersByTime(1499);
    });
    expect(screen.getByRole("button", { name: "Reading…" })).toBeDisabled();

    act(() => {
      vi.advanceTimersByTime(1);
    });
    const button = screen.getByRole("button", { name: "Got it" });
    expect(button).toBeEnabled();

    fireEvent.click(button);
    expect(onContinue).toHaveBeenCalledTimes(1);
  });

  it("re-arms the gate when the step id changes without an unmount", () => {
    vi.useFakeTimers();
    const onContinue = vi.fn();
    const stepA = makeStep({ id: "gr-a", title: "か", rule: "Flip." });
    const { rerender } = render(
      <GrammarRuleStepView step={stepA} onContinue={onContinue} variant="compact" />,
    );
    act(() => {
      vi.advanceTimersByTime(1500);
    });
    expect(screen.getByRole("button", { name: "Got it" })).toBeEnabled();

    const stepB = makeStep({ id: "gr-b", title: "を", rule: "Marks." });
    rerender(<GrammarRuleStepView step={stepB} onContinue={onContinue} variant="compact" />);
    expect(screen.getByRole("button", { name: "Reading…" })).toBeDisabled();

    act(() => {
      vi.advanceTimersByTime(1500);
    });
    expect(screen.getByRole("button", { name: "Got it" })).toBeEnabled();
  });
});

describe("GrammarRuleStepView — TTS read-aloud", () => {
  const originalSpeechSynthesis = (
    window as unknown as { speechSynthesis?: unknown }
  ).speechSynthesis;
  const originalUtterance = (
    window as unknown as { SpeechSynthesisUtterance?: unknown }
  ).SpeechSynthesisUtterance;

  afterEach(() => {
    // Unmount BEFORE restoring the globals: the file-level `afterEach`
    // below also calls `cleanup()`, but nested `afterEach` hooks run
    // before outer ones, so without an explicit cleanup here the mock
    // would already be torn down when GrammarRuleStepView's unmount
    // effect calls `window.speechSynthesis.cancel()`.
    cleanup();
    (window as unknown as { speechSynthesis?: unknown }).speechSynthesis =
      originalSpeechSynthesis;
    (window as unknown as { SpeechSynthesisUtterance?: unknown }).SpeechSynthesisUtterance =
      originalUtterance;
  });

  it("renders no speaker button when speechSynthesis is unsupported", () => {
    delete (window as unknown as { speechSynthesis?: unknown }).speechSynthesis;
    render(
      <GrammarRuleStepView step={makeStep()} onContinue={vi.fn()} variant="compact" />,
    );
    expect(
      screen.queryByRole("button", { name: /read this card aloud/i }),
    ).not.toBeInTheDocument();
  });

  describe("when speechSynthesis is available", () => {
    let cancel: ReturnType<typeof vi.fn>;
    let speak: ReturnType<typeof vi.fn>;

    beforeEach(() => {
      cancel = vi.fn();
      speak = vi.fn();
      (window as unknown as { speechSynthesis: unknown }).speechSynthesis = {
        cancel,
        speak,
      };
      (window as unknown as { SpeechSynthesisUtterance: unknown }).SpeechSynthesisUtterance =
        class {
          text: string;
          lang = "";
          onend: (() => void) | null = null;
          onerror: (() => void) | null = null;
          constructor(text: string) {
            this.text = text;
          }
        };
    });

    it("toggles speak/cancel and swaps the button label on click", () => {
      render(
        <GrammarRuleStepView step={makeStep()} onContinue={vi.fn()} variant="compact" />,
      );
      const btn = screen.getByRole("button", { name: /read this card aloud/i });
      fireEvent.click(btn);
      expect(speak).toHaveBeenCalledTimes(1);
      expect(cancel).toHaveBeenCalledTimes(1); // defensive cancel-before-speak

      expect(
        screen.getByRole("button", { name: /stop reading aloud/i }),
      ).toBeInTheDocument();

      fireEvent.click(screen.getByRole("button", { name: /stop reading aloud/i }));
      expect(cancel).toHaveBeenCalledTimes(2);
      expect(
        screen.getByRole("button", { name: /read this card aloud/i }),
      ).toBeInTheDocument();
    });

    it("cancels any in-flight utterance on unmount", () => {
      const { unmount } = render(
        <GrammarRuleStepView step={makeStep()} onContinue={vi.fn()} variant="compact" />,
      );
      fireEvent.click(screen.getByRole("button", { name: /read this card aloud/i }));
      cancel.mockClear();
      unmount();
      expect(cancel).toHaveBeenCalledTimes(1);
    });
  });
});
