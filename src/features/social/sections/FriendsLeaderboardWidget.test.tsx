import { describe, it, expect, afterEach, vi } from "vitest";
import { render, screen, cleanup, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { FriendsLeaderboardWidget } from "./FriendsLeaderboardWidget";

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

describe("FriendsLeaderboardWidget", () => {
  it("shows the friend leader and the current user once loaded", async () => {
    render(
      <MemoryRouter>
        <FriendsLeaderboardWidget />
      </MemoryRouter>,
    );
    await waitFor(() => {
      expect(screen.getByText(/^Friend leaderboard$/i)).toBeInTheDocument();
      expect(screen.getByText(/^Friend leader$/i)).toBeInTheDocument();
      expect(screen.getByText(/^You$/i)).toBeInTheDocument();
    });
    // Streak comparison strip mentions the friend median.
    expect(screen.getByText(/friend median/i)).toBeInTheDocument();
  });
});
