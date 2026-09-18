// Lane A11 (2026-09-17) — pure-function tests for tail.mjs's formatter and
// JSONL parser. Node's built-in test runner (see sim-capture.test.mjs's own
// doc comment for why `scripts/` uses `node --test`, not vitest).
//
//   node --test scripts/devlog/tail.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { formatDevlogLine, parseJsonlLines } from "./tail.mjs";

test("parseJsonlLines parses one object per non-blank line", () => {
  const text = '{"a":1}\n{"b":2}\n\n{"c":3}\n';
  const rows = parseJsonlLines(text);
  assert.deepEqual(rows, [{ a: 1 }, { b: 2 }, { c: 3 }]);
});

test("parseJsonlLines skips a malformed line instead of throwing", () => {
  const text = '{"a":1}\nnot json\n{"b":2}\n';
  const rows = parseJsonlLines(text);
  assert.deepEqual(rows, [{ a: 1 }, { b: 2 }]);
});

test("parseJsonlLines handles an empty file", () => {
  assert.deepEqual(parseJsonlLines(""), []);
});

test("formatDevlogLine renders the kind and every other field, but drops t/device/seq/kind from the detail string", () => {
  const line = formatDevlogLine({
    t: Date.UTC(2026, 8, 17, 3, 4, 5, 6),
    device: "ios-iPhone-a1b2",
    seq: 7,
    kind: "api",
    method: "GET",
    path: "/progress/me",
    status: 200,
  });
  // Strip ANSI color codes before asserting on content.
  // eslint-disable-next-line no-control-regex
  const plain = line.replace(/\x1b\[[0-9;]*m/g, "");
  assert.match(plain, /^03:04:05\.006 \[api\s+\]/);
  assert.match(plain, /method=GET/);
  assert.match(plain, /path=\/progress\/me/);
  assert.match(plain, /status=200/);
  assert.doesNotMatch(plain, /device=/);
  assert.doesNotMatch(plain, /seq=/);
});

test("formatDevlogLine never throws on a record missing every optional field", () => {
  assert.doesNotThrow(() => formatDevlogLine({}));
});

// ── Redaction contract (the constraint this whole lane exists under) ─────
//
// tail.mjs only formats what's already IN the JSONL file — the actual
// redaction happens client-side (`remoteConsole.ts`'s `redactingReplacer`)
// before a record is ever POSTed. This test pins the OTHER half of that
// contract from this side: even if a record somehow arrived with an
// `Authorization`-shaped field (a regression in the client, or a hand-
// crafted test fixture), the formatter must not special-case or unmask it
// — it just prints whatever string is there, so a redacted record STAYS
// redacted all the way to the terminal.
test("formatDevlogLine passes an already-redacted field through unchanged (does not un-redact)", () => {
  const line = formatDevlogLine({ t: 0, kind: "api", headers: "[redacted]" });
  const plain = line.replace(/\x1b\[[0-9;]*m/g, "");
  assert.match(plain, /headers=\[redacted\]/);
  assert.doesNotMatch(plain, /Bearer/);
});
