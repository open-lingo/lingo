/**
 * TestFlight #184 (build 23, founder): "Maybe we have the tiles disappear
 * as they click them in after a certain time count? The dynamic font
 * resizing is weird here." — ja-m34-neo-6-challenge, a 13-tile HUGE bank.
 *
 * The "weird resizing" is tileFit.ts re-negotiating mid-build because the
 * sentence tray grows row-by-row on a huge bank (it skips its full-answer
 * ghost reservation, b14 #114/#117) while the bank never gives space back.
 * `useHugeBankCollapse` (BuildSentenceStepView.tsx) fixes the SPACE side:
 * a spent bank tile sits at the existing .4 spent opacity for 350ms (the
 * founder's "time count"), then collapses out of flow — carried on the
 * bank tile's `data-collapse="pending"|"done"` attribute (index.css does
 * the actual shrink; this file only proves the state machine).
 *
 * GHOST lane (2026-09-18, `docs/tile-tray-ux-2026-09-18.md` P2): until
 * build 25 this only ran on HUGE (>=12-tile) banks — a normal (<12-tile)
 * bank's spent tile sat at 0.4 opacity, word still legible, for the rest
 * of the step. That IS a lingering "ghost" of a used word, and it's the
 * default shape for 98%+ of build steps. The density gate is gone: every
 * bank size now runs the same pending -> fade-to-invisible state machine,
 * with the same footprint-frozen guarantee.
 *
 * This is the timing/state half only. The visual shrink-to-zero and the
 * real stage-height invariant are verified by a simulator capture (see the
 * task ledger), not here — happy-dom applies no stylesheet and has no
 * real layout, so a pixel assertion here would be theater.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render } from "@testing-library/react";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, def?: unknown) => (typeof def === "string" ? def : key),
  }),
}));
vi.mock("@/shared/tts", () => ({
  playJaAudio: vi.fn(),
  getTtsUrl: vi.fn(() => null),
  hasTtsAudio: vi.fn(() => false),
  useAutoPlayJaAudio: vi.fn(),
}));
vi.mock("@/shared/audio/sfx", () => ({ playSfx: vi.fn() }));
vi.mock("@/shared/contexts/SettingsContext", () => ({
  useSettings: () => ({
    settings: { learning: { showRomanization: { ja: false } } },
    updateSetting: vi.fn(),
  }),
}));

import { BuildSentenceStepView } from "./BuildSentenceStepView";
import type { BuildSentenceStep } from "../../types";

const noop = () => {};

/** Mirrors BuildSentenceStepView.tileTokens.test.tsx's `step()` helper. */
function step(tileCount: number): BuildSentenceStep {
  const all = Array.from({ length: tileCount }, (_, i) => `たいる${i}`);
  return {
    id: `collapse-${tileCount}`,
    type: "build_sentence",
    prompt: "Build it",
    targetSentence: all.slice(0, 3).join(" "),
    tiles: all,
    correctOrder: all.slice(0, 3),
    granularity: "word",
  } as BuildSentenceStep;
}

function bankTiles(container: HTMLElement): HTMLElement[] {
  return Array.from(container.querySelectorAll('[data-tile][data-slot="bank"]'));
}

