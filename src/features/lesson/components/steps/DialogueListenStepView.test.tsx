/**
 * DialogueListenStepView contract for the 2026-07-16 pacing + transcript
 * polish (Spencer QA: "slowing the tts speed a bit might be helpful, and
 * then a better view of the active and previous transcript line"):
 *
 *  - `langForSpeaker` routes male-named speakers to the real Keita voice
 *    corpus (`ja-keita:` manifest keys); no detune/rate processing exists
 *    anymore — clips play raw (Spencer 2026-07-19).
 *  - `lineStatus` classifies each transcript row as active / played /
 *    upcoming, which drives the highlight/dim treatment.
 *  - The rendered transcript reflects that classification, and a per-line
 *    tap highlights the tapped row while its clip plays.
 *
 * i18n + TTS + AnnotatedText are mocked (same reason TestRunner.test stubs
 * the real step views — AnnotatedText pulls in Settings/Language context
 * this test doesn't stand up, and none of that context is what's under
 * test here).
 */
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup, within } from "@testing-library/react";
import type { DialogueListenStep } from "../../types";

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
const getTtsUrl = vi.fn(() => "https://example.test/audio.mp3");

// The real registry pulls the entire language-module graph (curriculum,
// lessonBuilder, TTS at import time) into this light component test, and
// the REAL ja roster is pinned by ja/__tests__/dialogueSpeakerRegistry.
// Here we mock the capability lookup and test the routing LOGIC.
vi.mock("@/shared/language/registry", () => ({
  tryGetLanguageModule: (id: string) =>
    id === "ja"
      ? {
          dialogueVoices: {
            maleSpeakers: new Set(["Tom", "Ken", "Tanaka", "トム"]),
            maleVoiceLang: "ja-keita",
          },
        }
      : null,
}));

vi.mock("@/shared/contexts/LanguageContext", () => ({
  useLanguage: () => ({ language: { id: "ja" } }),
}));

vi.mock("@/shared/tts", () => ({
  getTtsUrl: (...args: Parameters<typeof getTtsUrl>) => getTtsUrl(...args),
  playJaAudioToEnd: (...args: Parameters<typeof playJaAudioToEnd>) =>
    playJaAudioToEnd(...args),
}));

vi.mock("@/shared/contexts/SettingsContext", () => ({
  useSettings: () => ({
    settings: {
      audio: { silentMode: true },
      accessibility: { reducedMotion: false },
    },
  }),
}));

vi.mock("@/shared/readingAnnotation/AnnotatedText", () => ({
  AnnotatedText: ({ text }: { text: string }) => <>{text}</>,
}));

// Same seam ListeningComprehensionStepView.test.tsx uses (and
// LearnHomeSwitch.test.tsx before it): mock the shared predicate module
// rather than depend on happy-dom's matchMedia, so each test controls
// touch/desktop explicitly.
const pointer = { coarse: false };
vi.mock("@/shared/platform/formFactor", () => ({
  useFormFactor: () => ({
    coarsePointer: pointer.coarse,
    tabletPortrait: false,
    landscapeLg: !pointer.coarse,
    landscapeDesktopTouch: false,
    forceVerticalLearnMap: pointer.coarse,
  }),
}));

import {
  DialogueListenStepView,
  langForSpeaker,
  lineStatus,
  splitJaSentences,
  playLineAudio,
} from "./DialogueListenStepView";

afterEach(() => {
  cleanup();
  playJaAudioToEnd.mockClear();
  playJaAudioToEnd.mockImplementation(() => Promise.resolve());
  getTtsUrl.mockClear();
  getTtsUrl.mockImplementation(() => "https://example.test/audio.mp3");
  pointer.coarse = false;
});

function makeStep(): DialogueListenStep {
  return {
    id: "dl-test",
    type: "dialogue_listen",
    lines: [
      { speaker: "Stranger", kana: "こんにちは" },
      { speaker: "You", kana: "こんばんは" },
    ],
    questions: [
      {
        id: "q1",
        prompt: "What did the stranger say?",
        options: [
          { id: "a", text: "Hello" },
          { id: "b", text: "Goodbye" },
        ],
        correctOptionId: "a",
      },
    ],
    transcriptRevealAfter: "first-answer",
  };
}

/** TestFlight #195 shape: m34-neo-review-2's "けっこん" dialogue, 4 authored options. */
function makeFourOptionStep(): DialogueListenStep {
  return {
    id: "ja-m34-neo-review-2-dlg-10",
    type: "dialogue_listen",
    lines: [
      { speaker: "Mika", kana: "しょうらい、なにを しようと おもう？" },
      { speaker: "Tom", kana: "かいしゃで はたらこうと おもう。" },
      { speaker: "Mika", kana: "わたしは けっこんすることになった。" },
    ],
    questions: [
      {
        id: "q0",
        prompt: "What does Mika say has been decided?",
        options: [
          { id: "opt-1", text: "She's quitting her job" },
          { id: "opt-2", text: "She's moving to America" },
          { id: "opt-3", text: "She's starting to save" },
          { id: "correct", text: "She's getting married" },
        ],
        correctOptionId: "correct",
      },
    ],
    transcriptRevealAfter: "first-answer",
  };
}

