import { useEffect } from "react";
import { useKanaMastery } from "./context";

/** Increments exposure for `kana` once per mount (idempotent within a session). */
export function useTrackExposure(kana: string | null | undefined): void {
  const { registerExposure } = useKanaMastery();
  useEffect(() => {
    if (!kana) return;
    registerExposure(kana);
  }, [kana, registerExposure]);
}

/** True if the helper above `kana` should be visible (i.e. NOT mature yet). */
export function useKanaHelperVisible(kana: string): boolean {
  const { isHelperHidden } = useKanaMastery();
  return !isHelperHidden(kana);
}
