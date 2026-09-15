#!/usr/bin/env node
/**
 * Extend-answers lane — Step 4: 12% stratified-by-module sample of accepted
 * patches for a Sonnet audit (naturalness + meaning preservation). Not run
 * by this lane — the lead dispatches the audit separately.
 *
 * Writes <EXTEND_DIR>/audit-sample.jsonl.
 */
import fs from "node:fs";
import path from "node:path";

const EXTEND_DIR =
  process.env.EXTEND_DIR ||
  "/private/tmp/claude-501/-Users-lichfield-Documents-projects-lingle/f70c9300-76dc-4cec-9490-1bf299974b7a/scratchpad/fb16-research/extend";
const PATCHES_FILE = path.join(EXTEND_DIR, "patches.jsonl");
const OUT_FILE = path.join(EXTEND_DIR, "audit-sample.jsonl");
const RATE = Number(process.env.EXTEND_AUDIT_RATE || 0.12);
const SEED = Number(process.env.EXTEND_AUDIT_SEED || 42);

function mulberry32(seed) {
  let a = seed;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function readJsonl(file) {
  if (!fs.existsSync(file)) return [];
  return fs
    .readFileSync(file, "utf8")
    .trim()
    .split("\n")
    .filter(Boolean)
    .map((l) => JSON.parse(l));
}

const patches = readJsonl(PATCHES_FILE);
if (patches.length === 0) {
  console.log("sample-for-audit.mjs: no patches.jsonl (or empty) — nothing to sample. Run gate.mjs first.");
  process.exit(0);
}

const byModule = new Map();
for (const p of patches) {
  if (!byModule.has(p.module)) byModule.set(p.module, []);
  byModule.get(p.module).push(p);
}

const rand = mulberry32(SEED);
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const sample = [];
for (const [mod, list] of [...byModule.entries()].sort(([a], [b]) => a.localeCompare(b))) {
  const n = Math.max(1, Math.round(list.length * RATE));
  sample.push(...shuffle(list).slice(0, n));
}

fs.writeFileSync(OUT_FILE, sample.map((p) => JSON.stringify(p)).join("\n") + "\n");
console.log(
  `sample-for-audit.mjs: ${sample.length} / ${patches.length} accepted patches sampled (${((sample.length / patches.length) * 100).toFixed(1)}%) -> ${OUT_FILE}`,
);
const perModule = {};
for (const p of sample) perModule[p.module] = (perModule[p.module] || 0) + 1;
console.log("sample-for-audit.mjs: per-module sample counts:", JSON.stringify(perModule));
