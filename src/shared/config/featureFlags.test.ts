import { describe, it, expect } from "vitest";
import {
  DEFAULT_FEATURE_FLAGS,
  isSocialEnabled,
  mergeFeatureFlags,
} from "./featureFlags";

describe("social feature flag", () => {
  it("defaults social to disabled", () => {
    expect(DEFAULT_FEATURE_FLAGS.social.enabled).toBe(false);
    expect(isSocialEnabled(DEFAULT_FEATURE_FLAGS)).toBe(false);
  });

  it("merges a social.enabled override", () => {
    const merged = mergeFeatureFlags(DEFAULT_FEATURE_FLAGS, {
      social: { enabled: true },
    });
    expect(isSocialEnabled(merged)).toBe(true);
  });

  it("ignores a non-boolean social.enabled override", () => {
    const merged = mergeFeatureFlags(DEFAULT_FEATURE_FLAGS, {
      social: { enabled: "yes" },
    });
    expect(isSocialEnabled(merged)).toBe(false);
  });
});