function trayTiles(container: HTMLElement): HTMLElement[] {
  return Array.from(container.querySelectorAll('[data-tile][data-slot="tray"]'));
}

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe("spent-tile collapse (#184, b23; every bank size since GHOST/P2, 2026-09-18)", () => {
  it("13-tile (huge) bank: tapping a bank tile marks it pending immediately, done after 350ms", () => {
    const { container } = render(
      <BuildSentenceStepView step={step(13)} onComplete={noop} onContinue={noop} />,
    );
    const bank = bankTiles(container);
    expect(bank.length).toBe(13);
    const tapped = bank[0];
    expect(tapped.hasAttribute("data-collapse")).toBe(false);

    act(() => {
      fireEvent.click(tapped);
    });
    expect(tapped.getAttribute("data-state")).toBe("spent");
    expect(tapped.getAttribute("data-collapse")).toBe("pending");

    // Not yet at the 350ms mark: still pending.
    act(() => {
      vi.advanceTimersByTime(349);
    });
    expect(tapped.getAttribute("data-collapse")).toBe("pending");

    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(tapped.getAttribute("data-collapse")).toBe("done");
  });

  it("removing the tile from the tray (before the delay elapses) reappears immediately, no delay", () => {
    const { container } = render(
      <BuildSentenceStepView step={step(13)} onComplete={noop} onContinue={noop} />,
    );
    const bank = bankTiles(container);
    const tapped = bank[0];

    act(() => {
      fireEvent.click(tapped);
    });
    expect(tapped.getAttribute("data-collapse")).toBe("pending");

    const tray = trayTiles(container);
    expect(tray.length).toBe(1);
    act(() => {
      fireEvent.click(tray[0]);
    });

    // Back in the bank, same node, no delay: attribute is gone this tick.
    expect(tapped.getAttribute("data-state")).toBe("idle");
    expect(tapped.hasAttribute("data-collapse")).toBe(false);

    // The cancelled 350ms timer must not resurrect it later.
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(tapped.hasAttribute("data-collapse")).toBe(false);
  });

  it("removing the tile after it has fully collapsed also reappears immediately", () => {
    const { container } = render(
      <BuildSentenceStepView step={step(13)} onComplete={noop} onContinue={noop} />,
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

    const tray = trayTiles(container);
    act(() => {
      fireEvent.click(tray[0]);
    });
    expect(tapped.getAttribute("data-state")).toBe("idle");
    expect(tapped.hasAttribute("data-collapse")).toBe(false);
  });

  /**
   * BUILD 25: the fade must not move anything. b24 froze the spent tile's
   * measured width/height as inline styles and animated them to 0px, so the
   * tile left the flow: every later bank tile jumped a slot and the bank lost
   * a row (measured on the 15 Pro Max at 100%: bank 207.5 → 136.5px at tap
   * 11, and the centred step column dropped the prompt 35.5px with it). The
   * lead's ruling is that nothing may move or resize between the first tap
   * and the last, so `"done"` is opacity + transform in `index.css` and this
   * hook writes NO geometry at all. Fails on the b24 hook, which had written
   * `width`/`height` by this point. Covered on every bank size by the
   * `it.each` "collapsed tile writes no inline geometry" block below (GHOST
   * lane, since the density gate no longer restricts this to huge banks).
   */

  it("normal (<12-tile, `dense` tier) bank: tapping a bank tile marks it pending immediately, done after 350ms (GHOST/P2)", () => {
    const { container } = render(
      <BuildSentenceStepView step={step(8)} onComplete={noop} onContinue={noop} />,
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
    // The other seven never asked for this tile's data-collapse.
    for (const t of bankTiles(container)) {
      if (t !== tapped) expect(t.hasAttribute("data-collapse")).toBe(false);
    }
  });

  it("a small (<=6-tile, `big` tier) bank: tapping a bank tile marks it pending immediately, done after 350ms (GHOST/P2)", () => {
    const { container } = render(
      <BuildSentenceStepView step={step(5)} onComplete={noop} onContinue={noop} />,
    );
    const bank = bankTiles(container);
    const tapped = bank[0];
    act(() => {
      fireEvent.click(tapped);
    });
    expect(tapped.getAttribute("data-collapse")).toBe("pending");
    act(() => {
      vi.advanceTimersByTime(350);
    });
    expect(tapped.getAttribute("data-collapse")).toBe("done");
  });

  /**
   * BUILD 25's "no inline geometry" invariant, extended (GHOST/P2): it must
   * hold on every bank size, not only huge ones — otherwise removing the
   * density gate would trade a visible dimmed ghost on normal banks for a
   * reflowing bank on normal banks, which is the exact regression P1/build
   * 25 already forbids.
   */
  it.each([
    ["huge (13-tile)", 13],
    ["normal (8-tile)", 8],
    ["small (5-tile)", 5],
  ])("%s bank: collapsed tile writes no inline geometry, on any bank tile", (_label, tileCount) => {
    const { container } = render(
      <BuildSentenceStepView step={step(tileCount)} onComplete={noop} onContinue={noop} />,
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
    // Footprint frozen: same tile count, same DOM node at the same index —
    // nothing was removed from flow or reflowed (P1).
    expect(bankTiles(container).length).toBe(tileCount);
    expect(bankTiles(container)[0]).toBe(tapped);
  });

  /**
   * GHOST lane: the un-tap path must return a spent tile to its ORIGINAL
   * bank slot, not just to "the bank" — this only holds if the bank array
   * is genuinely position-stable (never filtered/re-sorted) and the tile
   * never left flow (P1). Taps a NON-first tile so the test can't pass by
   * accident on index 0.
   */
  it("un-tapping a placed tile returns it to its original bank slot, mid-collapse or after", () => {
    const { container } = render(
      <BuildSentenceStepView step={step(8)} onComplete={noop} onContinue={noop} />,
    );
    const bankBefore = bankTiles(container);
    const target = bankBefore[3];
    const targetLabel = target.getAttribute("aria-label");

    act(() => {
      fireEvent.click(target);
    });
    // Still pending (< 350ms): un-tap before the fade completes.
    act(() => {
      vi.advanceTimersByTime(100);
    });
    const tray = trayTiles(container);
    expect(tray.length).toBe(1);
    act(() => {
      fireEvent.click(tray[0]);
    });

    const bankAfter = bankTiles(container);
    expect(bankAfter.length).toBe(8);
    expect(bankAfter[3]).toBe(target);
    expect(bankAfter[3].getAttribute("data-state")).toBe("idle");
    expect(bankAfter[3].hasAttribute("data-collapse")).toBe(false);
    expect(bankAfter[3].getAttribute("aria-label")).toBe(targetLabel);
    // Neighbours untouched.
    expect(bankAfter[0]).toBe(bankBefore[0]);
    expect(bankAfter[7]).toBe(bankBefore[7]);
  });
});
