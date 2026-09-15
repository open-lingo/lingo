/**
 * `/:lang/qa/tiles` (rewrite 2026-09-15): the controls are sectioned per
 * step type and edit ONE tier at a time. These tests pin the contract the
 * registry and the frames depend on, not the visuals.
 */
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, it, expect, afterEach, vi } from "vitest";
import TileSizingQaPage from "./TileSizingQaPage";
import TileSizingQaFramePage from "./TileSizingQaFramePage";
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

  it("renders three iframe panes pointed at the frame route for the current language", () => {
    mount();
    const iframes = Array.from(document.querySelectorAll("iframe"));
    expect(iframes).toHaveLength(3);
    expect(iframes.some((f) => f.getAttribute("src")?.includes("view=mobile"))).toBe(true);
    expect(iframes.some((f) => f.getAttribute("src")?.includes("view=desktop"))).toBe(true);
    expect(iframes.some((f) => f.getAttribute("src")?.includes("view=tablet"))).toBe(true);
    expect(iframes.every((f) => f.getAttribute("src")?.startsWith("/ja/qa/tiles/frame"))).toBe(true);
  });

  it("switching tiers keeps the three value maps independent", () => {
    mount();
    const slider = document.querySelector<HTMLInputElement>('[data-qa-section="base"] input[type="range"]')!;
    fireEvent.change(slider, { target: { value: slider.max } });
    expect(JSON.parse(localStorage.getItem("lingo:qa-tiles-vars:mobile:v2") ?? "{}")[TILE_TOKEN_DEFS[0].key]).toBe(Number(slider.max));
    expect(localStorage.getItem("lingo:qa-tiles-vars:desktop:v2")).not.toContain(`"${TILE_TOKEN_DEFS[0].key}":${slider.max}`);
    expect(localStorage.getItem("lingo:qa-tiles-vars:tablet-portrait:v2")).not.toContain(`"${TILE_TOKEN_DEFS[0].key}":${slider.max}`);

    fireEvent.click(screen.getByText(/Editing: Desktop/));
    const desktopSlider = document.querySelector<HTMLInputElement>('[data-qa-section="base"] input[type="range"]')!;
    expect(Number(desktopSlider.value)).toBe(TILE_TOKEN_DEFS[0].sm);
    fireEvent.change(desktopSlider, { target: { value: desktopSlider.max } });
    expect(localStorage.getItem("lingo:qa-tiles-vars:mobile:v2")).toContain(`"${TILE_TOKEN_DEFS[0].key}":${slider.max}`);
    expect(localStorage.getItem("lingo:qa-tiles-vars:tablet-portrait:v2")).not.toContain(`"${TILE_TOKEN_DEFS[0].key}":${desktopSlider.max}`);

    fireEvent.click(screen.getByText(/Editing: Tablet portrait/));
    const tabletSlider = document.querySelector<HTMLInputElement>('[data-qa-section="base"] input[type="range"]')!;
    expect(Number(tabletSlider.value)).toBe(TILE_TOKEN_DEFS[0].tabletPortrait);
    fireEvent.change(tabletSlider, { target: { value: tabletSlider.max } });
    expect(localStorage.getItem("lingo:qa-tiles-vars:mobile:v2")).toContain(`"${TILE_TOKEN_DEFS[0].key}":${slider.max}`);
    expect(localStorage.getItem("lingo:qa-tiles-vars:desktop:v2")).toContain(`"${TILE_TOKEN_DEFS[0].key}":${desktopSlider.max}`);
  });

  it("renders a third tier button and shows the tabletPortrait shipped default", () => {
    mount();
    expect(screen.getByText(/Editing: Tablet portrait/)).toBeDefined();
    fireEvent.click(screen.getByText(/Editing: Tablet portrait/));
    const slider = document.querySelector<HTMLInputElement>('[data-qa-section="base"] input[type="range"]')!;
    expect(Number(slider.value)).toBe(TILE_TOKEN_DEFS[0].tabletPortrait);
    expect(TILE_TOKEN_DEFS[0].tabletPortrait).toBe(21);
  });

  it("Copy CSS emits all three blocks, tabletPortrait media LAST", async () => {
    // The page's `copy()` helper awaits `navigator.clipboard.writeText` and
    // only falls back to `console.log` if that throws — happy-dom doesn't
    // implement the Clipboard API, so stub just that one property (not all
    // of `navigator`, which would drop unrelated browser APIs other code in
    // this tree may read) and restore it afterward.
    const writeText = vi.fn((_text: string) => Promise.resolve());
    const original = Object.getOwnPropertyDescriptor(window.navigator, "clipboard");
    Object.defineProperty(window.navigator, "clipboard", { value: { writeText }, configurable: true });
    try {
      mount();
      fireEvent.click(screen.getByText("Copy CSS"));
      // The clipboard write is fire-and-forget inside an async onClick;
      // flush microtasks so the promise resolves before we inspect the call.
      await Promise.resolve();
      await Promise.resolve();
      expect(writeText).toHaveBeenCalledTimes(1);
      const text = writeText.mock.calls[0][0] as string;
      expect(text).toContain(":root {");
      expect(text).toContain("@media (min-width: 640px) {");
      // Must match `TABLET_PORTRAIT_MEDIA` in TileSizingQaPage.tsx and both
      // `:root` blocks in index.css exactly — updated 2026-09-15 (lead
      // decision) to DROP the `max-width: 1023px` clause, which was
      // excluding a 13" iPad in portrait (1024 CSS px wide) from the tier.
      const tabletMedia = "@media (min-width: 640px) and (orientation: portrait) and (pointer: coarse) {";
      expect(text).toContain(tabletMedia);
      // Source order is load-bearing (see cssBlock's comment in the page):
      // the tabletPortrait media block must come LAST so it wins the
      // 640–1023 overlap against the plain `sm` @media block.
      const smIdx = text.indexOf("@media (min-width: 640px) {");
      const tabletIdx = text.indexOf(tabletMedia);
      expect(tabletIdx).toBeGreaterThan(smIdx);
    } finally {
      if (original) Object.defineProperty(window.navigator, "clipboard", original);
      else delete (window.navigator as { clipboard?: unknown }).clipboard;
    }
  });
});

