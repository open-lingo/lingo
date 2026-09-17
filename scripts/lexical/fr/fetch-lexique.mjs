#!/usr/bin/env node
/**
 * Fetch + verify + compact-index Lexique 3.83 for the FR lexical sidecar's
 * frequency/POS facts (`docs/procedural-qa-2026-09-17.md` §"Spanish/French").
 * Mirrors `scripts/lexical/ja/fetch-jmdict.mjs`'s shape (download, sha256
 * pin, compact, gitignored artifact) for a second, differently-shaped
 * source.
 *
 * Source: Lexique (http://www.lexique.org), New/Pallier/Brysbaert/Ferrand
 * et al. — a French lexical database (~140,000 orthographic forms) giving
 * lemma, grammatical category (`cgram`), gender/number, and corpus
 * frequency (subtitle corpus `freqfilms2`, book corpus `freqlivres`, plus
 * lemma-level `freqlemfilms2`/`freqlemlivres`) per entry.
 *
 * Licence: Lexique 3.83 is distributed under **CC BY-SA 4.0**
 * (`README-Lexique.txt` inside the release zip: "License: CC BY SA40.0").
 * Attribution is required whenever the data (or a derivative, like this
 * compact index) is used or redistributed; this file's header and
 * `docs/procedural-qa-2026-09-17.md` are where that attribution lives —
 * do not strip it when reusing the index elsewhere. Cite: New, B.,
 * Pallier, C., Brysbaert, M., Ferrand, L. (2004), "Lexique 2 : A New
 * French Lexical Database", Behavior Research Methods, Instruments, &
 * Computers, 36 (3), 516-524.
 *
 * Pinned release:
 *   URL:     http://www.lexique.org/databases/Lexique383/Lexique383.zip
 *   Fetched: 2026-09-17
 *   sha256:  e181d132b3b0d3d87efc98d376968441b517353933011cebea5366321a6024e6
 *   (`fetch-lexique.mjs` refuses to proceed on a mismatch.)
 *
 * What this script does:
 *   1. Download the pinned .zip (skips if already present + sha256-valid).
 *   2. Verify sha256 against the pin above.
 *   3. Extract `Lexique383.tsv` (tab-separated, ~140k rows, 35 columns).
 *   4. Build a compact index (`index.json`) keyed by `ortho` (the surface
 *      form): `{ [ortho]: [{ lemme, cgram, freqlemfilms2, isLemma }] }` —
 *      one ortho can map to several entries (homographs across POS, e.g.
 *      "a" as NOM vs AUX). Drops phon/syll/morphoder/etc columns this
 *      lane never reads.
 *
 * Output lives under `artifacts/lexical/lexique/` (gitignored — repo-wide
 * `artifacts/` rule), never committed.
 *
 * Usage:
 *   node scripts/lexical/fr/fetch-lexique.mjs           # fetch if missing, (re)build index if stale
 *   node scripts/lexical/fr/fetch-lexique.mjs --force    # re-download + rebuild even if present
 */
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(HERE, "../../../");
const OUT_DIR = path.join(REPO_ROOT, "artifacts/lexical/lexique");
const RAW_DIR = path.join(OUT_DIR, "raw");

const ASSET_URL = "http://www.lexique.org/databases/Lexique383/Lexique383.zip";
const ZIP_NAME = "Lexique383.zip";
const EXPECTED_SHA256 = "e181d132b3b0d3d87efc98d376968441b517353933011cebea5366321a6024e6";

const zipPath = path.join(RAW_DIR, ZIP_NAME);
const tsvPath = path.join(RAW_DIR, "Lexique383.tsv");
const indexPath = path.join(OUT_DIR, "index.json");

function sha256(filePath) {
  return createHash("sha256").update(readFileSync(filePath)).digest("hex");
}

function ensureDownloaded(force) {
  mkdirSync(RAW_DIR, { recursive: true });
  if (!force && existsSync(zipPath) && sha256(zipPath) === EXPECTED_SHA256) {
    console.log(`[fetch-lexique] ${ZIP_NAME} already present + verified.`);
    return;
  }
  console.log(`[fetch-lexique] downloading ${ASSET_URL} ...`);
  execFileSync("curl", ["-sL", ASSET_URL, "-o", zipPath, "--max-time", "120"], { stdio: "inherit" });
  const actual = sha256(zipPath);
  if (actual !== EXPECTED_SHA256) {
    throw new Error(
      `[fetch-lexique] sha256 MISMATCH for ${ZIP_NAME}: expected ${EXPECTED_SHA256}, got ${actual}. Refusing to proceed — the pinned release may have moved or the download was corrupted.`,
    );
  }
  console.log(`[fetch-lexique] sha256 verified: ${actual}`);
}

function ensureExtracted(force) {
  if (!force && existsSync(tsvPath)) return;
  console.log(`[fetch-lexique] extracting ${ZIP_NAME} ...`);
  execFileSync("unzip", ["-o", zipPath, "Lexique383.tsv", "-d", RAW_DIR], { stdio: "inherit" });
}

/** Columns this lane reads, by header name (see Lexique383's own header
 *  row for the full 35-column schema — Manuel_Lexique.3.pdf in the zip
 *  documents every field; only these four are needed for Q2/Q8-style
 *  frequency/POS facts). */
const WANT_COLS = ["ortho", "lemme", "cgram", "freqlemfilms2", "islem"];

function buildIndex(force) {
  if (!force && existsSync(indexPath)) {
    console.log(`[fetch-lexique] ${indexPath} already built (pass --force to rebuild).`);
    return;
  }
  console.log(`[fetch-lexique] building compact index from ${tsvPath} ...`);
  const raw = readFileSync(tsvPath, "utf8");
  const lines = raw.split("\n");
  const header = lines[0].split("\t");
  const colIdx = Object.fromEntries(WANT_COLS.map((c) => [c, header.indexOf(c)]));
  for (const c of WANT_COLS) {
    if (colIdx[c] === -1) throw new Error(`[fetch-lexique] expected column "${c}" not found in header`);
  }

  /** @type {Record<string, {lemme:string, cgram:string, freq:number, isLemma:boolean}[]>} */
  const index = Object.create(null);
  let rows = 0;
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line) continue;
    const cols = line.split("\t");
    const ortho = cols[colIdx.ortho];
    if (!ortho) continue;
    const entry = {
      lemme: cols[colIdx.lemme] || ortho,
      cgram: cols[colIdx.cgram] || "",
      freq: Number(cols[colIdx.freqlemfilms2]) || 0,
      isLemma: cols[colIdx.islem] === "1",
    };
    (index[ortho] ??= []).push(entry);
    rows++;
  }

  mkdirSync(OUT_DIR, { recursive: true });
  writeFileSync(indexPath, JSON.stringify(index), "utf8");
  console.log(
    `[fetch-lexique] wrote ${indexPath} (${rows} rows, ${Object.keys(index).length} distinct orthographic forms).`,
  );
}

function main() {
  const force = process.argv.includes("--force");
  ensureDownloaded(force);
  ensureExtracted(force);
  buildIndex(force);
}

main();
