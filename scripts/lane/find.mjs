#!/usr/bin/env node
// scripts/lane/find.mjs — one-call code search: semantic candidates (if the
// embed index exists) CONFIRMED by rg (or a Node fallback — see
// lib/grep-fallback.mjs), deduped, top 12. The index proposes, rg decides —
// see docs/CODE_MAP.md and the codebase-search skill §1.
// Usage: find.mjs "<query>" [--symbol NAME] [--k 12] [--lang ja|ko|es|fr]
// --symbol confirms against an exact identifier instead of the query text.
// --lang ALSO searches emitted course content, printing lessonId + 0-indexed
// step (delegates to the same lib step-url.mjs uses; run content:emit first
// if src/pub/content/v1 is missing).
import { existsSync } from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { contentAvailable, findInContent } from "./lib/content-search.mjs";
import { buildMatcher, grepFallback } from "./lib/grep-fallback.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const EMBED_DB = path.join(ROOT, "artifacts/code-index/embed.db");
const EMBED_CLI = path.join(ROOT, "scripts/code-index/embed/embed-cli.mjs");
const SEARCH_DIRS = ["src", "docs", "scripts"];

function usage() {
  console.log(`usage: find.mjs "<query>" [--symbol NAME] [--k 12] [--lang ja|ko|es|fr]

Up to 12 deduped "file:line: text" hits: semantic candidates (if
artifacts/code-index/embed.db exists) confirmed with rg, else a plain grep
search over src/ docs/ scripts/. With --lang, also searches emitted course
content for the query text, printing "lessonId step=N [type]".`);
}

const args = process.argv.slice(2);
if (args.includes("-h") || args.includes("--help") || args.length === 0) {
  usage();
  process.exit(args.length === 0 ? 2 : 0);
}
const flagVal = (name) => { const i = args.indexOf(`--${name}`); return i > -1 ? args[i + 1] : null; };
const symbol = flagVal("symbol");
const lang = flagVal("lang");
const k = Number(flagVal("k") || 12);
const flagArgs = new Set(["--symbol", symbol, "--lang", lang, "--k", flagVal("k")].filter(Boolean));
const query = args.find((a) => !flagArgs.has(a) && !a.startsWith("--"));
if (!query) { usage(); process.exit(2); }
const confirmTerm = symbol || query;

function semanticCandidates(q) {
  if (!existsSync(EMBED_DB)) return null;
  let out;
  try {
    out = execFileSync("node", [EMBED_CLI, "query", q, "--k", String(k)], { cwd: ROOT, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] });
  } catch { return null; }
  const files = [];
  for (const line of out.split("\n")) {
    const m = /^\s*[\d.]+\s+(\S+):(\d+)/.exec(line);
    if (m && !files.includes(m[1])) files.push(m[1]);
  }
  return files;
}

// Real `rg` first; if it's not a real binary on PATH (ENOENT — true in this
// sandbox, where `rg` is only an interactive shell function), fall back to
// the pure-Node matcher so the tool still works headless.
function rgConfirm(term, files) {
  const roots = files && files.length ? files : SEARCH_DIRS;
  const re = buildMatcher(term);
  const rgArgs = ["-n", "--no-heading", "-i", "-m", "3", "-e", re.source, ...roots];
  try {
    return execFileSync("rg", rgArgs, { cwd: ROOT, encoding: "utf8" }).trim().split("\n").filter(Boolean);
  } catch (err) {
    if (err.code !== "ENOENT") return [];
    return grepFallback(term, roots.map((r) => path.resolve(ROOT, r)));
  }
}

const candidateFiles = semanticCandidates(query);
let lines = rgConfirm(confirmTerm, candidateFiles);
if (lines.length === 0 && candidateFiles) lines = rgConfirm(confirmTerm, null); // candidates didn't literally match

const seen = new Set(), deduped = [];
for (const raw of lines) {
  const l = raw.startsWith(ROOT + "/") ? raw.slice(ROOT.length + 1) : raw;
  const key = l.split(":").slice(0, 2).join(":");
  if (seen.has(key)) continue;
  seen.add(key); deduped.push(l);
  if (deduped.length >= k) break;
}

console.log(candidateFiles !== null ? `[find] semantic index + confirm` : `[find] no embed index at artifacts/code-index/embed.db — plain grep`);
console.log(deduped.length === 0 ? "(no confirmed hits)" : deduped.join("\n"));

if (lang) {
  if (!contentAvailable()) {
    console.log(`\n[find --lang] src/pub/content/v1 missing — run \`npm run content:emit\` first`);
  } else {
    let hits = [];
    try { hits = findInContent(lang, query); } catch (err) { console.log(`\n[find --lang] ${err.message}`); }
    console.log(`\n[find --lang ${lang}] ${hits.length} step(s) contain the text:`);
    console.log(hits.slice(0, k).map((h) => `  ${h.lessonId} step=${h.stepIndex} [${h.stepType}]`).join("\n"));
    if (hits.length > k) console.log(`  ... (${hits.length - k} more omitted)`);
  }
}
