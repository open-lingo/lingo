import type { SRSCardState } from "../data/types";
import { notifySRSStoreChanged } from "../SRSStoreRevisionContext";
import { cardLastReviewedAt } from "./srs";
import { getSRSStore, setSRSStore, setLastSrsSyncAt } from "./srsStorage";
import type { SRSStore } from "./srsStorage";

/**
 * Collect all cards in `store` that have been reviewed since their last
 * sync. A card is "dirty" if the most-recent review across modalities is
 * newer than the last sync (or it's never been synced).
 *
 * Store-agnostic — pulled out of `getDirtyCards` so Track B
 * (`./grammarSync`) can reuse the exact same rule against the grammar
 * store instead of re-implementing it.
 */
export function computeDirtyCards(store: SRSStore): SRSStore {
  const dirty: SRSStore = {};

  for (const [cardId, state] of Object.entries(store)) {
    const lastReview = cardLastReviewedAt(state);
    // Why: use ISO-timestamp comparison; lastSyncedAt is an ISO timestamp,
    // so day-level lastReviewDate comparisons gave false positives all day.
    if (!state.lastSyncedAt || lastReview > state.lastSyncedAt) {
      // Ensure a top-level lastReviewedAt ships with the payload — the
      // server requires it as a string for the LWW key.
      dirty[cardId] = state.lastReviewedAt
        ? state
        : { ...state, lastReviewedAt: lastReview };
    }
  }

  return dirty;
}

/**
 * Collect all cards that have been reviewed since their last sync.
 * A card is "dirty" if the most-recent review across modalities is
 * newer than the last sync (or it's never been synced).
 */
export function getDirtyCards(): SRSStore {
  return computeDirtyCards(getSRSStore());
}

/**
 * Stamp `lastSyncedAt = now` for the given ids in `store`, returning a new
 * store object. Store-agnostic — see `computeDirtyCards`.
 */
export function markSyncedIn(store: SRSStore, cardIds: string[], now: string): SRSStore {
  const next = { ...store };
  for (const id of cardIds) {
    if (next[id]) {
      next[id] = { ...next[id], lastSyncedAt: now };
    }
  }
  return next;
}

/**
 * Mark a set of cards as synced (sets lastSyncedAt to now).
 * Call after a successful backend sync.
 */
export function markSynced(cardIds: string[]): void {
  const store = getSRSStore();
  const now = new Date().toISOString();
  setSRSStore(markSyncedIn(store, cardIds, now));
}

/**
 * True if state is an explicit, DELIBERATE reset — the user hit "reset" in
 * Card Manager (`useCardManagerData.handleReset`, which stamps
 * `manualResetAt`). Requires the marker AND the reset shape (both
 * modalities at phase "new" with zero reps).
 *
 * The shape alone is NOT sufficient: a card seeded by unlock
 * (`seedSchedule.createSeededState`) or by placement
 * (`applyPlacementResult`) is also `new`/`reps===0` but was never
 * reviewed — it must NOT be treated as a reset, or it would silently beat
 * genuine learned server state on hydrate (a seeded-but-untouched local
 * card should always lose to server progress).
 *
 * Exported (with `isLearnedState`) so `./grammarSync` can share the exact
 * reset-preservation rule via `mergeStates` below instead of copying it.
 */
export function isResetState(state: SRSCardState): boolean {
  return (
    !!state.manualResetAt &&
    state.recognition.state === "new" &&
    state.recognition.reps === 0 &&
    state.production.state === "new" &&
    state.production.reps === 0
  );
}

export function isLearnedState(state: SRSCardState): boolean {
  return (
    state.recognition.state !== "new" ||
    state.recognition.reps > 0 ||
    state.production.state !== "new" ||
    state.production.reps > 0
  );
}

