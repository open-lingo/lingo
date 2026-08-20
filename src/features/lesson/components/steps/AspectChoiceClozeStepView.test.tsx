/**
 * AspectChoiceClozeStepView contract.
 *
 * The step's premise is that BOTH options are well-formed Spanish and only the
 * surrounding narrative picks one, so the tests below check the things that
 * premise depends on:
 *   · the step's boolean is all-or-nothing even though each blank is judged and
 *     reported separately — 3 of 4 is not a pass;
 *   · every blank's `reason` is shown after Check, including for the ones the
 *     learner got right, because a lucky guess on a two-way choice has learned
 *     nothing;
 *   · nothing pre-commit may say which form wins — not a chip tone, not a
 *     reason row;
 *   · the narrative audio is a post-commit reward AND is cancelled on unmount,
 *     so a step that is left early cannot speak over the next one.
 * i18n + TTS are mocked, same as SilentLetterStepView.test.
 */
import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";
import { render, screen, fireEvent, cleanup, act } from "@testing-library/react";
import type { AspectChoiceClozeStep } from "../../types";

const tts = vi.hoisted(() => ({
  playJaAudio: vi.fn(),
  getTtsUrl: vi.fn((_text: string): string | null => "https://cdn.example/story.mp3"),
}));

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (
      key: string,
      def?: string | Record<string, unknown>,
      opts?: Record<string, unknown>,
    ) => {
      const template = typeof def === "string" ? def : key;
      const vars = (typeof def === "object" ? def : opts) ?? {};
      return template.replace(/\{\{(\w+)\}\}/g, (_, k: string) =>
        String(vars[k] ?? ""),
      );
    },
  }),
}));
vi.mock("@/shared/tts", () => tts);

import { AspectChoiceClozeStepView } from "./AspectChoiceClozeStepView";

beforeEach(() => {
  vi.useFakeTimers();
  tts.playJaAudio.mockClear();
  tts.getTtsUrl.mockReturnValue("https://cdn.example/story.mp3");
});

afterEach(() => {
  vi.useRealTimers();
  cleanup();
});

/** Two background clauses and one foreground event — the contrast the step
 *  needs to be answerable at all. */
function makeStep(
  overrides: Partial<AspectChoiceClozeStep> = {},
): AspectChoiceClozeStep {
  return {
    id: "acc-test",
    type: "aspect_choice_cloze",
    prompt: "Choose the form that fits the story",
    meaningEn: "When I was a child I lived in Madrid. One morning I found a wallet.",
    segments: [
      { text: "Cuando " },
      {
        blank: {
          id: "a1",
          lemma: "ser",
          options: ["era", "fui"],
          correctAnswer: "era",
          reason: "Background — the setting, not an event in it.",
        },
      },
      { text: " niño, " },
      {
        blank: {
          id: "a2",
          lemma: "vivir",
          options: ["vivía", "viví"],
          correctAnswer: "vivía",
          reason: "An ongoing state, no start or end in view.",
        },
      },
      { text: " en Madrid. Una mañana, " },
      {
        blank: {
          id: "a3",
          lemma: "encontrar",
          options: ["encontraba", "encontré"],
          correctAnswer: "encontré",
          reason: "Foreground — one finished event that moves the story on.",
        },
      },
      { text: " una cartera." },
    ],
    audioText: "Cuando era niño, vivía en Madrid. Una mañana, encontré una cartera.",
    ...overrides,
  };
}

const cta = () => screen.getByTestId("primary-cta").querySelector("button")!;
const option = (text: string) => screen.getByRole("button", { name: text });
const reasonsText = () =>
  [...document.querySelectorAll("li")].map((li) => li.textContent).join(" | ");

function mount(step: AspectChoiceClozeStep = makeStep()) {
  const onComplete = vi.fn();
  const onContinue = vi.fn();
  const utils = render(
    <AspectChoiceClozeStepView step={step} onComplete={onComplete} onContinue={onContinue} />,
  );
  return { ...utils, onComplete, onContinue };
}

const fillAllCorrect = () => {
  fireEvent.click(option("era"));
  fireEvent.click(option("vivía"));
  fireEvent.click(option("encontré"));
};

