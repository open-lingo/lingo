/**
 * TestFlight #184 (build 23, founder): "Maybe we have the tiles disappear
 * as they click them in after a certain time count? The dynamic font
 * resizing is weird here." — ja-m34-neo-6-challenge, a 13-tile HUGE bank.
 *
 * The "weird resizing" is tileFit.ts re-negotiating mid-build because the
 * sentence tray grows row-by-row on a huge bank (it skips its full-answer
 * ghost reservation, b14 #114/#117) while the bank never gives space back.
 * `useHugeBankCollapse` (BuildSentenceStepView.tsx) fixes the SPACE side:
 * a spent HUGE-bank tile sits at the existing .4 spent opacity for 350ms
 * (the founder's "time count"), then collapses out of flow — carried on
 * the bank tile's `data-collapse="pending"|"done"` attribute (index.css
 * does the actual shrink; this file only proves the state machine).
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

describe("huge-bank spent-tile collapse (#184, b23)", () => {
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

  it("normal (<12-tile) bank never sets data-collapse, even well past 350ms", () => {
    const { container } = render(
      <BuildSentenceStepView step={step(8)} onComplete={noop} onContinue={noop} />,
    );
    const bank = bankTiles(container);
    expect(bank.length).toBe(8);
    act(() => {
      fireEvent.click(bank[0]);
    });
    expect(bank[0].getAttribute("data-state")).toBe("spent");
    expect(bank[0].hasAttribute("data-collapse")).toBe(false);

    act(() => {
      vi.advanceTimersByTime(1000);
    });
    for (const t of bankTiles(container)) {
      expect(t.hasAttribute("data-collapse")).toBe(false);
    }
  });

  it("a small (<=6-tile, `big` tier) bank never sets data-collapse either", () => {
    const { container } = render(
      <BuildSentenceStepView step={step(5)} onComplete={noop} onContinue={noop} />,
    );
    const bank = bankTiles(container);
    act(() => {
      fireEvent.click(bank[0]);
    });
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    for (const t of bankTiles(container)) {
      expect(t.hasAttribute("data-collapse")).toBe(false);
    }
  });
});
