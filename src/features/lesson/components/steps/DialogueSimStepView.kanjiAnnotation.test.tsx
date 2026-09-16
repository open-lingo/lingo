/**
 * TestFlight #154 ("Is this not acceptable? Also where is the kanji here"):
 * `dialogue_sim` had no `*Annotation` field at all, so a founder-taught
 * kanji could never surface on an NPC line or a build tile — every sim
 * rendered pure kana at every module. `applyKanjiSurfaces.test.ts` pins the
 * compiler + post-pass half (annotations attach, substitute per module).
 * This pins the RENDER half: given post-pass annotation data (the shape
 * `applyKanjiSurfaces` actually produces — kanji surface, kana reading kept,
 * `furiganaWindowOpen` stamped), `DialogueSimStepView` renders it through
 * `AnnotatedText`'s real `<ruby>` branch — the SAME primitive every other JA
 * step type uses (see `McqOptionKanjiFurigana.test.tsx` for the sibling
 * pattern this follows: no AnnotatedText mock, assert on real `<ruby>`).
 */
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, cleanup } from "@testing-library/react";
import type { DialogueSimStep } from "../../types";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, def?: string | Record<string, unknown>) =>
      typeof def === "string" ? def : key,
  }),
}));

vi.mock("@/shared/tts", () => ({
  getTtsUrl: vi.fn(() => "https://example.test/audio.mp3"),
  stopAllAudio: vi.fn(),
  playJaAudioToEnd: vi.fn(() => Promise.resolve()),
}));

// Same shape as DialogueSimStepView.test.tsx: mock the capability lookup so
// `langForSpeaker` (DialogueListenStepView helper) resolves without pulling
// the real curriculum/lessonBuilder graph. Deliberately carries no
// `readingAnnotation` key — AnnotatedText's bare-text fallback (used for the
// un-annotated speaker chip) degrades to plain-char fragments, same as it
// does for any non-JA/no-capability language today.
vi.mock("@/shared/language/registry", () => ({
  tryGetLanguageModule: (id: string) =>
    id === "ja"
      ? { dialogueVoices: { maleSpeakers: new Set(["Ken"]), maleVoiceLang: "ja-keita" } }
      : null,
}));

vi.mock("@/shared/contexts/LanguageContext", () => ({
  useLanguage: () => ({ language: { id: "ja" } }),
}));

vi.mock("@/shared/contexts/SettingsContext", () => ({
  useSettings: () => ({
    settings: {
      audio: { silentMode: true }, // no autoplay fetch noise in this test
      accessibility: { reducedMotion: true },
    },
  }),
}));

import { DialogueSimStepView } from "./DialogueSimStepView";

afterEach(() => cleanup());

// Post-`applyKanjiSurfaces` shape: 学校 substituted, がっこう kept as the
// furigana reading, window closed (past unlock+2) — same fixture shape
// `McqOptionKanjiFurigana.test.tsx` uses for `optionAnnotations`.
const GAKKOU_SEG = {
  surface: "学校",
  reading: "がっこう",
  atomId: "ja-m6-1-gakkou",
  furiganaWindowOpen: false,
};

const step: DialogueSimStep = {
  id: "sim-kanji-test",
  type: "dialogue_sim",
  scene: { emoji: "🏫", title: "Test scene" },
  turns: [
    {
      id: "t1",
      npc: {
        speaker: "Ken",
        kana: "がっこうに いきますか。",
        gloss: "Are you going to school?",
        kanaAnnotation: [
          GAKKOU_SEG,
          { surface: "に いきますか。", reading: "に いきますか。" },
        ],
      },
      goal: "Say yes — you're going to school.",
      reply: {
        mode: "build",
        tiles: ["がっこう", "に", "いきます"],
        answer: "がっこうに いきます。",
        tileAnnotations: [
          [GAKKOU_SEG],
          [{ surface: "に", reading: "に" }],
          [{ surface: "いきます", reading: "いきます" }],
        ],
        answerAnnotation: [
          GAKKOU_SEG,
          { surface: "に いきます。", reading: "に いきます。" },
        ],
      },
      replyGloss: "Yes, I'm going to school.",
    },
  ],
};

function renderStep() {
  return render(
    <DialogueSimStepView step={step} onComplete={() => {}} onContinue={() => {}} />,
  );
}

// Kanji rubies (`KanjiRuby`, AnnotatedText's substituted-surface branch)
// carry `class="kanji-ruby"` — distinct from the plain romaji `<ruby>` every
// OTHER kana token in this view also renders (McqOptionKanjiFurigana.test.tsx
// uses the same discriminator). The base glyph text is every child node
// except the trailing `<rt>` (which carries the furigana reading).
function kanjiRubyBases(container: HTMLElement): string[] {
  return Array.from(container.querySelectorAll("ruby.kanji-ruby")).map((r) =>
    Array.from(r.childNodes)
      .filter((n) => n.nodeName !== "RT")
      .map((n) => n.textContent)
      .join(""),
  );
}

describe("DialogueSimStepView — kanji annotation renders as ruby (#154)", () => {
  it("the NPC line shows 学校 as a kanji ruby (not がっこう plain kana)", () => {
    const { container } = renderStep();
    const bases = kanjiRubyBases(container);
    expect(bases).toContain("学校");
  });

  it("the build-mode bank tile for がっこう also renders 学校 as a kanji ruby", () => {
    const { container } = renderStep();
    const tileButton = container.querySelector('[data-tile="がっこう"]');
    expect(tileButton, "bank tile keeps its kana data-tile id for grading/QA").toBeTruthy();
    const ruby = tileButton!.querySelector("ruby.kanji-ruby");
    expect(ruby, "the tile itself must render the kanji ruby, not just the transcript").toBeTruthy();
    const base = Array.from(ruby!.childNodes)
      .filter((n) => n.nodeName !== "RT")
      .map((n) => n.textContent)
      .join("");
    expect(base).toBe("学校");
  });

  it("a step with no annotation data falls back to plain kana (non-JA / older content is unaffected)", () => {
    const bareStep: DialogueSimStep = {
      ...step,
      turns: [
        {
          ...step.turns[0],
          npc: { speaker: "Ken", kana: "がっこうに いきますか。", gloss: "Are you going to school?" },
          reply: {
            mode: "build",
            tiles: ["がっこう", "に", "いきます"],
            answer: "がっこうに いきます。",
            // No tileAnnotations / answerAnnotation — the ES/FR shape today.
          },
        },
      ],
    };
    const { container } = render(
      <DialogueSimStepView step={bareStep} onComplete={() => {}} onContinue={() => {}} />,
    );
    // No kanji ruby anywhere — only plain romaji-helper rubies (if any) over
    // untouched kana, and the raw kana line itself still renders somewhere.
    expect(container.querySelectorAll("ruby.kanji-ruby")).toHaveLength(0);
    expect(container.textContent).toContain("がっこう");
  });
});
