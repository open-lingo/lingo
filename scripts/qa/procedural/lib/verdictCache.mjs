/**
 * Per-module verdict cache — requirement 5 of the A7c brief ("precompute
 * per-module verdict caches under artifacts/ keyed by the content hash and
 * load those, with a cache-miss path that computes"), revisited 2026-09-17
 * per a lead note: the sidecar pre-warm alone (`run.mjs`) kept the vitest
 * ratchet under its 30s budget, but the LOCAL combined
 * `src/test/proceduralQa.test.ts` wall time (ratchet + the old
 * informational report, both full 46-module scans) was ~83s — the
 * preflight suite's long pole. The informational report moved OUT of
 * vitest (`npm run qa:procedural -- --informational-summary`, CI already
 * skipped it — see that file's history), so this cache's job now is
 * SECOND-RUN speed: a repeated `run.mjs` invocation (vitest re-run, CLI
 * re-run) against unchanged content, checker code, and JMdict data costs a
 * cache read instead of a full re-scan.
 *
 * Cache key = hash(lang, moduleId, mode, module-content-hash,
 * checks-version-hash, JMdict-index-fingerprint, Lexique-fingerprint,
 * TTS-manifest-fingerprint(lang), emitted-content-manifest-version).
 *
 * The last two were missing until 2026-09-17: Q7 reads the per-language TTS
 * manifest and Q2/Q3/Q4 read COURSE-WIDE atom surfaces, neither of which is
 * inside one module's JSON, so adding the m42 dlg-4 clip left a cached
 * "no TTS clip" verdict in place (and removing a clip would have kept a
 * cached PASS — a silent-pass class). Any content edit now invalidates the
 * whole course's verdicts, which is the correct trade: the cache exists for
 * unchanged-content re-runs (preflight, CI), not for surviving edits.
 * `mode` ("enforced" |
 * "full") keeps the ratchet's cache separate from a full-scan's — an
 * enforced-only cache MISS still only computes enforced checks (unchanged
 * cost/behavior from before this cache existed), so a cold cache (a fresh
 * checkout, CI) never pays more than it did already; only a WARM cache
 * (unchanged content re-scanned) gets faster. `checks-version-hash` is a
 * hash of every `checks/*.mjs` + `lib/*.mjs` + `index.mjs` source file —
 * changing any check's logic invalidates every cached verdict
 * automatically, so a stale cache can never mask a real behavior change.
 */
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { jmdictFingerprint } from "./jmdict.mjs";
import { lexiqueFingerprint } from "./lexique.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const PROCEDURAL_DIR = path.resolve(HERE, "..");
const REPO_ROOT = path.resolve(HERE, "../../../../");
const CACHE_DIR = path.join(REPO_ROOT, "artifacts/qa/procedural/verdicts");

function sha1(input) {
  return createHash("sha1").update(input).digest("hex");
}

let checksVersionCached = null;

/** Hash of every check/lib source file this runner's verdicts depend on.
 *  Deliberately broad (whole `checks/` + `lib/` dirs, not a hand-picked
 *  list) so a new file or a forgotten update still invalidates — a
 *  narrower list is the kind of thing that silently rots. */
function checksVersion() {
  if (checksVersionCached) return checksVersionCached;
  const files = [path.join(PROCEDURAL_DIR, "index.mjs")];
  for (const sub of ["checks", "lib"]) {
    const dir = path.join(PROCEDURAL_DIR, sub);
    for (const f of readdirSync(dir)) {
      if (f.endsWith(".mjs")) files.push(path.join(dir, f));
    }
  }
  files.sort();
  const h = createHash("sha1");
  for (const f of files) h.update(readFileSync(f));
  checksVersionCached = h.digest("hex").slice(0, 16);
  return checksVersionCached;
}

/** sha1 of a file's bytes, or a fixed marker when it does not exist — an
 *  absent input must key differently from every present one. */
function fileFingerprint(abs) {
  if (!existsSync(abs)) return "absent";
  return sha1(readFileSync(abs)).slice(0, 16);
}

/** The per-language TTS manifest (`src/shared/tts/manifests/<lang>.json`,
 *  hashes + overrides) — everything Q7 resolves against. */
export function ttsManifestFingerprint(lang) {
  return fileFingerprint(path.join(REPO_ROOT, "src/shared/tts/manifests", `${lang}.json`));
}

/** `version` of the emitted content manifest — changes whenever ANY module
 *  of ANY language is re-emitted, which is exactly when course-wide atom
 *  surfaces (Q2/Q3/Q4 inputs) may have moved. */
export function contentManifestVersion() {
  const abs = path.join(REPO_ROOT, "src/pub/content/v1/manifest.json");
  if (!existsSync(abs)) return "absent";
  try {
    const v = JSON.parse(readFileSync(abs, "utf8")).version;
    return typeof v === "string" && v ? v : fileFingerprint(abs);
  } catch {
    return fileFingerprint(abs);
  }
}

/** @param {{lang:string, moduleId:string, mode:"enforced"|"full", moduleJson:object}} args */
export function moduleCacheKey({ lang, moduleId, mode, moduleJson }) {
  const moduleHash = sha1(JSON.stringify(moduleJson)).slice(0, 16);
  return sha1(
    [
      lang,
      moduleId,
      mode,
      moduleHash,
      checksVersion(),
      jmdictFingerprint(),
      lexiqueFingerprint(),
      ttsManifestFingerprint(lang),
      contentManifestVersion(),
    ].join("|"),
  );
}

function cachePath(key) {
  return path.join(CACHE_DIR, `${key}.json`);
}

/** Returns the cached `rows` array for this module (same shape `run.mjs`
 *  pushes into its own `rows`), or `null` on a miss / unreadable cache. */
export function readModuleVerdicts(key) {
  const p = cachePath(key);
  if (!existsSync(p)) return null;
  try {
    return JSON.parse(readFileSync(p, "utf8"));
  } catch {
    return null;
  }
}

export function writeModuleVerdicts(key, rows) {
  mkdirSync(CACHE_DIR, { recursive: true });
  writeFileSync(cachePath(key), JSON.stringify(rows));
}
