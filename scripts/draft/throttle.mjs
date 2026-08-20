/**
 * throttle.mjs — thermal governor for long local-inference runs.
 *
 * The problem: a multi-hour drafting run on an M5 Max pins the GPU and the
 * laptop cooks. There is no user-level API to cap the GPU clock, so the only
 * honest lever is DUTY CYCLING: after a generation that took D seconds, sleep
 * D * (1/duty - 1) before starting the next one. At duty=0.8 that is a 25%
 * pause after every call, and sustained package power tracks the duty cycle
 * closely because inference is a square wave — full tilt or idle, nothing in
 * between.
 *
 * Levers, ranked by measured effect (see README "Thermal" section):
 *   1. duty cycle          — the only one that bounds SUSTAINED power. Works.
 *   2. num_thread          — caps CPU threads used for prompt processing.
 *                            Real but small on Metal builds; token generation
 *                            is GPU-bound and ignores it.
 *   3. taskpolicy -b       — background QoS on the CLIENT process only. The
 *                            heat is in the `ollama` server, which we do not
 *                            spawn, so this is near-zero. Included for honesty,
 *                            not effect.
 *   4. num_gpu (fewer layers on GPU) — DO NOT USE to cool. It moves work to the
 *                            CPU, which is slower AND hotter per token.
 *
 * `pmset -g therm` is the no-sudo verification: it records a warning level the
 * first time the OS throttles. Empty after a long run == we never hit the wall.
 */

const PERF_CORES = 12; // M5 Max: 12 performance + 6 efficiency (hw.perflevel*)

export function makeGovernor({
  duty = 1.0,
  label = "run",
  onTick = null,
} = {}) {
  if (duty <= 0 || duty > 1) throw new Error(`duty must be in (0,1], got ${duty}`);
  const stats = { calls: 0, busyMs: 0, sleptMs: 0, startedAt: Date.now() };

  return {
    /** Per-request Ollama options that respect the cap. */
    options(extra = {}) {
      return { num_thread: Math.max(1, Math.round(PERF_CORES * duty)), ...extra };
    },

    /** Wrap one generation. Times it, then pauses to hold the duty cycle. */
    async run(fn) {
      const t0 = Date.now();
      try {
        return await fn();
      } finally {
        const busy = Date.now() - t0;
        const sleep = duty >= 1 ? 0 : Math.round(busy * (1 / duty - 1));
        stats.calls += 1;
        stats.busyMs += busy;
        stats.sleptMs += sleep;
        if (onTick) onTick({ call: stats.calls, busyMs: busy, sleepMs: sleep });
        if (sleep > 0) await new Promise((r) => setTimeout(r, sleep));
      }
    },

    report() {
      const wall = Date.now() - stats.startedAt;
      const actualDuty = wall > 0 ? stats.busyMs / wall : 0;
      return {
        ...stats,
        wallMs: wall,
        targetDuty: duty,
        actualDuty: Number(actualDuty.toFixed(3)),
        label,
      };
    },
  };
}

/** Read the OS thermal record. Empty `warnings` == never throttled. */
export async function thermalState() {
  const { execFile } = await import("node:child_process");
  const { promisify } = await import("node:util");
  const run = promisify(execFile);
  try {
    const { stdout } = await run("pmset", ["-g", "therm"]);
    const warnings = stdout
      .split("\n")
      .filter((l) => /CPU_Speed_Limit|thermal warning level|performance warning/i.test(l))
      .filter((l) => !/No .* has been recorded/i.test(l))
      .map((l) => l.trim());
    return { throttled: warnings.length > 0, warnings, raw: stdout.trim() };
  } catch (e) {
    return { throttled: null, warnings: [], raw: `pmset failed: ${e.message}` };
  }
}
