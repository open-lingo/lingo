import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import type { StoryQuestion } from "@/features/practice/content";
import { StoryQuiz } from "./StoryQuiz";

const QUESTIONS: StoryQuestion[] = [
  {
    id: "q1",
    kind: "gist",
    prompt: "どれが はなしに ありますか？",
    options: ["トムです。", "ミカです。"],
    answer: "トムです。",
  },
  {
    id: "q2",
    kind: "detail",
    prompt: "どれが はなしに ありますか？",
    options: ["がくせいです。", "せんせいです。"],
    answer: "がくせいです。",
  },
];

function renderQuiz(onComplete = vi.fn()) {
  render(
    <StoryQuiz
      title="About me"
      questions={QUESTIONS}
      langId="ja"
      onReadAgain={vi.fn()}
      onComplete={onComplete}
    />,
  );
  return onComplete;
}

describe("StoryQuiz", () => {
  it("holds the finish button until every question is answered", () => {
    renderQuiz();
    const finish = screen.getByRole("button", { name: /See how you did/i });
    expect(finish).toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: "トムです。" }));
    expect(finish).toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: "がくせいです。" }));
    expect(finish).not.toBeDisabled();
  });

  it("reports the score, counting only the answers that matched", () => {
    const onComplete = renderQuiz();
    fireEvent.click(screen.getByRole("button", { name: "ミカです。" }));
    fireEvent.click(screen.getByRole("button", { name: "がくせいです。" }));
    fireEvent.click(screen.getByRole("button", { name: /See how you did/i }));
    expect(onComplete).toHaveBeenCalledWith({ correct: 1, total: 2 });
  });

  it("locks a question after the first pick so a wrong answer can't be retried", () => {
    const onComplete = renderQuiz();
    fireEvent.click(screen.getByRole("button", { name: "ミカです。" }));
    // Both options of q1 are now disabled — the correct one included.
    fireEvent.click(screen.getByRole("button", { name: "トムです。" }));
    fireEvent.click(screen.getByRole("button", { name: "がくせいです。" }));
    fireEvent.click(screen.getByRole("button", { name: /See how you did/i }));
    expect(onComplete).toHaveBeenCalledWith({ correct: 1, total: 2 });
  });
});
