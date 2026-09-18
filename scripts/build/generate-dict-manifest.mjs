#!/usr/bin/env node
/**
 * Generates `src/shared/dict/manifest.json` — the sha256 + byte size of
 * every kuromoji dictionary file, computed from the SAME source
 * `vite.config.ts`'s `copyKuromojiDict()` mirrors into `src/pub/dict/`
 * (`node_modules/kuromoji/dict`).
 *
 * Checked in (like `src/shared/tts/manifests/<lang>.json`), not generated
 * at build time, because the dictionary is pinned to the installed
 * `kuromoji` package version (`package-lock.json`) and essentially never
 * changes — regenerate this file (`node
 * scripts/build/generate-dict-manifest.mjs`) only when that version bumps.
 * `dictManifest.test.ts` fails loudly if the committed manifest and the
 * installed package ever drift.
 *
 * The runtime CDN loader (`src/features/languages/ja/readingAnnotation/
 * dictLoader.ts`) uses these hashes to verify every file it fetches from
 * the CDN before caching or handing bytes to kuromoji — the blast radius
 * of a corrupted/tampered CDN object is bounded to "fails the hash check,
 * degrades to the existing graceful-degradation path" instead of feeding
 * kuromoji's WASM-adjacent binary parser untrusted bytes.
 *
 * Usage: `node scripts/build/generate-dict-manifest.mjs`
 */
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join } from "node:path";

const REPO_ROOT = fileURLToPath(new URL("../..", import.meta.url));

export function buildDictManifest(kuromojiDictDir) {
  if (!existsSync(kuromojiDictDir)) {
    throw new Error(
      `generate-dict-manifest: ${kuromojiDictDir} does not exist — run \`npm ci\` first.`,
    );
  }
  const files = {};
  for (const name of readdirSync(kuromojiDictDir).sort()) {
    if (!name.endsWith(".dat.gz")) continue;
    const bytes = readFileSync(join(kuromojiDictDir, name));
    files[name] = {
      sha256: createHash("sha256").update(bytes).digest("hex"),
      bytes: bytes.length,
    };
  }
  return {
    version: "v1",
    kuromojiPackageVersion: JSON.parse(
      readFileSync(join(REPO_ROOT, "node_modules/kuromoji/package.json"), "utf8"),
    ).version,
    files,
  };
}

function main() {
  const kuromojiDictDir = join(REPO_ROOT, "node_modules/kuromoji/dict");
  const manifest = buildDictManifest(kuromojiDictDir);
  const outDir = join(REPO_ROOT, "src/shared/dict");
  mkdirSync(outDir, { recursive: true });
  const outPath = join(outDir, "manifest.json");
  writeFileSync(outPath, JSON.stringify(manifest, null, 2) + "\n");
  const totalBytes = Object.values(manifest.files).reduce((s, f) => s + f.bytes, 0);
  console.log(
    `[generate-dict-manifest] wrote ${outPath}: ${Object.keys(manifest.files).length} files, ` +
      `${(totalBytes / 1024 / 1024).toFixed(2)} MB, kuromoji@${manifest.kuromojiPackageVersion}`,
  );
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
