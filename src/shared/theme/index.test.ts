import { describe, expect, it } from "vitest";
import { ensureThemeTokens } from "./index";
import { BUILT_IN_THEMES } from "./presets";

/**
 * ensureThemeTokens merges a partial theme against BUILT_IN_THEMES.dark as
 * defaults. `font.family` should fill from the default (every theme needs a
 * body font), but `font.display` / `font.mono` must NOT be inherited —
 * dark's `font.display` (Fraunces) would otherwise leak onto every custom
 * or community theme that never opted into a display font.
 */
describe("ensureThemeTokens font inheritance", () => {
  it("does not gift the default display font to a theme that omits one", () => {
    const result = ensureThemeTokens({
      colors: { background: "#111111" },
    });
    expect(result.font.display).toBeUndefined();
    expect(result.font.family).toBe(BUILT_IN_THEMES.dark.tokens.font.family);
  });

  it("keeps an explicitly declared display font", () => {
    const result = ensureThemeTokens({
      colors: { background: "#111111" },
      font: { family: "Inter, sans-serif", display: "Some Display Font" },
    });
    expect(result.font.display).toBe("Some Display Font");
    expect(result.font.family).toBe("Inter, sans-serif");
  });
});
