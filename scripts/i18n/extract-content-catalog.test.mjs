import test from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

// Integration-style tests (node:test, run directly: `node
// scripts/i18n/extract-content-catalog.test.mjs`). The extractor's whole
// point is walking the REAL compiled course content through the same Vite
// SSR boot the app itself uses (mirrors scripts/restamp-from-module.mjs) —
// there is no meaningful pure-function unit to isolate that wouldn't just
// re-mock away the thing being tested (whether the real m6 catalog is
// well-formed). So these spawn the actual CLI against a scratch --out dir
// and assert on its JSON output, per the rung-1a acceptance criteria: the
// m6 catalog is non-empty, anchors are unique, and re-running is
// deterministic.

const SCRIPT = fileURLToPath(new URL("./extract-content-catalog.mjs", import.meta.url));
const REPO_ROOT = fileURLToPath(new URL("../..", import.meta.url));

function run(args, outDir) {
  const result = spawnSync(
    process.execPath,
    [SCRIPT, ...args, "--out", outDir],
    { cwd: REPO_ROOT, encoding: "utf-8", timeout: 60_000 },
  );
  if (result.status !== 0) {
    throw new Error(
      `extract-content-catalog.mjs ${args.join(" ")} exited ${result.status}\nstdout: ${result.stdout}\nstderr: ${result.stderr}`,
    );
  }
  return result;
}

test("m6 catalog: non-empty, anchors unique, deterministic across two runs", (t) => {
  const outDir = mkdtempSync(join(tmpdir(), "extract-content-catalog-"));
  t.after(() => rmSync(outDir, { recursive: true, force: true }));

  run(["ja", "m6"], outDir);
  const catalogPath = join(outDir, "ja", "m6.en.json");
  const first = JSON.parse(readFileSync(catalogPath, "utf-8"));

  assert.ok(first.entries.length > 0, "m6 catalog should be non-empty");
  assert.equal(first.entryCount, first.entries.length);

  const anchors = first.entries.map((e) => e.anchor);
  assert.equal(
    new Set(anchors).size,
    anchors.length,
    "every anchor in the m6 catalog must be unique",
  );

  // Every entry needs a non-empty en string and a matching hash (schema
  // sanity — catches a broken hash function or an empty extracted string
  // slipping through the isGlossText guard).
  for (const e of first.entries) {
    assert.ok(e.en.trim().length > 0, `entry ${e.anchor} has empty en text`);
    assert.match(e.enSourceHash, /^[0-9a-f]{16}$/, `entry ${e.anchor} has a malformed hash`);
  }

  run(["ja", "m6"], outDir);
  const second = JSON.parse(readFileSync(catalogPath, "utf-8"));

  const stripVolatile = (catalog) => {
    const { generatedAt, ...rest } = catalog;
    return rest;
  };
  assert.deepEqual(
    stripVolatile(first),
    stripVolatile(second),
    "re-running the extractor on the same module must produce an identical catalog (minus generatedAt)",
  );
});

test("--check mode reports fresh/stale/missing against a synthetic ko catalog, without touching the en catalog", (t) => {
  const outDir = mkdtempSync(join(tmpdir(), "extract-content-catalog-check-"));
  t.after(() => rmSync(outDir, { recursive: true, force: true }));

  run(["ja", "m6"], outDir);
  const enPath = join(outDir, "ja", "m6.en.json");
  const en = JSON.parse(readFileSync(enPath, "utf-8"));
  const beforeCheck = readFileSync(enPath, "utf-8");

  const half = Math.floor(en.entries.length / 2);
  const koEntries = en.entries.slice(0, half).map((e) => ({
    anchor: e.anchor,
    ko: "STUB",
    enSourceHash: e.enSourceHash,
  }));
  const koPath = join(outDir, "ja", "m6.ko.json");
  writeFileSync(koPath, JSON.stringify({ moduleId: "m6", lang: "ja", entries: koEntries }));

  const result = run(["ja", "m6", "--check"], outDir);
  assert.match(result.stdout, /fresh \(ko matches current en\):\s+\d+/);
  assert.match(result.stdout, /missing \(no ko entry yet\):\s+\d+/);

  const afterCheck = readFileSync(enPath, "utf-8");
  assert.equal(beforeCheck, afterCheck, "--check must not rewrite the en catalog");
});

