#!/usr/bin/env node
/**
 * Post-`vite build` step for `npm run build` / `npm run build:native` —
 * content packs phase 2 (docs/content-packs-2026-09-18.md; phase 1 was the
 * kuromoji dictionary, docs/dictionary-lazy-load-2026-09-18.md).
 *
 * `npm run content:emit` (a `prebuild`/`prebuild:native` lifecycle script,
 * see `emitContent.test.ts`) already wrote EVERY course's lesson JSON to
 * `src/pub/content/v1/`, and `vite build` already copied that whole tree
 * into `dist/content/v1/` verbatim (Vite always copies the entire
 * `publicDir`). This script runs AFTER that, against the already-built
 * `dist/`, and does two things ONLY when `content.packs` is `true` in
 * `src/pub/feature-flags.json` (read via `readContentPacksFlag.mjs`, the
 * exact build-time-pinned pattern `dictionary.lazy` established — editing
 * the JSON after a build has already shipped has no effect until the next
 * build):
 *
 *  1. For every language, copy the lesson JSON for every module AT OR
 *     AFTER the bundled slice (`BUNDLED_MODULE_COUNT` = 3, i.e. modules
 *     4+) into `<packOutputDir>/<contentVersion>/<lang>/`, alongside a
 *     small pack manifest (`schemaVersion`, `contentVersion`, the module
 *     list, and a per-file sha256 + byte count — the hash-verified-loader
 *     precondition `contentPackLoader.ts` needs, same shape as the dict
 *     lane's checked-in `src/shared/dict/manifest.json`, except this one
 *     is fetched at runtime because content changes every build while the
 *     dict format doesn't). `contentVersion` is `manifest.version` — the
 *     SAME hash `content:emit` already computed across every module file
 *     — so the pack prefix is tied 1:1 to this exact build; a stale/older
 *     pack at a DIFFERENT prefix can never be addressed by an app build
 *     that computed a different version, and modules 1–3 are NEVER
 *     written under any pack prefix at all (see `BUNDLED_MODULE_COUNT`
 *     below) — together these two facts are why a pack can structurally
 *     never override a bundled module, newer or otherwise: there is
 *     nothing at that URL to fetch.
 *
 *  2. PRUNES those same module files back out of `dist/content/v1/<lang>/`
 *     — this is where the install-size reclaim happens. `dist/content/v1/
 *     <lang>/manifest.json` is rewritten in place with one added field per
 *     language, `packBundledThrough` (the 0-based module count that is
 *     still guaranteed to be physically present) — `contentLoader.ts`
 *     reads this to know, without an extra round trip, which modules to
 *     even attempt a CDN pack fetch for. `index.<hash>.json` (course-map
 *     summaries), `_extra.<hash>.json`, and `mined.<hash>.json` are NEVER
 *     touched — always bundled, every language, flag on or off.
 *
 * When `content.packs` is `false` (default, build 32): this script is a
 * complete no-op — `dist/` is exactly what `vite build` produced, so the
 * flag-OFF byte-identical claim holds trivially (nothing here runs, not
 * "runs but changes nothing").
 *
 * Publishing (brief item 4): on a WEB build (`--native` NOT passed),
 * `dist/content/v2/...` is written INSIDE `dist/` and is already there by
 * the time this script returns, so `deploy.yml`'s existing `aws s3 sync`
 * of the whole `dist/` tree publishes it — no separate step.
 *
 * On a NATIVE build (`node scripts/build/emit-content-packs.mjs --native`,
 * wired into `npm run build:native`), the pack tree is written OUTSIDE
 * `dist/` entirely — at `<repo root>/dist-content-packs/` — NOT inside
 * `dist/content/v2`. This is deliberate, not an inconsistency:
 * `capacitor.config.ts`'s `webDir: "dist"` means `npx cap sync` copies the
 * WHOLE `dist/` tree verbatim into the native project; a pack tree left at
 * `dist/content/v2` would ship straight back into the IPA/APK and silently
 * erase every byte this script just reclaimed from `dist/content/v1`. The
 * native `dist/` never reaches the CDN bucket on its own either way, so
 * `dist-content-packs/` must be uploaded separately, same shape as the
 * dict lane's documented (not run — AWS SSO expired) upload command:
 *
 *   aws s3 cp dist-content-packs/ s3://<site bucket>/content/v2/ --recursive \
 *     --cache-control "public,max-age=31536000,immutable"
 *
 * `<site bucket>` per `tts-publish/README.md`'s convention (same bucket
 * TTS/dict publish to, different prefix). No CloudFront invalidation
 * needed — `<contentVersion>` is a new prefix every time content changes,
 * never overwritten. NOT run by this script or this lane.
 *
 * Usage: `node scripts/build/emit-content-packs.mjs` (after `vite build`;
 * wire into `npm run build` and `npm run build:native`, before
 * `prune-native-assets.mjs` — order doesn't matter between them, they
 * touch disjoint parts of `dist/`, but content:emit's directory must exist
 * first).
 */
