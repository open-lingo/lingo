/**
 * Session telemetry buffer for tester walkthroughs.
 *
 * Lightweight in-memory + localStorage event log capturing what a real
 * tester does during a session. Designed for the M1/M2 walkthrough
 * feedback round (2026-05-17) — give us accurate time estimates +
 * surface bail points without requiring a real analytics backend.
 *
 * Wiring happens at fire sites (LessonPage, LearnPage, StepRenderer):
 * just call `logSessionEvent({ type, payload })`. The buffer is bounded
 * to MAX_EVENTS so localStorage doesn't blow up across long sessions.
 *
 * Export: `getSessionLog()` returns the array; `downloadSessionLog()`
 * triggers a JSON file download via the dev panel.
 *
 * No PII: don't put names, emails, or user-typed text in payloads —
 * stepId / lessonId / verdict / latency are fine.
 */

const STORAGE_KEY = "lingo_session_log_v1";
const SESSION_KEY = "lingo_session_id_v1";
const TESTER_KEY = "lingo_tester_mode_v1";
const MAX_EVENTS = 500;

export type SessionEventType =
  | "session_start"
  | "page_view"
  | "lesson_start"
  | "lesson_end"
  | "lesson_exit_mid"
  | "step_view"
  | "step_complete"
  | "speech_attempt"
  | "trace_attempt"
  | "module_complete"
  | "dev_action";

export type SessionEvent = {
  /** Epoch ms */
  ts: number;
  /** Session UUID — distinguishes one walkthrough from another */
  sid: string;
  /** Event family */
  type: SessionEventType;
  /** Free-form structured payload — keep small + PII-free */
  payload: Record<string, unknown>;
};

let buffer: SessionEvent[] = [];
const subscribers = new Set<() => void>();

