import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, act, cleanup, fireEvent } from "@testing-library/react";
import { ExplainButton } from "./ExplainButton";

afterEach(() => {
  cleanup();
});

describe("ExplainButton", () => {
  it("renders nothing when explanation is missing", () => {
    const { container } = render(
      <ExplainButton explanation={undefined} hasSubmittedWrong={false} />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("is hidden pre-commit with no dwell elapsed", () => {
    const { container } = render(
      <ExplainButton explanation="why this works" hasSubmittedWrong={false} />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("appears after a wrong submit", () => {
    render(<ExplainButton explanation="why this works" hasSubmittedWrong={true} />);
    expect(
      screen.getByRole("button", { name: /explain this question/i }),
    ).toBeInTheDocument();
  });

  it("appears after 15 seconds of dwell", () => {
    vi.useFakeTimers();
    try {
      render(
        <ExplainButton explanation="why this works" hasSubmittedWrong={false} />,
      );
      expect(
        screen.queryByRole("button", { name: /explain this question/i }),
      ).not.toBeInTheDocument();
      act(() => {
        vi.advanceTimersByTime(15_000);
      });
      expect(
        screen.getByRole("button", { name: /explain this question/i }),
      ).toBeInTheDocument();
    } finally {
      vi.useRealTimers();
    }
  });

  it("toggles the explanation panel open and closed on click", () => {
    render(<ExplainButton explanation="why this works" hasSubmittedWrong={true} />);
    const btn = screen.getByRole("button", { name: /explain this question/i });
    expect(screen.queryByText(/why this works/i)).not.toBeInTheDocument();
    fireEvent.click(btn);
    expect(screen.getByText(/why this works/i)).toBeInTheDocument();
    fireEvent.click(btn);
    expect(screen.queryByText(/why this works/i)).not.toBeInTheDocument();
  });
});