// Deliverable A (KO-source rung 1c, 2026-09-10): every entry carries a
// `kind` classification string, drawn from a fixed allowlist. These tests
// exercise one real case per kind — m1 (a hand-authored kana module) covers
// the kana-specific kinds (`romaji-label`, `mnemonic`, `atom-gloss`,
// `build-prompt`, `title`); m3 (an IR-compiled neo module) covers the
// prose-heavy kinds a kana module doesn't reach (`ja-gloss`, `mcq-option`,
// `explanation`, `instruction`). Together they prove the extractor's full
// kind enum is reachable through the real course content, not just
// unit-testable in isolation.
const ALL_KINDS = new Set([
  "atom-gloss",
  "romaji-label",
  "mnemonic",
  "build-prompt",
  "ja-gloss",
  "instruction",
  "explanation",
  "title",
  "mcq-option",
]);

test("every catalog entry carries a `kind` from the fixed allowlist (m1 + m3 combined cover all nine)", (t) => {
  const outDir = mkdtempSync(join(tmpdir(), "extract-content-catalog-kind-"));
  t.after(() => rmSync(outDir, { recursive: true, force: true }));

  run(["ja", "m1"], outDir);
  run(["ja", "m3"], outDir);
  const m1 = JSON.parse(readFileSync(join(outDir, "ja", "m1.en.json"), "utf-8"));
  const m3 = JSON.parse(readFileSync(join(outDir, "ja", "m3.en.json"), "utf-8"));

  const seenKinds = new Set();
  for (const e of [...m1.entries, ...m3.entries]) {
    assert.ok(
      ALL_KINDS.has(e.kind),
      `entry ${e.anchor} has kind "${e.kind}", not in the allowlist`,
    );
    seenKinds.add(e.kind);
  }

  // m1 (kana module): atom glosses, romaji-labeled match pairs / kana
  // symbol_to_sound options, symbol_intro mnemonic hints, build-sentence
  // prompts, lesson/step titles.
  const m1AtomGloss = m1.entries.find((e) => e.kind === "atom-gloss");
  assert.ok(m1AtomGloss, "expected at least one atom-gloss entry in m1");

  const m1Romaji = m1.entries.find((e) => e.kind === "romaji-label");
  assert.ok(m1Romaji, "expected at least one romaji-label entry in m1 (kana match-pairs/symbol_to_sound)");

  const m1Mnemonic = m1.entries.find((e) => e.kind === "mnemonic");
  assert.ok(m1Mnemonic, "expected at least one mnemonic entry in m1 (symbol_intro hint)");
  assert.match(m1Mnemonic.anchor, /^m1\/symbolIntro:.+\/hint$/, "mnemonic anchor shape");

  const m1Build = m1.entries.find((e) => e.kind === "build-prompt");
  assert.ok(m1Build, "expected at least one build-prompt entry in m1");

  const m1Title = m1.entries.find((e) => e.kind === "title");
  assert.ok(m1Title, "expected at least one title entry in m1");

  // m3 (IR-compiled neo module): JA-anchored glosses, MCQ options,
  // grammar-rule/body/cultureNote-style explanation prose, plain
  // UI-instruction text.
  const m3JaGloss = m3.entries.find((e) => e.kind === "ja-gloss");
  assert.ok(m3JaGloss, "expected at least one ja-gloss entry in m3");

  const m3McqOption = m3.entries.find((e) => e.kind === "mcq-option");
  assert.ok(m3McqOption, "expected at least one mcq-option entry in m3");

  const m3Explanation = m3.entries.find((e) => e.kind === "explanation");
  assert.ok(m3Explanation, "expected at least one explanation entry in m3");

  const m3Instruction = m3.entries.find((e) => e.kind === "instruction");
  assert.ok(m3Instruction, "expected at least one instruction entry in m3");

  assert.deepEqual(
    [...seenKinds].sort(),
    [...ALL_KINDS].sort(),
    "m1 + m3 together should exercise every kind in the allowlist",
  );
});

test("romaji-label classification is exact-match-verified against KANA_ROMAJI, not just ASCII-shaped", (t) => {
  const outDir = mkdtempSync(join(tmpdir(), "extract-content-catalog-romaji-"));
  t.after(() => rmSync(outDir, { recursive: true, force: true }));

  // m3 has kana→English-MEANING match_pairs steps (not romaji-labeled) —
  // proves the classifier isn't fooled by ASCII-only target text into
  // mislabeling a real gloss as a romaji label.
  run(["ja", "m3"], outDir);
  const m3 = JSON.parse(readFileSync(join(outDir, "ja", "m3.en.json"), "utf-8"));
  const asciiMeaningGloss = m3.entries.find(
    (e) => e.kind === "ja-gloss" && /^[\x00-\x7F]*$/.test(e.en),
  );
  assert.ok(
    asciiMeaningGloss,
    "expected at least one ASCII-only ja-gloss entry in m3 (an English meaning target on a match_pairs step, correctly NOT classified as romaji-label)",
  );
});
