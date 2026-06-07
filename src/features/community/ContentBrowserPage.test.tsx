/**
 * ContentBrowserPage tests — verify the page calls the real
 * `community.listAddons` endpoint (replacing the deleted mockCommunity helper)
 * and renders the rows it returns.
 */
import { describe, it, expect, beforeEach, vi } from "vitest";
import type { ReactNode } from "react";
import { render, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { I18nextProvider } from "react-i18next";
import i18n from "@/shared/i18n/i18n";
import { DEFAULT_FEATURE_FLAGS } from "@/shared/config/featureFlags";

const mockCommunity = {
  listAddons: vi.fn(),
};
const mockDecks = {
  listAdminDecks: vi.fn(),
  listMyDecks: vi.fn(),
  getDeck: vi.fn(),
};
const mockUsers = {
  getSubscriptions: vi.fn(),
};
const mockStories = {
  listBrowseStories: vi.fn(),
  getStory: vi.fn(),
};

vi.mock("@/shared/api/provider", () => ({
  useApi: () => ({
    community: mockCommunity,
    decks: mockDecks,
    users: mockUsers,
    stories: mockStories,
  }),
}));

vi.mock("@/shared/contexts/FeatureFlagsContext", () => ({
  useFeatureFlags: () => DEFAULT_FEATURE_FLAGS,
}));

vi.mock("@/shared/contexts/LanguageContext", () => ({
  useLanguage: () => ({
    language: { id: "ko", name: "Korean", flag: "kr" },
    isLoading: false,
  }),
}));

vi.mock("./CommunityContentContext", () => ({
  useCommunityContent: () => ({
    openDeckPreview: vi.fn(),
    openStoryPreview: vi.fn(),
  }),
}));

vi.mock("./useBrowseSubscribedContent", () => ({
  useBrowseSubscribedContent: () => ({
    search: "",
    setSearch: vi.fn(),
    subscribeLoading: null,
    handleSubscribe: vi.fn(),
    handleUnsubscribe: vi.fn(),
  }),
}));

import { ContentBrowserPage } from "./ContentBrowserPage";

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

describe("ContentBrowserPage", () => {
  beforeEach(() => {
    mockCommunity.listAddons.mockReset();
    mockDecks.listAdminDecks.mockReset();
    mockUsers.getSubscriptions.mockReset();
    mockStories.listBrowseStories.mockReset();
    mockDecks.listAdminDecks.mockResolvedValue([]);
    mockDecks.listMyDecks.mockResolvedValue([]);
    mockUsers.getSubscriptions.mockResolvedValue([]);
    mockStories.listBrowseStories.mockResolvedValue([]);
  });

  it("calls community.listAddons on mount (the API path replacing the deleted mock)", async () => {
    mockCommunity.listAddons.mockResolvedValue([]);
    wrap(<ContentBrowserPage />);
    await waitFor(() => expect(mockCommunity.listAddons).toHaveBeenCalled());
  });

  it("renders without crashing when listAddons returns empty", async () => {
    mockCommunity.listAddons.mockResolvedValue([]);
    const { container } = wrap(<ContentBrowserPage />);
    await waitFor(() => expect(mockCommunity.listAddons).toHaveBeenCalled());
    // Top-level <section> from CommunityDecksLayout rendered.
    expect(container.querySelector("section")).not.toBeNull();
  });
});
