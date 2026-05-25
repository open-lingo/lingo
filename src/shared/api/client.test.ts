/**
 * Fix 14 — on 401, ApiClient must re-fetch the token and retry once.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { ApiClient } from "./client";

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
