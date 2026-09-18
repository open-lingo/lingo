import { describe, expect, it } from "vitest";
import { DEFAULT_FEATURE_FLAGS, mergeFeatureFlags } from "./featureFlags";

describe("telemetry.atomOutcomes (T7, lane STATS 2026-09-18)", () => {
  it("defaults false in code — off for build 32", () => {
    expect(DEFAULT_FEATURE_FLAGS.telemetry.atomOutcomes).toBe(false);
  });

  it("mergeFeatureFlags applies a boolean override", () => {
    const merged = mergeFeatureFlags(DEFAULT_FEATURE_FLAGS, {
      telemetry: { atomOutcomes: true },
    });
    expect(merged.telemetry.atomOutcomes).toBe(true);
  });

  it("mergeFeatureFlags ignores a non-boolean override (stays at default)", () => {
    const merged = mergeFeatureFlags(DEFAULT_FEATURE_FLAGS, {
      telemetry: { atomOutcomes: "yes" },
    });
    expect(merged.telemetry.atomOutcomes).toBe(false);
  });

  it("an override missing `telemetry` entirely leaves the flag at default false", () => {
    const merged = mergeFeatureFlags(DEFAULT_FEATURE_FLAGS, { version: 1 });
    expect(merged.telemetry.atomOutcomes).toBe(false);
  });
});
