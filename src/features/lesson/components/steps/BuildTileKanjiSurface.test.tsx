/**
 * Build-tile kanji display (Spencer 2026-07-17 ruling) — render tests in
 * the BuildSentenceTransform mock style. Pins:
 *   - unlocked tile shows the KANJI surface with furigana <rt
 *     data-visible="true"> while the atom is NOT FSRS-mastered;
 *   - mastered atom → bare kanji, <rt data-visible="false">;
 *   - grading identity (step.tiles / correctOrder / bank click flow)
 *     stays the KANA strings;
 *   - character-granularity builds and out-of-lesson renders never
 *     kanji-fy;
 *   - listening_build (own view, not BuildSentenceStepView) is covered
 *     the same way.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
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
vi.mock("@/shared/audio/volume", () => ({ playLocalAudio: vi.fn() }));
vi.mock("@/shared/contexts/SettingsContext", () => ({
  useSettings: () => ({
    settings: { learning: { showRomanization: { ja: false } } },
    updateSetting: vi.fn(),
  }),
}));
// SRS mastery: mock ONLY getCardState (isMastered stays the real
// predicate — both modalities >= MASTERED_INTERVAL_DAYS).
const getCardStateMock = vi.fn();
vi.mock("@/features/flashcards/engine", async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  getCardState: (id: string) => getCardStateMock(id),
}));

import { BuildSentenceStepView } from "./BuildSentenceStepView";
import { ListeningBuildStepView } from "./ListeningBuildStepView";
import { LessonModuleProvider } from "@/shared/contexts/LessonModuleContext";
import { build, resolveEligibleKanjiAtomId } from "@/features/languages/ja/grammarHelpers";
import { KANJI_ELIGIBLE_ATOMS } from "@/features/languages/ja/secondScript/applyKanjiSurfaces";
import { MASTERED_INTERVAL_DAYS } from "@/features/flashcards/engine";
import type { ListeningBuildStep } from "../../types";

const noop = () => {};

// 店 — known eligible, non-homograph word (same anchor the match-pairs
// kanji test uses). Module + expected surface come from the live catalog.
const MISE = "みせ";
const miseAtomId = resolveEligibleKanjiAtomId(MISE)!;
const miseEntry = KANJI_ELIGIBLE_ATOMS.get(miseAtomId)!;
const UNLOCKED_MODULE = miseEntry.unlockModule;

const MASTERED_STATE = {
  recognition: { interval: MASTERED_INTERVAL_DAYS + 10 },
  production: { interval: MASTERED_INTERVAL_DAYS + 10 },
} as never;

const step = build(
  "test-tile-kanji-1",
  "Say: it is a shop.",
  "みせ です",
  ["みせ", "です", "ください"],
  ["みせ", "です"],
);

const listeningStep: ListeningBuildStep = {
  id: "test-tile-kanji-lb-1",
  type: "listening_build",
  audioKey: "みせ です",
  prompt: "Build what you hear",
  targetSentence: "みせ です",
  tiles: ["みせ", "です", "ください"],
  correctOrder: ["みせ", "です"],
  granularity: "word",
};

function renderInModule(ui: React.ReactElement, moduleIndex: number | null) {
  return render(
    <LessonModuleProvider moduleIndex={moduleIndex}>{ui}</LessonModuleProvider>,
  );
}

beforeEach(() => {
  getCardStateMock.mockReset();
  getCardStateMock.mockReturnValue(undefined); // default: no SRS state → unmastered
});

describe("build_sentence tile kanji display", () => {
  it("unmastered atom: kanji tile with furigana rt data-visible=true", () => {
    const { container } = renderInModule(
      <BuildSentenceStepView step={step} onComplete={noop} onContinue={noop} />,
      UNLOCKED_MODULE,
    );
    const rubies = container.querySelectorAll('ruby[data-build-tile-kanji="true"]');
    // Bank tile + ghost tray copy both kanji-fy (same glyphs for geometry).
    expect(rubies.length).toBeGreaterThanOrEqual(2);
    const rt = rubies[0]!.querySelector("rt")!;
    expect(rubies[0]!.textContent).toContain(miseEntry.kanji);
    expect(rt.getAttribute("data-visible")).toBe("true");
    expect(rt.textContent).toBe(MISE);
    // Ineligible tiles stay kana. (Hidden rt placeholders inject
    // zero-width spaces between glyphs — strip before matching.)
    expect(container.textContent!.replace(/​/g, "")).toContain("です");
    // "no visible reading = big word" (TestFlight #119/#117, b16.1): the
    // reading IS visible here, so the tile must NOT carry the sizing hook
    // index.css grows a hidden-reading tile with — a visible furigana band
    // already fills the space above the word.
    expect(rubies[0]!.hasAttribute("data-build-tile-reading")).toBe(false);
  });

  it("mastered atom: bare kanji, rt data-visible=false, no kana reading", () => {
    getCardStateMock.mockReturnValue(MASTERED_STATE);
    const { container } = renderInModule(
      <BuildSentenceStepView step={step} onComplete={noop} onContinue={noop} />,
      UNLOCKED_MODULE,
    );
    const ruby = container.querySelector('ruby[data-build-tile-kanji="true"]')!;
    expect(ruby).not.toBeNull();
    expect(ruby.textContent).toContain(miseEntry.kanji);
    const rt = ruby.querySelector("rt")!;
    expect(rt.getAttribute("data-visible")).toBe("false");
    expect(rt.textContent).not.toContain(MISE);
    // Mastery lookup used the resolved atom id.
    expect(getCardStateMock).toHaveBeenCalledWith(miseAtomId);
    // "no visible reading = big word": the hidden reading leaves the tile
    // in the same situation as a kana-only tile (nothing above its word),
    // so it carries `data-build-tile-reading="hidden"` — the hook
    // index.css's `[data-build-tile-reading="hidden"]` rule grows with the
    // same `--tile-kana-font` a kana-only tile gets.
    expect(ruby.getAttribute("data-build-tile-reading")).toBe("hidden");
  });

  it("grading identity stays kana: step fields untouched by rendering", () => {
    renderInModule(
      <BuildSentenceStepView step={step} onComplete={noop} onContinue={noop} />,
      UNLOCKED_MODULE,
    );
    expect(step.tiles).toEqual(["みせ", "です", "ください"]);
    expect(step.correctOrder).toEqual(["みせ", "です"]);
  });

  it("below the unlock module: tile stays kana", () => {
    const { container } = renderInModule(
      <BuildSentenceStepView step={step} onComplete={noop} onContinue={noop} />,
      UNLOCKED_MODULE - 1,
    );
    expect(container.querySelector("[data-build-tile-kanji]")).toBeNull();
    expect(container.textContent!.replace(/​/g, "")).toContain(MISE);
  });

  it("outside a lesson (no module provider): tile stays kana", () => {
    const { container } = render(
      <BuildSentenceStepView step={step} onComplete={noop} onContinue={noop} />,
    );
    expect(container.querySelector("[data-build-tile-kanji]")).toBeNull();
  });

  it("character-granularity builds never kanji-fy (kana IS the content)", () => {
    const charStep = {
      ...step,
      id: "test-tile-kanji-char",
      granularity: "character" as const,
      targetSentence: "みせ",
      tiles: ["み", "せ", "す"],
      correctOrder: ["み", "せ"],
    };
    const { container } = renderInModule(
      <BuildSentenceStepView step={charStep} onComplete={noop} onContinue={noop} />,
      UNLOCKED_MODULE,
    );
    expect(container.querySelector("[data-build-tile-kanji]")).toBeNull();
  });
});

describe("listening_build tile kanji display (own view)", () => {
  it("unmastered: kanji + visible furigana; grading kana untouched", () => {
    const { container } = renderInModule(
      <ListeningBuildStepView
        step={listeningStep}
        onComplete={noop}
        onContinue={noop}
      />,
      UNLOCKED_MODULE,
    );
    const ruby = container.querySelector('ruby[data-build-tile-kanji="true"]')!;
    expect(ruby).not.toBeNull();
    expect(ruby.textContent).toContain(miseEntry.kanji);
    expect(ruby.querySelector("rt")!.getAttribute("data-visible")).toBe("true");
    expect(listeningStep.tiles).toEqual(["みせ", "です", "ください"]);
    expect(ruby.hasAttribute("data-build-tile-reading")).toBe(false);
  });

  it("mastered: rt hidden (data-visible=false), tile carries the big-word sizing hook", () => {
    getCardStateMock.mockReturnValue(MASTERED_STATE);
    const { container } = renderInModule(
      <ListeningBuildStepView
        step={listeningStep}
        onComplete={noop}
        onContinue={noop}
      />,
      UNLOCKED_MODULE,
    );
    const ruby = container.querySelector('ruby[data-build-tile-kanji="true"]')!;
    const rt = ruby.querySelector("rt")!;
    expect(rt.getAttribute("data-visible")).toBe("false");
    // b16.3 (Spencer, QA page): listening_build follows the same rule as
    // build/listen dense tiles.
    expect(ruby.getAttribute("data-build-tile-reading")).toBe("hidden");
  });
});
