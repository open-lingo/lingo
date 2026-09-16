/**
 * Transcript wiring: the view must render `transcriptAnnotation` through
 * AnnotatedText when present (Spencer's m29 walk, 2026-07-17 — transcript
 * showed がっこうで… in pure kana at m29 because the kanji post-pass rewrites
 * only `*Annotation` fields and this view read the raw `transcript` string;
 * the annotation was computed and dropped). Kanji/furigana visibility itself
 * is AnnotatedText's contract (AnnotatedText.furiganaSrs.test.tsx) — here we
 * only pin the seam: segments in, raw-string fallback when absent.
 */
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup, fireEvent } from "@testing-library/react";
import type { ListeningComprehensionStep } from "../../types";
import type { JapaneseAnnotation } from "@/shared/japanese/types";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string, def?: string) => (typeof def === "string" ? def : key) }),
}));
vi.mock("@/shared/tts", () => ({
  getTtsUrl: vi.fn(() => null),
}));
vi.mock("@/shared/readingAnnotation/AnnotatedText", () => ({
  AnnotatedText: ({ segments, text }: { segments?: JapaneseAnnotation[]; text?: string }) => (
    <>{segments ? segments.map((s) => s.surface).join("") : text}</>
  ),
}));

// Same seam LearnHomeSwitch.test.tsx uses to fake the form factor: mock the
// shared predicate module rather than window.matchMedia, so each test controls
// the mode explicitly instead of depending on happy-dom's matchMedia. The
// compact branch is now "touch AND not landscape-≥1024" (iPad pass), so the
// flag the view reads is `forceVerticalLearnMap`, not bare coarse-pointer.
const pointer = { coarse: false };
vi.mock("@/shared/platform/formFactor", () => ({
  useFormFactor: () => ({
    coarsePointer: pointer.coarse,
    tabletPortrait: false,
    landscapeLg: !pointer.coarse,
    landscapeDesktopTouch: false,
    forceVerticalLearnMap: pointer.coarse,
  }),
}));

import {
  ListeningComprehensionStepView,
  MAX_LISTENING_MCQ_OPTIONS,
  selectDisplayedOptions,
} from "./ListeningComprehensionStepView";

afterEach(() => {
  cleanup();
  pointer.coarse = false;
});

function makeStep(
  overrides: Partial<ListeningComprehensionStep> = {},
): ListeningComprehensionStep {
  return {
    id: "lc-test",
    type: "listening_comprehension",
    audioKey: "がっこうで にほんごを べんきょうします",
    transcript: "がっこうで にほんごを べんきょうします",
    question: "What does this sentence mean?",
    options: [
      { id: "correct", text: "I study Japanese at school." },
      { id: "opt-1", text: "I study English at school." },
    ],
    correctOptionId: "correct",
    ...overrides,
  };
}

const noop = () => {};

describe("ListeningComprehensionStepView transcript", () => {
  it("renders the kanji-substituted annotation, not the raw kana transcript", () => {
    const step = makeStep({
      transcriptAnnotation: [
        { surface: "学校", reading: "がっこう", atomId: "ja-gakkou", furiganaWindowOpen: false },
        { surface: "で ", reading: "で " },
        { surface: "日本語", reading: "にほんご", atomId: "ja-nihongo", furiganaWindowOpen: false },
        { surface: "を べんきょうします", reading: "を べんきょうします" },
      ] as JapaneseAnnotation[],
    });
    render(
      <ListeningComprehensionStepView step={step} onComplete={noop} onContinue={noop} />,
    );
    expect(screen.getByText(/学校で 日本語を べんきょうします/)).toBeTruthy();
    expect(screen.queryByText(/^がっこうで/)).toBeNull();
  });

  it("falls back to the raw transcript when no annotation is present", () => {
    render(
      <ListeningComprehensionStepView step={makeStep()} onComplete={noop} onContinue={noop} />,
    );
    expect(screen.getByText(/がっこうで にほんごを べんきょうします/)).toBeTruthy();
  });
});

