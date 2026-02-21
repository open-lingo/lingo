import type { SRSCardState } from "../data/types";
import { getSRSStore, setSRSStore } from "./srsStorage";
import type { SRSStore } from "./srsStorage";

/**
 * Collect all cards that have been reviewed since their last sync.
 * A card is "dirty" if lastReviewDate > lastSyncedAt (or never synced).
 */
export function getDirtyCards(): SRSStore {
  const store = getSRSStore();
  const dirty: SRSStore = {};

  for (const [cardId, state] of Object.entries(store)) {
    if (!state.lastSyncedAt || state.lastReviewDate > state.lastSyncedAt) {
      dirty[cardId] = state;
    }
  }

  return dirty;
}

/**
 * Mark a set of cards as synced (sets lastSyncedAt to now).
 * Call after a successful backend sync.
 */
export function markSynced(cardIds: string[]): void {
  const store = getSRSStore();
  const now = new Date().toISOString();

  for (const id of cardIds) {
    if (store[id]) {
      store[id] = { ...store[id], lastSyncedAt: now };
    }
  }

  setSRSStore(store);
}

/**
 * Merge server state into local store.
 * Server wins for cards where server lastReviewDate > local lastReviewDate.
 * Local wins otherwise (user reviewed while offline).
 */
export function mergeServerState(serverState: SRSStore): void {
  const local = getSRSStore();

  for (const [cardId, serverCard] of Object.entries(serverState)) {
    const localCard = local[cardId];
    if (!localCard || serverCard.lastReviewDate > localCard.lastReviewDate) {
      local[cardId] = { ...serverCard, lastSyncedAt: new Date().toISOString() };
    }
  }

  setSRSStore(local);
}

export type SyncPayload = {
  cards: Record<string, SRSCardState>;
  syncedAt: string;
};

/**
 * Build the payload for a backend sync request.
 * Only includes dirty (un-synced) cards.
 */
export function buildSyncPayload(): SyncPayload {
  return {
    cards: getDirtyCards(),
    syncedAt: new Date().toISOString(),
  };
}

/**
 * Perform a full sync cycle (call with your API function).
 *
 * Usage:
 *   await performSync(async (payload) => {
 *     const res = await fetch('/api/srs/sync', {
 *       method: 'POST',
 *       body: JSON.stringify(payload),
 *     });
 *     return res.json(); // server returns its full state
 *   });
 */
export async function performSync(
  syncFn: (payload: SyncPayload) => Promise<SRSStore>,
): Promise<number> {
  const payload = buildSyncPayload();
  const dirtyIds = Object.keys(payload.cards);

  if (dirtyIds.length === 0) return 0;

  const serverState = await syncFn(payload);
  markSynced(dirtyIds);

  if (serverState && Object.keys(serverState).length > 0) {
    mergeServerState(serverState);
  }

  return dirtyIds.length;
}
