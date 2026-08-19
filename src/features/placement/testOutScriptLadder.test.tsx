/**
 * A test-out must render module content exactly as that module's LESSON does.
 *
 * Spencer 2026-08-18, on an m31 test-out: *"check the furigana and romaji
 * displays inside the test outs, doesnt seem they respect it the same as
 * normal lessons."* The step 「先生に 辞書を いただいた」 rendered with romaji
 * over its kana (`ni`, `o`, `i ta da i ta`) — the same step inside m31's
 * lesson shows none, because hiragana romaji retires at M7.
 *
 * Cause: the script ladder is gated at RENDER time by `LessonModuleContext`,
 * and `PlacementTestPage` mounted no provider, so `useLessonModuleIndex()`
 * returned null and the gate fell back to the persisted
 * `hiraganaRomajiAutoOff` flag — which only flips when an M7+ lesson is
 * COMPLETED. That is the exact leak `LessonModuleProvider` was introduced
 * for; the test-out was simply never wired to it.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, cleanup } from "@testing-library/react";

vi.mock("@/shared/hooks/useLangPath", () => ({
  useLangPath: () => (p: string) => `/ja/${p.replace(/^\//, "")}`,
  useLang: () => "ja",
}));
// Romaji ON in settings and the auto-off flag NEVER flipped — the state a
// learner is in when they jump straight to a late test-out. Position is the
// only thing that can retire romaji here, which is the whole point.
const settingsRef = {
  learning: {
    showRomanization: {},
    hiraganaRomajiAutoOff: false,
    katakanaRomajiAutoOff: false,
    hideBuildTileRomaji: false,
    buildTileRomajiAutoFlipped: false,
  },
  audio: { silentMode: false },
  accessibility: { reducedMotion: false },
};
vi.mock("@/shared/contexts/SettingsContext", () => ({
  useSettings: () => ({ settings: settingsRef, updateSetting: vi.fn() }),
}));
vi.mock("@/shared/contexts/LanguageContext", () => ({
  useLanguage: () => ({ language: { id: "ja" } }),
}));

import { StepRenderer } from "@/features/lesson/components/StepRenderer";
import { LessonStepEnvironment } from "@/features/lesson/components/LessonStepEnvironment";
import { deriveModuleTestOut } from "./engine/deriveModuleTestOut";
import { HIRAGANA_ROMAJI_OFF_MODULE } from "@/shared/settings/romanizationAutoFlip";
import type { LessonStep } from "@/features/lesson/types";

/** Latin text inside a reading helper — i.e. romaji, not furigana. */
function romajiHelpers(root: HTMLElement): string[] {
  return [...root.querySelectorAll("rt")]
    .map((rt) => rt.textContent ?? "")
    .filter((t) => /[a-z]/i.test(t));
}

const LATE_MODULE = "m31";
const LATE_INDEX = 31;

describe("test-out honours the script ladder", () => {
  beforeEach(cleanup);

  it("instrument control: the module is past the hiragana romaji cutoff", () => {
    expect(LATE_INDEX).toBeGreaterThanOrEqual(HIRAGANA_ROMAJI_OFF_MODULE);
  });

  const steps: LessonStep[] = deriveModuleTestOut(LATE_MODULE).steps;

  it("derives steps to check", () => {
    expect(steps.length).toBeGreaterThan(0);
  });

  it("shows NO romaji on any derived m31 test-out step", () => {
    const offenders: string[] = [];
    for (const step of steps) {
      const { container, unmount } = render(
        <LessonStepEnvironment moduleIndex={LATE_INDEX}>
          <StepRenderer step={step} onComplete={() => {}} onContinue={() => {}} />
        </LessonStepEnvironment>,
      );
      const hits = romajiHelpers(container);
      if (hits.length > 0) offenders.push(`${step.id} (${step.type}): ${hits.join(" ")}`);
      unmount();
    }
    expect(offenders).toEqual([]);
  });

  /**
   * Proves the environment is what fixes it. Without this, the assertion
   * above would keep passing if `LessonStepEnvironment` became a no-op —
   * or if m31's content simply stopped containing annotatable kana.
   */
  it("instrument control: the same steps DO leak romaji with no environment", () => {
    let leaked = 0;
    for (const step of steps) {
      const { container, unmount } = render(
        <StepRenderer step={step} onComplete={() => {}} onContinue={() => {}} />,
      );
      if (romajiHelpers(container).length > 0) leaked++;
      unmount();
    }
    expect(leaked).toBeGreaterThan(0);
  });
});
