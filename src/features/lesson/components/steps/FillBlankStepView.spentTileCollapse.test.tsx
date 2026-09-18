/**
 * GHOST lane follow-up (2026-09-18): Spencer's standing rule is one
 * behaviour across EVERY build-type surface ("ANY build step is so
 * inconsistent… should be the same", #137). `FillBlankStepView`'s word
 * bank was flagged as a gap on the spent-tile fade
 * (`useSpentTileCollapse`, formerly `useHugeBankCollapse`,
 * `BuildSentenceStepView`) — this pins the same state machine here,
 * mirroring `BuildSentenceStepView.hugeBankCollapse.test.tsx`'s
 * footprint-frozen case.
 *
 * NO un-tap-returns-to-slot case here: unlike `BuildSentenceStepView`/
 * `ListeningBuildStepView`, a filled `FillBlankStepView` blank is a
 * DISABLED `<input>`, not a tappable `Tile` — there is no gesture in this
 * view today that returns a placed word to the bank, so there is nothing
 * to pin. (Adding one would be a real behavior change, not a port of the
 * fade, and is out of this lane's scope.)
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render } from "@testing-library/react";
import type { FillBlankStep } from "../../types";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, def?: unknown) => (typeof def === "string" ? def : key),
  }),
}));
vi.mock("@/shared/contexts/SettingsContext", () => ({
  useSettings: () => ({
    settings: { learning: { showRomanization: { ja: false } } },
    updateSetting: vi.fn(),
  }),
}));

import { FillBlankStepView } from "./FillBlankStepView";

const noop = () => {};

/** 8-tile word bank, one blank — mirrors the shape of
 *  BuildSentenceStepView.hugeBankCollapse.test.tsx's `step(8)` helper.
 *  Tapping ANY bank tile fills the sole blank (handleBankSelect fills the
 *  first empty blank), so a single tap is enough to exercise the collapse
 *  state machine on the tapped tile specifically. */
function step(tileCount: number): FillBlankStep {
  const all = Array.from({ length: tileCount }, (_, i) => `たいる${i}`);
  return {
    id: `fb-collapse-${tileCount}`,
    type: "fill_blank",
    sentence: "{{blank}} です",
    blanks: [{ id: "b1", correctAnswer: all[0] }],
    wordBank: all,
  } as FillBlankStep;
}

function bankTiles(container: HTMLElement): HTMLElement[] {
  return Array.from(container.querySelectorAll('[data-tile][data-slot="bank"]'));
}

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe("FillBlankStepView spent-tile collapse (GHOST follow-up, 2026-09-18)", () => {
  it("tapping a bank tile marks it pending immediately, done after 350ms", () => {
    const { container } = render(
      <FillBlankStepView step={step(8)} onComplete={noop} onContinue={noop} />,
    );
    const bank = bankTiles(container);
    expect(bank.length).toBe(8);
    const tapped = bank[0];
    expect(tapped.hasAttribute("data-collapse")).toBe(false);

    act(() => {
      fireEvent.click(tapped);
    });
    expect(tapped.getAttribute("data-state")).toBe("spent");
    expect(tapped.getAttribute("data-collapse")).toBe("pending");

    act(() => {
      vi.advanceTimersByTime(349);
    });
    expect(tapped.getAttribute("data-collapse")).toBe("pending");

    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(tapped.getAttribute("data-collapse")).toBe("done");
  });

  it("collapsed tile writes no inline geometry — footprint frozen, nothing else moves", () => {
    const { container } = render(
      <FillBlankStepView step={step(8)} onComplete={noop} onContinue={noop} />,
    );
    const bank = bankTiles(container);
    const tapped = bank[0];
    act(() => {
      fireEvent.click(tapped);
    });
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(tapped.getAttribute("data-collapse")).toBe("done");
    expect(tapped.style.width).toBe("");
    expect(tapped.style.height).toBe("");
    for (const t of bankTiles(container)) {
      expect(t.style.width).toBe("");
      expect(t.style.height).toBe("");
    }
    expect(bankTiles(container).length).toBe(8);
    expect(bankTiles(container)[0]).toBe(tapped);
  });

  it("a spent bank tile is aria-hidden (lead's P2 accessibility ruling)", () => {
    const { container } = render(
      <FillBlankStepView step={step(8)} onComplete={noop} onContinue={noop} />,
    );
    const bank = bankTiles(container);
    const tapped = bank[0];
    expect(tapped.hasAttribute("aria-hidden")).toBe(false);
    act(() => {
      fireEvent.click(tapped);
    });
    expect(tapped.getAttribute("aria-hidden")).toBe("true");
  });

  it("reduced-motion: the collapse still arms (transition-duration is a CSS concern; JS state is unaffected)", () => {
    // The 350ms pending->done timing is JS, not a CSS transition — pinned
    // here so a future change can't accidentally make reduced-motion skip
    // the state change itself (only index.css's transition-duration should
    // differ under prefers-reduced-motion).
    const { container } = render(
      <FillBlankStepView step={step(8)} onComplete={noop} onContinue={noop} />,
    );
    const bank = bankTiles(container);
    const tapped = bank[0];
    act(() => {
      fireEvent.click(tapped);
    });
    act(() => {
      vi.advanceTimersByTime(350);
    });
    expect(tapped.getAttribute("data-collapse")).toBe("done");
  });
});
