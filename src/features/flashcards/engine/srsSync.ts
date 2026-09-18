import type { SRSCardState } from "../data/types";
import { notifySRSStoreChanged } from "../SRSStoreRevisionContext";
import { cardLastReviewedAt } from "./srs";
import { getSRSStore, setSRSStore, setLastSrsSyncAt } from "./srsStorage";
import type { SRSStore } from "./srsStorage";

/**
 * DEV-ONLY sync-queue transition hook (lane A11, 2026-09-17 —
 * `docs/device-dev-debug-2026-09-17.md`). `src/shared/dev/remoteConsole.ts`
 * is the only caller of `setSrsSyncObserver`, and only when armed — see the
 * matching doc comment on `setApiRequestObserver` in `shared/api/client.ts`.
 * Events carry counts only (queue depth, batch/id counts, an error
 * MESSAGE) — never a card's own content.
 */
export type SrsSyncEvent =
  | { phase: "enqueued"; queueDepth: number }
  | { phase: "batch_start"; dirtyCount: number; batchSize: number }
  | { phase: "batch_ok"; batchSize: number; syncedCount: number }
  | { phase: "batch_error"; batchSize: number; message: string; anyLanded: boolean };
export type SrsSyncObserver = (event: SrsSyncEvent) => void;
let srsSyncObserver: SrsSyncObserver | null = null;
export function setSrsSyncObserver(fn: SrsSyncObserver | null): void {
  srsSyncObserver = fn;
}

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
/** Depth of the chain right now — incremented on enqueue, decremented once
 *  that op settles. DEV-devlog display only (see `SrsSyncEvent` above);
 *  never read by the real sync logic. */
let _syncQueueDepth = 0;

export function enqueueSyncOp<T>(op: () => Promise<T>): Promise<T> {
  _syncQueueDepth += 1;
  srsSyncObserver?.({ phase: "enqueued", queueDepth: _syncQueueDepth });
  const settle = () => {
    _syncQueueDepth = Math.max(0, _syncQueueDepth - 1);
  };
  const next = _syncChain.then(
    () => op().finally(settle),
    () => op().finally(settle),
  ) as Promise<T>;
  // Chain advances regardless of op outcome; errors still reach the caller.
  _syncChain = next.catch(() => {});
  return next;
}

export async function performSync(
  syncFn: (payload: SyncPayload) => Promise<SRSStore>,
): Promise<number> {
  return enqueueSyncOp(() => performSyncNow(syncFn));
}

/**
 * Cards per sync request. MUST stay <= the server's `MAX_SYNC_CARDS`
 * (`lingo-core/app/srs/schemas.py`), which rejects anything larger with a 422.
 *
 * Why chunk at all — the ceiling is not the payload:
 *
 * - Measured ~437 bytes/card, so the Lambda Function URL's 6 MB buffered cap
 *   is ~14k cards. That is NOT what breaks first.
 * - `upsert_cards` issues one conditional write per card against a 30s
 *   function timeout. That is what breaks first, and a timeout is the bad
 *   failure: the request returns no ids, `markSynced` never runs, every card
 *   stays dirty, and the next sync resends the identical oversized payload.
 *   It does not degrade, it wedges.
 * - gzip does not rescue this. Browsers do not compress request bodies, so the
 *   server-side `GZipMiddleware` shrinks the *response* only; the push is
 *   exactly as large as it ever was.
 *
 * Chunking fixes the shape of the failure as much as the size: each batch
 * marks its own cards synced as it lands, so a mid-sync failure costs one
 * batch and the next sync resumes with the rest still dirty.
 *
 * Ordinary syncs are a handful of cards and fit in one request. Multi-batch is
 * the import / placement-seed / offline-flush path.
 */
export const SRS_SYNC_CHUNK_SIZE = 1000;

/** Split an id list into chunks of at most `size`. */
export function chunkIds(ids: string[], size: number = SRS_SYNC_CHUNK_SIZE): string[][] {
  if (size <= 0) throw new Error("chunk size must be positive");
  const out: string[][] = [];
  for (let i = 0; i < ids.length; i += size) out.push(ids.slice(i, i + size));
  return out;
}

/**
 * Push `cards` (keyed by id) to the server in chunks, marking synced only
 * the ids the server actually echoes back. Shared by the dirty-only push
 * (`performSyncNow`) and the full push (`performFullSyncNow`) below — same
 * partial-progress / per-card-echo rules either way.
 */
