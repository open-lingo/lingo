/**
 * P3 residual (`docs/tile-tray-ux-2026-09-18.md`, lane LONGANS, TestFlight
 * T18) — real-device repro: `ja-m42-neo-challenge?step=11`
 * (`listening_build`, 21-tile answer, the course's longest) at 125%, via
 * `scripts/lane/sim-proof.sh`: `FAIL stageFits`, fit-scale 0.638, overflow
 * 212.4px past the fixed stage's bottom edge. Bank + CTA must never move and
 * tiles never shrink below the existing floor (already true, untouched
 * here) — the only lever left is a BOUNDED, internally-scrolling answer
 * tray (`useBoundedAnswerTray.ts`).
 *
 * happy-dom applies no stylesheet and has no real layout — every rect below
 * is a stub reproducing the SAME two numbers the sim-capture harness's
 * `stageFits` verdict reads on the real device (`bankTop+bankH` vs
 * `stageTop+stageH`), on the REAL rendered `ListeningBuildStepView` markup
 * (a 21-tile `listening_build` answer, same shape as the repro route), so
 * this is a geometry assertion on the actual component + hook wiring, not a
 * pixel claim about happy-dom's (nonexistent) layout engine.
 */
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render } from "@testing-library/react";
import { applyBoundedAnswerTray } from "./useBoundedAnswerTray";

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

import { ListeningBuildStepView } from "../components/steps/ListeningBuildStepView";
import type { ListeningBuildStep } from "../types";

const noop = () => {};

/** 21 tiles — the same length as the course's longest (`?step=11`). */
function longAnswerStep(): ListeningBuildStep {
  const answer = Array.from({ length: 21 }, (_, i) => `ご${i}`);
  return {
    id: "bounded-tray-21",
    type: "listening_build",
    prompt: "Listen and build.",
    targetSentence: answer.join(""),
    tiles: answer,
    correctOrder: answer,
    granularity: "word",
  } as ListeningBuildStep;
}

/** A short (2-tile) answer — must never be touched by the cap. */
function shortAnswerStep(): ListeningBuildStep {
  return {
    id: "bounded-tray-short",
    type: "listening_build",
    prompt: "Listen and build.",
    tiles: ["あ", "い", "う"],
    correctOrder: ["あ", "い"],
    granularity: "character",
  } as ListeningBuildStep;
}

/** Stub geometry for one element without disturbing the others'. */
function stubRect(el: Element, rect: { top: number; bottom: number }) {
  Object.defineProperty(el, "getBoundingClientRect", {
    value: () => ({
      top: rect.top,
      bottom: rect.bottom,
      height: rect.bottom - rect.top,
      left: 0,
      right: 400,
      width: 400,
    }),
    configurable: true,
  });
}

/** `--tile-row-h` off the tray's tiles, `--tile-tray-gap` off the tray —
 *  matches `readRowMetrics` inside `useBoundedAnswerTray.ts`. Stubbed via
 *  `getComputedStyle`, the same technique `tileFit.test.ts` uses. */
function stubComputedTokens(rowHeightPx: number, rowGapPx: number) {
  const real = window.getComputedStyle;
  window.getComputedStyle = ((el: Element, ...rest: unknown[]) => {
    const cs = real.call(window, el, ...(rest as []));
    return new Proxy(cs, {
      get(target, prop, receiver) {
        if (prop === "getPropertyValue") {
          return (name: string) => {
            if (name === "--tile-row-h") return `${rowHeightPx}px`;
            return Reflect.get(target, prop, receiver).call(target, name);
          };
        }
        if (prop === "rowGap") return `${rowGapPx}px`;
        return Reflect.get(target, prop, receiver);
      },
    });
  }) as typeof window.getComputedStyle;
  return () => {
    window.getComputedStyle = real;
  };
}

afterEach(() => cleanup());

