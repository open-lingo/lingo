#!/usr/bin/env node
/**
 * Exhaustively sweep the CDN for every hash in one or more TTS manifests and
 * record which ones are actually live, so `manifestCoverage.test.ts` can gate
 * commits on it without re-sweeping the CDN on every `vitest run`.
 *
 *   node scripts/tts-live-snapshot.mjs es fr
 *   node scripts/tts-live-snapshot.mjs          # every manifest except index.json
 *
 * ## Why this exists
 *
 * `scripts/verify-tts-cdn.mjs` samples 25 hashes across ALL languages and is
 * not run in CI. On 2026-09-13, 589 ES manifest hashes turned out to be
 * neither staged in `tts-publish/es/` nor uploaded to the bucket by an
 * earlier lingo-data pipeline run, and nothing noticed — the sample never
 * happened to land on one of the 589.
 *
 * This script is the exhaustive counterpart: it HEADs every hash for the
 * given language(s) and writes the confirmed-live set to
 * `tts-publish/live/<lang>.txt`, one hash per line, sorted. That file is a
 * point-in-time snapshot, not a live check — see `tts-publish/README.md` for
 * when to regenerate it. `manifestCoverage.test.ts` treats a manifest hash as
 * covered when it is either staged in `tts-publish/<lang>/` (about to ship in
 * this commit) or listed in the live snapshot (already on the CDN).
 *
 * CloudFront returns HTTP 200 `text/html` (the SPA-shell fallback) for a
 * missing object, not a 404 — so "live" is defined as `content-type:
 * audio/*`, never bare response.ok. See verify-tts-cdn.mjs's header comment
 * for the incident this bit us on before (2026-07-29).
 *
 * Deliberately NOT run for ja here (15.7k HEADs) — see the ja/ko snapshot
 * lane tracked separately. Pass langs explicitly to scope a run.
 *
 * ## Poisoned-pass handling (2026-09-16)
 *
 * CloudFront/WAF sometimes serves `text/html` (the SPA shell) for EVERY
 * request during a rate-limit or edge hiccup window, not just genuinely
 * unpublished clips — one ja-keita run reported 488 not-live, the very next
 * re-run of the identical pass reported 242. Two guards against that:
 *   1. Retry pass — after the main sweep, every not-live hash gets ONE more
 *      HEAD after a ≥2s pause; only a hash that fails both counts as missing.
 *   2. Poison guard — if >25% of a language's hashes come back `text/html`
 *      in one pass, the whole pass is discarded (nothing written), and the
 *      pass is redone after a 10s wait, up to 3 attempts total.
 * Each language prints one summary line: live / not-live / retried-recovered
 * / attempts. The output file format (`tts-publish/live/<lang>.txt`, sorted
 * hash-per-line) is unchanged.
 */