async function runSyncBatches(
  cards: SRSStore,
  syncedAt: string,
  syncFn: (payload: SyncPayload) => Promise<SRSStore>,
): Promise<number> {
  const ids = Object.keys(cards);
  if (ids.length === 0) return 0;

  let syncedCount = 0;
  let anyLanded = false;

  // Sequential, not parallel: the batches share one server and one SRS store,
  // and the point here is bounded work per request, not client throughput.
  for (const batchIds of chunkIds(ids)) {
    const batch: SRSStore = {};
    for (const id of batchIds) batch[id] = cards[id];

    // A failed batch must not discard the batches that already landed — their
    // cards are legitimately synced. Stop pushing (the next failure is almost
    // certainly the same one) and let the caller see the error only if nothing
    // landed at all; otherwise report partial progress and leave the remainder
    // dirty for the next sync.
    let serverState: SRSStore;
    srsSyncObserver?.({ phase: "batch_start", dirtyCount: ids.length, batchSize: batchIds.length });
    try {
      serverState = await syncFn({ cards: batch, syncedAt });
    } catch (err) {
      srsSyncObserver?.({
        phase: "batch_error",
        batchSize: batchIds.length,
        message: err instanceof Error ? err.message : String(err),
        anyLanded,
      });
      if (!anyLanded) {
        notifySRSStoreChanged();
        throw err;
      }
      break;
    }

    const returnedIds = Object.keys(serverState ?? {});
    srsSyncObserver?.({ phase: "batch_ok", batchSize: batchIds.length, syncedCount: returnedIds.length });

    // Per-card guard (tightened 2026-07-01 — was payload-level): only mark ids
    // the server actually echoed back in its response as synced. A card the
    // server silently dropped from a partial response stays dirty so the next
    // sync retries it, instead of being marked clean just because SOME card in
    // the batch round-tripped.
    //
    // This is a LIVE gap, not just defensive (2026-09-17 correctness audit,
    // docs/progress-sync-contract-2026-09-17.md): both backend repos
    // (lingo-core `app/db/sqlite/srs.py` + `app/db/dynamo/srs.py`
    // `upsert_cards`) can now legitimately omit a card from the result dict
    // — one card's write error no longer aborts the whole request (it used
    // to: a bare `asyncio.gather` with no `return_exceptions=True` raised on
    // the first failure while leaving sibling writes scheduled-but-unawaited,
    // which on Lambda risked losing them outright if the execution
    // environment froze before they ran). `SRSSyncResponse` also carries an
    // explicit `failedCardIds` for callers that want to distinguish
    // "omitted because it failed" from other shapes, but this guard doesn't
    // need it: `returnedIds` already treats any omission as unsynced,
    // whatever the reason.
    if (returnedIds.length > 0) {
      markSynced(returnedIds);
      setLastSrsSyncAt(new Date().toISOString());
      mergeServerState(serverState);
      syncedCount += returnedIds.length;
      anyLanded = true;
    }
  }

  notifySRSStoreChanged();
  return syncedCount;
}

async function performSyncNow(
  syncFn: (payload: SyncPayload) => Promise<SRSStore>,
): Promise<number> {
  const payload = buildSyncPayload();
  return runSyncBatches(payload.cards, payload.syncedAt, syncFn);
}

/**
 * Build the payload for a FULL push — every card, not just the dirty ones.
 * Used once after a lesson reconcile (see `pushAllSrsCardsOnceAfterReconcile`
 * below) as a safety net: a test-out/placement seed writes hundreds of card
 * intervals via `seedTestOutAtoms` in one localStorage write, and while a
 * freshly-seeded card IS dirty by `computeDirtyCards`'s own rule (no
 * `lastSyncedAt` yet) and should already reach the server through the normal
 * dirty-card push, this is the belt to that braces: if any bookkeeping gap
 * ever marks a card `lastSyncedAt` without an actually-confirmed server
 * write, a full push is the only thing that would still catch it and bring
 * due counts back in line.
 */
export function buildFullSyncPayload(): SyncPayload {
  return {
    cards: getSRSStore(),
    syncedAt: new Date().toISOString(),
  };
}

async function performFullSyncNow(
  syncFn: (payload: SyncPayload) => Promise<SRSStore>,
): Promise<number> {
  const payload = buildFullSyncPayload();
  return runSyncBatches(payload.cards, payload.syncedAt, syncFn);
}

/** Serialized (via `enqueueSyncOp`) full-card push — see `buildFullSyncPayload`. */
export async function performFullSync(
  syncFn: (payload: SyncPayload) => Promise<SRSStore>,
): Promise<number> {
  return enqueueSyncOp(() => performFullSyncNow(syncFn));
}

const FULL_PUSH_AFTER_RECONCILE_MARKER_PREFIX = "lingo_srs_full_push_after_reconcile_v1_";

function fullPushMarkerKey(userId: string): string {
  return `${FULL_PUSH_AFTER_RECONCILE_MARKER_PREFIX}${userId}`;
}

/** Exported for the SyncManager / tests — has this user's one-time post-reconcile full push already run? */
export function hasPushedFullSrsAfterReconcile(userId: string): boolean {
  if (typeof window === "undefined") return false;
  try {
    return localStorage.getItem(fullPushMarkerKey(userId)) === "1";
  } catch {
    return false;
  }
}

function markFullSrsPushedAfterReconcile(userId: string): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(fullPushMarkerKey(userId), "1");
  } catch {
    /* quota — retried on the next reconcile, same as the marker-write pattern in progressReconcile.ts */
  }
}

/** Test seam. */
export function resetFullSrsPushMarkerForTests(userId: string): void {
  try {
    localStorage.removeItem(fullPushMarkerKey(userId));
  } catch {
    /* ignore */
  }
}

/**
 * One-time full SRS push, gated per user (`useProgressReconcile` calls this
 * right after `reconcileLocalProgressToServer` reports `posted > 0` — see
 * docs/handoff-2026-09-18-resume.md §6, "push the phone's full card set once
 * so due counts match"). Only marks itself done once something is confirmed
 * landed (or the store is legitimately empty) — an offline attempt leaves no
 * marker, so the NEXT reconcile retries it, same rule as
 * `progressReconcile.ts`'s own marker.
 */
export async function pushAllSrsCardsOnceAfterReconcile(
  userId: string,
  syncFn: (payload: SyncPayload) => Promise<SRSStore>,
): Promise<number> {
  if (hasPushedFullSrsAfterReconcile(userId)) return 0;
  const totalCards = Object.keys(getSRSStore()).length;
  if (totalCards === 0) {
    markFullSrsPushedAfterReconcile(userId);
    return 0;
  }
  const synced = await performFullSync(syncFn);
  if (synced > 0) {
    markFullSrsPushedAfterReconcile(userId);
  }
  return synced;
}