describe("the answer tray bounds itself instead of pushing the bank past the stage (P3 residual)", () => {
  it("caps the tray and brings the bank's bottom back inside the stage, on the 21-tile repro shape", () => {
    const restoreTokens = stubComputedTokens(52.5, 8);
    try {
      const { container } = render(
        <div data-lesson-stage="">
          <ListeningBuildStepView step={longAnswerStep()} onComplete={noop} onContinue={noop} />
        </div>,
      );
      const stageEl = container.querySelector<HTMLElement>("[data-lesson-stage]")!;
      const bankEl = container.querySelector<HTMLElement>('[data-tile-tray][data-kind="bank"]')!;
      const trayEl = container.querySelector<HTMLElement>('[data-tile-tray][data-kind="tray"]')!;
      expect(stageEl && bankEl && trayEl, "stage/bank/tray all render").toBeTruthy();

      // The real-device measurement (mobile-sizing-spec.md's post-fix table,
      // ja-m42-neo-challenge?step=listening_build @ 125%): stage bottom at
      // 743 (a 15 Pro Max stage budget), bank bottom 212.4px past it before
      // any cap — the exact repro number from sim-proof.sh.
      stubRect(stageEl, { top: 0, bottom: 743 });
      stubRect(trayEl, { top: 200, bottom: 528.5 }); // natural: 328.5px tall
      stubRect(bankEl, { top: 528.5 + 8, bottom: 743 + 212.4 });

      // Before any pass, the bank is exactly where the repro said it was —
      // proves the stub, not the fix.
      expect(bankEl.getBoundingClientRect().bottom - stageEl.getBoundingClientRect().bottom).toBeCloseTo(
        212.4,
        1,
      );

      const changed = applyBoundedAnswerTray(stageEl);
      expect(changed, "the pass must actually cap the tray").toBe(true);
      expect(trayEl.dataset.bounded).toBe("true");

      // The cap must be a whole number of rows and strictly shorter than the
      // tray's natural (328.5px) height.
      const cappedPx = Number.parseFloat(trayEl.style.maxHeight);
      expect(Number.isFinite(cappedPx)).toBe(true);
      expect(cappedPx).toBeLessThan(528.5 - 200);
      expect(cappedPx).toBeGreaterThanOrEqual(52.5); // at least one row survives

      // Re-render the bank at its NEW position (the cap frees up exactly
      // `328.5 - cappedPx` px, which in a real flex column moves everything
      // below the tray up by that amount) and confirm the stage now fits —
      // the same assertion `stageFits` makes.
      const freed = 328.5 - cappedPx;
      stubRect(bankEl, { top: 528.5 + 8 - freed, bottom: 743 + 212.4 - freed });
      expect(
        bankEl.getBoundingClientRect().bottom - stageEl.getBoundingClientRect().bottom,
      ).toBeLessThanOrEqual(2); // OVERFLOW_TOLERANCE_PX
    } finally {
      restoreTokens();
    }
  });

  it("never touches a short answer that already fits (no overflow, no cap)", () => {
    const restoreTokens = stubComputedTokens(52.5, 8);
    try {
      const { container } = render(
        <div data-lesson-stage="">
          <ListeningBuildStepView step={shortAnswerStep()} onComplete={noop} onContinue={noop} />
        </div>,
      );
      const stageEl = container.querySelector<HTMLElement>("[data-lesson-stage]")!;
      const bankEl = container.querySelector<HTMLElement>('[data-tile-tray][data-kind="bank"]')!;
      const trayEl = container.querySelector<HTMLElement>('[data-tile-tray][data-kind="tray"]')!;

      stubRect(stageEl, { top: 0, bottom: 743 });
      stubRect(trayEl, { top: 200, bottom: 260 });
      stubRect(bankEl, { top: 268, bottom: 500 }); // well inside the stage

      const changed = applyBoundedAnswerTray(stageEl);
      expect(changed).toBe(false);
      expect(trayEl.dataset.bounded).toBeUndefined();
      expect(trayEl.style.maxHeight).toBe("");
    } finally {
      restoreTokens();
    }
  });
});
