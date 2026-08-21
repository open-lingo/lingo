/**
 * WordMapStepView contract. The load-bearing guards:
 *   · the prompt sequence is the PAIRS order (English order), independent
 *     of token order — the crossing example only teaches adjective
 *     position if 'black' is asked while «negro» sits after «gato»;
 *   · a wrong tap burns budget but does NOT advance the prompt — the
 *     learner retries the same word against a smaller bank;
 *   · match-pairs conventions: 3 mistakes fails immediately AND reveals
 *     the remaining glosses muted, so the teaching lands on a fail;
 *   · solved chips leave the bank (disabled) — the elimination ramp.
 * i18n + TTS are mocked (neither spins up in happy-dom), same as the
 * sibling step-view tests.
 */
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import type { WordMapStep } from "../../types";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, def?: string) => (typeof def === "string" ? def : key),
  }),
}));
const { playJaAudio, getTtsUrl } = vi.hoisted(() => ({
  playJaAudio: vi.fn(),
  getTtsUrl: vi.fn((): string | null => "/tts/fake.mp3"),
}));
// PARTIAL mock: MistakeDots comes from MatchPairsStepView, whose import
// chain reaches lessonBuilder → hasTtsAudio — a full mock breaks that
// transitive import at load time.
vi.mock("@/shared/tts", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/shared/tts")>()),
  playJaAudio,
  getTtsUrl,
}));

import { WordMapStepView } from "./WordMapStepView";

afterEach(() => {
  cleanup();
  playJaAudio.mockClear();
});

/** The crossing sentence — 'black' maps to token 2, AFTER 'cat' (token 1). */
function crossingStep(): WordMapStep {
  return {
    id: "map-crossing",
    type: "word_map",
    tokens: ["el", "gato", "negro"],
    pairs: [
      { en: "the", tokenIndex: 0 },
      { en: "black", tokenIndex: 2 },
      { en: "cat", tokenIndex: 1 },
    ],
    audioText: "el gato negro",
    revealNote: "Color after the noun.",
  };
}

function renderStep(step: WordMapStep = crossingStep()) {
  const onComplete = vi.fn();
  const onContinue = vi.fn();
  render(
    <WordMapStepView
      step={step}
      onComplete={onComplete}
      onContinue={onContinue}
    />,
  );
  return { onComplete, onContinue };
}

const chip = (word: string) =>
  screen.getByRole("button", { name: `Pick ${word}` });

describe("WordMapStepView", () => {
  it("maps a clean run in PAIRS order and completes correct", () => {
    const { onComplete } = renderStep();
    fireEvent.click(chip("el")); // "the"
    fireEvent.click(chip("negro")); // "black" — the crossing pick
    fireEvent.click(chip("gato")); // "cat"
    expect(onComplete).toHaveBeenCalledWith("map-crossing", true);
    expect(screen.getByText("Every word, mapped.")).toBeTruthy();
  });

  it("solved chips lock in with their gloss and leave the bank", () => {
    renderStep();
    // "the" appears once, in the English line.
    expect(screen.getAllByText("the")).toHaveLength(1);
    fireEvent.click(chip("el"));
    expect(chip("el")).toBeDisabled();
    // The interlinear gloss under the solved chip is the SECOND "the".
    expect(screen.getAllByText("the")).toHaveLength(2);
  });

  it("a wrong tap burns budget but the SAME word stays prompted", () => {
    const { onComplete } = renderStep();
    // Prompt 1 is "the"; tap «gato» — wrong.
    fireEvent.click(chip("gato"));
    expect(onComplete).not.toHaveBeenCalled();
    // Still solvable: «el» completes prompt 1.
    fireEvent.click(chip("el"));
    expect(chip("el")).toBeDisabled();
  });

  it("completing with 1-2 mistakes still reports correct (match-pairs budget)", () => {
    const { onComplete } = renderStep();
    fireEvent.click(chip("gato")); // miss 1
    fireEvent.click(chip("el"));
    fireEvent.click(chip("negro"));
    fireEvent.click(chip("gato"));
    expect(onComplete).toHaveBeenCalledWith("map-crossing", true);
  });

  it("3 mistakes fails immediately and reveals the remaining glosses", () => {
    const { onComplete } = renderStep();
    fireEvent.click(chip("gato")); // miss 1 (prompt "the")
    fireEvent.click(chip("negro")); // miss 2
    fireEvent.click(chip("gato")); // miss 3 → failed
    expect(onComplete).toHaveBeenCalledWith("map-crossing", false);
    // Reveal: every unsolved mapping's gloss shows (muted) — teaching
    // lands. Each English word now paints twice: the line + the gloss.
    for (const w of ["the", "black", "cat"]) {
      expect(screen.getAllByText(w)).toHaveLength(2);
    }
    expect(screen.getByText("Color after the noun.")).toBeTruthy();
  });

  it("autoplays the sentence once and replays a solved word's own clip", () => {
    renderStep();
    expect(playJaAudio).toHaveBeenCalledWith("el gato negro");
    fireEvent.click(chip("el"));
    expect(playJaAudio).toHaveBeenCalledWith("el");
  });

  it("a solved chip takes its gender hue when the author tinted that token", () => {
    renderStep({ ...crossingStep(), tokenGenders: { 1: "m" } });
    fireEvent.click(chip("el")); // untinted token → the normal accent state
    expect(chip("el").className).toContain("border-accent");
    fireEvent.click(chip("negro"));
    fireEvent.click(chip("gato")); // tinted m → the gender hue, not accent
    expect(chip("gato").className).toContain("border-sky-500/70");
    expect(chip("el").className).not.toContain("border-sky-500/70");
    // Color is never the only carrier: the solved tinted chip shows the
    // m marker letter; the untinted solves add none.
    expect(screen.getAllByText("m").length).toBe(1);
  });

  it("Continue appears only after the step resolves", () => {
    const { onContinue } = renderStep();
    expect(screen.queryByRole("button", { name: "Continue" })).toBeNull();
    fireEvent.click(chip("el"));
    fireEvent.click(chip("negro"));
    fireEvent.click(chip("gato"));
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    expect(onContinue).toHaveBeenCalledTimes(1);
  });
});
