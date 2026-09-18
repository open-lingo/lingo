// stats.test.mjs — exercises lib/stats-parse.mjs (the aggregator, ported
// from $S/briefs/TOOLS-aggregator.py) against small fixture transcript
// lines, no real (multi-MB) transcript file required.
import { test } from "node:test";
import assert from "node:assert/strict";
import { foldLine, newAcc, summarize, formatRow } from "./lib/stats-parse.mjs";

function bashCall(command) {
  return { message: { role: "assistant", content: [{ type: "tool_use", name: "Bash", input: { command } }] } };
}
function toolResult(bytes) {
  return { message: { role: "user", content: [{ type: "tool_result", content: "x".repeat(bytes) }] } };
}

test("foldLine counts tool_use by name and flags a vitest Bash call as a test run", () => {
  const acc = newAcc();
  foldLine(acc, { timestamp: "2026-09-18T00:00:00Z" });
  foldLine(acc, bashCall("npx vitest run src/foo.test.ts"));
  foldLine(acc, { timestamp: "2026-09-18T00:01:00Z" });
  const s = summarize(acc, "lane");
  assert.equal(s.calls, 1);
  assert.equal(s.tests, 1);
  assert.match(s.wallMin.toFixed(0), /^1$/);
});

test("foldLine strips the scratchpad prefix from Bash commands", () => {
  const acc = newAcc();
  foldLine(acc, bashCall("cat /private/tmp/claude-501/-Users-x-y/abc123/scratchpad/briefs/TOOLS.md"));
  assert.ok([...acc.cmds.keys()][0].startsWith("cat $S/briefs/TOOLS.md"));
});

test("foldLine counts a tool_result over 8KB as big, and a small one as not", () => {
  const acc = newAcc();
  foldLine(acc, toolResult(9000));
  foldLine(acc, toolResult(10));
  assert.equal(acc.bigOut, 1);
});

test("summarize counts duplicate Read/Grep/Glob targets", () => {
  const acc = newAcc();
  const read = (p) => ({ message: { content: [{ type: "tool_use", name: "Read", input: { file_path: p } }] } });
  foldLine(acc, read("src/a.ts"));
  foldLine(acc, read("src/a.ts"));
  foldLine(acc, read("src/b.ts"));
  const s = summarize(acc, "lane");
  assert.equal(s.dupReads, 1);
});

test("formatRow produces one line with the expected fields", () => {
  const acc = newAcc();
  foldLine(acc, bashCall("echo hi"));
  const line = formatRow(summarize(acc, "mylane.jsonl"));
  assert.ok(line.startsWith("mylane.jsonl: calls=1"));
  assert.ok(!line.includes("\n"));
});