async function revealTranscript() {
  fireEvent.click(screen.getByRole("button", { name: "Hello" }));
  fireEvent.click(screen.getByRole("button", { name: "Check" }));
  return screen.findByText("Transcript");
}

describe("splitJaSentences", () => {
  it("splits on 。 keeping each sentence's terminator", () => {
    expect(splitJaSentences("わたしは トムだ。がくせいだ。")).toEqual([
      "わたしは トムだ。",
      "がくせいだ。",
    ]);
  });

  it("keeps ？ attached (contour is the content)", () => {
    expect(splitJaSentences("トムは がくせい？うん、がくせいだ。")).toEqual([
      "トムは がくせい？",
      "うん、がくせいだ。",
    ]);
  });

  it("returns a single-sentence line as-is", () => {
    expect(splitJaSentences("こんにちは")).toEqual(["こんにちは"]);
  });
});

describe("langForSpeaker", () => {
  it("routes male-named speakers to the Keita corpus for ja", () => {
    expect(langForSpeaker("Tom", "ja")).toBe("ja-keita");
    expect(langForSpeaker("Ken", "ja")).toBe("ja-keita");
    expect(langForSpeaker("Tanaka", "ja")).toBe("ja-keita");
  });
  it("leaves everyone else on the course default", () => {
    expect(langForSpeaker("Mika", "ja")).toBeUndefined();
    expect(langForSpeaker("Stranger", "ja")).toBeUndefined();
    expect(langForSpeaker(undefined, "ja")).toBeUndefined();
  });
  it("is roster-per-language: a ja male name does NOT route for es/fr/unknown", () => {
    // Until a language declares the dialogueVoices capability, all of its
    // speakers play the course-default voice — the JA roster must not leak
    // (2026-08-19 audit: ES dialogues routed voices through the JA roster).
    expect(langForSpeaker("Tom", "es")).toBeUndefined();
    expect(langForSpeaker("Tom", "fr")).toBeUndefined();
    expect(langForSpeaker("Tom", undefined)).toBeUndefined();
    expect(langForSpeaker("Tom", "nope")).toBeUndefined();
  });
});

describe("playLineAudio", () => {
  it("chains per-sentence clips in the speaker's voice, no pitch processing", async () => {
    await playLineAudio("わたしは トムだ。がくせいだ。", "ja-keita");
    expect(playJaAudioToEnd.mock.calls).toEqual([
      ["わたしは トムだ。", "ja-keita"],
      ["がくせいだ。", "ja-keita"],
    ]);
  });

  it("falls back to the default corpus when the voice lacks the clips", async () => {
    getTtsUrl.mockImplementation(((_t: string, lang?: string) =>
      lang === "ja-keita" ? null : "https://example.test/a.mp3") as never);
    await playLineAudio("わたしは トムだ。がくせいだ。", "ja-keita");
    expect(playJaAudioToEnd.mock.calls).toEqual([
      ["わたしは トムだ。", undefined],
      ["がくせいだ。", undefined],
    ]);
  });

  it("falls back to the whole-line clip when a sentence clip is missing", async () => {
    getTtsUrl.mockImplementation(((t: string) =>
      t === "がくせいだ。" ? null : "https://example.test/a.mp3") as never);
    await playLineAudio("わたしは トムだ。がくせいだ。");
    expect(playJaAudioToEnd).toHaveBeenCalledTimes(1);
    expect(playJaAudioToEnd).toHaveBeenCalledWith(
      "わたしは トムだ。がくせいだ。",
      undefined,
    );
  });

  it("aborts between sentences when the guard goes stale", async () => {
    let alive = true;
    playJaAudioToEnd.mockImplementation(() => {
      alive = false; // goes stale during the first sentence
      return Promise.resolve();
    });
    await playLineAudio("わたしは トムだ。がくせいだ。", undefined, () => alive);
    expect(playJaAudioToEnd).toHaveBeenCalledTimes(1);
  });
});

describe("lineStatus", () => {
  it("marks the currently-active index active even if it was already played", () => {
    expect(lineStatus(1, 1, new Set([0, 1]))).toBe("active");
  });

  it("marks a previously-played, not-currently-active index as played", () => {
    expect(lineStatus(0, 1, new Set([0, 1]))).toBe("played");
  });

  it("marks a never-played, not-active index as upcoming", () => {
    expect(lineStatus(2, 1, new Set([0, 1]))).toBe("upcoming");
  });

  it("treats everything as upcoming before anything has played", () => {
    expect(lineStatus(0, null, new Set())).toBe("upcoming");
  });
});

