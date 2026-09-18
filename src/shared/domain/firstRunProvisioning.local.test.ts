/**
 * First-login 404 storm reproduction, runnable locally with NO AWS
 * (FIRSTRUN lane, 2026-09-18). Spins up a real lingo-core on SQLite
 * (`DB_BACKEND=sqlite`, a fresh temp DB) — same pattern as
 * `syncTwoDevices.local.test.ts` — and replays the client's real
 * first-login boot-wave endpoint set against a FRESH, NEVER-REGISTERED
 * `X-Dev-User` identity, exactly like the evidence lead: CloudWatch
 * `lingo.access`, user hash f3fd3518, platform=android, 2026-09-18
 * 21:39:47–21:40:13 UTC — GET /boot, GET /progress/me (x5), GET /quests
 * (x2), GET /users/me (x2), /users/me/subscriptions, /users/me/settings,
 * /srs/state, /progress/me/unlocks, POST /progress/me/touch — ALL 404 —
 * until POST /users/me created the row 26s later.
 *
 * MUST fail on the pre-fix lingo-core (every one of those routes 404s for
 * an unregistered identity) and pass once `get_registered_user`
 * auto-provisions (`app/auth/dependencies.py::_provision_user`).
 *
 * SKIPPED BY DEFAULT — spawns a real Python process. Run explicitly:
 *
 *   RUN_SYNC_PROOF=1 npx vitest run src/shared/domain/firstRunProvisioning.local.test.ts
 *
 * Requires `lingo-core/.venv` to exist. Override the lingo-core path with
 * LINGO_CORE_DIR, the port with FIRSTRUN_PROOF_PORT (default 8973) if
 * either default doesn't fit the machine — deliberately a different
 * default port than `syncTwoDevices.local.test.ts`'s 8971 so both proofs
 * can run concurrently without colliding.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { type ChildProcessWithoutNullStreams, spawn } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
// happy-dom's `fetch` polyfill enforces Same-Origin/CORS against a fake page
// origin, which blocks a plain cross-origin call to the local lingo-core
// server we spawn below. Swap in undici's real fetch for JUST this suite
// (restored in afterAll) — this is a test-environment workaround, not an app
// behavior change. Same pattern as syncTwoDevices.local.test.ts.
import { fetch as undiciFetch } from "undici";

const RUN = process.env.RUN_SYNC_PROOF === "1";
const CORE_DIR = process.env.LINGO_CORE_DIR ?? "/Users/lichfield/Documents/projects/lingle/lingo-core";
const PORT = Number(process.env.FIRSTRUN_PROOF_PORT ?? 8973);
const BASE_URL = `http://127.0.0.1:${PORT}`;

async function waitForHealth(url: string, timeoutMs: number): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  let lastErr: unknown;
  while (Date.now() < deadline) {
    try {
      const res = await fetch(url);
      if (res.ok) return;
    } catch (err) {
      lastErr = err;
    }
    await new Promise((r) => setTimeout(r, 250));
  }
  throw new Error(`lingo-core never answered ${url}: ${String(lastErr)}`);
}

/** The exact endpoint set from the FIRSTRUN evidence, in the order the
 * boot wave fires them (boot itself first — it's what the client's
 * `bootCache.ts` lazy-kickoff races to trigger — then the rest of the
 * wave, which would have been served from it before falling through). */
function stormRequests(sub: string): Array<[string, string, RequestInit?]> {
  const headers = { "X-Dev-User": sub };
  return [
    ["GET", "/api/core/v1/boot", { headers }],
    ["GET", "/api/core/v1/progress/me", { headers }],
    ["GET", "/api/core/v1/quests", { headers }],
    ["GET", "/api/core/v1/users/me", { headers }],
    ["GET", "/api/core/v1/users/me/subscriptions", { headers }],
    ["GET", "/api/core/v1/users/me/settings", { headers }],
    ["GET", "/api/core/v1/srs/state", { headers }],
    ["GET", "/api/core/v1/progress/me/unlocks", { headers }],
    ["POST", "/api/core/v1/progress/me/touch", { headers, method: "POST" }],
    ["GET", "/api/core/v1/users/discover", { headers }],
  ];
}

describe.skipIf(!RUN)("first-login 404 storm — local lingo-core, no AWS", () => {
  let server: ChildProcessWithoutNullStreams;
  let dbDir: string;
  let serverLog = "";
  const originalFetch = globalThis.fetch;

  beforeAll(async () => {
    globalThis.fetch = undiciFetch as unknown as typeof fetch;
    dbDir = mkdtempSync(join(tmpdir(), "firstrun-proof-"));
    const dbPath = join(dbDir, "proof.db");

    server = spawn(
      join(CORE_DIR, ".venv/bin/uvicorn"),
      ["app.main:app", "--port", String(PORT)],
      {
        cwd: CORE_DIR,
        env: {
          ...process.env,
          DB_BACKEND: "sqlite",
          SQLITE_PATH: dbPath,
          DEBUG: "true",
          // No DEV_USER here — each request below stamps its own
          // X-Dev-User so every test gets a fresh, never-touched
          // identity (a real first login).
          AWS_ACCESS_KEY_ID: "",
          AWS_SECRET_ACCESS_KEY: "",
          AWS_SESSION_TOKEN: "",
          AWS_PROFILE: "",
        },
      },
    );
    server.stdout.on("data", (d) => { serverLog += String(d); });
    server.stderr.on("data", (d) => { serverLog += String(d); });

    await waitForHealth(`${BASE_URL}/health`, 20_000);
  }, 30_000);

  afterAll(() => {
    globalThis.fetch = originalFetch;
    server?.kill();
    try {
      rmSync(dbDir, { recursive: true, force: true });
    } catch {
      /* best effort */
    }
    if (process.env.SYNC_PROOF_VERBOSE === "1") {
      // eslint-disable-next-line no-console
      console.log("[lingo-core log]\n" + serverLog);
    }
  });

  it("a brand-new identity's boot-wave endpoint set produces zero 404s", async () => {
    const sub = `firstrun-proof|${crypto.randomUUID()}`;
    const results: Array<{ method: string; path: string; status: number }> = [];

    for (const [method, path, init] of stormRequests(sub)) {
      const res = await fetch(`${BASE_URL}${path}`, init);
      results.push({ method, path, status: res.status });
    }

    const notFound = results.filter((r) => r.status === 404);
    expect(notFound, `404s: ${JSON.stringify(notFound)}\nall: ${JSON.stringify(results)}`).toEqual([]);

    // And the provisioned row is real and inert (no XP/quest side
    // effects from mere provisioning) — fetch it back once more.
    const me = await (
      await fetch(`${BASE_URL}/api/core/v1/users/me`, { headers: { "X-Dev-User": sub } })
    ).json();
    expect(me.auth0_id).toBe(sub);
    expect(me.display_name).toBe("");
    expect(me.xp).toBe(0);
  }, 15_000);

  it("two requests racing on the SAME brand-new identity converge on one row", async () => {
    const sub = `firstrun-proof-race|${crypto.randomUUID()}`;
    const headers = { "X-Dev-User": sub };

    const [bootRes, meRes] = await Promise.all([
      fetch(`${BASE_URL}/api/core/v1/boot`, { headers }),
      fetch(`${BASE_URL}/api/core/v1/users/me`, { headers }),
    ]);
    expect(bootRes.status).toBe(200);
    expect(meRes.status).toBe(200);

    const boot = await bootRes.json();
    const me = await meRes.json();
    expect(boot.user.id).toBe(me.id);
  }, 15_000);
});
