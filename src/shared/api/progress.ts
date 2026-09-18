import { ApiClient } from "./client";

const PREFIX = "/api/core/v1/progress";

// ─── Server schema mirrors ──────────────────────────────────────────────────

/**
 * Hard cap on `attempts` per POST /progress/lessons/batch —
 * `lingo-core/app/progress/schemas.py:100`:
 *
 *   attempts: list[BatchAttempt] = Field(min_length=1, max_length=100)
 *
 * FastAPI validates the body BEFORE the handler runs, so an oversized POST
 * is rejected **in full** with a 422 (no partial success, no per-attempt
 * results). Every caller must chunk to this size. TestFlight b18 #144: a
 * 490-attempt test-out batch was silently discarded this way.
 */
export const MAX_ATTEMPTS_PER_BATCH = 100;

/**
 * Per-attempt duration floor — `lingo-core/app/progress/router.py:363`:
 *
 *   min_duration = max(5, len(item.stepResults))
 *   if item.durationSec < min_duration: -> accepted=False,
 *                                          reason="duration_below_floor"
 *
 * A row under the floor is dropped before `update_lesson_rollup`, so it
 * never becomes a completion. Synthesised rows (test-out) carry no step
 * results, which makes 5s the effective floor for them.
 */
export const SERVER_DURATION_FLOOR_SEC = 5;

/** Server clamps above this (`_MAX_DURATION_SEC`); mirrored to avoid churn. */
export const SERVER_DURATION_CEILING_SEC = 3600;

export interface GradedStepResult {
  stepIdx: number;
  conceptIds: string[];
  correct: boolean;
  durationMs?: number;
}

export interface BatchAttempt {
  clientAttemptId: string;
  lessonId: string;
  attemptedAt: string;
  durationSec: number;
  passed: boolean;
  score: number;
  stepResults: GradedStepResult[];
  /** Mid-lesson snapshot. Server persists step results but skips event
   *  emission so quest progress + leaderboard don't advance until the
   *  user actually finishes the lesson. */
  isDraft?: boolean;
  /** Synthesised from a placement-test pass or per-module test-out.
   *  Persists the lesson as completed (course-map unlock) but server
   *  gates XP + lingots to zero so the flow can't be farmed. */
  isTestOut?: boolean;
}

export interface BatchAttemptSubmission {
  attempts: BatchAttempt[];
  /** Hint to the server that this is the first sync of a new local day for
   *  the user, so it should run the streak-update path (GetItem + conditional
   *  UpdateItem on the user row). Absent / false: skip that work. The client
   *  owns this — see `features/lesson/engine/sessionStreak.ts`. */
  checkStreak?: boolean;
}

export interface BatchAttemptResult {
  clientAttemptId: string;
  attemptId?: string;
  accepted: boolean;
  reason?: string;
  xpEarned: number;
  streakAfter: number;
  lingotsEarned: number;
  dailyTotalLessons: number;
}

export interface BatchAttemptResponse {
  results: BatchAttemptResult[];
}

/**
 * Body of `POST /progress/lessons/bulk-complete` (2026-09-18) — the
 * ids-only sibling of `lessons/batch` for a seeded test-out/placement pass.
 * A seed carries no per-lesson attempt data (no duration, no step results),
 * so it never belonged in the N-rows-per-POST shape `lessons/batch` needs
 * for REAL attempts — that shape is exactly what made a 491-lesson test-out
 * into 491 individually-failable writes, one of which sat queued on a
 * client for weeks. `lessons/batch` is unchanged and still the only path
 * for real attempts (durations, accuracy, XP).
 */
export interface BulkCompleteSubmission {
  lang: string;
  source: "test_out" | "placement";
  lessonIds: string[];
  completedAt: string;
  /** Client-generated id for idempotent retries of the WHOLE op — a repeat
   *  with the same id returns the server's cached counts rather than
   *  re-deriving them. Server caps at 1000 ids (413 above). */
  clientOpId: string;
}

export interface BulkCompleteResponse {
  /** Lesson ids this call's own `firstPassedAt` write just set — a
   *  genuinely new completion. */
  accepted: number;
  /** Lesson ids that already had `firstPassedAt` set (from a prior
   *  bulk-complete OR a real `lessons/batch` attempt) — first-wins, never
   *  double-applied. */
  alreadyComplete: number;
  total: number;
}

