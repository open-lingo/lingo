import { useEffect } from "react";
import { useSymbolMastery } from "./context";

/** Increments exposure for `symbol` once per mount (idempotent within a session). */
export function useTrackExposure(symbol: string | null | undefined): void {
  const { registerExposure } = useSymbolMastery();
  useEffect(() => {
    if (!symbol) return;
    registerExposure(symbol);
  }, [symbol, registerExposure]);
}

/** True if the helper above `symbol` should be visible (i.e. NOT mature yet). */
export function useSymbolHelperVisible(symbol: string): boolean {
  const { isHelperHidden } = useSymbolMastery();
  return !isHelperHidden(symbol);
}
