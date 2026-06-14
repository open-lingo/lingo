/**
 * CommunityHomePage tests — the marketplace home renders its sectioned rails
 * (featured / contributors / new / by-language) from real content + the
 * discover-backed creator directory, and resolves creator names onto cards.
 */
import { describe, it, expect, beforeEach, vi } from "vitest";
import type { ReactNode } from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { I18nextProvider } from "react-i18next";
import i18n from "@/shared/i18n/i18n";
import { DEFAULT_FEATURE_FLAGS } from "@/shared/config/featureFlags";
import type { DeckResponse } from "@/shared/api/decks";

const mockDecks = { listAdminDecks: vi.fn() };
const mockStories = { listBrowseStories: vi.fn() };
const mockUsers = { discover: vi.fn() };

vi.mock("@/shared/api/provider", () => ({
  useApi: () => ({ decks: mockDecks, stories: mockStories, users: mockUsers }),
}));

vi.mock("@/shared/contexts/FeatureFlagsContext", () => ({
  useFeatureFlags: () => DEFAULT_FEATURE_FLAGS,
}));

vi.mock("@/shared/contexts/LanguageContext", () => ({
  useLanguage: () => ({ language: { id: "ko", name: "Korean", flag: "kr" }, isLoading: false }),
}));

vi.mock("./CommunityContentContext", () => ({
  useCommunityContent: () => ({ openDeckPreview: vi.fn(), openStoryPreview: vi.fn() }),
}));

// UserPreviewPopover pulls in social/api machinery — stub to a passthrough.
vi.mock("@/features/social/components/UserPreviewPopover", () => ({
  UserPreviewPopover: ({ children }: { children: ReactNode }) => <>{children}</>,
}));

import { CommunityHomePage } from "./CommunityHomePage";

const DECK = (over: Partial<DeckResponse>): DeckResponse => ({
  id: "d1",
  languageId: "ko",
  name: "K-Drama Phrases",
  status: "published",
  version: "1",
  cardCount: 20,
  voteCount: 7,
  authorId: "u-noor",
  cards: [],
  updatedAt: "2026-06-10T00:00:00Z",
  ...over,
});

function wrap(ui: ReactNode) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0, staleTime: 0 } },
  });
  return render(
    <MemoryRouter>
      <I18nextProvider i18n={i18n}>
        <QueryClientProvider client={client}>{ui}</QueryClientProvider>
      </I18nextProvider>
    </MemoryRouter>,
  );
}

describe("CommunityHomePage", () => {
  beforeEach(() => {
    mockDecks.listAdminDecks.mockReset();
    mockStories.listBrowseStories.mockReset();
    mockUsers.discover.mockReset();
    mockStories.listBrowseStories.mockResolvedValue([]);
    mockUsers.discover.mockResolvedValue({
      users: [
        {
          auth0_id: "dev|noor",
          user_id: "u-noor",
          username: "noor_x",
          display_name: "Noor Khan",
          profile_picture_key: null,
          learning_language: "ko",
          weekly_xp: 0,
          streak_days: 5,
          friendship_status: "none",
        },
      ],
      total: 1,
      has_more: false,
    });
  });

  it("renders the empty state when there is no community content", async () => {
    mockDecks.listAdminDecks.mockResolvedValue([]);
    wrap(<CommunityHomePage />);
    await screen.findByText(/Nothing here yet/i);
  });

  it("renders rails and resolves the creator name onto content", async () => {
    mockDecks.listAdminDecks.mockResolvedValue([
      DECK({ id: "d1", name: "K-Drama Phrases", authorId: "u-noor" }),
      DECK({ id: "d2", name: "Hangul Basics", authorId: "u-noor", voteCount: 3 }),
    ]);
    wrap(<CommunityHomePage />);

    // Featured badge/section + the resolved creator name appear once loaded.
    await screen.findAllByText(/Featured/i);
    await waitFor(() =>
      expect(screen.getAllByText("Noor Khan").length).toBeGreaterThan(0),
    );
    expect(screen.getByText(/Top contributors/i)).toBeInTheDocument();
    expect(screen.getByText(/New content/i)).toBeInTheDocument();
  });

  it("excludes companion decks from the marketplace", async () => {
    mockDecks.listAdminDecks.mockResolvedValue([
      DECK({ id: "c1", name: "Companion Deck", companionToStoryId: "s1" }),
    ]);
    wrap(<CommunityHomePage />);
    // Only the companion deck exists → it is filtered → empty state shows.
    await screen.findByText(/Nothing here yet/i);
  });
});
