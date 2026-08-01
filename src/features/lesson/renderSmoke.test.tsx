/**
 * GATE 9 — render-integration smoke test (retrospective 2026-07-17 §4).
 *
 * Renders REAL lesson steps (from `getMockLessonContent`, the same content
 * pipeline the app uses — review tails, pads, and the `applyKanjiSurfaces`
 * post-pass included) through the REAL `StepRenderer` + `AnnotatedText`,
 * wrapped in the REAL `LessonModuleProvider`. It asserts the script-ladder
 * semantics the way manual QA sees them — on RENDERED helper visibility
 * (`rt[data-visible]` / `aria-hidden`), never on the mere presence of
 * `ruby[data-word-romaji]` (that attribute always renders, visible or not).
 *
 * Motivating escapes (both invisible to unit tests):
 *   1. `parseModuleIndex("m29")` returned 0, so romaji rendered in every
 *      module ≥ M7 — nothing mounted a lesson through the render gate.
 *   2. `applyKanjiSurfaces` skipped plural `*Annotations` keys, so MCQ
 *      option surfaces never showed kanji past unlock.
 *
 * Settings are stubbed at their DEFAULTS with every one-shot auto-off guard
 * UNFLIPPED — the QA-jump / deep-link scenario. All gating asserted here
 * must therefore come from module POSITION via `LessonModuleProvider`,
 * which is exactly what regression #1 broke. Ladder thresholds are imported
 * from `romanizationAutoFlip.ts` / `kanjiRollout.ts`, never hard-coded.
 *
 * Contexts that don't spin up in happy-dom (settings, i18n, TTS, sfx) are
 * stubbed the same way KanjiReadingStepView.test.tsx stubs them. The JA
 * annotator, language registry, kanji post-pass, and every step view are
 * real.
 */
import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";
import { render, cleanup } from "@testing-library/react";
import type { UserSettings } from "@/shared/settings/types";

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
vi.mock("@/shared/audio/sfx", () => ({
  playSfx: vi.fn(),
}));
// Lang hook depends on LanguageProvider + router in real life; stub it the
// PublicProfilePage.test.tsx way. This suite IS the JA script ladder.
vi.mock("@/shared/hooks/useLangPath", () => ({
  useLangPath: () => (p: string) => `/ja/${p.replace(/^\//, "")}`,
  useLang: () => "ja",
}));
// Defaults with NO auto-off guard flipped (the deep-link scenario): any
// hiding asserted below must come from the module-position gate.
const defaultLearning = () => ({
  showRomanization: {},
  hiraganaRomajiAutoOff: false,
  katakanaRomajiAutoOff: false,
  hideBuildTileRomaji: false,
  buildTileRomajiAutoFlipped: false,
});
const settingsRef: {
  learning: Record<string, unknown>;
  audio: Record<string, unknown>;
} = {
  learning: defaultLearning(),
  audio: { silentMode: false },
};
vi.mock("@/shared/contexts/SettingsContext", () => ({
  useSettings: () => ({ settings: settingsRef, updateSetting: vi.fn() }),
}));
// SRS mastery for the sentence-furigana gate (Spencer 2026-07-17): mock ONLY
// getCardState (isMastered stays the real predicate), the
// BuildTileKanjiSurface.test.tsx convention. Default undefined → unmastered.
const getCardStateMock = vi.fn();
vi.mock("@/features/flashcards/engine", async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  getCardState: (id: string) => getCardStateMock(id),
}));

import { StepRenderer } from "./components/StepRenderer";
import { LessonModuleProvider } from "@/shared/contexts/LessonModuleContext";
import {
  getAvailableMockLessonIds,
  getMockLessonContent,
} from "./data/mockLessons";
import { MASTERED_INTERVAL_DAYS } from "@/features/flashcards/engine";
import { alignFurigana } from "@/shared/japanese/okurigana";
import type { LessonContent, LessonStep } from "./types";
import {
  HIRAGANA_ROMAJI_OFF_MODULE,
  KATAKANA_ROMAJI_OFF_MODULE,
  BUILD_TILE_ROMAJI_FADE_MODULE,
  parseModuleIndex,
  shouldAutoFadeBuildTileRomaji,
} from "@/shared/settings/romanizationAutoFlip";
import {
  KANJI_RECOGNITION_MODULE,
  FURIGANA_WINDOW,
} from "@/features/languages/ja/secondScript/kanjiRollout";

afterEach(() => cleanup());
beforeEach(() => {
  settingsRef.learning = defaultLearning();
  getCardStateMock.mockReset();
  getCardStateMock.mockReturnValue(undefined); // no SRS state → unmastered
});

