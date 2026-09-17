/**
 * Dynamic Type audit 2026-09-17 (docs/accessibility-2026-09-17.md §3): the
 * mobile settings tab strip is `overflow-x-auto` (already reachable by
 * touch scroll) but its `w-6` (24px) edge-fade masks sat OVER real label
 * text instead of empty gutter, because the container's own inline padding
 * (`px-3` = 12px) was HALF the fade's width — at the 140% font-scale
 * ceiling this read as "Accessibility" being clipped flush against the
 * viewport edge (simulator capture:
 * artifacts/ux-loop/sim-capture/capture-15-pro-max-140-settings.attempt3.png).
 * `px-6`/`scroll-px-6` keep the fade inside the padding at every scale;
 * separately, the trailing fade now hides once there is nothing further to
 * scroll to, instead of dangling a false "more content" affordance forever.
 */
import { describe, it, expect, afterEach, vi } from "vitest";
import { render, cleanup, fireEvent } from "@testing-library/react";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (_key: string, fallback?: string) => fallback ?? _key,
  }),
}));

import { SettingsNav } from "./SettingsNav";

afterEach(() => cleanup());

const languages = [{ id: "ja", name: "Japanese", flag: "🇯🇵" }] as never;

function mobileScrollNav(container: HTMLElement): HTMLElement {
  // The mobile (<sm) tab strip is the first `<nav>`; the desktop rail
  // (`hidden sm:flex`) is the second. Both exist in the DOM at once.
  const navs = container.querySelectorAll("nav");
  return navs[0] as HTMLElement;
}

function setScrollGeometry(
  el: HTMLElement,
  { scrollLeft, clientWidth, scrollWidth }: { scrollLeft: number; clientWidth: number; scrollWidth: number },
) {
  Object.defineProperty(el, "scrollLeft", { value: scrollLeft, configurable: true });
  Object.defineProperty(el, "clientWidth", { value: clientWidth, configurable: true });
  Object.defineProperty(el, "scrollWidth", { value: scrollWidth, configurable: true });
}

describe("SettingsNav mobile tab strip — fade/padding", () => {
  it("gives the scroll container padding at least as wide as the edge-fade masks", () => {
    const { container } = render(
      <SettingsNav activeSection="general" onSectionChange={() => {}} languages={languages} />,
    );
    const nav = mobileScrollNav(container);
    // The fade masks are `w-6` (1.5rem); px-3 (0.75rem) was half that.
    expect(nav.className).toMatch(/\bpx-6\b/);
    expect(nav.className).not.toMatch(/\bpx-3\b/);
  });

  it("hides the trailing fade once the row has nothing further to scroll to", () => {
    const { container } = render(
      <SettingsNav activeSection="general" onSectionChange={() => {}} languages={languages} />,
    );
    const nav = mobileScrollNav(container);
    const wrapper = nav.parentElement!;

    // Not yet scrolled anywhere near the end — the fade should be present.
    setScrollGeometry(nav, { scrollLeft: 0, clientWidth: 300, scrollWidth: 900 });
    fireEvent.scroll(nav);
    expect(wrapper.querySelector('[class*="bg-gradient-to-l"]')).not.toBeNull();

    // Scrolled all the way to the end — nothing left to reveal, so the
    // "more content this way" affordance should stop lying.
    setScrollGeometry(nav, { scrollLeft: 600, clientWidth: 300, scrollWidth: 900 });
    fireEvent.scroll(nav);
    expect(wrapper.querySelector('[class*="bg-gradient-to-l"]')).toBeNull();
  });
});
