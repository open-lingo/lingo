/**
 * Tests for AdminOperationsPage — renders each tab, mocks OpsApi.
 *
 * Vitest + happy-dom + @testing-library/react. The OpsApi is mocked via
 * `vi.mock` on the `@/shared/api/provider` module so the component
 * never tries to use a real fetch.
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import type { ReactNode } from "react";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const mockOps = {
  getRevenueSummary: vi.fn(),
  getRevenueBySource: vi.fn(),
  getCostsByService: vi.fn(),
  getCostsByDomain: vi.fn(),
  getCostsAuth0: vi.fn(),
  getSubscriptionsSummary: vi.fn(),
  getRecentSubscriptions: vi.fn(),
  getAdsSummary: vi.fn(),
  getAdPlacements: vi.fn(),
  getJobsSummary: vi.fn(),
  getJobsRecent: vi.fn(),
};

vi.mock("@/shared/api/provider", () => ({
  useApi: () => ({ ops: mockOps }),
}));

import { AdminOperationsPage } from "./AdminOperationsPage";

function wrap(ui: ReactNode) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0, staleTime: 0 } },
  });
  return render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>);
}

function makeDefaults() {
  mockOps.getRevenueSummary.mockResolvedValue({
    ytd: { label: "ytd", grossUsd: "0.00", netUsd: "0.00", feesUsd: "0.00" },
    mtd: { label: "mtd", grossUsd: "12.00", netUsd: "10.00", feesUsd: "2.00" },
    last30Days: { label: "last30", grossUsd: "0.00", netUsd: "0.00", feesUsd: "0.00" },
    updatedAt: "2026-05-25T00:00:00Z",
  });
  mockOps.getRevenueBySource.mockResolvedValue({
    stripe: { grossUsd: "8.00", netUsd: "7.00", feesUsd: "1.00" },
    adsense: { grossUsd: "4.00", netUsd: "3.00" },
    updatedAt: "2026-05-25T00:00:00Z",
  });
  mockOps.getCostsByService.mockResolvedValue({
    periodStart: "2026-05-01",
    periodEnd: "2026-05-31",
    totalUsd: "20.00",
    byService: { "AWS Lambda": "12.00", "Amazon DynamoDB": "8.00" },
    updatedAt: "2026-05-25T00:00:00Z",
  });
  mockOps.getCostsByDomain.mockResolvedValue({
    domains: { social: 0, decks: 0, srs: 0, users: 0, untagged: 0 },
    totalCents: 0,
    source: "aws_cost_explorer",
    asOf: null,
  });
  mockOps.getCostsAuth0.mockResolvedValue({
    mau: 100,
    estimatedMonthlyUsd: "0.00",
    tier: "Free",
    source: "manual",
    updatedAt: null,
  });
  mockOps.getSubscriptionsSummary.mockResolvedValue({
    totalActive: 5,
    totalLifetime: 1,
    byTier: { free: 100, supporter: 3, patron: 1, lifetime: 1 },
    mrrCents: 2500,
    arrCents: 30000,
    last30dNew: 2,
    last30dChurned: 1,
    asOf: "2026-05-25T00:00:00Z",
    _mock: true,
  });
  mockOps.getRecentSubscriptions.mockResolvedValue({
    events: [
      {
        userId: "u_1",
        username: "alice",
        tier: "supporter",
        event: "new",
        happenedAt: "2026-05-24T12:00:00Z",
        amountCents: 500,
      },
    ],
    _mock: true,
  });
  mockOps.getAdsSummary.mockResolvedValue({
    impressionsToday: 100,
    impressionsMtd: 1000,
    fillRatePct: 90.5,
    ecpmCents: 50,
    revenueTodayCents: 5,
    revenueMtdCents: 50,
    byUnit: { homeBanner: 30, lessonBanner: 15, rewardedVideo: 5 },
    asOf: "2026-05-25T00:00:00Z",
    _mock: true,
  });
  mockOps.getAdPlacements.mockResolvedValue({
    placements: [
      { slotId: "banner", location: "Home — banner", enabled: true, lastFilledAt: null },
    ],
    _mock: true,
  });
  mockOps.getJobsSummary.mockResolvedValue({
    last24h: { success: 0, failed: 0, running: 0 },
    byJob: {},
  });
  mockOps.getJobsRecent.mockResolvedValue({ runs: [] });
}

describe("AdminOperationsPage", () => {
  beforeEach(() => {
    for (const fn of Object.values(mockOps)) fn.mockReset();
    makeDefaults();
  });

  it("renders the Cost & Revenue tab by default with revenue / cost data", async () => {
    wrap(<AdminOperationsPage />);
    expect(await screen.findByText(/Net this month/i)).toBeInTheDocument();
    // The "by service" card lists AWS Lambda.
    await waitFor(() => expect(screen.getByText("AWS Lambda")).toBeInTheDocument());
    // The MTD net is revenue 10.00 − costs 20.00 = -10.00 → "-$10.00".
    await waitFor(() => expect(screen.getByText("-$10.00")).toBeInTheDocument());
  });

  it("shows the 'Activate cost-allocation tags' hint when all by-domain values are zero", async () => {
    wrap(<AdminOperationsPage />);
    await waitFor(() => {
      expect(screen.getByText(/Activate cost-allocation tags/i)).toBeInTheDocument();
    });
  });

  it("hides the activate-tags hint when at least one domain has spend", async () => {
    mockOps.getCostsByDomain.mockResolvedValue({
      domains: { social: 1234, decks: 0, srs: 0, users: 0, untagged: 0 },
      totalCents: 1234,
      source: "aws_cost_explorer",
      asOf: "2026-05-25T00:00:00Z",
    });
    wrap(<AdminOperationsPage />);
    await waitFor(() => expect(screen.getByText("social")).toBeInTheDocument());
    expect(screen.queryByText(/Activate cost-allocation tags/i)).not.toBeInTheDocument();
  });

  it("renders the Subscriptions tab with the mock-data pill", async () => {
    wrap(<AdminOperationsPage />);
    fireEvent.click(screen.getByRole("tab", { name: /Subscriptions/i }));
    // Wait for the MRR figure (2500 cents → $25.00) which only appears
    // after the summary query resolves.
    await waitFor(() => expect(screen.getByText("$25.00")).toBeInTheDocument());
    expect(screen.getByText(/mock data/i)).toBeInTheDocument();
    expect(screen.getByText(/Active subscribers/i)).toBeInTheDocument();
    // Recent event row.
    await waitFor(() => expect(screen.getByText(/@alice/)).toBeInTheDocument());
  });

  it("renders the Ads tab with placements table", async () => {
    wrap(<AdminOperationsPage />);
    fireEvent.click(screen.getByRole("tab", { name: /^Ads$/i }));
    // Wait for actual data — "Placements" header appears immediately
    // (it's structural), so wait on the placement row content instead.
    await waitFor(() => expect(screen.getByText("banner")).toBeInTheDocument());
    expect(screen.getByText(/Impressions today/i)).toBeInTheDocument();
    expect(screen.getByText(/Placements/i)).toBeInTheDocument();
  });

  it("renders the Jobs tab with the empty-state when no jobs are logged", async () => {
    wrap(<AdminOperationsPage />);
    fireEvent.click(screen.getByRole("tab", { name: /^Jobs$/i }));
    await waitFor(() =>
      expect(screen.getByText(/No jobs logged yet/i)).toBeInTheDocument(),
    );
    // The empty state mentions the log endpoint path.
    expect(screen.getByText(/\/api\/ops\/v1\/jobs\/log/)).toBeInTheDocument();
  });

  it("renders the Jobs tab with rows when runs exist", async () => {
    mockOps.getJobsRecent.mockResolvedValue({
      runs: [
        {
          id: 1,
          jobName: "nightly_rollup",
          status: "success",
          startedAt: "2026-05-25T05:00:00Z",
          durationMs: 1234,
          message: "rolled 7 rows",
          details: null,
        },
      ],
    });
    mockOps.getJobsSummary.mockResolvedValue({
      last24h: { success: 1, failed: 0, running: 0 },
      byJob: {
        nightly_rollup: {
          count: 1,
          lastStatus: "success",
          lastRunAt: "2026-05-25T05:00:00Z",
          p95DurationMs: 1234,
        },
      },
    });
    wrap(<AdminOperationsPage />);
    fireEvent.click(screen.getByRole("tab", { name: /^Jobs$/i }));
    await waitFor(() =>
      // Job name appears twice — once in the recent-runs table and once in the
      // per-job summary table.
      expect(screen.getAllByText("nightly_rollup").length).toBeGreaterThanOrEqual(1),
    );
    expect(screen.getByText(/rolled 7 rows/i)).toBeInTheDocument();
  });

  it("renders the ops-down banner when a network error fires", async () => {
    mockOps.getRevenueSummary.mockRejectedValue(new Error("Failed to fetch"));
    mockOps.getRevenueBySource.mockRejectedValue(new Error("Failed to fetch"));
    mockOps.getCostsByService.mockRejectedValue(new Error("Failed to fetch"));
    mockOps.getCostsByDomain.mockRejectedValue(new Error("Failed to fetch"));
    mockOps.getCostsAuth0.mockRejectedValue(new Error("Failed to fetch"));
    wrap(<AdminOperationsPage />);
    await waitFor(() =>
      expect(screen.getByText(/Ops API unavailable/i)).toBeInTheDocument(),
    );
    expect(screen.getByText(/VITE_OPS_API_BASE_URL/)).toBeInTheDocument();
  });
});