// ── harness ─────────────────────────────────────────────────────────────

const HAS_HAN = /\p{Script=Han}/u;
const HAS_LATIN = /[A-Za-z]/;
const HIRAGANA = /[ぁ-ゖ]/;
const KATAKANA = /[ァ-ヺー]/;

function getLesson(id: string): LessonContent {
  const lesson = getMockLessonContent(id);
  expect(lesson, `lesson ${id} must exist`).not.toBeNull();
  return lesson!;
}

function renderStep(step: LessonStep, moduleIndex: number) {
  return render(
    <LessonModuleProvider moduleIndex={moduleIndex}>
      <StepRenderer step={step} onComplete={() => {}} onContinue={() => {}} />
    </LessonModuleProvider>,
  );
}

/** All <rt> helpers currently rendered. */
function allRts(container: HTMLElement): HTMLElement[] {
  return Array.from(container.querySelectorAll("rt"));
}

/** A helper counts as VISIBLE only when the render gate says so — never by
 *  element presence (hidden helpers still render a zero-width <rt>). */
function rtVisible(rt: HTMLElement): boolean {
  if (rt.getAttribute("aria-hidden") === "true") return false;
  const dv = rt.getAttribute("data-visible");
  if (dv !== null) return dv === "true";
  return true;
}

/** The ruby's base text (what the learner reads), excluding the <rt>. */
function rubyBase(ruby: HTMLElement): string {
  let out = "";
  for (const node of Array.from(ruby.childNodes)) {
    if (node.nodeName.toLowerCase() === "rt") continue;
    out += node.textContent ?? "";
  }
  return out;
}

/** Visible ASCII-romaji helpers, optionally filtered by base-text script. */
function visibleRomajiRts(
  container: HTMLElement,
  baseFilter?: (base: string) => boolean,
): HTMLElement[] {
  return allRts(container).filter((rt) => {
    if (!rtVisible(rt) || !HAS_LATIN.test(rt.textContent ?? "")) return false;
    if (!baseFilter) return true;
    return baseFilter(rubyBase(rt.parentElement as HTMLElement));
  });
}

/** Every JapaneseAnnotation-ish segment under the step's *Annotation(s)
 *  keys — the exact field family `applyKanjiSurfaces` rewrites. */
function annotationSegments(
  step: LessonStep,
): { surface: string; reading: string }[] {
  const out: { surface: string; reading: string }[] = [];
  const s = step as unknown as Record<string, unknown>;
  for (const key of Object.keys(s)) {
    if (!/Annotations?$/.test(key)) continue;
    const v = s[key];
    if (!Array.isArray(v)) continue;
    const arrays = v.some((el) => Array.isArray(el)) ? v : [v];
    for (const arr of arrays) {
      if (!Array.isArray(arr)) continue;
      for (const seg of arr) {
        if (seg && typeof seg.surface === "string") out.push(seg);
      }
    }
  }
  return out;
}

/** Step types this smoke renders — annotation-bearing views that mount
 *  cleanly in happy-dom (no canvas; the speaking view degrades gracefully
 *  when SpeechRecognition is absent). */
const RENDERABLE = new Set([
  "multiple_choice",
  "word_image_mcq",
  "kanji_reading",
  "speaking",
]);

function findRenderableStep(
  lesson: LessonContent,
  pred: (step: LessonStep) => boolean,
): LessonStep {
  const step = lesson.steps.find(
    (st) => RENDERABLE.has(st.type) && pred(st),
  );
  expect(
    step,
    `expected a renderable step matching predicate in ${lesson.id}`,
  ).toBeDefined();
  return step!;
}

// ── the gate ────────────────────────────────────────────────────────────

