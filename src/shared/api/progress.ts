import { ApiClient } from "./client";

const PREFIX = "/api/core/v1/progress";

// ─── Server schema mirrors ──────────────────────────────────────────────────

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


export class ProgressApi extends ApiClient {
  /** Flush buffered lesson attempts in one batch. Returns per-attempt results. */
  async batchAttempts(
    payload: BatchAttemptSubmission,
  ): Promise<BatchAttemptResponse> {
    try {
      const res = await this.post<BatchAttemptResponse>(
        `${PREFIX}/lessons/batch`,
        payload,
        { tag: "progress:batch" },
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

  /** Aggregate for page render (lessons + concepts + daily + user stats). */
  async getMe(signal?: AbortSignal): Promise<ProgressSummary | null> {
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
