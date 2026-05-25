import { useQuery } from "@tanstack/react-query";
import { useApi } from "@/shared/api";
import type { FundingTransparency } from "@/shared/api/finance";

const FALLBACK: FundingTransparency = {
  adFundedPercent: 40,
  premiumPercent: 60,
  source: "estimated",
  periodLabel: "Last 30 days",
};

/**
 * Cached funding split for the bottom meter (public API, no auth).
 *
 * Fix M7 — was calling `fetch()` directly with a hand-rolled URL, bypassing
 * `ApiClient` retry / error normalization. Now goes through the shared
 * `FinanceApi` instance wired up in `ApiProvider` with `skipAuth: true`
 * so the request still fires on the landing page without an Auth0 token.
 */
export function useFundingTransparency() {
  const { finance } = useApi();
  return useQuery({
    queryKey: ["finance", "transparency"],
    queryFn: async ({ signal }): Promise<FundingTransparency> => {
      try {
        return await finance.getTransparency(signal);
      } catch {
        // Hard fall back to the manual default rather than surfacing the
        // error: the meter is visible on signed-out marketing pages where
        // a red retry state would be jarring.
        return FALLBACK;
      }
    },
    staleTime: 60 * 60 * 1000,
    placeholderData: FALLBACK,
  });
}
