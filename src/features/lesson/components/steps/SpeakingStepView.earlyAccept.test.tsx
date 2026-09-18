/**
 * Early accept + monotonic result on the speaking step (TestFlight #171, #155,
 * #159).
 *
 * Two founder reports, one state machine:
 *
 *  - #171 "pre-load the accepted readings onto the lesson so the exact moment
 *    they say the word fully it is marked as correct" — the verdict used to
 *    wait for the recognizer to decide the utterance was over (our own 1.6 s
 *    silence endpoint on device), so the learner said テレビ and then watched
 *    the mic sit open.
 *  - #155 "I got the answer right and then it says error" — closing the mic on
 *    a match makes the recognizer report a cancellation, and the terminal
 *    handler read `error` before anything else and repainted a correct answer
 *    as a failure. Accepting early without fixing this would have made the bug
 *    fire on EVERY correct answer instead of occasionally.
 *
 * These drive the real `useSpeechRecognition` through a fake Web Speech
 * implementation rather than mocking the hook: the ordering between
 * `onresult`, our `stop()`, `onerror` and `onend` IS the bug, and a mocked
 * hook cannot reproduce an ordering it does not have.
 */
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import type { SpeakingStep } from "../../types";

vi.mock(import("@/shared/tts"), async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    playJaAudio: vi.fn(),
    getTtsUrl: vi.fn(() => "/tts/fake.mp3"),
    resumeAudioPlayback: vi.fn(),
    useAutoPlayJaAudio: vi.fn(),
  };
});
vi.mock("@/shared/contexts/SettingsContext", async () => {
  const { DEFAULT_SETTINGS } = await import("@/shared/settings/types");
  return { useSettings: () => ({ settings: DEFAULT_SETTINGS, updateSetting: vi.fn() }) };
});
vi.mock("@/shared/contexts/LessonModuleContext", () => ({
  useLessonModuleIndex: () => null,
}));
vi.mock("@/shared/hooks/useLangPath", () => ({ useLang: () => "ja" }));
// The celebration toast picks its wording at RANDOM, and one of the options is
// literally "Perfect!" — the same string as the passing helper line. Pin it so
// an assertion about the verdict is an assertion about the verdict.
vi.mock("../CelebrationToast", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../CelebrationToast")>();
  return { ...actual, pickCelebrationText: () => "Nice one" };
});
// The kanji→kana converter is a ~12 MB kuromoji dictionary behind a dynamic
// import. Early accept exists precisely so the verdict does NOT wait on it, so
// this mock is also an assertion: nothing in the fast path may need it.
vi.mock("@/features/languages/ja/readingAnnotation/kuroshiro", () => ({
  convertToHiragana: vi.fn(async (s: string) => s),
  warmKanjiReading: vi.fn(),
}));

import { SpeakingStepView } from "./SpeakingStepView";
import { KANJI_ELIGIBLE_ATOMS } from "@/features/languages/ja/secondScript/applyKanjiSurfaces";

type ResultItem = { transcript: string; confidence?: number };

/** Minimal Web Speech double, driven by hand. */
class FakeRecognition {
  static instances: FakeRecognition[] = [];
  lang = "";
  interimResults = false;
  continuous = false;
  maxAlternatives = 1;
  onresult: ((e: unknown) => void) | null = null;
  onerror: ((e: unknown) => void) | null = null;
  onend: (() => void) | null = null;
  onstart: (() => void) | null = null;
  stopCalls = 0;

  constructor() {
    FakeRecognition.instances.push(this);
  }
  start() {
    this.onstart?.();
  }
  stop() {
    this.stopCalls += 1;
  }
  abort() {
    this.stopCalls += 1;
  }

