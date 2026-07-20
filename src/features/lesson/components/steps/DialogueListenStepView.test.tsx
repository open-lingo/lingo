/**
 * DialogueListenStepView contract for the 2026-07-16 pacing + transcript
 * polish (Spencer QA: "slowing the tts speed a bit might be helpful, and
 * then a better view of the active and previous transcript line"):
 *
 *  - `pacedVoice` composes DIALOGUE_PACE onto a per-speaker VoiceColor's
 *    playbackRate only — detune (voice identity) is untouched, and it must
 *    compose multiplicatively (not clobber) with whatever rate a speaker
 *    already carries.
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

type MockVoice = { detuneCents?: number; playbackRate?: number };
const playJaAudioToEnd = vi.fn(
  (_text: string, _lang?: string, _voice?: MockVoice) => Promise.resolve(),
);
const getTtsUrl = vi.fn(() => "https://example.test/audio.mp3");
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

import {
  DialogueListenStepView,
  pacedVoice,
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

describe("playLineAudio", () => {
  it("chains per-sentence clips with the speaker's FIXED voice on every sentence", async () => {
    const voice = { detuneCents: -150, playbackRate: 0.9 };
    await playLineAudio("わたしは トムだ。がくせいだ。", voice);
    expect(playJaAudioToEnd.mock.calls.map((c) => c[0])).toEqual([
      "わたしは トムだ。",
      "がくせいだ。",
    ]);
    for (const call of playJaAudioToEnd.mock.calls) {
      expect(call[2]).toBe(voice);
    }
  });

  it("falls back to the whole-line clip when a sentence clip is missing", async () => {
    getTtsUrl.mockImplementation(((text: string) =>
      text === "がくせいだ。" ? null : "https://example.test/a.mp3") as never);
    await playLineAudio("わたしは トムだ。がくせいだ。", {});
    expect(playJaAudioToEnd).toHaveBeenCalledTimes(1);
    expect(playJaAudioToEnd).toHaveBeenCalledWith(
      "わたしは トムだ。がくせいだ。",
      undefined,
      {},
    );
  });

  it("aborts between sentences when the guard goes stale", async () => {
    let alive = true;
    playJaAudioToEnd.mockImplementation(() => {
      alive = false; // goes stale during the first sentence
      return Promise.resolve();
    });
    await playLineAudio("わたしは トムだ。がくせいだ。", {}, () => alive);
    expect(playJaAudioToEnd).toHaveBeenCalledTimes(1);
  });
});

describe("pacedVoice", () => {
  it("scales an existing playbackRate rather than overwriting it", () => {
    expect(pacedVoice({ playbackRate: 0.96, detuneCents: -300 }, 0.92)).toEqual({
      playbackRate: 0.96 * 0.92,
      detuneCents: -300,
    });
  });

  it("treats a missing playbackRate as 1 before pacing", () => {
    expect(pacedVoice({}, 0.92)).toEqual({ playbackRate: 0.92 });
  });

  it("leaves detune alone — pacing never touches pitch compensation", () => {
    const paced = pacedVoice({ detuneCents: 250, playbackRate: 1.04 }, 0.92);
    expect(paced.detuneCents).toBe(250);
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

  it("keeps speaker pitch coloring subtle (≤200 cents)", async () => {
    render(
      <DialogueListenStepView step={makeStep()} onComplete={vi.fn()} onContinue={vi.fn()} />,
    );
    // Second speaker (\"You\") carries the first non-neutral color.
    const row = screen.getByText("こんばんは").closest("div") as HTMLElement;
    fireEvent.click(within(row).getByRole("button", { name: "Play audio" }));
    const voice = playJaAudioToEnd.mock.calls[0][2];
    expect(Math.abs(voice?.detuneCents ?? 0)).toBeLessThanOrEqual(200);
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

  it("plays dialogue lines at the paced (slowed) rate, not the raw speaker rate", async () => {
    render(
      <DialogueListenStepView step={makeStep()} onComplete={vi.fn()} onContinue={vi.fn()} />,
    );
    await revealTranscript();

    const strangerRow = screen.getByText("こんにちは").closest("div") as HTMLElement;
    fireEvent.click(within(strangerRow).getByRole("button", { name: "Play audio" }));

    expect(playJaAudioToEnd).toHaveBeenCalledWith(
      "こんにちは",
      undefined,
      expect.objectContaining({ playbackRate: expect.any(Number) }),
    );
    const voice = playJaAudioToEnd.mock.calls[0][2];
    expect(voice?.playbackRate).toBeLessThan(1);
    expect(voice?.playbackRate).toBeGreaterThan(0.85);
  });
});