/**
 * Merge `serverState` into `local`, returning a new store.
 * Server wins for cards where server's most-recent review across modalities
 * beats local's. Local wins otherwise (user reviewed while offline).
 * Local reset is never overwritten by server "learned" state so that resets
 * persist even with clock skew or failed sync.
 *
 * Store-agnostic — see `computeDirtyCards`.
 */
export function mergeStates(local: SRSStore, serverState: SRSStore, now: string): SRSStore {
  const merged = { ...local };

  for (const [cardId, serverCard] of Object.entries(serverState)) {
    const localCard = merged[cardId];
    const serverIsNewer =
      !localCard ||
      cardLastReviewedAt(serverCard) > cardLastReviewedAt(localCard);
    const localIsReset = localCard && isResetState(localCard);
    const serverIsLearned = isLearnedState(serverCard);
    const keepLocalReset = localIsReset && serverIsLearned;

    if (serverIsNewer && !keepLocalReset) {
      merged[cardId] = { ...serverCard, lastSyncedAt: now };
    }
    // Why (M9): don't churn lastSyncedAt for unchanged cards. The previous
    // implementation only wrote when serverIsNewer, so that's already
    // correct — keep the no-op branch explicit for the next reader.
  }

  return merged;
}

/**
 * Merge server state into local store.
 */
export function mergeServerState(serverState: SRSStore): void {
  const local = getSRSStore();
  const now = new Date().toISOString();
  setSRSStore(mergeStates(local, serverState, now));
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
/**
 * Serialize every SRS sync POST through one chain. The ApiClient's
 * `tag: "srs:sync"` dedup ABORTS the previous in-flight request when a new
 * one starts — correct for reads, fatal for sync: `SRSPendingSync` (boot
 * push) and `useSRSyncSession` (reviewer mount push) race whenever both see
 * dirty cards, and the mutual aborts mean NOTHING lands (observed live with
 * a 394-card Anki-import payload: two net::ERR_ABORTED, zero server writes;
 * small payloads just lose the race less often). Queueing instead of
 * cancelling makes concurrent callers take turns; each still builds its
 * payload at run time, so a second caller pushes whatever is STILL dirty
 * after the first finishes (usually nothing) rather than double-sending.
 */
let _syncChain: Promise<unknown> = Promise.resolve();

export function enqueueSyncOp<T>(op: () => Promise<T>): Promise<T> {
  const next = _syncChain.then(op, op);
  // Chain advances regardless of op outcome; errors still reach the caller.
  _syncChain = next.catch(() => {});
  return next;
}

export async function performSync(
  syncFn: (payload: SyncPayload) => Promise<SRSStore>,
): Promise<number> {
  return enqueueSyncOp(() => performSyncNow(syncFn));
}

async function performSyncNow(
  syncFn: (payload: SyncPayload) => Promise<SRSStore>,
): Promise<number> {
  const payload = buildSyncPayload();
  const dirtyIds = Object.keys(payload.cards);

  if (dirtyIds.length === 0) return 0;

  const serverState = await syncFn(payload);
  const returnedIds = Object.keys(serverState ?? {});

  // Per-card guard (tightened 2026-07-01 — was payload-level): only mark ids
  // the server actually echoed back in its response as synced. A card the
  // server silently dropped from a partial response stays dirty so the next
  // sync retries it, instead of being marked clean just because SOME card in
  // the batch round-tripped. Verified against both backend repos
  // (lingo-core `app/db/sqlite/srs.py` + `app/db/dynamo/srs.py`
  // `upsert_cards`): every submitted card_id is always present in the
  // result dict (barring a thrown exception, which propagates and never
  // reaches here), so in practice `returnedIds` today always equals
  // `dirtyIds` — this guard is defensive against a future/partial response
  // shape, not a live gap.
  if (returnedIds.length > 0) {
    markSynced(returnedIds);
    setLastSrsSyncAt(new Date().toISOString());
    mergeServerState(serverState);
  }

  notifySRSStoreChanged();
  return returnedIds.length;
}
