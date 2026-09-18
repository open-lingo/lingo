/**
 * Reads the `dictionary.lazy` build-time switch out of
 * `src/pub/feature-flags.json`.
 *
 * Phase 1 of the Japanese-dictionary-off-the-install lane
 * (docs/dictionary-lazy-load-2026-09-18.md). This flag is genuinely
 * build-time-pinned, not runtime-swappable like the rest of
 * `feature-flags.json` (`src/shared/config/featureFlags.ts` fetches that
 * same file at runtime and CAN be swapped post-deploy without a rebuild) —
 * whether the kuromoji dictionary is bundled into `dist/` is decided the
 * moment `vite build` runs, so editing the JSON after a build has already
 * shipped has no effect until the next build. Both build-time consumers
 * (`vite.config.ts` and `scripts/build/prune-native-assets.mjs`) read this
 * file independently via this same helper rather than relying on
 * `process.env` propagating between them — `npm run build:native` runs
 * `vite build` and `prune-native-assets.mjs` as two SEPARATE node
 * processes (see `package.json`), so a `process.env` mutation inside one
 * would never reach the other.
 *
 * Fails safe: any read/parse error (file missing, malformed JSON, missing
 * key) resolves to `false` — the same "keep the dict bundled" direction as
 * every other failure mode in this lane (kuroshiro.ts's degrade-on-error
 * path, prune-native-assets.mjs's two-gate check before this lane).
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
export function readDictLazyFlag(repoRoot = DEFAULT_REPO_ROOT) {
  try {
    const raw = readFileSync(
      join(repoRoot, "src/pub/feature-flags.json"),
      "utf8",
    );
    const json = JSON.parse(raw);
    return json?.dictionary?.lazy === true;
  } catch {
    return false;
  }
}
