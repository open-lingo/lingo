/**
 * Verifies the perf claim of the batched bundle endpoint: when both
 * `LeagueSpotlightCard` and `UnifiedLeaderboardCard` mount on the same page,
 * the FE fires exactly one network call (the bundle), not four.
 *
 * Realized via a `useApi` mock that counts how many times
 * `getLeaderboardBundle` is invoked. The previously-separate per-board hooks
 * (`getWeeklyLeaderboard` etc.) must NOT be called by the bundled consumers.
 */
import { describe, it, expect, vi, beforeEach, beforeAll, afterAll } from "vitest";
import { render, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ToastProvider } from "@/shared/contexts/ToastContext";
import { I18nextProvider } from "react-i18next";
import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import type { LeaderboardBundle } from "@/shared/api/social";

// Force the API path on via the global test-only escape hatch — Vitest
// scopes `import.meta.env` per module, so we can't mutate the gate from the
// test file. `__FORCE_SOCIAL_API__ === true` short-circuits the gate.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(globalThis as any).__FORCE_SOCIAL_API__ = true;

import { UnifiedLeaderboardCard } from "./LeaderboardsSection";
import { LeagueSpotlightCard } from "./LeagueSpotlightCard";

// Bare i18n init for the tests so `t()` returns its fallback string.
beforeAll(() => {
  if (!i18n.isInitialized) {
    void i18n.use(initReactI18next).init({
      lng: "en",
      fallbackLng: "en",
      resources: { en: { translation: {} } },
      interpolation: { escapeValue: false },
      returnNull: false,
    });
  }
});

const sampleBundle: LeaderboardBundle = {
  weekly: {
    bucket: "weekly:ja",
    entries: [
      {
        user_id: "u1",
        username: "alice",
        display_name: "Alice",
        profile_picture_key: null,
        xp_this_period: 200,
        rank: 1,
      },
    ],
    total: 1,
    my_rank: 1,
  },
  monthly: {
    bucket: "monthly:ja",
    entries: [],
    total: 0,
    my_rank: null,
  },
  friends: {
    bucket: "friends:ja",
    entries: [],
    total: 0,
    my_rank: null,
  },
  spotlight: {
    league: "bronze",
    league_tier: 1,
    my_row: null,
    rank: 1,
    rank_yesterday: 1,
    rank_delta_today: 0,
    daily_xp: [0, 0, 0, 0, 0, 0, 0],
    friend_median_daily_xp: [0, 0, 0, 0, 0, 0, 0],
    top_three: [],
    promotion_threshold: 100,
    demotion_threshold: 0,
  },
};

const { social } = vi.hoisted(() => ({
  social: {
    getLeaderboardBundle: vi.fn(),
    // The non-bundled hooks should NOT be called from the social-page consumers.
    getWeeklyLeaderboard: vi.fn(),
    getMonthlyLeaderboard: vi.fn(),
    getFriendsLeaderboard: vi.fn(),
    getLeagueSpotlight: vi.fn(),
  },
}));

vi.mock("@/shared/api", async () => {
  const actual = await vi.importActual<typeof import("@/shared/api")>("@/shared/api");
  return {
    ...actual,
    useApiOptional: () => ({ social }),
    useApi: () => ({ social }),
  };
});

function buildWrapper() {
  const client = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0, staleTime: 0 },
      mutations: { retry: false },
    },
  });
  function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={client}>
        <ToastProvider>
          <I18nextProvider i18n={i18n}>
            <MemoryRouter>{children}</MemoryRouter>
          </I18nextProvider>
        </ToastProvider>
      </QueryClientProvider>
    );
  }
  return { client, Wrapper };
}

beforeEach(() => {
  for (const fn of Object.values(social)) fn.mockReset();
  social.getLeaderboardBundle.mockResolvedValue(sampleBundle);
});

afterAll(() => {
  // Don't leak the test-only API gate to neighboring files.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  delete (globalThis as any).__FORCE_SOCIAL_API__;
});

describe("leaderboard bundle: one network call when both consumers mount", () => {
  it("fires getLeaderboardBundle exactly once and skips the per-board endpoints", async () => {
    const { Wrapper } = buildWrapper();
    render(
      <Wrapper>
        <LeagueSpotlightCard />
        <UnifiedLeaderboardCard />
      </Wrapper>,
    );

    await waitFor(() => {
      expect(social.getLeaderboardBundle).toHaveBeenCalledTimes(1);
    });
    // Per-board endpoints must stay quiet — they're for narrow-rail variants
    // only, which aren't mounted here.
    expect(social.getWeeklyLeaderboard).not.toHaveBeenCalled();
    expect(social.getMonthlyLeaderboard).not.toHaveBeenCalled();
    expect(social.getFriendsLeaderboard).not.toHaveBeenCalled();
    expect(social.getLeagueSpotlight).not.toHaveBeenCalled();
  });
});
