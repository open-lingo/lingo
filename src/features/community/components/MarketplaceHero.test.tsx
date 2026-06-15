/**
 * MarketplaceHero tests — the marketplace intro renders its title, search, quick
 * pills, and the real catalog metrics as a compact stat stack. `learners` is
 * optional and only rendered when supplied.
 */
import { describe, it, expect, vi } from "vitest";
import type { ReactNode } from "react";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { I18nextProvider } from "react-i18next";
import i18n from "@/shared/i18n/i18n";

vi.mock("@/shared/hooks/useLangPath", () => ({
  useLangPath: () => (path: string) => `/ko/${path.replace(/^\//, "")}`,
}));

import { MarketplaceHero } from "./MarketplaceHero";

function wrap(ui: ReactNode) {
  return render(
    <MemoryRouter>
      <I18nextProvider i18n={i18n}>{ui}</I18nextProvider>
    </MemoryRouter>,
  );
}

describe("MarketplaceHero", () => {
  it("renders the title, search bar, and quick pills", () => {
    wrap(<MarketplaceHero metrics={{ decks: 12, creators: 4 }} />);
    expect(screen.getByRole("heading", { level: 1 })).toBeInTheDocument();
    expect(screen.getByRole("searchbox")).toBeInTheDocument();
    expect(screen.getByText(/Trending/i)).toBeInTheDocument();
  });

  it("renders the decks and creators metrics", () => {
    wrap(<MarketplaceHero metrics={{ decks: 12, creators: 4 }} />);
    expect(screen.getByText("12")).toBeInTheDocument();
    expect(screen.getByText("4")).toBeInTheDocument();
    // Label appears twice (visible span + sr-only <dt>).
    expect(screen.getAllByText("decks").length).toBeGreaterThan(0);
    expect(screen.getAllByText("creators").length).toBeGreaterThan(0);
  });

  it("only renders the learners metric when provided", () => {
    const { rerender } = wrap(
      <MarketplaceHero metrics={{ decks: 12, creators: 4 }} />,
    );
    expect(screen.queryByText("99")).not.toBeInTheDocument();

    rerender(
      <MemoryRouter>
        <I18nextProvider i18n={i18n}>
          <MarketplaceHero metrics={{ decks: 12, creators: 4, learners: 99 }} />
        </I18nextProvider>
      </MemoryRouter>,
    );
    expect(screen.getByText("99")).toBeInTheDocument();
  });
});
