/**
 * Tests for AdminInfraHealthPage — renders the budget card + alarms table
 * from a mocked lingo-ops /observability/health response.
 *
 * OpsApi is mocked via `vi.mock` on `@/shared/api/provider` so the component
 * never touches a real fetch. Assertions target the response DATA (dollar
 * figures, alarm name/metric/description) so they hold regardless of i18n
 * initialization state in the test environment.
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import type { ReactNode } from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const mockOps = {
  getObservabilityHealth: vi.fn(),
};

vi.mock("@/shared/api/provider", () => ({
  useApi: () => ({ ops: mockOps }),
}));

import { AdminInfraHealthPage } from "./AdminInfraHealthPage";

function wrap(ui: ReactNode) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0, staleTime: 0 } },
  });
  return render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>);
}

describe("AdminInfraHealthPage", () => {
  beforeEach(() => {
    mockOps.getObservabilityHealth.mockReset();
  });

  it("renders the budget card and an alarm row from a healthy response", async () => {
    mockOps.getObservabilityHealth.mockResolvedValue({
      generated_at: "2026-07-15T12:00:00Z",
      budget: {
        name: "Monthly account budget",
        limit_usd: 100,
        actual_usd: 42.5,
        forecast_usd: 88,
        percent_used: 42.5,
        status: "ok",
      },
      alarms: [
        {
          name: "lambda-concurrency-high",
          state: "ALARM",
          metric: "ConcurrentExecutions",
          description: "Lambda concurrency exceeded threshold",
          updated_at: "2026-07-15T11:59:00Z",
        },
        {
          name: "dynamo-read-throttle",
          state: "OK",
          metric: "ReadThrottleEvents",
          description: "DynamoDB read throttling within bounds",
          updated_at: "2026-07-15T11:58:00Z",
        },
      ],
    });

    wrap(<AdminInfraHealthPage />);

    // Budget card: name + actual/limit dollar figures.
    await waitFor(() =>
      expect(screen.getByText("Monthly account budget")).toBeInTheDocument(),
    );
    // Actual spend + forecast render directly (not via i18n interpolation).
    expect(screen.getByText("$42.50")).toBeInTheDocument();
    expect(screen.getByText("$88.00")).toBeInTheDocument();

    // Alarm rows: name + metric + description.
    expect(screen.getByText("lambda-concurrency-high")).toBeInTheDocument();
    expect(screen.getByText("ConcurrentExecutions")).toBeInTheDocument();
    expect(
      screen.getByText("Lambda concurrency exceeded threshold"),
    ).toBeInTheDocument();
    expect(screen.getByText("dynamo-read-throttle")).toBeInTheDocument();
  });

  it("shows the budget-unavailable message when budget is null", async () => {
    mockOps.getObservabilityHealth.mockResolvedValue({
      generated_at: "2026-07-15T12:00:00Z",
      budget: null,
      alarms: [],
    });

    wrap(<AdminInfraHealthPage />);

    await waitFor(() =>
      expect(screen.getByText(/Budget data unavailable/i)).toBeInTheDocument(),
    );
  });
});
