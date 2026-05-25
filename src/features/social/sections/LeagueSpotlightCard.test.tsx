import { describe, it, expect, afterEach, vi } from "vitest";
import { render, screen, cleanup, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { LeagueSpotlightCard } from "./LeagueSpotlightCard";

// Stub i18n: return default string passed as 2nd arg (or key when missing).
vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (
      key: string,
      defOrOpts?:
        | string
        | ({ defaultValue?: string } & Record<string, unknown>),
    ) => {
      if (typeof defOrOpts === "string") return defOrOpts;
      if (defOrOpts && typeof defOrOpts === "object" && defOrOpts.defaultValue) {
        return defOrOpts.defaultValue;
      }
      return key;
    },
  }),
}));

afterEach(() => cleanup());

function renderWithRouter(ui: React.ReactNode) {
  return render(<MemoryRouter>{ui}</MemoryRouter>);
}

describe("LeagueSpotlightCard", () => {
  it("renders the league name and the user's rank once data resolves", async () => {
    renderWithRouter(<LeagueSpotlightCard />);
    // While the mock fetch is pending, the skeleton renders.
    // After the short delay the league text shows.
    await waitFor(() => {
      expect(screen.getByText(/Sapphire League/i)).toBeInTheDocument();
    });
    // Current user is row #5 in the mock → "#5" rank pill.
    expect(screen.getByText(/^#5$/)).toBeInTheDocument();
  });

  it("includes the podium top-3 names by default (non-compact)", async () => {
    renderWithRouter(<LeagueSpotlightCard />);
    await waitFor(() => {
      // Top 3 mock users: Priya, Kenji, Noor.
      expect(screen.getByText("Priya")).toBeInTheDocument();
      expect(screen.getByText("Kenji")).toBeInTheDocument();
      expect(screen.getByText("Noor")).toBeInTheDocument();
    });
  });

  it("shows the 'see full leaderboard' CTA when scrollToId is provided", async () => {
    renderWithRouter(<LeagueSpotlightCard scrollToId="leaderboards" />);
    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: /see full leaderboard/i }),
      ).toBeInTheDocument();
    });
  });
});
