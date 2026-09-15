/**
 * Cross-step guard for the "auto-play after correct answer" `setTimeout`
 * pattern shared by the *ClozeStepView / *TransformStepView family
 * (TestFlight #127 follow-up, 2026-09-15).
 *
 * The previous #127 lane fixed every MANUAL play surface (a tap on
 * `PromptAudioButton`) by routing it through `playStepAudio` /
 * `useCurrentStepId` (`useStepAudioGuard.ts`). It disclosed one remaining
 * instance of the same race: these six views (`KanjiReadingStepView`,
 * `ParticleClozeStepView`, `AspectChoiceClozeStepView`,
 * `ConjugationTransformStepView`, `ConjugationClozeStepView`,
 * `AgreementClozeStepView`) each hold a 250-320ms `audioTimer` that,
 * on a correct commit, schedules `playJaAudio` directly — unguarded, and
 * (in `ConjugationTransformStepView`'s case) with no cleanup effect at
 * all, so the timer could even fire after the component itself was gone.
 *
 * `window.clearTimeout` on unmount reliably cancels a timer that hasn't
 * fired yet, so that half of the race was already closed everywhere but
 * `ConjugationTransformStepView` (now fixed to match its siblings). The
 * race this file is for is the one cleanup CANNOT close: the timer fires
 * while the view is still mounted, kicks off `playJaAudio`'s async fetch
 * + decode for a cold clip, and the learner advances (unmount, next
 * step's `useCurrentStepId` registers) before that fetch resolves.
 * Un-routed, the clip would start playing on the new step once the fetch
 * finally lands. Routed through `playStepAudio`, the stale resolution
 * no-ops and calls `stopAllAudio()` instead.
 *
 * One shared, table-driven test proves the wiring for all six views: fire
 * the real `setTimeout` (fake timers), advance to the next step while the
 * mocked `playJaAudio` promise is still pending, resolve it, and assert
 * nothing else played and `stopAllAudio()` fired exactly once.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup, act } from "@testing-library/react";
import { renderHook } from "@testing-library/react";
import type { ReactElement } from "react";

const tts = vi.hoisted(() => ({
  playJaAudio: vi.fn(),
  playJaAudioToEnd: vi.fn(),
  stopAllAudio: vi.fn(),
  getTtsUrl: vi.fn((_text: string) => "https://cdn.example/clip.mp3"),
  hasTtsAudio: vi.fn(() => true),
  useAutoPlayJaAudio: vi.fn(),
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
      return template.replace(/\{\{(\w+)\}\}/g, (_, k: string) => String(vars[k] ?? ""));
    },
  }),
}));
vi.mock("@/shared/tts", () => tts);
vi.mock("@/shared/audio/sfx", () => ({ playSfx: vi.fn() }));
vi.mock("@/shared/contexts/SettingsContext", () => ({
  useSettings: () => ({
    settings: {
      learning: {
        showRomanization: {},
        hiraganaRomajiAutoOff: true,
        katakanaRomajiAutoOff: true,
      },
    },
    updateSetting: vi.fn(),
  }),
}));
vi.mock("@/shared/contexts/LanguageContext", () => ({
  useLanguage: () => ({ language: { id: "ja" } }),
}));

import { KanjiReadingStepView } from "./KanjiReadingStepView";
import { ParticleClozeStepView } from "./ParticleClozeStepView";
import { AspectChoiceClozeStepView } from "./AspectChoiceClozeStepView";
import { ConjugationTransformStepView } from "./ConjugationTransformStepView";
import { ConjugationClozeStepView } from "./ConjugationClozeStepView";
import { AgreementClozeStepView } from "./AgreementClozeStepView";
import { conjugationCloze, conjugationTransform } from "@/features/languages/ja/grammarHelpers";
import { useCurrentStepId } from "../../hooks/useStepAudioGuard";
import type {
  KanjiReadingStep,
  ParticleClozeStep,
  AspectChoiceClozeStep,
  AgreementClozeStep,
} from "../../types";

/** A promise this test resolves on its own schedule — stands in for the
 *  network fetch + decode a cold TTS clip goes through, same technique as
 *  `useStepAudioGuard.test.ts`. */
function deferred<T>() {
  let resolve!: (v: T) => void;
  const promise = new Promise<T>((r) => {
    resolve = r;
  });
  return { promise, resolve };
}

const kanjiStep: KanjiReadingStep = {
  id: "guard-kanji",
  type: "kanji_reading",
  kanji: "水",
  reading: "みず",
  meaningEn: "water",
  promptAnnotation: [{ surface: "水", reading: "水", atomId: "ja-m3-3-v-mizu" }],
  options: [
    { id: "opt-0", text: "すい" },
    { id: "correct", text: "みず" },
  ],
  correctOptionId: "correct",
  audioText: "みず",
  exercisedAtoms: ["ja-m3-3-v-mizu"],
  modality: "recognition",
};

const particleStep: ParticleClozeStep = {
  id: "guard-particle",
  type: "particle_cloze",
  prompt: { before: "わたしは がっこう", after: " いきます。" },
  correctParticle: "に",
  options: ["に", "で"],
  meaningEn: "I go to school.",
};

const aspectStep: AspectChoiceClozeStep = {
  id: "guard-aspect",
  type: "aspect_choice_cloze",
  prompt: "Choose the form that fits the story",
  meaningEn: "When I was a child I lived in Madrid.",
  segments: [
    { text: "Cuando " },
    {
      blank: {
        id: "a1",
        lemma: "ser",
        options: ["era", "fui"],
        correctAnswer: "era",
        reason: "Background.",
      },
    },
    { text: " niño." },
  ],
  audioText: "Cuando era niño.",
};

