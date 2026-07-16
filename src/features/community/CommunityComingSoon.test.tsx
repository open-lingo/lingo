import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (_k: string, d?: string) => d ?? _k }),
}));

import { CommunityComingSoon } from "./CommunityComingSoon";

describe("CommunityComingSoon", () => {
  it("renders the coming-soon heading and body", () => {
    render(<CommunityComingSoon />);
    expect(
      screen.getByRole("heading", { name: /community is coming soon/i }),
    ).toBeInTheDocument();
    expect(screen.getByText(/on the way/i)).toBeInTheDocument();
  });
});
