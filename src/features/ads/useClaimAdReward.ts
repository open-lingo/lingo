import { useMutation } from "@tanstack/react-query";
import { useApi } from "@/shared/api";
import { emitProgressChanged } from "@/shared/domain/progressEvents";
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

  return useMutation<AdWatchedResponse, unknown, ClaimAdRewardInput>({
    mutationKey: ["ads", "claim-reward"],
    mutationFn: ({ idempotencyKey, placement }) =>
      ads.watched({ idempotency_key: idempotencyKey, placement }),
    onSuccess: () => {
      // The lingot balance lives inside the progress summary
      // (`useUserStats` → `useProgressMe` → `["progress", "me", ...]`).
      // Routed through the shared signal (HOMEREFRESH) — same net effect
      // (progress/me invalidated), not sync-shaped so quests are untouched.
      emitProgressChanged("ui_mutation");
    },
  });
}
