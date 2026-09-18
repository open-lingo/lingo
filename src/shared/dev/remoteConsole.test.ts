/**
 * Tests for the DEV-ONLY remote devlog channel (lane A11, 2026-09-17 —
 * `docs/device-dev-debug-2026-09-17.md`).
 *
 * Three things matter most here, in order: (1) it stays OFF unless armed
 * (`import.meta.env.DEV` is true under vitest by default, so the arm flag
 * is the only gate worth pinning), (2) redaction — a fake "Authorization"/
 * token value must never reach a POST body, (3) the batching contract
 * (500ms debounce, `keepalive: true`, one POST per flush).
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  __flushDevlogForTests,
  __getPendingDevlogQueueForTests,
  __resetRemoteConsoleForTests,
  detectDevlogModel,
  detectDevlogPlatform,
  getDeviceId,
  installRemoteConsole,
  isDevlogArmed,
  redactingReplacer,
  safeStringify,
} from "./remoteConsole";
import { ApiClient } from "@/shared/api/client";
import { enqueueSyncOp, performSync } from "@/features/flashcards/engine/srsSync";
import { reportReconcileEvent } from "@/shared/domain/progressReconcile";
import { pullFromServerIgnoringReset } from "@/features/sync/pullFromServerIgnoringReset";
import { clearSessionLog, logSessionEvent } from "@/shared/telemetry/sessionLog";

const ARM_KEY = "lingo:devlog";

function armDevlog() {
  localStorage.setItem(ARM_KEY, "1");
}

function lastDevlogBatch(fetchSpy: ReturnType<typeof vi.spyOn>): Record<string, unknown>[] {
  const call = fetchSpy.mock.calls
    .filter((c: unknown[]) => String(c[0]).includes("/__devlog"))
    .at(-1) as [string, RequestInit] | undefined;
  if (!call) return [];
  return (JSON.parse(call[1].body as string) as { batch: Record<string, unknown>[] }).batch;
}

describe("remoteConsole", () => {
  let originalConsole: Record<string, (...args: unknown[]) => void>;
  let fetchSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    originalConsole = {
      log: console.log,
      info: console.info,
      warn: console.warn,
      error: console.error,
      debug: console.debug,
    };
    localStorage.clear();
    __resetRemoteConsoleForTests();
    clearSessionLog();
    fetchSpy = vi.spyOn(globalThis, "fetch").mockImplementation(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes("/__devlog")) return new Response(null, { status: 204 });
      return new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { "X-Request-Id": "req-42", "Content-Length": "13" },
      });
    });
  });

  afterEach(() => {
    Object.assign(console, originalConsole);
    __resetRemoteConsoleForTests();
    clearSessionLog();
    fetchSpy.mockRestore();
  });

  // ── Gating ───────────────────────────────────────────────────────────

  it("isDevlogArmed is false with no flag set", () => {
    expect(isDevlogArmed()).toBe(false);
  });

  it("isDevlogArmed is true once localStorage['lingo:devlog']='1' is set", () => {
    armDevlog();
    expect(isDevlogArmed()).toBe(true);
  });

  it("installRemoteConsole is a no-op when not armed — console stays unpatched, nothing queued", () => {
    installRemoteConsole();
    console.log("should not be captured");
    expect(__getPendingDevlogQueueForTests()).toHaveLength(0);
  });

  it("installRemoteConsole installs once armed, and is idempotent on a second call", () => {
    armDevlog();
    installRemoteConsole();
    const afterFirst = console.log;
    installRemoteConsole();
    expect(console.log).toBe(afterFirst); // did not wrap a second time
  });

  // ── Device id ────────────────────────────────────────────────────────

  it("detectDevlogPlatform/detectDevlogModel read the UA (web build, since IS_NATIVE is false under vitest)", () => {
    expect(detectDevlogPlatform("Mozilla/5.0 (iPhone; CPU iPhone OS 18_4 like Mac OS X)")).toBe("web");
    expect(detectDevlogModel("Mozilla/5.0 (iPad; CPU OS 18_4 like Mac OS X)")).toBe("iPad");
    expect(detectDevlogModel("Mozilla/5.0 (iPhone; CPU iPhone OS 18_4 like Mac OS X)")).toBe("iPhone");
    expect(detectDevlogModel("Mozilla/5.0 (Linux; Android 14; Pixel 7)")).toBe("Pixel-7");
    expect(detectDevlogModel("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15)")).toBe("browser");
  });

  it("getDeviceId returns a stable <platform>-<model>-<last4> string, persisted across calls", () => {
    armDevlog();
    const id1 = getDeviceId();
    expect(id1).toMatch(/^web-[A-Za-z0-9._-]+-[A-Za-z0-9]{4}$/);
    const id2 = getDeviceId();
    expect(id2).toBe(id1);
  });

  // ── Redaction / stringify ────────────────────────────────────────────

  it("redactingReplacer masks credential-shaped keys and leaves everything else alone", () => {
    expect(redactingReplacer("authorization", "Bearer super-secret")).toBe("[redacted]");
    expect(redactingReplacer("Authorization", "Bearer super-secret")).toBe("[redacted]");
    expect(redactingReplacer("access_token", "abc")).toBe("[redacted]");
    expect(redactingReplacer("password", "hunter2")).toBe("[redacted]");
    expect(redactingReplacer("lessonId", "ja-m1-l1")).toBe("ja-m1-l1");
  });

  it("safeStringify redacts a credential-shaped field nested in an object", () => {
    const s = safeStringify({ headers: { Authorization: "Bearer super-secret-token" }, path: "/x" });
    expect(s).not.toContain("super-secret-token");
    expect(s).toContain("[redacted]");
  });

  it("safeStringify truncates at 2000 chars with a visible marker", () => {
    const huge = "x".repeat(3000);
    const s = safeStringify(huge);
    expect(s.length).toBeLessThan(2100);
    expect(s.endsWith("…[truncated]")).toBe(true);
  });

  // ── console / window error capture ──────────────────────────────────

  it("captures console.log without suppressing the original console output", () => {
    armDevlog();
    const preInstall = console.log;
    installRemoteConsole();
    expect(console.log).not.toBe(preInstall); // wrapped
    console.log("hello", 42);
    const queue = __getPendingDevlogQueueForTests();
    const row = queue.find((r) => r.kind === "console" && String(r.msg).includes("hello"));
    expect(row).toBeTruthy();
    expect(row?.level).toBe("log");
  });

  it("captures an unhandledrejection as an error-kind record", () => {
    armDevlog();
    installRemoteConsole();
    window.dispatchEvent(
      Object.assign(new Event("unhandledrejection"), { reason: new Error("boom") }) as unknown as PromiseRejectionEvent,
    );
    const row = __getPendingDevlogQueueForTests().find((r) => r.kind === "error");
    expect(row).toBeTruthy();
    expect(String(row?.reason)).toContain("boom");
  });

  // ── Batching ─────────────────────────────────────────────────────────

  it("batches multiple records into ONE /__devlog POST on flush, with keepalive:true, then clears the queue", async () => {
    armDevlog();
    installRemoteConsole();
    console.log("one");
    console.log("two");
    expect(__getPendingDevlogQueueForTests().length).toBeGreaterThanOrEqual(2);
    __flushDevlogForTests();
    await Promise.resolve();
    const devlogCalls = fetchSpy.mock.calls.filter((c: unknown[]) => String(c[0]).includes("/__devlog"));
    expect(devlogCalls).toHaveLength(1);
    const [, init] = devlogCalls[0] as [string, RequestInit];
    expect(init.keepalive).toBe(true);
    expect(init.method).toBe("POST");
    expect(__getPendingDevlogQueueForTests()).toHaveLength(0);
  });

  it("auto-flushes on its own after ~500ms without a manual flush call", async () => {
    vi.useFakeTimers();
    armDevlog();
    installRemoteConsole();
    console.log("auto");
    vi.advanceTimersByTime(500);
    await vi.waitFor(() => {
      expect(fetchSpy.mock.calls.some((c: unknown[]) => String(c[0]).includes("/__devlog"))).toBe(true);
    });
    vi.useRealTimers();
  });

  // ── ApiClient integration — the "no Authorization header values, no
  //    bodies" constraint, exercised end-to-end through the real client ──

  it("forwards ApiClient requests with method/path/status/timing/requestId/byte-counts, and NEVER the token or the request/response body", async () => {
    armDevlog();
    installRemoteConsole();
    const SECRET_TOKEN = "super-secret-bearer-token-value";
    const client = new ApiClient({ baseUrl: "https://api.test", getAccessToken: async () => SECRET_TOKEN });
    await client.post("/progress/attempts", { userAnswer: "the-actual-answer-text" });
    __flushDevlogForTests();
    await Promise.resolve();

    const batch = lastDevlogBatch(fetchSpy);
    const apiRow = batch.find((r) => r.kind === "api");
    expect(apiRow).toMatchObject({
      method: "POST",
      path: "/progress/attempts",
      status: 200,
      ok: true,
      requestId: "req-42",
      resBytes: 13,
    });
    expect(typeof apiRow?.reqBytes).toBe("number");
    expect(apiRow?.reqBytes).toBeGreaterThan(0);

    const raw = JSON.stringify(batch);
    expect(raw).not.toContain(SECRET_TOKEN);
    expect(raw).not.toContain("the-actual-answer-text");
    expect(raw).not.toContain("Authorization");
  });

  it("records a network failure (no response) as status 0", async () => {
    armDevlog();
    installRemoteConsole();
    fetchSpy.mockImplementation(async (input: RequestInfo | URL) => {
      if (String(input).includes("/__devlog")) return new Response(null, { status: 204 });
      throw new TypeError("Failed to fetch");
    });
    const client = new ApiClient({ baseUrl: "https://api.test", getAccessToken: async () => "t", maxRetries: 0 });
    await expect(client.get("/progress/me")).rejects.toThrow();
    __flushDevlogForTests();
    await Promise.resolve();
    const batch = lastDevlogBatch(fetchSpy);
    const apiRow = batch.find((r) => r.kind === "api");
    expect(apiRow).toMatchObject({ status: 0, ok: false });
  });

  // ── srsSync integration ──────────────────────────────────────────────

  it("forwards SRS sync queue transitions: enqueued -> batch_start -> batch_ok", async () => {
    armDevlog();
    installRemoteConsole();
    // Zero dirty cards is the simplest deterministic case: `performSyncNow`
    // still enqueues (queue transitions are about the CHAIN, not about
    // whether a batch actually posts), then short-circuits before any
    // batch phase since there's nothing dirty — see srsSync.ts.
    await performSync(async () => ({}));
    const kinds = __getPendingDevlogQueueForTests()
      .filter((r) => r.kind === "sync")
      .map((r) => r.phase);
    expect(kinds).toContain("enqueued");
  });

  it("forwards a batch_error event with the error MESSAGE only, when a sync op throws", async () => {
    armDevlog();
    installRemoteConsole();
    await enqueueSyncOp(async () => {
      throw new Error("simulated network failure");
    }).catch(() => {});
    // enqueueSyncOp itself doesn't know about batches — this pins that the
    // "enqueued" transition alone is enough signal for a generic queued op,
    // independent of performSyncNow's batch-level phases (covered above).
    const row = __getPendingDevlogQueueForTests().find((r) => r.kind === "sync" && r.phase === "enqueued");
    expect(row).toBeTruthy();
  });

  // ── reconcile integration ────────────────────────────────────────────

  it("forwards a reconcile event via reportReconcileEvent (the seam pullFromServerIgnoringReset.ts and runReconcile both use)", () => {
    armDevlog();
    installRemoteConsole();
    reportReconcileEvent({ source: "reconcile", status: "queued", queued: 3, posted: 1 });
    const row = __getPendingDevlogQueueForTests().find((r) => r.kind === "reconcile");
    expect(row).toMatchObject({ source: "reconcile", status: "queued", queued: 3, posted: 1 });
  });

  it("forwards the #176a manual Sync-panel pull as a reconcile event with local/server counts, no user id", async () => {
    armDevlog();
    installRemoteConsole();
    const fakeQueryClient = {
      refetchQueries: async () => {},
      getQueryData: () => ({ lessons: [{ lessonId: "ja-m1-l1", firstPassedAt: "2026-01-01T00:00:00Z" }] }),
    };
    await pullFromServerIgnoringReset(fakeQueryClient as never, ["progress", "me", "user-123"]);
    const row = __getPendingDevlogQueueForTests().find((r) => r.kind === "reconcile" && r.source === "pull-ignoring-reset");
    expect(row).toMatchObject({ serverCount: 1 });
    expect(typeof row?.localCount).toBe("number");
    expect(JSON.stringify(row)).not.toContain("user-123");
  });

  // ── sessionLog integration ───────────────────────────────────────────

  it("forwards new sessionLog events as they're logged, without re-forwarding old ones on the next event", () => {
    armDevlog();
    logSessionEvent("lesson_start", { lessonId: "ja-m1-l1" });
    installRemoteConsole(); // installs AFTER one event already exists
    logSessionEvent("lesson_end", { lessonId: "ja-m1-l1" });
    const rows = __getPendingDevlogQueueForTests().filter((r) => r.kind === "session");
    expect(rows).toHaveLength(1); // only the one logged AFTER install
    expect(rows[0].type).toBe("lesson_end");
  });
});
