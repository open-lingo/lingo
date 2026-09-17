#!/usr/bin/env node
/**
 * Fetch + verify + compact-index JMdict (English glosses) for the JA
 * lexical sidecar's Q2/Q3 v3 checks (`docs/procedural-qa-2026-09-17.md`).
 *
 * Source: the `jmdict-simplified` project (https://github.com/scriptin/jmdict-simplified),
 * which republishes JMdict (The Electronic Dictionary Research and
 * Development Group, https://www.edrdg.org/) as flat JSON, pinned to one
 * release so the sha256 below stays meaningful.
 *
 *   Release:  jmdict-simplified 3.6.2+20260914172325 (built from the
 *             2026-09-14 JMdict data snapshot)
 *   Asset:    jmdict-eng-3.6.2+20260914172325.json.tgz
 *   URL:      https://github.com/scriptin/jmdict-simplified/releases/download/3.6.2%2B20260914172325/jmdict-eng-3.6.2%2B20260914172325.json.tgz
 *   Fetched:  2026-09-17
 *   sha256:   89496f64e1af931211b391e6f3f32fa36bafd55a5450fca10d3fd4d3cc6c2396
 *
 * Licence: JMdict/EDICT is (c) EDRDG, distributed under the Creative
 * Commons Attribution-ShareAlike Licence (V4.0) —
 * https://www.edrdg.org/edrdg/licence.html — attribution required, no
 * separate registration needed for non-commercial dictionary lookups.
 * `jmdict-simplified` itself is public-domain tooling around that data
 * (https://github.com/scriptin/jmdict-simplified#licence). Attribution is
 * carried in `docs/procedural-qa-2026-09-17.md` §8 and this file's header;
 * do not strip either when reusing the index elsewhere.
 *
 * What this script does:
 *   1. Download the pinned .tgz (skips if already present + sha256-valid).
 *   2. Verify sha256 against the pin above — refuses to proceed on mismatch
 *      (a moved/tampered release asset is not silently accepted).
 *   3. Extract the JSON.
 *   4. Build a compact surface-only index (`index.json`) — see
 *      `buildIndex()`'s doc comment for the exact shape — and drop the
 *      117MB raw JSON's per-entry bulk (glosses, examples, etc.) that
 *      Q2/Q3 never read.
 *
 * All output lives under `artifacts/lexical/jmdict/` (gitignored — repo-
 * wide `artifacts/` rule in `.gitignore`), i.e. physically inside the repo
 * tree but never committed, matching the existing `artifacts/lexical/ja/`
 * sidecar-cache convention.
 *
 * Usage:
 *   node scripts/lexical/ja/fetch-jmdict.mjs           # fetch if missing, (re)build index if stale
 *   node scripts/lexical/ja/fetch-jmdict.mjs --force    # re-download + rebuild even if present
 */
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(HERE, "../../../");
const OUT_DIR = path.join(REPO_ROOT, "artifacts/lexical/jmdict");
const RAW_DIR = path.join(OUT_DIR, "raw");

const RELEASE_TAG = "3.6.2+20260914172325";
const ASSET_NAME = `jmdict-eng-${RELEASE_TAG}.json.tgz`;
const ASSET_URL = `https://github.com/scriptin/jmdict-simplified/releases/download/${encodeURIComponent(RELEASE_TAG)}/${ASSET_NAME}`;
const EXPECTED_SHA256 = "89496f64e1af931211b391e6f3f32fa36bafd55a5450fca10d3fd4d3cc6c2396";
const EXTRACTED_NAME = "jmdict-eng-3.6.2.json"; // name baked into the tarball by upstream's build

const TGZ_PATH = path.join(RAW_DIR, ASSET_NAME);
const JSON_PATH = path.join(RAW_DIR, EXTRACTED_NAME);
export const INDEX_PATH = path.join(OUT_DIR, "index.json");
export const INDEX_META_PATH = path.join(OUT_DIR, "index.meta.json");

function sha256(filePath) {
  const buf = readFileSync(filePath);
  return createHash("sha256").update(buf).digest("hex");
}

function verify(filePath) {
  const actual = sha256(filePath);
  if (actual !== EXPECTED_SHA256) {
    throw new Error(
      `sha256 mismatch for ${filePath}\n  expected ${EXPECTED_SHA256}\n  got      ${actual}\nRefusing to use an unverified JMdict asset.`,
    );
  }
  return actual;
}

async function download() {
  mkdirSync(RAW_DIR, { recursive: true });
  console.error(`[fetch-jmdict] downloading ${ASSET_URL}`);
  const res = await fetch(ASSET_URL, { redirect: "follow" });
  if (!res.ok) throw new Error(`download failed: HTTP ${res.status} ${res.statusText}`);
  const buf = Buffer.from(await res.arrayBuffer());
  writeFileSync(TGZ_PATH, buf);
  console.error(`[fetch-jmdict] wrote ${TGZ_PATH} (${buf.length} bytes)`);
}

