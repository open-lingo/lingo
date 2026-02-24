import type { SRSCardState } from "../data/types";

const STORAGE_KEY = "open-lingo-srs";
const LAST_SYNC_KEY = "open-lingo-srs-last-sync";
const NEXT_SYNC_KEY = "open-lingo-srs-next-sync";

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

/** ISO timestamp of last successful SRS sync to backend. */
export function getLastSrsSyncAt(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(LAST_SYNC_KEY);
}

export function setLastSrsSyncAt(iso: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(LAST_SYNC_KEY, iso);
}

/** ISO timestamp when next auto-sync will run (during review session). Cleared when leaving reviewer. */
export function getNextSrsSyncAt(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(NEXT_SYNC_KEY);
}

export function setNextSrsSyncAt(iso: string | null): void {
  if (typeof window === "undefined") return;
  if (iso) localStorage.setItem(NEXT_SYNC_KEY, iso);
  else localStorage.removeItem(NEXT_SYNC_KEY);
}
