#!/usr/bin/env node
/**
 * Post-`vite build --mode native` step for `npm run build:native`.
 *
 * Perf review 2026-09-17 (docs/perf-2026-09-17.md §1, lane A4b): 72% of the
 * build-25 IPA (21.2 MB of 29.3 MB compressed) was `src/pub/dict/`
 * (kuromoji/sudachi morphological dictionary) plus the Whisper STT
 * fallback's ONNX/WASM runtime — both shipped to every native install
 * regardless of whether the learner ever triggers them.
 *
 * Two independent jobs run against the ALREADY-BUILT `dist/` (native mode):
 *
 *  1. Regression guard (ALWAYS runs, no opt-out). `useWhisperRecognition.ts`
 *     is aliased to a lightweight stub under `--mode native`
 *     (`vite.config.ts`'s `resolve.alias`) specifically so the real hook —
 *     and everything it dynamically imports (transformers.js,
 *     onnxruntime-web, the ~5.75 MB compressed `ort-wasm-simd-threaded...`
 *     binary) — never becomes part of the native module graph, and so
 *     never lands in `dist/assets`. This scans `dist/assets` for that
 *     class of file and FAILS THE BUILD if any turn up, in case the alias
 *     ever silently stops matching (see the ordering note next to it in
 *     `vite.config.ts` — a prefix alias checked first would swallow it).
 *     This IS the task-4 verification check for that exclusion.
 *
 *  2. Kuromoji dictionary prune (opt-in, SAFE BY DEFAULT). `dist/dict/*`
 *     (~15.4 MB compressed, 52.7% of the build-25 IPA) is a REAL,
 *     learner-facing, offline dependency — see the file-header doc in
 *     `src/features/languages/ja/readingAnnotation/kuroshiro.ts` for why it
 *     can't simply be dropped. Lead decision (docs/perf-2026-09-17.md §1a,
 *     2026-09-17): the dict stays BUNDLED by default — 15 MB shipped once
 *     in the IPA beats 15 MB fetched over the network with no persistent
 *     cache on every JA install, and a failed/slow fetch breaks the
 *     offline speaking step. The CDN path is opt-in behind TWO env vars,
 *     BOTH required: `VITE_DICT_FROM_CDN === "1"` AND `VITE_ASSET_BASE_URL`
 *     set in the environment this script runs in. Checking
 *     `VITE_ASSET_BASE_URL` alone (the original A4b check) was a landmine:
 *     the shipped `.env.native` sets it to the TTS CDN host for an
 *     unrelated reason, so native builds already have it set today — an
 *     alone-check would have pruned `dist/dict` on every native build
 *     before any CDN copy of the dict existed. Revisiting requires (a) the
 *     dict actually published to that CDN, (b) a persistent on-device
 *     cache landed in `kuroshiro.ts` (today's patch fetches on every cold
 *     init, no cache), and (c) a versioned `/dict/v1/` prefix, because
 *     `deploy.yml`'s root `aws s3 sync --delete` has no `dict/` exclude —
 *     a bare `/dict/` prefix would be deleted out from under installed
 *     apps by the next web build that ships without `dist/dict`. **Both
 *     env vars unset today: this is a no-op, and native builds keep
 *     shipping the bundled copy unchanged until all of the above are
 *     true.**
 *
 * Publishing the dict to the CDN is NOT this script's job (no AWS access
 * from this lane). Once `src/pub/dict/*.dat.gz` is staged for upload
 * (mirroring the existing `tts-publish/` pattern — see that directory's
 * README for the sanctioned incremental-publish shape), the command is:
 *
 *   aws s3 cp src/pub/dict/ s3://<site bucket>/dict/ --recursive \
 *     --cache-control "public,max-age=31536000,immutable"
 *
 * `<site bucket>` per `tts-publish/README.md`'s convention (same bucket
 * TTS publishes to, different prefix) — confirm the literal bucket name
 * with Spencer/Trevor before running this; it is not readable from here.
 * A CloudFront invalidation is NOT needed for a brand-new prefix (nothing
 * cached yet to invalidate).
 *
 * Usage: `node scripts/build/prune-native-assets.mjs` (after
 * `vite build --mode native`; wired into `npm run build:native`).
 */
