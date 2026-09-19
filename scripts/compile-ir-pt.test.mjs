// compile-ir-pt.test.mjs — fragment-merge behavior of compile-ir-pt.mjs.
//
// These tests spawn the real CLI (it isn't a library — everything happens
// as a script with side effects) against throwaway fixture modules named
// `_smoke*`, exactly the convention the compiler's own header comment
// documents: `_smoke` is a module name `MOD_RE` accepts without claiming a
// real `mN` a content lane owns. Fixture source files are written under the
// real `curriculum/ir/` directory (the compiler has no input-dir override)
// and always removed again in `after`, including on failure, so nothing is
// left for an authoring lane's `m1*` files to collide with.
import test from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdirSync, rmSync, writeFileSync, readFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "..");
const irDir = join(root, "src/features/languages/pt/curriculum/ir");
const compiler = join(here, "compile-ir-pt.mjs");

/** One INFO-only lesson fragment (never the module's last lesson). */
const infoLessonFragment = (n, title, atomSurface, atomGloss) => `
lesson:
  n: ${n}
  template: free
  title: "${title}"
  description: "Smoke fixture lesson ${n}"
  steps:
    - kind: info
      title: "Intro ${n}"
      body: "Smoke body ${n}"
atoms:
  - surface: "${atomSurface}"
    meaningEn: "${atomGloss}"
    partOfSpeech: "other"
    kind: "vocab"
`;

/** One SIM-ending lesson fragment (satisfies "last lesson ends in sim"). */
const simLessonFragment = (n, title) => `
lesson:
  n: ${n}
  template: free
  title: "${title}"
  description: "Smoke fixture mastery lesson ${n}"
  steps:
    - kind: sim
      scene:
        emoji: "🎬"
        title: "Smoke scene"
      turns:
        - id: t1
          npc:
            speaker: "Ana"
            pt: "Oi!"
            gloss: "Hi!"
          goal: "Reply hi"
          reply:
            mode: build
            tiles: ["Oi"]
            answer: "Oi"
`;

/** A bare module header — no inline lessons/atoms, all of it via fragments. */
const moduleHeader = (mod, expectedLessonCount, checkpoint) => `
module: ${mod}
title: "Smoke Test Module"
expectedLessonCount: ${expectedLessonCount}
checkpoint: ${checkpoint}
`;

function writeFrag(mod, name, contents) {
  const dir = join(irDir, mod);
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, name), contents);
}

function writeModule(mod, contents) {
  writeFileSync(join(irDir, `${mod}.ir.yaml`), contents);
}

function cleanup(mod) {
  rmSync(join(irDir, `${mod}.ir.yaml`), { force: true });
  rmSync(join(irDir, mod), { recursive: true, force: true });
  rmSync(join(root, `src/features/languages/pt/curriculum/${mod}.ts`), { force: true });
}

