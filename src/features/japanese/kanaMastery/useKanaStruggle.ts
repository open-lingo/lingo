/**
 * React hook over `struggleStore.ts`. Re-renders whenever any
 * notifySRSStoreChanged() event fires (same bus as the SRS engine).
 *
 * Returns `{ scores, record, top }`:
 *   - `scores`: Record<kana, score> for fast O(1) reads in render
 *   - `record(signal, kana)`: write through; bumps the store
 *   - `top(n, candidates?)`: returns top-N struggle kana for the active language
 */
import { useCallback, useMemo } from "react";
import { useSRSStoreRevision } from "@/features/flashcards/SRSStoreRevisionContext";
import {
  getKanaStruggleStore,
  recordKanaStruggle,
  topStruggleKana,
  type StruggleSignal,
} from "./struggleStore";

export type UseKanaStruggleResult = {
  scores: Record<string, number>;
  record: (signal: StruggleSignal, kana: string) => void;
  top: (n: number, candidates?: ReadonlySet<string>) => string[];
};

export function useKanaStruggle(lang: string): UseKanaStruggleResult {
  // Subscribe to the same revision context the SRS engine uses, so any
  // mutation (here or from another consumer) triggers a re-render.
  const revision = useSRSStoreRevision();

  const scores = useMemo<Record<string, number>>(() => {
    const store = getKanaStruggleStore(lang);
    const out: Record<string, number> = {};
    for (const [kana, entry] of Object.entries(store)) {
      out[kana] = entry.score;
    }
    return out;
    // revision is the explicit dep — store reads are otherwise opaque to React.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lang, revision]);

  const record = useCallback(
    (signal: StruggleSignal, kana: string) => {
      recordKanaStruggle(lang, signal, kana);
    },
    [lang],
  );

  const top = useCallback(
    (n: number, candidates?: ReadonlySet<string>) => {
      return topStruggleKana(lang, n, candidates);
      // revision excluded — `top` is queried imperatively at known moments.
    },
    [lang],
  );

  return { scores, record, top };
}