describe("Gate 9 — render-integration smoke (script ladder through real components)", () => {
  it(`below M${HIRAGANA_ROMAJI_OFF_MODULE}: romaji helpers actually render visible`, () => {
    const lesson = getLesson("ja-m4-neo-1");
    const moduleIndex = parseModuleIndex(lesson.moduleId);
    // Regression #1 guard: bare "m4" must parse, and land below the cutoff.
    expect(moduleIndex).toBeGreaterThan(0);
    expect(moduleIndex).toBeLessThan(HIRAGANA_ROMAJI_OFF_MODULE);

    const step = findRenderableStep(lesson, (st) =>
      annotationSegments(st).some((seg) => HIRAGANA.test(seg.surface)),
    );
    const { container } = renderStep(step, moduleIndex);

    // At least one VISIBLE romaji helper over a hiragana surface. Presence
    // of <ruby>/<rt> alone proves nothing — the visibility gate is the test.
    expect(
      visibleRomajiRts(container, (base) => HIRAGANA.test(base)).length,
    ).toBeGreaterThan(0);
  });

  // DORMANT since the 2026-07-26 ARCHIVE: asserts behaviour for a module
  // that no longer exists in the course (it ends at m7). Re-enable as each
  // module is authored — the behaviour is real, the fixture is gone.
  it.skip(`at M${HIRAGANA_ROMAJI_OFF_MODULE}: hiragana romaji is hidden by module position (guards unflipped), katakana still shows`, () => {
    const lesson = getLesson(`ja-m${HIRAGANA_ROMAJI_OFF_MODULE}-1-1`);
    const moduleIndex = parseModuleIndex(lesson.moduleId);
    expect(moduleIndex).toBe(HIRAGANA_ROMAJI_OFF_MODULE);

    // A step carrying both scripts, so one render proves both directions.
    const step = findRenderableStep(lesson, (st) => {
      const segs = annotationSegments(st);
      return (
        segs.some((seg) => KATAKANA.test(seg.surface)) &&
        segs.some(
          (seg) => HIRAGANA.test(seg.surface) && !KATAKANA.test(seg.surface),
        )
      );
    });
    const { container } = renderStep(step, moduleIndex);

    // Hiragana-only surfaces: zero visible romaji.
    expect(
      visibleRomajiRts(
        container,
        (base) => HIRAGANA.test(base) && !KATAKANA.test(base),
      ),
    ).toEqual([]);
    // Katakana surfaces keep romaji until their own (later) threshold.
    expect(
      visibleRomajiRts(container, (base) => KATAKANA.test(base)).length,
    ).toBeGreaterThan(0);
  });

  // DORMANT since the 2026-07-26 ARCHIVE: asserts behaviour for a module
  // that no longer exists in the course (it ends at m7). Re-enable as each
  // module is authored — the behaviour is real, the fixture is gone.
  it.skip(`at M${KANJI_RECOGNITION_MODULE}: kanji surfaces reach rendered MCQ options (plural *Annotations branch) with furigana visible inside the window`, () => {
    const lesson = getLesson(`ja-m${KANJI_RECOGNITION_MODULE}-3-1`);
    const moduleIndex = parseModuleIndex(lesson.moduleId);
    expect(moduleIndex).toBe(KANJI_RECOGNITION_MODULE);

    // Regression #2 guard at the data level: the post-pass must have
    // rewritten a PLURAL "*Annotations" key (the previously dead branch)
    // into the furigana-ON shape (kanji surface, kana reading floats).
    const step = findRenderableStep(lesson, (st) => {
      const s = st as unknown as Record<string, unknown>;
      return Object.keys(s).some(
        (key) =>
          key.endsWith("Annotations") &&
          Array.isArray(s[key]) &&
          (s[key] as unknown[]).some(
            (arr) =>
              Array.isArray(arr) &&
              (arr as { surface: string; reading: string }[]).some(
                (seg) =>
                  HAS_HAN.test(seg.surface) && seg.reading !== seg.surface,
              ),
          ),
      );
    });
    const kanjiSeg = annotationSegments(step).find(
      (seg) => HAS_HAN.test(seg.surface) && seg.reading !== seg.surface,
    )!;
    // M8 unlocks sit inside the rolling furigana window at M8 itself.
    expect(moduleIndex).toBeLessThan(
      KANJI_RECOGNITION_MODULE + FURIGANA_WINDOW,
    );

    const { container } = renderStep(step, moduleIndex);

    // ...and at the QA vantage: the kanji is really on screen,
    const kanjiRuby = Array.from(container.querySelectorAll("ruby")).find(
      (r) => rubyBase(r as HTMLElement).includes(kanjiSeg.surface),
    ) as HTMLElement | undefined;
    expect(kanjiRuby, `kanji ${kanjiSeg.surface} must render`).toBeDefined();
    // ...its furigana floats visibly (okurigana-aligned: kanji-run only),
    const rt = kanjiRuby!.querySelector("rt.kana-helper")!;
    expect(rtVisible(rt as HTMLElement)).toBe(true);
    expect(rt.textContent).toBe(
      alignFurigana(kanjiSeg.surface, kanjiSeg.reading).rt,
    );
    // ...and never-mix holds: no romaji over any kanji surface.
    expect(
      visibleRomajiRts(container, (base) => HAS_HAN.test(base)),
    ).toEqual([]);
  });

  // DORMANT since the 2026-07-26 ARCHIVE: asserts behaviour for a module
  // that no longer exists in the course (it ends at m7). Re-enable as each
  // module is authored — the behaviour is real, the fixture is gone.
  it.skip(`at M${KATAKANA_ROMAJI_OFF_MODULE}: katakana romaji is gone too — zero visible romaji anywhere`, () => {
    const lesson = getLesson(`ja-m${KATAKANA_ROMAJI_OFF_MODULE}-1-1`);
    const moduleIndex = parseModuleIndex(lesson.moduleId);
    expect(moduleIndex).toBe(KATAKANA_ROMAJI_OFF_MODULE);

    const step = findRenderableStep(lesson, (st) =>
      annotationSegments(st).some((seg) => KATAKANA.test(seg.surface)),
    );
    const { container } = renderStep(step, moduleIndex);

    expect(allRts(container).length).toBeGreaterThan(0);
    expect(visibleRomajiRts(container)).toEqual([]);
  });

  // DORMANT since the 2026-07-26 ARCHIVE: this asserts behaviour for a
    // module that no longer exists in the course (it ends at m7). Re-enable
    // as each module is authored — do not delete, the behaviour is real.
    it.skip("at m29 (the exemplar): kanji_reading renders bare kanji — no romaji, no floated reading", () => {
    const lesson = getLesson("ja-m29-4-1");
    // Regression #1's exact failure: LessonContent.moduleId is the BARE
    // "m29" — parseModuleIndex must not return 0 for it.
    const moduleIndex = parseModuleIndex(lesson.moduleId);
    expect(moduleIndex).toBe(29);
    expect(moduleIndex).toBeGreaterThanOrEqual(KATAKANA_ROMAJI_OFF_MODULE);

    const step = findRenderableStep(
      lesson,
      (st) => st.type === "kanji_reading",
    );
    const { container } = renderStep(step, moduleIndex);

    // The tested kanji is on screen...
    expect(HAS_HAN.test(container.textContent ?? "")).toBe(true);
    // ...with no visible romaji anywhere (both scripts retired at m29),
    expect(visibleRomajiRts(container)).toEqual([]);
    // ...and no visible reading floated over any kanji surface (the
    // furigana-OFF shape must survive rendering — it IS the answer).
    for (const rt of allRts(container)) {
      const base = rubyBase(rt.parentElement as HTMLElement);
      if (HAS_HAN.test(base)) expect(rtVisible(rt)).toBe(false);
    }
  });

  it("m29/m30 (Spencer 2026-07-17 extension): a PAST-WINDOW sentence kanji floats furigana while its atom is unmastered, and hides it once FSRS-mastered", () => {
    // Find a real m29/m30 renderable step carrying a segment the kanji pass
    // stamped past its window (furiganaWindowOpen === false, atomId kept,
    // kana reading carried) — e.g. 学校 / 毎日 at m29+. Scan so the test
    // survives concurrent curriculum edits.
    type StampedSeg = {
      surface: string;
      reading: string;
      atomId?: string;
      furiganaWindowOpen?: boolean;
    };
    const isStampedPastWindow = (seg: StampedSeg) =>
      HAS_HAN.test(seg.surface) &&
      seg.reading !== seg.surface &&
      typeof seg.atomId === "string" &&
      seg.furiganaWindowOpen === false;

    let found:
      | { step: LessonStep; seg: StampedSeg; moduleIndex: number }
      | undefined;
    for (const id of getAvailableMockLessonIds()) {
      if (!/^ja-m(29|30)-/.test(id)) continue;
      const lesson = getMockLessonContent(id);
      if (!lesson) continue;
      for (const step of lesson.steps) {
        if (!RENDERABLE.has(step.type) || step.type === "kanji_reading") {
          continue; // kanji_reading suppresses by design — not this test
        }
        const seg = (annotationSegments(step) as StampedSeg[]).find(
          isStampedPastWindow,
        );
        if (seg) {
          found = { step, seg, moduleIndex: parseModuleIndex(lesson.moduleId) };
          break;
        }
      }
      if (found) break;
    }
    expect(
      found,
      "an m29/m30 renderable step with a past-window stamped kanji segment",
    ).toBeDefined();
    const { step, seg, moduleIndex } = found!;

    const findRt = (container: HTMLElement) => {
      const ruby = Array.from(container.querySelectorAll("ruby")).find((r) =>
        rubyBase(r as HTMLElement).includes(seg.surface),
      ) as HTMLElement | undefined;
      expect(ruby, `kanji ${seg.surface} must render`).toBeDefined();
      return ruby!.querySelector("rt.kana-helper") as HTMLElement;
    };

    // UNMASTERED (no SRS state): furigana visible despite the closed window.
    // The rt carries the OKURIGANA-ALIGNED reading (kanji-run only).
    const un = renderStep(step, moduleIndex);
    const rtUn = findRt(un.container);
    expect(rtVisible(rtUn)).toBe(true);
    expect(rtUn.textContent).toBe(alignFurigana(seg.surface, seg.reading).rt);
    un.unmount();

    // MASTERED (both modalities past the interval bar): same segment bare.
    getCardStateMock.mockReturnValue({
      recognition: { interval: MASTERED_INTERVAL_DAYS + 10 },
      production: { interval: MASTERED_INTERVAL_DAYS + 10 },
    } as never);
    const ma = renderStep(step, moduleIndex);
    expect(rtVisible(findRt(ma.container))).toBe(false);
  });

  // DORMANT since the 2026-07-26 ARCHIVE: asserts behaviour for a module
  // that no longer exists in the course (it ends at m7). Re-enable as each
  // module is authored — the behaviour is real, the fixture is gone.
  it.skip(`at M${KANJI_RECOGNITION_MODULE}+: sentence filler segments never float their own kana as a fake reading (f67479f regression)`, () => {
    // buildSentenceAnnotation filler runs span spaces/particles
    // ("は とおいです", surface === reading, no kanji). They once fell into
    // AnnotatedText's kanji-branch helper fallback and rendered their own
    // kana floating above themselves. ja-m8-6-1's speaking step
    // ("あの やまは とおいです") is the known case.
    const lesson = getLesson(`ja-m${KANJI_RECOGNITION_MODULE}-6-1`);
    const moduleIndex = parseModuleIndex(lesson.moduleId);
    expect(moduleIndex).toBe(KANJI_RECOGNITION_MODULE);

    const step = findRenderableStep(lesson, (st) => {
      if (st.type !== "speaking") return false;
      return annotationSegments(st).some(
        (seg) =>
          seg.surface === seg.reading &&
          !HAS_HAN.test(seg.surface) &&
          /\s/.test(seg.surface.trim()),
      );
    });
    const { container } = renderStep(step, moduleIndex);

    // The sentence really rendered…
    expect(container.querySelectorAll("ruby").length).toBeGreaterThan(0);
    // …and no visible helper over a kanji-free base contains kana: kana
    // helpers belong ONLY over kanji (furigana). A kana helper repeating
    // (part of) its own kana base is the f67479f defect.
    const KANA = /[ぁ-ゖァ-ヺー]/;
    for (const rt of allRts(container)) {
      if (!rtVisible(rt)) continue;
      const base = rubyBase(rt.parentElement as HTMLElement);
      if (HAS_HAN.test(base)) continue;
      expect(
        KANA.test(rt.textContent ?? ""),
        `kana helper "${rt.textContent}" floated over kanji-free base "${base}"`,
      ).toBe(false);
    }
  });

  it(`build tiles: the fade decision flips exactly at M${BUILD_TILE_ROMAJI_FADE_MODULE}, and faded tiles render no romaji`, () => {
    // The tile fade is settings-carried (`hideBuildTileRomaji`), flipped by
    // this decision when the learner reaches the module. Pin the threshold…
    const settings = settingsRef as unknown as UserSettings;
    expect(
      shouldAutoFadeBuildTileRomaji({
        settings,
        reachedModuleIndex: BUILD_TILE_ROMAJI_FADE_MODULE,
      }),
    ).toBe(true);
    expect(
      shouldAutoFadeBuildTileRomaji({
        settings,
        reachedModuleIndex: BUILD_TILE_ROMAJI_FADE_MODULE - 1,
      }),
    ).toBe(false);

    // …then prove the faded state renders tile banks with zero visible
    // romaji, through the real BuildSentenceStepView. Character-granularity
    // builds live in the m1 kana review lessons; the fade is carried by the
    // setting, so render at the fade module itself.
    const lesson = getLesson("ja-m1-ka-3");
    const step = lesson.steps.find(
      (st) =>
        st.type === "build_sentence" &&
        (st as { granularity?: string }).granularity === "character",
    );
    expect(step, "a character-granularity build step in ja-m1-ka-3").toBeDefined();

    settingsRef.learning.hideBuildTileRomaji = true;
    const { container } = renderStep(step!, BUILD_TILE_ROMAJI_FADE_MODULE);
    // The fade targets the TILE BANK only (the answer-giveaway surface) —
    // the target-word display legitimately keeps romaji below M7. Every
    // helper inside a tile button must be hidden.
    const tileRts = allRts(container).filter((rt) => rt.closest("button"));
    expect(tileRts.length).toBeGreaterThan(0);
    expect(tileRts.filter(rtVisible)).toEqual([]);
  });
});
