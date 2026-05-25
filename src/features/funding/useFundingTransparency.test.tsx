/**
 * Tests for useFundingTransparency — Fix M7 (route through ApiClient via
 * FinanceApi instead of raw `fetch`).
 */
import { describe, it, expect, beforeEach, vi } from "vitest";
import type { ReactNode } from "react";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { FundingTransparency } from "@/shared/api/finance";

const mockGetTransparency = vi.fn();

vi.mock("@/shared/api", () => ({
  useApi: () => ({
    finance: { getTransparency: mockGetTransparency },
  }),
}));

// Imports use the mock above.
import { useFundingTransparency } from "./useFundingTransparency";

function wrap(): (p: { children: ReactNode }) => React.JSX.Element {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0, staleTime: 0 } },
  });
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  };
}

describe("useFundingTransparency", () => {
  beforeEach(() => {
    mockGetTransparency.mockReset();
  });

  it("calls FinanceApi.getTransparency via the shared ApiClient", async () => {
    const payload: FundingTransparency = {
      adFundedPercent: 73,
      premiumPercent: 27,
      source: "live",
      periodLabel: "MTD",
    };
    mockGetTransparency.mockResolvedValue(payload);

    const { result } = renderHook(() => useFundingTransparency(), {
      wrapper: wrap(),
    });

    await waitFor(() => expect(result.current.data).toEqual(payload));
    expect(mockGetTransparency).toHaveBeenCalledOnce();
  });

  it("falls back to the manual default when the API throws", async () => {
    mockGetTransparency.mockRejectedValue(new Error("network down"));

    const { result } = renderHook(() => useFundingTransparency(), {
      wrapper: wrap(),
    });

    await waitFor(() => {
      expect(result.current.data).toMatchObject({
        adFundedPercent: 40,
        premiumPercent: 60,
        source: "estimated",
      });
    });
  });
});
