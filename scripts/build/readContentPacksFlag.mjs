/**
 * Reads the `content.packs` build-time switch out of
 * `src/pub/feature-flags.json`.
 *
 * Content packs phase 2 (docs/content-packs-2026-09-18.md), mirrors
 * `readDictLazyFlag.mjs`'s reasoning exactly: whether `dist/content/v1`
 * stops bundling a course's modules beyond the bundled slice is decided
 * the moment `vite build` + `emit-content-packs.mjs` run — a post-deploy
 * edit to this JSON has no effect until the next build, unlike the rest
 * of `feature-flags.json` (`src/shared/config/featureFlags.ts` fetches
 * that file at RUNTIME and can swap most flags without a rebuild).
 *
 * Fails safe: any read/parse error (file missing, malformed JSON, missing
 * key) resolves to `false` — "keep every module bundled," the same
 * direction as every other failure mode in this build pipeline.
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join } from "node:path";

/** `scripts/build/` → repo root is two levels up. */
const DEFAULT_REPO_ROOT = fileURLToPath(new URL("../..", import.meta.url));

/**
 * @param {string} [repoRoot] repo root containing `src/pub/feature-flags.json`
 * @returns {boolean}
 */
export function readContentPacksFlag(repoRoot = DEFAULT_REPO_ROOT) {
  try {
    const raw = readFileSync(
      join(repoRoot, "src/pub/feature-flags.json"),
      "utf8",
    );
    const json = JSON.parse(raw);
    return json?.content?.packs === true;
  } catch {
    return false;
  }
}
