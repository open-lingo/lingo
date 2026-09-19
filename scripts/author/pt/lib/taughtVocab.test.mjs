import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { readTaughtVocab, flatVocab, isBeforeLesson, resolveEmojiFromRegistry } from "./taughtVocab.mjs";

const SAMPLE = `import { atom, type PtAtom } from "./courseAtoms";
export const PT_M1_L2_ATOMS: PtAtom[] = [
  atom({
    surface: "de",
    meaningEn: "of / from",
    partOfSpeech: "particle",
    fromModule: "m1",
    kind: "particle",
  }),
  atom({
    surface: "cidade",
    meaningEn: "city",
    partOfSpeech: "noun",
    fromModule: "m1",
    kind: "vocab",
    gender: "f",
    emoji: "🏙️",
  }),
];
`;

function withFixtureDir(fn) {
  const dir = mkdtempSync(join(tmpdir(), "pttool-vocab-"));
  try {
    writeFileSync(join(dir, "courseAtoms.m1-l2.ts"), SAMPLE);
    writeFileSync(join(dir, "courseAtoms.m1-l10.ts"), SAMPLE.replace("L2_ATOMS", "L10_ATOMS"));
    writeFileSync(join(dir, "courseAtoms.ts"), "// not a lesson file, must be ignored");
    return fn(dir);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

test("readTaughtVocab: parses atom({...}) blocks out of a real-shaped file", () => {
  withFixtureDir((dir) => {
    const rows = readTaughtVocab(dir);
    const l2 = rows.find((r) => r.lesson === 2);
    assert.equal(l2.atoms.length, 2);
    assert.equal(l2.atoms[1].surface, "cidade");
    assert.equal(l2.atoms[1].gender, "f");
    assert.equal(l2.atoms[1].emoji, "🏙️");
  });
});

test("readTaughtVocab: numeric sort puts l10 after l2, not before (string-sort trap)", () => {
  withFixtureDir((dir) => {
    const rows = readTaughtVocab(dir);
    assert.deepEqual(rows.map((r) => r.lesson), [2, 10]);
  });
});

test("readTaughtVocab: ignores courseAtoms.ts itself (no lesson suffix)", () => {
  withFixtureDir((dir) => {
    const rows = readTaughtVocab(dir);
    assert.equal(rows.length, 2);
  });
});

test("readTaughtVocab: a nonexistent directory returns an empty list, not a throw", () => {
  assert.deepEqual(readTaughtVocab("/no/such/dir/at/all"), []);
});

test("flatVocab: flattens every lesson's atoms into one surface -> atom map", () => {
  withFixtureDir((dir) => {
    const map = flatVocab(readTaughtVocab(dir));
    assert.equal(map.size, 2);
    assert.equal(map.get("de").meaningEn, "of / from");
  });
});

// ── round 4 (lane PTTOOL4, item 4) ────────────────────────────────────────

test("isBeforeLesson: an earlier MODULE is always prior, regardless of lesson number", () => {
  assert.equal(isBeforeLesson({ module: "m1", lesson: 6 }, "m2", 1), true); // m1's whole vocab is prior to m2-L1
  assert.equal(isBeforeLesson({ module: "m2", lesson: 3 }, "m2", 1), false); // same module, later lesson: not prior
  assert.equal(isBeforeLesson({ module: "m2", lesson: 1 }, "m2", 3), true); // same module, earlier lesson: prior
  assert.equal(isBeforeLesson({ module: "m3", lesson: 1 }, "m2", 1), false); // a LATER module is never prior
});

// ── item 10 (lane PTTOOL5): atom metadata shared via the registry ───────

test("resolveEmojiFromRegistry: fills a word's missing emoji from an already-registered atom of the same surface", () => {
  const priorVocab = new Map([["gato", { surface: "gato", meaningEn: "cat", emoji: "🐱" }]]);
  const [w] = resolveEmojiFromRegistry([{ pt: "gato", en: "cat", pos: "noun" }], priorVocab);
  assert.equal(w.emoji, "🐱");
});

test("resolveEmojiFromRegistry: a word's emoji that contradicts the registry's throws", () => {
  const priorVocab = new Map([["gato", { surface: "gato", meaningEn: "cat", emoji: "🐱" }]]);
  assert.throws(
    () => resolveEmojiFromRegistry([{ pt: "gato", en: "cat", pos: "noun", emoji: "🐈‍⬛" }], priorVocab),
    /gato.*contradicts|contradicts.*gato/is,
  );
});

test("resolveEmojiFromRegistry: leaves words untouched when priorVocab has no matching surface", () => {
  const [w] = resolveEmojiFromRegistry([{ pt: "casa", en: "house", pos: "noun", emoji: "🏠" }], new Map());
  assert.equal(w.emoji, "🏠");
});
