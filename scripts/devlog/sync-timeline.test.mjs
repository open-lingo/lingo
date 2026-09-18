// Lane A11 (2026-09-17) — pure-function tests for sync-timeline.mjs's
// filter/merge/format logic. Node's built-in test runner (see
// sim-capture.test.mjs's doc comment for why `scripts/` uses `node --test`).
//
//   node --test scripts/devlog/sync-timeline.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { isSyncRelevant, mergeDeviceRecords, formatTimelineTable } from "./sync-timeline.mjs";

test("isSyncRelevant keeps every sync and reconcile record", () => {
  assert.equal(isSyncRelevant({ kind: "sync", phase: "enqueued" }), true);
  assert.equal(isSyncRelevant({ kind: "reconcile", status: "queued" }), true);
});

test("isSyncRelevant keeps api records on progress/srs/boot paths, drops everything else", () => {
  assert.equal(isSyncRelevant({ kind: "api", path: "/api/core/v1/progress/me" }), true);
  assert.equal(isSyncRelevant({ kind: "api", path: "/api/core/v1/srs/sync" }), true);
  assert.equal(isSyncRelevant({ kind: "api", path: "/boot" }), true);
  assert.equal(isSyncRelevant({ kind: "api", path: "/api/core/v1/social/feed" }), false);
  assert.equal(isSyncRelevant({ kind: "console", msg: "hello" }), false);
  assert.equal(isSyncRelevant({ kind: "error", message: "boom" }), false);
});

test("isSyncRelevant is case-insensitive and does not false-positive on a substring like 'inprogress'", () => {
  assert.equal(isSyncRelevant({ kind: "api", path: "/API/PROGRESS/me" }), true);
  assert.equal(isSyncRelevant({ kind: "api", path: "/api/inprogressive/x" }), false);
});

test("mergeDeviceRecords sorts by time then seq across BOTH devices, filtering out irrelevant kinds", () => {
  const devices = [
    {
      device: "ios-iPhone-aaaa",
      records: [
        { t: 100, seq: 0, kind: "sync", phase: "enqueued", queueDepth: 1 },
        { t: 300, seq: 1, kind: "console", msg: "noise, should be dropped" },
      ],
    },
    {
      device: "ios-iPad-bbbb",
      records: [
        { t: 200, seq: 0, kind: "reconcile", source: "reconcile", status: "queued", queued: 3, posted: 0 },
        { t: 100, seq: 1, kind: "api", path: "/progress/me", method: "GET", status: 200 },
      ],
    },
  ];
  const rows = mergeDeviceRecords(devices);
  assert.equal(rows.length, 3); // the console row is dropped
  assert.deepEqual(
    rows.map((r) => `${r.device}:${r.t}:${r.seq}`),
    ["ios-iPhone-aaaa:100:0", "ios-iPad-bbbb:100:1", "ios-iPad-bbbb:200:0"],
  );
});

test("mergeDeviceRecords keeps a record's own `device` field over the file it came from, if set", () => {
  const devices = [{ device: "fallback-name", records: [{ t: 1, seq: 0, kind: "sync", phase: "enqueued", queueDepth: 1, device: "explicit-name" }] }];
  const rows = mergeDeviceRecords(devices);
  assert.equal(rows[0].device, "explicit-name");
});

test("formatTimelineTable reports 'no records' for an empty merge instead of an empty/broken table", () => {
  assert.equal(formatTimelineTable([]), "(no progress/SRS sync records found)");
});

test("formatTimelineTable includes the request id column when a row has one, and a placeholder when it doesn't", () => {
  const out = formatTimelineTable([
    { t: 0, device: "ios-iPhone-aaaa", kind: "api", method: "POST", path: "/srs/sync", status: 200, ok: true, ms: 42, reqBytes: 120, resBytes: 80, requestId: "req-abc123" },
    { t: 1, device: "ios-iPad-bbbb", kind: "reconcile", source: "pull-ignoring-reset", localCount: 12, serverCount: 4 },
  ]);
  assert.match(out, /req-abc123/);
  assert.match(out, /-/); // placeholder for the row with no requestId
  assert.match(out, /PULL \(ignore reset\): local=12 server=4/);
  assert.match(out, /POST \/srs\/sync → 200/);
});

test("formatTimelineTable never throws formatting a batch_error sync row", () => {
  assert.doesNotThrow(() =>
    formatTimelineTable([{ t: 0, device: "d", kind: "sync", phase: "batch_error", batchSize: 5, message: "network down", anyLanded: false }]),
  );
});
