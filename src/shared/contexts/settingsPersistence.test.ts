import { describe, it, expect } from "vitest";
import { toBackendPatch, fromBackendResponse } from "./SettingsContext";
import { DEFAULT_SETTINGS, type UserSettings } from "@/shared/settings/types";

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
    expect(hydrated.appearance?.themeId).toBe("sepia");
    expect(hydrated.appearance?.navLayout).toBe(
      DEFAULT_SETTINGS.appearance.navLayout,
    );
    expect(hydrated.learning?.learningLanguageId).toBe("ja");
    expect(hydrated.learning?.onboardingCompleted).toBe(true);
  });

  it("falls back to default theme when none is stored", () => {
    const hydrated = fromBackendResponse({});
    expect(hydrated.appearance?.themeId).toBe(
      DEFAULT_SETTINGS.appearance.themeId,
    );
  });
});