export interface UserStats {
  streak: number;
  bestStreak: number;
  lastActiveDate: string | null;
  xp: number;
  level: number;
  lingots: number;
}

export interface LessonRollup {
  lessonId: string;
  bestScore: number;
  firstPassedAt: string | null;
  latestAttemptAt: string;
  attemptCount: number;
}

export interface ConceptRollup {
  conceptId: string;
  encounters: number;
  correctCount: number;
  incorrectCount: number;
  recentResults: boolean[];
  avgDurationMs?: number;
  firstSeenAt: string;
  lastSeenAt: string;
  lastCorrectAt?: string;
}

export interface DayActivity {
  date: string;
  lessonsCompleted: number;
  minutesActive: number;
  xpEarned: number;
}

export interface ProgressSummary {
  user: UserStats;
  lessons: LessonRollup[];
  concepts: ConceptRollup[];
  last30days: DayActivity[];
}

export interface TouchResponse {
  user: UserStats;
  streakUpdated: boolean;
  staleConceptIds: string[];
}

export interface AttemptSummary {
  attemptId: string;
  lessonId: string;
  attemptedAt: string;
  durationSec: number;
  passed: boolean;
  score: number;
}

export interface AttemptList {
  items: AttemptSummary[];
  nextCursor: string | null;
}

export interface UnlockMapResponse {
  unlockedAtoms: string[];
}

export interface ShopPurchaseResponse {
  itemId: string;
  price: number;
  lingotsRemaining: number;
  owned: boolean;
  quantity: number;
}


/**
 * How long a just-fetched `/progress/me` answers later callers without a new
 * round-trip. Sized to swallow one sync cascade (direct getMe →
 * invalidateQueries → refetch), not to hide real cross-device changes.
 */
export const PROGRESS_ME_COALESCE_MS = 1500;

export class ProgressApi extends ApiClient {
  /** In-flight/just-resolved `/progress/me`, keyed by acting user. */
  private _meFlight: { key: string; at: number; promise: Promise<ProgressSummary | null> } | null =
    null;

  /**
   * Serializes every `/progress/lessons/batch` POST through one chain, per
   * instance. Same shape as `enqueueSyncOp` in `features/flashcards/engine/
   * srsSync.ts` and the same reason: this method always posts with
   * `tag: "progress:batch"`, and `ApiClient`'s tag dedup ABORTS the previous
   * in-flight request when a new one with the same tag starts.
   *
   * 2026-09-18 sync-stuck investigation (docs/progress-sync-contract-
   * 2026-09-17.md, handoff-2026-09-18-resume.md §6): `LessonProgressHydrate`
   * mounts THREE independent effects that can each call `batchAttempts` —
   * its own boot push (`syncLessonProgressWithServer`), its periodic-tick
   * `runIfDirty`, and `useProgressReconcile`'s local→server catch-up — none
   * of which coordinate with each other (the periodic tick and the boot push
   * share one `inFlight` lock inside `features/lesson/engine/progressSync.ts`,
   * but `progressReconcile.ts`'s own `inFlight` guard is a SEPARATE lock that
   * only coalesces reconcile-vs-reconcile calls). A test-out reconcile that
   * starts while the regular lesson push is still in flight — the common
   * case at boot, since both are gated on the same `isProgressReady` signal —
   * gets its own request silently aborted by the other one's, and vice
   * versa. `postAttemptChunks`/`drainTestOutSyncQueue` treat an abort as an
   * ordinary transport failure and leave the rows queued for the next retry,
   * so nothing is LOST — but if the two effects keep re-firing close enough
   * together (they do: every successful sync invalidates `/progress/me`,
   * which re-triggers `useProgressReconcile`'s effect), the same rows can
   * keep losing the race indefinitely. This is the exact failure shape SRS
   * hit and fixed with `enqueueSyncOp` (`srsSync.ts`, "two net::ERR_ABORTED,
   * zero server writes" on a 394-card payload) — `progress:batch` had no
   * equivalent. Queueing here, at the one method every batch-write caller
   * goes through, closes it for all of them (performLessonSync,
   * testOutSyncQueue's drain, syncTestOutToServer) without touching any
   * call site.
   */
  private _batchChain: Promise<unknown> = Promise.resolve();