import { createHash } from "node:crypto";
import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { readContentPacksFlag } from "./readContentPacksFlag.mjs";

const REPO_ROOT = fileURLToPath(new URL("../..", import.meta.url));

/** Pack manifest schema — bump only on a breaking pack-file shape change (contentPackLoader.ts's `SUPPORTED_PACK_SCHEMA` gate). */
export const PACK_SCHEMA_VERSION = 1;

/**
 * Modules 1–3 (0-based index 0..2) of EVERY course stay bundled in
 * `dist/content/v1` no matter what — so first sessions and the placement
 * test work fully offline on a fresh install (Spencer's decision,
 * 2026-09-18). Modules at index >= this count are pack-eligible.
 */
export const BUNDLED_MODULE_COUNT = 3;

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

function sha256Hex(buf) {
  return createHash("sha256").update(buf).digest("hex");
}

/**
 * Core logic, factored out of `main()` so tests can run it against a
 * scratch directory instead of a real `vite build` output.
 *
 * `packOutputDir` is WHERE the `/content/v2/<contentVersion>/<lang>/...`
 * tree lands, and it is NOT always inside `distDir` — this is the one
 * thing that makes packs actually shrink a NATIVE install rather than
 * just moving bytes around inside the same folder:
 *
 *   - `native: false` (default, web build): `packOutputDir` defaults to
 *     `<distDir>/content/v2` — INSIDE `dist/`, because `deploy.yml`'s
 *     `aws s3 sync` of the whole `dist/` tree is what publishes it; there
 *     is no separate web "install" for this to bloat.
 *   - `native: true`: `packOutputDir` defaults to a SIBLING of `distDir`
 *     (`<repo root>/dist-content-packs`, NEVER under `dist/`). This
 *     matters because `capacitor.config.ts`'s `webDir: "dist"` means
 *     `npx cap sync` copies the ENTIRE `dist/` tree verbatim into the
 *     native project — a pack tree left at `dist/content/v2` would ship
 *     straight back into the IPA/APK, silently erasing every byte this
 *     lane reclaims from `dist/content/v1`. Keeping it outside `dist/` is
 *     what makes the reclaim real; the lead's separate `aws s3 cp` upload
 *     step (this file's header) points at THIS directory, not `dist/`.
 *
 * @param {{ distDir: string, packsEnabled: boolean, native?: boolean, packOutputDir?: string }} opts
 * @returns {{
 *   packsEnabled: boolean,
 *   skippedReason?: string,
 *   v1BytesBefore: number,
 *   v1BytesAfter: number,
 *   packOutputDir?: string,
 *   languages: Record<string, { bundledThrough: number, packedModules: number, bytesReclaimed: number }>,
 * }}
 */
