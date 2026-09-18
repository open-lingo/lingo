#!/usr/bin/env node
// scripts/lane/stats.mjs — the lead's aggregator (TOOLS-aggregator.py),
// productised. One line per transcript: tool calls by type, test/typecheck
// runs, results >8KB, duplicate reads, wall time, seconds/call, top Bash
// commands with the scratchpad prefix stripped. Streams line-by-line so a
// 100MB+ session transcript doesn't need to fit in memory at once.
import { createReadStream } from "node:fs";
import { createInterface } from "node:readline";
import path from "node:path";
import { foldLine, newAcc, summarize, formatRow } from "./lib/stats-parse.mjs";

function usage() {
  console.log(`usage: stats.mjs <transcript.jsonl>...

One line per transcript: calls by tool type, test/tsc run count, results
>8KB, duplicate Read/Grep/Glob targets, wall-clock minutes, seconds/call,
and the top 3 Bash commands (scratchpad path collapsed to "$S").`);
}

const files = process.argv.slice(2);
if (files.length === 0 || files.includes("-h") || files.includes("--help")) {
  usage();
  process.exit(files.length === 0 ? 2 : 0);
}

async function statOne(file) {
  const acc = newAcc();
  const rl = createInterface({ input: createReadStream(file, "utf8"), crlfDelay: Infinity });
  for await (const line of rl) {
    if (!line.trim()) continue;
    let d;
    try { d = JSON.parse(line); } catch { continue; }
    foldLine(acc, d);
  }
  return summarize(acc, path.basename(file));
}

for (const file of files) {
  try {
    console.log(formatRow(await statOne(file)));
  } catch (err) {
    console.log(`${path.basename(file)}: ERROR ${err.message}`);
  }
}
