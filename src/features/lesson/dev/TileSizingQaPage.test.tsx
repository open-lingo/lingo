/**
 * `/:lang/qa/tiles` (rewrite 2026-09-15): the controls are sectioned per
 * step type and edit ONE tier at a time. These tests pin the contract the
 * registry and the frames depend on, not the visuals.
 */
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, it, expect, afterEach, vi } from "vitest";
import TileSizingQaPage from "./TileSizingQaPage";
import { TILE_SECTIONS, TILE_TOKEN_DEFS, sectionTokens } from "./tileSizingTokens";

vi.mock("@/shared/hooks/useLangPath", () => ({
  useLangPath: () => (path: string) => `/ja${path.startsWith("/") ? path : `/${path}`}`,
  useLang: () => "ja",
}));

vi.stubGlobal("ResizeObserver", class {
  observe() {}
  disconnect() {}
  unobserve() {}
});
vi.stubGlobal("fetch", vi.fn(() => Promise.resolve({ ok: false })) as unknown as typeof fetch);

function mount() {
  return render(
    <MemoryRouter initialEntries={["/ja/qa/tiles"]}>
      <Routes>
        <Route path="/:lang/qa/tiles" element={<TileSizingQaPage />} />
      </Routes>
    </MemoryRouter>,
  );
}

afterEach(() => {
  cleanup();
  localStorage.clear();
});

describe("TileSizingQaPage", () => {
  it("renders one section per registry section, base open by default", () => {
    mount();
    for (const sec of TILE_SECTIONS) {
      expect(document.querySelector(`[data-qa-section="${sec.id}"]`), sec.id).not.toBeNull();
    }
    const base = document.querySelector('[data-qa-section="base"]')!;
    expect(base.querySelectorAll('input[type="range"]').length).toBe(sectionTokens("base").length);
  });

  it("every visible token gets exactly one slider once its section is open", () => {
    mount();
    for (const sec of TILE_SECTIONS) {
      const header = document.querySelector<HTMLButtonElement>(`[data-qa-section="${sec.id}"] header button`);
      if (sec.id !== "base") fireEvent.click(header!);
    }
    const sliders = document.querySelectorAll('input[type="range"]').length;
    const visible = TILE_TOKEN_DEFS.filter((d) => !d.hidden).length;
    expect(sliders).toBe(visible);
  });

  it("derived sections expose the scale/absolute switch, others do not", () => {
    mount();
    for (const sec of TILE_SECTIONS) {
      const el = document.querySelector(`[data-qa-section="${sec.id}"]`)!;
      const hasSwitch = el.textContent?.includes("absolute") ?? false;
      expect(hasSwitch, sec.id).toBe(sec.derived);
    }
  });

  it("renders both iframe panes pointed at the frame route for the current language", () => {
    mount();
    const iframes = Array.from(document.querySelectorAll("iframe"));
    expect(iframes).toHaveLength(2);
    expect(iframes.some((f) => f.getAttribute("src")?.includes("view=mobile"))).toBe(true);
    expect(iframes.some((f) => f.getAttribute("src")?.includes("view=desktop"))).toBe(true);
    expect(iframes.every((f) => f.getAttribute("src")?.startsWith("/ja/qa/tiles/frame"))).toBe(true);
  });

  it("switching tiers keeps the two value maps independent", () => {
    mount();
    const slider = document.querySelector<HTMLInputElement>('[data-qa-section="base"] input[type="range"]')!;
    fireEvent.change(slider, { target: { value: slider.max } });
    expect(JSON.parse(localStorage.getItem("lingo:qa-tiles-vars:mobile:v1") ?? "{}")[TILE_TOKEN_DEFS[0].key]).toBe(Number(slider.max));
    expect(localStorage.getItem("lingo:qa-tiles-vars:desktop:v1")).not.toContain(`"${TILE_TOKEN_DEFS[0].key}":${slider.max}`);
    fireEvent.click(screen.getByText(/Editing: Desktop/));
    const desktopSlider = document.querySelector<HTMLInputElement>('[data-qa-section="base"] input[type="range"]')!;
    expect(Number(desktopSlider.value)).toBe(TILE_TOKEN_DEFS[0].sm);
  });
});
