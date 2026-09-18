/**
 * Fix 14 — on 401, ApiClient must re-fetch the token and retry once.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { ApiClient, ApiError } from "./client";
import { setLastRequestId } from "@/shared/telemetry/errorReporter";

vi.mock("@/shared/telemetry/errorReporter", () => ({
  setLastRequestId: vi.fn(),
  // A3b, 2026-09-17: `ApiClient` now stamps `X-Lingo-Platform` on every
  // request via this export — see the "X-Lingo-Platform header" describe
  // block below.
  detectPlatform: vi.fn(() => "web"),
  // Quest-timezone lane, 2026-09-18: same pattern for the device's IANA
  // zone — see the "X-Lingo-Timezone header" describe block below.
  detectTimezone: vi.fn(() => "America/Denver"),
}));

const mockedSetLastRequestId = vi.mocked(setLastRequestId);

describe("ApiClient — 401 retry with fresh token", () => {
  let fetchSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    fetchSpy = vi.spyOn(globalThis, "fetch");
  });
  afterEach(() => {
    fetchSpy.mockRestore();
  });

  it("retries once on 401 with a freshly-fetched token, then returns success", async () => {
    const tokens: string[] = [];
    const getAccessToken = vi.fn(async () => {
      const t = `token-${tokens.length + 1}`;
      tokens.push(t);
      return t;
    });

    // First call: 401. Second call: 200.
    fetchSpy
      .mockResolvedValueOnce(
        new Response("unauthorized", { status: 401 }) as Response,
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ ok: true }), { status: 200 }) as Response,
      );

    const client = new ApiClient({
      baseUrl: "https://api.test",
      getAccessToken,
      retryBaseDelay: 0,
    });
    const result = await client.get<{ ok: boolean }>("/x");
    expect(result.ok).toBe(true);
    expect(fetchSpy).toHaveBeenCalledTimes(2);
    expect(getAccessToken).toHaveBeenCalledTimes(2);

    // Second request must have used the new token.
    const secondInit = fetchSpy.mock.calls[1]?.[1] as RequestInit | undefined;
    const headers = secondInit?.headers as Record<string, string> | undefined;
    expect(headers?.Authorization).toBe("Bearer token-2");
  });

  it("does not retry 401 more than once", async () => {
    const getAccessToken = vi.fn(async () => "token");
    fetchSpy.mockResolvedValue(
      new Response("unauthorized", { status: 401 }) as Response,
    );

    const client = new ApiClient({
      baseUrl: "https://api.test",
      getAccessToken,
      retryBaseDelay: 0,
    });
    await expect(client.get("/x")).rejects.toThrow();
    // 1 initial + 1 retry = 2 calls (NOT 3+).
    expect(fetchSpy).toHaveBeenCalledTimes(2);
  });
});

describe("ApiClient — skipAuth (Fix M7)", () => {
  let fetchSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    fetchSpy = vi.spyOn(globalThis, "fetch");
  });
  afterEach(() => {
    fetchSpy.mockRestore();
  });

  it("omits the Authorization header and never calls getAccessToken", async () => {
    fetchSpy.mockResolvedValueOnce(
      new Response(JSON.stringify({ ok: true }), { status: 200 }) as Response,
    );
    const getAccessToken = vi.fn(async () => "should-not-be-used");

    const client = new ApiClient({
      baseUrl: "https://api.test",
      getAccessToken,
      retryBaseDelay: 0,
      skipAuth: true,
    });
    await client.get<{ ok: boolean }>("/public");

    expect(getAccessToken).not.toHaveBeenCalled();
    const init = fetchSpy.mock.calls[0]?.[1] as RequestInit | undefined;
    const headers = init?.headers as Record<string, string> | undefined;
    expect(headers && "Authorization" in headers).toBe(false);
  });

  it("does not attempt a 401 retry when skipAuth is set", async () => {
    fetchSpy.mockResolvedValue(
      new Response("nope", { status: 401 }) as Response,
    );
    const getAccessToken = vi.fn(async () => "");

    const client = new ApiClient({
      baseUrl: "https://api.test",
      getAccessToken,
      retryBaseDelay: 0,
      skipAuth: true,
    });
    await expect(client.get("/public")).rejects.toThrow();
    // Only the single initial request — no token-refresh retry path.
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    expect(getAccessToken).not.toHaveBeenCalled();
  });
});

describe("ApiClient — offline mode (bypass build)", () => {
  let fetchSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    fetchSpy = vi.spyOn(globalThis, "fetch");
  });
  afterEach(() => {
    fetchSpy.mockRestore();
  });

  it("rejects authed requests instantly without touching the network", async () => {
    const getAccessToken = vi.fn(async () => "token");
    const client = new ApiClient({
      baseUrl: "https://api.test",
      getAccessToken,
      retryBaseDelay: 0,
      offline: true,
    });

    await expect(client.get("/progress/me")).rejects.toBeInstanceOf(ApiError);
    expect(fetchSpy).not.toHaveBeenCalled();
    // No point acquiring a token we can't use.
    expect(getAccessToken).not.toHaveBeenCalled();
  });

  it("short-circuits before any retry back-off (one throw, no timers)", async () => {
    const client = new ApiClient({
      baseUrl: "https://api.test",
      getAccessToken: async () => "token",
      retryBaseDelay: 5000,
      offline: true,
    });
    // If this awaited a retry back-off it would exceed the default test
    // timeout; instant rejection proves no delay path was taken.
    await expect(client.get("/x")).rejects.toBeInstanceOf(ApiError);
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});

describe("ApiClient — X-Request-Id → error reporter (A3b)", () => {
  let fetchSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    fetchSpy = vi.spyOn(globalThis, "fetch");
    mockedSetLastRequestId.mockClear();
  });
  afterEach(() => {
    fetchSpy.mockRestore();
  });

  it("reads X-Request-Id off a successful response and forwards it to the error reporter", async () => {
    fetchSpy.mockResolvedValueOnce(
      new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { "X-Request-Id": "req-abc123" },
      }) as Response,
    );
    const client = new ApiClient({
      baseUrl: "https://api.test",
      getAccessToken: async () => "token",
      retryBaseDelay: 0,
    });
    await client.get("/x");
    expect(mockedSetLastRequestId).toHaveBeenCalledWith("req-abc123");
  });

  it("reads X-Request-Id off an error response too (server echoes it on every response)", async () => {
    fetchSpy.mockResolvedValueOnce(
      new Response(JSON.stringify({ detail: "nope" }), {
        status: 404,
        headers: { "X-Request-Id": "req-err456" },
      }) as Response,
    );
    const client = new ApiClient({
      baseUrl: "https://api.test",
      getAccessToken: async () => "token",
      retryBaseDelay: 0,
    });
    await expect(client.get("/x")).rejects.toBeInstanceOf(ApiError);
    expect(mockedSetLastRequestId).toHaveBeenCalledWith("req-err456");
  });

  it("does not call the setter when the header is absent", async () => {
    fetchSpy.mockResolvedValueOnce(
      new Response(JSON.stringify({ ok: true }), { status: 200 }) as Response,
    );
    const client = new ApiClient({
      baseUrl: "https://api.test",
      getAccessToken: async () => "token",
      retryBaseDelay: 0,
    });
    await client.get("/x");
    expect(mockedSetLastRequestId).not.toHaveBeenCalled();
  });
});

// ── X-Lingo-Platform header (A3b, 2026-09-17) ─────────────────────────────
//
// Guards: `lingo-core`'s `lingo.access` line reads this header to log
// ios/android/web per request (see `app/main.py::access_log` in that repo).
// `detectPlatform` is mocked to always return "web" at the top of this
// file — this just pins that the header gets SET from that value, not
// `detectPlatform`'s own ios/android/web logic (covered by
// `errorReporter.test.ts`).

describe("ApiClient — X-Lingo-Platform header", () => {
  it("stamps X-Lingo-Platform on every request", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ ok: true }), { status: 200 }) as Response,
    );
    const client = new ApiClient({
      baseUrl: "https://api.test",
      getAccessToken: async () => "token",
      retryBaseDelay: 0,
    });
    await client.get("/x");
    const [, init] = fetchSpy.mock.calls[0] as [string, RequestInit];
    expect((init.headers as Record<string, string>)["X-Lingo-Platform"]).toBe("web");
    fetchSpy.mockRestore();
  });

  it("stamps the header even when skipAuth is set (public endpoints)", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ ok: true }), { status: 200 }) as Response,
    );
    const client = new ApiClient({
      baseUrl: "https://api.test",
      getAccessToken: async () => "unused",
      skipAuth: true,
      retryBaseDelay: 0,
    });
    await client.get("/public");
    const [, init] = fetchSpy.mock.calls[0] as [string, RequestInit];
    expect((init.headers as Record<string, string>)["X-Lingo-Platform"]).toBe("web");
    fetchSpy.mockRestore();
  });
});

// ── X-Lingo-Timezone header (quest-timezone lane, 2026-09-18) ────────────
//
// Guards: lingo-core reads this header to bucket a user's daily/weekly
// quest resets by LOCAL calendar day instead of UTC (see
// `app/shared/timezone.py` / `app/auth/dependencies.py` in that repo).
// `detectTimezone` is mocked to always return "America/Denver" at the top
// of this file — this just pins that the header gets SET from that value,
// not `detectTimezone`'s own `Intl.DateTimeFormat` logic (covered by
// `errorReporter.test.ts`).

describe("ApiClient — X-Lingo-Timezone header", () => {
  it("stamps X-Lingo-Timezone on every request", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ ok: true }), { status: 200 }) as Response,
    );
    const client = new ApiClient({
      baseUrl: "https://api.test",
      getAccessToken: async () => "token",
      retryBaseDelay: 0,
    });
    await client.get("/x");
    const [, init] = fetchSpy.mock.calls[0] as [string, RequestInit];
    expect((init.headers as Record<string, string>)["X-Lingo-Timezone"]).toBe("America/Denver");
    fetchSpy.mockRestore();
  });

  it("stamps the header even when skipAuth is set (public endpoints)", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ ok: true }), { status: 200 }) as Response,
    );
    const client = new ApiClient({
      baseUrl: "https://api.test",
      getAccessToken: async () => "unused",
      skipAuth: true,
      retryBaseDelay: 0,
    });
    await client.get("/public");
    const [, init] = fetchSpy.mock.calls[0] as [string, RequestInit];
    expect((init.headers as Record<string, string>)["X-Lingo-Timezone"]).toBe("America/Denver");
    fetchSpy.mockRestore();
  });
});
