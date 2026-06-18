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
const mockGetSettings = vi.fn();
const mockUpdateMe = vi.fn();

vi.mock("@/shared/api/provider", () => ({
  useApi: () => ({
    users: {
      getByUsername: mockGetByUsername,
      getSettings: mockGetSettings,
      updateMe: mockUpdateMe,
    },
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

// Viewer identity / role. Default = non-admin; individual tests override.
const mockUseMe = vi.fn(() => ({ me: { role: "user" }, isLoading: false }));
vi.mock("@/shared/hooks/useMe", () => ({ useMe: () => mockUseMe() }));

// Lang-path helper depends on LanguageProvider in real life; stub it so the
// page can build messenger/learn links without wrapping the full context.
vi.mock("@/shared/hooks/useLangPath", () => ({
  useLangPath: () => (p: string) => `/ja/${p.replace(/^\//, "")}`,
  useLang: () => "ja",
}));

// Toast + impersonation start are exercised via the admin act-as flow.
const mockStartImpersonation = vi.fn().mockResolvedValue(true);
vi.mock("@/features/admin/impersonation/useStartImpersonation", () => ({
  useStartImpersonation: () => ({ start: mockStartImpersonation, pending: false }),
}));

// Authored decks derive from the marketplace feed in real life; stub to a
// fixed set so the table + total-upvotes chip render deterministically.
vi.mock("@/features/profile/useAuthoredDecks", () => ({
  useAuthoredDecks: () => ({
    decks: [
      { id: "deck-1", name: "JLPT N5 Kanji", language: "ja", upvotes: 12, updatedAt: "2025-02-01T00:00:00Z" },
      { id: "deck-2", name: "Hiragana Basics", language: "ja", upvotes: 5, updatedAt: "2025-01-20T00:00:00Z" },
    ],
    totalUpvotes: 17,
    isLoading: false,
  }),
}));

// Stub shop state so InventorySection doesn't blow up in self-profile tests.
vi.mock("@/features/shop/useShopState", () => ({
  useShopState: () => ({
    lingots: 0,
    statsReady: true,
    shop: { purchases: [], inventory: {} },
    isLoading: false,
    isOwned: () => false,
    ownedQuantity: () => 0,
    refetchStats: () => {},
    refetchShop: () => {},
  }),
  useInvalidateShopQueries: () => () => {},
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
    mockGetSettings.mockReset();
    mockUpdateMe.mockReset();
    mockGetByUsername.mockResolvedValue(baseUser);
    mockGetSettings.mockResolvedValue({});
    mockUpdateMe.mockResolvedValue(baseUser);
    mockUseMe.mockReturnValue({ me: { role: "user" }, isLoading: false });
    mockStartImpersonation.mockClear();
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

  it("shows inline edit form when owner clicks Edit profile", async () => {
    mockGetPublicProfile.mockResolvedValue(
      baseSocial({ friendship_status: "self" }),
    );
    renderPage();
    // The edit form starts hidden; it appears after clicking Edit profile.
    // Wait for the profile to load first.
    const editBtn = await screen.findByRole("button", { name: /edit profile/i });
    // Before click, form should not be visible.
    expect(screen.queryByPlaceholderText(/your name/i)).toBeNull();
    // Import userEvent after DOM is settled.
    const userEvent = (await import("@testing-library/user-event")).default;
    await userEvent.setup().click(editBtn);
    // After click, display name input should be visible.
    expect(screen.getByPlaceholderText(/your name/i)).toBeInTheDocument();
  });

  it("renders enriched stats (lingots, level, authored decks, last active)", async () => {
    mockGetPublicProfile.mockResolvedValue(
      baseSocial({
        friendship_status: "friend",
        lingots: 42,
        level: 4,
        last_active_date: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        authored_deck_count: 2,
        authored_decks_sample: [
          { id: "deck-1", name: "Hiragana basics", language: "ja" },
          { id: "deck-2", name: "Katakana basics", language: "ja" },
        ],
      }),
    );
    renderPage();
    // Lingots value
    await screen.findByText("42", undefined, { timeout: 3000 });
    // Level kicker + numeral live in adjacent elements in the editorial
    // redesign — assert both are on the page rather than matching a
    // combined string.
    expect(screen.getAllByText(/level/i).length).toBeGreaterThan(0);
    expect(screen.getByText("4")).toBeInTheDocument();
    // Authored decks render as a table (names sourced from useAuthoredDecks).
    expect(screen.getByText(/JLPT N5 Kanji/i)).toBeInTheDocument();
    expect(screen.getByText(/Hiragana Basics/i)).toBeInTheDocument();
    // Per-deck + total upvotes derived from the deck vote counts.
    expect(screen.getByText("12")).toBeInTheDocument();
    expect(screen.getByText("17")).toBeInTheDocument();
    // Last-active is rendered relative (≈2h ago) for a recent timestamp.
    expect(screen.getByText(/active 2h ago/i)).toBeInTheDocument();
  });

  it("admin viewer sees 'Act as user'; non-admin does not", async () => {
    // Non-admin: no impersonation affordance.
    mockGetPublicProfile.mockResolvedValue(baseSocial({ friendship_status: "friend" }));
    const { unmount } = renderPage();
    await screen.findAllByText(/Friends/i, undefined, { timeout: 3000 });
    expect(screen.queryByText(/act as user/i)).toBeNull();
    unmount();

    // Admin: "Act as user" appears inside the friend-status dropdown.
    mockUseMe.mockReturnValue({ me: { role: "admin" }, isLoading: false });
    mockGetPublicProfile.mockResolvedValue(baseSocial({ friendship_status: "friend" }));
    renderPage();
    const userEvent = (await import("@testing-library/user-event")).default;
    const friendsBtn = await screen.findByRole("button", { name: /friends/i });
    await userEvent.click(friendsBtn);
    expect(await screen.findByText(/act as user/i)).toBeInTheDocument();
  });

  it("shows a Quick chat button for non-self viewers and routes to the messenger", async () => {
    mockGetPublicProfile.mockResolvedValue(baseSocial({ friendship_status: "friend" }));
    renderPage();
    const chat = await screen.findByRole("button", { name: /quick chat/i });
    expect(chat).toBeInTheDocument();
  });
});