describe("AspectChoiceClozeStepView", () => {
  it("keeps Check disabled until every blank is filled", () => {
    mount();
    expect(cta()).toBeDisabled();
    fireEvent.click(option("era"));
    fireEvent.click(option("vivía"));
    expect(cta()).toBeDisabled(); // one clause still open
    fireEvent.click(option("encontré"));
    expect(cta()).not.toBeDisabled();
  });

  it("grades the narrative all-or-nothing — 2 of 3 is not a pass", () => {
    const { onComplete } = mount();
    fireEvent.click(option("era"));
    fireEvent.click(option("vivía"));
    fireEvent.click(option("encontraba")); // foreground read as background
    fireEvent.click(cta());
    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(onComplete).toHaveBeenCalledWith("acc-test", false);
  });

  it("grades a fully correct narrative correct", () => {
    const { onComplete } = mount();
    fillAllCorrect();
    fireEvent.click(cta());
    expect(onComplete).toHaveBeenCalledWith("acc-test", true);
  });

  it("grades once and then hands the CTA to Continue", () => {
    const { onComplete, onContinue } = mount();
    fillAllCorrect();
    fireEvent.click(cta());
    fireEvent.click(cta());
    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(onContinue).toHaveBeenCalledTimes(1);
  });

  it("lets a blank be changed before Check and freezes every chip after it", () => {
    const { onComplete } = mount();
    fireEvent.click(option("fui"));
    fireEvent.click(option("era")); // same blank, other form
    expect(option("fui").getAttribute("aria-pressed")).toBe("false");
    fireEvent.click(option("vivía"));
    fireEvent.click(option("encontré"));
    fireEvent.click(cta());
    expect(onComplete).toHaveBeenCalledWith("acc-test", true);
    expect(option("fui")).toBeDisabled();
  });

  it("shows no verdict tone on any chip before Check", () => {
    mount();
    fireEvent.click(option("fui"));
    for (const text of ["era", "fui", "vivía", "viví", "encontraba", "encontré"]) {
      // A success tint on the right form is the whole answer, four times over.
      expect(option(text).className).not.toMatch(/border-success|border-error/);
    }
  });

  it("withholds every reason until commit, then shows one per blank", () => {
    mount();
    expect(document.body.textContent).not.toContain("Background —");
    expect(document.body.textContent).not.toContain("ongoing state");
    expect(document.body.textContent).not.toContain("Foreground —");
    fireEvent.click(option("era"));
    fireEvent.click(option("vivía"));
    fireEvent.click(option("encontraba"));
    fireEvent.click(cta());
    // Shown for the two they got right as well — the teaching payload, not a
    // correction list. On a two-way choice a right answer is often a guess.
    expect(reasonsText()).toContain("Background —");
    expect(reasonsText()).toContain("ongoing state");
    expect(reasonsText()).toContain("Foreground —");
    expect(document.querySelectorAll("li")).toHaveLength(3);
  });

  it("marks the right form success and the picked wrong one error, after commit", () => {
    mount();
    fireEvent.click(option("era"));
    fireEvent.click(option("vivía"));
    fireEvent.click(option("encontraba"));
    fireEvent.click(cta());
    expect(option("encontré").className).toMatch(/border-success/);
    expect(option("encontraba").className).toMatch(/border-error/);
    // The form they never touched is dimmed, not marked.
    expect(option("fui").className).toMatch(/opacity-60/);
  });

  it("keeps the two forms of a blank on one line", () => {
    mount();
    // The pair only means anything read side by side; the lemma outside the
    // row is what gives way first when the measure runs out.
    const pair = option("era").parentElement!;
    expect(pair.className).toMatch(/flex-nowrap/);
    expect(pair.textContent).toBe("erafui");
  });

  it("hides the verb label at submit as a GHOST, so the prose cannot re-wrap", () => {
    mount();
    const lemma = screen.getByText("ser");
    expect(lemma.className).not.toMatch(/\binvisible\b/);
    fillAllCorrect();
    fireEvent.click(cta());
    // It existed to say WHICH verb is being chosen; after Check it is clutter
    // around the answer — but it is INLINE, so removing it re-wraps the
    // paragraph and slides the graded chips sideways (measured 157px at
    // 375x667). Invisible keeps the metrics at no height cost.
    expect(screen.getByText("ser")).toBe(lemma);
    expect(lemma.className).toMatch(/\binvisible\b/);
    expect(lemma.getAttribute("aria-hidden")).toBe("true");
  });

  it("retires the English gloss at submit, from BELOW the story", () => {
    const { container } = mount();
    const gloss = screen.getByText(/When I was a child I lived in Madrid/);
    const prose = option("era").closest("div")!;
    // Below, not above: retiring something above the chips moves the chips.
    expect(prose.compareDocumentPosition(gloss) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    fillAllCorrect();
    fireEvent.click(cta());
    // Four reasons plus the gloss do not both fit a 390px phone's stage.
    expect(screen.queryByText(/When I was a child I lived in Madrid/)).toBeNull();
    expect(container).toBeTruthy();
  });

  it("changes nothing about the story panel's own box at submit", () => {
    const { container } = mount();
    // CLAUDE.md § "Lesson UI stability rules": the chips are the learner's
    // answer and must not move when it is graded. Every one of these used to
    // tighten on submit, together moving the chips up to 183.7px vertically
    // and 157.4px horizontally at 375x667.
    const panel = () => container.querySelector(".border-info\\/40")!;
    const prose = () => option("era").closest("div")!;
    const panelCls = panel().className;
    const proseCls = prose().className;
    fillAllCorrect();
    fireEvent.click(cta());
    expect(panel().className).toBe(panelCls);
    expect(prose().className).toBe(proseCls);
  });

  it("top-anchors the step instead of splitting the free space", () => {
    const { container } = mount();
    // `mt-auto` on the prompt centres a short narrative, but the split
    // collapses the moment the reasons land and takes the whole story with it.
    const prompt = screen.getByText("Choose the form that fits the story");
    expect(prompt.className).not.toMatch(/\bmt-auto\b/);
    // The CTA block keeps its own `mt-auto` — that is what pins it down.
    expect(container.querySelector('[data-testid="primary-cta"]')!.className).toMatch(/\bmt-auto\b/);
  });

  it("does not AUTOPLAY the narrative over a wrong answer", () => {
    mount();
    fireEvent.click(option("era"));
    fireEvent.click(option("vivía"));
    fireEvent.click(option("encontraba"));
    fireEvent.click(cta());
    act(() => void vi.advanceTimersByTime(500));
    // Autoplay is the reward beat; firing it on a miss speaks the corrected
    // story on top of the correction the learner is still reading. The replay
    // control is still offered — post-commit, hearing it is a choice.
    expect(tts.playJaAudio).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Play audio" }));
    expect(tts.playJaAudio).toHaveBeenCalledTimes(1);
  });

  it("plays it, and offers a replay, on a correct commit", () => {
    mount();
    fillAllCorrect();
    fireEvent.click(cta());
    expect(tts.playJaAudio).not.toHaveBeenCalled(); // 320ms settle first
    act(() => void vi.advanceTimersByTime(400));
    expect(tts.playJaAudio).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByRole("button", { name: "Play audio" }));
    expect(tts.playJaAudio).toHaveBeenCalledTimes(2);
  });

  it("cancels a pending play on unmount — the story must not bleed into the next step", () => {
    const { unmount } = mount();
    fillAllCorrect();
    fireEvent.click(cta());
    unmount(); // learner hit Continue inside the 320ms window
    act(() => void vi.advanceTimersByTime(500));
    expect(tts.playJaAudio).not.toHaveBeenCalled();
  });

  it("offers no audio control when the manifest has no clip", () => {
    tts.getTtsUrl.mockReturnValue(null);
    mount();
    fillAllCorrect();
    fireEvent.click(cta());
    act(() => void vi.advanceTimersByTime(500));
    expect(tts.playJaAudio).not.toHaveBeenCalled();
    expect(screen.queryByRole("button", { name: "Play audio" })).toBeNull();
  });

  it("renders no audio control when the step authored no audioText", () => {
    mount(makeStep({ audioText: undefined }));
    fillAllCorrect();
    fireEvent.click(cta());
    act(() => void vi.advanceTimersByTime(500));
    expect(tts.playJaAudio).not.toHaveBeenCalled();
  });

  it("keeps banner and CTA in one sticky bottom block", () => {
    mount();
    fireEvent.click(option("era"));
    fireEvent.click(option("vivía"));
    fireEvent.click(option("encontraba"));
    fireEvent.click(cta());
    expect(screen.getByTestId("primary-cta")).toContainElement(screen.getByRole("alert"));
  });
});