describe("DialogueListenStepView transcript", () => {
  it("shows the transcript panel immediately, before any answer", () => {
    render(
      <DialogueListenStepView step={makeStep()} onComplete={vi.fn()} onContinue={vi.fn()} />,
    );
    expect(screen.getByText("Transcript")).toBeTruthy();
  });

  it("blurs a not-yet-heard line, un-blurs it once it plays", async () => {
    render(
      <DialogueListenStepView step={makeStep()} onComplete={vi.fn()} onContinue={vi.fn()} />,
    );
    const lineText = screen.getByText("こんにちは");
    expect(lineText.className).toMatch(/blur/);

    const row = lineText.closest("div") as HTMLElement;
    fireEvent.click(within(row).getByRole("button", { name: "Play audio" }));
    expect(screen.getByText("こんにちは").className).not.toMatch(/blur/);
    // The other, still-unheard line stays masked.
    expect(screen.getByText("こんばんは").className).toMatch(/blur/);
  });

  it("un-blurs unheard lines after the first answer commits", async () => {
    render(
      <DialogueListenStepView step={makeStep()} onComplete={vi.fn()} onContinue={vi.fn()} />,
    );
    await revealTranscript();
    expect(screen.getByText("こんにちは").className).not.toMatch(/blur/);
    expect(screen.getByText("こんばんは").className).not.toMatch(/blur/);
  });

  it("plays lines raw — no voice-color object passed to playback", async () => {
    render(
      <DialogueListenStepView step={makeStep()} onComplete={vi.fn()} onContinue={vi.fn()} />,
    );
    const row = screen.getByText("こんばんは").closest("div") as HTMLElement;
    fireEvent.click(within(row).getByRole("button", { name: "Play audio" }));
    expect(playJaAudioToEnd).toHaveBeenCalledWith("こんばんは", undefined);
  });

  it("dims a line that has never played and keeps a played line readable", async () => {
    render(
      <DialogueListenStepView step={makeStep()} onComplete={vi.fn()} onContinue={vi.fn()} />,
    );
    // silentMode: true → no auto-play, so nothing has played yet when the
    // transcript first reveals.
    await revealTranscript();

    const strangerRow = screen.getByText("こんにちは").closest("div");
    const youRow = screen.getByText("こんばんは").closest("div");
    expect(strangerRow?.className).toMatch(/opacity-45/);
    expect(youRow?.className).toMatch(/opacity-45/);
  });

  it("highlights the tapped line as active while it plays, then clears it", async () => {
    let resolvePlay: () => void = () => {};
    playJaAudioToEnd.mockImplementationOnce(
      () => new Promise<void>((resolve) => (resolvePlay = resolve)),
    );

    render(
      <DialogueListenStepView step={makeStep()} onComplete={vi.fn()} onContinue={vi.fn()} />,
    );
    await revealTranscript();

    const strangerRow = screen.getByText("こんにちは").closest("div") as HTMLElement;
    const playButtons = within(strangerRow).getAllByRole("button", { name: "Play audio" });
    fireEvent.click(playButtons[0]);

    expect(strangerRow.className).toMatch(/border-accent/);
    expect(strangerRow.className).not.toMatch(/opacity-45/);

    resolvePlay();
    await screen.findByText("こんにちは"); // let the resolved microtask flush
    expect(strangerRow.className).not.toMatch(/border-accent bg-accent-muted/);
  });

});

