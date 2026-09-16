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

/** HEAD one clip, retrying transient failures; returns true only for a
 * confirmed `audio/*` response. */
async function probeLive(url) {
  for (let attempt = 0; attempt <= RETRIES; attempt++) {
    try {
      const res = await fetch(url, { method: "HEAD" });
      const type = res.headers.get("content-type") ?? "";
      if (res.ok && type.startsWith("audio/")) return true;
      // A definitive non-audio 200 (the SPA-shell fallback) or a clean 4xx
      // means "not live" — no point retrying those, only network hiccups.
      if (res.ok || (res.status >= 400 && res.status < 500)) return false;
    } catch {
      // fall through to retry
    }
    if (attempt < RETRIES) await sleep(BACKOFF_MS);
  }
  return false;
}

async function sweepLang(lang) {
  const { prefix, hashes } = loadManifest(lang);
  if (hashes.length === 0) {
    console.log(`${lang}: manifest has 0 hashes, nothing to sweep`);
    return { lang, manifest: 0, live: 0, notLive: [] };
  }

  const liveHashes = [];
  const notLive = [];
  let cursor = 0;
  async function worker() {
    while (cursor < hashes.length) {
      const i = cursor++;
      const hash = hashes[i];
      const url = `${BASE}/${prefix}/${hash}.mp3`;
      const live = await probeLive(url);
      if (live) liveHashes.push(hash);
      else notLive.push(hash);
      await sleep(SPACING_MS);
    }
  }
  await Promise.all(Array.from({ length: CONCURRENCY }, worker));

  liveHashes.sort();
  mkdirSync(LIVE_DIR, { recursive: true });
  writeFileSync(join(LIVE_DIR, `${lang}.txt`), liveHashes.map((h) => `${h}\n`).join(""));

  return { lang, manifest: hashes.length, live: liveHashes.length, notLive: notLive.sort() };
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
    console.log(`${s.lang}: manifest ${s.manifest} / live ${s.live} / not-live ${s.notLive.length}`);
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

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
