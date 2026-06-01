import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useApi } from "@/shared/api";
import type { AdPlacement, AdWatchedResponse } from "@/shared/api/ads";

export interface ClaimAdRewardInput {
  idempotencyKey: string;
  placement: AdPlacement;
}

/**
 * POSTs the rewarded-ad claim and invalidates user-stats queries so the
 * lingot balance updates everywhere (nav pill, shop page, profile card).
 *
 * Treats HTTP 429 (`{"detail": "already_credited"}`) as a domain error
 * — the caller (modal) inspects `err.status === 429` to show the
 * "already credited" toast instead of a generic failure.
 */
export function useClaimAdReward() {
  const { ads } = useApi();
  const queryClient = useQueryClient();

  return useMutation<AdWatchedResponse, unknown, ClaimAdRewardInput>({
    mutationKey: ["ads", "claim-reward"],
    mutationFn: ({ idempotencyKey, placement }) =>
      ads.watched({ idempotency_key: idempotencyKey, placement }),
    onSuccess: () => {
      // The lingot balance lives inside the progress summary
      // (`useUserStats` → `useProgressMe` → `["progress", "me", ...]`).
      // Invalidate that key prefix so every consumer refetches.
      void queryClient.invalidateQueries({ queryKey: ["progress", "me"] });
    },
  });
}
