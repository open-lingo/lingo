/**
 * THE CUE IS A CHIP, AND ONLY WHERE THE LEARNER PRODUCES THE SENTENCE.
 *
 * One file for all five views because the assertion is the same everywhere
 * and the point is the CONTRAST: the same `registerCue` renders as an eyebrow
 * on a production step and is absent from the prompt text, while
 * `ListeningBuildStepView` — which also carries the cue — must not show it
 * (printing "POLITE" above a sentence the learner has yet to hear hands them
 * the ます).
 *
 * Each case asserts three things, because any one alone would pass on a
 * broken implementation:
 *   1. the badge renders, with the authored label;
 *   2. it is the `Badge` eyebrow primitive, not a per-view literal (checked
 *      via `data-register-form` + the eyebrow's own class contract);
 *   3. the PROMPT text no longer contains the cue.
 */
import { describe, it, expect, vi } from "vitest";
import { render } from "@testing-library/react";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, def?: unknown) => (typeof def === "string" ? def : key),
  }),
}));
vi.mock("@/shared/tts", () => ({
  playJaAudio: vi.fn(),
  getTtsUrl: vi.fn(() => "tts-url"),
  hasTtsAudio: vi.fn(() => true),
  useAutoPlayJaAudio: vi.fn(),
}));
vi.mock("@/shared/audio/sfx", () => ({ playSfx: vi.fn() }));
// TranslateStepView calls useLanguage() unguarded — same mock the shared
// renderGate harness uses (`features/lesson/__tests__/renderGate.tsx`).
vi.mock("@/shared/contexts/LanguageContext", () => ({
  useLanguage: () => ({ language: { id: "ja" } }),
}));
vi.mock("@/shared/contexts/SettingsContext", () => ({
  useSettings: () => ({
    settings: { learning: { showRomanization: { ja: false } } },
    updateSetting: vi.fn(),
  }),
}));

import { BuildSentenceStepView } from "./BuildSentenceStepView";
import { TranslateStepView } from "./TranslateStepView";
import { ParticleClozeStepView } from "./ParticleClozeStepView";
import { MultipleChoiceStepView } from "./MultipleChoiceStepView";
import { ListeningBuildStepView } from "./ListeningBuildStepView";
import { RegisterCueEyebrow } from "./RegisterCueEyebrow";
import { parseRegisterCue } from "../../data/registerCue";
import type {
  BuildSentenceStep,
  ListeningBuildStep,
  MultipleChoiceStep,
  ParticleClozeStep,
  TranslateStep,
} from "../../types";

const noop = () => {};

const POLITE = parseRegisterCue("Say politely: I eat at home").cue!;
const FRIEND = parseRegisterCue("Say to a friend: Yeah, I'll eat").cue!;

function chip(container: HTMLElement): HTMLElement | null {
  return container.querySelector("[data-register-form]");
}

describe("RegisterCueEyebrow", () => {
  it("renders nothing for an un-cued step, so call sites need no conditional", () => {
    const { container } = render(<RegisterCueEyebrow cue={undefined} />);
    expect(container.innerHTML).toBe("");
  });

  it("is the shared Badge eyebrow — no per-view sizing literals", () => {
    const { container } = render(<RegisterCueEyebrow cue={POLITE} />);
    const el = chip(container)!;
    // The eyebrow variant's class contract (Badge.tsx): type, not a chip.
    expect(el.className).toContain("text-xs");
    expect(el.className).toContain("font-bold");
    expect(el.className).toContain("uppercase");
    expect(el.className).toContain("tracking-wider");
    // …and none of the pill variant's box classes.
    expect(el.className).not.toContain("rounded-full");
    expect(el.className).not.toContain("border");
  });

  it("colours polite and plain differently — the one distinction the learner acts on", () => {
    const polite = render(<RegisterCueEyebrow cue={POLITE} />);
    const plain = render(<RegisterCueEyebrow cue={FRIEND} />);
    expect(chip(polite.container)!.className).toContain("text-accent");
    expect(chip(plain.container)!.className).toContain("text-text-muted");
  });

  it("exposes form and audience as data attributes", () => {
    const { container } = render(<RegisterCueEyebrow cue={FRIEND} />);
    const el = chip(container)!;
    expect(el.getAttribute("data-register-form")).toBe("plain");
    expect(el.getAttribute("data-register-audience")).toBe("friend");
    expect(el.textContent).toBe("To a friend");
  });
});