  private emit(alts: ResultItem[], isFinal: boolean) {
    const item = Object.assign([...alts], { isFinal });
    this.onresult?.({ results: Object.assign([item], { length: 1 }) });
  }
  /** An interim hypothesis — the thing we now grade. */
  partial(...alts: string[]) {
    this.emit(
      alts.map((transcript) => ({ transcript, confidence: 0.9 })),
      false,
    );
  }
  final(...alts: string[]) {
    this.emit(
      alts.map((transcript) => ({ transcript, confidence: 0.9 })),
      true,
    );
  }
  error(code: string) {
    this.onerror?.({ error: code });
  }
  end() {
    this.onend?.();
  }
}

function latest(): FakeRecognition {
  const r = FakeRecognition.instances.at(-1);
  if (!r) throw new Error("no recognizer was constructed");
  return r;
}

/** The #171 step, verbatim from the founder's screenshot. */
const terebi: SpeakingStep = {
  id: "ja-m7-kata-ta-speak-1",
  type: "speaking",
  prompt: "Say it",
  targetPhrase: "テレビ",
  translation: "TV",
  stubbed: false,
} as unknown as SpeakingStep;

/** #165's step: a kanji surface whose annotation carries the kana reading. */
const mise: SpeakingStep = {
  id: "ja-m19-neo-b-speak-2",
  type: "speaking",
  prompt: "Say it",
  targetPhrase: "店がしまる",
  translation: "The shop closes",
  stubbed: false,
  targetAnnotation: [
    { surface: "店", reading: "みせ" },
    { surface: "が", reading: "が" },
    { surface: "しまる", reading: "しまる" },
  ],
} as unknown as SpeakingStep;

/**
 * #188/#189/#190's step shape: a sentence whose target-annotation segment
 * for a kanji-eligible word is STILL KANA (surface === reading), because
 * `applyKanjiSurfaces` gates DISPLAY on the lesson's own module and this
 * fixture never ran through that pass (mirrors the pre-unlock case, and also
 * how a review/practice-pool speaking step composes its annotation before
 * the lesson-shaping post-pass runs). Root-cause finding (b): the OLD
 * `acceptedReadings()` only ever joined `s.surface`, so it could never accept
 * a natural kanji transcript for a word like this — only `readings` (pure
 * kana) or the async kuroshiro path could. `naturalKanjiSurface` fixes that.
 */
const GAKKOU_ATOM = "ja-m6-1-gakkou";
const gakkouKanji = KANJI_ELIGIBLE_ATOMS.get(GAKKOU_ATOM)!.kanji; // "学校"
const ikimasu: SpeakingStep = {
  id: "ja-m30-review-speak-1",
  type: "speaking",
  prompt: "Say it",
  targetPhrase: "がっこうに いきます",
  translation: "I go to school",
  stubbed: false,
  targetAnnotation: [
    { surface: "がっこう", reading: "がっこう", atomId: GAKKOU_ATOM },
    { surface: "に", reading: "に" },
    { surface: " ", reading: " " },
    { surface: "いきます", reading: "いきます" },
  ],
} as unknown as SpeakingStep;

function tapMic() {
  fireEvent.click(screen.getByRole("button", { name: /tap to speak/i }));
}

beforeEach(() => {
  FakeRecognition.instances = [];
  (window as unknown as { SpeechRecognition: unknown }).SpeechRecognition =
    FakeRecognition;
});

afterEach(() => {
  cleanup();
  delete (window as unknown as { SpeechRecognition?: unknown }).SpeechRecognition;
});

