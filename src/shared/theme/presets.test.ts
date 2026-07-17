import { describe, expect, it } from "vitest";
import { BUILT_IN_THEMES } from "./presets";

/** WCAG relative luminance from a #rrggbb hex. */
function luminance(hex: string): number {
  const n = parseInt(hex.replace("#", ""), 16);
  const chan = (v: number) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  return (
    0.2126 * chan((n >> 16) & 0xff) +
    0.7152 * chan((n >> 8) & 0xff) +
    0.0722 * chan(n & 0xff)
  );
}

function contrast(a: string, b: string): number {
  const la = luminance(a);
  const lb = luminance(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

describe("built-in theme presets", () => {
  it("exposes exactly light, dark, amoled (sepia dropped)", () => {
    expect(Object.keys(BUILT_IN_THEMES).sort()).toEqual(["amoled", "dark", "light"]);
  });

  it("light is the Academia palette", () => {
    const t = BUILT_IN_THEMES.light.tokens;
    expect(t.colors.background).toBe("#f5f0e6");
    expect(t.colors.accent).toBe("#9c2c2c");
    expect(t.colors.accentMuted).toBe("#f0e0d6");
    expect(t.font.display).toContain("Fraunces");
  });

  it("dark is warm charcoal with a red accent", () => {
    const t = BUILT_IN_THEMES.dark.tokens;
    expect(t.colors.background).toBe("#171310");
    expect(t.colors.accent).toBe("#c14b3f");
    // hover is LIGHTER than accent on dark surfaces (dark-theme convention)
    expect(luminanceOrder(t.colors.accentHover, t.colors.accent)).toBe("lighter");
    expect(t.font.display).toContain("Fraunces");
  });

  it("amoled is untouched: no display font, cyan accent", () => {
    const t = BUILT_IN_THEMES.amoled.tokens;
    expect(t.font.display).toBeUndefined();
    expect(t.colors.accent).toBe("#22d3ee");
  });

  it("meets WCAG floors on both defaults", () => {
    for (const id of ["light", "dark"] as const) {
      const c = BUILT_IN_THEMES[id].tokens.colors;
      expect(contrast(c.textMuted, c.surface)).toBeGreaterThanOrEqual(4.5);
      expect(contrast(c.textPrimary, c.background)).toBeGreaterThanOrEqual(7);
      expect(contrast(c.onAccent, c.accent)).toBeGreaterThanOrEqual(4.5);
    }
  });
});

function luminanceOrder(a: string, b: string): "lighter" | "darker" {
  return luminance(a) > luminance(b) ? "lighter" : "darker";
}
