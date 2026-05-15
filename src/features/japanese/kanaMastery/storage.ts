import type { KanaMasteryStore, KanaMasteryState } from "./types";

const KEY_PREFIX = "kanaMastery:v1:";

export function storageKey(userId: string | null): string {
  return `${KEY_PREFIX}${userId ?? "anon"}`;
}

export function getStore(userId: string | null): KanaMasteryStore {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(storageKey(userId));
    if (!raw) return {};
    return JSON.parse(raw) as KanaMasteryStore;
  } catch {
    return {};
  }
}

export function setStore(userId: string | null, store: KanaMasteryStore): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(storageKey(userId), JSON.stringify(store));
  } catch {
    // ignore quota
  }
}

export function updateState(
  userId: string | null,
  kana: string,
  mutate: (prev: KanaMasteryState | undefined) => KanaMasteryState,
): KanaMasteryState {
  const store = getStore(userId);
  const next = mutate(store[kana]);
  store[kana] = next;
  setStore(userId, store);
  return next;
}

export function clearStore(userId: string | null): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(storageKey(userId));
}
