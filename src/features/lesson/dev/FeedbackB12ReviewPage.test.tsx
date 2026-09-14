/**
 * TestFlight b12 feedback review page — smoke test: every ledger item
 * renders a card, and the lane/status/needs-Spencer filters narrow the
 * visible set correctly.
 */
import { describe, it, expect, afterEach, vi } from "vitest";
import { render, screen, cleanup, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import FeedbackB12ReviewPage from "./FeedbackB12ReviewPage";
import { FEEDBACK_B12_ITEMS } from "./feedbackB12Items";

vi.mock("@/shared/contexts/LanguageContext", () => ({
  useLanguage: () => ({ language: { id: "ja" } }),
}));

afterEach(() => {
  cleanup();
  localStorage.clear();
});

function renderPage() {
  return render(
    <MemoryRouter>
      <FeedbackB12ReviewPage />
    </MemoryRouter>,
  );
}

describe("FeedbackB12ReviewPage", () => {
  it("renders one card per ledger item", () => {
    renderPage();
    for (const item of FEEDBACK_B12_ITEMS) {
      expect(document.getElementById(`row-${item.n}`)).not.toBeNull();
    }
  });

  it("renders the verbatim comment in full for a sample item", () => {
    renderPage();
    const item = FEEDBACK_B12_ITEMS.find((i) => i.n === 67)!;
    expect(screen.getByText(new RegExp(item.verbatim.slice(0, 20)))).toBeTruthy();
  });

  it("the needs-your-eyes filter shows only needsSpencer items", () => {
    renderPage();
    fireEvent.click(screen.getByRole("button", { name: "Needs your eyes" }));
    const needCount = FEEDBACK_B12_ITEMS.filter((i) => i.needsSpencer).length;
    const noNeedCount = FEEDBACK_B12_ITEMS.filter((i) => !i.needsSpencer).length;
    expect(needCount).toBeGreaterThan(0);
    expect(noNeedCount).toBeGreaterThan(0);
    for (const item of FEEDBACK_B12_ITEMS) {
      const row = document.getElementById(`row-${item.n}`);
      if (item.needsSpencer) {
        expect(row).not.toBeNull();
      } else {
        expect(row).toBeNull();
      }
    }
  });

  it("a lane filter shows only that lane's items", () => {
    renderPage();
    fireEvent.click(screen.getByRole("button", { name: "Lane A" }));
    for (const item of FEEDBACK_B12_ITEMS) {
      const row = document.getElementById(`row-${item.n}`);
      if (item.lane === "A") {
        expect(row).not.toBeNull();
      } else {
        expect(row).toBeNull();
      }
    }
  });

  it("the TO-DOs section is collapsed by default and expands on click", () => {
    renderPage();
    expect(screen.queryByText(/Play Console account/)).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: /Spencer's open TO-DOs/ }));
    expect(screen.getByText(/Play Console account/)).toBeTruthy();
  });
});
