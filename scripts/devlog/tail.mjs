#!/usr/bin/env node
// Lane A11 (2026-09-17) — live tail of `artifacts/devlog/<device>.jsonl`,
// the JSONL files `src/shared/dev/remoteConsole.ts` streams to via the
// `/__devlog` dev-server middleware (`vite.config.ts`). One line in the
// file == one call to this script's pretty-printer; new lines land within
// 500ms of the client's own batch flush.
//
// Usage:
//   node scripts/devlog/tail.mjs                       # most-recently-modified device file
//   node scripts/devlog/tail.mjs ios-iPhone-a1b2        # a specific device
//   node scripts/devlog/tail.mjs --kind api             # filter to one record kind
//   node scripts/devlog/tail.mjs ios-iPhone-a1b2 --kind sync,reconcile
//
// `--kind` takes a comma-separated list of record kinds
// (console|error|api|session|sync|reconcile — see `DevLogKind` in
// remoteConsole.ts). Ctrl-C to stop; this only reads, never writes.

import fs from "node:fs";
import path from "node:path";

const DEVLOG_DIR = "artifacts/devlog";
const TAIL_LINES = 50;
const POLL_MS = 400;

function parseArgs(argv) {
  let device = null;
  let kinds = null;
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--kind") {
      kinds = (argv[++i] ?? "").split(",").map((s) => s.trim()).filter(Boolean);
    } else if (a.startsWith("--kind=")) {
      kinds = a.slice("--kind=".length).split(",").map((s) => s.trim()).filter(Boolean);
    } else if (!a.startsWith("-")) {
      device = a;
    }
  }
  return { device, kinds };
}

function listDeviceFiles() {
  if (!fs.existsSync(DEVLOG_DIR)) return [];
  return fs
    .readdirSync(DEVLOG_DIR)
    .filter((f) => f.endsWith(".jsonl"))
    .map((f) => ({ file: path.join(DEVLOG_DIR, f), mtime: fs.statSync(path.join(DEVLOG_DIR, f)).mtimeMs }));
}

function resolveFile(device) {
  if (device) {
    const file = path.join(DEVLOG_DIR, `${device}.jsonl`);
    if (!fs.existsSync(file)) {
      console.error(`no such devlog file: ${file}`);
      console.error(`known devices: ${listDeviceFiles().map((f) => path.basename(f.file, ".jsonl")).join(", ") || "(none — artifacts/devlog is empty or missing)"}`);
      process.exit(1);
    }
    return file;
  }
  const files = listDeviceFiles();
  if (files.length === 0) {
    console.error(`no devlog files under ${DEVLOG_DIR}/ — arm a client (localStorage["lingo:devlog"]="1" or VITE_DEVLOG=1) and reload it first.`);
    process.exit(1);
  }
  files.sort((a, b) => b.mtime - a.mtime);
  return files[0].file;
}

const KIND_COLOR = {
  console: "\x1b[37m",
  error: "\x1b[31m",
  api: "\x1b[36m",
  session: "\x1b[35m",
  sync: "\x1b[33m",
  reconcile: "\x1b[32m",
};
const RESET = "\x1b[0m";

/** Pure formatter — no I/O — exercised directly by `sync-timeline.test.mjs`-
 *  adjacent unit tests (`tail.test.mjs`) without touching the filesystem. */
export function formatDevlogLine(record) {
  const t = new Date(record.t ?? 0).toISOString().slice(11, 23);
  const kind = String(record.kind ?? "?");
  const color = KIND_COLOR[kind] ?? "";
  const { t: _t, device: _d, seq: _s, kind: _k, ...rest } = record;
  const detail = Object.entries(rest)
    .map(([k, v]) => `${k}=${typeof v === "string" ? v : JSON.stringify(v)}`)
    .join(" ");
  return `${color}${t} [${kind.padEnd(9)}] ${detail}${RESET}`;
}

export function parseJsonlLines(text) {
  const out = [];
  for (const line of text.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    try {
      out.push(JSON.parse(trimmed));
    } catch {
      /* skip a malformed line rather than crash the tail */
    }
  }
  return out;
}

async function main() {
  const { device, kinds } = parseArgs(process.argv.slice(2));
  const file = resolveFile(device);
  console.log(`tailing ${file}${kinds ? ` (kind: ${kinds.join(",")})` : ""} — Ctrl-C to stop`);

  const matchesKind = (r) => !kinds || kinds.includes(String(r.kind));

  let text = "";
  try {
    text = fs.readFileSync(file, "utf8");
  } catch {
    /* file may not exist yet if resolveFile raced a concurrent create */
  }
  let position = Buffer.byteLength(text, "utf8");
  const existing = parseJsonlLines(text).filter(matchesKind);
  for (const r of existing.slice(-TAIL_LINES)) console.log(formatDevlogLine(r));

  // Polling, not fs.watch: fs.watch's behavior on append-only files differs
  // across platforms (and this repo's own JSONL sinks — `/__sim/report` —
  // are read the same "poll a byte offset" way elsewhere), and 400ms is
  // well under the client's own 500ms flush interval, so nothing is missed.
  setInterval(() => {
    let stat;
    try {
      stat = fs.statSync(file);
    } catch {
      return; // file briefly missing between rotations — try again next tick
    }
    if (stat.size <= position) {
      if (stat.size < position) position = 0; // file was truncated/recreated
      return;
    }
    const fd = fs.openSync(file, "r");
    const length = stat.size - position;
    const buf = Buffer.alloc(length);
    fs.readSync(fd, buf, 0, length, position);
    fs.closeSync(fd);
    position = stat.size;
    for (const r of parseJsonlLines(buf.toString("utf8"))) {
      if (matchesKind(r)) console.log(formatDevlogLine(r));
    }
  }, POLL_MS);
}

if (process.argv[1] && import.meta.url === `file://${process.argv[1]}`) {
  await main();
}