describe("speaking step — early accept on a partial (#171)", () => {
  it("marks correct on the interim that matches, without waiting for a final result", () => {
    const onComplete = vi.fn();
    render(
      <SpeakingStepView step={terebi} onComplete={onComplete} onContinue={vi.fn()} />,
    );
    tapMic();

    // Mid-utterance: the learner is still on the first mora.
    act(() => latest().partial("て"));
    expect(screen.queryByText("Perfect!")).toBeNull();
    expect(onComplete).not.toHaveBeenCalled();

    // …and now the word is fully out. No final result, no endpoint timer.
    act(() => latest().partial("てれび"));

    expect(screen.getByText("Perfect!")).toBeTruthy();
    expect(onComplete).toHaveBeenCalledWith(terebi.id, true);
    // The mic is closed the instant we know, which is the visible half of #171.
    expect(latest().stopCalls).toBeGreaterThan(0);
  });

  it("accepts the kana reading of a kanji target from the step's own annotation", () => {
    const onComplete = vi.fn();
    render(<SpeakingStepView step={mise} onComplete={onComplete} onContinue={vi.fn()} />);
    tapMic();

    act(() => latest().partial("みせがしまる"));

    expect(screen.getByText("Perfect!")).toBeTruthy();
    expect(onComplete).toHaveBeenCalledWith(mise.id, true);
  });

  it("accepts a kanji partial without the async kana conversion", () => {
    render(<SpeakingStepView step={mise} onComplete={vi.fn()} onContinue={vi.fn()} />);
    tapMic();

    // iOS on-device JA transcribes in natural orthography. The kanji surface is
    // itself an accepted form, so this matches synchronously.
    act(() => latest().partial("店がしまる"));

    expect(screen.getByText("Perfect!")).toBeTruthy();
  });

  it("finds the accepted form below the top hypothesis", () => {
    render(<SpeakingStepView step={terebi} onComplete={vi.fn()} onContinue={vi.fn()} />);
    tapMic();

    act(() => latest().partial("手ぇ、ビー", "てれび"));

    expect(screen.getByText("Perfect!")).toBeTruthy();
  });

  it("accepts a fully-natural-kanji partial for a word whose ANNOTATION surface is still kana (#188/#189/#190)", () => {
    const onComplete = vi.fn();
    render(<SpeakingStepView step={ikimasu} onComplete={onComplete} onContinue={vi.fn()} />);
    tapMic();

    // A recognizer transcribing natural orthography spells がっこう as 学校
    // regardless of which module this speaking step's lesson sits at — the
    // step's own targetAnnotation.surface never got kanji-substituted (it
    // is still kana here, the pre-unlock shape). Before the fix, neither
    // `readings` (pure kana "がっこうにいきます") nor `surfaces`
    // (`s.surface` joined — also still pure kana here) could match this.
    act(() => latest().partial(`${gakkouKanji}に いきます`));

    expect(screen.getByText("Perfect!")).toBeTruthy();
    expect(onComplete).toHaveBeenCalledWith(ikimasu.id, true);
    // Synchronous — no kuroshiro round-trip needed for this to land on an
    // interim, which is exactly the #171 guarantee this fix restores for
    // eligible-but-not-yet-unlocked words.
    expect(latest().stopCalls).toBeGreaterThan(0);
  });

  it("does not accept a partial that is not the target", () => {
    const onComplete = vi.fn();
    render(
      <SpeakingStepView step={terebi} onComplete={onComplete} onContinue={vi.fn()} />,
    );
    tapMic();

    act(() => latest().partial("ラジオ"));

    expect(screen.queryByText("Perfect!")).toBeNull();
    expect(onComplete).not.toHaveBeenCalled();
    expect(latest().stopCalls).toBe(0);
  });
});