  /** Flush buffered lesson attempts in one batch. Returns per-attempt results. */
  batchAttempts(
    payload: BatchAttemptSubmission,
    opts?: { keepalive?: boolean },
  ): Promise<BatchAttemptResponse> {
    const op = () => this._batchAttemptsNow(payload, opts);
    const next = this._batchChain.then(op, op);
    // Chain advances regardless of outcome; the error still reaches this caller.
    this._batchChain = next.catch(() => {});
    return next;
  }

  /**
   * Own serialized chain, own tag — same shape and same reason as
   * `_batchChain`/`batchAttempts` above (a shared tag aborts a prior
   * in-flight request when a new one starts; without this two concurrent
   * bulk-complete callers — a fresh test-out and a reconcile pass racing at
   * boot — could abort each other exactly like `progress:batch` used to).
   * A separate chain from `_batchChain` on purpose: these hit a different
   * endpoint and have no reason to wait on each other.
   */
  private _bulkChain: Promise<unknown> = Promise.resolve();

  /** Seeded (test-out/placement) lesson completions, ids only. See
   *  `BulkCompleteSubmission`'s docstring for why this exists as a sibling
   *  to `batchAttempts` rather than reusing it. */
  bulkComplete(payload: BulkCompleteSubmission): Promise<BulkCompleteResponse> {
    const op = () => this._bulkCompleteNow(payload);
    const next = this._bulkChain.then(op, op);
    this._bulkChain = next.catch(() => {});
    return next;
  }

  private async _bulkCompleteNow(payload: BulkCompleteSubmission): Promise<BulkCompleteResponse> {
    try {
      const res = await this.post<BulkCompleteResponse>(
        `${PREFIX}/lessons/bulk-complete`,
        payload,
        { tag: "progress:bulk-complete" },
      );
      return res ?? { accepted: 0, alreadyComplete: 0, total: payload.lessonIds.length };
    } catch (err: unknown) {
      const status =
        err && typeof err === "object" && "status" in err
          ? (err as { status: number }).status
          : 0;
      // Backend not yet wired — pretend nothing landed so the queue stays
      // dirty and retries later, same convention as `_batchAttemptsNow`.
      if (status === 404 || status === 501) {
        return { accepted: 0, alreadyComplete: 0, total: payload.lessonIds.length };
      }
      throw err;
    }
  }

  private async _batchAttemptsNow(
    payload: BatchAttemptSubmission,
    opts?: { keepalive?: boolean },
  ): Promise<BatchAttemptResponse> {
    try {
      const res = await this.post<BatchAttemptResponse>(
        `${PREFIX}/lessons/batch`,
        payload,
        { tag: "progress:batch", keepalive: opts?.keepalive },
      );
      return res ?? { results: [] };
    } catch (err: unknown) {
      const status =
        err && typeof err === "object" && "status" in err
          ? (err as { status: number }).status
          : 0;
      // Backend not yet wired — pretend nothing was accepted so the buffer
      // stays dirty and we retry later.
      if (status === 404 || status === 501) return { results: [] };
      throw err;
    }
  }

  /** Wipe server-side progress and reset stats (Start over). */
  async resetMe(): Promise<void> {
    await this.delete(`${PREFIX}/me`, { tag: "progress:reset" });
  }

  /**
   * Aggregate for page render (lessons + concepts + daily + user stats).
   *
   * Coalesced (b19): the iPad logged ~11 of these in 5 s. The callers are
   * all legitimate — the react-query hook, the invalidate+refetch pair after
   * every sync, and the DIRECT call inside `hydrateLessonProgressFromServer`
   * that runs on boot, on the 30s tick and on every lesson unmount — and
   * react-query can only dedupe its own. One in-flight promise per acting
   * user, plus a short tail, collapses a whole cascade into one GET. Pass
   * `{ force: true }` for a deliberate re-read (resume, pull-to-refresh).
   */
  async getMe(
    signal?: AbortSignal,
    opts?: { force?: boolean },
  ): Promise<ProgressSummary | null> {
    const key = this.impersonationTargetId ?? "";
    const now = Date.now();
    const flight = this._meFlight;
    if (
      !opts?.force &&
      flight &&
      flight.key === key &&
      now - flight.at < PROGRESS_ME_COALESCE_MS
    ) {
      return flight.promise;
    }
    const promise = this._fetchMe(signal);
    this._meFlight = { key, at: now, promise };
    // A rejection must not be served to later callers for the whole window.
    void promise.catch(() => {
      if (this._meFlight?.promise === promise) this._meFlight = null;
    });
    return promise;
  }

