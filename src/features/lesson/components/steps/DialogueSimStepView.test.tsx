/**
 * `dialogue_sim` happy path + the two contracts most likely to regress:
 *
 *  1. The scenario runs turn by turn and reports ONE result — correct only if
 *     every turn was right (one step = one scenario).
 *  2. Max-acceptance is live end-to-end: an also-correct option and an
 *     alternative build rendering both grade as wins, with no correction.
 *  3. Layout stability (CLAUDE.md): the verdict banner renders INSIDE the
 *     transcript's scroll area, so committing cannot move the reply options
 *     or the CTA. happy-dom does no layout, so the structural containment is
 *     the assertable form of "nothing moves on submit".
 *
 * Mocking follows DialogueListenStepView.test: i18n, TTS and AnnotatedText
 * are stubbed because none of them is what is under test, and AnnotatedText
 * pulls in Settings/Language context this test does not stand up.
 */
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup, within } from "@testing-library/react";
import type { DialogueSimStep } from "../../types";

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

const playJaAudioToEnd = vi.fn((_text: string, _lang?: string) =>
  Promise.resolve(),
);
const getTtsUrl = vi.fn((_text: string, _lang?: string): string | null =>
  "https://example.test/audio.mp3",
);
vi.mock("@/shared/tts", () => ({
  getTtsUrl: (...args: Parameters<typeof getTtsUrl>) => getTtsUrl(...args),
  playJaAudioToEnd: (...args: Parameters<typeof playJaAudioToEnd>) =>
    playJaAudioToEnd(...args),
}));

vi.mock("@/shared/contexts/SettingsContext", () => ({
  useSettings: () => ({
    settings: {
      // silentMode: no autoplay — the test drives playback explicitly.
      audio: { silentMode: true },
      accessibility: { reducedMotion: true },
    },
  }),
}));

vi.mock("@/shared/readingAnnotation/AnnotatedText", () => ({
  AnnotatedText: ({ text }: { text: string }) => <>{text}</>,
}));

import { DialogueSimStepView, npcLineHasAudio } from "./DialogueSimStepView";

afterEach(() => {
  cleanup();
  playJaAudioToEnd.mockClear();
  playJaAudioToEnd.mockImplementation(() => Promise.resolve());
  getTtsUrl.mockClear();
  getTtsUrl.mockImplementation(() => "https://example.test/audio.mp3");
});

/** Two turns — one build, one choice — which is enough to exercise both reply
 *  modes, the advance, and the single end-of-scenario report. */
function makeStep(overrides: Partial<DialogueSimStep> = {}): DialogueSimStep {
  return {
    id: "sim-test",
    type: "dialogue_sim",
    scene: { emoji: "🏪", title: "コンビニ", setting: "Buying one drink." },
    turns: [
      {
        id: "t1",
        npc: {
          speaker: "てんいん",
          kana: "いらっしゃいませ。",
          audioText: "いらっしゃいませ",
          gloss: "Welcome!",
        },
        goal: "Say “this one, please.”",
        reply: {
          mode: "build",
          tiles: ["これを", "ください", "あれを", "おねがいします"],
          answer: "これを ください",
          alsoAccepted: ["これを おねがいします"],
        },
        replyGloss: "This one, please.",
      },
      {
        id: "t2",
        npc: { speaker: "てんいん", kana: "ふくろは いりますか。", gloss: "Bag?" },
        goal: "Turn the bag down.",
        reply: {
          mode: "choice",
          options: [
            { id: "kekkou", text: "いいえ、けっこうです" },
            { id: "daijoubu", text: "だいじょうぶです" },
            { id: "onegai", text: "はい、おねがいします" },
          ],
          correctOptionId: "kekkou",
          alsoCorrectOptionIds: ["daijoubu"],
        },
      },
    ],
    ...overrides,
  };
}

const check = () => fireEvent.click(screen.getByRole("button", { name: "Check" }));
const tile = (name: string) =>
  fireEvent.click(screen.getByRole("button", { name }));

