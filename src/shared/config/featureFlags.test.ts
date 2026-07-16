import { describe, it, expect } from "vitest";
import {
  DEFAULT_FEATURE_FLAGS,
  isCommunityEnabled,
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

describe("community feature flag", () => {
  it("defaults community to disabled", () => {
    expect(DEFAULT_FEATURE_FLAGS.community.enabled).toBe(false);
    expect(isCommunityEnabled(DEFAULT_FEATURE_FLAGS)).toBe(false);
  });

  it("merges a community.enabled override without disturbing tabs", () => {
    const merged = mergeFeatureFlags(DEFAULT_FEATURE_FLAGS, {
      community: { enabled: true },
    });
    expect(isCommunityEnabled(merged)).toBe(true);
    // existing tab defaults survive the partial override
    expect(merged.community.tabs.explore).toBe(true);
  });

  it("ignores a non-boolean community.enabled override", () => {
    const merged = mergeFeatureFlags(DEFAULT_FEATURE_FLAGS, {
      community: { enabled: "yes" },
    });
    expect(isCommunityEnabled(merged)).toBe(false);
  });
});
