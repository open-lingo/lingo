import { useQuery } from "@tanstack/react-query";
import type { FundingTransparency } from "@/shared/api/finance";

const API_BASE =
  (import.meta.env.VITE_API_BASE_URL as string | undefined)?.trim() ||
  "http://localhost:8000";

const FALLBACK: FundingTransparency = {
  adFundedPercent: 40,
  premiumPercent: 60,
  source: "estimated",
  periodLabel: "Last 30 days",
};

async function fetchTransparency(): Promise<FundingTransparency> {
  const res = await fetch(`${API_BASE.replace(/\/+$/, "")}/api/core/v1/finance/transparency`, {
    cache: "no-store",
  });
  if (!res.ok) return FALLBACK;
  return res.json() as Promise<FundingTransparency>;
}

/** Cached funding split for the bottom meter (public API, no auth). */
export function useFundingTransparency() {
  return useQuery({
    queryKey: ["finance", "transparency"],
    queryFn: fetchTransparency,
    staleTime: 60 * 60 * 1000,
    placeholderData: FALLBACK,
  });
}