export function emitContentPacks({ distDir, packsEnabled, native = false, packOutputDir }) {
  const v1Dir = join(distDir, "content", "v1");
  const manifestPath = join(v1Dir, "manifest.json");
  const resolvedPackOutputDir =
    packOutputDir ??
    (native ? join(dirname(distDir), "dist-content-packs") : join(distDir, "content", "v2"));
  const report = {
    packsEnabled,
    v1BytesBefore: existsSync(v1Dir) ? bytesOf(walk(v1Dir)) : 0,
    v1BytesAfter: 0,
    languages: {},
  };

  if (!existsSync(manifestPath)) {
    report.skippedReason = `${manifestPath} not found — content:emit did not run before this script`;
    report.v1BytesAfter = report.v1BytesBefore;
    return report;
  }
  if (!packsEnabled) {
    report.skippedReason = "content.packs flag is off — dist left byte-identical";
    report.v1BytesAfter = report.v1BytesBefore;
    return report;
  }

  const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
  let manifestChanged = false;

  for (const [lang, entry] of Object.entries(manifest.languages ?? {})) {
    const modules = entry.modules ?? [];
    const bundledThrough = Math.min(BUNDLED_MODULE_COUNT, modules.length);
    const packModules = modules.slice(bundledThrough);

    if (packModules.length === 0) {
      // Short course (fewer modules than the bundled slice) — nothing to
      // pack, but still record the marker so the loader knows every
      // module of this language is guaranteed local.
      entry.packBundledThrough = bundledThrough;
      manifestChanged = true;
      report.languages[lang] = { bundledThrough, packedModules: 0, bytesReclaimed: 0 };
      continue;
    }

    const packDir = join(resolvedPackOutputDir, manifest.version, lang);
    mkdirSync(packDir, { recursive: true });

    const files = {};
    let bytesReclaimed = 0;
    for (const mod of packModules) {
      const srcFile = join(v1Dir, mod.file);
      if (!existsSync(srcFile)) continue; // defensive — should never happen post-content:emit
      const bytes = readFileSync(srcFile);
      const basename = mod.file.split("/").pop();
      writeFileSync(join(packDir, basename), bytes);
      files[basename] = { sha256: sha256Hex(bytes), bytes: bytes.length };
      bytesReclaimed += bytes.length;
      rmSync(srcFile);
    }

    const packManifest = {
      schemaVersion: PACK_SCHEMA_VERSION,
      contentVersion: manifest.version,
      lang,
      modules: packModules.map((m) => ({ id: m.id, file: m.file.split("/").pop(), lessons: m.lessons })),
      files,
    };
    writeFileSync(join(packDir, "manifest.json"), JSON.stringify(packManifest));

    entry.packBundledThrough = bundledThrough;
    manifestChanged = true;
    report.languages[lang] = { bundledThrough, packedModules: packModules.length, bytesReclaimed };
  }

  if (manifestChanged) {
    writeFileSync(manifestPath, JSON.stringify(manifest));
  }
  report.v1BytesAfter = existsSync(v1Dir) ? bytesOf(walk(v1Dir)) : 0;
  report.packOutputDir = resolvedPackOutputDir;
  return report;
}

function main() {
  const native = process.argv.includes("--native");
  const distDir = join(REPO_ROOT, "dist");
  if (!existsSync(distDir)) {
    console.error(
      `emit-content-packs: ${distDir} does not exist — run \`vite build\` first.`,
    );
    process.exit(1);
  }
  const packsEnabled = readContentPacksFlag(REPO_ROOT);
  const report = emitContentPacks({ distDir, packsEnabled, native });

  if (report.skippedReason) {
    console.log(`[emit-content-packs] skipped: ${report.skippedReason}`);
    return;
  }
  const reclaimedTotal = Object.values(report.languages).reduce((n, l) => n + l.bytesReclaimed, 0);
  console.log(
    `[emit-content-packs] content.packs=true (${native ? "native" : "web"}) — dist/content/v1: ` +
      `${(report.v1BytesBefore / 1024 / 1024).toFixed(2)} MB → ` +
      `${(report.v1BytesAfter / 1024 / 1024).toFixed(2)} MB ` +
      `(-${(reclaimedTotal / 1024 / 1024).toFixed(2)} MB)`,
  );
  for (const [lang, l] of Object.entries(report.languages)) {
    console.log(
      `  ${lang}: bundled through module index ${l.bundledThrough - 1} inclusive, ` +
        `${l.packedModules} module(s) packed, ${(l.bytesReclaimed / 1024).toFixed(1)} KB reclaimed`,
    );
  }
  console.log(
    native
      ? `  pack tree written OUTSIDE dist/, at ${report.packOutputDir} (never swept into the IPA/APK by \`cap sync\`)`
      : `  pack tree written INSIDE dist/, at ${report.packOutputDir} (published by the normal dist→S3 deploy sync)`,
  );
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
