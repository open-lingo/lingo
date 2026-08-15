/**
 * Review queue (/ja/qa/review) contract: every open catalog entry renders
 * with its mandatory example, and Spencer's verdict + answer persist to
 * localStorage — the page IS the decision record until an agent picks the
 * mirror up, so losing an answer is losing the decision.
 */
import { describe, it, expect, afterEach, beforeEach, vi } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import ReviewQueuePage from "./ReviewQueuePage";
import { REVIEW_ENTRIES } from "./reviewQueue";

vi.mock("@/shared/contexts/LanguageContext", () => ({
  useLanguage: () => ({ language: { id: "ja" } }),
}));

const STORAGE_KEY = "lingo:review-queue:v1";

const renderPage = () =>
  render(
    <MemoryRouter>
      <ReviewQueuePage />
    </MemoryRouter>,
  );

beforeEach(() => localStorage.clear());
afterEach(cleanup);

describe("ReviewQueuePage", () => {
  it("renders every open entry with its id, title, and example", () => {
    const { container } = renderPage();
    for (const e of REVIEW_ENTRIES.filter((x) => !x.resolved)) {
      const card = container.querySelector(`#entry-${e.id}`);
      expect(card, `${e.id} card`).toBeTruthy();
      expect(card!.textContent).toContain(e.title);
      expect(card!.textContent).toContain("Example:");
    }
  });

  it("verdict click + typed answer persist to localStorage", () => {
    const { container } = renderPage();
    const first = REVIEW_ENTRIES.filter((x) => !x.resolved)[0];
    const card = container.querySelector(`#entry-${first.id}`)!;
    fireEvent.click(
      Array.from(card.querySelectorAll("button")).find((b) =>
        b.textContent?.includes("yes / go"),
      )!,
    );
    fireEvent.change(card.querySelector("textarea")!, {
      target: { value: "ship it after R2 rulings" },
    });
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY)!);
    expect(saved.items[first.id].verdict).toBe("yes");
    expect(saved.items[first.id].note).toBe("ship it after R2 rulings");
  });

  it("renders the agent read-me collapsed at the top", () => {
    renderPage();
    expect(
      screen.getByText(/how agents write entries here/i),
    ).toBeTruthy();
  });
});
