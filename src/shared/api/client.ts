/**
 * Base API client.
 *
 * Centralises auth token injection, request cancellation, retries with
 * exponential back-off, and structured error handling so every service
 * module inherits the same behaviour.
 */

export interface ApiClientOptions {
  baseUrl: string;
  getAccessToken: () => Promise<string>;
  /** Max automatic retries on 5xx / network errors (default 2). */
  maxRetries?: number;
  /** Base delay in ms before first retry (doubled each attempt, default 500). */
  retryBaseDelay?: number;
  /**
   * Skip the Authorization header entirely. Use this for clients hitting
   * public endpoints (e.g. `FinanceApi` → `/finance/transparency`) so the
   * request fires without waiting on Auth0 token acquisition.
   *
   * When true the configured `getAccessToken` is never invoked, so callers
   * may pass a no-op token resolver.
   */
  skipAuth?: boolean;
}

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly body: unknown,
    message?: string,
  ) {
    super(message ?? `API ${status}`);
    this.name = "ApiError";
  }

  /** Error code from standardized 403 responses (e.g. USER_BANNED, COMMUNITY_BANNED). */
  get code(): string | undefined {
    const d = this.body && typeof this.body === "object" && "detail" in this.body
      ? (this.body as { detail?: unknown }).detail
      : this.body;
    return d && typeof d === "object" && "code" in d ? String((d as { code?: string }).code) : undefined;
  }

  /** Expiration datetime from ban responses (ISO string). */
  get expiresAt(): string | undefined {
    const d = this.body && typeof this.body === "object" && "detail" in this.body
      ? (this.body as { detail?: unknown }).detail
      : this.body;
    return d && typeof d === "object" && "expires_at" in d
      ? String((d as { expires_at?: string }).expires_at)
      : undefined;
  }

  static isUserBanned(err: unknown): err is ApiError {
    return err instanceof ApiError && err.status === 403 && err.code === "USER_BANNED";
  }

  static isCommunityBanned(err: unknown): err is ApiError {
    return err instanceof ApiError && err.status === 403 && err.code === "COMMUNITY_BANNED";
  }
}

type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

interface RequestOptions {
  /** Caller-supplied AbortSignal for cancellation. */
  signal?: AbortSignal;
  params?: Record<string, string | number | boolean | undefined>;
  headers?: Record<string, string>;
}

const RETRYABLE_STATUS = new Set([500, 502, 503, 504]);

export class ApiClient {
  protected readonly baseUrl: string;
  private readonly _getToken: () => Promise<string>;
  private readonly _maxRetries: number;
  private readonly _retryBaseDelay: number;
  private readonly _skipAuth: boolean;

  /** Active AbortControllers keyed by a caller-chosen tag. */
  private _inflight = new Map<string, AbortController>();

  constructor(opts: ApiClientOptions) {
    this.baseUrl = opts.baseUrl.replace(/\/+$/, "");
    this._getToken = opts.getAccessToken;
    this._maxRetries = opts.maxRetries ?? 2;
    this._retryBaseDelay = opts.retryBaseDelay ?? 500;
    this._skipAuth = opts.skipAuth ?? false;
  }

  // ── Public helpers ────────────────────────────────────────

  /**
   * Cancel every in-flight request started with the given tag.
   * If no tag is supplied, cancel *all* tracked requests.
   */
  cancel(tag?: string): void {
    if (tag) {
      this._inflight.get(tag)?.abort();
      this._inflight.delete(tag);
    } else {
      for (const ctrl of this._inflight.values()) ctrl.abort();
      this._inflight.clear();
    }
  }

  // ── HTTP verb shortcuts ───────────────────────────────────

  get<T>(path: string, opts?: RequestOptions & { tag?: string }): Promise<T> {
    return this._request<T>("GET", path, undefined, opts);
  }

  post<T>(path: string, body?: unknown, opts?: RequestOptions & { tag?: string }): Promise<T> {
    return this._request<T>("POST", path, body, opts);
  }

  put<T>(path: string, body?: unknown, opts?: RequestOptions & { tag?: string }): Promise<T> {
    return this._request<T>("PUT", path, body, opts);
  }

