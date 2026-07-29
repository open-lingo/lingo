#!/usr/bin/env node
/**
 * Ingest a 국립국어원 (National Institute of Korean Language) frequency list into
 * `KO_FREQUENCY_ATOMS` entries. KOGL Type 1 — commercial OK, attribution
 * "출처: 국립국어원", no share-alike (see docs/ko-6k-vocab-sourcing-2026-07-24.md).
 *
 * Usage:
 *   node scripts/ingest-ko-frequency.mjs <file.tsv> [options] > /tmp/ko-freq.ts
 *
 * Options:
 *   --cols=word,pos,freq   Column order (0-based, by name). Default heuristic:
 *                          detect a Hangul column (word), a Korean-POS column,
 *                          and a numeric column (freq/rank).
 *   --delim=tab|comma      Field delimiter. Default: auto (tab if present).
 *   --gloss-col=<name>     Column to use for the English gloss (optional).
 *   --rom-col=<name>       Column carrying Revised Romanization (optional).
 *   --limit=<n>            Keep only the top-N by frequency (default 6000).
 *   --header               Treat the first line as a header row (skip it).
 *   --first-module=<n>     Earliest unlock module (default 3).
 *   --words-per-module=<n> Words unlocked per module (default 8).
 *   --last-module=<n>      Upper unlock bound (default 27, KO content modules).
 *
 * The rank is the source row order (already frequency-sorted in the gov file),
 * or, if the file carries an explicit rank/freq column, sorted by it descending.
 *
 * ── keep in sync with src/features/languages/frequencyTypes.ts ──
 */
import { readFileSync } from "node:fs";

// Mirror of frequencyRankToModule (frequencyTypes.ts). Kept inline because a
// build script can't import the TS module. If the TS constants change, update
// these too (there is a test asserting the seed's unlockModule matches the fn).
const DEFAULTS = { firstModule: 3, wordsPerModule: 8, lastModule: 27 };
function frequencyRankToModule(rank, o = DEFAULTS) {
  const safeRank = Math.max(1, Math.floor(rank));
  const per = Math.max(1, Math.floor(o.wordsPerModule));
  const bucket = Math.floor((safeRank - 1) / per);
  return Math.min(o.lastModule, o.firstModule + bucket);
}

// Korean POS label → shared PartOfSpeech taxonomy.
const POS_MAP = {
  명사: "noun",
  동사: "verb",
  형용사: "adjective",
  부사: "adverb",
  대명사: "pronoun",
  관형사: "determiner",
  수사: "number",
  조사: "particle",
  감탄사: "interjection",
  접속사: "conjunction",
  고유명사: "proper-noun",
  의존명사: "noun",
  보조동사: "verb",
  보조형용사: "adjective",
};

function parseArgs(argv) {
  const opts = { limit: 6000, header: false, ...DEFAULTS };
  let file = null;
  for (const a of argv) {
    if (a.startsWith("--cols=")) opts.cols = a.slice(7).split(",");
    else if (a.startsWith("--delim=")) opts.delim = a.slice(8);
    else if (a.startsWith("--gloss-col=")) opts.glossCol = a.slice(12);
    else if (a.startsWith("--rom-col=")) opts.romCol = a.slice(10);
    else if (a.startsWith("--limit=")) opts.limit = Number(a.slice(8));
    else if (a === "--header") opts.header = true;
    else if (a.startsWith("--first-module=")) opts.firstModule = Number(a.slice(15));
    else if (a.startsWith("--words-per-module=")) opts.wordsPerModule = Number(a.slice(19));
    else if (a.startsWith("--last-module=")) opts.lastModule = Number(a.slice(14));
    else if (!a.startsWith("--")) file = a;
  }
  return { file, opts };
}

const HANGUL = /[가-힣]/;
function isHangulToken(s) {
  return HANGUL.test(s) && !/^\d+$/.test(s);
}

