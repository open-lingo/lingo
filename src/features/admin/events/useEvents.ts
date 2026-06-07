import { useQuery } from "@tanstack/react-query";
import { useApi } from "@/shared/api/provider";
import type { EventFilters, EventListResponse, EventRow } from "./types";

// Admin events tab polls for "near-live" updates so a sysadmin
// watching the feed sees new domain events appear without manual
// refresh. 3s was unnecessarily aggressive: events trickle in over
// seconds-to-minutes, not sub-second, and the admin still has a
// manual refresh button. 15s with staleTime matching cuts cost by 5x
// while still feeling live.
const LIVE_REFETCH_MS = 15_000;

export function useEventList(filters: EventFilters) {
  const { ops } = useApi();
  return useQuery<EventListResponse>({
    queryKey: ["ops", "events", "list", filters],
    queryFn: () => ops.listEvents(filters),
    refetchInterval: LIVE_REFETCH_MS,
    staleTime: LIVE_REFETCH_MS,
  });
}

export function useEventDetail(id: string | null) {
  const { ops } = useApi();
  return useQuery<EventRow>({
    queryKey: ["ops", "events", "detail", id],
    queryFn: () => ops.getEvent(id!),
    enabled: id !== null,
    // Detail view doesn't change once received — only the list view is live.
    // Refetching one row on every focus is wasted bandwidth.
    staleTime: 30_000,
  });
}
