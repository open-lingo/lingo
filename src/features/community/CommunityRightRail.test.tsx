/**
 * CommunityRightRail tests — verify the rail renders without crashing when
 * the tag-list API returns empty (the most common bootstrap state).
 */
import { describe, it, expect, beforeEach, vi } from "vitest";
import type { ReactNode } from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { I18nextProvider } from "react-i18next";
import i18n from "@/shared/i18n/i18n";
import { DEFAULT_FEATURE_FLAGS } from "@/shared/config/featureFlags";

const mockCommunity = {
  listTags: vi.fn(),
};

vi.mock("@/shared/api/provider", () => ({
  useApi: () => ({ community: mockCommunity }),
}));

vi.mock("@/shared/contexts/FeatureFlagsContext", () => ({
  useFeatureFlags: () => DEFAULT_FEATURE_FLAGS,
}));

vi.mock("@/shared/hooks/useLangPath", () => ({
  useLangPath: () => (p: string) => `/ko/${p}`,
}));

import { CommunityRightRail } from "./CommunityRightRail";

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

describe("CommunityRightRail", () => {
  beforeEach(() => {
    mockCommunity.listTags.mockReset();
  });

  it("renders without crashing when the tags API returns empty", async () => {
    mockCommunity.listTags.mockResolvedValue([]);
    wrap(<CommunityRightRail />);
    // Quick actions card is static — present on first paint regardless of
    // API state.
    await waitFor(() =>
      expect(screen.getByText(/Create deck/i)).toBeInTheDocument(),
    );
    // Trending tags falls back to an empty-state line.
    expect(screen.getByText(/No tags yet/i)).toBeInTheDocument();
  });

  it("renders the curated tag list when the API returns rows", async () => {
    mockCommunity.listTags.mockResolvedValue([
      { id: "1", slug: "korean", name: "korean", color: null, createdAt: null },
      { id: "2", slug: "n5", name: "n5", color: null, createdAt: null },
    ]);
    wrap(<CommunityRightRail />);
    await waitFor(() =>
      expect(screen.getByText("#korean")).toBeInTheDocument(),
    );
    expect(screen.getByText("#n5")).toBeInTheDocument();
  });
});
