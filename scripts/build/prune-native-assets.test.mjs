import test from "node:test";
import assert from "node:assert/strict";
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { pruneNativeAssets } from "./prune-native-assets.mjs";

/** Build a scratch `dist/`-shaped fixture; returns its path. */
function makeDist(t, { assets = {}, dict = {} } = {}) {
  const distDir = mkdtempSync(join(tmpdir(), "prune-native-assets-"));
  t.after(() => rmSync(distDir, { recursive: true, force: true }));

  const assetsDir = join(distDir, "assets");
  mkdirSync(assetsDir, { recursive: true });
  for (const [name, bytes] of Object.entries(assets)) {
    writeFileSync(join(assetsDir, name), bytes);
  }

  if (Object.keys(dict).length > 0) {
    const dictDir = join(distDir, "dict");
    mkdirSync(dictDir, { recursive: true });
    for (const [name, bytes] of Object.entries(dict)) {
      writeFileSync(join(dictDir, name), bytes);
    }
  }

  return distDir;
}

test("no CDN base configured (mirrors a normal `npm run build`, or a native build before the CDN dict is published): dict is KEPT, no throw", (t) => {
  const distDir = makeDist(t, {
    assets: { "index-abc123.js": "console.log(1)" },
    dict: { "base.dat.gz": "x".repeat(1000) },
  });

  const report = pruneNativeAssets({ distDir, assetBaseUrl: "" });

  assert.deepEqual(report.whisperArtifactsFound, []);
  assert.equal(report.dictPruned, false);
  assert.equal(report.dictBytesReclaimed, 0);
  assert.equal(existsSync(join(distDir, "dict", "base.dat.gz")), true);
});

test("CDN base configured: dict is pruned and byte count is reported", (t) => {
  const distDir = makeDist(t, {
    assets: { "index-abc123.js": "console.log(1)" },
    dict: {
      "base.dat.gz": "x".repeat(1000),
      "check.dat.gz": "y".repeat(500),
    },
  });

  const report = pruneNativeAssets({
    distDir,
    assetBaseUrl: "https://app.openlingoapp.com",
  });

  assert.equal(report.dictPruned, true);
  assert.equal(report.dictBytesReclaimed, 1500);
  assert.equal(existsSync(join(distDir, "dict")), false);
  // Unrelated assets are untouched.
  assert.equal(existsSync(join(distDir, "assets", "index-abc123.js")), true);
});

test("no dict directory at all: no-op, no throw (e.g. a build that never had one)", (t) => {
  const distDir = makeDist(t, {
    assets: { "index-abc123.js": "console.log(1)" },
  });

  const report = pruneNativeAssets({
    distDir,
    assetBaseUrl: "https://app.openlingoapp.com",
  });

  assert.equal(report.dictPruned, false);
  assert.equal(report.dictBytesReclaimed, 0);
});

test("Whisper/ONNX artifact present under dist/assets throws (regression guard for the native-mode alias)", (t) => {
  const distDir = makeDist(t, {
    assets: {
      "ort-wasm-simd-threaded.asyncify-abc123.wasm": "binary",
      "index-abc123.js": "console.log(1)",
    },
    dict: { "base.dat.gz": "x".repeat(1000) },
  });

  assert.throws(
    () => pruneNativeAssets({ distDir, assetBaseUrl: "https://app.openlingoapp.com" }),
    /Whisper\/ONNX artifact/,
  );
  // The throw happens before the dict prune — dict must be left untouched.
  assert.equal(existsSync(join(distDir, "dict", "base.dat.gz")), true);
});

test("each Whisper/ONNX filename pattern is individually caught", (t) => {
  const names = [
    "ort-wasm-simd-threaded.asyncify-xyz.wasm",
    "onnxruntime-web-abc.js",
    "whisper-worker-def.js",
    "transformers.web-ghi.js",
  ];
  for (const name of names) {
    const distDir = makeDist(t, { assets: { [name]: "x" } });
    assert.throws(
      () => pruneNativeAssets({ distDir, assetBaseUrl: "" }),
      /Whisper\/ONNX artifact/,
      `expected ${name} to trip the regression guard`,
    );
  }
});

test("a filename that merely mentions Whisper in prose (not a build artifact) does not false-positive", (t) => {
  // Sanity check on the pattern list itself: ordinary app chunks that
  // happen to contain unrelated substrings should NOT trip the guard.
  const distDir = makeDist(t, {
    assets: { "SpeakingStepView-abc123.js": "// mentions whisper in a comment" },
  });
  const report = pruneNativeAssets({ distDir, assetBaseUrl: "" });
  assert.deepEqual(report.whisperArtifactsFound, []);
});
