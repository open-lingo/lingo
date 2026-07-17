/**
 * QuestsCardBody — merged daily/weekly section renders one compact row per
 * spotlight, the combined "+N more quests" hover preview lists the hidden
 * quests, and the removed per-bucket kickers stay gone. Data hooks are
 * mocked so the test exercises the card's rendering logic only.
 */
import { describe, it, expect, afterEach, vi } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { QuestsCardBody } from "./QuestsCard";

const quest = (id: string, type: "daily" | "weekly", title: string) => ({
  id,
  type,
  title,
  status: "active" as const,
  progress: { current: 1, target: 5, unit: "cards" },
  rewards: { lingots: 5, xp: 10 },
});

vi.mock("../useQuests", () => ({
  useQuests: () => ({
    quests: [
      quest("d1", "daily", "Earn 50 XP today"),
      quest("d2", "daily", "Review 15 flashcards"),
      quest("d3", "daily", "Practice speaking"),
      quest("w1", "weekly", "Finish 5 lessons this week"),
    ],
    summary: { badgeCount: 0 },
    claim: () => {},
  }),
}));

vi.mock("../useQuestsModalUrl", () => ({
  useQuestsModalUrl: () => ({ isOpen: false, open: () => {}, close: () => {} }),
}));

vi.mock("./QuestsPanel", () => ({ QuestsPanel: () => null }));

afterEach(() => {
  cleanup();
});

function renderCard() {
  return render(
    <QuestsCardBody sideQuests={[]} isSideQuestUnlocked={() => true} />,
  );
}

describe("QuestsCardBody", () => {
  it("renders the merged daily/weekly section with both spotlight rows", () => {
    renderCard();
    expect(screen.getByText(/daily\/weekly quests/i)).toBeTruthy();
    expect(screen.getByText("Earn 50 XP today")).toBeTruthy();
    expect(screen.getByText("Finish 5 lessons this week")).toBeTruthy();
    // per-bucket kickers are gone
    expect(screen.queryByText(/^daily$/i)).toBeNull();
    expect(screen.queryByText(/^weekly$/i)).toBeNull();
  });

  it("shows the combined +N more affordance listing the hidden quests", () => {
    const { container } = renderCard();
    expect(container.textContent).toContain("more quests");
    // hidden quests are listed in the hover popover with their fractions
    expect(screen.getByText("Review 15 flashcards")).toBeTruthy();
    expect(screen.getByText("Practice speaking")).toBeTruthy();
    expect(screen.getAllByText("1/5 cards").length).toBeGreaterThan(0);
  });
});