/**
 * `TileSizingQaFramePage` is a separate route/component from the page above
 * (it's the thing the page's iframes point AT, not something the page tree
 * renders inline) — the honest test for the tabletPortrait mount-time seed
 * (`seedTabletPortraitDefaultsOnce`, TileSizingQaFramePage.tsx) mounts the
 * frame directly rather than asserting through the parent.
 *
 * Uses `&variant=build` to land on the frame's lightweight `SingleTile`
 * isolation path (a single bare `<Tile>`, no `StepRenderer`/fixtures/TTS) —
 * the seeding call happens unconditionally in the component body BEFORE that
 * isolation-mode branch, so this still exercises the real seeding code path
 * while avoiding the heavy mocking (`react-i18next`, TTS, sfx, settings,
 * language context — see `renderSmoke.test.tsx`) full fixture rendering
 * would otherwise require.
 */
describe("TileSizingQaFramePage — tabletPortrait mount-time seed", () => {
  function mountFrame(view: string) {
    return render(
      <MemoryRouter initialEntries={[`/ja/qa/tiles/frame?view=${view}&variant=build`]}>
        <Routes>
          <Route path="/:lang/qa/tiles/frame" element={<TileSizingQaFramePage />} />
        </Routes>
      </MemoryRouter>,
    );
  }

  afterEach(() => {
    // Imperative documentElement styles aren't touched by RTL's `cleanup()`
    // (that only unmounts React trees) — reset explicitly so this suite
    // can't leak state into any test that runs after it.
    document.documentElement.removeAttribute("style");
  });

  it("seeds the tabletPortrait registry defaults onto documentElement for view=tablet", () => {
    mountFrame("tablet");
    // TILE_TOKEN_DEFS[0] is --tile-font, tabletPortrait default 21 (px).
    expect(document.documentElement.style.getPropertyValue("--tile-font")).toBe("21px");
    // --tile-box-h's tabletPortrait default is 50.5, NOT sm's 51 — the whole
    // point of the seed is that an iframe can't get this from CSS alone
    // (`pointer: coarse` reads false inside a desktop-hosted iframe).
    expect(document.documentElement.style.getPropertyValue("--tile-box-h")).toBe("50.5px");
  });

  it("does NOT seed tabletPortrait defaults for view=mobile", () => {
    mountFrame("mobile");
    expect(document.documentElement.style.getPropertyValue("--tile-font")).not.toBe("21px");
    expect(document.documentElement.style.getPropertyValue("--tile-box-h")).not.toBe("50.5px");
  });
});
