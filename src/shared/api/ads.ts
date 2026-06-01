import { ApiClient } from "./client";

const PREFIX = "/api/core/v1/ads";

/** Rewarded-ad placement identifier. Backend matches the literal string. */
export type AdPlacement = "modal_rewarded_v1";

export interface AdWatchedRequest {
  idempotency_key: string;
  placement: AdPlacement;
}

export interface AdWatchedResponse {
  lingots_awarded: number;
  new_balance: number;
}

export class AdsApi extends ApiClient {
  /**
   * Credit the user for a watched rewarded ad. The `idempotency_key`
   * (UUID generated client-side at modal open) lets the backend dedupe
   * accidental double-claims; a repeat call with the same key returns
   * HTTP 429 with `{"detail": "already_credited"}`.
   */
  watched(
    body: AdWatchedRequest,
    signal?: AbortSignal,
  ): Promise<AdWatchedResponse> {
    return this.post<AdWatchedResponse>(`${PREFIX}/watched`, body, {
      signal,
      tag: "ads:watched",
    });
  }
}
