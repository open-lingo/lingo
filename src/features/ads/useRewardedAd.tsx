import { useCallback, useMemo, useState, type ReactNode } from "react";
import { RewardedAdModal } from "./RewardedAdModal";

/**
 * Exposes `{ open, modalNode }` for any feature that wants to surface
 * the rewarded-ad CTA. Pattern mirrors other hook-rendered modals in
 * the codebase: caller mounts `modalNode` into its tree and calls
 * `open()` from a button handler.
 *
 * The `idempotency_key` is generated on each `open()` call so a single
 * mount can serve multiple consecutive watches with distinct keys.
 */
export interface UseRewardedAd {
  open: () => void;
  modalNode: ReactNode;
  isOpen: boolean;
}

function generateIdempotencyKey(): string {
  // `crypto.randomUUID` is available in every modern browser + jsdom/happy-dom.
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  // Fallback for ancient environments — should never hit in app code.
  return `rwd-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export function useRewardedAd(): UseRewardedAd {
  const [idempotencyKey, setIdempotencyKey] = useState<string | null>(null);

  const open = useCallback(() => {
    setIdempotencyKey(generateIdempotencyKey());
  }, []);

  const close = useCallback(() => {
    setIdempotencyKey(null);
  }, []);

  const modalNode = useMemo(() => {
    if (!idempotencyKey) return null;
    return (
      <RewardedAdModal idempotencyKey={idempotencyKey} onClose={close} />
    );
  }, [idempotencyKey, close]);

  return {
    open,
    modalNode,
    isOpen: idempotencyKey !== null,
  };
}
