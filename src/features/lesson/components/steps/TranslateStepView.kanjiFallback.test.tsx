/**
 * Two b30 TranslateStepView fixes sharing one mock harness (both need the
 * kuromoji kanji→kana conversion mocked, and both use the same #200-era
 * m34 library sentence as their fixture):
 *
 * 1. Kanji-keyboard normalization (#203). Spencer: "we need to normalize
 *    kanji answers too if they want to use their kanji keyboard."
 *    `acceptedAnswers` are authored in kana. A learner typing on a real
 *    Japanese IME/kanji keyboard naturally reaches for kanji (図書館, not
 *    としょかん) — wanakana only converts ROMAJI to kana, so kanji typed
 *    directly passes through untouched and a literal compare grades a
 *    correct answer wrong. `gradeTypedAnswerJa` (shared with
 *    WritingPracticePage and the conversation-practice type rung) retries
 *    via the same kuromoji reader the speaking step already uses.
 *
 * 2. ようとした vs てみた near-miss feedback (#200/#201, decision #3). A
 *    learner who answers a ようとした-keyed step with the てみた form of
 *    the same verb sees a one-line why instead of only the accepted-
 *    answers list — see `nearMissYouToSuruTemita.ts`.
 */
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup, waitFor } from "@testing-library/react";

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
vi.mock("@/shared/contexts/LanguageContext", () => ({
  useLanguage: () => ({ language: { id: "ja" } }),
}));
vi.mock("@/shared/contexts/SettingsContext", () => ({
  useSettings: () => ({
    settings: { learning: { showRomanization: { ja: false } } },
    updateSetting: vi.fn(),
  }),
}));

// The kuromoji dictionary is a real ~12MB offline asset — never loaded in
// unit tests. Mock the kanji→kana conversion the same fixed way for every
// case; `convertToHiragana` itself already has full unit coverage in
// `kuroshiro.test.ts`.
const convertToHiragana = vi.fn(async (text: string) => {
  if (text === "図書館に行こうとしたけどじかんがなかった") {
    return "としょかんにいこうとしたけどじかんがなかった";
  }
  if (text === "図書館に行ってみたけどじかんがなかった") {
    return "としょかんにいってみたけどじかんがなかった";
  }
  return text; // unmapped input — simulates "kuromoji found nothing new"
});
vi.mock("@/features/languages/ja/readingAnnotation/kuroshiro", () => ({
  convertToHiragana: (text: string) => convertToHiragana(text),
  warmKanjiReading: vi.fn(),
}));

import { TranslateStepView } from "./TranslateStepView";
import type { TranslateStep } from "../../types";

afterEach(() => {
  cleanup();
  convertToHiragana.mockClear();
});

const noop = () => {};

const step: TranslateStep = {
  id: "ja-m34-neo-9-s-1",
  type: "translate",
  sourceText: "I tried to go to the library, but I didn't have time",
  sourceLanguage: "native",
  acceptedAnswers: [
    "としょかんに いこうとした けど、 じかんが なかった。",
    "としょかんに いこうとした けど じかんが なかった",
  ],
} as TranslateStep;

describe("TranslateStepView kanji-keyboard normalization (#203)", () => {
  it("grades a kanji-typed answer correct via the kuromoji fallback", async () => {
    const onComplete = vi.fn();
    render(<TranslateStepView step={step} onComplete={onComplete} onContinue={noop} />);

    const textarea = screen.getByRole("textbox");
    fireEvent.change(textarea, {
      target: { value: "図書館に行こうとしたけどじかんがなかった" },
    });
    fireEvent.click(screen.getByText(/Check/));

    await waitFor(() => expect(convertToHiragana).toHaveBeenCalled());
    await waitFor(() => expect(onComplete).toHaveBeenCalled());
    expect(onComplete.mock.calls[0][1]).toBe(true);
  });

  it("never calls the kuromoji fallback for pure-kana input (the common case)", async () => {
    const onComplete = vi.fn();
    render(<TranslateStepView step={step} onComplete={onComplete} onContinue={noop} />);

    const textarea = screen.getByRole("textbox");
    fireEvent.change(textarea, {
      target: { value: "としょかんに いこうとした けど じかんが なかった" },
    });
    fireEvent.click(screen.getByText(/Check/));

    await waitFor(() => expect(onComplete).toHaveBeenCalled());
    expect(onComplete.mock.calls[0][1]).toBe(true);
    expect(convertToHiragana).not.toHaveBeenCalled();
  });

  it("still grades wrong when the kanji-converted form doesn't match any accepted answer", async () => {
    const onComplete = vi.fn();
    render(<TranslateStepView step={step} onComplete={onComplete} onContinue={noop} />);

    const textarea = screen.getByRole("textbox");
    fireEvent.change(textarea, { target: { value: "全然違う漢字の文章" } });
    fireEvent.click(screen.getByText(/Check/));

    await waitFor(() => expect(convertToHiragana).toHaveBeenCalled());
    await waitFor(() => expect(onComplete).toHaveBeenCalled());
    expect(onComplete.mock.calls[0][1]).toBe(false);
  });
});

describe("TranslateStepView ようとした vs てみた near-miss feedback (#200/#201, b30)", () => {
  it("shows the near-miss line (not just the accepted-answers list) for a pure-kana てみた answer", async () => {
    render(<TranslateStepView step={step} onComplete={vi.fn()} onContinue={noop} />);

    const textarea = screen.getByRole("textbox");
    fireEvent.change(textarea, {
      target: { value: "としょかんに いってみた けど じかんが なかった" },
    });
    fireEvent.click(screen.getByText(/Check/));

    await waitFor(() =>
      expect(
        screen.getByText(
          "てみた means you did it; this sentence needs ようとした — you were going to, and didn't.",
        ),
      ).toBeTruthy(),
    );
    // still WRONG — 行ってみた never becomes an accepted answer on this step.
    expect(screen.queryByText(/^\+10 XP$/)).toBeNull();
  });

  it("shows the near-miss line for a kanji-typed てみた answer too", async () => {
    render(<TranslateStepView step={step} onComplete={vi.fn()} onContinue={noop} />);

    const textarea = screen.getByRole("textbox");
    fireEvent.change(textarea, {
      target: { value: "図書館に行ってみたけどじかんがなかった" },
    });
    fireEvent.click(screen.getByText(/Check/));

    await waitFor(() =>
      expect(
        screen.getByText(
          "てみた means you did it; this sentence needs ようとした — you were going to, and didn't.",
        ),
      ).toBeTruthy(),
    );
  });

  it("does not show the near-miss line for an unrelated wrong answer", async () => {
    render(<TranslateStepView step={step} onComplete={vi.fn()} onContinue={noop} />);

    const textarea = screen.getByRole("textbox");
    fireEvent.change(textarea, { target: { value: "がっこうに いった" } });
    fireEvent.click(screen.getByText(/Check/));

    await waitFor(() => expect(screen.getByText(/Accepted answers:/)).toBeTruthy());
    expect(
      screen.queryByText(
        "てみた means you did it; this sentence needs ようとした — you were going to, and didn't.",
      ),
    ).toBeNull();
  });
});