/**
 * TestFlight #63 (Spencer's verdict, b12 2026-09-14 follow-up): a 4-option
 * listening MCQ caps at MAX_LISTENING_MCQ_OPTIONS (3) ONLY on a touch/
 * coarse-pointer surface. Desktop/web renders every authored option
 * unchanged — "3 on mobile, 4 on web, doesn't change our authoring."
 */
describe("ListeningComprehensionStepView option cap (#63)", () => {
  const fourOptionStep = makeStep({
    options: [
      { id: "opt-1", text: "The ticket was expensive, so I gave the subway a go" },
      { id: "opt-2", text: "When I'm free I have a go at taking photos of the mountain" },
      { id: "correct", text: "I'm going abroad next month, so I'll take lessons in the language in advance" },
      { id: "opt-3", text: "The event was difficult, so I taught the class instead" },
    ],
    correctOptionId: "correct",
  });

  describe("touch/mobile (coarse pointer)", () => {
    it("renders exactly MAX_LISTENING_MCQ_OPTIONS buttons for a 4-option step", () => {
      pointer.coarse = true;
      render(
        <ListeningComprehensionStepView step={fourOptionStep} onComplete={noop} onContinue={noop} />,
      );
      const buttons = screen.getAllByRole("button").filter((b) => b.textContent?.length && b.textContent.length > 10);
      expect(buttons.length).toBe(MAX_LISTENING_MCQ_OPTIONS);
    });

    it("always keeps the correct option among the rendered buttons", () => {
      pointer.coarse = true;
      render(
        <ListeningComprehensionStepView step={fourOptionStep} onComplete={noop} onContinue={noop} />,
      );
      expect(
        screen.getByText(/I'm going abroad next month, so I'll take lessons in the language in advance/),
      ).toBeTruthy();
    });
  });

  describe("desktop/web (fine pointer)", () => {
    it("renders all authored options for a 4-option step, uncapped", () => {
      pointer.coarse = false;
      render(
        <ListeningComprehensionStepView step={fourOptionStep} onComplete={noop} onContinue={noop} />,
      );
      const buttons = screen.getAllByRole("button").filter((b) => b.textContent?.length && b.textContent.length > 10);
      expect(buttons.length).toBe(fourOptionStep.options.length);
    });

    it("renders every authored option's text, not just the correct one", () => {
      pointer.coarse = false;
      render(
        <ListeningComprehensionStepView step={fourOptionStep} onComplete={noop} onContinue={noop} />,
      );
      for (const opt of fourOptionStep.options) {
        expect(screen.getByText(opt.text)).toBeTruthy();
      }
    });
  });

  it("selectDisplayedOptions is stable across calls for the same seed in compact mode", () => {
    const first = selectDisplayedOptions(fourOptionStep.options, "correct", fourOptionStep.id, true);
    const second = selectDisplayedOptions(fourOptionStep.options, "correct", fourOptionStep.id, true);
    expect(first.map((o) => o.id)).toEqual(second.map((o) => o.id));
    expect(first.length).toBe(MAX_LISTENING_MCQ_OPTIONS);
    expect(first.some((o) => o.id === "correct")).toBe(true);
  });

  it("compact:false returns every authored option regardless of count", () => {
    const all = selectDisplayedOptions(fourOptionStep.options, "correct", fourOptionStep.id, false);
    expect(all.map((o) => o.id)).toEqual(fourOptionStep.options.map((o) => o.id));
  });

  it("leaves a step at or under the cap untouched in compact mode", () => {
    const threeOption = makeStep({
      options: [
        { id: "correct", text: "A" },
        { id: "opt-1", text: "B" },
        { id: "opt-2", text: "C" },
      ],
    });
    const kept = selectDisplayedOptions(threeOption.options, "correct", threeOption.id, true);
    expect(kept.map((o) => o.id)).toEqual(["correct", "opt-1", "opt-2"]);
  });
});

