/**
 * GenderSortStepView contract.
 *
 * The step teaches LEXICAL gender, so the article is the answer and must never
 * appear next to a noun before Check — not on the chip, not as a gloss. Half
 * these tests are that boundary; the other half guard the tap-to-place
 * mechanics, which are where this view's real bugs lived:
 *   · the drop target is a SIBLING of the chips, not their parent. It used to
 *     wrap them, which is invalid HTML and made a tap near the middle of a
 *     filled bucket eject a placed word instead of dropping the held one;
 *   · tapping a placed chip means "drop here" when the hand is full and
 *     "take it back" only when the hand is empty;
 *   · the tray and the coach line RETIRE at submit — together they were 106px
 *     of a 485px short-phone stage spent on controls that can no longer do
 *     anything.
 * i18n is mocked (i18next does not spin up in happy-dom), same as
 * SilentLetterStepView.test. This view imports no TTS.
 */
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup, within } from "@testing-library/react";
import type { GenderSortStep } from "../../types";

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

import { GenderSortStepView } from "./GenderSortStepView";

afterEach(() => {
  cleanup();
});

/** Three nouns, one of them a liar (`problema`) — the type's doc comment says
 *  a set of clean -o/-a nouns is a spelling drill anyone can win. */
function makeStep(): GenderSortStep {
  return {
    id: "gs-test",
    type: "gender_sort",
    prompt: "Which article does each word take?",
    buckets: [
      { id: "m", label: "el" },
      { id: "f", label: "la" },
    ],
    items: [
      {
        id: "g1",
        surface: "problema",
        bucketId: "m",
        meaningEn: "problem",
        note: "-ma from Greek",
      },
      { id: "g2", surface: "casa", bucketId: "f", meaningEn: "house" },
      { id: "g3", surface: "libro", bucketId: "m", meaningEn: "book" },
    ],
    endingRule: "-o is usually masculine, -a usually feminine — but the ending is a hint.",
  };
}

const cta = () => screen.getByTestId("primary-cta").querySelector("button")!;
const word = (surface: string) => screen.getByRole("button", { name: surface });
const bucket = (label: string) =>
  screen.getByRole("button", { name: `Put in ${label}` });
/** The bucket PANEL — the drop button's parent, i.e. the box chips live in. */
const panel = (label: string) => bucket(label).parentElement!;

/** Text of the post-commit teaching list, joined. Read as one string because
 *  each row mixes a <strong> with plain text, so element-scoped matchers would
 *  need to know which half a phrase fell in. */
const revealText = () =>
  [...document.querySelectorAll("li")].map((li) => li.textContent).join(" | ");

/** Tap the word, then tap the bucket: the whole gesture, once. */
function sort(surface: string, label: string) {
  fireEvent.click(word(surface));
  fireEvent.click(bucket(label));
}

function sortAllCorrectly() {
  sort("problema", "el");
  sort("casa", "la");
  sort("libro", "el");
}