  patch<T>(path: string, body?: unknown, opts?: RequestOptions & { tag?: string }): Promise<T> {
    return this._request<T>("PATCH", path, body, opts);
  }

  delete<T>(path: string, opts?: RequestOptions & { tag?: string; body?: unknown }): Promise<T> {
    return this._request<T>("DELETE", path, opts?.body, opts);
  }

  // ── Core request logic ────────────────────────────────────

  private async _request<T>(
    method: HttpMethod,
    path: string,
    body: unknown | undefined,
    opts?: RequestOptions & { tag?: string },
  ): Promise<T> {
    const url = this._buildUrl(path, opts?.params);
    let token = this._skipAuth ? "" : await this._getToken();

    const controller = new AbortController();
    const tag = opts?.tag;
    if (tag) {
      this._inflight.get(tag)?.abort();
      this._inflight.set(tag, controller);
    }

    const mergedSignal = opts?.signal
      ? this._mergeSignals(opts.signal, controller.signal)
      : controller.signal;

    const buildInit = (currentToken: string): RequestInit => {
      const headers: Record<string, string> = {
        ...opts?.headers,
      };
      if (!this._skipAuth) {
        headers.Authorization = `Bearer ${currentToken}`;
      }
      if (body !== undefined) {
        headers["Content-Type"] = "application/json";
      }
      return {
        method,
        headers,
        body: body !== undefined ? JSON.stringify(body) : undefined,
        signal: mergedSignal,
      };
    };

    let lastError: unknown;
    // Fix 14 — at most one 401 retry per request. We re-fetch the token on
    // the retry so a stale/expired token can be replaced silently.
    let unauthorizedRetryUsed = false;

    for (let attempt = 0; attempt <= this._maxRetries; attempt++) {
      try {
        const resp = await fetch(url, buildInit(token));

        if (resp.ok) {
          if (tag) this._inflight.delete(tag);
          if (resp.status === 204) return undefined as T;
          return (await resp.json()) as T;
        }

        if (resp.status === 401 && !unauthorizedRetryUsed && !this._skipAuth) {
          unauthorizedRetryUsed = true;
          // Re-fetch token and immediately retry without consuming a 5xx slot.
          token = await this._getToken();
          continue;
        }

        if (!RETRYABLE_STATUS.has(resp.status) || attempt === this._maxRetries) {
          if (tag) this._inflight.delete(tag);
          const errBody = await resp.json().catch(() => resp.statusText);
          throw new ApiError(resp.status, errBody, `${method} ${path} → ${resp.status}`);
        }

        lastError = new ApiError(resp.status, null);
      } catch (err) {
        if (err instanceof ApiError) throw err;
        if (this._isAbortError(err)) throw err;

        if (attempt === this._maxRetries) {
          if (tag) this._inflight.delete(tag);
          throw err;
        }
        lastError = err;
      }

      await this._delay(attempt);
    }

    throw lastError;
  }

  private _buildUrl(path: string, params?: Record<string, string | number | boolean | undefined>): string {
    const url = new URL(`${this.baseUrl}${path}`);
    if (params) {
      for (const [k, v] of Object.entries(params)) {
        if (v !== undefined) url.searchParams.set(k, String(v));
      }
    }
    return url.toString();
  }

  private _delay(attempt: number): Promise<void> {
    const jitter = Math.random() * 100;
    const ms = this._retryBaseDelay * 2 ** attempt + jitter;
    return new Promise((r) => setTimeout(r, ms));
  }

  private _isAbortError(err: unknown): boolean {
    return err instanceof DOMException && err.name === "AbortError";
  }

  /**
   * Combine two AbortSignals so the request is cancelled if *either* fires.
   */
  private _mergeSignals(a: AbortSignal, b: AbortSignal): AbortSignal {
    if (typeof AbortSignal.any === "function") {
      return AbortSignal.any([a, b]);
    }
    const ctrl = new AbortController();
    const onAbort = () => ctrl.abort();
    a.addEventListener("abort", onAbort, { once: true });
    b.addEventListener("abort", onAbort, { once: true });
    return ctrl.signal;
  }
}
