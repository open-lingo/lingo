import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { emitContentPacks, BUNDLED_MODULE_COUNT, PACK_SCHEMA_VERSION } from "./emit-content-packs.mjs";

function sha256Hex(s) {
  return createHash("sha256").update(s).digest("hex");
}

/**
 * Build a scratch `dist/content/v1`-shaped fixture with `moduleCount`
 * modules for one language ("ja"), matching `emitContent.test.ts`'s real
 * output shape closely enough for this script's purposes.
 */
function makeDist(t, moduleCount, { version = "abc1234567" } = {}) {
  // One unique parent per test, distDir nested one level inside it — so
  // the native branch's sibling-of-distDir `dist-content-packs/` output
  // also lands under this same unique-per-test parent and gets cleaned up
  // with it, instead of colliding at a shared `<tmpdir>/dist-content-packs`
  // across every test run.
  const parent = mkdtempSync(join(tmpdir(), "emit-content-packs-"));
  t.after(() => rmSync(parent, { recursive: true, force: true }));
  const distDir = join(parent, "dist");
  mkdirSync(distDir, { recursive: true });

  const v1Dir = join(distDir, "content", "v1");
  const jaDir = join(v1Dir, "ja");
  mkdirSync(jaDir, { recursive: true });

  const modules = [];
  for (let i = 1; i <= moduleCount; i++) {
    const file = `ja/m${i}.${String(i).padStart(10, "0")}.json`;
    const body = JSON.stringify({ lessons: [{ id: `ja-m${i}-l1`, steps: [] }] });
    writeFileSync(join(distDir, "content", "v1", file), body);
    modules.push({ id: `m${i}`, file, lessons: [`ja-m${i}-l1`] });
  }
  // A course-map index file that must never be touched.
  writeFileSync(join(jaDir, "index.deadbeef01.json"), JSON.stringify([{ id: "m1" }]));

  const manifest = {
    schema: 1,
    version,
    generatedAt: new Date().toISOString(),
    languages: { ja: { modules, index: "ja/index.deadbeef01.json" } },
  };
  writeFileSync(join(v1Dir, "manifest.json"), JSON.stringify(manifest));
  return distDir;
}

test("flag OFF: complete no-op, dist untouched byte-for-byte", (t) => {
  const distDir = makeDist(t, 5);
  const before = readFileSync(join(distDir, "content/v1/manifest.json"), "utf8");

  const report = emitContentPacks({ distDir, packsEnabled: false });

  assert.equal(report.packsEnabled, false);
  assert.match(report.skippedReason, /flag is off/);
  assert.equal(report.v1BytesBefore, report.v1BytesAfter);
  assert.equal(readFileSync(join(distDir, "content/v1/manifest.json"), "utf8"), before);
  assert.equal(existsSync(join(distDir, "content/v2")), false);
  for (let i = 1; i <= 5; i++) {
    assert.equal(existsSync(join(distDir, "content/v1", `ja/m${i}.${String(i).padStart(10, "0")}.json`)), true);
  }
});

test("no dist/content/v1/manifest.json: no-op, reports why, does not throw", (t) => {
  const distDir = mkdtempSync(join(tmpdir(), "emit-content-packs-empty-"));
  t.after(() => rmSync(distDir, { recursive: true, force: true }));

  const report = emitContentPacks({ distDir, packsEnabled: true });
  assert.match(report.skippedReason, /not found/);
});