describe("speaking step — the result is monotonic (#155, #159)", () => {
  it("ignores the error that our own stop() provokes after a correct answer", () => {
    const onComplete = vi.fn();
    render(
      <SpeakingStepView step={terebi} onComplete={onComplete} onContinue={vi.fn()} />,
    );
    tapMic();
    act(() => latest().partial("てれび"));
    expect(screen.getByText("Perfect!")).toBeTruthy();

    // This is the exact sequence the founder hit: we closed the mic, so the
    // recognizer reports the abort, and then the session ends.
    act(() => {
      latest().error("aborted");
      latest().end();
    });

    expect(screen.getByText("Perfect!")).toBeTruthy();
    expect(
      screen.queryByText(/Speech recognition hit an error/i),
    ).toBeNull();
    expect(screen.queryByText(/Still not quite/i)).toBeNull();
    // One result, not two, and it is the passing one.
    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(onComplete).toHaveBeenCalledWith(terebi.id, true);
  });

  it("survives a hard recognizer error after the verdict", () => {
    const onComplete = vi.fn();
    render(
      <SpeakingStepView step={terebi} onComplete={onComplete} onContinue={vi.fn()} />,
    );
    tapMic();
    act(() => latest().partial("てれび"));

    act(() => {
      latest().error("network");
      latest().end();
    });

    expect(screen.getByText("Perfect!")).toBeTruthy();
    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(onComplete).toHaveBeenLastCalledWith(terebi.id, true);
  });

  it("does not let a revised partial take the pass away", () => {
    const onComplete = vi.fn();
    render(
      <SpeakingStepView step={terebi} onComplete={onComplete} onContinue={vi.fn()} />,
    );
    tapMic();
    act(() => latest().partial("てれび"));

    // iOS re-emits and sometimes REVISES a hypothesis after speech ends.
    act(() => {
      latest().partial("てれびを");
      latest().final("でれびを");
      latest().end();
    });

    expect(screen.getByText("Perfect!")).toBeTruthy();
    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(onComplete).toHaveBeenCalledWith(terebi.id, true);
  });

  it("still fails an attempt that never matched", () => {
    const onComplete = vi.fn();
    render(
      <SpeakingStepView step={terebi} onComplete={onComplete} onContinue={vi.fn()} />,
    );
    tapMic();

    act(() => {
      latest().final("ラジオ");
      latest().end();
    });

    expect(screen.queryByText("Perfect!")).toBeNull();
    expect(onComplete).not.toHaveBeenCalled();
  });
});

describe("speaking step — the accepted set grades the final transcript too (#155)", () => {
  it("passes a correct final transcript the char-overlap scorer would under-rate", () => {
    const onComplete = vi.fn();
    render(
      <SpeakingStepView step={terebi} onComplete={onComplete} onContinue={vi.fn()} />,
    );
    tapMic();

    // No interim at all (a fast utterance on a server-path recognizer): the
    // final result is the first thing we see, and it is right.
    act(() => {
      latest().final("テレビ。");
      latest().end();
    });

    expect(screen.getByText("Perfect!")).toBeTruthy();
    expect(onComplete).toHaveBeenCalledWith(terebi.id, true);
  });
});

/**
 * TestFlight #165 (founder, build 20 — "We take too much space here, maybe
 * audio play button sits on the left of the sentence as a two-word-tall thing
 * allowing sentence wrap for space").
 *
 * Measured at 430×932 with `--touch` on ja-m19-neo-4 step 16: the prompt card
 * went 203px → 102px (and 233px → 106px at 1180×820). This test pins the
 * STRUCTURE that produced that — button and sentence in one row, translation
 * under the sentence — because a later "tidy-up" that re-stacks them would
 * give the height straight back without failing anything else.
 */
describe("prompt card layout (#165)", () => {
  it("puts the play button beside the sentence, not above it", () => {
    render(<SpeakingStepView step={mise} onComplete={vi.fn()} onContinue={vi.fn()} />);

    const play = screen.getByRole("button", { name: /play audio/i });
    const row = play.parentElement;
    expect(row).not.toBeNull();
    // The sentence shares the button's row — that is what lets it wrap beside
    // the button instead of starting a new full-width line under it.
    expect(row?.textContent).toContain("店");
    expect(row?.textContent).toContain("The shop closes");
    // …and the button is the FIRST thing in that row (left), not the last.
    expect(row?.firstElementChild).toBe(play);
  });

  it("keeps the translation with the sentence, under it", () => {
    render(<SpeakingStepView step={mise} onComplete={vi.fn()} onContinue={vi.fn()} />);

    const translation = screen.getByText("The shop closes");
    const column = translation.parentElement;
    expect(column?.textContent).toContain("店");
    // The wrapping column, not the button, owns the text.
    expect(column?.querySelector('button[aria-label="Play audio"]')).toBeNull();
  });
});
