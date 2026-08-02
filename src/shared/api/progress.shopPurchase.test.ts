/**
 * Shop purchase must never share an abort tag.
 *
 * `ApiClient` aborts the previous in-flight request carrying the same `tag`.
 * That is right for reads and wrong for a non-idempotent mutation: buying two
 * items in quick succession aborted the first request CLIENT-side after the
 * server had already deducted lingots (`purchase_shop_item` has no rollback),
 * so the user saw "Purchase failed — try again." for a purchase that had in
 * fact succeeded, and retrying a consumable double-charged.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { ProgressApi } from "./progress";

function jsonResponse(body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { "content-type": "application/json" },
  }) as Response;
}

describe("purchaseShopItem — concurrency", () => {
  let fetchSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    fetchSpy = vi.spyOn(globalThis, "fetch");
  });
  afterEach(() => {
    fetchSpy.mockRestore();
  });

  function api() {
    return new ProgressApi({
      baseUrl: "http://test.local",
      getAccessToken: async () => "t",
    });
  }

  it("does not abort an in-flight purchase when a second one starts", async () => {
    // Hold the first request open until the second has been issued — the exact
    // window in which the shared abort tag used to kill it.
    let releaseFirst: (r: Response) => void = () => {};
    const firstPending = new Promise<Response>((res) => {
      releaseFirst = res;
    });

    const signals: (AbortSignal | undefined)[] = [];
    fetchSpy.mockImplementation((_url: unknown, init?: RequestInit) => {
      signals.push(init?.signal ?? undefined);
      return signals.length === 1
        ? firstPending
        : Promise.resolve(jsonResponse({ ok: true, itemId: "b" }));
    });

    const client = api();
    const first = client.purchaseShopItem("a");
    const second = client.purchaseShopItem("b");

    await second;
    // The first request's signal must still be live after the second started.
    expect(signals[0]?.aborted ?? false).toBe(false);

    releaseFirst(jsonResponse({ ok: true, itemId: "a" }));
    await expect(first).resolves.toBeTruthy();
  });

  it("still surfaces a real server error", async () => {
    fetchSpy.mockResolvedValue(
      new Response(JSON.stringify({ detail: "nope" }), {
        status: 400,
        headers: { "content-type": "application/json" },
      }) as Response,
    );
    await expect(api().purchaseShopItem("a")).rejects.toBeTruthy();
  });

  it("maps a missing endpoint (404/501) to null rather than throwing", async () => {
    fetchSpy.mockResolvedValue(new Response("", { status: 404 }) as Response);
    await expect(api().purchaseShopItem("a")).resolves.toBeNull();
  });
});
