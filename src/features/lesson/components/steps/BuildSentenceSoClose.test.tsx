/**
 * "So close" — one forgivable omission on a long sentence build.
 *
 * Spencer m31 walk 2026-08-15: "one missing word is forgivable by a 'so
 * close' yellow error, allowing the missing word to be slot in". The grace
 * fires BEFORE grading: nothing is reported to the lesson, the tray stays
 * live, and the banner never names the missing word. It is spent once per
 * step, so a second omission grades red like any other miss.
 */
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (k: string, d?: string) => (typeof d === "string" ? d : k) }),
}));
vi.mock("@/shared/tts", () => ({
  getTtsUrl: vi.fn(() => null),
  hasTtsAudio: vi.fn(() => false),
  playJaAudio: vi.fn(),
  useAutoPlayJaAudio: vi.fn(),
}));
vi.mock("@/shared/audio/volume", () => ({ playLocalAudio: vi.fn() }));
vi.mock("@/shared/audio/sfx", () => ({ playSfx: vi.fn() }));
vi.mock("./BuildTileSurface", () => ({
  BuildTileSurface: ({ tile }: { tile: string }) => (
    <span data-testid={`tile-${tile}`}>{tile}</span>
  ),
  useBuildTileKanji: () => new Map(),
  useTileRomajiPeek: () => ({
    revealed: new Set(),
    reveal: () => {},
    hoverStart: () => {},
    hoverEnd: () => {},
    isRevealed: () => false,
  }),
  HOVER_REVEAL_MS: 500,
}));
vi.mock("@/shared/contexts/SettingsContext", () => ({
  useSettings: () => ({ settings: { learning: { hideBuildTileRomaji: false } } }),
}));
vi.mock("@/shared/readingAnnotation/AnnotatedText", () => ({
  AnnotatedText: ({ text }: { text: string }) => (
    <span data-testid={`tile-${text}`}>{text}</span>
  ),
}));

import {
  BuildSentenceStepView,
  missingOneTileIndex,
} from "./BuildSentenceStepView";
import type { BuildSentenceStep } from "../../types";

afterEach(() => cleanup());

// 7 tiles: past the 6-tile floor, so the grace applies.
const LONG = ["こども", "が", "すき", "だ", "から", "えんぴつ", "を"];

/**
 * `targetSentence` is BUNSETSU-spaced, matching every one of the 2,489
 * shipped word builds — it is the seed `expandAcceptedAnswers` seeds the
 * leniency set from, and its spacing carries the word grouping the scrambler
 * chunks on. Omitting it here would fall back to joining TILES with spaces,
 * which hands the scrambler a bare が as its own movable chunk and has it
 * emit 「が こども すき…」 as an accepted answer. No shipped step does that;
 * the test must not either.
 */
function makeStep(
  correctOrder: string[] = LONG,
  targetSentence = "こどもが すきだから えんぴつを",
): BuildSentenceStep {
  return {
    id: "test-so-close",
    type: "build_sentence",
    prompt: "Build: I like children, so a pencil",
    targetSentence,
    tiles: [...correctOrder, "まで"],
    correctOrder,
    granularity: "word",
  } as BuildSentenceStep;
}

function bankButtonFor(text: string): HTMLElement {
  const tile = screen.getAllByTestId(`tile-${text}`).find((el) => {
    const b = el.closest("button");
    return b !== null && !b.hasAttribute("disabled");
  });
  const btn = tile?.closest("button");
  if (!btn) throw new Error(`no clickable bank tile for ${text}`);
  return btn;
}

const check = () =>
  fireEvent.click(screen.getByRole("button", { name: /check/i }));

describe("missingOneTileIndex", () => {
  const t = ["a", "b", "c", "d"];

  it("finds the single omitted index", () => {
    expect(missingOneTileIndex(["b", "c", "d"], t)).toBe(0);
    expect(missingOneTileIndex(["a", "b", "d"], t)).toBe(2);
    expect(missingOneTileIndex(["a", "b", "c"], t)).toBe(3);
  });

  it("refuses anything that is not exactly one omission", () => {
    expect(missingOneTileIndex(["a", "b", "c", "d"], t)).toBeNull(); // complete
    expect(missingOneTileIndex(["a", "b"], t)).toBeNull(); // two missing
    expect(missingOneTileIndex(["a", "c", "b"], t)).toBeNull(); // transposed
    expect(missingOneTileIndex(["a", "b", "x"], t)).toBeNull(); // wrong word
    expect(missingOneTileIndex([], [])).toBeNull();
  });

  it("keeps a duplicated word honest", () => {
    // ["a","b","a"] minus the LAST a is ["a","b"] — one omission, index 2.
    expect(missingOneTileIndex(["a", "b"], ["a", "b", "a"])).toBe(2);
    // …but ["b","a"] is a transposition of the first two, not an omission.
    expect(missingOneTileIndex(["b", "b"], ["a", "b", "a"])).toBeNull();
  });
});

