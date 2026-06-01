import { useQuery } from "@tanstack/react-query";
import { useApi } from "@/shared/api/provider";
import type { EventFilters, EventListResponse, EventRow } from "./types";

const LIVE_REFETCH_MS = 3_000;

export function useEventList(filters: EventFilters) {
  const { ops } = useApi();
  return useQuery<EventListResponse>({
    queryKey: ["ops", "events", "list", filters],
    queryFn: () => ops.listEvents(filters),
    refetchInterval: LIVE_REFETCH_MS,
    staleTime: 0,
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
