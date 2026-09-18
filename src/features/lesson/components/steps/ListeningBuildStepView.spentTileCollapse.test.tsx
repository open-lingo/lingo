/**
 * GHOST lane follow-up (2026-09-18): Spencer's standing rule is one
 * behaviour across EVERY build-type surface ("ANY build step is so
 * inconsistent… should be the same", #137). `BuildSentenceStepView`'s
 * spent-tile fade (`useSpentTileCollapse`, formerly `useHugeBankCollapse`)
 * was flagged as a gap on `ListeningBuildStepView` (`variant="listen"`,
 * never called the hook) — this pins the same state machine here, mirroring
 * `BuildSentenceStepView.hugeBankCollapse.test.tsx`'s footprint-frozen and
 * un-tap-returns-to-slot cases.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render } from "@testing-library/react";
import type { ListeningBuildStep } from "../../types";

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
vi.mock("@/shared/audio/volume", () => ({ playLocalAudio: vi.fn() }));
vi.mock("@/shared/audio/sfx", () => ({ playSfx: vi.fn() }));
vi.mock("@/shared/contexts/SettingsContext", () => ({
  useSettings: () => ({
    settings: { learning: { showRomanization: { ja: false } } },
    updateSetting: vi.fn(),
  }),
}));

import { ListeningBuildStepView } from "./ListeningBuildStepView";

const noop = () => {};

/** 8 tiles, correctOrder length 6 — a normal (<12-tile) bank, NOT the
 *  single-answer picker (correctOrder.length > 1). Mirrors the shape of
 *  BuildSentenceStepView.hugeBankCollapse.test.tsx's `step(8)` helper. */
function step(tileCount: number, answerLen: number): ListeningBuildStep {
  const all = Array.from({ length: tileCount }, (_, i) => `たいる${i}`);
  return {
    id: `lb-collapse-${tileCount}`,
    type: "listening_build",
    prompt: "Listen and build the sentence",
    tiles: all,
    correctOrder: all.slice(0, answerLen),
    granularity: "word",
  } as ListeningBuildStep;
}

function bankTiles(container: HTMLElement): HTMLElement[] {
  return Array.from(container.querySelectorAll('[data-tile][data-slot="bank"]'));
}

/** Excludes the ghost pre-sizer row: unlike BuildSentenceStepView's ghost
 *  (no `slot` at all), ListeningBuildStepView's tray ghost carries
 *  `slot="tray"` too (both share the tray's grid cell — "THE ONE
 *  RESERVATION" — so `data-state="ghost"` is the only thing that tells
 *  them apart here). */
function trayTiles(container: HTMLElement): HTMLElement[] {
  return Array.from(
    container.querySelectorAll('[data-tile][data-slot="tray"]:not([data-state="ghost"])'),
  );
}

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe("ListeningBuildStepView spent-tile collapse (GHOST follow-up, 2026-09-18)", () => {
  it("tapping a bank tile marks it pending immediately, done after 350ms", () => {
    const { container } = render(
      <ListeningBuildStepView step={step(8, 6)} onComplete={noop} onContinue={noop} />,
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
      <ListeningBuildStepView step={step(8, 6)} onComplete={noop} onContinue={noop} />,
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

  it("un-tapping a placed tile returns it to its original bank slot, mid-collapse", () => {
    const { container } = render(
      <ListeningBuildStepView step={step(8, 6)} onComplete={noop} onContinue={noop} />,
    );
    const bankBefore = bankTiles(container);
    const target = bankBefore[3];
    const targetLabel = target.getAttribute("aria-label");

    act(() => {
      fireEvent.click(target);
    });
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
    expect(bankAfter[0]).toBe(bankBefore[0]);
    expect(bankAfter[7]).toBe(bankBefore[7]);
  });

  it("a spent bank tile is aria-hidden (lead's P2 accessibility ruling)", () => {
    const { container } = render(
      <ListeningBuildStepView step={step(8, 6)} onComplete={noop} onContinue={noop} />,
    );
    const bank = bankTiles(container);
    const tapped = bank[0];
    expect(tapped.hasAttribute("aria-hidden")).toBe(false);
    act(() => {
      fireEvent.click(tapped);
    });
    expect(tapped.getAttribute("aria-hidden")).toBe("true");
  });
});