import { existsSync, readdirSync, rmSync, statSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const REPO_ROOT = fileURLToPath(new URL("../..", import.meta.url));

/**
 * Filenames that must never appear in a native `dist/assets` — the Whisper
 * STT fallback's dependency graph. See job 1 in the file header.
 */
export const WHISPER_ARTIFACT_PATTERNS = [
  /ort-wasm/i,
  /onnxruntime/i,
  /whisper-worker/i,
  /transformers\.web/i,
];

function walk(dir) {
  const out = [];
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) out.push(...walk(p));
    else out.push(p);
  }
  return out;
}

function bytesOf(paths) {
  return paths.reduce((sum, p) => sum + statSync(p).size, 0);
}

/**
 * Core logic, factored out of `main()` so tests can run it against a
 * scratch directory instead of a real `vite build --mode native` output.
 *
 * `dictFromCdn` and `assetBaseUrl` are BOTH required to prune `dist/dict`
 * — see the file-header doc (job 2) for why `assetBaseUrl` alone is not a
 * safe signal.
 *
 * @param {{ distDir: string, assetBaseUrl: string, dictFromCdn?: boolean }} opts
 * @returns {{
 *   whisperArtifactsFound: string[],
 *   dictPruned: boolean,
 *   dictBytesReclaimed: number,
 * }}
 * @throws if any Whisper/ONNX artifact is found under `distDir/assets`.
 */
export function pruneNativeAssets({ distDir, assetBaseUrl, dictFromCdn = false }) {
  const report = {
    whisperArtifactsFound: [],
    dictPruned: false,
    dictBytesReclaimed: 0,
  };

  const assetsDir = join(distDir, "assets");
  if (existsSync(assetsDir)) {
    report.whisperArtifactsFound = walk(assetsDir).filter((f) =>
      WHISPER_ARTIFACT_PATTERNS.some((re) => re.test(f)),
    );
  }
  if (report.whisperArtifactsFound.length > 0) {
    throw new Error(
      `native build regression: Whisper/ONNX artifact(s) found under ${assetsDir} — ` +
        `the native-mode alias in vite.config.ts did not exclude them:\n` +
        report.whisperArtifactsFound.map((f) => `  ${f}`).join("\n"),
    );
  }

  const dictDir = join(distDir, "dict");
  if (existsSync(dictDir) && dictFromCdn && assetBaseUrl) {
    report.dictBytesReclaimed = bytesOf(walk(dictDir));
    rmSync(dictDir, { recursive: true, force: true });
    report.dictPruned = true;
  }

  return report;
}

function main() {
  const distDir = join(REPO_ROOT, "dist");
  if (!existsSync(distDir)) {
    console.error(
      `prune-native-assets: ${distDir} does not exist — run \`vite build --mode native\` first.`,
    );
    process.exit(1);
  }
  const assetBaseUrl = process.env.VITE_ASSET_BASE_URL ?? "";
  const dictFromCdn = process.env.VITE_DICT_FROM_CDN === "1";

  let report;
  try {
    report = pruneNativeAssets({ distDir, assetBaseUrl, dictFromCdn });
  } catch (err) {
    console.error(err instanceof Error ? err.message : String(err));
    process.exit(1);
  }

  console.log(
    "[prune-native-assets] Whisper/ONNX artifacts: none found (native alias confirmed working)",
  );
  if (report.dictPruned) {
    console.log(
      `[prune-native-assets] kuromoji dict PRUNED: ${(report.dictBytesReclaimed / 1024 / 1024).toFixed(2)} MB reclaimed (VITE_DICT_FROM_CDN=1, VITE_ASSET_BASE_URL=${assetBaseUrl})`,
    );
  } else if (existsSync(join(distDir, "dict"))) {
    const missing = [];
    if (!dictFromCdn) missing.push("VITE_DICT_FROM_CDN=1");
    if (!assetBaseUrl) missing.push("VITE_ASSET_BASE_URL");
    console.log(
      `[prune-native-assets] kuromoji dict KEPT bundled (missing: ${missing.join(", ")}) — ` +
        "safe/expected until the dict is published to the CDN and both env vars are wired. " +
        "See this script's header for the upload command.",
    );
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