function extract() {
  execFileSync("tar", ["xzf", TGZ_PATH, "-C", RAW_DIR]);
  if (!existsSync(JSON_PATH)) {
    throw new Error(`extraction did not produce the expected ${JSON_PATH} — tarball layout changed upstream?`);
  }
}

/**
 * Compact index shape (written to `index.json`):
 *   {
 *     version, dictDate, builtAt, sourceSha256,
 *     kana: { "<reading>": [ids, posCsv, common] },
 *     kanji: { "<surface>": [ids, posCsv, common] },
 *   }
 * `ids` is an array of numeric JMdict entry ids (usually length 1 — a
 * surface shared by multiple entries, e.g. heteronyms, keeps all of them).
 * `posCsv` is the DEDUPED union of every sense's `partOfSpeech` tags across
 * every entry that surface belongs to, comma-joined (JMdict's own short
 * codes: "n", "v5r", "adj-i", "prt", "aux-v", "cop"... — see
 * jmdict-simplified's `tags` field in the raw JSON, or
 * https://www.edrdg.org/jmdict/edict_doc.html §7 for the legend). `common`
 * is 1 if ANY kanji/kana form of ANY entry sharing that surface is
 * JMdict-"common" (a curated frequency flag upstream derives from the News
 * corpus + other frequency sources), else 0.
 *
 * This intentionally drops glosses/examples/cross-refs — Q2/Q3 only ever
 * ask "does this surface exist" / "is it common" / "what's its POS", never
 * "what does it mean" — keeping the index at ~1/5 the raw JSON's size.
 */
function buildIndex(raw) {
  const kana = new Map();
  const kanji = new Map();

  function add(map, text, id, common, posSet) {
    let entry = map.get(text);
    if (!entry) {
      entry = { ids: new Set(), pos: new Set(), common: false };
      map.set(text, entry);
    }
    entry.ids.add(id);
    entry.common = entry.common || common;
    for (const p of posSet) entry.pos.add(p);
  }

  for (const word of raw.words) {
    const posSet = new Set();
    for (const sense of word.sense ?? []) {
      for (const p of sense.partOfSpeech ?? []) posSet.add(p);
    }
    for (const k of word.kana ?? []) add(kana, k.text, word.id, !!k.common, posSet);
    for (const k of word.kanji ?? []) add(kanji, k.text, word.id, !!k.common, posSet);
  }

  function serialize(map) {
    const out = {};
    for (const [text, entry] of map) {
      out[text] = [[...entry.ids], [...entry.pos].join(","), entry.common ? 1 : 0];
    }
    return out;
  }

  return {
    version: raw.version,
    dictDate: raw.dictDate,
    builtAt: new Date().toISOString(),
    sourceSha256: EXPECTED_SHA256,
    kana: serialize(kana),
    kanji: serialize(kanji),
  };
}

async function main() {
  const force = process.argv.includes("--force");

  if (force || !existsSync(TGZ_PATH) || sha256Safe(TGZ_PATH) !== EXPECTED_SHA256) {
    await download();
  }
  verify(TGZ_PATH);
  console.error(`[fetch-jmdict] sha256 OK: ${EXPECTED_SHA256}`);

  if (force || !existsSync(JSON_PATH)) {
    extract();
  }

  if (!force && existsSync(INDEX_PATH)) {
    console.error(`[fetch-jmdict] index already built at ${INDEX_PATH} (pass --force to rebuild)`);
    return;
  }

  console.error(`[fetch-jmdict] parsing ${JSON_PATH}...`);
  const raw = JSON.parse(readFileSync(JSON_PATH, "utf8"));
  console.error(`[fetch-jmdict] ${raw.words.length} entries, building compact index...`);
  const index = buildIndex(raw);
  writeFileSync(INDEX_PATH, JSON.stringify(index));
  const kanaCount = Object.keys(index.kana).length;
  const kanjiCount = Object.keys(index.kanji).length;
  const bytes = statSync(INDEX_PATH).size;
  writeFileSync(
    INDEX_META_PATH,
    JSON.stringify(
      { version: index.version, dictDate: index.dictDate, builtAt: index.builtAt, kanaCount, kanjiCount, bytes },
      null,
      1,
    ),
  );
  console.error(`[fetch-jmdict] wrote ${INDEX_PATH} (${kanaCount} kana surfaces, ${kanjiCount} kanji surfaces, ${bytes} bytes)`);
}

function sha256Safe(p) {
  try {
    return sha256(p);
  } catch {
    return null;
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