const agreementStep: AgreementClozeStep = {
  id: "guard-agreement",
  type: "agreement_cloze",
  segments: [
    { text: "La cas" },
    { blank: { id: "b1", correctAnswer: "a", options: ["a", "o"] } },
    { text: " blanca." },
  ],
  meaningEn: "The white house.",
  audioText: "La casa blanca.",
};

const conjTransformStep = conjugationTransform({
  id: "guard-transform",
  base: "のむ",
  baseGloss: "to drink",
  targetGloss: "won't drink",
  form: "nai",
});

const conjClozeStep = conjugationCloze({
  id: "guard-conj-cloze",
  before: "コーヒーを ",
  after: " ください。",
  verb: "のむ",
  form: "te",
  meaningEn: "Please drink the coffee.",
});

type Case = {
  name: string;
  render: () => ReactElement;
  /** Drives the view to a CORRECT commit — the branch that schedules the
   *  audioTimer in every one of these views. */
  triggerCorrectCommit: () => void;
};

const cases: Case[] = [
  {
    name: "KanjiReadingStepView",
    render: () => (
      <KanjiReadingStepView step={kanjiStep} onComplete={vi.fn()} onContinue={vi.fn()} />
    ),
    triggerCorrectCommit: () => {
      fireEvent.click(screen.getByRole("button", { name: "みず" }));
      fireEvent.click(screen.getByRole("button", { name: "Check" }));
    },
  },
  {
    name: "ParticleClozeStepView",
    render: () => (
      <ParticleClozeStepView step={particleStep} onComplete={vi.fn()} onContinue={vi.fn()} />
    ),
    triggerCorrectCommit: () => {
      fireEvent.click(screen.getByRole("button", { name: "に" }));
      fireEvent.click(screen.getByRole("button", { name: "Check" }));
    },
  },
  {
    name: "AspectChoiceClozeStepView",
    render: () => (
      <AspectChoiceClozeStepView step={aspectStep} onComplete={vi.fn()} onContinue={vi.fn()} />
    ),
    triggerCorrectCommit: () => {
      fireEvent.click(screen.getByRole("button", { name: "era" }));
      fireEvent.click(screen.getByTestId("primary-cta").querySelector("button")!);
    },
  },
  {
    name: "ConjugationTransformStepView",
    render: () => (
      <ConjugationTransformStepView
        step={conjTransformStep}
        lessonId="guard-lesson"
        onComplete={vi.fn()}
        onContinue={vi.fn()}
      />
    ),
    triggerCorrectCommit: () => {
      fireEvent.click(screen.getByRole("button", { name: conjTransformStep.answer }));
      fireEvent.click(screen.getByRole("button", { name: "Check" }));
    },
  },
  {
    name: "ConjugationClozeStepView",
    render: () => (
      <ConjugationClozeStepView step={conjClozeStep} onComplete={vi.fn()} onContinue={vi.fn()} />
    ),
    triggerCorrectCommit: () => {
      const correctText = conjClozeStep.options.find(
        (o) => o.id === conjClozeStep.correctOptionId,
      )!.text;
      fireEvent.click(screen.getByRole("button", { name: correctText }));
      fireEvent.click(screen.getByRole("button", { name: "Check" }));
    },
  },
  {
    name: "AgreementClozeStepView",
    render: () => (
      <AgreementClozeStepView step={agreementStep} onComplete={vi.fn()} onContinue={vi.fn()} />
    ),
    triggerCorrectCommit: () => {
      fireEvent.click(screen.getByRole("button", { name: "a" }));
      fireEvent.click(screen.getByRole("button", { name: "Check" }));
    },
  },
];

beforeEach(() => {
  vi.useFakeTimers();
  vi.clearAllMocks();
  tts.getTtsUrl.mockReturnValue("https://cdn.example/clip.mp3");
  // ConjugationTransformStepView resolves its stage from grammar FSRS
  // storage — clear it so the fixture always renders stage 1 (MCQ, no
  // typed input to route around).
  localStorage.clear();
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe("cross-step audio-bleed guard — correct-answer auto-play timer", () => {
  for (const { name, render: renderView, triggerCorrectCommit } of cases) {
    it(`${name}: a stale clip resolving after the step advances is cut, not played`, async () => {
      const { promise, resolve } = deferred<unknown>();
      tts.playJaAudio.mockReturnValue(promise);

      const view = render(renderView());
      triggerCorrectCommit();

      // Fire the real setTimeout while the view is still on screen —
      // this is what schedules and then RUNS the guarded play.
      act(() => {
        vi.advanceTimersByTime(400);
      });
      expect(tts.playJaAudio).toHaveBeenCalledTimes(1);

      // Advance: the learner is already on the next step by the time the
      // fetch resolves (`LessonPage`/`PlacementTestPage` fully unmount the
      // old step view and mount the new one — `key={step.id}`).
      view.unmount();
      const nextStep = renderHook(() => useCurrentStepId("guard-next-step"));

      // NOW the clip's fetch + decode finally lands.
      await act(async () => {
        resolve(undefined);
        await Promise.resolve();
        await Promise.resolve();
      });

      expect(tts.stopAllAudio).toHaveBeenCalledTimes(1);
      // No second attempt, no lingering playback kicked off by the resolve.
      expect(tts.playJaAudio).toHaveBeenCalledTimes(1);

      nextStep.unmount();
    });
  }
});
