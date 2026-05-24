import type { SRSCardState } from "../data/types";
import { notifySRSStoreChanged } from "../SRSStoreRevisionContext";
import { cardLastReviewDate } from "./srs";
import { getSRSStore, setSRSStore, setLastSrsSyncAt } from "./srsStorage";
import type { SRSStore } from "./srsStorage";

/**
 * Collect all cards that have been reviewed since their last sync.
 * A card is "dirty" if the most-recent review across modalities is
 * newer than the last sync (or it's never been synced).
 */
export function getDirtyCards(): SRSStore {
  const store = getSRSStore();
  const dirty: SRSStore = {};

  for (const [cardId, state] of Object.entries(store)) {
    const lastReview = cardLastReviewDate(state);
    if (!state.lastSyncedAt || lastReview > state.lastSyncedAt) {
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
 * True if state looks like an explicit reset (new/forgotten card) — BOTH
 * modalities at phase "new" with zero reps. An intentionally-reset card
 * matches; any partial progress on either modality means the card is
 * mid-learning and should NOT be treated as a reset.
 */
function isResetState(state: SRSCardState): boolean {
  return (
    state.recognition.state === "new" &&
    state.recognition.reps === 0 &&
    state.production.state === "new" &&
    state.production.reps === 0
  );
}

function isLearnedState(state: SRSCardState): boolean {
  return (
    state.recognition.state !== "new" ||
    state.recognition.reps > 0 ||
    state.production.state !== "new" ||
    state.production.reps > 0
  );
}

/**
 * Merge server state into local store.
 * Server wins for cards where server's most-recent review across modalities
 * beats local's. Local wins otherwise (user reviewed while offline).
 * Local reset is never overwritten by server "learned" state so that resets
 * persist even with clock skew or failed sync.
 */
export function mergeServerState(serverState: SRSStore): void {
  const local = getSRSStore();
  const now = new Date().toISOString();

  for (const [cardId, serverCard] of Object.entries(serverState)) {
    const localCard = local[cardId];
    const serverIsNewer =
      !localCard ||
      cardLastReviewDate(serverCard) > cardLastReviewDate(localCard);
    const localIsReset = localCard && isResetState(localCard);
    const serverIsLearned = isLearnedState(serverCard);
    const keepLocalReset = localIsReset && serverIsLearned;

    if (serverIsNewer && !keepLocalReset) {
      local[cardId] = { ...serverCard, lastSyncedAt: now };
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
 * Hydrate local SRS store from the server (e.g. on app load after refresh).
 * Call when authenticated so Card Manager and due counts show server state.
 */
export async function hydrateFromServer(
  getStateFn: () => Promise<SRSStore>,
): Promise<void> {
  const serverState = await getStateFn();
  if (serverState && Object.keys(serverState).length > 0) {
    mergeServerState(serverState);
    notifySRSStoreChanged();
  }
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

  // Only mark as synced and merge when the server actually returned state.
  // If sync fails (e.g. 404/501), we get {} and should not mark synced so
  // the user can retry and the card stays dirty.
  if (serverState && Object.keys(serverState).length > 0) {
    markSynced(dirtyIds);
    setLastSrsSyncAt(new Date().toISOString());
    mergeServerState(serverState);
  }

  notifySRSStoreChanged();
  return dirtyIds.length;
}
