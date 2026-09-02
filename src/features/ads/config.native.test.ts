/**
 * The native build must never load AdSense.
 *
 * Google's AdSense programme is web-only — apps are required to use AdMob — so
 * serving `adsbygoogle.js` inside the Capacitor WKWebView would be a policy
 * violation on top of an App Review risk. Today the ONLY thing keeping ads off
 * iOS is that `.env.native` happens not to set `VITE_ADSENSE_CLIENT`. That is a
 * configuration accident, not a guarantee: one stray env var (or a native build
 * that inherits the web env) ships AdSense to the App Store.
 *
 * This pins the guarantee to the code instead.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

let mockIsNative = false;
vi.mock("@/shared/platform/native", () => ({
  get IS_NATIVE() {
    return mockIsNative;
  },
}));

import { isAdsFeatureEnabled } from "./config";

describe("ads master switch — native", () => {
  beforeEach(() => {
    // A fully "ads on" configuration, so the only variable under test is IS_NATIVE.
    vi.stubEnv("VITE_ADSENSE_CLIENT", "ca-pub-test");
    vi.stubEnv("VITE_ADSENSE_ENABLED", "true");
  });

  afterEach(() => {
    mockIsNative = false;
    vi.unstubAllEnvs();
  });

  it("stays enabled on web when a client id is configured", () => {
    mockIsNative = false;
    expect(isAdsFeatureEnabled()).toBe(true);
  });

  it("is disabled on native even with a client id and the flag explicitly on", () => {
    mockIsNative = true;
    expect(isAdsFeatureEnabled()).toBe(false);
  });
});
