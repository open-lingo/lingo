// stats-parse.mjs — pure parsing/aggregation logic for stats.mjs, ported
// from the lead's $S/briefs/TOOLS-aggregator.py (2026-09-18). Kept separate
// from stats.mjs (the CLI) so it can be unit-tested against small fixture
// arrays of already-parsed JSONL lines, no filesystem/large-transcript I/O.
const TEST_RE = /vitest|npx tsc|pytest|node --test|playwright/;
const SCRATCHPAD_RE = /\/private\/tmp\/\S+?\/scratchpad/;

function stripPrefix(cmd) {
  return cmd.replace(SCRATCHPAD_RE, "$S").replace(/\s+/g, " ").trim();
}

/** Fold one already-JSON.parsed transcript line into `acc`. Mutates + returns acc. */
export function foldLine(acc, d) {
  if (d?.timestamp) acc.ts.push(d.timestamp);
  const msg = d?.message && typeof d.message === "object" ? d.message : d;
  const content = msg?.content;
  if (!Array.isArray(content)) return acc;
  for (const b of content) {
    if (!b || typeof b !== "object") continue;
    if (b.type === "tool_use") {
      const n = b.name;
      acc.names.set(n, (acc.names.get(n) || 0) + 1);
      if (n === "Bash") {
        const raw = (b.input?.command || "").trim();
        const cmd = stripPrefix(raw).slice(0, 60);
        acc.cmds.set(cmd, (acc.cmds.get(cmd) || 0) + 1);
        if (TEST_RE.test(raw)) acc.testruns++;
      } else if (n === "Read" || n === "Grep" || n === "Glob") {
        const key = b.input?.file_path || b.input?.pattern || "";
        acc.reads.set(key, (acc.reads.get(key) || 0) + 1);
      }
    } else if (b.type === "tool_result") {
      if (JSON.stringify(b.content ?? "").length > 8000) acc.bigOut++;
    }
  }
  return acc;
}

export function newAcc() {
  return { names: new Map(), cmds: new Map(), reads: new Map(), ts: [], testruns: 0, bigOut: 0 };
}

/** Turn a folded accumulator into the printable summary fields. */
export function summarize(acc, label) {
  const calls = [...acc.names.values()].reduce((a, b) => a + b, 0);
  const dupReads = [...acc.reads.values()].reduce((a, v) => a + Math.max(0, v - 1), 0);
  const sortedTs = [...acc.ts].sort();
  const wallMin = sortedTs.length >= 2 ? (new Date(sortedTs.at(-1)) - new Date(sortedTs[0])) / 60000 : 0;
  const secPerCall = calls > 0 ? (wallMin * 60) / calls : 0;
  const topCmds = [...acc.cmds.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3).map(([c, n]) => `${n}x ${c}`);
  const byType = [...acc.names.entries()].sort((a, b) => b[1] - a[1]).map(([n, c]) => `${n}:${c}`).join(" ");
  return { label, calls, byType, tests: acc.testruns, big: acc.bigOut, dupReads, wallMin, secPerCall, topCmds };
}

export function formatRow(s) {
  return (
    `${s.label}: calls=${s.calls} [${s.byType}] tests=${s.tests} big=${s.big} ` +
    `dupReads=${s.dupReads} wall=${s.wallMin.toFixed(1)}min s/call=${s.secPerCall.toFixed(1)} ` +
    `top=[${s.topCmds.join(" | ")}]`
  );
}
