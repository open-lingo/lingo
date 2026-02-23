import type { SRSStore } from "@/features/flashcards/engine/srsStorage";
import type { SyncPayload } from "@/features/flashcards/engine/srsSync";
import { ApiClient } from "./client";

const PREFIX = "/api/core/v1/srs";

interface SRSStateResponse {
  cards: SRSStore;
}

interface SRSSyncResponse {
  cards: SRSStore;
  syncedAt: string;
}

export class SrsApi extends ApiClient {
  /** Get full SRS state for the current user. */
  async getState(signal?: AbortSignal): Promise<SRSStore> {
    try {
      const res = await this.get<SRSStateResponse>(`${PREFIX}/state`, {
        signal,
        tag: "srs:state",
      });
      return res?.cards ?? {};
    } catch (err: unknown) {
      const status =
        err && typeof err === "object" && "status" in err
          ? (err as { status: number }).status
          : 0;
      if (status === 404 || status === 501) return {};
      throw err;
    }
  }

  /** Get cards due on or before the given date (YYYY-MM-DD). */
  async getDueCards(
    onOrBefore: string,
    signal?: AbortSignal
  ): Promise<SRSStore> {
    try {
      const res = await this.get<SRSStateResponse>(`${PREFIX}/due`, {
        signal,
        params: { on_or_before: onOrBefore },
        tag: "srs:due",
      });
      return res?.cards ?? {};
    } catch (err: unknown) {
      const status =
        err && typeof err === "object" && "status" in err
          ? (err as { status: number }).status
          : 0;
      if (status === 404 || status === 501) return {};
      throw err;
    }
  }

  /**
   * Sync dirty cards to the backend. Returns merged state for synced cards.
   * Client should call mergeServerState with the result.
   */
  async sync(payload: SyncPayload): Promise<SRSStore> {
    try {
      const res = await this.post<SRSSyncResponse>(`${PREFIX}/sync`, payload, {
        tag: "srs:sync",
      });
      return res?.cards ?? {};
    } catch (err: unknown) {
      const status =
        err && typeof err === "object" && "status" in err
          ? (err as { status: number }).status
          : 0;
      if (status === 404 || status === 501) return {};
      throw err;
    }
  }
}
