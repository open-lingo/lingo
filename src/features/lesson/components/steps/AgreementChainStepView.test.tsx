/**
 * AgreementChainStepView contract. The step's pedagogical claim is that four
 * agreements are ONE decision, so grading is all-or-nothing — but each link
 * still reports individually, because "the chain is wrong" without saying which
 * link broke is not a correction.
 *
 * Two of these guard layout fixes that only show up in a browser:
 *   · every slot reserves the width of its WIDEST option via invisible ghosts,
 *     so the sentence cannot reflow while it is being read and answered (this
 *     replaced a character-count estimate that under-sized wide glyphs);
 *   · French sets no space before a full stop, and the row's own `gap-x` prints
 *     one anyway — «assises .».
 * i18n + TTS are mocked, same as AgreementClozeStepView.test.
 */
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import type { AgreementChainStep } from "../../types";

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
vi.mock("@/shared/tts", () => ({
  playJaAudio: vi.fn(),
  getTtsUrl: vi.fn(() => null),
}));

import { AgreementChainStepView } from "./AgreementChainStepView";

afterEach(() => {
  cleanup();
});

function makeStep(): AgreementChainStep {
  return {
    id: "ach-test",
    type: "agreement_chain",
    head: {
      surface: "les chaises",
      meaningEn: "the chairs",
      featureLabel: "feminine plural",
    },
    tokens: [
      { kind: "fixed", text: "Les chaises" },
      {
        kind: "slot",
        id: "adj",
        options: ["vert", "verte", "verts", "vertes"],
        correct: "vertes",
        roleLabel: "feminine plural adjective",
      },
      { kind: "fixed", text: "sont" },
      {
        kind: "slot",
        id: "pp",
        options: ["assis", "assise", "assises"],
        correct: "assises",
        roleLabel: "feminine plural past participle",
      },
      { kind: "fixed", text: "." },
    ],
    meaningEn: "The green chairs are seated.",
    ruleNote: "The head noun's gender and number propagate to every word.",
  };
}

const slot = (role: string) =>
  screen.getByRole("button", { name: new RegExp(`^Slot: ${role}`) });
const option = (text: string) => screen.getByRole("button", { name: text });
const check = () => screen.getByRole("button", { name: "Check" });

/** Fills the two slots in order; the view auto-targets the first unfilled one. */
function fill(adj: string, pp: string) {
  fireEvent.click(option(adj));
  fireEvent.click(option(pp));
}

describe("AgreementChainStepView", () => {
  it("keeps Check disabled until every link is filled", () => {
    render(<AgreementChainStepView step={makeStep()} onComplete={vi.fn()} onContinue={vi.fn()} />);
    expect(check()).toBeDisabled();
    fireEvent.click(option("vertes"));
    expect(check()).toBeDisabled(); // one link still empty
    fireEvent.click(option("assises"));
    expect(check()).not.toBeDisabled();
  });

  it("grades the chain all-or-nothing — one broken link fails the step", () => {
    const onComplete = vi.fn();
    render(<AgreementChainStepView step={makeStep()} onComplete={onComplete} onContinue={vi.fn()} />);
    fill("vertes", "assise"); // second link wrong
    fireEvent.click(check());
    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(onComplete).toHaveBeenCalledWith("ach-test", false);
  });

  it("grades a fully correct chain as correct", () => {
    const onComplete = vi.fn();
    render(<AgreementChainStepView step={makeStep()} onComplete={onComplete} onContinue={vi.fn()} />);
    fill("vertes", "assises");
    fireEvent.click(check());
    expect(onComplete).toHaveBeenCalledWith("ach-test", true);
  });

  it("names every link and its role after commit, so a failure says WHICH link broke", () => {
    render(<AgreementChainStepView step={makeStep()} onComplete={vi.fn()} onContinue={vi.fn()} />);
    // Role labels are a post-commit reveal — pre-commit they would name the grammar.
    expect(screen.queryByText(/feminine plural adjective/)).toBeNull();
    fill("vertes", "assise");
    fireEvent.click(check());
    expect(screen.getByText(/feminine plural adjective/)).toBeInTheDocument();
    expect(screen.getByText(/feminine plural past participle/)).toBeInTheDocument();
    expect(screen.getByText("The green chairs are seated.")).toBeInTheDocument();
  });

  it("lets a learner go back and change an already-filled link", () => {
    const onComplete = vi.fn();
    render(<AgreementChainStepView step={makeStep()} onComplete={onComplete} onContinue={vi.fn()} />);
    fill("verte", "assises"); // first link wrong
    fireEvent.click(slot("feminine plural adjective")); // re-target it
    fireEvent.click(option("vertes"));
    fireEvent.click(check());
    expect(onComplete).toHaveBeenCalledWith("ach-test", true);
  });

  it("reserves each slot's width with an invisible ghost of EVERY option", () => {
    const { container } = render(
      <AgreementChainStepView step={makeStep()} onComplete={vi.fn()} onContinue={vi.fn()} />,
    );
    const adjSlot = slot("feminine plural adjective");
    const ghosts = adjSlot.querySelectorAll("span[aria-hidden].invisible");
    // One ghost per option — the widest one is what sets the box.
    expect(ghosts).toHaveLength(4);
    expect([...ghosts].map((g) => g.textContent)).toEqual([
      "vert",
      "verte",
      "verts",
      "vertes",
    ]);
    // Ghosts must not be readable, or the answer is on screen.
    for (const g of ghosts) expect(g.className).toContain("invisible");
    expect(container.textContent).toContain("Les chaises");
  });

  it("pulls closing punctuation back onto the word, so French does not read «assises .»", () => {
    render(<AgreementChainStepView step={makeStep()} onComplete={vi.fn()} onContinue={vi.fn()} />);
    const period = screen.getByText(".", { selector: "span" });
    // The flex row's gap-x would otherwise print a space before it.
    expect(period.className).toMatch(/-ml-/);
  });
});
