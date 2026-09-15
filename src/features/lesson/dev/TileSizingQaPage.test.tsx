/**
 * Tile sizing QA page (`/:lang/qa/tiles`, TestFlight #137) — smoke test:
 * every token in the registry (`tileSizingTokens.ts`) renders exactly one
 * slider per pane. Guards the "one token, one dial" contract — a token
 * added to the registry without a slider row (or vice versa) fails this.
 */
import { describe, it, expect, afterEach, vi } from "vitest";
import { render, cleanup } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import TileSizingQaPage from "./TileSizingQaPage";
import { TILE_TOKEN_DEFS } from "./tileSizingTokens";

vi.mock("@/shared/contexts/LanguageContext", () => ({
  useLanguage: () => ({ language: { id: "ja" } }),
}));

afterEach(() => {
  cleanup();
  localStorage.clear();
});

function renderPage() {
  return render(
    <MemoryRouter>
      <TileSizingQaPage />
    </MemoryRouter>,
  );
}

describe("TileSizingQaPage", () => {
  it("renders one mobile-pane slider and one desktop-pane slider per token", () => {
    renderPage();
    for (const def of TILE_TOKEN_DEFS) {
      const mobile = document.getElementById(`mobile-${def.key}`);
      const desktop = document.getElementById(`desktop-${def.key}`);
      expect(mobile, `missing mobile slider for ${def.key}`).not.toBeNull();
      expect(mobile?.getAttribute("type")).toBe("range");
      expect(desktop, `missing desktop slider for ${def.key}`).not.toBeNull();
      expect(desktop?.getAttribute("type")).toBe("range");
    }
  });

  it("mobile-pane sliders count matches the token registry exactly (no orphan/extra sliders)", () => {
    const { container } = renderPage();
    const mobileSliders = container.querySelectorAll(
      'input[id^="mobile---"][type="range"]',
    );
    expect(mobileSliders.length).toBe(TILE_TOKEN_DEFS.length);
  });

  it("renders both iframe panes pointed at the frame route for the current language", () => {
    const { container } = renderPage();
    const iframes = Array.from(container.querySelectorAll("iframe"));
    expect(iframes).toHaveLength(2);
    expect(iframes.some((f) => f.getAttribute("src")?.includes("view=mobile"))).toBe(
      true,
    );
    expect(iframes.some((f) => f.getAttribute("src")?.includes("view=desktop"))).toBe(
      true,
    );
    expect(iframes.every((f) => f.getAttribute("src")?.startsWith("/ja/qa/tiles/frame"))).toBe(
      true,
    );
  });
});
