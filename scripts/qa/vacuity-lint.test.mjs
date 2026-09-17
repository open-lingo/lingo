import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync, writeFileSync, mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { lint } from "./vacuity-lint.mjs";

/** Writes `content` at `<dir>/<rel>`, creating parent dirs as needed. */
function write(dir, rel, content) {
  const path = join(dir, rel);
  mkdirSync(join(path, ".."), { recursive: true });
  writeFileSync(path, content);
}

function withFixture(fn) {
  const dir = mkdtempSync(join(tmpdir(), "vacuity-lint-fixture-"));
  try {
    return fn(dir);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

test("lint: flags a for-of loop over a collector with no floor anywhere in the file", () => {
  withFixture((dir) => {
    write(
      dir,
      "a.test.ts",
      [
        'describe("x", () => {',
        '  it("y", () => {',
        "    const violations = [];",
        "    for (const item of getThings()) {",
        "      if (bad(item)) violations.push(item);",
        "    }",
        "    expect(violations).toEqual([]);",
        "  });",
        "});",
        "",
      ].join("\n"),
    );
    const { failures, missing } = lint(dir, ["a.test.ts"]);
    assert.equal(missing.length, 0);
    assert.equal(failures.length, 1);
    assert.equal(failures[0].rel, "a.test.ts");
    assert.equal(failures[0].lineNo, 4);
    assert.match(failures[0].line, /for \(const item of getThings\(\)\)/);
  });
});

test("lint: does NOT flag the same shape once a toBeGreaterThan(0) floor exists anywhere in the file", () => {
  withFixture((dir) => {
    write(
      dir,
      "a.test.ts",
      [
        'describe("x", () => {',
        '  it("y", () => {',
        "    const things = getThings();",
        "    expect(things.length).toBeGreaterThan(0);",
        "    const violations = [];",
        "    for (const item of things) {",
        "      if (bad(item)) violations.push(item);",
        "    }",
        "    expect(violations).toEqual([]);",
        "  });",
        "});",
        "",
      ].join("\n"),
    );
    const { failures } = lint(dir, ["a.test.ts"]);
    assert.equal(failures.length, 0);
  });
});

test("lint: does NOT flag it.each/for-of when silenced by a // vacuity: comment directly above", () => {
  withFixture((dir) => {
    write(
      dir,
      "a.test.ts",
      [
        'describe("x", () => {',
        "  // vacuity: SAMPLES is a hardcoded literal, cannot silently empty",
        "  it.each(SAMPLES)(\"z\", (s) => {",
        "    expect(s).toBeTruthy();",
        "  });",
        "});",
        "",
      ].join("\n"),
    );
    const { failures } = lint(dir, ["a.test.ts"]);
    assert.equal(failures.length, 0);
  });
});

test("lint: a suppression comment several lines above (a multi-line block) still silences", () => {
  withFixture((dir) => {
    write(
      dir,
      "a.test.ts",
      [
        'describe("x", () => {',
        "  // vacuity: SAMPLES is a hardcoded literal",
        "  // (multi-line explanation, the marker is on the first line)",
        "  // not the line directly above the flagged construct.",
        "  it.each(SAMPLES)(\"z\", (s) => {",
        "    expect(s).toBeTruthy();",
        "  });",
        "});",
        "",
      ].join("\n"),
    );
    const { failures } = lint(dir, ["a.test.ts"]);
    assert.equal(failures.length, 0);
  });
});

test("lint: a suppression comment does NOT reach across a non-comment line", () => {
  withFixture((dir) => {
    write(
      dir,
      "a.test.ts",
      [
        'describe("x", () => {',
        "  // vacuity: this explanation does not actually apply to the loop below",
        "  const unrelated = 1;",
        "  it.each(SAMPLES)(\"z\", (s) => {",
        "    expect(s).toBeTruthy();",
        "  });",
        "});",
        "",
      ].join("\n"),
    );
    const { failures } = lint(dir, ["a.test.ts"]);
    assert.equal(failures.length, 1);
  });
});

test("lint: reports a listed file that does not exist as `missing`, not a failure", () => {
  withFixture((dir) => {
    const { failures, missing } = lint(dir, ["nope.test.ts"]);
    assert.equal(failures.length, 0);
    assert.deepEqual(missing, ["nope.test.ts"]);
  });
});

test("lint: flags describe.each( the same way as for-of", () => {
  withFixture((dir) => {
    write(
      dir,
      "a.test.ts",
      [
        'describe.each(getAllLanguageIds())("language: %s", (id) => {',
        '  it("has an id", () => {',
        "    expect(id).toBeTruthy();",
        "  });",
        "});",
        "",
      ].join("\n"),
    );
    const { failures } = lint(dir, ["a.test.ts"]);
    assert.equal(failures.length, 1);
    assert.match(failures[0].line, /describe\.each\(getAllLanguageIds\(\)\)/);
  });
});

test("lint against the REAL gate-file list is clean (planted-failure companion — see below for the failing case)", () => {
  // Uses the exported GATE_FILES/ROOT defaults, i.e. the actual repo state
  // this lane left behind. If this ever goes red, either a fix regressed
  // (a floor was removed) or a new unguarded loop was added to one of the
  // audited files without a floor or a `// vacuity:` comment.
  const { failures, missing } = lint();
  assert.deepEqual(missing, [], "a GATE_FILES entry no longer exists — update the list");
  assert.deepEqual(
    failures.map((f) => `${f.rel}:${f.lineNo}`),
    [],
    "vacuity-lint found an unguarded collector loop in an audited gate file",
  );
});
