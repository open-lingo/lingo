#!/usr/bin/env node
/**
 * Query the backlog. See docs/backlog/README.md for the schema.
 *
 * The point of this script is that NOBODY — human or agent — should ever read
 * items.yaml top to bottom. Ask it a question instead.
 *
 *   node scripts/backlog.mjs                    everything, worst first
 *   node scripts/backlog.mjs --next             low-hanging fruit
 *   node scripts/backlog.mjs --tag module/m12   one module (prefix match)
 *   node scripts/backlog.mjs --area engine
 *   node scripts/backlog.mjs --severity blocker
 *   node scripts/backlog.mjs --status open
 *   node scripts/backlog.mjs --id B016          one item, in full
 *   node scripts/backlog.mjs --stats
 *   node scripts/backlog.mjs --check            validate before committing
 *   node scripts/backlog.mjs --add              print a blank record to paste
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const HERE = dirname(fileURLToPath(import.meta.url));
const FILE = join(HERE, "..", "docs", "backlog", "items.yaml");

const SEVERITY = ["blocker", "major", "minor", "note"];
const EFFORT = ["XS", "S", "M", "L", "XL"];
const STATUS = ["open", "fixed", "wontfix", "note", "decision-needed"];
const CONFIDENCE = ["verified", "reported", "suspected"];
const AREA = ["content", "engine", "ui", "data", "tooling", "pedagogy"];

/**
 * Minimal YAML reader for THIS file's shape only: a top-level list of
 * `key: value` maps, `>`-folded blocks, and `[a, b]` inline lists. Written
 * out rather than pulled in so the backlog has no dependency and this script
 * works in any checkout.
 */
