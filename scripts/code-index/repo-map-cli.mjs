#!/usr/bin/env node
// repo-map-cli.mjs — generate docs/CODE_MAP.md from the real tree.
//
// Reads every tracked .ts/.tsx source file, extracts symbols with tree-sitter,
// ranks files by PageRank over the ref→def graph, and emits a token-budgeted
// digest. A per-file content-hash cache (artifacts/code-index/repo-map-cache.json)
// makes re-runs cheap: only changed files are re-parsed.
//
//   node scripts/code-index/repo-map-cli.mjs [--budget 60000] [--out docs/CODE_MAP.md]
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { execSync } from "node:child_process";
import { createHash } from "node:crypto";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { extractSymbols, rankFiles, buildRepoMap } from "./repo-map.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(here, "../..");
const arg = (n, d) => { const i = process.argv.indexOf(`--${n}`); return i > -1 ? process.argv[i + 1] : d; };
const BUDGET = Number(arg("budget", "60000"));
const OUT = join(ROOT, arg("out", "docs/CODE_MAP.md"));
const CACHE = join(ROOT, "artifacts/code-index/repo-map-cache.json");

const files = execSync("git ls-files", { cwd: ROOT, encoding: "utf8", maxBuffer: 128 * 1024 * 1024 })
  .split("\n")
  .filter((p) => /\.(ts|tsx)$/.test(p) && !p.endsWith(".d.ts") && !p.includes("/_archive/") && !/\.(test|spec)\.tsx?$/.test(p) && !p.startsWith("node_modules/"));

let cache = {};
if (existsSync(CACHE)) { try { cache = JSON.parse(readFileSync(CACHE, "utf8")); } catch {} }

const t0 = Date.now();
let parsed = 0, cached = 0, errored = 0;
const nextCache = {};
const fileSymbols = [];

for (const path of files) {
  let src;
  try { src = readFileSync(join(ROOT, path), "utf8"); } catch { continue; }
  const hash = createHash("sha1").update(src).digest("hex").slice(0, 16);
  const lang = path.endsWith(".tsx") ? "tsx" : "ts";
  let entry;
  if (cache[path] && cache[path].hash === hash && cache[path].imports) {
    entry = cache[path]; cached++;
  } else {
    try {
      const { defs, refs, imports } = extractSymbols(src, lang);
      entry = { hash, defs, refs, imports }; parsed++;
    } catch (e) {
      entry = { hash, defs: [], refs: [], error: String(e).slice(0, 80) }; errored++;
    }
  }
  nextCache[path] = entry;
  fileSymbols.push({ path, defs: entry.defs, refs: entry.refs });
}

const ranked = rankFiles(fileSymbols);
const map = buildRepoMap(ranked, { budgetChars: BUDGET });

mkdirSync(dirname(CACHE), { recursive: true });
writeFileSync(CACHE, JSON.stringify(nextCache));
mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, map + "\n");

const totalDefs = fileSymbols.reduce((n, f) => n + f.defs.length, 0);
console.log(`[repo-map] ${files.length} files (${parsed} parsed, ${cached} cached, ${errored} err), ${totalDefs} exports, ${Date.now() - t0}ms`);
console.log(`[repo-map] top 8 by rank:`);
for (const f of ranked.slice(0, 8)) console.log(`  ${f.score.toFixed(5)}  ${f.path}  (${f.defs.length} exports)`);
console.log(`[repo-map] wrote ${OUT.replace(ROOT + "/", "")} (${map.length} chars, budget ${BUDGET})`);