/** Locate word / pos / freq columns heuristically from the first data rows. */
function detectColumns(rows) {
  const sample = rows.slice(0, 20);
  const width = Math.max(...sample.map((r) => r.length));
  let wordCol = -1, posCol = -1, freqCol = -1;
  for (let c = 0; c < width; c++) {
    const vals = sample.map((r) => (r[c] ?? "").trim()).filter(Boolean);
    if (vals.length === 0) continue;
    const hangul = vals.filter(isHangulToken).length / vals.length;
    const posish = vals.filter((v) => POS_MAP[v]).length / vals.length;
    const numeric = vals.filter((v) => /^\d[\d,]*$/.test(v)).length / vals.length;
    if (posCol < 0 && posish > 0.5) posCol = c;
    else if (wordCol < 0 && hangul > 0.5) wordCol = c;
    if (freqCol < 0 && numeric > 0.7) freqCol = c;
  }
  return { wordCol, posCol, freqCol };
}

function main() {
  const { file, opts } = parseArgs(process.argv.slice(2));
  if (!file) {
    console.error("usage: node scripts/ingest-ko-frequency.mjs <file.tsv> [options]");
    process.exit(1);
  }
  const raw = readFileSync(file, "utf8");
  const delim = opts.delim === "comma" ? "," : opts.delim === "tab" ? "\t" : raw.includes("\t") ? "\t" : ",";
  let lines = raw.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (opts.header) lines = lines.slice(1);
  const rows = lines.map((l) => l.split(delim));

  let wordCol, posCol, freqCol, glossCol, romCol;
  if (opts.cols) {
    [wordCol, posCol, freqCol] = opts.cols.map((_, i) => i);
    // named override: --cols is positional (word,pos,freq)
    wordCol = 0; posCol = 1; freqCol = 2;
  } else {
    ({ wordCol, posCol, freqCol } = detectColumns(rows));
  }
  glossCol = opts.glossCol != null ? Number(opts.glossCol) : -1;
  romCol = opts.romCol != null ? Number(opts.romCol) : -1;

  if (wordCol < 0) {
    console.error("Could not locate a Hangul word column. Pass --cols=word,pos,freq (0-based).");
    process.exit(1);
  }

  // Build records; dedupe by surface, keep the first (highest-freq) occurrence.
  const seen = new Set();
  const records = [];
  for (const r of rows) {
    const surface = (r[wordCol] ?? "").trim();
    if (!surface || !isHangulToken(surface) || seen.has(surface)) continue;
    const koPos = posCol >= 0 ? (r[posCol] ?? "").trim() : "";
    const pos = POS_MAP[koPos] ?? "other";
    const freq = freqCol >= 0 ? Number((r[freqCol] ?? "").replace(/,/g, "")) : NaN;
    seen.add(surface);
    records.push({
      surface,
      pos,
      freq: Number.isFinite(freq) ? freq : 0,
      gloss: glossCol >= 0 ? (r[glossCol] ?? "").trim() : "",
      reading: romCol >= 0 ? (r[romCol] ?? "").trim() : "",
    });
  }

  // Sort by explicit frequency descending when present, else keep source order.
  if (freqCol >= 0 && records.some((x) => x.freq > 0)) {
    records.sort((a, b) => b.freq - a.freq);
  }
  const kept = records.slice(0, opts.limit);

  const bucket = { firstModule: opts.firstModule, wordsPerModule: opts.wordsPerModule, lastModule: opts.lastModule };
  const esc = (s) => s.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
  const body = kept
    .map((rec, i) => {
      const rank = i + 1;
      const unlockModule = frequencyRankToModule(rank, bucket);
      const gloss = rec.gloss || "(gloss pending)";
      return `  { id: "ko:${esc(rec.surface)}", surface: "${esc(rec.surface)}", reading: "${esc(rec.reading)}", meaningEn: "${esc(gloss)}", pos: "${rec.pos}", frequencyRank: ${rank}, unlockModule: ${unlockModule}, source: "freq" },`;
    })
    .join("\n");

  process.stdout.write(
    `// Generated by scripts/ingest-ko-frequency.mjs — 출처: 국립국어원 (KOGL Type 1)\n` +
      `// ${kept.length} words. Paste into ko/frequencyAtoms.ts as KO_FREQUENCY_ATOMS.\n` +
      `export const KO_FREQUENCY_ATOMS = [\n${body}\n];\n`,
  );
  console.error(`ingested ${kept.length} words (of ${records.length} unique)`);
}

main();
