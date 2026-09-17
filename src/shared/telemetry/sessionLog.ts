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

/**
 * Golden-learner replay (2026-09-17, lane A2d, docs/golden-replay-2026-09-17.md
 * §"how it's recorded"). Same "sim probe armed" flag `src/shared/dev/simProbe.ts`
 * checks — only ever set by the `/__sim` dev-capture harness (never on a real
 * TestFlight build), so this module never imports simProbe.ts (out of this
 * lane's owned files) and simProbe.ts never imports this module either; the
 * two agree on the flag's NAME by hand, the same "kept in sync by hand"
 * pattern already used between sim-capture.mjs and simProbe.ts elsewhere in
 * this harness.
 */
const SIM_PROBE_ARMED_KEY = "lingo:sim-probe";
/** A learner can tap a huge bank's tiles far more than 60 times in one step
 *  (undo/redo, exploring); cap so one pathological step can't eat the whole
 *  500-event buffer and crowd out lesson_start/lesson_end/etc. from the
 *  session that matters most — the walkthrough as a whole, not one step's
 *  every fidget. */
const MAX_TAPS_PER_STEP = 60;

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
  | "dev_action"
  | "review_grid_served"
  | "tile_tap";

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
  _reviewGridSummaryCache = null;
  for (const cb of subscribers) cb();
}

/**
 * A8 (2026-09-17, docs/learning-loop-2026-09-17.md) — one compact,
 * counts-only event per review-grid/practice-padding step actually served
 * to the learner (`getMockLessonContent`'s pad pass, `reviewGridTelemetry.ts`).
 * No atom ids, no text — just counts, so it's ID-plural-free and safe under
 * the existing "no PII" rule even more conservatively than that rule
 * requires. `dueAtomIds` is the WHOLE due-set size at record time (a fixed
 * per-lesson-load denominator), not a per-step candidate-pool size — see
 * the doc for why, and for the "of N due atoms, the grids served M" read.
 */
export type ReviewGridServedPayload = {
  lessonId: string;
  stepIndex: number;
  /** Atoms this step exercises (graded — see `_stepPredicates.shouldWriteSrs`). */
  servedAtomIds: number;
  /** Total atoms due (FSRS `isDue`) in the store at record time. */
  dueAtomIds: number;
  /** Of this step's served atoms, how many were also due. */
  overlap: number;
  /** Of this step's served atoms, how many were NOT due (heuristic draw). */
  notDueServed: number;
  /** Due atoms this step did NOT touch (dueAtomIds - overlap). */
  dueNotServed: number;
};

export function logReviewGridServed(payload: ReviewGridServedPayload): void {
  logSessionEvent("review_grid_served", payload);
}

/**
 * Golden-learner replay (2026-09-17, lane A2d). One row per tile tap on a
 * `build_sentence`/`listening_build` step — Spencer's walk becomes a
 * replayable fixture instead of a bug report. PII-free: `label` is lesson
 * content (a tile's own text, e.g. a kana or gloss word), never anything
 * the learner typed. See docs/golden-replay-2026-09-17.md.
 */
export type TileTapPayload = {
  lessonId: string;
  /** 0-indexed, matches the `?step=N` route param. */
  stepIndex: number;
  stepType: string;
  /** The tile's own text, exactly as rendered — the replay matches on this,
   *  not on coordinates or a DOM index. */
  label: string;
  /** `"bank"` — tapped an unplaced tile to add it. `"answer"` — tapped an
   *  already-placed tray tile to remove it. */
  source: "bank" | "answer";
  /** Tray slot index: the slot this tap fills (`source: "bank"`) or empties
   *  (`source: "answer"`). */
  position: number;
  /** ms since the step view mounted (an approximation of "since step_view"
   *  — see the doc's limits section). */
  tMs: number;
  /** Accessibility text-size setting, as a PERCENT (100 = default), same
   *  unit `sim-capture.mjs --font-scale` takes. */
  fontScalePct: number;
  viewportW: number;
};

function isSimProbeArmed(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(SIM_PROBE_ARMED_KEY) === "1";
  } catch {
    return false;
  }
}

/**
 * Fire-and-forget: lets an automated golden-recording run (`sim-capture.mjs
 * --simulate build --record-golden <name>`) reconstruct the tap sequence
 * from the SAME `/__sim/report` channel every other sim-probe report
 * already uses (`src/shared/dev/simProbe.ts`'s `postSimMarker`) — the
 * middleware appends whatever JSON body it's given, no schema needed. A
 * real tester's phone never sets `lingo:sim-probe`, so this never fires
 * outside the dev capture harness. Best-effort: a failed POST (no network,
 * SSR, `fetch` unavailable) drops the row silently — the local buffer
 * already has it either way.
 */
function postTileTapIfArmed(event: SessionEvent): void {
  if (typeof window === "undefined" || typeof fetch !== "function") return;
  if (!isSimProbeArmed()) return;
  try {
    void fetch("/__sim/report", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ tapEvent: event }),
    }).catch(() => {
      /* best effort */
    });
  } catch {
    /* no fetch — best effort */
  }
}

