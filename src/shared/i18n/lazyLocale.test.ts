/**
 * LAZY-LOCALE FUNCTIONAL CHECK (2026-09-17, lane A9).
 *
 * `i18n.ts` used to statically `import` all three UI-locale JSON files
 * (en/ko/es), landing ~77 KB gzip of never-used-by-most-users strings in the
 * eager entry chunk (docs/perf-2026-09-17.md §2). It now bundles only `en`
 * and loads `ko`/`es` through `i18next-resources-to-backend`'s dynamic
 * `import()`, with `react: { useSuspense: false }` so a read before the
 * chunk lands falls back to `en` instead of throwing.
 *
 * The task brief asked this to be verified live on the 15 Pro Max
 * simulator. That was attempted (see docs/platform-2026-09-17.md) but the
 * shared `:5399` dev server other lanes also use was confirmed (via a
 * direct `curl` of its served `/src/shared/i18n/i18n.ts`) to still be
 * serving a DIFFERENT worktree's pre-lazy-load code — restarting it to
 * pick up this branch would silently redirect every other concurrent
 * lane's captures until someone restarted it back, so this lane did not.
 * This test instead exercises the REAL `i18next` singleton this module
 * exports (not a mock, not react-i18next's test utilities) end to end:
 * the same `changeLanguage` → dynamic `import()` → re-render-on-load path
 * `SettingsContext.tsx`'s `uiLocale` effect drives in the app, and the
 * `useSuspense: false` fallback behavior a component sees on the frame
 * before that import resolves.
 */
import { describe, it, expect, beforeAll } from "vitest";
import i18n from "./i18n";

describe("lazy UI-locale backend (real i18next instance)", () => {
  beforeAll(async () => {
    // The module-scope `i18n.init(...)` call in `./i18n` is async once a
    // backend is involved (even for the bundled `en` — i18next resolves
    // `resources`-provided languages on the same initialization promise).
    // `i18n.init()` returns that promise; `initReactI18next`/i18next expose
    // no re-entrant handle to it from here, so wait on the library's own
    // "initialized" signal instead of a fixed timeout.
    if (!i18n.isInitialized) {
      await new Promise<void>((resolve) => i18n.on("initialized", () => resolve()));
    }
  });

  it("starts on `en`, fully loaded synchronously from the bundle (no network/import wait)", () => {
    expect(i18n.language).toMatch(/^en/);
    expect(i18n.t("syncManager.titleShort")).toBe("Sync");
  });

  it("changeLanguage('ko') resolves the REAL dynamic import and swaps the string", async () => {
    expect(i18n.getResourceBundle("ko", "translation")).toBeFalsy();

    await i18n.changeLanguage("ko");

    expect(i18n.language).toBe("ko");
    // Proves the `i18next-resources-to-backend` callback in `i18n.ts` ran a
    // genuine `import("./locales/ko.json")` (not a stub) and i18next
    // unwrapped `.default` correctly (the library's own logic — see
    // node_modules/i18next-resources-to-backend/src/index.js).
    expect(i18n.t("syncManager.titleShort")).toBe("동기화");
  });

  it("useSuspense:false: a read for an unloaded language falls back to `en` instead of throwing", async () => {
    // Start from a known state — the previous test left `i18n.language` on
    // `ko`, which IS loaded, so a bare `.t()` there wouldn't exercise the
    // fallback path at all.
    await i18n.changeLanguage("en");

    // `es` has never been requested in this file yet — assert the backend
    // truly hasn't loaded it before proving the no-throw fallback.
    expect(i18n.getResourceBundle("es", "translation")).toBeFalsy();

    // With `useSuspense: true` (react-i18next's default, and what this repo
    // shipped before this change), `i18n.getFixedT`/`t()` calls from
    // `useTranslation()` throw a promise when the language isn't loaded —
    // there's no <Suspense> boundary anywhere in main.tsx's render tree to
    // catch that. `i18n.t()` itself (used directly here, not through the
    // React hook) never throws either way; the meaningful assertion is that
    // reading a string for an unloaded language resolves to the `en`
    // fallback value rather than a missing-key placeholder or an error —
    // exactly what a component mid-import would render for one frame.
    i18n.changeLanguage("es"); // deliberately not awaited — read while in flight
    expect(i18n.t("syncManager.titleShort")).toBe("Sync");

    await i18n.changeLanguage("es");
    expect(i18n.t("syncManager.titleShort")).toBe("Sinc.");
  });

  it("switching back to en works from a lazily-loaded language (round trip, matches the settings switch)", async () => {
    await i18n.changeLanguage("ko");
    expect(i18n.t("syncManager.titleShort")).toBe("동기화");
    await i18n.changeLanguage("en");
    expect(i18n.language).toMatch(/^en/);
    expect(i18n.t("syncManager.titleShort")).toBe("Sync");
  });
});
