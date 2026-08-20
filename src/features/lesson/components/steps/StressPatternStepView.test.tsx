/**
 * StressPatternStepView contract.
 *
 * One idea holds this step up: the answer must be HEARD, not read. Everything
 * that could leak it — the accented spelling, the English gloss (on a minimal
 * pair «hablo»/«habló» the gloss IS the stress), the rule label, the partner
 * form — lives behind Check, and the audio plays on mount because it is the
 * stimulus rather than a reward. Those are the tests that matter here.
 *
 * Two more guard fixes that only show up in a browser:
 *   · the middot separator TRAILS its syllable inside one non-wrapping unit.
 *     Leading the next one dropped a naked middot at the start of line 2 on a
 *     5-syllable word at 375px, where it read as a bullet;
 *   · a long `writtenForm` steps down a type size and carries `hyphens-auto`
 *     + `lang="es"`, because «electrodomésticos» at 30px wrapped mid-word —
 *     breaking the one thing the learner came to look at.
 * i18n + TTS are mocked, same as SilentLetterStepView.test; `getTtsUrl` is
 * controllable because "no clip in the manifest" is its own contract.
 */
import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";
import { render, screen, fireEvent, cleanup, act } from "@testing-library/react";
import type { StressPatternStep } from "../../types";

const tts = vi.hoisted(() => ({
  playJaAudio: vi.fn(),
  getTtsUrl: vi.fn((_text: string): string | null => "https://cdn.example/hablo.mp3"),
}));

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (
      key: string,
      def?: string | Record<string, unknown>,
      opts?: Record<string, unknown>,
    ) => {
      const template = typeof def === "string" ? def : key;
      const vars = (typeof def === "object" ? def : opts) ?? {};
      return template.replace(/\{\{(\w+)\}\}/g, (_, k: string) =>
        String(vars[k] ?? ""),
      );
    },
  }),
}));
vi.mock("@/shared/tts", () => tts);

import { StressPatternStepView } from "./StressPatternStepView";

beforeEach(() => {
  vi.useFakeTimers();
  tts.playJaAudio.mockClear();
  // Default: the clip EXISTS. The manifest-miss path is one test, opted into.
  tts.getTtsUrl.mockReturnValue("https://cdn.example/hablo.mp3");
});

afterEach(() => {
  vi.useRealTimers();
  cleanup();
});

/** «habló» — the minimal pair the type's doc comment is built around. */
function makeStep(overrides: Partial<StressPatternStep> = {}): StressPatternStep {
  return {
    id: "sp-test",
    type: "stress_pattern",
    syllables: ["ha", "blo"],
    stressedIndex: 1,
    writtenForm: "habló",
    meaningEn: "he/she spoke",
    audioText: "habló",
    accentRule: "aguda",
    ruleNote: "An aguda ending in a vowel takes a written accent.",
    minimalPair: { writtenForm: "hablo", meaningEn: "I speak" },
    ...overrides,
  };
}

const cta = () => screen.getByTestId("primary-cta").querySelector("button")!;
const play = () => screen.getByRole("button", { name: "Play audio" });
const syllable = (n: number, text: string) =>
  screen.getByRole("button", { name: `Syllable ${n}: ${text}` });
const syllables = () =>
  screen
    .getAllByRole("button")
    .filter((b) => /^Syllable /.test(b.getAttribute("aria-label") ?? ""));

/** Renders inside `act` so the mount effect's timer is owned by the test. */
function mount(step: StressPatternStep = makeStep()) {
  const onComplete = vi.fn();
  const onContinue = vi.fn();
  const utils = render(
    <StressPatternStepView step={step} onComplete={onComplete} onContinue={onContinue} />,
  );
  return { ...utils, onComplete, onContinue };
}

/** Runs the 250ms autoplay delay. */
const settleAutoplay = () => act(() => void vi.advanceTimersByTime(300));