import { readFileSync, readdirSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const MANIFEST_DIR = resolve(__dirname, "../src/shared/tts/manifests");
const LIVE_DIR = resolve(__dirname, "../tts-publish/live");

const HASH_LEN = 16;
// WAF on the app distro rate-limits to 2,000 requests / 5 min / IP; past that
// EVERY path (even the entry JS) comes back as the SPA shell for a few
// minutes, which reads as "not live". One stream with 300 ms spacing stays
// at ≈1,000 / 5 min. Measured 2026-09-13: two 4-way sweeps tripped it.
const CONCURRENCY = 1;
const SPACING_MS = 300;
const RETRIES = 3;
const BACKOFF_MS = 500;

// A whole-pass poisoning event (WAF/CloudFront serving the SPA shell for
// EVERYTHING, not just genuinely-missing clips) looks identical to a mass
// unpublish unless we count it separately. Measured 2026-09-16 on ja-keita:
// one pass reported 488 not-live, a re-run of the exact same pass reported
// 242 — the first pass was poisoned, not a real regression.
export const RETRY_DELAY_MS = 2000; // ≥2s pause before the not-live retry pass
export const POISON_FRACTION = 0.25; // >25% html in one pass = treat the pass as poisoned
export const POISON_WAIT_MS = 10_000;
export const MAX_PASS_ATTEMPTS = 3;

function configuredBase() {
  for (const file of [".env.native", ".env"]) {
    try {
      const body = readFileSync(resolve(__dirname, "..", file), "utf-8");
      const found = body.match(/^VITE_ASSET_BASE_URL=(.+)$/m)?.[1]?.trim();
      if (found) return found;
    } catch {
      // Not every checkout has every env file; fall through to the next.
    }
  }
  return "https://app.openlingoapp.com";
}

const BASE = configuredBase().replace(/\/+$/, "");

function allLangs() {
  return readdirSync(MANIFEST_DIR)
    .filter((f) => f.endsWith(".json") && f !== "index.json")
    .map((f) => f.slice(0, -".json".length));
}

// Pull the hash16 out of an override path like "tts/v1/ja-keita/<hash16>.mp3".
const OVERRIDE_PATH_RE = /([0-9a-f]{16})\.mp3$/;

function hashOfPath(path) {
  return OVERRIDE_PATH_RE.exec(path)?.[1] ?? null;
}

// Mirrors src/shared/tts/manifest.ts's resolveTtsPath and
// manifestCoverage.test.ts's hashesOf(): schema 2 overrides (string or
// string[] per key — multi-voice entries, or an entirely override-only
// manifest like ja-keita) are real, resolvable hashes too, not just the
// derived `hashes` blob. Missing this is exactly how 242 ja-keita hashes
// went unswept (loadManifest used to report "0 hashes, nothing to sweep").
function loadManifest(lang) {
  const path = join(MANIFEST_DIR, `${lang}.json`);
  const doc = JSON.parse(readFileSync(path, "utf-8"));
  const hashes = [];
  const src = doc.hashes ?? "";
  for (let i = 0; i + HASH_LEN <= src.length; i += HASH_LEN) {
    hashes.push(src.slice(i, i + HASH_LEN));
  }
  for (const entry of Object.values(doc.overrides ?? {})) {
    const paths = Array.isArray(entry) ? entry : [entry];
    for (const p of paths) {
      const hash = hashOfPath(p);
      if (hash) hashes.push(hash);
    }
  }
  return { prefix: doc.prefix, hashes };
}

async function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

/** HEAD one clip, retrying transient (network) failures. Returns "live" for a
 * confirmed `audio/*` response, "html" for a definitive non-audio 200 (the
 * SPA-shell fallback — the poisoning signature), or "other" for a clean 4xx
 * or an exhausted network retry. */
export async function probeOnce(url) {
  for (let attempt = 0; attempt <= RETRIES; attempt++) {
    try {
      const res = await fetch(url, { method: "HEAD" });
      const type = res.headers.get("content-type") ?? "";
      if (res.ok && type.startsWith("audio/")) return "live";
      if (res.ok && type.startsWith("text/html")) return "html";
      // A clean 4xx means "not live" — no point retrying those, only
      // network hiccups get the retry budget below.
      if (res.ok || (res.status >= 400 && res.status < 500)) return "other";
    } catch {
      // fall through to retry
    }
    if (attempt < RETRIES) await sleep(BACKOFF_MS);
  }
  return "other";
}

/** One full pass over every hash for a language. Does not write the live
 * file — the caller decides whether the pass is trustworthy first. */
export async function sweepPass(prefix, hashes) {
  const live = [];
  const notLive = [];
  let htmlCount = 0;
  let cursor = 0;
  async function worker() {
    while (cursor < hashes.length) {
      const i = cursor++;
      const hash = hashes[i];
      const url = `${BASE}/${prefix}/${hash}.mp3`;
      const result = await probeOnce(url);
      if (result === "live") live.push(hash);
      else {
        notLive.push(hash);
        if (result === "html") htmlCount++;
      }
      await sleep(SPACING_MS);
    }
  }
  await Promise.all(Array.from({ length: CONCURRENCY }, worker));
  return { live, notLive, htmlCount };
}

/**
 * Core sweep orchestration for one language: the poison-guard pass loop
 * plus the not-live retry pass. Pure w.r.t. the filesystem (the caller
 * writes the live file) so it's unit-testable with stubbed `sweepPassFn` /
 * `probeFn` / `sleepFn` instead of the real network and real delays.
 */
export async function runSweep(lang, prefix, hashes, deps = {}) {
  const sweepPassFn = deps.sweepPassFn ?? sweepPass;
  const probeFn = deps.probeFn ?? probeOnce;
  const sleepFn = deps.sleepFn ?? sleep;

  // Sanity guard: a pass where >25% of hashes come back as the SPA-shell
  // fallback is a poisoned pass (WAF/CloudFront serving HTML for
  // everything), not a real coverage regression — wait and redo the whole
  // pass rather than trust or write it.
  let pass;
  let attempts = 0;
  for (;;) {
    attempts++;
    pass = await sweepPassFn(prefix, hashes);
    const htmlFraction = pass.htmlCount / hashes.length;
    const poisonedPass = htmlFraction > POISON_FRACTION;
    if (!poisonedPass || attempts >= MAX_PASS_ATTEMPTS) {
      if (poisonedPass) {
        console.log(
          `${lang}: still poisoned after ${attempts} attempt(s) (${pass.htmlCount}/${hashes.length} html) — not writing a result`,
        );
        return { lang, manifest: hashes.length, live: 0, notLive: [], retriedRecovered: 0, attempts, poisoned: true, liveHashes: [] };
      }
      break;
    }
    console.log(
      `${lang}: pass ${attempts} looks poisoned (${pass.htmlCount}/${hashes.length} html > ${Math.round(POISON_FRACTION * 100)}%) — waiting ${POISON_WAIT_MS}ms and redoing the pass`,
    );
    await sleepFn(POISON_WAIT_MS);
  }

  // Retry pass: re-HEAD every not-live hash once more after a short delay,
  // and only THEN count it missing. This is what separates a genuinely
  // unpublished clip from a transient WAF/CloudFront blip that happened to
  // land inside the 25% poison floor.
  const liveHashes = pass.live;
  const stillNotLive = [];
  let retriedRecovered = 0;
  if (pass.notLive.length > 0) {
    await sleepFn(RETRY_DELAY_MS);
    for (const hash of pass.notLive) {
      const url = `${BASE}/${prefix}/${hash}.mp3`;
      const result = await probeFn(url);
      if (result === "live") {
        liveHashes.push(hash);
        retriedRecovered++;
      } else {
        stillNotLive.push(hash);
      }
      await sleepFn(SPACING_MS);
    }
  }

  return {
    lang,
    manifest: hashes.length,
    live: liveHashes.length,
    notLive: stillNotLive.sort(),
    retriedRecovered,
    attempts,
    poisoned: false,
    liveHashes: liveHashes.sort(),
  };
}

async function sweepLang(lang) {
  const { prefix, hashes } = loadManifest(lang);
  if (hashes.length === 0) {
    console.log(`${lang}: manifest has 0 hashes, nothing to sweep`);
    return { lang, manifest: 0, live: 0, notLive: [], retriedRecovered: 0, attempts: 0, poisoned: false };
  }

  const result = await runSweep(lang, prefix, hashes);
  if (result.poisoned) return result;

  mkdirSync(LIVE_DIR, { recursive: true });
  writeFileSync(join(LIVE_DIR, `${lang}.txt`), result.liveHashes.map((h) => `${h}\n`).join(""));
  return result;
}

async function main() {
  const requested = process.argv.slice(2);
  const langs = requested.length > 0 ? requested : allLangs();

  const summaries = [];
  for (const lang of langs) {
    console.log(`\nSweeping ${lang} against ${BASE} ...`);
    summaries.push(await sweepLang(lang));
  }

  console.log("\n--- tts-live-snapshot summary ---");
  let anyNotLive = false;
  for (const s of summaries) {
    if (s.poisoned) {
      console.log(`${s.lang}: POISONED after ${s.attempts} attempt(s) — no result written, rerun later`);
      continue;
    }
    console.log(
      `${s.lang}: live ${s.live} / not-live ${s.notLive.length} / retried-recovered ${s.retriedRecovered} / attempts ${s.attempts}`,
    );
    if (s.notLive.length > 0) {
      anyNotLive = true;
      console.log(`  not-live hashes for ${s.lang}:`);
      for (const h of s.notLive) console.log(`    ${h}`);
    }
  }
  if (!anyNotLive) {
    console.log("\nAll swept hashes are live.");
  }
}

// Guard so `node --test` can import this module for its pure functions
// (probeOnce/sweepPass/runSweep) without kicking off a real CDN sweep.
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
