/**
 * Layout-jump trace recorder — pure DOM, no dev/probe dependency, safe to
 * import from a RELEASE bundle.
 *
 * TestFlight #174 (2026-09-16, Spencer's 15 Pro Max @120Hz, build-sentence
 * step): each tile tap makes the prompt `<h2>` and the whole tile cluster
 * drop ~33 CSS px on alternate frames for ~130ms, then settle. It does not
 * reproduce on the iOS Simulator, so it can only be measured on the real
 * device — which means the recorder has to ship in the app itself and be
 * readable from the phone, not gated behind `import.meta.env.DEV` the way
 * `src/shared/dev/simProbe.ts` (the sim-capture harness) is.
 *
 * This module used to live inline in `simProbe.ts`. It moved out here so it
 * can be wired into the app's Sync panel (`src/features/sync/`); simProbe.ts
 * imports `recordLayoutTrace` back so its own tap-sequence capture is
 * unchanged.
 *
 * Two halves:
 *   - `sampleLayout` / `recordLayoutTrace` — the recorder itself. Pure DOM
 *     reads, one rAF loop, no allocation beyond the frame array.
 *   - `armLayoutTraceOnNextTap` / `isLayoutTraceArmed` / `getLastLayoutTrace`
 *     / `subscribeLayoutTrace` — the on-device workflow: arm from the Sync
 *     panel, walk to a lesson, tap a tile, come back to the panel and read
 *     the result. Arm state is localStorage-backed (`ol:layoutTrace:armed`)
 *     so it survives both an SPA navigation (module state would already
 *     survive that) AND a real page reload (backgrounding the native app can
 *     unload the WKWebView) — the single global listener below is
 *     (re)installed at import time and just reads localStorage on every tap.
 */

export interface LayoutTraceFrame {
  /** ms since trace start (performance.now based). */
  t: number;
  /** ms since the previous rAF callback — frame spacing. */
  dt: number;
  h2Top: number | null;
  trayTop: number | null;
  trayH: number | null;
  bankTop: number | null;
  bankH: number | null;
  stageH: number | null;
  /** `--tile-row-h` as computed on the first tray tile (px), or null. */
  rowH: number | null;
  /** `--tile-fit-scale` on the first tray tile, or null. */
  fitScale: number | null;
}

export interface LayoutTrace {
  frames: number;
  /** Frames whose geometry differs from the previous frame (first frame included). */
  changed: LayoutTraceFrame[];
  /** Largest |Δ h2Top| between consecutive frames. */
  maxH2Jump: number;
  /** Consecutive-frame h2Top moves that reverse direction — the flicker count. */
  h2Reversals: number;
  meanDt: number;
  maxDt: number;
}

const STAGE_SELECTOR = "[data-lesson-stage]";
/** The prompt element `h2Top` reads — 2026-09-17 (lane A5b, P1b open item 3):
 *  `build_sentence` renders its prompt as the stage's one `<h2>`; a
 *  `listening_build` route renders NO `<h2>` at all (its prompt is a `<p>`
 *  marked `data-lesson-prompt` — see `ListeningBuildStepView.tsx`), which is
 *  why `h2Stable`/`noFlicker` had been reporting N/A on every listening
 *  route in `sim-capture.mjs`'s build-verdicts. `simProbe.ts`'s
 *  `PROMPT_SELECTOR` was widened to this exact shape in P1b/build-25; this
 *  mirrors it here (same string, two files — P1b deliberately left this
 *  module alone at the time, shared as it is with the on-device Sync panel,
 *  and this lane is the one widening it). ADDITIVE ONLY: no build view
 *  renders both, so this changes nothing for a route that already had an
 *  `<h2>` (document order still resolves it first if it existed, and it's
 *  the only match either way). */
const PROMPT_SELECTOR = "h2, [data-lesson-prompt]";

/** DOM-dependent sample of the geometry the #174 jump lives in. Pure reads. */
export function sampleLayout(): Omit<LayoutTraceFrame, "t" | "dt"> {
  const stage = document.querySelector(STAGE_SELECTOR);
  const h2 = stage?.querySelector(PROMPT_SELECTOR) ?? null;
  const tray = stage?.querySelector('[data-tile-tray][data-kind="tray"]') ?? null;
  const bank = stage?.querySelector('[data-tile-tray][data-kind="bank"]') ?? null;
  const firstTrayTile = (tray?.querySelector("[data-tile]") ?? stage?.querySelector("[data-tile]")) as HTMLElement | null;
  const top = (el: Element | null) => (el ? Math.round(el.getBoundingClientRect().top * 10) / 10 : null);
  const height = (el: Element | null) => (el ? Math.round(el.getBoundingClientRect().height * 10) / 10 : null);
  const num = (v: string) => { const n = Number.parseFloat(v); return Number.isFinite(n) ? n : null; };
  const cs = firstTrayTile ? getComputedStyle(firstTrayTile) : null;
  return {
    h2Top: top(h2),
    trayTop: top(tray), trayH: height(tray),
    bankTop: top(bank), bankH: height(bank),
    stageH: height(stage),
    rowH: cs ? num(cs.getPropertyValue("--tile-row-h")) : null,
    fitScale: cs ? num(cs.getPropertyValue("--tile-fit-scale")) : null,
  };
}

/** Sample stage geometry on every rAF for `durationMs`, keeping only frames
 *  whose geometry changed from the previous one. One rAF loop, no allocation
 *  beyond the frame array. */
