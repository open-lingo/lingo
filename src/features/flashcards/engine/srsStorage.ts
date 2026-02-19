import type { SRSCardState } from "../data/types";

const STORAGE_KEY = "open-lingo-srs";

export type SRSStore = Record<string, SRSCardState>;

export function getSRSStore(): SRSStore {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as SRSStore;
  } catch {
    return {};
  }
}

export function setSRSStore(store: SRSStore): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch {
    // ignore quota errors
  }
}

export function getCardState(cardId: string): SRSCardState | undefined {
  return getSRSStore()[cardId];
}

export function setCardState(cardId: string, state: SRSCardState): void {
  const store = getSRSStore();
  store[cardId] = state;
  setSRSStore(store);
}

export function clearSRSStore(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEY);
}
