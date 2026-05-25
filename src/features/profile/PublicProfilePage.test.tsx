/**
 * PublicProfilePage tests — assert the correct primary action renders for
 * each friendship_status the social endpoint returns. Mocks the API so the
 * tests don't depend on network or token wiring.
 */
import { describe, it, expect, beforeEach, vi } from "vitest";
import type { ReactNode } from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { FriendshipStatus, PublicProfile } from "@/shared/api/social";

const mockGetByUsername = vi.fn();
const mockGetPublicProfile = vi.fn();
const mockSendFriendRequest = vi.fn();
const mockAcceptFriendRequest = vi.fn();
const mockUnblock = vi.fn();
const mockUnfriend = vi.fn();
const mockBlock = vi.fn();

vi.mock("@/shared/api/provider", () => ({
  useApi: () => ({
    users: { getByUsername: mockGetByUsername },
    social: {
      getPublicProfile: mockGetPublicProfile,
      sendFriendRequest: mockSendFriendRequest,
      acceptFriendRequest: mockAcceptFriendRequest,
      unblockUser: mockUnblock,
      unfriend: mockUnfriend,
      blockUser: mockBlock,
    },
  }),
}));

vi.mock("@/shared/auth/useAuth", () => ({
  useAuth: () => ({
    isAuthenticated: true,
    isLoading: false,
    user: { sub: "auth0|viewer" },
    error: undefined,
    login: () => {},
    signup: () => {},
    logout: () => {},
  }),
}));

import { PublicProfilePage } from "./PublicProfilePage";

const baseUser = {
  id: "user-target",
  auth0_id: "auth0|target",
  username: "haru",
  display_name: "Haru Tanaka",
  profile_picture_key: null,
  bio: "I make decks.",
  status: "active",
  status_expiration: null,
  community_status: null,
  community_status_expiration: null,
  role: "user",
  created_at: "2025-01-15T00:00:00Z",
  updated_at: "2025-01-15T00:00:00Z",
};

function baseSocial(overrides: Partial<PublicProfile> = {}): PublicProfile {
  return {
    user_id: "user-target",
    username: "haru",
    display_name: "Haru Tanaka",
    profile_picture_key: null,
    bio: "I make decks.",
    learning_language: "ja",
    joined_at: "2025-01-15T00:00:00Z",
    streak: 7,
    xp: 1200,
    friendship_status: "none",
    ...overrides,
  };
}

function renderPage() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: 0, gcTime: 0 } },
  });
  function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  }
  return render(
    <MemoryRouter initialEntries={["/u/haru"]}>
      <Routes>
        <Route path="/u/:username" element={<PublicProfilePage />} />
      </Routes>
    </MemoryRouter>,
    { wrapper: Wrapper },
  );
}

describe("PublicProfilePage", () => {
  beforeEach(() => {
    mockGetByUsername.mockReset();
    mockGetPublicProfile.mockReset();
    mockSendFriendRequest.mockReset();
    mockAcceptFriendRequest.mockReset();
    mockUnblock.mockReset();
    mockUnfriend.mockReset();
    mockBlock.mockReset();
    mockGetByUsername.mockResolvedValue(baseUser);
  });

  const cases: Array<{ status: FriendshipStatus; expect: string }> = [
    { status: "none", expect: "Add friend" },
    { status: "request_out", expect: "Request sent" },
    { status: "request_in", expect: "Accept request" },
    { status: "friend", expect: "Friends" },
    { status: "blocked", expect: "Unblock" },
    { status: "self", expect: "Edit profile" },
  ];

  for (const c of cases) {
    it(`renders the right action for friendship_status="${c.status}"`, async () => {
      mockGetPublicProfile.mockResolvedValue(
        baseSocial({ friendship_status: c.status }),
      );
      renderPage();
      // partial match — "Friends ▾" or "Request sent" etc.
      const re = new RegExp(c.expect, "i");
      const elements = await screen.findAllByText(re, undefined, { timeout: 3000 });
      expect(elements.length).toBeGreaterThan(0);
    });
  }

  it("renders 'This profile is private' when social endpoint 404s", async () => {
    const err = Object.assign(new Error("404"), { status: 404 });
    // Use the real ApiError so the hook detects status 404.
    const { ApiError } = await import("@/shared/api/client");
    mockGetPublicProfile.mockRejectedValueOnce(new ApiError(404, { detail: "Not found" }));
    void err;
    renderPage();
    await waitFor(() =>
      expect(screen.getByText(/this profile is private/i)).toBeInTheDocument(),
    );
  });
});
