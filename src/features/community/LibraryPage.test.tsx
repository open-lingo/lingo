/**
 * LibraryPage tests — the personal community area (subscribed + my decks) is a
 * separate, URL-driven tabbed surface distinct from the discovery home.
 */
import { describe, it, expect, vi } from "vitest";
import type { ReactNode } from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { I18nextProvider } from "react-i18next";
import i18n from "@/shared/i18n/i18n";

vi.mock("@/shared/contexts/LanguageContext", () => ({
  useLanguage: () => ({ language: { id: "ko", name: "Korean", flag: "kr" }, isLoading: false }),
}));

vi.mock("./SubscribedPage", () => ({
  SubscribedBody: () => <div data-testid="subscribed-body">Subscribed body</div>,
}));
vi.mock("./MyDecksPage", () => ({
  MyDecksBody: () => <div data-testid="mydecks-body">My decks body</div>,
}));

import { LibraryPage } from "./LibraryPage";

function wrap(initialPath: string, ui: ReactNode) {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <I18nextProvider i18n={i18n}>{ui}</I18nextProvider>
    </MemoryRouter>,
  );
}

describe("LibraryPage", () => {
  it("defaults to the subscribed tab (no ?tab in URL)", () => {
    wrap("/ko/community/library", <LibraryPage />);
    expect(screen.getByTestId("subscribed-body")).toBeInTheDocument();
    expect(screen.queryByTestId("mydecks-body")).toBeNull();
  });

  it("renders the my-decks tab from ?tab=mine", () => {
    wrap("/ko/community/library?tab=mine", <LibraryPage />);
    expect(screen.getByTestId("mydecks-body")).toBeInTheDocument();
    expect(screen.queryByTestId("subscribed-body")).toBeNull();
  });

  it("switches tabs on click", () => {
    wrap("/ko/community/library", <LibraryPage />);
    expect(screen.getByTestId("subscribed-body")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("tab", { name: /My decks/i }));
    expect(screen.getByTestId("mydecks-body")).toBeInTheDocument();
  });
});