export function recordLayoutTrace(durationMs: number): Promise<LayoutTrace> {
  return new Promise((resolve) => {
    const t0 = performance.now();
    let last = t0;
    let prev: Omit<LayoutTraceFrame, "t" | "dt"> | null = null;
    let prevH2: number | null = null;
    let prevDir = 0;
    const changed: LayoutTraceFrame[] = [];
    let frames = 0;
    let maxH2Jump = 0;
    let h2Reversals = 0;
    let sumDt = 0;
    let maxDt = 0;
    const step = (now: number) => {
      const dt = frames === 0 ? 0 : now - last;
      last = now;
      frames += 1;
      if (frames > 1) { sumDt += dt; maxDt = Math.max(maxDt, dt); }
      const s = sampleLayout();
      const differs = !prev || (Object.keys(s) as (keyof typeof s)[]).some((k) => s[k] !== prev![k]);
      if (differs) changed.push({ t: Math.round((now - t0) * 10) / 10, dt: Math.round(dt * 10) / 10, ...s });
      if (s.h2Top !== null && prevH2 !== null) {
        const d = s.h2Top - prevH2;
        maxH2Jump = Math.max(maxH2Jump, Math.abs(d));
        const dir = d > 0.5 ? 1 : d < -0.5 ? -1 : 0;
        if (dir !== 0 && prevDir !== 0 && dir !== prevDir) h2Reversals += 1;
        if (dir !== 0) prevDir = dir;
      }
      prevH2 = s.h2Top;
      prev = s;
      if (now - t0 < durationMs) requestAnimationFrame(step);
      else resolve({ frames, changed, maxH2Jump, h2Reversals, meanDt: frames > 1 ? Math.round((sumDt / (frames - 1)) * 10) / 10 : 0, maxDt: Math.round(maxDt * 10) / 10 });
    };
    requestAnimationFrame(step);
  });
}

// ---------------------------------------------------------------------------
// On-device arm/read workflow for the Sync panel (bug #174).
// ---------------------------------------------------------------------------

const ARM_KEY = "ol:layoutTrace:armed";
const LAST_KEY = "ol:layoutTrace:last";
const TRACE_DURATION_MS = 700;

const listeners = new Set<() => void>();
function notify(): void {
  listeners.forEach((fn) => {
    try { fn(); } catch { /* keep going */ }
  });
}

/** Panel subscribes to be re-rendered when arm state or the last trace changes. */
export function subscribeLayoutTrace(fn: () => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function isLayoutTraceArmed(): boolean {
  if (typeof window === "undefined") return false;
  try { return localStorage.getItem(ARM_KEY) === "1"; } catch { return false; }
}

let recording = false;
/** True from the moment an armed tap fires until the 700ms trace resolves. */
export function isLayoutTraceRecording(): boolean {
  return recording;
}

function setArmed(v: boolean): void {
  try {
    if (v) localStorage.setItem(ARM_KEY, "1");
    else localStorage.removeItem(ARM_KEY);
  } catch { /* no storage */ }
  notify();
}

let lastTraceCache: LayoutTrace | null = null;

function setLastTrace(trace: LayoutTrace): void {
  lastTraceCache = trace;
  try { localStorage.setItem(LAST_KEY, JSON.stringify(trace)); } catch { /* quota */ }
  notify();
}

/** The most recent completed trace — in-memory cache first, localStorage
 *  fallback so the panel can read it after a full reload. */
export function getLastLayoutTrace(): LayoutTrace | null {
  if (lastTraceCache) return lastTraceCache;
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(LAST_KEY);
    if (!raw) return null;
    lastTraceCache = JSON.parse(raw) as LayoutTrace;
    return lastTraceCache;
  } catch { return null; }
}

let listenerInstalled = false;

/** Installed once, unconditionally, at import time — cheap (two capture
 *  listeners) and a no-op on every tap unless `isLayoutTraceArmed()`. Doing
 *  it this way (rather than only installing when armed) means arming
 *  survives navigating from the Sync panel to a lesson route even across a
 *  real page reload, with no route-specific wiring anywhere else. */
function installGlobalListener(): void {
  if (listenerInstalled || typeof document === "undefined") return;
  listenerInstalled = true;
  const handler = (e: Event) => {
    if (!isLayoutTraceArmed()) return;
    const target = e.target as Element | null;
    if (!target?.closest?.(STAGE_SELECTOR)) return;
    // One shot per arm — disarm before starting so a pointerdown followed
    // immediately by its own click doesn't fire the recorder twice.
    setArmed(false);
    recording = true;
    notify();
    void recordLayoutTrace(TRACE_DURATION_MS).then((trace) => {
      recording = false;
      setLastTrace(trace);
    });
  };
  document.addEventListener("pointerdown", handler, true);
  document.addEventListener("click", handler, true);
}

/** Arm: the next pointerdown/click inside `[data-lesson-stage]` anywhere in
 *  the app starts a 700ms `recordLayoutTrace`. */
export function armLayoutTraceOnNextTap(): void {
  installGlobalListener();
  setArmed(true);
}

export function disarmLayoutTrace(): void {
  setArmed(false);
}

/** Test seam — this module's arm/recording/last-trace state is module-level
 *  singleton state (by design: it must survive an SPA navigation), so tests
 *  need an explicit reset between cases. Does not remove localStorage keys —
 *  callers that need a clean slate should also clear those directly. */
export function resetLayoutTraceForTests(): void {
  recording = false;
  lastTraceCache = null;
}

installGlobalListener();
