/**
 * Transcript wiring: the view must render `transcriptAnnotation` through
 * AnnotatedText when present (Spencer's m29 walk, 2026-07-17 — transcript
 * showed がっこうで… in pure kana at m29 because the kanji post-pass rewrites
 * only `*Annotation` fields and this view read the raw `transcript` string;
 * the annotation was computed and dropped). Kanji/furigana visibility itself
 * is AnnotatedText's contract (AnnotatedText.furiganaSrs.test.tsx) — here we
 * only pin the seam: segments in, raw-string fallback when absent.
 */
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import type { ListeningComprehensionStep } from "../../types";
import type { JapaneseAnnotation } from "@/shared/japanese/types";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string, def?: string) => (typeof def === "string" ? def : key) }),
}));
vi.mock("@/shared/tts", () => ({
  getTtsUrl: vi.fn(() => null),
}));
vi.mock("@/shared/readingAnnotation/AnnotatedText", () => ({
  AnnotatedText: ({ segments, text }: { segments?: JapaneseAnnotation[]; text?: string }) => (
    <>{segments ? segments.map((s) => s.surface).join("") : text}</>
  ),
}));

import {
  ListeningComprehensionStepView,
  MAX_LISTENING_MCQ_OPTIONS,
  selectDisplayedOptions,
} from "./ListeningComprehensionStepView";

afterEach(cleanup);

function makeStep(
  overrides: Partial<ListeningComprehensionStep> = {},
): ListeningComprehensionStep {
  return {
    id: "lc-test",
    type: "listening_comprehension",
    audioKey: "がっこうで にほんごを べんきょうします",
    transcript: "がっこうで にほんごを べんきょうします",
    question: "What does this sentence mean?",
    options: [
      { id: "correct", text: "I study Japanese at school." },
      { id: "opt-1", text: "I study English at school." },
    ],
    correctOptionId: "correct",
    ...overrides,
  };
}

const noop = () => {};

describe("ListeningComprehensionStepView transcript", () => {
  it("renders the kanji-substituted annotation, not the raw kana transcript", () => {
    const step = makeStep({
      transcriptAnnotation: [
        { surface: "学校", reading: "がっこう", atomId: "ja-gakkou", furiganaWindowOpen: false },
        { surface: "で ", reading: "で " },
        { surface: "日本語", reading: "にほんご", atomId: "ja-nihongo", furiganaWindowOpen: false },
        { surface: "を べんきょうします", reading: "を べんきょうします" },
      ] as JapaneseAnnotation[],
    });
    render(
      <ListeningComprehensionStepView step={step} onComplete={noop} onContinue={noop} />,
    );
    expect(screen.getByText(/学校で 日本語を べんきょうします/)).toBeTruthy();
    expect(screen.queryByText(/^がっこうで/)).toBeNull();
  });

  it("falls back to the raw transcript when no annotation is present", () => {
    render(
      <ListeningComprehensionStepView step={makeStep()} onComplete={noop} onContinue={noop} />,
    );
    expect(screen.getByText(/がっこうで にほんごを べんきょうします/)).toBeTruthy();
  });
});

/**
 * TestFlight #63 — a 4-option listening MCQ must render at most
 * MAX_LISTENING_MCQ_OPTIONS (3), always including the correct answer.
 */
describe("ListeningComprehensionStepView option cap (#63)", () => {
  const fourOptionStep = makeStep({
    options: [
      { id: "opt-1", text: "The ticket was expensive, so I gave the subway a go" },
      { id: "opt-2", text: "When I'm free I have a go at taking photos of the mountain" },
      { id: "correct", text: "I'm going abroad next month, so I'll take lessons in the language in advance" },
      { id: "opt-3", text: "The event was difficult, so I taught the class instead" },
    ],
    correctOptionId: "correct",
  });

  it("renders exactly MAX_LISTENING_MCQ_OPTIONS buttons for a 4-option step", () => {
    render(
      <ListeningComprehensionStepView step={fourOptionStep} onComplete={noop} onContinue={noop} />,
    );
    const buttons = screen.getAllByRole("button").filter((b) => b.textContent?.length && b.textContent.length > 10);
    expect(buttons.length).toBe(MAX_LISTENING_MCQ_OPTIONS);
  });

  it("always keeps the correct option among the rendered buttons", () => {
    render(
      <ListeningComprehensionStepView step={fourOptionStep} onComplete={noop} onContinue={noop} />,
    );
    expect(
      screen.getByText(/I'm going abroad next month, so I'll take lessons in the language in advance/),
    ).toBeTruthy();
  });

  it("selectDisplayedOptions is stable across calls for the same seed", () => {
    const first = selectDisplayedOptions(fourOptionStep.options, "correct", fourOptionStep.id);
    const second = selectDisplayedOptions(fourOptionStep.options, "correct", fourOptionStep.id);
    expect(first.map((o) => o.id)).toEqual(second.map((o) => o.id));
    expect(first.length).toBe(MAX_LISTENING_MCQ_OPTIONS);
    expect(first.some((o) => o.id === "correct")).toBe(true);
  });

  it("leaves a step at or under the cap untouched", () => {
    const threeOption = makeStep({
      options: [
        { id: "correct", text: "A" },
        { id: "opt-1", text: "B" },
        { id: "opt-2", text: "C" },
      ],
    });
    const kept = selectDisplayedOptions(threeOption.options, "correct", threeOption.id);
    expect(kept.map((o) => o.id)).toEqual(["correct", "opt-1", "opt-2"]);
  });
});