function runCompiler(mod, extraArgs = []) {
  return execFileSync("node", [compiler, mod, ...extraArgs], {
    cwd: root,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
}

function runCompilerExpectFailure(mod, extraArgs = []) {
  try {
    runCompiler(mod, extraArgs);
    throw new Error(`expected ${mod} to fail to compile but it succeeded`);
  } catch (e) {
    if (e.status === undefined) throw e; // not a process-exit failure — rethrow
    return (e.stderr ?? "").toString();
  }
}

test("module + fragments: lessons merge in filename order, atoms merge", async (t) => {
  const mod = "_smoke";
  t.after(() => cleanup(mod));

  writeModule(mod, moduleHeader(mod, 3, 2));
  // Filenames deliberately not in numeric-lexical lockstep with `n` so the
  // assertion below actually proves "filename order", not coincidence.
  writeFrag(mod, "l1.ir.yaml", infoLessonFragment(1, "Ola", "oi", "hi"));
  writeFrag(mod, "l2.ir.yaml", infoLessonFragment(2, "Despedidas", "tchau", "bye"));
  writeFrag(mod, "l3.ir.yaml", simLessonFragment(3, "Pratica"));

  const stdout = runCompiler(mod);
  assert.match(stdout, /3 lessons, 2 atoms/);

  const outPath = join(root, `src/features/languages/pt/curriculum/${mod}.ts`);
  const compiled = readFileSync(outPath, "utf8");

  // Lessons appear in filename order (l1, l2, l3) in the const declaration
  // order (excluding the `PT_..._LESSONS: LessonContent[]` array itself).
  const declOrder = [...compiled.matchAll(/const (\S+): LessonContent = \{/g)].map((m) => m[1]);
  assert.deepEqual(declOrder, ["PT__SMOKE_1", "PT__SMOKE_2", "PT__SMOKE_3"]);

  // Both fragment atoms landed, in the same filename order.
  const atomsBlock = compiled.slice(
    compiled.indexOf("_ATOMS: PtAtom[] = ["),
    compiled.indexOf("];", compiled.indexOf("_ATOMS: PtAtom[] = [")),
  );
  const oiIdx = atomsBlock.indexOf('"oi"');
  const tchauIdx = atomsBlock.indexOf('"tchau"');
  assert.ok(oiIdx >= 0 && tchauIdx >= 0, "both fragment atoms are present");
  assert.ok(oiIdx < tchauIdx, "atoms appear in filename order (l1 before l2)");
});

test("duplicate lesson id across fragments fails loudly naming both files", async (t) => {
  const mod = "_smoke";
  t.after(() => cleanup(mod));

  writeModule(mod, moduleHeader(mod, 3, 2));
  writeFrag(mod, "l1.ir.yaml", infoLessonFragment(1, "Ola", "oi", "hi"));
  // l2 re-declares n: 1 — a duplicate lesson id, not a duplicate filename.
  writeFrag(mod, "l2.ir.yaml", infoLessonFragment(1, "Also Ola", "tchau", "bye"));

  const stderr = runCompilerExpectFailure(mod);
  assert.match(stderr, /duplicate lesson id 1/);
  assert.match(stderr, /l1\.ir\.yaml/);
  assert.match(stderr, /l2\.ir\.yaml/);
});

test("duplicate atom surface across fragments fails loudly naming both files", async (t) => {
  const mod = "_smoke";
  t.after(() => cleanup(mod));

  writeModule(mod, moduleHeader(mod, 3, 2));
  writeFrag(mod, "l1.ir.yaml", infoLessonFragment(1, "Ola", "oi", "hi"));
  writeFrag(mod, "l2.ir.yaml", infoLessonFragment(2, "Ainda Ola", "oi", "hi again"));

  const stderr = runCompilerExpectFailure(mod);
  assert.match(stderr, /duplicate atom surface "oi"/);
  assert.match(stderr, /l1\.ir\.yaml/);
  assert.match(stderr, /l2\.ir\.yaml/);
});

test("no fragments: output is byte-identical to the pre-fragment compiler", async (t) => {
  const mod = "_smoke";
  t.after(() => cleanup(mod));

  // A complete module with everything inline, no `ir/<mod>/` directory at
  // all — the exact shape the compiler accepted before fragment support.
  writeModule(
    mod,
    `
module: ${mod}
title: "Smoke Test Module"
expectedLessonCount: 3
checkpoint: 2
newAtoms:
  - surface: "oi"
    meaningEn: "hi"
    partOfSpeech: "other"
    kind: "vocab"
  - surface: "tchau"
    meaningEn: "bye"
    partOfSpeech: "other"
    kind: "vocab"
lessons:
  - n: 1
    template: free
    title: "Ola"
    description: "Smoke fixture lesson 1"
    steps:
      - kind: info
        title: "Intro 1"
        body: "Smoke body 1"
  - n: 2
    template: free
    title: "Despedidas"
    description: "Smoke fixture lesson 2"
    steps:
      - kind: info
        title: "Intro 2"
        body: "Smoke body 2"
  - n: 3
    template: free
    title: "Pratica"
    description: "Smoke fixture mastery lesson 3"
    steps:
      - kind: sim
        scene:
          emoji: "🎬"
          title: "Smoke scene"
        turns:
          - id: t1
            npc:
              speaker: "Ana"
              pt: "Oi!"
              gloss: "Hi!"
            goal: "Reply hi"
            reply:
              mode: build
              tiles: ["Oi"]
              answer: "Oi"
`,
  );
  assert.equal(existsSync(join(irDir, mod)), false, "no fragment dir exists for this fixture");

  // Run the CURRENT (patched) compiler.
  runCompiler(mod);
  const patchedOut = readFileSync(
    join(root, `src/features/languages/pt/curriculum/${mod}.ts`),
    "utf8",
  );

  // Run the PRE-FRAGMENT compiler (this lane's own starting point, from
  // git HEAD) against the identical fixture, from a same-directory temp
  // copy so its relative `./draft/pt-ir/...` imports still resolve.
  const preFragmentSrc = execFileSync(
    "git",
    ["show", "HEAD:scripts/compile-ir-pt.mjs"],
    { cwd: root, encoding: "utf8" },
  );
  const preFragmentCopy = join(here, `.pre-fragment-${mod}.mjs`);
  writeFileSync(preFragmentCopy, preFragmentSrc);
  t.after(() => rmSync(preFragmentCopy, { force: true }));

  execFileSync("node", [preFragmentCopy, mod], { cwd: root, encoding: "utf8" });
  const originalOut = readFileSync(
    join(root, `src/features/languages/pt/curriculum/${mod}.ts`),
    "utf8",
  );

  assert.equal(patchedOut, originalOut, "fragment support must be a no-op when no fragments exist");
});
