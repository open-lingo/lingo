import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  __getPendingQueueForTests,
  __resetErrorReporterForTests,
  buildDiagnosticsDocument,
  detectTimezone,
  flushPending,
  getLessonContext,
  installErrorReporter,
  parseOsVersion,
  reportError,
  sendDiagnosticsReport,
  setLessonContext,
} from "./errorReporter";
import { clearSessionLog, logSessionEvent } from "./sessionLog";

const NO_PII_KEYS = ["email", "userId", "user_id", "name", "displayName", "username", "answer", "userAnswer", "freeText", "password"];

function lastFetchBody(fetchSpy: ReturnType<typeof vi.spyOn>, callIndex = -1): { items: Record<string, unknown>[] } {
  const calls = fetchSpy.mock.calls;
  const call = calls.at(callIndex) as [string, RequestInit];
  return JSON.parse(call[1].body as string);
}

describe("errorReporter", () => {
  let fetchSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    __resetErrorReporterForTests();
    clearSessionLog();
    fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(JSON.stringify({ accepted: 1 }), { status: 202 }));
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    fetchSpy.mockRestore();
    __resetErrorReporterForTests();
    clearSessionLog();
  });

  // ── Dedupe ────────────────────────────────────────────────────────────
  //
  // Guards: `reportError`'s signature map in errorReporter.ts. This fails
  // for real if dedupe is removed — verified by temporarily deleting the
  // `if (existing) { existing.count += 1; ...; return; }` early-return so
  // every call falls through to "new report," rerunning this test, and
  // observing 3 queued items instead of 1 (recorded in the lane report,
  // then reverted).

  /** Distinct `new Error(...)` calls capture the call SITE in `.stack`
   *  (different source line each time), which is itself a legitimate part
   *  of the dedupe signature — two throws of "the same bug" from the same
   *  code path really do share a stack. Fix the stack explicitly here so
   *  the test isolates dedupe logic from V8 stack-capture mechanics. */
  function sameBoomError(): Error {
    const e = new Error("boom");
    e.stack = "Error: boom\n    at StepRenderer (StepRenderer.tsx:42:9)";
    return e;
  }

  it("dedupes identical message+stack within a session into one report with a running count", () => {
    reportError(sameBoomError());
    reportError(sameBoomError());
    reportError(sameBoomError());

    const queue = __getPendingQueueForTests();
    expect(queue).toHaveLength(1);
    expect(queue[0].count).toBe(3);
  });

  it("does NOT dedupe distinct messages", () => {
    reportError(new Error("boom A"));
    reportError(new Error("boom B"));

    expect(__getPendingQueueForTests()).toHaveLength(2);
  });

  it("treats the same message with a different stack as distinct", () => {
    const a = new Error("boom");
    a.stack = "at foo (a.ts:1:1)";
    const b = new Error("boom");
    b.stack = "at bar (b.ts:1:1)";
    reportError(a);
    reportError(b);

    expect(__getPendingQueueForTests()).toHaveLength(2);
  });

  // ── Cap ──────────────────────────────────────────────────────────────

  it("caps distinct reports at 20 per session and silently drops the rest", () => {
    for (let i = 0; i < 25; i++) {
      reportError(new Error(`distinct #${i}`));
    }
    expect(__getPendingQueueForTests()).toHaveLength(20);
  });

  it("a dedupe hit does not consume cap budget", () => {
    // One shared call site for every error, all fired from inside this
    // loop, so `#0`'s first and second occurrence share a stack (see
    // `sameBoomError` above for why that matters).
    function distinctError(n: number): Error {
      const e = new Error(`distinct #${n}`);
      e.stack = `Error: distinct #${n}\n    at loop (test.ts:1:1)`;
      return e;
    }
    for (let i = 0; i < 20; i++) reportError(distinctError(i));
    // 20 already queued (at cap) — repeating #0 must still bump its count,
    // not be silently dropped by the cap check.
    reportError(distinctError(0));
    const queue = __getPendingQueueForTests();
    expect(queue).toHaveLength(20);
    expect(queue.find((r) => r.message.includes("#0"))?.count).toBe(2);
  });

  // ── Payload shape / no PII ──────────────────────────────────────────

  it("never throws for a non-Error, non-string input", () => {
    expect(() => reportError({ weird: "object" })).not.toThrow();
    expect(() => reportError(null)).not.toThrow();
    expect(() => reportError(undefined)).not.toThrow();
    expect(__getPendingQueueForTests().length).toBeGreaterThan(0);
  });

  it("truncates message to 1000 chars and stack to 4000 chars before it ever reaches the queue", () => {
    const err = new Error("x".repeat(5000));
    err.stack = "y".repeat(9000);
    reportError(err);
    const [report] = __getPendingQueueForTests();
    expect(report.message.length).toBeLessThanOrEqual(1000);
    expect((report.stack ?? "").length).toBeLessThanOrEqual(4000);
  });

  it("the queued report shape has no PII-shaped field", () => {
    reportError(new Error("boom"));
    const [report] = __getPendingQueueForTests();
    const keys = Object.keys(report);
    for (const banned of NO_PII_KEYS) {
      expect(keys).not.toContain(banned);
    }
  });

  it("appends componentStack to the stack, still under the cap", () => {
    reportError(new Error("boom"), { componentStack: "in <StepRenderer>" });
    const [report] = __getPendingQueueForTests();
    expect(report.stack).toContain("in <StepRenderer>");
  });

  it("carries lesson context only when setLessonContext was called", () => {
    reportError(new Error("no context yet"));
    expect(__getPendingQueueForTests()[0].lessonId).toBeUndefined();

    setLessonContext({ lessonId: "ja-m12-01", stepIndex: 3, stepType: "build_sentence" });
    reportError(new Error("with context"));
    const withCtx = __getPendingQueueForTests().find((r) => r.message.includes("with context"));
    expect(withCtx?.lessonId).toBe("ja-m12-01");
    expect(withCtx?.stepIndex).toBe(3);
    expect(withCtx?.stepType).toBe("build_sentence");

    setLessonContext(null);
  });

  // ── Ignore-list (benign browser noise, b28 B28A follow-up) ───────────
  //
  // `tileFit.ts`'s single ResizeObserver can need more convergence rounds
  // than the browser allows in one frame (bounded by its own
  // MAX_PASSES_PER_FRAME=8 anti-flicker cap — see
  // docs/user-feedback/2026-09-17-testflight-b28.md's B28A section), which
  // makes the UA itself fire this diagnostic. It is not an app bug and must
  // never reach CloudWatch as one.

  it("drops the WebKit ResizeObserver loop message before it reaches the queue", () => {
    reportError("ResizeObserver loop completed with undelivered notifications.");
    expect(__getPendingQueueForTests()).toHaveLength(0);
  });

  it("drops the Chromium ResizeObserver loop limit exceeded variant", () => {
    reportError("ResizeObserver loop limit exceeded");
    expect(__getPendingQueueForTests()).toHaveLength(0);
  });

  it("an ignored message never flushes a network request either", async () => {
    reportError("ResizeObserver loop limit exceeded");
    await vi.advanceTimersByTimeAsync(2100);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("an ignored message does not consume dedupe/cap budget", () => {
    for (let i = 0; i < 25; i++) reportError("ResizeObserver loop limit exceeded");
    reportError(new Error("a real error after the noise"));
    const queue = __getPendingQueueForTests();
    expect(queue).toHaveLength(1);
    expect(queue[0].message).toContain("a real error after the noise");
  });

  it("still reports a real error whose STACK mentions ResizeObserver but whose message does not match the ignore-list", () => {
    const err = new Error("tileFit convergence exceeded expected passes");
    err.stack = "Error: tileFit convergence exceeded expected passes\n    at ResizeObserver callback (tileFit.ts:101:5)";
    reportError(err);
    const queue = __getPendingQueueForTests();
    expect(queue).toHaveLength(1);
    expect(queue[0].message).toContain("tileFit convergence exceeded expected passes");
  });

  // ── Flush / network ──────────────────────────────────────────────────

  it("flushes queued reports via fetch after the debounce window", async () => {
    reportError(new Error("boom"));
    expect(fetchSpy).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(2100);

    expect(fetchSpy).toHaveBeenCalledTimes(1);
    const body = lastFetchBody(fetchSpy);
    expect(body.items).toHaveLength(1);
    expect(body.items[0].message).toContain("boom");
  });

  it("clears the queue on a successful flush", async () => {
    reportError(new Error("boom"));
    await vi.advanceTimersByTimeAsync(2100);
    expect(__getPendingQueueForTests()).toHaveLength(0);
  });

  it("chunks a large queue into requests of at most 5 items", async () => {
    for (let i = 0; i < 12; i++) reportError(new Error(`distinct #${i}`));
    await flushPending();
    // ceil(12/5) = 3 requests
    expect(fetchSpy).toHaveBeenCalledTimes(3);
    for (const call of fetchSpy.mock.calls) {
      const body = JSON.parse((call[1] as RequestInit).body as string);
      expect(body.items.length).toBeLessThanOrEqual(5);
    }
  });

  // ── Backoff on 5xx ────────────────────────────────────────────────────

  it("keeps the report queued and backs off after a 5xx", async () => {
    fetchSpy.mockResolvedValue(new Response(null, { status: 503 }));
    reportError(new Error("boom"));

    await flushPending();
    expect(__getPendingQueueForTests()).toHaveLength(1); // not dropped

    fetchSpy.mockClear();
    await flushPending(); // immediately again — should be suppressed by backoff
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("drops an item on a non-retryable 4xx instead of queuing it forever", async () => {
    fetchSpy.mockResolvedValue(new Response(null, { status: 422 }));
    reportError(new Error("boom"));

    await flushPending();
    expect(__getPendingQueueForTests()).toHaveLength(0);
  });

  it("retries after a 429 the same way as a 5xx (backoff, not drop)", async () => {
    fetchSpy.mockResolvedValue(new Response(null, { status: 429 }));
    reportError(new Error("boom"));

    await flushPending();
    expect(__getPendingQueueForTests()).toHaveLength(1);
  });

  // ── Offline queue persistence ─────────────────────────────────────────

  it("persists the queue to localStorage as it grows", () => {
    reportError(new Error("boom"));
    const raw = localStorage.getItem("lingo_error_reports_v1");
    expect(raw).toBeTruthy();
    expect(JSON.parse(raw!)).toHaveLength(1);
  });

  it("a network failure leaves the report queued and persisted for the next launch", async () => {
    fetchSpy.mockRejectedValue(new TypeError("Failed to fetch"));
    reportError(new Error("offline boom"));

    await flushPending();

    expect(__getPendingQueueForTests()).toHaveLength(1);
    const raw = localStorage.getItem("lingo_error_reports_v1");
    expect(JSON.parse(raw!)).toHaveLength(1);
  });

  it("installErrorReporter() flushes a queue persisted by a previous (offline) session", async () => {
    localStorage.setItem(
      "lingo_error_reports_v1",
      JSON.stringify([
        {
          message: "leftover from last session",
          source: "window.onerror",
          platform: "web",
          online: true,
          count: 1,
          ts: 1,
          sessionId: "s-old",
        },
      ]),
    );

    installErrorReporter();
    await vi.waitFor(() => expect(fetchSpy).toHaveBeenCalled());

    const body = lastFetchBody(fetchSpy);
    expect(body.items[0].message).toBe("leftover from last session");
  });

  // ── sendBeacon fallback on unload ─────────────────────────────────────

  it("uses sendBeacon (not fetch) on pagehide", () => {
    const beaconSpy = vi.fn().mockReturnValue(true);
    Object.defineProperty(navigator, "sendBeacon", { value: beaconSpy, configurable: true });

    installErrorReporter();
    reportError(new Error("about to unload"));
    fetchSpy.mockClear();

    window.dispatchEvent(new Event("pagehide"));

    expect(beaconSpy).toHaveBeenCalledTimes(1);
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(__getPendingQueueForTests()).toHaveLength(0); // optimistically cleared

    // @ts-expect-error — test-only cleanup
    delete navigator.sendBeacon;
  });

  // ── window.onerror / unhandledrejection wiring ────────────────────────

  it("installErrorReporter wires window.onerror", () => {
    installErrorReporter();
    window.dispatchEvent(
      Object.assign(new Event("error"), { error: new Error("global boom"), message: "global boom" }),
    );
    const queued = __getPendingQueueForTests();
    expect(queued.some((r) => r.message.includes("global boom"))).toBe(true);
  });

  it("installErrorReporter wires unhandledrejection", () => {
    installErrorReporter();
    const event = Object.assign(new Event("unhandledrejection"), { reason: new Error("rejected boom") });
    window.dispatchEvent(event);
    const queued = __getPendingQueueForTests();
    expect(queued.some((r) => r.message.includes("rejected boom"))).toBe(true);
  });

  it("is idempotent — a second install does not double-wire listeners", () => {
    installErrorReporter();
    installErrorReporter();
    window.dispatchEvent(
      Object.assign(new Event("error"), { error: new Error("once please"), message: "once please" }),
    );
    const matches = __getPendingQueueForTests().filter((r) => r.message.includes("once please"));
    expect(matches).toHaveLength(1);
    expect(matches[0].count).toBe(1); // not double-counted either
  });

  // ── Breadcrumbs (A3b, 2026-09-17) ───────────────────────────────────

  it("attaches the last <=20 session-log events as breadcrumbs, ms-relative to ts", () => {
    logSessionEvent("lesson_start", { lessonId: "ja-m12" });
    vi.advanceTimersByTime(500);
    logSessionEvent("step_view", { stepIndex: 2, stepType: "build_sentence" });
    vi.advanceTimersByTime(300);

    reportError(new Error("boom"));

    const [report] = __getPendingQueueForTests();
    expect(report.breadcrumbs).toHaveLength(2);
    expect(report.breadcrumbs?.[0]).toMatchObject({ type: "lesson_start", payload: { lessonId: "ja-m12" } });
    expect(report.breadcrumbs?.[1]).toMatchObject({ type: "step_view" });
    // ms-relative and <= 0 (both breadcrumbs happened before the report).
    expect(report.breadcrumbs?.[0].t).toBeLessThanOrEqual(0);
    expect(report.breadcrumbs?.[1].t).toBeLessThanOrEqual(0);
    // The earlier event is further in the past — its `t` is more negative.
    expect(report.breadcrumbs![0].t).toBeLessThan(report.breadcrumbs![1].t);
  });

  it("keeps only the most recent 20 events when more were logged", () => {
    for (let i = 0; i < 25; i++) {
      logSessionEvent("step_view", { stepIndex: i });
      vi.advanceTimersByTime(10);
    }
    reportError(new Error("boom"));
    const [report] = __getPendingQueueForTests();
    expect(report.breadcrumbs).toHaveLength(20);
    // The oldest 5 (stepIndex 0-4) are dropped — the kept set starts at 5.
    // (Numeric payload values are JSON-stringified by trimBreadcrumbValue —
    // see `buildDiagnosticsDocument`'s tests below for the untrimmed shape.)
    expect(report.breadcrumbs?.[0].payload?.stepIndex).toBe("5");
    expect(report.breadcrumbs?.[19].payload?.stepIndex).toBe("24");
  });

  it("trims each payload value to <=120 chars", () => {
    logSessionEvent("dev_action", { note: "x".repeat(500) });
    reportError(new Error("boom"));
    const [report] = __getPendingQueueForTests();
    expect(report.breadcrumbs?.[0].payload?.note.length).toBe(120);
  });

  it("stringifies a non-string payload value before trimming", () => {
    logSessionEvent("review_grid_served", { servedAtomIds: 4, dueAtomIds: 9 });
    reportError(new Error("boom"));
    const [report] = __getPendingQueueForTests();
    expect(report.breadcrumbs?.[0].payload?.servedAtomIds).toBe("4");
  });

  it("drops the OLDEST breadcrumbs first to stay under the 4KB total budget", () => {
    // 20 events with a near-max payload value each comfortably exceeds 4KB
    // (20 * ~130B-per-value-alone already flirts with it; several keys per
    // event pushes it well over).
    for (let i = 0; i < 20; i++) {
      logSessionEvent("dev_action", { a: "x".repeat(120), b: "y".repeat(120), c: "z".repeat(120), i });
      vi.advanceTimersByTime(5);
    }
    reportError(new Error("boom"));
    const [report] = __getPendingQueueForTests();
    expect(report.breadcrumbs!.length).toBeGreaterThan(0);
    expect(report.breadcrumbs!.length).toBeLessThan(20);
    const bytes = new TextEncoder().encode(JSON.stringify(report.breadcrumbs)).length;
    expect(bytes).toBeLessThanOrEqual(4096);
    // Kept the MOST RECENT ones — the last logged event's `i` survives.
    expect(report.breadcrumbs!.at(-1)?.payload?.i).toBe("19");
  });

  it("a report with no session-log activity yet gets an empty breadcrumbs array, not an error", () => {
    reportError(new Error("boom"));
    const [report] = __getPendingQueueForTests();
    expect(report.breadcrumbs).toEqual([]);
  });

  it("breadcrumbs round-trip through a flush", async () => {
    logSessionEvent("lesson_start", { lessonId: "ja-m12" });
    reportError(new Error("boom"));
    await flushPending();
    const body = lastFetchBody(fetchSpy);
    expect(body.items[0].breadcrumbs).toEqual([
      { t: expect.any(Number), type: "lesson_start", payload: { lessonId: "ja-m12" } },
    ]);
  });

  // ── Diagnostics document (A3b, 2026-09-17) ──────────────────────────

  it("buildDiagnosticsDocument carries up to 200 raw session-log events, untrimmed values", () => {
    logSessionEvent("dev_action", { note: "y".repeat(500) });
    const doc = buildDiagnosticsDocument();
    expect(doc.sessionLog).toHaveLength(1);
    // Full fidelity — NOT the 120-char breadcrumb trim.
    expect((doc.sessionLog[0].payload as Record<string, string>).note.length).toBe(500);
    expect(doc.device.platform).toBe("web");
  });

  it("buildDiagnosticsDocument keeps only the most recent 200 events", () => {
    for (let i = 0; i < 210; i++) logSessionEvent("step_view", { stepIndex: i });
    const doc = buildDiagnosticsDocument();
    expect(doc.sessionLog).toHaveLength(200);
    expect(doc.sessionLog[0].payload.stepIndex).toBe(10);
    expect(doc.sessionLog[199].payload.stepIndex).toBe(209);
  });

  it("buildDiagnosticsDocument passes through the caller's layoutTrace/tapReplay opaquely", () => {
    const doc = buildDiagnosticsDocument({ layoutTrace: { frames: 3 }, tapReplay: { taps: [] } });
    expect(doc.layoutTrace).toEqual({ frames: 3 });
    expect(doc.tapReplay).toEqual({ taps: [] });
  });

  it("buildDiagnosticsDocument drops the OLDEST session-log events first to stay under the body budget", () => {
    for (let i = 0; i < 200; i++) {
      logSessionEvent("dev_action", { note: "x".repeat(900), i });
    }
    const doc = buildDiagnosticsDocument();
    const bytes = new TextEncoder().encode(JSON.stringify(doc)).length;
    expect(bytes).toBeLessThanOrEqual(145_000);
    expect(doc.sessionLog.length).toBeLessThan(200);
    expect(doc.sessionLog.at(-1)?.payload.i).toBe(199); // most recent survives
  });

  it("sendDiagnosticsReport posts the built document and returns the server's code", async () => {
    fetchSpy.mockResolvedValue(new Response(JSON.stringify({ code: "K7P4QX" }), { status: 202 }));
    logSessionEvent("lesson_start", { lessonId: "ja-m12" });

    const result = await sendDiagnosticsReport({});

    expect(result).toEqual({ ok: true, status: 202, code: "K7P4QX" });
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    const [url, init] = fetchSpy.mock.calls[0] as [string, RequestInit];
    expect(url).toMatch(/\/telemetry\/diagnostics$/);
    const sent = JSON.parse(init.body as string);
    expect(sent.sessionLog).toHaveLength(1);
  });

  it("sendDiagnosticsReport never throws — reports ok:false on a network failure", async () => {
    fetchSpy.mockRejectedValue(new TypeError("Failed to fetch"));
    await expect(sendDiagnosticsReport({})).resolves.toEqual({ ok: false, status: 0 });
  });

  // ── "Report a problem" additions (lane REPORTBTN, 2026-09-18) ─────────

  it("getLessonContext returns null outside a lesson, and the set context once inside one", () => {
    expect(getLessonContext()).toBeNull();
    setLessonContext({ lessonId: "ja-m12-03", stepIndex: 4, stepType: "build_sentence" });
    expect(getLessonContext()).toEqual({ lessonId: "ja-m12-03", stepIndex: 4, stepType: "build_sentence" });
    setLessonContext(null);
    expect(getLessonContext()).toBeNull();
  });

  it("buildDiagnosticsDocument respects maxSessionLogEvents (Report a problem's 20-event cap)", () => {
    for (let i = 0; i < 30; i++) logSessionEvent("step_view", { stepIndex: i });
    const doc = buildDiagnosticsDocument({ maxSessionLogEvents: 20 });
    expect(doc.sessionLog).toHaveLength(20);
    expect(doc.sessionLog[0].payload.stepIndex).toBe(10);
    expect(doc.sessionLog[19].payload.stepIndex).toBe(29);
  });

  it("buildDiagnosticsDocument still defaults to 200 events when maxSessionLogEvents is omitted", () => {
    for (let i = 0; i < 210; i++) logSessionEvent("step_view", { stepIndex: i });
    const doc = buildDiagnosticsDocument();
    expect(doc.sessionLog).toHaveLength(200);
  });

  it("buildDiagnosticsDocument carries note/screen and falls back to lessonContext for lessonId/stepIndex/stepType", () => {
    setLessonContext({ lessonId: "ja-m12-03", stepIndex: 4, stepType: "build_sentence" });
    const doc = buildDiagnosticsDocument({ note: "Tile bank looked wrong", screen: "lesson" });
    expect(doc.note).toBe("Tile bank looked wrong");
    expect(doc.screen).toBe("lesson");
    expect(doc.lessonId).toBe("ja-m12-03");
    expect(doc.stepIndex).toBe(4);
    expect(doc.stepType).toBe("build_sentence");
  });

  it("buildDiagnosticsDocument lets explicit lessonId/stepIndex/stepType override lessonContext", () => {
    setLessonContext({ lessonId: "ja-m12-03", stepIndex: 4, stepType: "build_sentence" });
    const doc = buildDiagnosticsDocument({ lessonId: "override-id", stepIndex: 9, stepType: "mcq" });
    expect(doc.lessonId).toBe("override-id");
    expect(doc.stepIndex).toBe(9);
    expect(doc.stepType).toBe("mcq");
  });

  it("buildDiagnosticsDocument trims note to REPORT_NOTE_MAX_CHARS (280) client-side", () => {
    const doc = buildDiagnosticsDocument({ note: "x".repeat(500) });
    expect(doc.note?.length).toBe(280);
  });

  it("buildDiagnosticsDocument omits note/lessonId/screen when not passed and no lesson context is set", () => {
    const doc = buildDiagnosticsDocument();
    expect(doc.note).toBeUndefined();
    expect(doc.lessonId).toBeUndefined();
    expect(doc.stepIndex).toBeUndefined();
    expect(doc.stepType).toBeUndefined();
    expect(doc.screen).toBeUndefined();
  });

  it("sendDiagnosticsReport posts note/lessonId/stepIndex/stepType/screen through to the wire body", async () => {
    fetchSpy.mockResolvedValue(new Response(JSON.stringify({ code: "AB3XY7" }), { status: 202 }));
    setLessonContext({ lessonId: "ja-m12-03", stepIndex: 4, stepType: "build_sentence" });

    const result = await sendDiagnosticsReport({
      note: "Something looked off",
      screen: "lesson",
      maxSessionLogEvents: 20,
    });

    expect(result).toEqual({ ok: true, status: 202, code: "AB3XY7" });
    const sent = lastFetchBody(fetchSpy) as unknown as Record<string, unknown>;
    expect(sent.note).toBe("Something looked off");
    expect(sent.screen).toBe("lesson");
    expect(sent.lessonId).toBe("ja-m12-03");
    expect(sent.stepIndex).toBe(4);
    expect(sent.stepType).toBe("build_sentence");
  });
});

describe("parseOsVersion", () => {
  it("parses an iOS UA", () => {
    const ua =
      "Mozilla/5.0 (iPhone; CPU iPhone OS 18_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148";
    expect(parseOsVersion(ua)).toBe("iOS 18.4");
  });

  it("parses an Android UA", () => {
    const ua = "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Mobile Safari/537.36";
    expect(parseOsVersion(ua)).toBe("Android 14");
  });

  it("returns undefined for a desktop UA with no single OS-version token", () => {
    const ua = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15";
    expect(parseOsVersion(ua)).toBeUndefined();
  });
});

describe("detectTimezone", () => {
  // `detectTimezone` caches its result process-wide (see errorReporter.ts)
  // — reset it before each test so one test's cached value can't leak
  // into the next and mask a real regression.
  beforeEach(() => {
    __resetErrorReporterForTests();
  });

  it("returns a real IANA zone string from Intl, not a raw offset", () => {
    const tz = detectTimezone();
    expect(typeof tz).toBe("string");
    expect(tz.length).toBeGreaterThan(0);
    // A real key looks like "Region/City" or is the literal "UTC" — never
    // a raw offset like "+05:00" (Intl.DateTimeFormat resolves to a zone
    // name, not an offset, on every runtime this app ships to).
    expect(tz === "UTC" || /\//.test(tz)).toBe(true);
  });

  it("falls back to UTC when Intl.DateTimeFormat throws", () => {
    const original = Intl.DateTimeFormat;
    // @ts-expect-error — deliberately breaking Intl for this one test.
    Intl.DateTimeFormat = () => {
      throw new Error("no Intl for you");
    };
    try {
      expect(detectTimezone()).toBe("UTC");
    } finally {
      Intl.DateTimeFormat = original;
    }
  });

  it("caches the result — a second call doesn't re-invoke Intl.DateTimeFormat", () => {
    const spy = vi.spyOn(Intl, "DateTimeFormat");
    detectTimezone();
    const callsAfterFirst = spy.mock.calls.length;
    detectTimezone();
    expect(spy.mock.calls.length).toBe(callsAfterFirst);
    spy.mockRestore();
  });
});
