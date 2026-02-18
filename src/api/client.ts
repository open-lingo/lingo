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

  /** Active AbortControllers keyed by a caller-chosen tag. */
  private _inflight = new Map<string, AbortController>();

  constructor(opts: ApiClientOptions) {
    this.baseUrl = opts.baseUrl.replace(/\/+$/, "");
    this._getToken = opts.getAccessToken;
    this._maxRetries = opts.maxRetries ?? 2;
    this._retryBaseDelay = opts.retryBaseDelay ?? 500;
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

  delete<T>(path: string, opts?: RequestOptions & { tag?: string }): Promise<T> {
    return this._request<T>("DELETE", path, undefined, opts);
  }

  // ── Core request logic ────────────────────────────────────

  private async _request<T>(
    method: HttpMethod,
    path: string,
    body: unknown | undefined,
    opts?: RequestOptions & { tag?: string },
  ): Promise<T> {
    const url = this._buildUrl(path, opts?.params);
    const token = await this._getToken();

    const controller = new AbortController();
    const tag = opts?.tag;
    if (tag) {
      this._inflight.get(tag)?.abort();
      this._inflight.set(tag, controller);
    }

    const mergedSignal = opts?.signal
      ? this._mergeSignals(opts.signal, controller.signal)
      : controller.signal;

    const headers: Record<string, string> = {
      Authorization: `Bearer ${token}`,
      ...opts?.headers,
    };
    if (body !== undefined) {
      headers["Content-Type"] = "application/json";
    }

    const init: RequestInit = {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal: mergedSignal,
    };

    let lastError: unknown;

    for (let attempt = 0; attempt <= this._maxRetries; attempt++) {
      try {
        const resp = await fetch(url, init);

        if (resp.ok) {
          if (tag) this._inflight.delete(tag);
          if (resp.status === 204) return undefined as T;
          return (await resp.json()) as T;
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