describe("DialogueSimStepView", () => {
  it("frames the scene and opens on the first turn only", () => {
    render(
      <DialogueSimStepView step={makeStep()} onComplete={vi.fn()} onContinue={vi.fn()} />,
    );
    expect(screen.getByText("コンビニ")).toBeTruthy();
    expect(screen.getByText("Buying one drink.")).toBeTruthy();
    expect(screen.getByTestId("sim-turn-progress").textContent).toBe(
      "Turn 1 of 2",
    );
    expect(screen.getByText("いらっしゃいませ。")).toBeTruthy();
    // Turn 2's line does not exist yet — the transcript grows with the
    // conversation instead of showing every line up front.
    expect(screen.queryByText("ふくろは いりますか。")).toBeNull();
    expect(screen.getByText("Say “this one, please.”")).toBeTruthy();
  });

  it("builds a reply, grades it, advances, and reports one clean result", () => {
    const onComplete = vi.fn();
    const onContinue = vi.fn();
    render(
      <DialogueSimStepView
        step={makeStep()}
        onComplete={onComplete}
        onContinue={onContinue}
      />,
    );

    // Check is held until the learner has produced something.
    expect(
      screen.getByRole("button", { name: "Check" }).hasAttribute("disabled"),
    ).toBe(true);

    tile("これを");
    tile("ください");
    check();

    // The learner's words enter the transcript as their own bubble.
    const bubble = screen.getByTestId("learner-bubble-0");
    expect(bubble.textContent).toContain("これを ください");
    expect(bubble.className).toMatch(/border-success/);
    expect(screen.getByRole("alert").textContent).toContain("Correct!");
    // One scenario = one result: nothing is reported mid-scenario.
    expect(onComplete).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    expect(screen.getByTestId("sim-turn-progress").textContent).toBe(
      "Turn 2 of 2",
    );
    expect(screen.getByText("ふくろは いりますか。")).toBeTruthy();
    // The finished turn stays in the transcript — the exchange accumulates.
    expect(screen.getByTestId("npc-bubble-0")).toBeTruthy();

    tile("いいえ、けっこうです");
    check();

    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(onComplete).toHaveBeenCalledWith("sim-test", true);

    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    expect(onContinue).toHaveBeenCalledTimes(1);
  });

  it("accepts an ALSO-correct option as a clean win (max-acceptance)", () => {
    const onComplete = vi.fn();
    render(
      <DialogueSimStepView
        step={makeStep()}
        onComplete={onComplete}
        onContinue={vi.fn()}
      />,
    );
    // Turn 1 via the alternative rendering — also fully correct.
    tile("これを");
    tile("おねがいします");
    check();
    expect(screen.getByRole("alert").textContent).toContain("Correct!");
    fireEvent.click(screen.getByRole("button", { name: "Next" }));

    tile("だいじょうぶです");
    check();
    expect(screen.getByRole("alert").textContent).toContain("Correct!");
    expect(onComplete).toHaveBeenCalledWith("sim-test", true);
  });

  it("shows the model reply on a miss and reports the scenario as missed", () => {
    const onComplete = vi.fn();
    render(
      <DialogueSimStepView
        step={makeStep()}
        onComplete={onComplete}
        onContinue={vi.fn()}
      />,
    );
    tile("あれを");
    tile("ください");
    check();

    const banner = screen.getByRole("alert");
    expect(banner.textContent).toContain("Not quite");
    expect(banner.textContent).toContain("これを ください");
    const bubble = screen.getByTestId("learner-bubble-0");
    expect(bubble.className).toMatch(/border-error/);
    // The model answer also sits in the transcript, next to what they said.
    expect(bubble.textContent).toContain("これを ください");

    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    tile("いいえ、けっこうです");
    check();
    expect(onComplete).toHaveBeenCalledWith("sim-test", false);
  });

  it("keeps the verdict banner inside the scroll area so options + CTA cannot move", () => {
    render(
      <DialogueSimStepView step={makeStep()} onComplete={vi.fn()} onContinue={vi.fn()} />,
    );
    tile("これを");
    tile("ください");
    check();
    const banner = screen.getByRole("alert");
    const scroller = screen.getByTestId("npc-bubble-0").parentElement
      ?.parentElement as HTMLElement;
    expect(scroller.className).toMatch(/overflow-y-auto/);
    expect(scroller.contains(banner)).toBe(true);
    // Nothing that grows on commit lives above the reply zone or the CTA.
    expect(within(scroller).queryByRole("button", { name: "Next" })).toBeNull();
  });

  it("plays the tapped NPC line in the speaker's voice", () => {
    render(
      <DialogueSimStepView step={makeStep()} onComplete={vi.fn()} onContinue={vi.fn()} />,
    );
    const bubble = screen.getByTestId("npc-bubble-0");
    fireEvent.click(within(bubble).getByRole("button", { name: "Play audio" }));
    // てんいん is a neutral label → default corpus, raw clip, no voice color.
    expect(playJaAudioToEnd).toHaveBeenCalledWith("いらっしゃいませ", undefined);
  });

  it("disables the play button for a line with no clip", () => {
    getTtsUrl.mockImplementation((text: string) =>
      text.includes("ふくろ") ? null : "https://example.test/audio.mp3",
    );
    const step = makeStep();
    render(
      <DialogueSimStepView
        step={{ ...step, turns: [step.turns[1]] }}
        onComplete={vi.fn()}
        onContinue={vi.fn()}
      />,
    );
    const bubble = screen.getByTestId("npc-bubble-0");
    expect(
      within(bubble)
        .getByRole("button", { name: "Play audio" })
        .hasAttribute("disabled"),
    ).toBe(true);
  });

  describe("listen-first mode", () => {
    it("masks the line until it is heard, and reveals it on the escape tap", () => {
      render(
        <DialogueSimStepView
          step={makeStep({ listenFirst: true })}
          onComplete={vi.fn()}
          onContinue={vi.fn()}
        />,
      );
      expect(screen.queryByText("いらっしゃいませ。")).toBeNull();
      fireEvent.click(
        screen.getByRole("button", { name: "🔊 Listen · show text" }),
      );
      expect(screen.getByText("いらっしゃいませ。")).toBeTruthy();
    });

    it("does NOT mask a line with no clip — silence must never be a wall", () => {
      getTtsUrl.mockImplementation(() => null);
      render(
        <DialogueSimStepView
          step={makeStep({ listenFirst: true })}
          onComplete={vi.fn()}
          onContinue={vi.fn()}
        />,
      );
      expect(screen.getByText("いらっしゃいませ。")).toBeTruthy();
    });
  });
});

describe("npcLineHasAudio", () => {
  it("accepts a whole-line clip", () => {
    expect(npcLineHasAudio("いらっしゃいませ")).toBe(true);
  });

  it("accepts a two-sentence line that only has per-sentence clips", () => {
    // This is the case a naive whole-line check gets wrong: playLineAudio
    // chains the sentences, so the play button must NOT be disabled.
    getTtsUrl.mockImplementation((text: string) =>
      text === "はい。ありがとうございます。"
        ? null
        : "https://example.test/audio.mp3",
    );
    expect(npcLineHasAudio("はい。ありがとうございます。")).toBe(true);
  });

  it("reports no audio when neither the line nor its sentences exist", () => {
    getTtsUrl.mockImplementation(() => null);
    expect(npcLineHasAudio("ふくろは いりますか。")).toBe(false);
  });
});
