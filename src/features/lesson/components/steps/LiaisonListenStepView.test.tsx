/**
 * LiaisonListenStepView contract.
 *
 * The step's whole claim is that it can separate the TWO ways a French learner
 * gets liaison wrong — missing a link and over-applying one — so the grading
 * tests below check both failure directions, not just "wrong answer".
 *
 * The rest guard things that are invisible in source and obvious on a phone:
 *   · junctions are DERIVED from `words`, so an authored index that points at
 *     no boundary must be dropped rather than making the item ungradeable;
 *   · listen-before-Check is a pedagogy gate, but it LIFTS when the manifest
 *     has no clip — otherwise a missing recording dead-ends the learner;
 *   · nothing on screen before Check may say which junctions link (arc tone,
 *     junction notes), because that is the entire answer.
 * i18n + TTS are mocked (neither spins up in happy-dom), same as
 * SilentLetterStepView.test. `getTtsUrl` is a controllable mock here because
 * "has a clip" vs "has none" are two different contracts in this view.
 */
import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import type { LiaisonListenStep } from "../../types";

const tts = vi.hoisted(() => ({
  playJaAudio: vi.fn(),
  getTtsUrl: vi.fn((_text: string): string | null => null),
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

import { LiaisonListenStepView } from "./LiaisonListenStepView";

beforeEach(() => {
  tts.playJaAudio.mockClear();
  // Default: NO clip in the manifest. Tests that exercise the listen gate opt
  // in, so a test that forgets to can never accidentally pass the gate.
  tts.getTtsUrl.mockReturnValue(null);
});

afterEach(() => {
  cleanup();
});

/** «Les amis et les héros» — links at 0 and 4 is wrong on purpose in the
 *  fixture below; the authored answer is 0 only, and junction 3 (h aspiré) is
 *  the classic over-application trap. */
function makeStep(overrides: Partial<LiaisonListenStep> = {}): LiaisonListenStep {
  return {
    id: "ll-test",
    type: "liaison_listen",
    prompt: "Tap where the words link",
    audioText: "Les amis et les héros",
    meaningEn: "The friends and the heroes",
    words: ["Les", "amis", "et", "les", "héros"],
    linkedJunctions: [0],
    junctionNotes: {
      0: "Plural -s links onto a vowel.",
      3: "H aspiré blocks the link.",
    },
    ...overrides,
  };
}

const junctions = () =>
  screen
    .getAllByRole("button")
    .filter((b) => /^Link /.test(b.getAttribute("aria-label") ?? ""));

const tapJunction = (a: string, b: string) =>
  fireEvent.click(screen.getByRole("button", { name: `Link ${a} to ${b}?` }));

const cta = () => screen.getByTestId("primary-cta").querySelector("button")!;
const play = () => screen.getByRole("button", { name: "Play audio" });

/** Arcs are the answer key after Check, so their tone classes are what the
 *  information-boundary tests read. */
const arcClasses = () =>
  junctions().map((b) => b.querySelector("span")?.className ?? "");

describe("LiaisonListenStepView", () => {
  it("renders exactly words.length - 1 junctions, each between its own pair", () => {
    render(<LiaisonListenStepView step={makeStep()} onComplete={vi.fn()} onContinue={vi.fn()} />);
    // 5 words -> 4 gaps. A trailing gap after the last word would be a claim
    // about a boundary that does not exist.
    expect(junctions()).toHaveLength(4);
    expect(junctions().map((b) => b.getAttribute("aria-label"))).toEqual([
      "Link Les to amis?",
      "Link amis to et?",
      "Link et to les?",
      "Link les to héros?",
    ]);
  });

  it("keeps each junction inside the same non-wrapping unit as the word before it", () => {
    render(<LiaisonListenStepView step={makeStep()} onComplete={vi.fn()} onContinue={vi.fn()} />);
    // A line break between a word and its gap would orphan the junction from
    // the pair it is a claim about.
    const first = junctions()[0];
    expect(first.parentElement?.textContent).toBe("Les");
  });

  it("drops linkedJunctions that point at no boundary instead of grading them", () => {
    const onComplete = vi.fn();
    // 7 is past the last gap — an authoring slip must not make the item
    // impossible, because the learner has no way to tap a junction that is
    // not rendered.
    render(
      <LiaisonListenStepView
        step={makeStep({ linkedJunctions: [0, 7] })}
        onComplete={onComplete}
        onContinue={vi.fn()}
      />,
    );
    tapJunction("Les", "amis");
    fireEvent.click(cta());
    expect(onComplete).toHaveBeenCalledWith("ll-test", true);
  });

  it("grades a MISSED link wrong", () => {
    const onComplete = vi.fn();
    render(<LiaisonListenStepView step={makeStep()} onComplete={onComplete} onContinue={vi.fn()} />);
    fireEvent.click(cta()); // committed nothing
    expect(onComplete).toHaveBeenCalledWith("ll-test", false);
  });

  it("grades an OVER-APPLIED link wrong — the other half of the failure this step exists for", () => {
    const onComplete = vi.fn();
    render(<LiaisonListenStepView step={makeStep()} onComplete={onComplete} onContinue={vi.fn()} />);
    tapJunction("Les", "amis"); // the real link
    tapJunction("les", "héros"); // h aspiré — the trap
    fireEvent.click(cta());
    // A subset check would call this correct. Liaison is graded as a SET.
    expect(onComplete).toHaveBeenCalledWith("ll-test", false);
  });

  it("grades the exact set correct, and a tap can be taken back", () => {
    const onComplete = vi.fn();
    render(<LiaisonListenStepView step={makeStep()} onComplete={onComplete} onContinue={vi.fn()} />);
    tapJunction("les", "héros");
    tapJunction("les", "héros"); // toggled back off
    tapJunction("Les", "amis");
    fireEvent.click(cta());
    expect(onComplete).toHaveBeenCalledWith("ll-test", true);
  });

  it("grades once and then hands the CTA to Continue", () => {
    const onComplete = vi.fn();
    const onContinue = vi.fn();
    render(
      <LiaisonListenStepView step={makeStep()} onComplete={onComplete} onContinue={onContinue} />,
    );
    tapJunction("Les", "amis");
    fireEvent.click(cta());
    fireEvent.click(cta()); // same button, now Continue
    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(onContinue).toHaveBeenCalledTimes(1);
  });

  it("freezes the junctions after Check so the answer key cannot be edited", () => {
    render(<LiaisonListenStepView step={makeStep()} onComplete={vi.fn()} onContinue={vi.fn()} />);
    fireEvent.click(cta());
    for (const j of junctions()) expect(j).toBeDisabled();
  });

  describe("with a clip in the manifest", () => {
    beforeEach(() => {
      tts.getTtsUrl.mockReturnValue("https://cdn.example/liaison.mp3");
    });

    it("gates Check on listening, because this is a listening judgement", () => {
      render(<LiaisonListenStepView step={makeStep()} onComplete={vi.fn()} onContinue={vi.fn()} />);
      expect(cta()).toBeDisabled();
      expect(cta().textContent).toBe("Listen first");
      fireEvent.click(play());
      expect(tts.playJaAudio).toHaveBeenCalledWith("Les amis et les héros");
      expect(cta()).not.toBeDisabled();
      expect(cta().textContent).toBe("Check");
    });

    it("keeps the clip replayable before committing — one pass is not enough to hear a link", () => {
      render(<LiaisonListenStepView step={makeStep()} onComplete={vi.fn()} onContinue={vi.fn()} />);
      fireEvent.click(play());
      fireEvent.click(play());
      expect(tts.playJaAudio).toHaveBeenCalledTimes(2);
      expect(play()).not.toBeDisabled();
    });
  });

  it("lifts the gate when there is NO clip, rather than trapping the learner in the step", () => {
    render(<LiaisonListenStepView step={makeStep()} onComplete={vi.fn()} onContinue={vi.fn()} />);
    // Play is dead (nothing to play) — so gating Check on `played` would leave
    // no way out of the step at all.
    expect(play()).toBeDisabled();
    expect(cta()).not.toBeDisabled();
    expect(cta().textContent).toBe("Check");
  });

  it("withholds every answer signal until commit", () => {
    render(<LiaisonListenStepView step={makeStep()} onComplete={vi.fn()} onContinue={vi.fn()} />);
    // Junction notes name which gaps link and which are silent.
    expect(screen.queryByText(/Plural -s links onto a vowel/)).toBeNull();
    expect(screen.queryByText(/H aspiré blocks the link/)).toBeNull();
    // And no arc may carry a graded tone before grading.
    for (const cls of arcClasses()) {
      expect(cls).not.toMatch(/border-success|border-error/);
    }
  });

  it("after commit, marks both failure directions and explains every junction", () => {
    render(<LiaisonListenStepView step={makeStep()} onComplete={vi.fn()} onContinue={vi.fn()} />);
    tapJunction("les", "héros"); // over-applied
    fireEvent.click(cta());
    const [j0, , , j3] = arcClasses();
    expect(j0).toContain("border-success"); // the link they missed
    expect(j3).toContain("border-error"); // the link they invented
    expect(screen.getByText(/Plural -s links onto a vowel/)).toBeInTheDocument();
    // Silent junctions are taught too — over-application is half the syllabus.
    expect(screen.getByText(/H aspiré blocks the link/)).toBeInTheDocument();
    expect(screen.getByRole("alert").textContent).toContain("Not quite");
  });

  it("ignores junctionNotes keyed past the last boundary", () => {
    render(
      <LiaisonListenStepView
        step={makeStep({ junctionNotes: { 0: "real note", 9: "note about nothing" } })}
        onComplete={vi.fn()}
        onContinue={vi.fn()}
      />,
    );
    tapJunction("Les", "amis");
    fireEvent.click(cta());
    expect(screen.getByText(/real note/)).toBeInTheDocument();
    // `step.words[9]` is undefined — the row would render a headless note.
    expect(screen.queryByText(/note about nothing/)).toBeNull();
  });

  it("keeps the junction tap target above the WCAG 2.5.8 floor", () => {
    render(<LiaisonListenStepView step={makeStep()} onComplete={vi.fn()} onContinue={vi.fn()} />);
    // happy-dom has no layout engine, so the sizing classes are the only
    // proxy available here — h-7 w-8 is 28x32 CSS px, clear of the 24x24
    // floor. The real measurement is the browser pass; this is the guard that
    // stops the arc being shrunk to its visual height (8px) by accident.
    const cls = junctions()[0].className;
    expect(cls).toMatch(/\bh-7\b/);
    expect(cls).toMatch(/\bw-8\b/);
  });

  it("changes nothing about the stimulus card's box at submit", () => {
    const { container } = render(
      <LiaisonListenStepView step={makeStep()} onComplete={vi.fn()} onContinue={vi.fn()} />,
    );
    // CLAUDE.md § "Lesson UI stability rules". The card's padding and the play
    // button both used to shrink at Check to buy the notes room; with the
    // free-space split gone they were the last 14px of junction-row movement.
    const card = () => container.querySelector(".border-info\\/40")!;
    const cardCls = card().className;
    const playCls = play().className;
    fireEvent.click(cta());
    expect(card().className).toBe(cardCls);
    expect(play().className).toBe(playCls);
  });

  it("top-anchors the step instead of splitting the free space", () => {
    const { container } = render(
      <LiaisonListenStepView step={makeStep()} onComplete={vi.fn()} onContinue={vi.fn()} />,
    );
    // The junctions are the answer key after Check; a split that collapses
    // when the notes land dragged every one of them 122.6px up the screen at
    // 375x667, at the exact moment they were marked.
    expect(screen.getByText("Tap where the words link").className).not.toMatch(/\bmt-auto\b/);
    // The CTA block keeps its own `mt-auto` — that is what pins it down.
    expect(container.querySelector('[data-testid="primary-cta"]')!.className).toMatch(/\bmt-auto\b/);
  });

  it("keeps banner and CTA in one sticky bottom block", () => {
    render(<LiaisonListenStepView step={makeStep()} onComplete={vi.fn()} onContinue={vi.fn()} />);
    const block = screen.getByTestId("primary-cta");
    fireEvent.click(cta());
    // The verdict banner renders INSIDE the CTA block (index.css § "Lesson
    // action bar" sticks that block), so the button cannot be pushed by it.
    expect(block).toContainElement(screen.getByRole("alert"));
  });
});
