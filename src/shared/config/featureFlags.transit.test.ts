import { describe, expect, it } from "vitest";
import { DEFAULT_FEATURE_FLAGS, isTransitLearnHome } from "./featureFlags";

describe("isTransitLearnHome", () => {
  it.each(["ja", "ko", "es"])("%s gets the transit map when the flag is on", (lang) => {
    expect(isTransitLearnHome(DEFAULT_FEATURE_FLAGS, lang)).toBe(true);
  });

  it("a non-transit language stays on the classic page", () => {
    expect(isTransitLearnHome(DEFAULT_FEATURE_FLAGS, "fr")).toBe(false);
  });

  it("undefined lang stays classic", () => {
    expect(isTransitLearnHome(DEFAULT_FEATURE_FLAGS, undefined)).toBe(false);
  });

  it("flag off disables for all", () => {
    const off = {
      ...DEFAULT_FEATURE_FLAGS,
      learn: { ...DEFAULT_FEATURE_FLAGS.learn, transitMapHome: false },
    };
    expect(isTransitLearnHome(off, "ja")).toBe(false);
    expect(isTransitLearnHome(off, "ko")).toBe(false);
  });
});
