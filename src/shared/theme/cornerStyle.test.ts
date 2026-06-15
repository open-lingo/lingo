import { describe, it, expect } from "vitest";
import {
  CORNER_STYLE_RADIUS,
  CORNER_STYLES,
  cardRadius,
} from "./cornerStyle";

describe("cornerStyle", () => {
  it("maps each preset to its spec radius", () => {
    expect(CORNER_STYLE_RADIUS).toEqual({
      sharp: "0.25rem",
      default: "0.625rem",
      rounded: "1.5rem",
      pill: "2rem",
    });
  });

  it("exposes the presets in picker order", () => {
    expect(CORNER_STYLES).toEqual(["sharp", "default", "rounded", "pill"]);
  });

  describe("cardRadius", () => {
    it("returns the preset value for a non-default preset", () => {
      expect(cardRadius("sharp")).toBe("0.25rem");
      expect(cardRadius("rounded")).toBe("1.5rem");
      expect(cardRadius("pill")).toBe("2rem");
    });

    it("falls back to the default preset when undefined", () => {
      expect(cardRadius(undefined)).toBe("0.625rem");
    });

    it("uses the theme default when the preset is 'default'", () => {
      expect(cardRadius("default", "1rem")).toBe("1rem");
    });

    it("ignores the theme default for explicit non-default presets", () => {
      expect(cardRadius("pill", "1rem")).toBe("2rem");
    });

    it("uses the shared default when no theme default is given", () => {
      expect(cardRadius("default")).toBe("0.625rem");
    });
  });
});