describe("so-close grace", () => {
  it("shows the amber banner and grades NOTHING when one word is missing", () => {
    const onComplete = vi.fn();
    render(
      <BuildSentenceStepView step={makeStep()} onComplete={onComplete} onContinue={() => {}} />,
    );
    for (const tile of LONG.filter((w) => w !== "だ")) {
      fireEvent.click(bankButtonFor(tile));
    }
    check();

    expect(screen.getByText("So close")).toBeTruthy();
    expect(screen.getByText(/One word is missing/)).toBeTruthy();
    // Not graded, not submitted: the CTA is still Check and the lesson has
    // heard nothing at all about this attempt.
    expect(onComplete).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: /check/i })).toBeTruthy();
    // The answer is NOT revealed — the learner is about to fix their own tray.
    expect(screen.queryByText(/Correct answer/)).toBeNull();
  });

  it("lets the learner slot the missing word in and pass", () => {
    const onComplete = vi.fn();
    render(
      <BuildSentenceStepView step={makeStep()} onComplete={onComplete} onContinue={() => {}} />,
    );
    // Drop the LAST word, so the repair is a single tap into the append-only
    // tray — the exact motion the grace exists to allow.
    for (const tile of LONG.slice(0, -1)) fireEvent.click(bankButtonFor(tile));
    check();
    expect(screen.getByText("So close")).toBeTruthy();
    expect(onComplete).not.toHaveBeenCalled();

    fireEvent.click(bankButtonFor(LONG[LONG.length - 1]));
    check();
    expect(onComplete).toHaveBeenCalledWith(
      "test-so-close",
      true,
      undefined,
      LONG.join(" "),
    );
    expect(screen.queryByText("So close")).toBeNull();
  });

  it("spends the grace once — a second omission grades red", () => {
    const onComplete = vi.fn();
    render(
      <BuildSentenceStepView step={makeStep()} onComplete={onComplete} onContinue={() => {}} />,
    );
    for (const tile of LONG.filter((w) => w !== "だ")) {
      fireEvent.click(bankButtonFor(tile));
    }
    check();
    expect(onComplete).not.toHaveBeenCalled();

    // Same tray, checked again: the grace is spent, so this is a normal miss.
    check();
    expect(screen.getByText("Not quite")).toBeTruthy();
    expect(screen.queryByText("So close")).toBeNull();
    expect(onComplete).toHaveBeenCalledWith(
      "test-so-close",
      false,
      undefined,
      LONG.filter((w) => w !== "だ").join(" "),
    );
  });

  it("does NOT forgive a short answer — there the missing word is the lesson", () => {
    const short = ["ねこ", "が", "いる", "から"]; // 4 tiles, under the floor
    const onComplete = vi.fn();
    render(
      <BuildSentenceStepView
        step={makeStep(short, "ねこが いるから")}
        onComplete={onComplete}
        onContinue={() => {}}
      />,
    );
    for (const tile of short.filter((w) => w !== "が")) {
      fireEvent.click(bankButtonFor(tile));
    }
    check();
    expect(screen.queryByText("So close")).toBeNull();
    expect(screen.getByText("Not quite")).toBeTruthy();
    expect(onComplete).toHaveBeenCalledWith(
      "test-so-close",
      false,
      undefined,
      short.filter((w) => w !== "が").join(" "),
    );
  });

  it("does not fire for a transposition — only for an omission", () => {
    const onComplete = vi.fn();
    render(
      <BuildSentenceStepView step={makeStep()} onComplete={onComplete} onContinue={() => {}} />,
    );
    for (const tile of ["が", "こども", "すき", "だ", "から", "えんぴつ", "を"]) {
      fireEvent.click(bankButtonFor(tile));
    }
    check();
    expect(screen.queryByText("So close")).toBeNull();
    expect(onComplete).toHaveBeenCalledWith(
      "test-so-close",
      false,
      undefined,
      "が こども すき だ から えんぴつ を",
    );
  });
});
