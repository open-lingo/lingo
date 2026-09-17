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
 *     can't simply be dropped. It is only deleted here when
 *     `VITE_ASSET_BASE_URL` is set in the environment this script runs in
 *     — i.e. once the dict is actually published to that CDN AND the
 *     native build pipeline is wired to set the var. **Unset today: this
 *     is a no-op today, and native builds keep shipping the bundled copy
 *     unchanged until both of those are true.**
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
 * @param {{ distDir: string, assetBaseUrl: string }} opts
 * @returns {{
 *   whisperArtifactsFound: string[],
 *   dictPruned: boolean,
 *   dictBytesReclaimed: number,
 * }}
 * @throws if any Whisper/ONNX artifact is found under `distDir/assets`.
 */
export function pruneNativeAssets({ distDir, assetBaseUrl }) {
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
  if (existsSync(dictDir) && assetBaseUrl) {
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

  let report;
  try {
    report = pruneNativeAssets({ distDir, assetBaseUrl });
  } catch (err) {
    console.error(err instanceof Error ? err.message : String(err));
    process.exit(1);
  }

  console.log(
    "[prune-native-assets] Whisper/ONNX artifacts: none found (native alias confirmed working)",
  );
  if (report.dictPruned) {
    console.log(
      `[prune-native-assets] kuromoji dict PRUNED: ${(report.dictBytesReclaimed / 1024 / 1024).toFixed(2)} MB reclaimed (VITE_ASSET_BASE_URL=${assetBaseUrl})`,
    );
  } else if (existsSync(join(distDir, "dict"))) {
    console.log(
      "[prune-native-assets] kuromoji dict KEPT bundled (VITE_ASSET_BASE_URL not set) — " +
        "safe/expected until the dict is published to the CDN and the build env is wired. " +
        "See this script's header for the upload command.",
    );
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