function parse(text) {
  const items = [];
  let cur = null;
  let foldKey = null;
  let foldLines = null;
  const flushFold = () => {
    if (foldKey) {
      cur[foldKey] = foldLines.join(" ").replace(/\s+/g, " ").trim();
      foldKey = null;
      foldLines = null;
    }
  };
  for (const raw of text.split("\n")) {
    const line = raw.replace(/\s+$/, "");
    if (foldKey !== null) {
      if (/^\s{4,}\S/.test(line) || line === "") {
        foldLines.push(line.trim());
        continue;
      }
      flushFold();
    }
    if (!line.trim() || /^\s*#/.test(line)) continue;
    const start = line.match(/^- (\w+):\s*(.*)$/);
    if (start) {
      cur = {};
      items.push(cur);
      assign(cur, start[1], start[2]);
      continue;
    }
    const kv = line.match(/^\s{2}(\w+):\s*(.*)$/);
    if (kv && cur) {
      if (kv[2] === ">" || kv[2] === "|") {
        foldKey = kv[1];
        foldLines = [];
        continue;
      }
      assign(cur, kv[1], kv[2]);
    }
  }
  flushFold();
  return items;
}

function assign(obj, key, value) {
  let v = value.trim();
  if (v.startsWith("[")) {
    obj[key] = v
      .replace(/^\[|\]$/g, "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    return;
  }
  v = v.replace(/^["']|["']$/g, "");
  obj[key] = v;
}

const items = parse(readFileSync(FILE, "utf8"));

// ── sorting ────────────────────────────────────────────────────────────────
const sevRank = (i) => {
  const n = SEVERITY.indexOf(i.severity);
  return n === -1 ? 99 : n;
};
const effRank = (i) => {
  const n = EFFORT.indexOf(i.effort);
  return n === -1 ? 99 : n;
};
const worstFirst = (a, b) => sevRank(a) - sevRank(b) || effRank(a) - effRank(b) || a.id.localeCompare(b.id);
/** Value per unit of work: bad things that are cheap to fix come first. */
const bestValue = (a, b) => effRank(a) - effRank(b) || sevRank(a) - sevRank(b) || a.id.localeCompare(b.id);

// ── rendering ──────────────────────────────────────────────────────────────
const C = process.stdout.isTTY
  ? { dim: "\x1b[2m", b: "\x1b[1m", r: "\x1b[0m", red: "\x1b[31m", yel: "\x1b[33m", cyan: "\x1b[36m" }
  : { dim: "", b: "", r: "", red: "", yel: "", cyan: "" };
const sevColor = (s) => (s === "blocker" ? C.red : s === "major" ? C.yel : s === "note" ? C.dim : "");

function line(i) {
  const sev = `${sevColor(i.severity)}${(i.severity ?? "?").padEnd(7)}${C.r}`;
  const st = i.status === "open" ? "" : `${C.dim}[${i.status}]${C.r} `;
  const tags = (i.tags ?? []).filter((t) => /^(module|page|step)\//.test(t)).slice(0, 3).join(" ");
  return `${C.b}${i.id}${C.r}  ${sev} ${(i.effort ?? "?").padEnd(2)}  ${st}${i.title}\n      ${C.dim}${tags}${C.r}`;
}

function full(i) {
  const out = [`${C.b}${i.id} — ${i.title}${C.r}`, ""];
  for (const k of ["status", "severity", "effort", "confidence", "area", "found", "source"])
    if (i[k]) out.push(`  ${k.padEnd(11)} ${i[k]}`);
  if (i.tags?.length) out.push(`  ${"tags".padEnd(11)} ${i.tags.join(", ")}`);
  if (i.blocked_by?.length) out.push(`  ${"blocked_by".padEnd(11)} ${i.blocked_by.join(", ")}`);
  for (const k of ["detail", "evidence", "fix", "note"])
    if (i[k]) out.push("", `  ${C.cyan}${k}${C.r}: ${i[k]}`);
  return out.join("\n");
}

// ── args ───────────────────────────────────────────────────────────────────
const argv = process.argv.slice(2);
const flag = (name) => {
  const n = argv.indexOf(`--${name}`);
  return n === -1 ? null : (argv[n + 1] ?? "");
};
const has = (name) => argv.includes(`--${name}`);

if (has("add")) {
  const next = "B" + String(Math.max(...items.map((i) => parseInt(i.id.slice(1), 10))) + 1).padStart(3, "0");
  console.log(`- id: ${next}
  title:
  status: open
  severity: minor        # blocker | major | minor | note
  effort: S              # XS | S | M | L | XL
  confidence: reported   # verified | reported | suspected
  area: content          # content | engine | ui | data | tooling | pedagogy
  tags: []
  found: ${new Date().toISOString().slice(0, 10)}
  source: spencer-play
  detail: >
    `);
  process.exit(0);
}

if (has("check")) {
  const errs = [];
  const seen = new Set();
  for (const i of items) {
    const at = i.id ?? "(no id)";
    if (!i.id) errs.push("record with no id");
    if (seen.has(i.id)) errs.push(`${at}: duplicate id`);
    seen.add(i.id);
    if (!i.title) errs.push(`${at}: no title`);
    for (const [k, allowed] of [["severity", SEVERITY], ["effort", EFFORT], ["status", STATUS], ["confidence", CONFIDENCE], ["area", AREA]])
      if (i[k] && !allowed.includes(i[k])) errs.push(`${at}: ${k}="${i[k]}" not one of ${allowed.join("|")}`);
    for (const dep of i.blocked_by ?? []) if (!items.some((x) => x.id === dep)) errs.push(`${at}: blocked_by ${dep} does not exist`);
    if (i.status === "open" && !i.detail && !i.note) errs.push(`${at}: open with no detail`);
  }
  if (errs.length) {
    console.error(errs.map((e) => `  ✗ ${e}`).join("\n"));
    process.exit(1);
  }
  console.log(`✓ ${items.length} records, schema clean`);
  process.exit(0);
}

if (has("stats")) {
  const by = (key) => {
    const m = new Map();
    for (const i of items) m.set(i[key], (m.get(i[key]) ?? 0) + 1);
    return [...m].sort((a, b) => b[1] - a[1]).map(([k, n]) => `${k}=${n}`).join("  ");
  };
  const open = items.filter((i) => i.status === "open");
  console.log(`${items.length} records, ${open.length} open\n`);
  console.log(`  status      ${by("status")}`);
  console.log(`  severity    ${by("severity")}`);
  console.log(`  effort      ${by("effort")}`);
  console.log(`  area        ${by("area")}`);
  const tags = new Map();
  for (const i of items) for (const t of i.tags ?? []) tags.set(t, (tags.get(t) ?? 0) + 1);
  const hot = [...tags].filter(([, n]) => n > 1).sort((a, b) => b[1] - a[1]).slice(0, 12);
  console.log(`\n  repeated tags\n    ${hot.map(([t, n]) => `${t} (${n})`).join("\n    ")}`);
  process.exit(0);
}

const id = flag("id");
if (id) {
  const hit = items.find((i) => i.id.toLowerCase() === id.toLowerCase());
  if (!hit) {
    console.error(`no such id: ${id}`);
    process.exit(1);
  }
  console.log(full(hit));
  process.exit(0);
}

let list = items;
const tag = flag("tag");
if (tag) list = list.filter((i) => (i.tags ?? []).some((t) => t === tag || t.startsWith(tag + "/")));
for (const k of ["area", "severity", "status", "confidence", "source"]) {
  const v = flag(k);
  if (v) list = list.filter((i) => i[k] === v);
}

if (has("next")) {
  // Actual work only — notes and decisions are not fruit.
  list = list.filter((i) => i.status === "open" && i.severity !== "note");
  list.sort(bestValue);
  console.log(`${C.b}Low-hanging fruit${C.r} ${C.dim}(cheapest first; severity breaks ties)${C.r}\n`);
} else {
  list.sort(worstFirst);
}

if (list.length === 0) {
  console.log("nothing matches");
  process.exit(0);
}
console.log(list.map(line).join("\n"));
console.log(`\n${C.dim}${list.length} of ${items.length} records · --id BNNN for detail${C.r}`);
