import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync, writeFileSync, mkdirSync, readFileSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { applyMutation, runEntry } from "./gate-mutations.mjs";

function withFixture(fn) {
  const dir = mkdtempSync(join(tmpdir(), "gate-mutations-fixture-"));
  try {
    return fn(dir);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

/** A fake "gate": a JS file exporting a threshold, plus a node script that
 *  reads it and exits non-zero if the threshold is below 3. Standing in for
 *  a real content/IR file + vitest gate without touching the real repo. */
function writeFakeGate(dir, threshold) {
  writeFileSync(join(dir, "fake-content.mjs"), `export const THRESHOLD = ${threshold};\n`);
  writeFileSync(
    join(dir, "fake-gate.mjs"),
    [
      "import { THRESHOLD } from './fake-content.mjs';",
      "if (THRESHOLD < 3) { console.error('fake-gate: THRESHOLD too low:', THRESHOLD); process.exit(1); }",
      "console.log('fake-gate: ok, THRESHOLD =', THRESHOLD);",
      "process.exit(0);",
      "",
    ].join("\n"),
  );
}

test("applyMutation(edit): mutates the file, restore() puts back the exact original bytes", () => {
  withFixture((dir) => {
    writeFakeGate(dir, 5);
    const path = join(dir, "fake-content.mjs");
    const original = readFileSync(path, "utf8");

    const restore = applyMutation(dir, {
      kind: "edit",
      file: "fake-content.mjs",
      find: "THRESHOLD = 5",
      replace: "THRESHOLD = 0",
    });
    assert.match(readFileSync(path, "utf8"), /THRESHOLD = 0/);

    restore();
    assert.equal(readFileSync(path, "utf8"), original);
  });
});

test("applyMutation(edit): throws (and touches nothing) when the find-string is absent", () => {
  withFixture((dir) => {
    writeFakeGate(dir, 5);
    const path = join(dir, "fake-content.mjs");
    const original = readFileSync(path, "utf8");
    assert.throws(() => applyMutation(dir, { kind: "edit", file: "fake-content.mjs", find: "NOT PRESENT", replace: "x" }));
    assert.equal(readFileSync(path, "utf8"), original, "file must be untouched when the mutation could not be applied");
  });
});

test("applyMutation(env): sets and restores an env var, including one that was previously unset", () => {
  const key = "GATE_MUTATIONS_TEST_VAR";
  delete process.env[key];
  const restore = applyMutation("/unused", { kind: "env", key, value: "mutated" });
  assert.equal(process.env[key], "mutated");
  restore();
  assert.equal(key in process.env, false, "restore must delete a var that did not exist before");
});

test("applyMutation(env): restores the PREVIOUS value when the var was already set", () => {
  const key = "GATE_MUTATIONS_TEST_VAR2";
  process.env[key] = "original";
  const restore = applyMutation("/unused", { kind: "env", key, value: "mutated" });
  assert.equal(process.env[key], "mutated");
  restore();
  assert.equal(process.env[key], "original");
  delete process.env[key];
});

test("applyMutation(rename): renames the file, restore() puts it back at the original path", () => {
  withFixture((dir) => {
    writeFileSync(join(dir, "baseline.json"), '{"ok":true}');
    const restore = applyMutation(dir, { kind: "rename", from: "baseline.json", to: "baseline.json.hidden" });
    assert.equal(existsSync(join(dir, "baseline.json")), false);
    assert.equal(existsSync(join(dir, "baseline.json.hidden")), true);
    restore();
    assert.equal(existsSync(join(dir, "baseline.json")), true);
    assert.equal(existsSync(join(dir, "baseline.json.hidden")), false);
  });
});

test("applyMutation(rename): throws when the destination already exists (refuses to clobber)", () => {
  withFixture((dir) => {
    writeFileSync(join(dir, "a.json"), "{}");
    writeFileSync(join(dir, "b.json"), "{}");
    assert.throws(() => applyMutation(dir, { kind: "rename", from: "a.json", to: "b.json" }));
    // both files still present, untouched
    assert.equal(existsSync(join(dir, "a.json")), true);
    assert.equal(existsSync(join(dir, "b.json")), true);
  });
});

test("runEntry: CAUGHT — a fake gate that goes red under its planted mutation, then the tree is restored", () => {
  withFixture((dir) => {
    writeFakeGate(dir, 5);
    const original = readFileSync(join(dir, "fake-content.mjs"), "utf8");
    const entry = {
      gate: "fake-gate",
      testCmd: "node fake-gate.mjs",
      mutation: { kind: "edit", file: "fake-content.mjs", find: "THRESHOLD = 5", replace: "THRESHOLD = 0" },
      expect: "fail",
    };
    const row = runEntry(entry, { root: dir });
    assert.equal(row.result, "CAUGHT");
    assert.equal(readFileSync(join(dir, "fake-content.mjs"), "utf8"), original, "tree must be restored after the run");
  });
});

test("runEntry: MISSED — a fake gate whose mutation does NOT flip it (the vacuous case)", () => {
  withFixture((dir) => {
    writeFakeGate(dir, 5);
    const entry = {
      gate: "fake-gate-vacuous",
      testCmd: "node fake-gate.mjs",
      // Mutates a field the gate never reads — the vacuous shape this whole
      // tool exists to catch.
      mutation: { kind: "edit", file: "fake-content.mjs", find: "THRESHOLD = 5", replace: "THRESHOLD = 5 // unused rename" },
      expect: "fail",
    };
    const row = runEntry(entry, { root: dir });
    assert.equal(row.result, "MISSED");
    assert.match(row.detail, /stayed green/);
  });
});

test("runEntry: ERROR — baseline (unmutated) gate is already red, so the mutation proves nothing", () => {
  withFixture((dir) => {
    writeFakeGate(dir, 1); // already below threshold — gate is red before any mutation
    const entry = {
      gate: "fake-gate-already-red",
      testCmd: "node fake-gate.mjs",
      mutation: { kind: "edit", file: "fake-content.mjs", find: "THRESHOLD = 1", replace: "THRESHOLD = 0" },
      expect: "fail",
    };
    const row = runEntry(entry, { root: dir });
    assert.equal(row.result, "ERROR");
    assert.match(row.detail, /baseline/);
  });
});

test("runEntry: ERROR — mutation cannot be applied (bad find string), tree untouched", () => {
  withFixture((dir) => {
    writeFakeGate(dir, 5);
    const original = readFileSync(join(dir, "fake-content.mjs"), "utf8");
    const entry = {
      gate: "fake-gate-bad-mutation",
      testCmd: "node fake-gate.mjs",
      mutation: { kind: "edit", file: "fake-content.mjs", find: "NOPE NOT THERE", replace: "x" },
      expect: "fail",
    };
    const row = runEntry(entry, { root: dir });
    assert.equal(row.result, "ERROR");
    assert.equal(readFileSync(join(dir, "fake-content.mjs"), "utf8"), original);
  });
});

test("runEntry: --skip-baseline honored — skips the pre-mutation sanity pass", () => {
  withFixture((dir) => {
    writeFakeGate(dir, 1); // would be ERROR under a baseline check
    const entry = {
      gate: "fake-gate-skip-baseline",
      testCmd: "node fake-gate.mjs",
      mutation: { kind: "edit", file: "fake-content.mjs", find: "THRESHOLD = 1", replace: "THRESHOLD = 0" },
      expect: "fail",
    };
    const row = runEntry(entry, { root: dir, skipBaseline: true });
    // both THRESHOLD=1 and THRESHOLD=0 fail the fake gate (< 3), so with no
    // baseline check this reads as CAUGHT even though the "before" state
    // was already red — this test exists to document that skip-baseline
    // trades proof for speed, not to endorse using it by default.
    assert.equal(row.result, "CAUGHT");
  });
});
