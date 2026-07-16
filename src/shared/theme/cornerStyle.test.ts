import { describe, it, expect } from "vitest";
import {
  CORNER_STYLE_RADIUS,
  CORNER_STYLES,
  resolveCardRadius,
  cornerStyleFromRadius,
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

  describe("resolveCardRadius", () => {
    it("uses the theme's radius.card when provided", () => {
      expect(resolveCardRadius("1.5rem")).toBe("1.5rem");
    });

    it("falls back to the shared default when unset", () => {
      expect(resolveCardRadius(undefined)).toBe("0.625rem");
    });
  });

  describe("cornerStyleFromRadius", () => {
    it("reverse-maps a known length to its preset", () => {
      expect(cornerStyleFromRadius("0.25rem")).toBe("sharp");
      expect(cornerStyleFromRadius("1.5rem")).toBe("rounded");
      expect(cornerStyleFromRadius("2rem")).toBe("pill");
    });

    it("reads unset or unknown lengths as 'default'", () => {
      expect(cornerStyleFromRadius(undefined)).toBe("default");
      expect(cornerStyleFromRadius("0.9rem")).toBe("default");
    });
  });
});
