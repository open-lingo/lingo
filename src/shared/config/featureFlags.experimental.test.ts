import { describe, expect, it, beforeEach, vi, afterEach } from "vitest";
import {
  DEFAULT_FEATURE_FLAGS,
  mergeFeatureFlags,
  fetchFeatureFlags,
  getCachedFeatureFlags,
  __resetCachedFeatureFlagsForTest,
} from "./featureFlags";

describe("experimental flags — reviewGridsFromFsrs / firstExposureBlockedWarmup (A8)", () => {
  it("default false in code", () => {
    expect(DEFAULT_FEATURE_FLAGS.experimental.reviewGridsFromFsrs).toBe(false);
    expect(DEFAULT_FEATURE_FLAGS.experimental.firstExposureBlockedWarmup).toBe(false);
  });

  it("mergeFeatureFlags applies a boolean override", () => {
    const merged = mergeFeatureFlags(DEFAULT_FEATURE_FLAGS, {
      experimental: { reviewGridsFromFsrs: true },
    });
    expect(merged.experimental.reviewGridsFromFsrs).toBe(true);
    // untouched field keeps its default
    expect(merged.experimental.firstExposureBlockedWarmup).toBe(false);
  });

  it("mergeFeatureFlags ignores a non-boolean override (stays at default)", () => {
    const merged = mergeFeatureFlags(DEFAULT_FEATURE_FLAGS, {
      experimental: { reviewGridsFromFsrs: "yes" },
    });
    expect(merged.experimental.reviewGridsFromFsrs).toBe(false);
  });

  it("an override missing `experimental` entirely leaves both flags at default false", () => {
    const merged = mergeFeatureFlags(DEFAULT_FEATURE_FLAGS, { version: 1 });
    expect(merged.experimental.reviewGridsFromFsrs).toBe(false);
    expect(merged.experimental.firstExposureBlockedWarmup).toBe(false);
  });
});

describe("getCachedFeatureFlags — synchronous reader for non-React callers", () => {
  beforeEach(() => {
    __resetCachedFeatureFlagsForTest();
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    __resetCachedFeatureFlagsForTest();
  });

  it("defaults to DEFAULT_FEATURE_FLAGS before any fetch has resolved", () => {
    expect(getCachedFeatureFlags()).toEqual(DEFAULT_FEATURE_FLAGS);
    expect(getCachedFeatureFlags().experimental.reviewGridsFromFsrs).toBe(false);
  });

  it("updates after fetchFeatureFlags resolves", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ experimental: { reviewGridsFromFsrs: true } }),
      }),
    );
    await fetchFeatureFlags();
    expect(getCachedFeatureFlags().experimental.reviewGridsFromFsrs).toBe(true);
  });

  it("stays at defaults (false) when the fetch fails — fail-safe direction", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network down")));
    await fetchFeatureFlags();
    expect(getCachedFeatureFlags().experimental.reviewGridsFromFsrs).toBe(false);
  });
});
