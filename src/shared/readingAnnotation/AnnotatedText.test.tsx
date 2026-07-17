import { describe, it, expect, beforeEach, vi } from "vitest";
import { render } from "@testing-library/react";

// Settings context: romaji helpers on; component logic under test is the
// segment→annotator routing, not the visibility policy (forceShowHelper
// bypasses mastery/fade anyway).
vi.mock("@/shared/contexts/SettingsContext", () => ({
  useSettings: () => ({
    settings: { learning: { showRomaji: true } },
  }),
}));

import { AnnotatedText } from "./AnnotatedText";
import { LessonModuleProvider } from "@/shared/contexts/LessonModuleContext";
import { __resetRomajiLexiconCachesForTest } from "@/features/languages/ja/romajiLexicon";
import {
  JA_COURSE_ATOMS,
  canonicalAtomId,
} from "@/features/languages/ja/courseAtoms";

const UNLOCKED_KEY = "lingo:unlocked-atoms";

function unlockPastKanaPhase(): void {
  const m3atom = JA_COURSE_ATOMS.find((a) => a.fromModule === "m3")!;
  localStorage.setItem(UNLOCKED_KEY, JSON.stringify([canonicalAtomId(m3atom)]));
}

beforeEach(() => {
  localStorage.clear();
  __resetRomajiLexiconCachesForTest();
});

describe("AnnotatedText segments mode — word-level romaji grouping", () => {
  it("groups a pure-kana segment into one word ruby past the kana phase", () => {
    // Regression: SpeakingStepView reference cards rendered さん as two
    // per-kana rubies "sa"+"n" forever — the segments path bypassed the
    // word lexicon that the bare path already used.
    unlockPastKanaPhase();
    const { container } = render(
      <AnnotatedText
        segments={[{ surface: "さん", reading: "さん" }]}
        forceShowHelper
      />,
    );
    const word = container.querySelector('ruby[data-word-romaji="true"]');
    expect(word).not.toBeNull();
    expect(word!.textContent).toContain("さん");
    expect(word!.querySelector("rt")!.textContent).toBe("san");
  });

  it("stays per-kana during the kana phase (M1–M2)", () => {
    // No unlocked atoms past m2 → per-kana alignment IS the lesson.
    const { container } = render(
      <AnnotatedText
        segments={[{ surface: "さん", reading: "さん" }]}
        forceShowHelper
      />,
    );
    expect(container.querySelector('ruby[data-word-romaji="true"]')).toBeNull();
    const rts = [...container.querySelectorAll("rt")].map((r) => r.textContent);
    expect(rts).toEqual(["sa", "n"]);
  });

  it("authored segment-level romaji still wins over the annotator", () => {
    unlockPastKanaPhase();
    const { container } = render(
      <AnnotatedText
        segments={[{ surface: "さん", reading: "さん", romaji: "SAN-OVERRIDE" }]}
        forceShowHelper
      />,
    );
    expect(container.textContent).toContain("SAN-OVERRIDE");
  });
});

describe("AnnotatedText — module-aware romaji retirement (QA-jump leak fix)", () => {
  // The word ruby always renders past the kana phase; the romaji HELPER text
  // inside its <rt> is what the gate controls (visible → "san", hidden →
  // zero-width space + data-visible="false"). So assert on the helper, not the
  // ruby element's existence.
  const helperOf = (container: HTMLElement) =>
    container.querySelector('ruby[data-word-romaji="true"] rt');

  it("suppresses hiragana romaji at a module past the m7 threshold, even with forceShowHelper", () => {
    unlockPastKanaPhase();
    const { container } = render(
      <LessonModuleProvider moduleIndex={29}>
        <AnnotatedText segments={[{ surface: "さん", reading: "さん" }]} forceShowHelper />
      </LessonModuleProvider>,
    );
    const rt = helperOf(container)!;
    expect(rt.getAttribute("data-visible")).toBe("false");
    expect(rt.textContent).not.toContain("san");
  });

  it("still shows hiragana romaji at an early module", () => {
    unlockPastKanaPhase();
    const { container } = render(
      <LessonModuleProvider moduleIndex={3}>
        <AnnotatedText segments={[{ surface: "さん", reading: "さん" }]} forceShowHelper />
      </LessonModuleProvider>,
    );
    const rt = helperOf(container)!;
    expect(rt.getAttribute("data-visible")).toBe("true");
    expect(rt.textContent).toBe("san");
  });

  it("with no provider (outside a lesson) romaji is unchanged — still shows", () => {
    unlockPastKanaPhase();
    const { container } = render(
      <AnnotatedText segments={[{ surface: "さん", reading: "さん" }]} forceShowHelper />,
    );
    const rt = helperOf(container)!;
    expect(rt.getAttribute("data-visible")).toBe("true");
    expect(rt.textContent).toBe("san");
  });
});

describe("AnnotatedText — kana-run filler segments (buildSentenceAnnotation shape)", () => {
  // Regression (ja-m8-6-1 speaking, 2026-07-17): buildSentenceAnnotation
  // emits filler segments whose surface spans spaces/particles, e.g.
  // { surface: "は とおいです", reading: "は とおいです" }. The space made
  // isPureKana false, so the segment fell into the kanji-branch helper
  // fallback (romaji ?? reading) and floated its own kana above itself.
  const FILLER = { surface: "は とおいです", reading: "は とおいです" };

  it("never floats a kana reading above an identical kana surface", () => {
    unlockPastKanaPhase();
    const { container } = render(
      <LessonModuleProvider moduleIndex={8}>
        <AnnotatedText segments={[FILLER]} forceShowHelper />
      </LessonModuleProvider>,
    );
    for (const rt of container.querySelectorAll("rt")) {
      const text = rt.textContent ?? "";
      expect(
        /[ぁ-んァ-ン]/.test(text),
        `kana helper "${text}" floated above kana surface`,
      ).toBe(false);
    }
  });

  it("routes space-bearing kana fillers through the annotator like bare text (romaji visible pre-m7)", () => {
    unlockPastKanaPhase();
    const { container } = render(
      <LessonModuleProvider moduleIndex={5}>
        <AnnotatedText segments={[FILLER]} forceShowHelper />
      </LessonModuleProvider>,
    );
    // Same behavior as rendering the bare string: word-grouped romaji rubies.
    expect(container.querySelector('ruby[data-word-romaji="true"]')).not.toBeNull();
    const helpers = [...container.querySelectorAll("rt")].map((r) => r.textContent ?? "");
    expect(helpers.some((t) => /[a-z]/.test(t))).toBe(true);
    for (const t of helpers) expect(/[ぁ-んァ-ン]/.test(t)).toBe(false);
  });
});