/**
 * TestFlight #148 (founder, build 18, iPad Air landscape — "Button padding
 * too much if this is clipping off the edge"), and the phase-2B migration
 * that replaced the assertion under it.
 *
 * This view used to style its option rows with a literal Tailwind string
 * (`px-4 py-3 … sm:py-[var(--lc-option-py,1rem)]` plus a four-branch colour
 * ternary), so the "tokens only, no per-view literal sizing" ratchet had to
 * live here as a class-string pin. Since 2026-09-16 the rows ARE `Tile`s
 * (`variant="option" size="sentence"`) — it was the worst measured overflow in
 * the device sweep (198px at 125% on `ja-m41-neo-challenge?step=4`) with zero
 * `[data-tile]` elements on screen, so neither the fit nor the fill half of
 * the text rule could reach it. #148's number survives as
 * `--option-prose-py`, read by the sentence tier in `index.css` and still
 * declared only inside the landscape-tablet media query.
 *
 * What this now pins is the thing that would silently undo the migration: a
 * view passing its own padding/font/colour classes back onto the primitive.
 * The geometry itself is asserted against the CSS in
 * `tiles/tileFit.test.ts`; happy-dom applies no stylesheet, so a px assertion
 * here would be measuring nothing.
 */
describe("ListeningComprehensionStepView option row (#148)", () => {
  it("renders its options as option-variant Tiles and passes no sizing classes", () => {
    render(
      <ListeningComprehensionStepView step={makeStep()} onComplete={noop} onContinue={noop} />,
    );
    const buttons = screen.getAllByRole("button").filter((b) => b.hasAttribute("aria-pressed"));
    expect(buttons.length).toBeGreaterThan(0);
    for (const b of buttons) {
      expect(b.getAttribute("data-tile")).toBe("");
      expect(b.getAttribute("data-variant")).toBe("option");
      // Prose in a stacked list — the MCQ grid cell's tier (`sentence`)
      // measured 44px WORSE on this layout; see the `row` tier in index.css.
      expect(b.getAttribute("data-size")).toBe("row");
      // The primitive owns padding, font size and colour. A `py-*`/`text-*`/
      // `border-*`/`bg-*` class here is the mistake `Tile` exists to prevent.
      expect(b.className ?? "").not.toMatch(/\b(py-|px-|text-(base|lg|xl)|border-|bg-)/);
    }
  });

  it("drives option colour from data-state, not a className ternary", () => {
    render(
      <ListeningComprehensionStepView step={makeStep()} onComplete={noop} onContinue={noop} />,
    );
    const buttons = screen.getAllByRole("button").filter((b) => b.hasAttribute("aria-pressed"));
    for (const b of buttons) expect(b.getAttribute("data-state")).toBe("idle");
    fireEvent.click(buttons[0]);
    expect(buttons[0].getAttribute("data-state")).toBe("selected");
  });
});

/**
 * TestFlight #165 (founder, build 20): the play button + "Listen and
 * answer" eyebrow + sentence now route through the shared
 * `ListenPromptHeader` primitive (also used by ListeningBuildStepView) —
 * left button sized off the sentence's own font token, sentence wraps
 * beside it. Pins the seam rather than the primitive's internals (covered
 * by ListenPromptHeader.test.tsx).
 */
describe("ListeningComprehensionStepView listen header (#165)", () => {
  it("sizes the play button from the sentence's own font token (1.2rem/leading-tight), not a fixed h-14", () => {
    render(
      <ListeningComprehensionStepView step={makeStep()} onComplete={noop} onContinue={noop} />,
    );
    const btn = screen.getByRole("button", { name: "Play audio" });
    expect(btn.className).toContain("h-[var(--lph-btn)]");
    expect(btn.className).not.toContain("h-14");
    const row = btn.parentElement as HTMLElement;
    expect(row.style.getPropertyValue("--lph-btn")).toBe(
      "max(44px, calc(1.2rem * 1.25 * 2))",
    );
  });

  it("still renders the eyebrow badge and sentence beside the button", () => {
    render(
      <ListeningComprehensionStepView step={makeStep()} onComplete={noop} onContinue={noop} />,
    );
    expect(screen.getByText("Listen and answer")).toBeTruthy();
    expect(screen.getByText(/がっこうで にほんごを べんきょうします/)).toBeTruthy();
  });
});