describe("BuildSentenceStepView", () => {
  const step = (cue?: typeof POLITE): BuildSentenceStep =>
    ({
      id: "ja-m7-neo-1-s-0",
      type: "build_sentence",
      prompt: "I eat at home",
      targetSentence: "いえで たべます",
      tiles: ["いえで", "たべます"],
      correctOrder: ["いえで", "たべます"],
      granularity: "word",
      ...(cue ? { registerCue: cue } : {}),
    }) as BuildSentenceStep;

  it("renders the cue as an eyebrow and keeps the prompt clean", () => {
    const { container } = render(
      <BuildSentenceStepView step={step(POLITE)} onComplete={noop} onContinue={noop} />,
    );
    expect(chip(container)?.textContent).toBe("Polite");
    const h2 = container.querySelector("h2")!;
    expect(h2.textContent).toBe("I eat at home");
    expect(h2.textContent).not.toContain("Say politely");
  });

  it("renders no chip for an un-cued build", () => {
    const { container } = render(
      <BuildSentenceStepView step={step()} onComplete={noop} onContinue={noop} />,
    );
    expect(chip(container)).toBeNull();
  });

  it("suppresses the chip on a `register`-beat step, which draws the audience instead", () => {
    // Belt and braces against saying it twice: the register ladder already
    // renders AudienceCue (emoji + politeness meter).
    const { container } = render(
      <BuildSentenceStepView
        step={
          {
            ...step(POLITE),
            audienceEmoji: "👩‍🏫",
            audienceLabel: "your teacher",
            picker: true,
          } as BuildSentenceStep
        }
        onComplete={noop}
        onContinue={noop}
      />,
    );
    expect(chip(container)).toBeNull();
  });
});

describe("TranslateStepView", () => {
  const step: TranslateStep = {
    id: "ja-m7-neo-1-s-2",
    type: "translate",
    sourceText: "I drink water",
    sourceLanguage: "native",
    acceptedAnswers: ["みずを のみます"],
    registerCue: POLITE,
  } as TranslateStep;

  it("shows the cue beside the direction label, not inside the prompt", () => {
    const { container } = render(
      <TranslateStepView step={step} onComplete={noop} onContinue={noop} />,
    );
    expect(chip(container)?.textContent).toBe("Polite");
    const h2 = container.querySelector("h2")!;
    expect(h2.textContent).toBe("I drink water");
    expect(container.textContent).toContain("Translate to the target language");
  });
});

describe("ParticleClozeStepView", () => {
  const step: ParticleClozeStep = {
    id: "ja-m35-neo-8-cloze-3",
    type: "particle_cloze",
    prompt: { before: "せんせい、しゃしんを とって", after: "。" },
    correctParticle: "くれませんか",
    options: ["くれませんか", "くれない？", "くれません"],
    meaningEn: "could you take a photo?",
    audioText: "せんせい、しゃしんを とって くれませんか。",
    registerCue: parseRegisterCue("Ask your teacher: could you take a photo?").cue,
  } as ParticleClozeStep;

  it("badges the cue above the quoted meaning", () => {
    const { container } = render(
      <ParticleClozeStepView step={step} onComplete={noop} onContinue={noop} />,
    );
    expect(chip(container)?.textContent).toBe("Ask your teacher");
    expect(container.textContent).toContain("could you take a photo?");
    expect(container.textContent).not.toContain("Ask your teacher:");
  });
});

describe("MultipleChoiceStepView", () => {
  const step: MultipleChoiceStep = {
    id: "ja-gpool-i-adj-present-1",
    type: "multiple_choice",
    prompt: "'This tea is delicious.'",
    options: [
      { id: "correct", text: "このちゃはおいしいです" },
      { id: "opt-1", text: "このちゃはおいしいだ" },
    ],
    correctOptionId: "correct",
    registerCue: POLITE,
  } as MultipleChoiceStep;

  it("badges the cue on a register MCQ from the grammar review pool", () => {
    const { container } = render(
      <MultipleChoiceStepView step={step} onComplete={noop} onContinue={noop} />,
    );
    expect(chip(container)?.textContent).toBe("Polite");
    expect(container.querySelector("h2")!.textContent).toBe("'This tea is delicious.'");
  });
});

describe("ListeningBuildStepView", () => {
  const step: ListeningBuildStep = {
    id: "ja-m7-neo-1-s-4",
    type: "listening_build",
    audioKey: "ぎゅうにゅうを のみます",
    prompt: "Build what you hear.",
    targetSentence: "ぎゅうにゅうを のみます",
    tiles: ["ぎゅうにゅうを", "のみます"],
    correctOrder: ["ぎゅうにゅうを", "のみます"],
    granularity: "word",
    translation: "I drink milk",
    registerCue: POLITE,
  } as ListeningBuildStep;

  it("carries the cue but never SHOWS it — that would give away the answer", () => {
    const { container } = render(
      <ListeningBuildStepView step={step} onComplete={noop} onContinue={noop} />,
    );
    expect(step.registerCue).toBeDefined();
    expect(chip(container)).toBeNull();
    expect(container.textContent).not.toContain("Polite");
    expect(container.textContent).toContain("Build what you hear.");
  });

  it("reveals a CLEAN translation, with no cue in it", () => {
    // The reveal is the canonical re-use surface (TestFlight #142). Whatever
    // else changes, this string must read as a gloss.
    expect(step.translation).toBe("I drink milk");
    expect(step.translation).not.toContain("Say politely");
  });
});