/** Per-tab session id. Stable across navigations within the same tab. */
function getSessionId(): string {
  if (typeof window === "undefined") return "ssr";
  let sid = window.sessionStorage.getItem(SESSION_KEY);
  if (!sid) {
    sid = `s-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
    window.sessionStorage.setItem(SESSION_KEY, sid);
  }
  return sid;
}

function hydrate(): void {
  if (typeof window === "undefined" || buffer.length > 0) return;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) buffer = parsed.slice(-MAX_EVENTS);
    }
  } catch {
    /* fresh session */
  }
}

function persist(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(buffer));
  } catch {
    /* quota — drop silently */
  }
}

export function logSessionEvent(
  type: SessionEventType,
  payload: Record<string, unknown> = {},
): void {
  hydrate();
  const event: SessionEvent = {
    ts: Date.now(),
    sid: getSessionId(),
    type,
    payload,
  };
  buffer.push(event);
  if (buffer.length > MAX_EVENTS) buffer = buffer.slice(-MAX_EVENTS);
  persist();
  for (const cb of subscribers) cb();
}

export function getSessionLog(): readonly SessionEvent[] {
  hydrate();
  return buffer;
}

export function subscribeSessionLog(cb: () => void): () => void {
  subscribers.add(cb);
  return () => subscribers.delete(cb);
}

export function clearSessionLog(): void {
  buffer = [];
  if (typeof window !== "undefined") {
    window.localStorage.removeItem(STORAGE_KEY);
  }
  for (const cb of subscribers) cb();
}

/**
 * Trigger a JSON file download with the full session log. Filename is
 * `lingo-tester-{sid}-L{NN}.json` where NN is lessons-completed-so-far,
 * so the latest auto-download supersedes prior ones — the tester only
 * needs to email the highest-numbered file at the end of their session.
 */
export function downloadSessionLog(): void {
  if (typeof window === "undefined") return;
  const completed = buffer.filter((e) => e.type === "lesson_end").length;
  const ls = String(completed).padStart(2, "0");
  const blob = new Blob([JSON.stringify(buffer, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `lingo-tester-${getSessionId()}-L${ls}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Tester mode — when on, `downloadSessionLogIfTester()` auto-fires a
 * fresh download every time LessonPage logs a `lesson_end` or
 * `lesson_exit_mid`. Activated by `?tester=1` URL param (sticks via
 * localStorage) or the dev-panel toggle. Default off so production
 * users never get unsolicited downloads.
 *
 * Chromium prompts once for "allow multiple downloads from this site"
 * — tester clicks Allow and every subsequent lesson auto-saves a fresh
 * cumulative JSON.
 */
export function isTesterMode(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const params = new URLSearchParams(window.location.search);
    const flag = params.get("tester");
    if (flag === "1") window.localStorage.setItem(TESTER_KEY, "1");
    else if (flag === "0") window.localStorage.removeItem(TESTER_KEY);
  } catch {
    /* ignore */
  }
  return window.localStorage.getItem(TESTER_KEY) === "1";
}

export function setTesterMode(on: boolean): void {
  if (typeof window === "undefined") return;
  if (on) window.localStorage.setItem(TESTER_KEY, "1");
  else window.localStorage.removeItem(TESTER_KEY);
  for (const cb of subscribers) cb();
}

export function downloadSessionLogIfTester(): void {
  if (!isTesterMode()) return;
  downloadSessionLog();
}

/**
 * Summary helpers — quick read of the log for the dev panel without
 * dumping the full array. "Module 1 total time", "lesson count",
 * "speaking attempts", etc.
 */
export type SessionSummary = {
  sessionId: string;
  firstEventAt: number | null;
  lastEventAt: number | null;
  eventCount: number;
  lessonsStarted: number;
  lessonsCompleted: number;
  speechAttempts: number;
  traceAttempts: number;
  exitsMid: number;
  totalActiveMs: number;
  perLessonMs: Array<{
    lessonId: string;
    startedAt: number;
    endedAt: number;
    ms: number;
    completed: boolean;
  }>;
};

export function summarizeSessionLog(): SessionSummary {
  hydrate();
  const sid = getSessionId();
  const events = buffer.filter((e) => e.sid === sid);
  const summary: SessionSummary = {
    sessionId: sid,
    firstEventAt: events[0]?.ts ?? null,
    lastEventAt: events[events.length - 1]?.ts ?? null,
    eventCount: events.length,
    lessonsStarted: 0,
    lessonsCompleted: 0,
    speechAttempts: 0,
    traceAttempts: 0,
    exitsMid: 0,
    totalActiveMs: 0,
    perLessonMs: [],
  };
  const lessonStarts = new Map<string, number>();
  for (const e of events) {
    if (e.type === "lesson_start") {
      summary.lessonsStarted++;
      const id = String(e.payload.lessonId ?? "?");
      lessonStarts.set(id, e.ts);
    } else if (e.type === "lesson_end") {
      summary.lessonsCompleted++;
      const id = String(e.payload.lessonId ?? "?");
      const start = lessonStarts.get(id);
      if (start) {
        summary.perLessonMs.push({
          lessonId: id,
          startedAt: start,
          endedAt: e.ts,
          ms: e.ts - start,
          completed: true,
        });
        lessonStarts.delete(id);
      }
    } else if (e.type === "lesson_exit_mid") {
      summary.exitsMid++;
      const id = String(e.payload.lessonId ?? "?");
      const start = lessonStarts.get(id);
      if (start) {
        summary.perLessonMs.push({
          lessonId: id,
          startedAt: start,
          endedAt: e.ts,
          ms: e.ts - start,
          completed: false,
        });
        lessonStarts.delete(id);
      }
    } else if (e.type === "speech_attempt") {
      summary.speechAttempts++;
    } else if (e.type === "trace_attempt") {
      summary.traceAttempts++;
    }
  }
  summary.totalActiveMs = summary.perLessonMs.reduce((acc, l) => acc + l.ms, 0);
  return summary;
}