describe("StressPatternStepView", () => {
  it("plays the word on mount — the audio is the question, not a reward", () => {
    mount();
    expect(tts.playJaAudio).not.toHaveBeenCalled(); // 250ms settle first
    settleAutoplay();
    expect(tts.playJaAudio).toHaveBeenCalledWith("habló");
  });

  it("plays exactly once per step, however the learner pokes at it", () => {
    mount();
    settleAutoplay();
    fireEvent.click(syllable(1, "ha"));
    fireEvent.click(syllable(2, "blo"));
    settleAutoplay();
    // Re-firing the stimulus mid-answer is the defect the mount guard exists
    // for; only the explicit replay button may speak again.
    expect(tts.playJaAudio).toHaveBeenCalledTimes(1);
    fireEvent.click(play());
    expect(tts.playJaAudio).toHaveBeenCalledTimes(2);
  });

  it("does not autoplay, and disables replay, when the manifest has no clip", () => {
    tts.getTtsUrl.mockReturnValue(null);
    mount();
    settleAutoplay();
    expect(tts.playJaAudio).not.toHaveBeenCalled();
    // Rendered but dead, rather than absent: without it the card loses its
    // anchor and the step reads as though audio failed to load.
    expect(play()).toBeDisabled();
  });

  it("keeps Check disabled until a syllable is picked", () => {
    mount();
    expect(cta()).toBeDisabled();
    fireEvent.click(syllable(1, "ha"));
    expect(cta()).not.toBeDisabled();
  });

  it("grades the picked syllable against stressedIndex", () => {
    const { onComplete } = mount();
    fireEvent.click(syllable(2, "blo"));
    fireEvent.click(cta());
    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(onComplete).toHaveBeenCalledWith("sp-test", true);
  });

  it("grades the wrong syllable false", () => {
    const { onComplete } = mount();
    fireEvent.click(syllable(1, "ha"));
    fireEvent.click(cta());
    expect(onComplete).toHaveBeenCalledWith("sp-test", false);
    expect(screen.getByRole("alert").textContent).toContain("Not quite");
  });

  it("grades once and then hands the CTA to Continue", () => {
    const { onComplete, onContinue } = mount();
    fireEvent.click(syllable(2, "blo"));
    fireEvent.click(cta());
    fireEvent.click(cta());
    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(onContinue).toHaveBeenCalledTimes(1);
  });

  it("lets the learner change their mind before Check, and freezes after it", () => {
    const { onComplete } = mount();
    fireEvent.click(syllable(1, "ha"));
    fireEvent.click(syllable(2, "blo"));
    expect(syllable(1, "ha").getAttribute("aria-pressed")).toBe("false");
    expect(syllable(2, "blo").getAttribute("aria-pressed")).toBe("true");
    fireEvent.click(cta());
    expect(onComplete).toHaveBeenCalledWith("sp-test", true);
    for (const s of syllables()) expect(s).toBeDisabled();
  });

  it("shows nothing that could be read instead of heard, before Check", () => {
    mount();
    // The tilde IS the answer; so is the gloss on a minimal pair, so is the
    // partner form, so is the rule that names which syllable an aguda stresses.
    expect(document.body.textContent).not.toContain("habló");
    expect(document.body.textContent).not.toContain("he/she spoke");
    expect(document.body.textContent).not.toContain("hablo");
    expect(document.body.textContent).not.toContain("I speak");
    expect(document.body.textContent).not.toContain("aguda");
    expect(document.body.textContent).not.toContain("written accent");
    // …and the syllables themselves carry no accent (authoring contract).
    expect(syllables().map((s) => s.textContent).join("")).toBe("hablo");
  });

  it("reveals spelling, gloss, rule and partner form after Check", () => {
    mount();
    fireEvent.click(syllable(2, "blo"));
    fireEvent.click(cta());
    expect(screen.getByText("habló")).toBeInTheDocument();
    expect(screen.getByText("he/she spoke")).toBeInTheDocument();
    expect(screen.getByText(/aguda — stress on the last syllable/)).toBeInTheDocument();
    expect(screen.getByText(/An aguda ending in a vowel/)).toBeInTheDocument();
    // The partner form is what the stress was DOING.
    expect(screen.getByText("hablo")).toBeInTheDocument();
  });

  it("marks the stressed syllable success and the learner's miss error", () => {
    mount();
    fireEvent.click(syllable(1, "ha"));
    fireEvent.click(cta());
    expect(syllable(2, "blo").className).toMatch(/border-success/);
    expect(syllable(1, "ha").className).toMatch(/border-error/);
  });

  it("trails the separator inside its own syllable's non-wrapping unit", () => {
    mount(
      makeStep({
        syllables: ["e", "lec", "tro", "do", "mes", "ti", "cos"],
        stressedIndex: 4,
        writtenForm: "electrodomésticos",
      }),
    );
    const units = syllables().map((s) => s.parentElement!);
    // A leading separator puts a naked middot at the start of line 2 when a
    // long word wraps, where it reads as a bullet rather than a break.
    expect(units[0].textContent).toBe("e·");
    expect(units[0].className).toMatch(/whitespace-nowrap/);
    // …and the last syllable gets none, so the row never ends in a dangling dot.
    expect(units.at(-1)!.textContent).toBe("cos");
  });

  it("steps a long revealed spelling down a size and lets it hyphenate", () => {
    mount(
      makeStep({
        syllables: ["e", "lec", "tro", "do", "mes", "ti", "cos"],
        stressedIndex: 4,
        writtenForm: "electrodomésticos",
      }),
    );
    fireEvent.click(syllable(5, "mes"));
    fireEvent.click(cta());
    const spelling = screen.getByText("electrodomésticos");
    // 17 chars at text-3xl wrapped mid-word at 375px — the payoff, broken.
    expect(spelling.className).toMatch(/\btext-2xl\b/);
    expect(spelling.className).not.toMatch(/\btext-3xl sm:text-4xl\b/);
    expect(spelling.className).toMatch(/hyphens-auto/);
    // `hyphens-auto` needs a language to pick a dictionary; without `lang` it
    // is inert and the last-resort break lands mid-syllable again.
    expect(spelling.getAttribute("lang")).toBe("es");
  });

  it("keeps a short spelling at full size", () => {
    mount();
    fireEvent.click(syllable(2, "blo"));
    fireEvent.click(cta());
    // Matched as the whole pair: `\btext-3xl\b` alone also matches inside the
    // reduced size's own `sm:text-3xl`, which made this assertion inert.
    expect(screen.getByText("habló").className).toContain("text-3xl sm:text-4xl");
  });

  it("holds the syllable row at a fixed height across Check", () => {
    const { container } = mount();
    // The stimulus card's padding must not change on submit — the tappable
    // syllables have to stay where the learner was looking.
    const card = container.querySelector(".border-info\\/40")!;
    const before = card.className;
    fireEvent.click(syllable(2, "blo"));
    fireEvent.click(cta());
    expect(container.querySelector(".border-info\\/40")!.className).toBe(before);
    // Everything revealed lands below the row, never above it.
    const row = syllables()[0].parentElement!.parentElement!;
    const rule = screen.getByText(/aguda — stress on the last syllable/);
    expect(row.compareDocumentPosition(rule) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it("keeps banner and CTA in one sticky bottom block", () => {
    mount();
    fireEvent.click(syllable(1, "ha"));
    fireEvent.click(cta());
    // Without the `primary-cta` hook the CTA sat 228px below the fold at
    // 375x667 once the three reveal blocks landed.
    expect(screen.getByTestId("primary-cta")).toContainElement(screen.getByRole("alert"));
  });
});
