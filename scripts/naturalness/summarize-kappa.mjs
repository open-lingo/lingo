#!/usr/bin/env node
/**
 * A5d — reads every artifacts/naturalness/kappa-*.jsonl record and prints
 * the report table (model | lang | variant | precision | recall | kappa |
 * seconds), keeping only the LATEST record per (model, lang, variant) if a
 * combo was re-run. Also prints the best-by-kappa variant per (model, lang).
 *
 * Usage: node summarize-kappa.mjs [--dir artifacts/naturalness]
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "..", "..");

function parseArgs(argv) {
  const out = { dir: path.join(REPO_ROOT, "artifacts", "naturalness") };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--dir") out.dir = argv[++i];
  }
  return out;
}

function fmtPct(x) {
  return x == null ? "n/a" : (x * 100).toFixed(1) + "%";
}
function fmtKappa(x) {
  return x == null ? "n/a" : x.toFixed(3);
}

function main() {
  const { dir } = parseArgs(process.argv.slice(2));
  if (!fs.existsSync(dir)) {
    console.error(`no such dir: ${dir}`);
    process.exit(1);
  }
  const files = fs.readdirSync(dir).filter((f) => /^kappa-.*\.jsonl$/.test(f));
  const latest = new Map(); // key `${model}|${lang}|${prompt}` -> record
  for (const f of files) {
    const lines = fs.readFileSync(path.join(dir, f), "utf8").trim().split("\n").filter(Boolean);
    for (const line of lines) {
      let rec;
      try {
        rec = JSON.parse(line);
      } catch {
        continue;
      }
      const key = `${rec.model}|${rec.lang}|${rec.prompt}`;
      const prev = latest.get(key);
      if (!prev || rec.ts > prev.ts) latest.set(key, rec);
    }
  }

  const rows = [...latest.values()].sort(
    (a, b) => a.model.localeCompare(b.model) || a.lang.localeCompare(b.lang) || a.prompt.localeCompare(b.prompt),
  );

  console.log("model | lang | variant | precision | recall | kappa | seconds | planted");
  console.log("---|---|---|---|---|---|---|---");
  for (const r of rows) {
    console.log(
      `${r.model} | ${r.lang} | ${r.prompt} | ${fmtPct(r.precision)} | ${fmtPct(r.recall)} | ${fmtKappa(r.kappa)} | ${r.wallS.toFixed(1)} | ${r.plantedCaught}/${r.planted}`,
    );
  }

  // Best variant per (model, lang) by kappa.
  const byModelLang = new Map();
  for (const r of rows) {
    const key = `${r.model}|${r.lang}`;
    const prev = byModelLang.get(key);
    if (!prev || (r.kappa ?? -Infinity) > (prev.kappa ?? -Infinity)) byModelLang.set(key, r);
  }
  console.log("\nBest variant by kappa, per (model, lang):");
  for (const [key, r] of byModelLang) {
    console.log(`  ${key}: ${r.prompt} (kappa=${fmtKappa(r.kappa)}, useful-bar >=0.6: ${r.kappa != null && r.kappa >= 0.6 ? "YES" : "no"})`);
  }
}

main();
