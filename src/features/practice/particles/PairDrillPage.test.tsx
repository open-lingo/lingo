import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { QuestionCard } from "./PairDrillPage";
import type { PairQuestion } from "./pairDrill";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, opts?: Record<string, unknown>) => {
      const s = opts && typeof opts.defaultValue === "string" ? opts.defaultValue : key;
      return s.replace(/\{\{(\w+)\}\}/g, (_: string, k: string) => String(opts?.[k] ?? ""));
    },
  }),
}));
vi.mock("@/features/dictionary/TappableText", () => ({
  TappableText: ({ text }: { text: string }) => <span data-testid="tappable">{text}</span>,
}));

const q: PairQuestion = {
  id: "s1",
  pairId: "kara-made",
  text: "くじから ごじまで はたらく",
  translation: "I work from nine to five",
  segments: ["くじ", " ごじ", " はたらく"],
  answers: ["から", "まで"],
  options: ["に", "まで", "から"],
};

function pickAndCheck(first: string, second: string) {
  const bank = screen.getByRole("group", { name: "Particle options" });
  fireEvent.click(bank.querySelector(`button:nth-child(${q.options.indexOf(first) + 1})`)!);
  fireEvent.click(bank.querySelector(`button:nth-child(${q.options.indexOf(second) + 1})`)!);
  fireEvent.click(screen.getByRole("button", { name: "Check" }));
}

describe("QuestionCard — graded render", () => {
  it("a wrong blank shows the learner's particle struck and the correct one beside it, plus the Answer line", () => {
    const onGraded = vi.fn();
    render(<QuestionCard question={q} langId="ja" isLast={false} onGraded={onGraded} onNext={() => {}} />);
    pickAndCheck("まで", "から"); // swapped

    expect(onGraded).toHaveBeenCalledWith({ blanks: [false, false], correct: false });
    expect(screen.getByTestId("blank-1-picked").tagName).toBe("S");
    expect(screen.getByTestId("blank-1-picked")).toHaveTextContent("まで");
    expect(screen.getByTestId("blank-1-answer")).toHaveTextContent("から");
    expect(screen.getByTestId("blank-2-picked")).toHaveTextContent("から");
    expect(screen.getByTestId("blank-2-answer")).toHaveTextContent("まで");
    expect(screen.getByText("Answer: から … まで")).toBeInTheDocument();
    // Bank stays mounted but disabled; CTA swapped to Next in place.
    for (const b of screen.getByRole("group", { name: "Particle options" }).querySelectorAll("button")) {
      expect(b).toBeDisabled();
    }
    expect(screen.getByRole("button", { name: /Next/ })).toBeInTheDocument();
  });

  it("a single slip marks only that blank; the right blank keeps its particle plain", () => {
    render(<QuestionCard question={q} langId="ja" isLast onGraded={() => {}} onNext={() => {}} />);
    pickAndCheck("から", "に");
    expect(screen.queryByTestId("blank-1-picked")).toBeNull();
    expect(screen.getByTestId("blank-1")).toHaveTextContent("から");
    expect(screen.getByTestId("blank-2-picked")).toHaveTextContent("に");
    expect(screen.getByTestId("blank-2-answer")).toHaveTextContent("まで");
    expect(screen.getByRole("button", { name: /Finish/ })).toBeInTheDocument();
  });

  it("both right shows no struck text and the success line", () => {
    render(<QuestionCard question={q} langId="ja" isLast={false} onGraded={() => {}} onNext={() => {}} />);
    pickAndCheck("から", "まで");
    expect(screen.queryByTestId("blank-1-picked")).toBeNull();
    expect(screen.queryByTestId("blank-2-picked")).toBeNull();
    expect(screen.getByText("Both right.")).toBeInTheDocument();
  });
});