describe("GenderSortStepView", () => {
  it("keeps Check disabled until every word is off the tray", () => {
    render(<GenderSortStepView step={makeStep()} onComplete={vi.fn()} onContinue={vi.fn()} />);
    expect(cta()).toBeDisabled();
    sort("problema", "el");
    sort("casa", "la");
    expect(cta()).toBeDisabled(); // `libro` still in the tray
    sort("libro", "el");
    expect(cta()).not.toBeDisabled();
  });

  it("grades the board all-or-nothing — one misfiled word fails the step", () => {
    const onComplete = vi.fn();
    render(<GenderSortStepView step={makeStep()} onComplete={onComplete} onContinue={vi.fn()} />);
    sort("problema", "la"); // the liar, filed by its ending
    sort("casa", "la");
    sort("libro", "el");
    fireEvent.click(cta());
    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(onComplete).toHaveBeenCalledWith("gs-test", false);
  });

  it("grades a clean board correct", () => {
    const onComplete = vi.fn();
    render(<GenderSortStepView step={makeStep()} onComplete={onComplete} onContinue={vi.fn()} />);
    sortAllCorrectly();
    fireEvent.click(cta());
    expect(onComplete).toHaveBeenCalledWith("gs-test", true);
  });

  it("grades once and then hands the CTA to Continue", () => {
    const onComplete = vi.fn();
    const onContinue = vi.fn();
    render(
      <GenderSortStepView step={makeStep()} onComplete={onComplete} onContinue={onContinue} />,
    );
    sortAllCorrectly();
    fireEvent.click(cta());
    fireEvent.click(cta());
    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(onContinue).toHaveBeenCalledTimes(1);
  });

  it("moves a word from the tray into the bucket it was dropped in", () => {
    render(<GenderSortStepView step={makeStep()} onComplete={vi.fn()} onContinue={vi.fn()} />);
    sort("casa", "la");
    expect(within(panel("la")).getByRole("button", { name: "casa" })).toBeInTheDocument();
    expect(within(panel("el")).queryByRole("button", { name: "casa" })).toBeNull();
  });

  it("takes a placed word back when the hand is EMPTY", () => {
    render(<GenderSortStepView step={makeStep()} onComplete={vi.fn()} onContinue={vi.fn()} />);
    sort("casa", "la");
    fireEvent.click(word("casa")); // nothing held -> eject
    expect(within(panel("la")).queryByRole("button", { name: "casa" })).toBeNull();
    expect(cta()).toBeDisabled(); // back in the tray, so the board is incomplete
  });

  it("drops the HELD word when a placed chip is tapped, instead of ejecting that chip", () => {
    render(<GenderSortStepView step={makeStep()} onComplete={vi.fn()} onContinue={vi.fn()} />);
    sort("casa", "la");
    fireEvent.click(word("libro")); // hand is now full
    fireEvent.click(word("casa")); // aiming at the «la» bucket, chip in the way
    // The tap was aimed at a bucket. Ejecting `casa` here is the bug this
    // behaviour replaced — a fat finger near the middle of a filled bucket.
    expect(within(panel("la")).getByRole("button", { name: "casa" })).toBeInTheDocument();
    expect(within(panel("la")).getByRole("button", { name: "libro" })).toBeInTheDocument();
  });

  it("keeps the drop target a sibling of the chips, never their parent", () => {
    render(<GenderSortStepView step={makeStep()} onComplete={vi.fn()} onContinue={vi.fn()} />);
    sort("casa", "la");
    // Interactive content inside a <button> is invalid HTML, and it is what
    // made the whole panel swallow chip taps.
    expect(bucket("la").querySelectorAll("button")).toHaveLength(0);
    expect(bucket("la").contains(word("casa"))).toBe(false);
  });

  it("never prints a noun next to its article before Check", () => {
    render(<GenderSortStepView step={makeStep()} onComplete={vi.fn()} onContinue={vi.fn()} />);
    sort("problema", "el");
    // The chip stays the BARE noun even sitting in a bucket — the bucket label
    // is a claim the learner made, not one the view repeats onto the word.
    expect(within(panel("el")).getByRole("button", { name: "problema" }).textContent).toBe(
      "problema",
    );
    expect(document.body.textContent).not.toMatch(/el problema/);
  });

  it("withholds the meanings and the ending rule until commit", () => {
    render(<GenderSortStepView step={makeStep()} onComplete={vi.fn()} onContinue={vi.fn()} />);
    // An English gloss beside every noun turns gender recall into reading.
    // `\bproblem\b` deliberately does NOT match the noun «problema».
    expect(document.body.textContent).not.toMatch(/\bproblem\b/);
    expect(document.body.textContent).not.toMatch(/house/);
    expect(screen.queryByText(/-o is usually masculine/)).toBeNull();
    expect(document.body.textContent).not.toMatch(/-ma from Greek/);
    sortAllCorrectly();
    fireEvent.click(cta());
    expect(screen.getByText(/-o is usually masculine/)).toBeInTheDocument();
    expect(revealText()).toMatch(/\bproblem\b/);
    expect(revealText()).toMatch(/house/);
    expect(revealText()).toMatch(/-ma from Greek/);
  });

  it("names the article for every word in the reveal, right and wrong alike", () => {
    render(<GenderSortStepView step={makeStep()} onComplete={vi.fn()} onContinue={vi.fn()} />);
    sort("problema", "la");
    sort("casa", "la");
    sort("libro", "el");
    fireEvent.click(cta());
    // «you got 2 of 3» with no idea which is not a correction, so the board
    // marks each word individually…
    expect(within(panel("la")).getByRole("button", { name: "problema" }).className).toMatch(
      /border-error/,
    );
    expect(within(panel("la")).getByRole("button", { name: "casa" }).className).toMatch(
      /border-success/,
    );
    // …and the reveal spells the right article out, including for the one
    // they missed.
    expect(revealText()).toContain("el problema");
    expect(revealText()).toContain("la casa");
  });

  it("retires the tray and the coach line at submit", () => {
    render(<GenderSortStepView step={makeStep()} onComplete={vi.fn()} onContinue={vi.fn()} />);
    expect(screen.getByText("Tap a word, then tap its article")).toBeInTheDocument();
    sortAllCorrectly();
    expect(screen.getByText("Everything is placed.")).toBeInTheDocument();
    fireEvent.click(cta());
    // Nothing can be picked up any more; both boxes were pure height on the
    // viewport with the least of it.
    expect(screen.queryByText("Everything is placed.")).toBeNull();
    expect(screen.queryByText("Tap a word, then tap its article")).toBeNull();
  });

  it("reserves the coach row so switching states cannot reflow the board mid-tap", () => {
    render(<GenderSortStepView step={makeStep()} onComplete={vi.fn()} onContinue={vi.fn()} />);
    const coach = screen.getByText("Tap a word, then tap its article");
    expect(coach.className).toMatch(/min-h-\[1\.125rem\]/);
    fireEvent.click(word("casa"));
    // Same element, new text — so the row height cannot change under the finger.
    expect(coach.textContent).toBe("Now tap el or la");
  });

  it("freezes every control after Check", () => {
    render(<GenderSortStepView step={makeStep()} onComplete={vi.fn()} onContinue={vi.fn()} />);
    sortAllCorrectly();
    fireEvent.click(cta());
    expect(bucket("el")).toBeDisabled();
    expect(word("casa")).toBeDisabled();
  });

  it("keeps the two buckets side by side at every width", () => {
    render(<GenderSortStepView step={makeStep()} onComplete={vi.fn()} onContinue={vi.fn()} />);
    // The point of the step is that there are exactly TWO classes; a grid that
    // stacks on a narrow phone hides that.
    const grid = panel("el").parentElement!;
    expect(grid.className).toMatch(/\bgrid-cols-2\b/);
    expect(grid.className).not.toMatch(/grid-cols-1/);
  });

  it("keeps banner and CTA in one sticky bottom block", () => {
    render(<GenderSortStepView step={makeStep()} onComplete={vi.fn()} onContinue={vi.fn()} />);
    sort("problema", "la");
    sort("casa", "la");
    sort("libro", "el");
    fireEvent.click(cta());
    // index.css § "Lesson action bar" sticks `primary-cta`; the banner must be
    // inside it or a miss pushes Continue below the fold (measured 248px).
    expect(screen.getByTestId("primary-cta")).toContainElement(screen.getByRole("alert"));
  });
});