export function logTileTap(payload: TileTapPayload): void {
  hydrate();
  const sid = getSessionId();
  const countForStep = buffer.filter(
    (e) =>
      e.sid === sid &&
      e.type === "tile_tap" &&
      (e.payload as Partial<TileTapPayload>).lessonId === payload.lessonId &&
      (e.payload as Partial<TileTapPayload>).stepIndex === payload.stepIndex,
  ).length;
  if (countForStep >= MAX_TAPS_PER_STEP) return; // cap — see MAX_TAPS_PER_STEP doc comment
  logSessionEvent("tile_tap", payload);
  const event = buffer[buffer.length - 1];
  if (event) postTileTapIfArmed(event);
}

/**
 * The document Spencer's phone panel ("Copy tap replay", next to "Copy
 * JSON" in the Layout-trace panel) copies out, and the shape
 * `sim-capture.mjs --replay <file>` consumes. Groups the taps belonging to
 * the MOST RECENTLY tapped step (lessonId+stepIndex) in this session — the
 * step Spencer is looking at when he hits Copy. `null` when nothing has
 * been tapped yet this session.
 */
export type TapReplayDoc = {
  route: string;
  /** `"WxH"` CSS px, e.g. `"430x932"` — matches `sim-capture.mjs`'s literal
   *  `--viewport WxH` layout-emulation form, so a recorded file replays
   *  under the SAME viewport with no separate device-key mapping needed. */
  viewport: string;
  /** Percent, e.g. 100 or 125 — matches `--font-scale`. */
  fontScale: number;
  taps: Array<{ tMs: number; label: string; source: "bank" | "answer"; position: number }>;
};

export function buildTapReplayDocument(): TapReplayDoc | null {
  hydrate();
  const sid = getSessionId();
  const tapEvents = buffer.filter(
    (e) => e.sid === sid && e.type === "tile_tap",
  ) as (SessionEvent & { payload: TileTapPayload })[];
  if (tapEvents.length === 0) return null;
  const last = tapEvents[tapEvents.length - 1];
  const { lessonId, stepIndex } = last.payload;
  const stepTaps = tapEvents.filter(
    (e) => e.payload.lessonId === lessonId && e.payload.stepIndex === stepIndex,
  );
  const route =
    typeof window !== "undefined" ? `${window.location.pathname}${window.location.search}` : "";
  const viewport =
    typeof window !== "undefined" ? `${window.innerWidth}x${window.innerHeight}` : "";
  return {
    route,
    viewport,
    fontScale: Math.round(last.payload.fontScalePct),
    taps: stepTaps.map((e) => ({
      tMs: e.payload.tMs,
      label: e.payload.label,
      source: e.payload.source,
      position: e.payload.position,
    })),
  };
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
  _reviewGridSummaryCache = null;
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

/**
 * Dev-panel read of every `review_grid_served` event this session — see
 * `ReviewGridServedPayload`. Because the underlying events are counts (not
 * atom ids), `stepsOverlappingDue` / `stepsAtomsServed` are SUMS across
 * steps, which double-counts an atom served by two different steps in the
 * same session; treat this as a rough "how much of what we served lined up
 * with what FSRS says is due" signal, not an exact unique-atom count. Read
 * guidance: docs/learning-loop-2026-09-17.md §"reading the summary".
 */
export type ReviewGridSummary = {
  /** Steps that carried at least one graded atom (rows logged). */
  stepsServed: number;
  /** Distinct lessons that logged at least one row. */
  lessonsSeen: number;
  /** Sum of `servedAtomIds` across every logged row. */
  totalAtomSlotsServed: number;
  /** Sum of `overlap` — served-and-also-due — across every logged row. */
  totalOverlap: number;
  /** Sum of `notDueServed` across every logged row. */
  totalNotDueServed: number;
  /** `dueAtomIds` from the MOST RECENT row (a live snapshot, not a sum). */
  latestDueAtomCount: number;
  /** `totalOverlap / totalAtomSlotsServed`, 0 when nothing was served. */
  overlapRate: number;
};

// Cached so `useSyncExternalStore(subscribeSessionLog, summarizeReviewGridEvents, …)`
// gets a STABLE reference between events — a fresh object on every call
// (React calls getSnapshot on every render, not just after a notify) reads
// as "always changed" and loops. Invalidated by `logSessionEvent` /
// `clearSessionLog`, the only two places `buffer` changes.
let _reviewGridSummaryCache: ReviewGridSummary | null = null;

export function summarizeReviewGridEvents(): ReviewGridSummary {
  if (_reviewGridSummaryCache) return _reviewGridSummaryCache;
  hydrate();
  const sid = getSessionId();
  const rows = buffer.filter(
    (e) => e.sid === sid && e.type === "review_grid_served",
  ) as (SessionEvent & { payload: ReviewGridServedPayload })[];
  const lessons = new Set<string>();
  let totalAtomSlotsServed = 0;
  let totalOverlap = 0;
  let totalNotDueServed = 0;
  for (const row of rows) {
    lessons.add(row.payload.lessonId);
    totalAtomSlotsServed += row.payload.servedAtomIds;
    totalOverlap += row.payload.overlap;
    totalNotDueServed += row.payload.notDueServed;
  }
  const latest = rows[rows.length - 1];
  _reviewGridSummaryCache = {
    stepsServed: rows.length,
    lessonsSeen: lessons.size,
    totalAtomSlotsServed,
    totalOverlap,
    totalNotDueServed,
    latestDueAtomCount: latest?.payload.dueAtomIds ?? 0,
    overlapRate: totalAtomSlotsServed > 0 ? totalOverlap / totalAtomSlotsServed : 0,
  };
  return _reviewGridSummaryCache;
}
