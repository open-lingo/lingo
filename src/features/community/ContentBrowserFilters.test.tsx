/**
 * ContentBrowserPage — content-type filter + quick-sort behavior.
 *
 * Covers section B of the 2026-06-17 UI pass:
 *   - the content-type segmented control switches which kinds render
 *   - the sidebar quick-sort reorders results (votes is the lead option)
 *   - the language facet is multi-select (OR-union over the single-language
 *     field, matching the `language_id TEXT NOT NULL` data model)
 */
import { describe, it, expect, beforeEach, vi } from "vitest";
import type { ReactNode } from "react";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { I18nextProvider } from "react-i18next";
import i18n from "@/shared/i18n/i18n";

const mockCommunity = { listAddons: vi.fn() };
const mockDecks = {
  listAdminDecks: vi.fn(),
  listMyDecks: vi.fn(),
  getDeck: vi.fn(),
};
const mockUsers = { getSubscriptions: vi.fn(), discover: vi.fn() };
const mockStories = { listBrowseStories: vi.fn(), getStory: vi.fn() };

vi.mock("@/shared/api/provider", () => ({
  useApi: () => ({
    community: mockCommunity,
    decks: mockDecks,
    users: mockUsers,
    stories: mockStories,
  }),
}));

// Enable flashcards + stories so the content-type control has 2 options.
vi.mock("@/shared/contexts/FeatureFlagsContext", () => ({
  useFeatureFlags: () => ({
    community: {
      explore: {
        flashcardDecks: true,
        courses: false,
        stories: true,
        activeDiscussions: false,
      },
    },
  }),
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

// Real-ish local search state so the search box wires through.
vi.mock("./useBrowseSubscribedContent", () => {
  let value = "";
  const setValue = vi.fn((v: string) => {
    value = v;
  });
  return {
    useBrowseSubscribedContent: () => ({
      get search() {
        return value;
      },
      setSearch: setValue,
      subscribeLoading: null,
      handleSubscribe: vi.fn(),
      handleUnsubscribe: vi.fn(),
    }),
  };
});

vi.mock("./hooks/useCreatorDirectory", () => ({
  useCreatorDirectory: () => ({ resolveCreator: () => undefined }),
}));

import { ContentBrowserPage } from "./ContentBrowserPage";

function deck(id: string, name: string, voteCount: number, languageId = "ko") {
  return {
    id,
    languageId,
    name,
    description: `${name} description`,
    status: "published",
    version: "1",
    cardCount: 10,
    voteCount,
    cards: [{ id: "c1", front: `${name}-front`, back: "back", type: "word" }],
    updatedAt: "2026-01-01T00:00:00Z",
  };
}

function story(id: string, title: string, languageId = "ko") {
  return {
    id,
    languageId,
    title,
    description: `${title} story`,
    updatedAt: "2026-02-01T00:00:00Z",
    createdAt: "2026-02-01T00:00:00Z",
  };
}

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

describe("ContentBrowserPage filters", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCommunity.listAddons.mockResolvedValue([]);
    mockDecks.listMyDecks.mockResolvedValue([]);
    mockUsers.getSubscriptions.mockResolvedValue([]);
    mockUsers.discover.mockResolvedValue({ users: [], total: 0, has_more: false });
    mockDecks.listAdminDecks.mockResolvedValue([
      deck("d1", "Alpha", 2),
      deck("d2", "Zeta", 50),
    ]);
    mockStories.listBrowseStories.mockResolvedValue([story("s1", "MyStory")]);
  });

  it("content-type control filters decks vs stories", async () => {
    const user = userEvent.setup();
    wrap(<ContentBrowserPage />);

    // Default type is flashcards → decks visible, story hidden.
    await waitFor(() => expect(screen.getByText("Zeta")).toBeInTheDocument());
    expect(screen.queryByText("MyStory")).not.toBeInTheDocument();

    // Switch to Stories via the segmented control.
    const typeGroup = screen.getByRole("radiogroup", { name: /type/i });
    await user.click(within(typeGroup).getByRole("radio", { name: /story/i }));

    await waitFor(() => expect(screen.getByText("MyStory")).toBeInTheDocument());
    expect(screen.queryByText("Zeta")).not.toBeInTheDocument();
  });

  it("language facet is multi-select (OR-union over the single-language field)", async () => {
    const user = userEvent.setup();
    mockDecks.listAdminDecks.mockResolvedValue([
      deck("d-ko", "KoDeck", 1, "ko"),
      deck("d-ja", "JaDeck", 1, "ja"),
    ]);
    const { container } = wrap(<ContentBrowserPage />);
    await waitFor(() => expect(screen.getByText("KoDeck")).toBeInTheDocument());
    expect(screen.getByText("JaDeck")).toBeInTheDocument();

    // Scope to the faceted sidebar <aside> so we don't match the language
    // chip rendered on the deck cards.
    const aside = container.querySelector("aside")!;
    const labelFor = (re: RegExp) =>
      Array.from(aside.querySelectorAll("label")).find((l) =>
        re.test(l.textContent ?? ""),
      )!;
    const checkboxIn = (label: Element) =>
      label.querySelector('input[type="checkbox"]') as HTMLInputElement;

    // Selecting Korean narrows to Korean only.
    await user.click(checkboxIn(labelFor(/Korean/i)));
    await waitFor(() => expect(screen.queryByText("JaDeck")).not.toBeInTheDocument());
    expect(screen.getByText("KoDeck")).toBeInTheDocument();

    // Adding Japanese (multi-select) brings the JA deck back — both visible.
    await user.click(checkboxIn(labelFor(/Japanese/i)));
    await waitFor(() => expect(screen.getByText("JaDeck")).toBeInTheDocument());
    expect(screen.getByText("KoDeck")).toBeInTheDocument();

    // Both language checkboxes are checked simultaneously (proves multi-select).
    expect(checkboxIn(labelFor(/Korean/i)).checked).toBe(true);
    expect(checkboxIn(labelFor(/Japanese/i)).checked).toBe(true);
  });

  it("quick-sort by votes orders highest-voted first, name sorts A–Z", async () => {
    const user = userEvent.setup();
    const { container } = wrap(<ContentBrowserPage />);
    await waitFor(() => expect(screen.getByText("Zeta")).toBeInTheDocument());

    const titles = () =>
      Array.from(container.querySelectorAll("article h3, article button"))
        .map((el) => el.textContent?.trim())
        .filter((tx) => tx === "Alpha" || tx === "Zeta");

    // Default sort is "Most upvoted" → Zeta (50) before Alpha (2).
    expect(titles()).toEqual(["Zeta", "Alpha"]);

    // Switch sort to Name A–Z via the sidebar radio.
    const nameRadio = screen.getAllByRole("radio", { name: /Name A–Z/i })[0];
    await user.click(nameRadio);
    await waitFor(() => expect(titles()).toEqual(["Alpha", "Zeta"]));
  });
});
