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

import { ListeningComprehensionStepView } from "./ListeningComprehensionStepView";

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
