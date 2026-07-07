/**
 * Track B (grammar) backend sync.
 *
 * Server-contract finding (2026-07-01): `lingo-core`'s `/api/core/v1/srs`
 * endpoints are entirely content-agnostic — `SRSSyncRequest.cards` is typed
 * `dict[str, SRSCardState]` (`lingo-core/app/srs/schemas.py`) and both repo
 * backends (`app/db/sqlite/srs.py`, `app/db/dynamo/srs.py`) store/return
 * whatever `card_id` string keys the client sends, with zero atom-id
 * enumeration or validation anywhere in the path. So grammar cards can ride
 * the SAME sync pipeline as vocab (`SrsApi.sync`/`getState`) — no server
 * change needed.
 *
 * Reuses the store-agnostic dirty-detection / merge helpers exported by
 * `./srsSync` (`computeDirtyCards`, `mergeStates`, `markSyncedIn`) so Track
 * A and Track B share byte-identical LWW + `manualResetAt` merge semantics
 * instead of a second hand-copied implementation drifting from the first.
 *
 * Namespacing: grammar point ids (`n5-grammar-points.json`, e.g.
 * "wa-topic") never contain a colon (see `grammarSrs.ts` doc), while vocab
 * atom ids are always canonicalized to `<lang>:<bare>` (ADR-005, currently
 * `ja:<bare>`). Prefixing grammar ids as `grammar:<pointId>` on the wire
 * therefore guarantees they can never collide with a vocab key server-side.
 * The LOCAL grammar store (`open-lingo-srs-grammar:v1`, `./grammarSrs.ts`)
 * is untouched — still keyed by bare pointId; namespacing only happens at
 * the payload/response boundary in this module.
 *
 * Cross-track isolation on full hydrate: `/srs/state` returns the user's
 * ENTIRE card map (vocab + grammar interleaved once both have synced).
 * `partitionSyncStore` splits that by the `grammar:` prefix BEFORE either
 * track's merge runs, so Track A's `mergeServerState` never sees a
 * `grammar:*` key (which would otherwise get ingested as a bogus vocab
 * card) and this module never sees a `ja:*` key. The dirty-sync path
 * (`performSync`/`performGrammarSync` → `SrsApi.sync`) doesn't need this:
 * each track's payload only ever contains its own prefix, and the server
 * only echoes back the keys it was sent.
 */
import { notifySRSStoreChanged } from "../SRSStoreRevisionContext";
import { computeDirtyCards, mergeStates, markSyncedIn } from "./srsSync";
import type { SyncPayload } from "./srsSync";
import type { SRSStore } from "./srsStorage";
import { getGrammarStore, setGrammarStore } from "./grammarSrs";

export const GRAMMAR_KEY_PREFIX = "grammar:";

function namespace(pointId: string): string {
  return `${GRAMMAR_KEY_PREFIX}${pointId}`;
}

/** Strips the `grammar:` prefix; returns null for keys that don't carry it. */
function denamespace(key: string): string | null {
  return key.startsWith(GRAMMAR_KEY_PREFIX)
    ? key.slice(GRAMMAR_KEY_PREFIX.length)
    : null;
}

/**
 * Split a full server card map (as returned by `/srs/state`) into its
 * vocab and grammar slices, keyed the way each track's local store expects
 * (vocab keys pass through as-is; grammar keys are de-namespaced back to
 * bare pointIds). Use this BEFORE feeding a full-state response to either
 * track's merge — see module doc.
 */
export function partitionSyncStore(store: SRSStore): {
  vocab: SRSStore;
  grammar: SRSStore;
} {
  const vocab: SRSStore = {};
  const grammar: SRSStore = {};
  for (const [key, state] of Object.entries(store)) {
    const pointId = denamespace(key);
    if (pointId) grammar[pointId] = state;
    else vocab[key] = state;
  }
  return { vocab, grammar };
}

/** Grammar-store cards reviewed since their last sync. Keyed by bare pointId (local shape) — namespacing happens only in `buildGrammarSyncPayload`. */
export function getDirtyGrammarCards(): SRSStore {
  return computeDirtyCards(getGrammarStore());
}

/**
 * Build the Track B sync payload — same `SyncPayload` shape `SrsApi.sync`
 * expects, with card keys namespaced `grammar:<pointId>` so they land in
 * the shared per-user card map without colliding with vocab keys.
 */
export function buildGrammarSyncPayload(): SyncPayload {
  const dirty = getDirtyGrammarCards();
  const cards: SyncPayload["cards"] = {};
  for (const [pointId, state] of Object.entries(dirty)) {
    cards[namespace(pointId)] = state;
  }
  return { cards, syncedAt: new Date().toISOString() };
}

/**
 * Merge an ALREADY-partitioned grammar slice (keys are bare pointIds, the
 * local store's own shape — e.g. the `grammar` half of a
 * `partitionSyncStore` call) into the local grammar store. Building block
 * for callers that partition a full-state response once and feed each
 * track's merge separately (see `SRSPendingSync`), so the response isn't
 * re-partitioned per track.
 */
export function mergeGrammarStore(scopedGrammarStore: SRSStore): void {
  if (Object.keys(scopedGrammarStore).length === 0) return;
  const local = getGrammarStore();
  const now = new Date().toISOString();
  setGrammarStore(mergeStates(local, scopedGrammarStore, now));
}

/**
 * Merge a (possibly mixed/still-namespaced) server card map into the local
 * grammar store. Only `grammar:`-namespaced keys are consumed; anything
 * else is ignored — defensive against being handed an unpartitioned
 * full-state response.
 */
export function mergeGrammarServerState(serverState: SRSStore): void {
  const { grammar: scoped } = partitionSyncStore(serverState);
  mergeGrammarStore(scoped);
}

function markGrammarSynced(pointIds: string[]): void {
  const store = getGrammarStore();
  const now = new Date().toISOString();
  setGrammarStore(markSyncedIn(store, pointIds, now));
}

/**
 * Perform a full Track B sync cycle. Takes the SAME `syncFn` shape as
 * `performSync` (both ultimately call `SrsApi.sync` — the endpoint is
 * content-agnostic per the server-contract finding above); callers wire
 * both together so grammar syncs on the same cadence as vocab. Mirrors
 * `performSync`'s per-card-echo guard (only ids the server actually
 * returned are marked synced).
 */
export async function performGrammarSync(
  syncFn: (payload: SyncPayload) => Promise<SRSStore>,
): Promise<number> {
  const payload = buildGrammarSyncPayload();
  if (Object.keys(payload.cards).length === 0) return 0;

  const serverState = await syncFn(payload);
  const { grammar: returned } = partitionSyncStore(serverState ?? {});
  const returnedPointIds = Object.keys(returned);

  if (returnedPointIds.length > 0) {
    markGrammarSynced(returnedPointIds);
    mergeGrammarServerState(serverState);
  }

  notifySRSStoreChanged();
  return returnedPointIds.length;
}

/**
 * Hydrate the local grammar store from a full server card map (e.g. on app
 * load). Pass the SAME `getStateFn` used for Track A's `hydrateFromServer`
 * — both read `SrsApi.getState()` once; this side only consumes the
 * `grammar:`-namespaced slice.
 */
export async function hydrateGrammarFromServer(
  getStateFn: () => Promise<SRSStore>,
): Promise<void> {
  const serverState = await getStateFn();
  const { grammar: scoped } = partitionSyncStore(serverState ?? {});
  if (Object.keys(scoped).length > 0) {
    mergeGrammarStore(scoped);
    notifySRSStoreChanged();
  }
}
