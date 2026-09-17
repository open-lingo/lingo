/**
 * TestFlight #185 (build 24, founder): "Why does it size it weird like this?
 * Pre shrinking?" — the tile just placed in the sentence tray rendered at
 * the 0.8 font floor (19px) beside 29px bank tiles, on EVERY normal-bank
 * build step since build 22.
 *
 * Root cause (measured in headless Chromium against the dev server,
 * ja-m34-neo-7?step=5, one tap): the placed tile's nearest
 * `[data-tile-tray]` was a SECOND row nested inside the tray's layered row
 * — `SortableBuildTiles` renders its own `rowAttrs` div, and the view
 * wrapped it in another `<TileTray kind="row" layer>`. A flex item
 * shrink-wraps its content, so that inner row measured 68px: exactly the
 * tile's own width. tileFit.ts takes a content-hugging tile's width budget
 * from its group (`groupOf` = closest tray, `usable = max(own, row)`), so
 * the budget was the tile itself, every pass read "no room", and the
 * fit-scale stepped down until it hit the floor (fitScale 0.798, 14.6px vs
 * the bank's 22.9px). The bank tiles never see this: the bank IS their
 * group and is 398px wide.
 *
 * The invariant this pins: a placed tile's group is the tray's OWN layered
 * row — a direct child of `[data-kind="tray"]`, the element that shares
 * the ghost row's grid cell and therefore its full width. happy-dom has no
 * layout, so the assertion is structural (which element is the group),
 * and the pixel claim is the simulator capture in the ledger.
 */
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render } from "@testing-library/react";

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

import { BuildSentenceStepView } from "./BuildSentenceStepView";
import { ListeningBuildStepView } from "./ListeningBuildStepView";
import type { BuildSentenceStep, ListeningBuildStep } from "../../types";

const noop = () => {};

function sentenceStep(tileCount: number): BuildSentenceStep {
  const all = Array.from({ length: tileCount }, (_, i) => `たいる${i}`);
  return {
    id: `nesting-${tileCount}`,
    type: "build_sentence",
    prompt: "Build it",
    targetSentence: all.slice(0, 3).join(" "),
    tiles: all,
    correctOrder: all.slice(0, 3),
    granularity: "word",
  } as BuildSentenceStep;
}

function listeningStep(): ListeningBuildStep {
  return {
    id: "nesting-listen",
    type: "listening_build",
    prompt: "Listen and build",
    tiles: ["あ", "い", "う", "え", "お"],
    correctOrder: ["あ", "い"],
    granularity: "character",
  } as ListeningBuildStep;
}

function firstBankTile(container: HTMLElement): HTMLElement {
  const el = container.querySelector<HTMLElement>('[data-tile-tray][data-kind="bank"] [data-tile]:not([data-spent="true"])');
  if (!el) throw new Error("no bank tile");
  return el;
}

/** The placed tile's tileFit group must be the tray's own layered row. */
function expectPlacedTileGroupIsTheTrayRow(container: HTMLElement) {
  const tray = container.querySelector<HTMLElement>('[data-tile-tray][data-kind="tray"]');
  expect(tray, "sentence tray").not.toBeNull();
  const placed = container.querySelector<HTMLElement>('[data-tile][data-slot="tray"]');
  expect(placed, "a placed tray tile").not.toBeNull();
  const group = placed!.parentElement?.closest<HTMLElement>("[data-tile-tray]") ?? null;
  expect(group, "placed tile's group").not.toBeNull();
  // The group is a direct child of the tray grid (shares the ghost's cell) …
  expect(group!.parentElement).toBe(tray);
  // … and is the layered row, not a nested shrink-wrapped one.
  expect(group!.dataset.layer).toBe("true");
  // Exactly one non-ghost row under the tray: no row-inside-a-row.
  const rows = Array.from(tray!.querySelectorAll('[data-tile-tray][data-kind="row"]:not([data-ghost="true"])'));
  expect(rows).toHaveLength(1);
}

afterEach(() => cleanup());