describe("DialogueListenStepView question options — Tile primitive (review P2)", () => {
  it("renders the question options inside a single-column grid TileTray as size=row option Tiles", () => {
    const { container } = render(
      <DialogueListenStepView step={makeStep()} onComplete={vi.fn()} onContinue={vi.fn()} />,
    );
    const tray = container.querySelector('[data-tile-tray][data-kind="grid"]')!;
    expect(tray).toBeTruthy();
    expect(tray.getAttribute("data-cols")).toBeNull(); // cols=1 -> no [data-cols] attr
    const tiles = tray.querySelectorAll('[data-tile][data-variant="option"][data-size="row"]');
    expect(tiles).toHaveLength(2);
  });

  // b28 #195 residual (2026-09-17 report, closed by lane SMALLREDS item C):
  // at 125% font scale on a 3-line-transcript question, the options tray
  // visually overlapped the CTA. Root cause: this TileTray is a flex item
  // in DialogueListenStepView's `flex-col` root alongside the transcript
  // (the ONLY region meant to shrink, per the component's own "the
  // question, the options and the CTA are not negotiable" comment) — but
  // unlike the heading and CTA blocks (both `shrink-0`), this tray carried
  // no `shrink-0`, so under space pressure flexbox shrank it down to its
  // `style={{ minHeight: 120 }}` floor. Its option Tile children don't
  // compress with it, so they painted past the shrunk 120px box
  // (`overflow: visible`, CSS Grid default) — 43px behind the CTA,
  // confirmed with `getBoundingClientRect()` in Chromium touch+mobile
  // emulation, then on the 15 Pro Max simulator at 100%/125%. Asserting
  // the class here is a cheap regression guard; the layout claim itself
  // is proven by the Chromium/simulator measurements in the lane report,
  // not by jsdom (which has no real layout engine — C1).
  it("the options TileTray carries shrink-0 — it must never flex-shrink below its content (#195 125% overlap residual)", () => {
    const { container } = render(
      <DialogueListenStepView step={makeStep()} onComplete={vi.fn()} onContinue={vi.fn()} />,
    );
    const tray = container.querySelector('[data-tile-tray][data-kind="grid"]')!;
    expect(tray.className).toMatch(/\bshrink-0\b/);
  });

  it("maps pick → commit to Tile data-state (selected, then correct/wrong)", () => {
    render(
      <DialogueListenStepView step={makeStep()} onComplete={vi.fn()} onContinue={vi.fn()} />,
    );
    const wrongBtn = screen.getByRole("button", { name: "Goodbye" });
    const rightBtn = screen.getByRole("button", { name: "Hello" });
    fireEvent.click(wrongBtn);
    expect(wrongBtn.getAttribute("data-state")).toBe("selected");
    fireEvent.click(screen.getByRole("button", { name: "Check" }));
    expect(wrongBtn.getAttribute("data-state")).toBe("wrong");
    expect(rightBtn.getAttribute("data-state")).toBe("correct");
    // The revealed-correct option keeps this view's own accent-muted tint
    // (not the primitive's default solid accent fill) via the disclosed
    // `!`-important override.
    expect(rightBtn.className).toContain("!bg-accent-muted");
  });

  it("options lock (disabled) after commit", () => {
    render(
      <DialogueListenStepView step={makeStep()} onComplete={vi.fn()} onContinue={vi.fn()} />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Hello" }));
    fireEvent.click(screen.getByRole("button", { name: "Check" }));
    expect(screen.getByRole("button", { name: "Hello" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Goodbye" })).toBeDisabled();
  });
});

describe("DialogueListenStepView embedded question — phone option cap (#195)", () => {
  afterEach(() => {
    pointer.coarse = false;
  });

  it("desktop (compact=false) renders every authored option, unchanged", () => {
    pointer.coarse = false;
    render(
      <DialogueListenStepView step={makeFourOptionStep()} onComplete={vi.fn()} onContinue={vi.fn()} />,
    );
    const tray = document.querySelector('[data-tile-tray][data-kind="grid"]')!;
    expect(tray.querySelectorAll('[data-tile][data-variant="option"]')).toHaveLength(4);
    // Every authored option text is on screen, nothing silently dropped.
    for (const text of [
      "She's getting married",
      "She's quitting her job",
      "She's moving to America",
      "She's starting to save",
    ]) {
      expect(screen.getByRole("button", { name: text })).toBeInTheDocument();
    }
  });

  it("touch (compact=true) caps a 4-option dialogue question at MAX_LISTENING_MCQ_OPTIONS (3), never clipping unrendered", () => {
    pointer.coarse = true;
    render(
      <DialogueListenStepView step={makeFourOptionStep()} onComplete={vi.fn()} onContinue={vi.fn()} />,
    );
    const tray = document.querySelector('[data-tile-tray][data-kind="grid"]')!;
    const tiles = tray.querySelectorAll('[data-tile][data-variant="option"]');
    expect(tiles).toHaveLength(3);
    // The correct option always survives the trim — the learner is never
    // shown an unanswerable question.
    expect(screen.getByRole("button", { name: "She's getting married" })).toBeInTheDocument();
  });

  it("touch: the answer is still gradeable — picking and checking the correct (kept) option commits correct", () => {
    pointer.coarse = true;
    const onComplete = vi.fn();
    render(
      <DialogueListenStepView step={makeFourOptionStep()} onComplete={onComplete} onContinue={vi.fn()} />,
    );
    fireEvent.click(screen.getByRole("button", { name: "She's getting married" }));
    fireEvent.click(screen.getByRole("button", { name: "Check" }));
    expect(onComplete).toHaveBeenCalledWith("ja-m34-neo-review-2-dlg-10", true);
  });

  it("a 2-option question (below the cap) is untouched by compact mode", () => {
    pointer.coarse = true;
    render(
      <DialogueListenStepView step={makeStep()} onComplete={vi.fn()} onContinue={vi.fn()} />,
    );
    const tray = document.querySelector('[data-tile-tray][data-kind="grid"]')!;
    expect(tray.querySelectorAll('[data-tile][data-variant="option"]')).toHaveLength(2);
  });
});
