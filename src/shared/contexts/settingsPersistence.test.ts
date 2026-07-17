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
      showRomaji: false,
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
    expect(hydrated.learning?.showRomaji).toBe(false);
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
