import { useCallback, useEffect, useState } from "react";
import { getSRSStore } from "@/features/flashcards/engine";
import { FlashcardsInfoModal } from "./FlashcardsInfoModal";

/**
 * Versioned flag — bump the suffix if the explanation copy changes
 * enough to warrant re-prompting returning users.
 */
export const FLASHCARDS_ONBOARDING_STORAGE_KEY = "lingo_flashcards_onboarding_v1";

/** Returns true if the user has either explicitly dismissed onboarding
 *  before, OR has any existing SRS state (returning user — don't disrupt
 *  their muscle memory). */
export function shouldSkipFlashcardsOnboarding(): boolean {
  if (typeof window === "undefined") return true;
  try {
    if (localStorage.getItem(FLASHCARDS_ONBOARDING_STORAGE_KEY) === "1") {
      return true;
    }
  } catch {
    // localStorage unavailable — fail open (don't gate behavior on it)
    return true;
  }
  // Returning-user heuristic: any existing card state means they've
  // already practiced before — don't show onboarding.
  try {
    const store = getSRSStore();
    if (Object.keys(store).length > 0) return true;
  } catch {
    /* ignore */
  }
  return false;
}

function markOnboardingSeen(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(FLASHCARDS_ONBOARDING_STORAGE_KEY, "1");
  } catch {
    /* ignore */
  }
}

type Props = {
  /** When false, the gate stays inert (e.g. while the queue is loading
   *  or there's no deck). Onboarding only fires once the user is on the
   *  card surface and could meaningfully read it. */
  enabled: boolean;
};

/**
 * Auto-shows the onboarding modal on first visit. Reads localStorage on
 * mount; dismissing the modal sets the flag so it never re-fires
 * (unless the user resets it via the info modal's "show again" link).
 *
 * The on-demand info icon does NOT go through this component — it owns
 * its own modal state in `FlashcardTester`.
 */
export function FlashcardsOnboardingGate({ enabled }: Props) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!enabled) return;
    if (shouldSkipFlashcardsOnboarding()) return;
    setOpen(true);
  }, [enabled]);

  const handleClose = useCallback(() => {
    markOnboardingSeen();
    setOpen(false);
  }, []);

  if (!open) return null;
  return <FlashcardsInfoModal mode="onboarding" onClose={handleClose} />;
}
