/**
 * SymbolStruggleStore — per-symbol "how hard is this for the learner" score,
 * tracked client-side until Phase 2a swaps in FSRS-6 stability.
 *
 * Signals (bump score on these):
 *   incorrect answer:        +12
 *   correct answer:          −6 (clamped at 0)
 *   answer time > 5s:         +4
 *   hint used:                +6
 *   bypassed via "show me":  +10
 *
 * Per-language scoping: `lingo_kana_struggle_v1` localStorage key holds
 * a `Record<langId, Record<symbol, SymbolStruggleEntry>>` shape so the
 * same device can track multiple languages without collision. (Storage
 * key name preserved for compat; per-language stores branch within.)
 *
 * The carry-over picker in `lessonBuilder` reads this store at build time.
 * The runtime `RowTestStep` runner reads it on construction to bias the
 * initial queue toward struggle items.
 *
 * Notifies via `notifySRSStoreChanged()` (Trevor's existing event bus) so
 * any consuming `useSymbolStruggle()` hook subscribers re-render on writes.
 */

import { notifySRSStoreChanged } from "@/features/flashcards/SRSStoreRevisionContext";

export type SymbolStruggleEntry = {
  /** The symbol surface (kept as `kana` for storage shape compat). */
  kana: string;
  /** Higher = harder. Clamped to [0, 100]. */
  score: number;
  /** ISO timestamp of last update. */
  updatedAt: string;
};

export type SymbolStruggleStore = Record<string, SymbolStruggleEntry>;

export type StruggleSignal =
  | "incorrect"
  | "correct"
  | "slow"
  | "hint"
  | "reveal";

/** Back-compat aliases for the JA names. */
export type KanaStruggleEntry = SymbolStruggleEntry;
export type KanaStruggleStore = SymbolStruggleStore;

const STORAGE_KEY = "lingo_kana_struggle_v1";
const MAX_SCORE = 100;
const SIGNAL_DELTA: Record<StruggleSignal, number> = {
  incorrect: 12,
  correct: -6,
  slow: 4,
  hint: 6,
  reveal: 10,
};

type RootStore = Record<string, SymbolStruggleStore>;

function loadRoot(): RootStore {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as RootStore;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function saveRoot(root: RootStore): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(root));
  } catch {
    // ignore quota errors
  }
}

export function getSymbolStruggleStore(lang: string): SymbolStruggleStore {
  const root = loadRoot();
  return root[lang] ?? {};
}

export function recordSymbolStruggle(
  lang: string,
  signal: StruggleSignal,
  symbol: string,
): SymbolStruggleEntry {
  if (!symbol) {
    // Defensive — empty symbol is a no-op but we still return a stub entry.
    return { kana: "", score: 0, updatedAt: new Date().toISOString() };
  }
  const root = loadRoot();
  const lang_store: SymbolStruggleStore = root[lang] ?? {};
  const prev = lang_store[symbol];
  const prevScore = prev?.score ?? 0;
  const delta = SIGNAL_DELTA[signal];
  const nextScore = Math.max(0, Math.min(MAX_SCORE, prevScore + delta));
  const entry: SymbolStruggleEntry = {
    kana: symbol,
    score: nextScore,
    updatedAt: new Date().toISOString(),
  };
  lang_store[symbol] = entry;
  root[lang] = lang_store;
  saveRoot(root);
  notifySRSStoreChanged();
  return entry;
}

/**
 * Return the `topN` most-struggled symbols from `lang`'s store. Optionally
 * scoped to a candidate symbol set (used by the carry-over picker so we only
 * surface items the learner has met in earlier sub-lessons of THIS row).
 *
 * Sort: score descending, then `updatedAt` descending (most recent struggle
 * first), so two items with the same score still resolve to a stable but
 * recency-aware order.
 */
export function topStruggleSymbols(
  lang: string,
  topN: number,
  candidates?: ReadonlySet<string>,
): string[] {
  const store = getSymbolStruggleStore(lang);
  const entries = Object.values(store).filter((e) => {
    if (!candidates) return true;
    return candidates.has(e.kana);
  });
  entries.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return b.updatedAt.localeCompare(a.updatedAt);
  });
  return entries.slice(0, Math.max(0, topN)).map((e) => e.kana);
}

export function clearSymbolStruggleStore(lang?: string): void {
  if (typeof window === "undefined") return;
  if (!lang) {
    window.localStorage.removeItem(STORAGE_KEY);
    notifySRSStoreChanged();
    return;
  }
  const root = loadRoot();
  delete root[lang];
  saveRoot(root);
  notifySRSStoreChanged();
}

// Back-compat aliases (JA-named exports). Phase 2 call sites can drop them.
export const getKanaStruggleStore = getSymbolStruggleStore;
export const recordKanaStruggle = recordSymbolStruggle;
export const topStruggleKana = topStruggleSymbols;
export const clearKanaStruggleStore = clearSymbolStruggleStore;
