/**
 * Defence in depth for the native ads guard.
 *
 * `isAdsFeatureEnabled()` gates the *rendering* hooks, but two callers reach
 * past it and inject the script directly — `routes/Layout.tsx` (on cookie
 * consent) and `RewardedAdSlot.tsx`. So the master switch alone does not
 * actually prevent `adsbygoogle.js` from loading in the WKWebView; the guard
 * has to sit on the injection chokepoint as well.
 *
 * See `config.native.test.ts` for why AdSense must never load on native.
 *
 * These assert against a spied `head.appendChild` rather than letting the tag
 * land in the document: a real <script src="…googlesyndication…"> makes
 * happy-dom attempt a fetch and dump a network stack trace into the run.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import type { MockInstance } from "vitest";

let mockIsNative = false;
vi.mock("@/shared/platform/native", () => ({
  get IS_NATIVE() {
    return mockIsNative;
  },
}));

import { loadAdSenseScript } from "./adsense";
import { saveCookieConsent, clearCookieConsent } from "@/shared/legal/cookieConsent";

let appendSpy: MockInstance;

/** The <script> tags `loadAdSenseScript` tried to inject. */
function injectedScripts(): HTMLScriptElement[] {
  return (appendSpy.mock.calls as unknown as Node[][])
    .map((call) => call[0] as HTMLElement)
    .filter((n): n is HTMLScriptElement => n?.tagName === "SCRIPT");
}

describe("loadAdSenseScript — native", () => {
  beforeEach(() => {
    vi.stubEnv("VITE_ADSENSE_CLIENT", "ca-pub-test");
    vi.stubEnv("VITE_ADSENSE_ENABLED", "true");
    // Consent granted, so the only variable under test is IS_NATIVE.
    saveCookieConsent(true);
    appendSpy = vi
      .spyOn(document.head, "appendChild")
      .mockImplementation(<T extends Node>(n: T): T => n);
  });

  afterEach(() => {
    mockIsNative = false;
    appendSpy.mockRestore();
    clearCookieConsent();
    localStorage.clear();
    vi.unstubAllEnvs();
  });

  it("injects the AdSense script on web when consent is granted", () => {
    mockIsNative = false;
    loadAdSenseScript();

    const scripts = injectedScripts();
    expect(scripts).toHaveLength(1);
    expect(scripts[0].src).toContain("pagead2.googlesyndication.com");
  });

  it("injects nothing on native, even with consent and a client id", () => {
    mockIsNative = true;
    loadAdSenseScript();

    expect(injectedScripts()).toHaveLength(0);
  });
});