  private async _fetchMe(signal?: AbortSignal): Promise<ProgressSummary | null> {
    try {
      return await this.get<ProgressSummary>(`${PREFIX}/me`, {
        signal,
        tag: "progress:me",
      });
    } catch (err: unknown) {
      const status =
        err && typeof err === "object" && "status" in err
          ? (err as { status: number }).status
          : 0;
      if (status === 404 || status === 501) return null;
      throw err;
    }
  }

  /** Lightweight session-start hook. Tick streak + surface stale concepts. */
  async touch(): Promise<TouchResponse | null> {
    try {
      return await this.post<TouchResponse>(
        `${PREFIX}/me/touch`,
        {},
        { tag: "progress:touch" },
      );
    } catch (err: unknown) {
      const status =
        err && typeof err === "object" && "status" in err
          ? (err as { status: number }).status
          : 0;
      if (status === 404 || status === 501) return null;
      throw err;
    }
  }

  async listAttempts(params?: {
    lessonId?: string;
    limit?: number;
    cursor?: string;
  }): Promise<AttemptList> {
    const queryParams: Record<string, string> = {};
    if (params?.lessonId) queryParams.lessonId = params.lessonId;
    if (params?.limit) queryParams.limit = String(params.limit);
    if (params?.cursor) queryParams.cursor = params.cursor;
    try {
      return await this.get<AttemptList>(`${PREFIX}/me/attempts`, {
        params: queryParams,
        tag: "progress:attempts",
      });
    } catch (err: unknown) {
      const status =
        err && typeof err === "object" && "status" in err
          ? (err as { status: number }).status
          : 0;
      if (status === 404 || status === 501) return { items: [], nextCursor: null };
      throw err;
    }
  }

  /**
   * Read the server-side unlocked-atom set. Called on hydrate so the unlock
   * ladder survives a localStorage clear / device switch. Returns null when
   * the backend isn't wired (404/501) so the caller keeps its local set.
   */
  async getUnlocks(signal?: AbortSignal): Promise<string[] | null> {
    try {
      const res = await this.get<UnlockMapResponse>(`${PREFIX}/me/unlocks`, {
        signal,
        tag: "progress:unlocks-get",
      });
      return res?.unlockedAtoms ?? [];
    } catch (err: unknown) {
      const status =
        err && typeof err === "object" && "status" in err
          ? (err as { status: number }).status
          : 0;
      if (status === 404 || status === 501) return null;
      throw err;
    }
  }

  /**
   * Push newly-unlocked atom ids. Server UNIONs them into the stored set —
   * never drops, so this is safe to fire-and-forget. Swallows errors: a lost
   * push just means the next push (or hydrate union) reconciles. Never blocks
   * the lesson flow.
   */
  async addUnlocks(atomIds: string[]): Promise<void> {
    if (atomIds.length === 0) return;
    try {
      await this.post<UnlockMapResponse>(
        `${PREFIX}/me/unlocks`,
        { atomIds },
        { tag: "progress:unlocks-add" },
      );
    } catch {
      // Fire-and-forget: the union on next push / hydrate reconciles a drop.
    }
  }

  /**
   * Spend lingots on a shop catalog item.
   *
   * Deliberately NO `tag`. The client's tag mechanism aborts the previous
   * in-flight request sharing that tag — correct for reads, wrong for a
   * non-idempotent mutation. Buying two items in quick succession aborted the
   * first request AFTER the server had already deducted lingots (there is no
   * rollback in `purchase_shop_item`), and the abort surfaced to the user as
   * "Purchase failed — try again."; retrying a consumable double-charged.
   * `srsSync.ts` hit the same hazard and works around it with a queue.
   *
   * Concurrency is handled where it belongs — the UI disables purchasing while
   * one is in flight.
   */
  async purchaseShopItem(itemId: string): Promise<ShopPurchaseResponse | null> {
    try {
      return await this.post<ShopPurchaseResponse>(
        `${PREFIX}/shop/purchase`,
        { itemId },
      );
    } catch (err: unknown) {
      const status =
        err && typeof err === "object" && "status" in err
          ? (err as { status: number }).status
          : 0;
      if (status === 404 || status === 501) return null;
      throw err;
    }
  }
}
