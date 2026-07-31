import { describe, it, expect, beforeEach } from "vitest";
import { toBackendPatch, fromBackendResponse, mergeWithDefaults } from "./SettingsContext";
import { DEFAULT_SETTINGS, type UserSettings } from "@/shared/settings/types";
import { getStoredSettings } from "@/features/settings/storage";

/**
 * Persistence contract: every settings namespace that maps to real runtime
 * behavior must round-trip through the backend blob, so switching device or
 * clearing site data preserves the user's choices (sidebar-vs-topbar,
 * reduced-motion, volume, etc.). The backend stores an opaque blob and
 * deep-merges, so `toBackendPatch` -> server -> `fromBackendResponse` should be
 * lossless for the fields we send.
 */
describe("settings backend persistence", () => {
  const customized: UserSettings = {
    ...DEFAULT_SETTINGS,
    appearance: { themeId: "dark", navLayout: "sidebar" },
    accessibility: { reducedMotion: true, dyslexiaFont: true, fontSize: 1.25 },
    audio: { silentMode: true, volume: 0.4 },
    notifications: { reminderEnabled: true, dailyReminderTime: "13:30" },
    learning: {
      ...DEFAULT_SETTINGS.learning,
      learningLanguageId: "ja",
      uiLocale: "ko",
      onboardingCompleted: true,
      showRomanization: false,
    },
  };

  it("sends navLayout to the backend", () => {
    const patch = toBackendPatch(customized);
    expect((patch.appearance as Record<string, unknown>).navLayout).toBe(
      "sidebar",
    );
  });

  it("sends accessibility, audio, and notifications namespaces", () => {
    const patch = toBackendPatch(customized);
    expect(patch.accessibility).toMatchObject({
      reducedMotion: true,
      dyslexiaFont: true,
      fontSize: 1.25,
    });
    expect(patch.audio).toMatchObject({ silentMode: true, volume: 0.4 });
    expect(patch.notifications).toMatchObject({
      reminderEnabled: true,
      dailyReminderTime: "13:30",
    });
  });

  it("mirrors legacy flat keys for older consumers", () => {
    const patch = toBackendPatch(customized);
    expect(patch.theme).toBe("dark");
    expect(patch.learningLanguage).toBe("ja");
    expect(patch.uiLocale).toBe("ko");
  });

  it("round-trips navLayout and other real settings through the backend blob", () => {
    // Simulate the server echoing back the patch it stored.
    const stored = toBackendPatch(customized) as Record<string, unknown>;
    const hydrated = fromBackendResponse(stored);

    expect(hydrated.appearance?.navLayout).toBe("sidebar");
    expect(hydrated.appearance?.themeId).toBe("dark");
    expect(hydrated.accessibility?.reducedMotion).toBe(true);
    expect(hydrated.accessibility?.dyslexiaFont).toBe(true);
    expect(hydrated.accessibility?.fontSize).toBe(1.25);
    expect(hydrated.audio?.silentMode).toBe(true);
    expect(hydrated.audio?.volume).toBe(0.4);
    expect(hydrated.notifications?.reminderEnabled).toBe(true);
    expect(hydrated.notifications?.dailyReminderTime).toBe("13:30");
    expect(hydrated.learning?.learningLanguageId).toBe("ja");
    expect(hydrated.learning?.uiLocale).toBe("ko");
    expect(hydrated.learning?.showRomanization).toBe(false);
  });

  describe("reading-aid romaji→romanization migration", () => {
    it("carries a legacy showRomaji=false blob over to showRomanization (backend hydrate)", () => {
      // A JA learner who turned the reading aid OFF before the rename has
      // `showRomaji: false` (and no `showRomanization`) in the opaque server
      // `learning` blob. A raw rename would read the absent `showRomanization`
      // and reset them back to the default ON.
      const legacy = { learning: { showRomaji: false } } as Record<string, unknown>;
      const hydrated = fromBackendResponse(legacy);
      expect(hydrated.learning?.showRomanization).toBe(false);
      expect(
        (hydrated.learning as Record<string, unknown>).showRomaji,
      ).toBeUndefined();
    });

    it("carries legacy showRomaji=false over during localStorage (mergeWithDefaults) hydration", () => {
      const merged = mergeWithDefaults({
        learning: { showRomaji: false },
      } as unknown as Partial<UserSettings>);
      expect(merged.learning.showRomanization).toBe(false);
      expect(
        (merged.learning as Record<string, unknown>).showRomaji,
      ).toBeUndefined();
    });

    it("migrates romajiOnForDay and romajiAutoFlipped to their romanization names", () => {
      const legacy = {
        learning: { romajiOnForDay: "2026-07-30", romajiAutoFlipped: true },
      } as Record<string, unknown>;
      const hydrated = fromBackendResponse(legacy);
      expect(hydrated.learning?.romanizationOnForDay).toBe("2026-07-30");
      expect(hydrated.learning?.romanizationAutoFlipped).toBe(true);
    });

    it("does not clobber an explicit new-key value with the legacy one", () => {
      // A learner who has already written the new key (e.g. via a newer client)
      // keeps it — the legacy value must not override it.
      const blob = {
        learning: { showRomaji: true, showRomanization: false },
      } as Record<string, unknown>;
      const hydrated = fromBackendResponse(blob);
      expect(hydrated.learning?.showRomanization).toBe(false);
    });
  });

  it("round-trips the frequency-vocab opt-in through the backend blob", () => {
    const withFreq: UserSettings = {
      ...customized,
      flashcards: {
        ...DEFAULT_SETTINGS.flashcards!,
        frequencyVocab: true,
      },
    };
    const stored = toBackendPatch(withFreq) as Record<string, unknown>;
    expect((stored.flashcards as Record<string, unknown>).frequencyVocab).toBe(
      true,
    );
    const hydrated = fromBackendResponse(stored);
    expect(hydrated.flashcards?.frequencyVocab).toBe(true);
  });

  it("hydrates from legacy flat-only blobs and infers onboarding", () => {
    const hydrated = fromBackendResponse({
      theme: "sepia",
      learningLanguage: "ja",
      uiLocale: "en",
    });
    expect(hydrated.appearance?.themeId).toBe("light"); // sepia retired → maps to light
    expect(hydrated.appearance?.navLayout).toBe(
      DEFAULT_SETTINGS.appearance.navLayout,
    );
    expect(hydrated.learning?.learningLanguageId).toBe("ja");
    expect(hydrated.learning?.onboardingCompleted).toBe(true);
  });

  it("re-normalizes a retired themeId in the nested appearance blob", () => {
    // toBackendPatch writes BOTH the flat `theme` mirror and the nested
    // `appearance.themeId` on every save, so an account that saved "sepia"
    // before the retirement carries the raw value in the nested shape too.
    // The nested merge must not let it survive un-normalized.
    const hydrated = fromBackendResponse({
      theme: "sepia",
      appearance: { themeId: "sepia", navLayout: "sidebar" },
    });
    expect(hydrated.appearance?.themeId).toBe("light");
    expect(hydrated.appearance?.navLayout).toBe("sidebar");
  });

  it("falls back to default theme when none is stored", () => {
    const hydrated = fromBackendResponse({});
    expect(hydrated.appearance?.themeId).toBe(
      DEFAULT_SETTINGS.appearance.themeId,
    );
  });

  describe("localStorage hydration (signed-out / Phase-1 path)", () => {
    beforeEach(() => {
      localStorage.clear();
    });

    it("normalizes a retired themeId read from the current settings localStorage key", () => {
      // This is the exact seam SettingsProvider's Phase-1 effect uses:
      // getStoredSettings() (single-key localStorage blob) -> mergeWithDefaults().
      // A signed-out ex-sepia user has this raw value sitting in
      // "open-lingo-settings" from before the preset was retired.
      localStorage.setItem(
        "open-lingo-settings",
        JSON.stringify({ appearance: { themeId: "sepia", navLayout: "topbar" } }),
      );
      const stored = getStoredSettings();
      const merged = mergeWithDefaults(stored ?? {});
      expect(merged.appearance.themeId).toBe("light");
    });
  });
});