test("flag ON, more modules than the bundled slice: modules 4+ are packed to v2 and pruned from v1; 1-3 stay bundled", (t) => {
  const distDir = makeDist(t, 6);

  const report = emitContentPacks({ distDir, packsEnabled: true });

  assert.equal(report.languages.ja.bundledThrough, BUNDLED_MODULE_COUNT);
  assert.equal(report.languages.ja.packedModules, 3); // modules 4,5,6

  // Modules 1-3 still physically present in dist/content/v1.
  for (let i = 1; i <= 3; i++) {
    assert.equal(
      existsSync(join(distDir, "content/v1", `ja/m${i}.${String(i).padStart(10, "0")}.json`)),
      true,
      `module ${i} should stay bundled`,
    );
  }
  // Modules 4-6 pruned from dist/content/v1.
  for (let i = 4; i <= 6; i++) {
    assert.equal(
      existsSync(join(distDir, "content/v1", `ja/m${i}.${String(i).padStart(10, "0")}.json`)),
      false,
      `module ${i} should be pruned from the bundle`,
    );
  }
  // index.json (course map) is NEVER touched.
  assert.equal(existsSync(join(distDir, "content/v1/ja/index.deadbeef01.json")), true);

  // v1 manifest.json gained packBundledThrough for ja.
  const manifest = JSON.parse(readFileSync(join(distDir, "content/v1/manifest.json"), "utf8"));
  assert.equal(manifest.languages.ja.packBundledThrough, 3);

  // v2 pack tree exists, keyed by the SAME contentVersion as v1's manifest.version.
  const packDir = join(distDir, "content/v2", manifest.version, "ja");
  assert.equal(existsSync(packDir), true);
  const packManifest = JSON.parse(readFileSync(join(packDir, "manifest.json"), "utf8"));
  assert.equal(packManifest.schemaVersion, PACK_SCHEMA_VERSION);
  assert.equal(packManifest.contentVersion, manifest.version);
  assert.equal(packManifest.modules.length, 3);
  assert.deepEqual(
    packManifest.modules.map((m) => m.id),
    ["m4", "m5", "m6"],
  );

  // Bundled modules 1-3 NEVER appear anywhere under v2 — the structural
  // guarantee that a pack can never override a bundled module.
  for (const m of packManifest.modules) {
    assert.notEqual(m.id, "m1");
    assert.notEqual(m.id, "m2");
    assert.notEqual(m.id, "m3");
  }

  // Every packed file's sha256 matches its actual on-disk bytes.
  for (const [filename, meta] of Object.entries(packManifest.files)) {
    const bytes = readFileSync(join(packDir, filename));
    assert.equal(sha256Hex(bytes), meta.sha256);
    assert.equal(bytes.length, meta.bytes);
  }
});

test("flag ON, course has exactly the bundled-slice count (3 modules): nothing to pack, but the marker is still set", (t) => {
  const distDir = makeDist(t, 3);
  const report = emitContentPacks({ distDir, packsEnabled: true });

  assert.equal(report.languages.ja.packedModules, 0);
  assert.equal(existsSync(join(distDir, "content/v2")), false);
  const manifest = JSON.parse(readFileSync(join(distDir, "content/v1/manifest.json"), "utf8"));
  assert.equal(manifest.languages.ja.packBundledThrough, 3);
  // All 3 modules still present.
  for (let i = 1; i <= 3; i++) {
    assert.equal(existsSync(join(distDir, "content/v1", `ja/m${i}.${String(i).padStart(10, "0")}.json`)), true);
  }
});

test("flag ON, course shorter than the bundled slice (1 module): no crash, bundledThrough clamps to module count", (t) => {
  const distDir = makeDist(t, 1);
  const report = emitContentPacks({ distDir, packsEnabled: true });

  assert.equal(report.languages.ja.bundledThrough, 1);
  assert.equal(report.languages.ja.packedModules, 0);
});

test("native: true writes the pack tree OUTSIDE dist/ (a sibling `dist-content-packs/`), never under dist/content/v2 — `cap sync` must not bundle it into the IPA/APK", (t) => {
  const distDir = makeDist(t, 6);
  const report = emitContentPacks({ distDir, packsEnabled: true, native: true });

  assert.equal(existsSync(join(distDir, "content/v2")), false);
  const manifest = JSON.parse(readFileSync(join(distDir, "content/v1/manifest.json"), "utf8"));
  const packDir = join(distDir, "..", "dist-content-packs", manifest.version, "ja");
  assert.equal(existsSync(packDir), true);
  assert.equal(existsSync(join(packDir, "manifest.json")), true);
  // Bundled modules 1-3 still pruned from dist/content/v1 exactly as on web.
  for (let i = 4; i <= 6; i++) {
    assert.equal(existsSync(join(distDir, "content/v1", `ja/m${i}.${String(i).padStart(10, "0")}.json`)), false);
  }
});

test("native: true, but an explicit packOutputDir overrides the default sibling directory", (t) => {
  const distDir = makeDist(t, 6);
  const customDir = mkdtempSync(join(tmpdir(), "custom-pack-output-"));
  t.after(() => rmSync(customDir, { recursive: true, force: true }));

  const report = emitContentPacks({ distDir, packsEnabled: true, native: true, packOutputDir: customDir });
  assert.equal(report.packOutputDir, customDir);
  const manifest = JSON.parse(readFileSync(join(distDir, "content/v1/manifest.json"), "utf8"));
  assert.equal(existsSync(join(customDir, manifest.version, "ja", "manifest.json")), true);
});
