import { describe, it, expect, afterEach, vi } from "vitest";
import { render, cleanup } from "@testing-library/react";

// Regression guard for the social-page bug where the masthead avatar rendered
// blank: the old header resolved the avatar from the Auth0 `user.picture`
// only, so a user who uploaded an avatar (stored as `profile_picture_key` on
// `/users/me`) but had no IdP picture saw just their initial. The sidebar now
// reads `useMe()` and resolves the server-stored key.

vi.mock("@/shared/auth/useAuth", () => ({
  // No Auth0 picture — exactly the case that used to render blank.
  useAuth: () => ({
    isAuthenticated: true,
    user: { sub: "auth0|123", name: "Trevor", picture: "" },
  }),
}));

vi.mock("@/shared/hooks/useMe", () => ({
  useMe: () => ({
    me: {
      id: "u1",
      display_name: "Trevor",
      profile_picture_key: "https://cdn.example.com/avatar.png",
    },
    isLoading: false,
  }),
}));

vi.mock("@/shared/hooks/useUserStats", () => ({
  useUserStats: () => ({ stats: { streak: 5 } }),
}));

vi.mock("../hooks/useSocial", () => ({
  useSocial: () => ({ league: null, weeklyLeaderboard: [] }),
}));

vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (_k: string, def: string) => def }),
}));

afterEach(() => cleanup());

describe("SocialSidebar avatar", () => {
  it("renders the server-stored profile picture (not just the Auth0 picture)", async () => {
    const { SocialSidebar } = await import("./SocialSidebar");
    render(
      <SocialSidebar
        activeTab="overview"
        onSelect={() => {}}
        onAddFriend={() => {}}
        unreadCount={0}
        requestCount={0}
      />,
    );
    const img = document.querySelector("img") as HTMLImageElement | null;
    expect(img).not.toBeNull();
    expect(img?.getAttribute("src")).toBe(
      "https://cdn.example.com/avatar.png",
    );
  });
});