describe("placed tray tiles measure against the tray's own row (#185, b24)", () => {
  it("BuildSentenceStepView: dense (8-tile) bank, one tap", () => {
    const { container } = render(
      <BuildSentenceStepView step={sentenceStep(8)} onComplete={noop} onContinue={noop} />,
    );
    fireEvent.click(firstBankTile(container));
    expectPlacedTileGroupIsTheTrayRow(container);
  });

  it("BuildSentenceStepView: huge (13-tile) bank, two taps (sortable branch)", () => {
    const { container } = render(
      <BuildSentenceStepView step={sentenceStep(13)} onComplete={noop} onContinue={noop} />,
    );
    fireEvent.click(firstBankTile(container));
    fireEvent.click(firstBankTile(container));
    expectPlacedTileGroupIsTheTrayRow(container);
  });

  it("ListeningBuildStepView: one tap", () => {
    const { container } = render(
      <ListeningBuildStepView step={listeningStep()} onComplete={noop} onContinue={noop} />,
    );
    fireEvent.click(firstBankTile(container));
    expectPlacedTileGroupIsTheTrayRow(container);
  });
});

/**
 * ONE RESERVATION, AND IT IS THE VISIBLE ONE (build 25 decision, 2026-09-17).
 *
 * The lead's ruling after #184/#185: "nothing on screen may move or resize
 * between the learner's first tap and the last tap of the answer, at 100%
 * and 125%, on every build step including 12+ tile huge banks. A smaller
 * constant tile size is preferable to a larger size that shrinks."
 *
 * Build 24 tried to hold the SIZE still while letting the tray GROW: a huge
 * bank reserved one visible row plus a second, zero-height copy of the full
 * answer (`data-phantom`) that `tileFit.ts` priced the fill against. It held
 * the fit scale at 100% (1.00 on all 13 taps) and nothing else: the tray
 * still gained rows, so the prompt re-centred 36.8px upward (measured on the
 * 15 Pro Max, `--simulate build`, `ja-m15-neo-6?step=15`), the bank still
 * moved down under it, and at 125% the stage was already overflowing with an
 * EMPTY tray, so the shrink branch capped the fill first and the reserve was
 * inert (0.82 → 0.72 at tap 9).
 *
 * A tray that is already its final height cannot grow, so there is nothing
 * left to re-price, re-centre or push: the huge bank now reserves the FULL
 * answer in the VISIBLE ghost row — the same reservation every normal bank
 * has had since #75 — and the phantom copy is gone. happy-dom has no layout,
 * so the height claim is the simulator capture in the ledger; what is
 * checkable here is the structure that produces it.
 */
describe("a huge bank reserves its tray's FULL height, visibly (build 25)", () => {
  const tray = (container: HTMLElement) =>
    container.querySelector<HTMLElement>('[data-tile-tray][data-kind="tray"]')!;
  const visibleGhostRow = (container: HTMLElement) =>
    tray(container).querySelector<HTMLElement>(
      ':scope > [data-tile-tray][data-kind="row"][data-ghost="true"]',
    );

  it("the VISIBLE ghost row carries the whole answer on a huge (13-tile) bank", () => {
    const step = sentenceStep(13);
    const { container } = render(
      <BuildSentenceStepView step={step} onComplete={noop} onContinue={noop} />,
    );
    const ghost = visibleGhostRow(container);
    expect(ghost, "the tray's visible ghost row").not.toBeNull();
    // The whole answer, with the same glyphs and the same box as the real
    // tiles — a reservation that measures a different tray is worthless.
    expect(ghost!.querySelectorAll("[data-tile]")).toHaveLength(step.correctOrder.length);
    expect(ghost!.querySelectorAll('[data-tile][data-density="huge"]')).toHaveLength(
      step.correctOrder.length,
    );
  });

  it("renders NO second, hidden copy of the answer — one reservation, not two", () => {
    const { container } = render(
      <BuildSentenceStepView step={sentenceStep(13)} onComplete={noop} onContinue={noop} />,
    );
    expect(container.querySelectorAll('[data-phantom="true"]')).toHaveLength(0);
    // Exactly one ghost row under the tray (the reservation), and it is a
    // direct child of the tray's grid so it shares the real row's cell.
    const ghostRows = tray(container).querySelectorAll('[data-tile-tray][data-ghost="true"]');
    expect(ghostRows).toHaveLength(1);
    expect(ghostRows[0].parentElement).toBe(tray(container));
  });

  it("a normal bank reserves the same way — one visible ghost row, no phantom", () => {
    const step = sentenceStep(8);
    const { container } = render(
      <BuildSentenceStepView step={step} onComplete={noop} onContinue={noop} />,
    );
    expect(container.querySelectorAll('[data-phantom="true"]')).toHaveLength(0);
    expect(visibleGhostRow(container)!.querySelectorAll("[data-tile]")).toHaveLength(
      step.correctOrder.length,
    );
  });
});
