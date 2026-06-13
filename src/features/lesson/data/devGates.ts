/**
 * Dev dials for lesson pacing gates, URL-tunable like the density preset
 * (`?trace-gate=0` disables the trace skip gate for the session,
 * `?trace-gate=1` re-enables it). Spencer 2026-06-13: the earned-skip
 * gate on trace steps is right for learners but pure friction when
 * dev-testing — this keeps the gate on by default and one query param
 * away from off.
 */

const TRACE_GATE_OFF_KEY = "lingo_trace_skip_gate_off";

export function isTraceSkipGateDisabled(): boolean {
  try {
    return sessionStorage.getItem(TRACE_GATE_OFF_KEY) === "1";
  } catch {
    return false;
  }
}

/** Consume `?trace-gate=` from the URL. Returns true if it was present. */
export function applyTraceGateQueryParam(params: URLSearchParams): boolean {
  if (!params.has("trace-gate")) return false;
  const v = params.get("trace-gate");
  try {
    sessionStorage.setItem(TRACE_GATE_OFF_KEY, v === "0" ? "1" : "0");
  } catch {
    // sessionStorage unavailable — gate stays default-on.
  }
  params.delete("trace-gate");
  return true;
}

/**
 * `?step=N` — jump straight to step index N (clamped). Exists because the
 * match-overflow regression shipped unverified when the driver couldn't
 * REACH a match step: every step type must be directly addressable or it
 * silently drops out of layout verification.
 */
export function consumeStepJumpParam(params: URLSearchParams): number | null {
  if (!params.has("step")) return null;
  const raw = Number(params.get("step"));
  params.delete("step");
  return Number.isInteger(raw) && raw >= 0 ? raw : null;
}

const TRAY_OVERRIDE_KEY = "lingo_tray_override";

/** Dev dial: `?tray=slots|pill` forces the word-build tray variant for
 *  the session (`?tray=` clears). Demo/QA only — the real switch is
 *  review context. */
export function getTrayOverride(): "slots" | "pill" | null {
  try {
    const v = sessionStorage.getItem(TRAY_OVERRIDE_KEY);
    return v === "slots" || v === "pill" ? v : null;
  } catch {
    return null;
  }
}

export function applyTrayOverrideParam(params: URLSearchParams): boolean {
  if (!params.has("tray")) return false;
  const v = params.get("tray");
  try {
    if (v === "slots" || v === "pill") sessionStorage.setItem(TRAY_OVERRIDE_KEY, v);
    else sessionStorage.removeItem(TRAY_OVERRIDE_KEY);
  } catch {
    // unavailable — no override.
  }
  params.delete("tray");
  return true;
}
