import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

// Mutable so the last test can dial the reached module down to simulate an
// unlocked-nothing state — `vi.doMock` can't retroactively rebind a module
// already resolved by the dynamic `import()` below.
const mockReachedModule = vi.hoisted(() => ({ value: 27 }));
vi.mock("@/features/practice/useCourseLevel", () => ({
  useCourseLevel: () => mockReachedModule.value,
}));
vi.mock("@/shared/hooks/useLangPath", () => ({
  useLang: () => "ja",
  useLangPath: () => (p: string) => `/ja/${p}`,
}));

const { StoryLibraryPage } = await import("./StoryLibraryPage");

function renderPage() {
  return render(
    <MemoryRouter>
      <StoryLibraryPage />
    </MemoryRouter>,
  );
}

beforeEach(() => localStorage.clear());

describe("StoryLibraryPage", () => {
  it("lists unlocked stories with a difficulty chip", () => {
    renderPage();
    expect(screen.getAllByText(/Starter|Easy|Steady|Stretch|Challenge/).length).toBeGreaterThan(0);
  });

  it("paginates rather than dumping every story", () => {
    renderPage();
    expect(screen.getByRole("navigation", { name: /stories/i })).toBeTruthy();
  });

  it("marks unread stories and filters to them", () => {
    renderPage();
    // SegmentedControl is a radiogroup of radio cells, not plain buttons.
    fireEvent.click(screen.getByRole("radio", { name: /unread/i }));
    expect(screen.getAllByRole("link").length).toBeGreaterThan(0);
  });

  it("shows an empty state when nothing is unlocked", () => {
    mockReachedModule.value = 1;
    renderPage();
    // Module 1 unlocks nothing — every story is m3+.
    expect(screen.getByText(/Nothing to read just yet/i)).toBeTruthy();
  });
});
