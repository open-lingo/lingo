/**
 * Placeholder stub for the ad-free hook owned by `src/features/adFree/`
 * (parallel agent). Once that module merges, swap the import in
 * `useQuests` (or any quest reward handler) from this stub to the real
 * `useAdFreeStatus` and delete this file.
 *
 * The shape here mirrors what we expect the real hook to return; if it
 * lands differently, that's a follow-up cleanup, not a blocker — quest
 * code only consults `addAdFreeMinutes` when an `adFreeMinutes` reward
 * is claimed.
 */
export type AdFreeStatus = {
  /** Minutes of ad-free time remaining. 0 when expired or unowned. */
  minutesRemaining: number;
  addAdFreeMinutes: (minutes: number) => void;
};

export function useAdFreeStatusStub(): AdFreeStatus {
  return {
    minutesRemaining: 0,
    addAdFreeMinutes: () => {
      // No-op until ad-free agent merges. Logged for visibility.
      if (
        typeof console !== "undefined" &&
        // Skip in test runs to keep output clean.
        typeof process === "undefined"
      ) {
        // eslint-disable-next-line no-console
        console.info(
          "[quests] addAdFreeMinutes stub called — wire to ad-free hook once available",
        );
      }
    },
  };
}
