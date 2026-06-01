/**
 * Storage for symbol mastery. Keys are scoped by (storage-prefix, user)
 * so language modules can pick their own namespace.
 *
 * Default prefix `kanaMastery:v1:` preserves the JA shape. Other
 * languages should pass an explicit prefix.
 */
import type { SymbolMasteryState, SymbolMasteryStore } from "./types";

/** Default JA-compat prefix. New languages should pass their own. */
export const DEFAULT_KEY_PREFIX = "kanaMastery:v1:";

export function storageKey(
  userId: string | null,
  keyPrefix = DEFAULT_KEY_PREFIX,
): string {
  return `${keyPrefix}${userId ?? "anon"}`;
}

export function getStore(
  userId: string | null,
  keyPrefix?: string,
): SymbolMasteryStore {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(storageKey(userId, keyPrefix));
    if (!raw) return {};
    return JSON.parse(raw) as SymbolMasteryStore;
  } catch {
    return {};
  }
}

export function setStore(
  userId: string | null,
  store: SymbolMasteryStore,
  keyPrefix?: string,
): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(
      storageKey(userId, keyPrefix),
      JSON.stringify(store),
    );
  } catch {
    // ignore quota
  }
}

export function updateState(
  userId: string | null,
  symbol: string,
  mutate: (prev: SymbolMasteryState | undefined) => SymbolMasteryState,
  keyPrefix?: string,
): SymbolMasteryState {
  const store = getStore(userId, keyPrefix);
  const next = mutate(store[symbol]);
  store[symbol] = next;
  setStore(userId, store, keyPrefix);
  return next;
}

export function clearStore(
  userId: string | null,
  keyPrefix?: string,
): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(storageKey(userId, keyPrefix));
}
