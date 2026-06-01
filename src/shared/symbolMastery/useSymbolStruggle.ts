/**
 * React hook over `struggleStore.ts`. Re-renders whenever any
 * notifySRSStoreChanged() event fires (same bus as the SRS engine).
 *
 * Returns `{ scores, record, top }`:
 *   - `scores`: Record<symbol, score> for fast O(1) reads in render
 *   - `record(signal, symbol)`: write through; bumps the store
 *   - `top(n, candidates?)`: returns top-N struggle symbols for the active language
 */
import { useCallback, useMemo } from "react";
import { useSRSStoreRevision } from "@/features/flashcards/SRSStoreRevisionContext";
import {
  getSymbolStruggleStore,
  recordSymbolStruggle,
  topStruggleSymbols,
  type StruggleSignal,
} from "./struggleStore";

export type UseSymbolStruggleResult = {
  scores: Record<string, number>;
  record: (signal: StruggleSignal, symbol: string) => void;
  top: (n: number, candidates?: ReadonlySet<string>) => string[];
};

export function useSymbolStruggle(lang: string): UseSymbolStruggleResult {
  // Subscribe to the same revision context the SRS engine uses, so any
  // mutation (here or from another consumer) triggers a re-render.
  const revision = useSRSStoreRevision();

  const scores = useMemo<Record<string, number>>(() => {
    const store = getSymbolStruggleStore(lang);
    const out: Record<string, number> = {};
    for (const [symbol, entry] of Object.entries(store)) {
      out[symbol] = entry.score;
    }
    return out;
    // revision is the explicit dep — store reads are otherwise opaque to React.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lang, revision]);

  const record = useCallback(
    (signal: StruggleSignal, symbol: string) => {
      recordSymbolStruggle(lang, signal, symbol);
    },
    [lang],
  );

  const top = useCallback(
    (n: number, candidates?: ReadonlySet<string>) => {
      return topStruggleSymbols(lang, n, candidates);
      // revision excluded — `top` is queried imperatively at known moments.
    },
    [lang],
  );

  return { scores, record, top };
}

// Back-compat alias.
export type UseKanaStruggleResult = UseSymbolStruggleResult;
export const useKanaStruggle = useSymbolStruggle;
