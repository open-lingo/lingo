/**
 * b15 #127 — "the audio is bleeding over into the next step... I think we
 * solved this with lessons already, look into it please."
 *
 * `PlacementTestPage`'s advance effect already calls `stopAllAudio()`
 * synchronously the moment the engine selects the next item
 * (`PlacementTestPage.tsx` ~:270). The gap: a manual play-button tap's own
 * clip playback is ASYNC (network fetch + decode), so a tap made right at
 * submit time can still be in flight when that stop fires — it resolves
 * afterwards and starts a fresh clip on the NEW screen with nothing left to
 * cut it off (`docs/user-feedback/2026-09-15-testflight-b15.md` #127).
 *
 * The play buttons themselves live in step-view components this lane does
 * not own (`features/lesson/components/steps/**`), so the fix here is
 * page-scoped: re-assert `stopAllAudio()` again once the NEXT item has
 * actually MOUNTED, closing the gap for the realistic case (a fast/cached
 * clip resolving within the same tick the advance lands) even though a
 * per-tap "is this still current" check in the step view itself is the only
 * way to close it completely.
 *
 * This test drives the REAL `PlacementTestPage` advance path (the actual
 * effects under test) through two synthetic items, with the engine/question
 * bank mocked out so the test isn't at the mercy of a real step's tile UI —
 * none of the mocked modules are files this lane owns or edits; the
 * assertions are entirely about `PlacementTestPage`'s own stop-audio wiring.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, cleanup, act } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import type { LessonStep } from "@/features/lesson/types";
import type { AdaptiveState } from "./engine/adaptiveEngine";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (
      _k: string,
      fb?: string | Record<string, unknown>,
      opts?: Record<string, unknown>,
    ) => {
      const s =
        typeof fb === "string" ? fb : (fb as { defaultValue?: string })?.defaultValue ?? _k;
      const vars = (typeof fb === "object" ? fb : opts) ?? {};
      return s.replace(/\{\{(\w+)\}\}/g, (_m, k) =>
        String((vars as Record<string, unknown>)[k] ?? ""),
      );
    },
  }),
}));

// A STABLE reference — `PlacementTestPage`'s advance effect lists `progress`
// in its dependency array, so a mock returning a fresh object on every call
// (as other test files in this dir do) makes the effect re-fire on every
// render for reasons that have nothing to do with the guard under test,
// which would make a call-count assertion here meaningless.
const apiRef = { progress: {} };
vi.mock("@/shared/api/provider", () => ({
  useApi: () => apiRef,
}));

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
// STABLE for the same reason `apiRef` above is: `updateSetting` sits in the
// advance effect's dependency array too, so a fresh `vi.fn()` on every call
// to `useSettings()` would re-fire that effect every render.
const updateSettingMock = vi.fn();
vi.mock("@/shared/contexts/SettingsContext", () => ({
  useSettings: () => ({ settings: settingsRef, updateSetting: updateSettingMock }),
}));

vi.mock("@/shared/contexts/LanguageContext", () => ({
  useLanguage: () => ({ language: { id: "ja" } }),
}));

vi.mock("@/features/lesson/data/useLessonContent", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@/features/lesson/data/useLessonContent")>();
  return {
    ...actual,
    useCourseReady: () => "ready" as const,
  };
});

// The mechanism under test: a spy standing in for the shared TTS module's
// `stopAllAudio`. Everything else in the module is kept REAL — curriculum
// content built at import time (`lessonBuilder.ts`) calls `getTtsUrl` etc.
// on its own, unrelated to anything this test drives.
const stopAllAudioMock = vi.fn();
vi.mock("@/shared/tts", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/shared/tts")>();
  return {
    ...actual,
    stopAllAudio: () => stopAllAudioMock(),
  };
});

// Two synthetic items. `moduleId`/`languageId` shape mirrors PlacementItemConfig
// closely enough for the mocked `instantiateItem` below to consume; the real
// shape doesn't matter because the real `instantiateItem` (owned by
// `./questionBank`, out of this lane) is mocked out entirely.
const FAKE_ITEMS = [
  { id: "item-1", moduleId: "m33", step: { id: "fake-step-1", type: "multiple_choice" } },
  { id: "item-2", moduleId: "m33", step: { id: "fake-step-2", type: "multiple_choice" } },
];

type FakeState = AdaptiveState & { _idx: number };

function makeInitialState(): FakeState {
  return {
    languageId: "ja",
    stage: "probing",
    sampleModules: [],
    bandTopModule: null,
    probeResults: {},
    probeQueue: [],
    currentProbeModule: null,
    consecutiveWrong: 0,
    servedItemIds: [],
    totalServed: 0,
    passedModules: [],
    assumedModules: [],
    missedSkills: [],
    _idx: 0,
  };
}

vi.mock("./engine/adaptiveEngine", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./engine/adaptiveEngine")>();
  return {
    ...actual,
    createTestOutState: vi.fn(() => makeInitialState()),
    createBandedState: vi.fn(() => makeInitialState()),
    selectNextItem: vi.fn((state: FakeState) => FAKE_ITEMS[state._idx] ?? null),
    recordAnswer: vi.fn((prev: FakeState) => ({ ...prev, _idx: prev._idx + 1 })),
    finalizeState: vi.fn((prev: FakeState) => ({ ...prev, stage: "done" as const })),
  };
});

vi.mock("./engine/deriveModuleTestOut", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("./engine/deriveModuleTestOut")>();
  return {
    ...actual,
    getDerivedTestOutItems: vi.fn(() => FAKE_ITEMS),
    TESTOUT_DERIVED_FLOOR: 1,
  };
});

vi.mock("./questionBank", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./questionBank")>();
  return {
    ...actual,
    getItemsForModule: vi.fn(() => FAKE_ITEMS),
    instantiateItem: vi.fn(
      (config: (typeof FAKE_ITEMS)[number]) => config.step as unknown as LessonStep,
    ),
  };
});

vi.mock("./engine/applyPlacement", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./engine/applyPlacement")>();
  return {
    ...actual,
    applyPlacementResult: vi.fn(() => ({
      passedModules: [],
      assumedModules: [],
      skippedLessonCount: 0,
      seededAtomCount: 0,
      missedSkills: [],
    })),
  };
});

vi.mock("./engine/syncTestOutToServer", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("./engine/syncTestOutToServer")>();
  return {
    ...actual,
    syncTestOutToServer: vi.fn(() => Promise.resolve()),
  };
});

// A minimal stand-in for the real `StepRenderer` (owned by
// `features/lesson/components/**`, out of this lane) — just enough surface
// (the stage id PlacementTestPage's own shell wraps around it, and a
// "submit" button) to drive the real advance path under test.
vi.mock("@/features/lesson/components/StepRenderer", () => ({
  StepRenderer: ({
    step,
    onComplete,
  }: {
    step: LessonStep;
    onComplete: (stepId: string, correct: boolean) => void;
  }) => (
    <button type="button" onClick={() => onComplete(step.id, true)}>
      submit {step.id}
    </button>
  ),
}));

import { PlacementTestPage } from "./PlacementTestPage";

describe("PlacementTestPage — still-current-item audio guard (b15 #127)", () => {
  beforeEach(() => {
    stopAllAudioMock.mockClear();
  });
  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  function renderPage() {
    return render(
      <MemoryRouter initialEntries={["/ja/learn/test-out/m33"]}>
        <Routes>
          <Route path=":lang/learn/test-out/:moduleId" element={<PlacementTestPage />} />
        </Routes>
      </MemoryRouter>,
    );
  }

  it("stops audio again once the NEXT item has actually mounted, not only at select-time", () => {
    renderPage();

    // First item mounts. Every dependency is mocked to resolve synchronously
    // (`useCourseReady` returns "ready" directly, the engine/question-bank
    // mocks above are plain functions, not promises), so RTL's `render` —
    // which flushes effects inside its own `act()` — has already settled by
    // the time it returns; no polling `waitFor` needed for this transition.
    expect(screen.getByText("submit fake-step-1")).toBeTruthy();
    // The very first mount already ran the guard once (harmless — nothing to
    // stop yet). Baseline it out so we can count fresh calls for the
    // transition under test.
    const beforeAdvance = stopAllAudioMock.mock.calls.length;
    expect(beforeAdvance).toBeGreaterThan(0);

    // Advance to item 2.
    act(() => {
      screen.getByText("submit fake-step-1").click();
    });

    expect(screen.getByText("submit fake-step-2")).toBeTruthy();

    // TWO stops happened for this one transition: the advance-time call in
    // the "select next item" effect, and the new post-mount guard effect
    // firing for fake-step-2. A single call here would mean the b15 #127
    // guard regressed to "advance-time only" — the exact gap the bug report
    // describes (a stale play resolving strictly after that first stop).
    const afterAdvance = stopAllAudioMock.mock.calls.length;
    expect(afterAdvance - beforeAdvance).toBeGreaterThanOrEqual(2);
  });

  it("the post-mount stop already ran before a fast (cached-clip-speed) stale play would resolve", () => {
    renderPage();
    expect(screen.getByText("submit fake-step-1")).toBeTruthy();

    const callOrder: string[] = [];
    stopAllAudioMock.mockImplementation(() => {
      callOrder.push("stop");
    });

    // Fake timers ONLY from here — real timers up to this point keep RTL's
    // own internals (act's microtask flush) untouched; only the deliberate
    // `setTimeout` below needs to be under test control.
    vi.useFakeTimers();

    // Simulate the exact race from the report: a manual play tap on
    // fake-step-1, made right before submit, whose async clip-start would
    // land a few ms later — fast enough to model an already-cached clip
    // (the common case: the learner already heard it once via autoplay).
    setTimeout(() => callOrder.push("stale-play-would-start"), 5);

    act(() => {
      screen.getByText("submit fake-step-1").click();
    });
    expect(screen.getByText("submit fake-step-2")).toBeTruthy();

    // Let the stale timer elapse.
    act(() => {
      vi.advanceTimersByTime(10);
    });

    // Both the advance-time stop and the post-mount stop for fake-step-2
    // land BEFORE the point a fast stale play would have started — so a
    // fresh stop has already run by the time it would have started
    // audibly playing on the new screen.
    const staleIndex = callOrder.indexOf("stale-play-would-start");
    const stopsBeforeStale = callOrder
      .slice(0, staleIndex)
      .filter((c) => c === "stop").length;
    expect(staleIndex).toBeGreaterThan(-1);
    expect(stopsBeforeStale).toBeGreaterThanOrEqual(2);
  });
});
