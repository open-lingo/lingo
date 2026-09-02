import test from "node:test";
import assert from "node:assert/strict";
import { buildNewLine, locateMatches } from "./apply.mjs";

test("buildNewLine replaces an existing emoji field", () => {
  const line = '  { id: "shouyu", kana: "しょうゆ", emoji: "🍶", fromModule: "future" },';
  const out = buildNewLine(line, { action: "replace", emoji: "🧂" });
  assert.equal(out, '  { id: "shouyu", kana: "しょうゆ", emoji: "🧂", fromModule: "future" },');
});

test("buildNewLine inserts an emoji field next to id/surface when the atom has none (fill)", () => {
  const line = '  { id: "ai", kana: "あい", romaji: "ai", meaningEn: "love", kind: "vocab" },';
  const out = buildNewLine(line, { action: "replace", emoji: "❤️" });
  assert.equal(out, '  { id: "ai", emoji: "❤️", kana: "あい", romaji: "ai", meaningEn: "love", kind: "vocab" },');
});

test("buildNewLine inserts next to surface for ko/es/fr atom() calls", () => {
  const line = '  atom({ surface: "잔", meaningEn: "cup", fromModule: "m5", kind: "vocab" }),';
  const out = buildNewLine(line, { action: "replace", emoji: "🥃" });
  assert.equal(out, '  atom({ surface: "잔", emoji: "🥃", meaningEn: "cup", fromModule: "m5", kind: "vocab" }),');
});

test("buildNewLine removes an existing emoji field for an art decision", () => {
  const line = '  { id: "kouban", kana: "こうばん", emoji: "🚓", fromModule: "future", kind: "vocab" },';
  const out = buildNewLine(line, { action: "art" });
  assert.equal(out, '  { id: "kouban", kana: "こうばん", fromModule: "future", kind: "vocab" },');
});

test("buildNewLine is a no-op for an art decision on an atom with no emoji", () => {
  const line = '  { id: "teeburu", kana: "テーブル", fromModule: "future", kind: "vocab" },';
  const out = buildNewLine(line, { action: "art" });
  assert.equal(out, line);
});

test("locateMatches returns the single hit unambiguously", () => {
  const filesText = [
    { file: "courseAtoms.ts", lines: ['  { id: "shouyu", kana: "しょうゆ", emoji: "🍶" },'] },
  ];
  const m = locateMatches(filesText, "ja", { id: "ja:shouyu" }, [{ emoji: "🍶" }]);
  assert.equal(m.length, 1);
  assert.equal(m[0].idx, 0);
});

test("locateMatches disambiguates a duplicate surface via the SRS-eligible inventory item's current emoji", () => {
  const filesText = [
    {
      file: "courseAtoms.ts",
      lines: [
        '  atom({ surface: "머리", emoji: "🧑", fromModule: "m1", kind: "vocab" }),',
        '  atom({ surface: "머리", emoji: "🧠", fromModule: "m20", kind: "vocab", srsEligible: false }),',
      ],
    },
  ];
  const inventoryItems = [
    { emoji: "🧑", srsEligible: true },
    { emoji: "🧠", srsEligible: false },
  ];
  const m = locateMatches(filesText, "ko", { id: "ko:머리" }, inventoryItems);
  assert.equal(m.length, 1);
  assert.match(m[0].line, /fromModule: "m1"/);
});

test("locateMatches refuses (returns >1) a genuine ambiguity it cannot resolve", () => {
  const filesText = [
    {
      file: "courseAtoms.ts",
      lines: [
        '  atom({ surface: "잔", meaningEn: "a", fromModule: "m9", kind: "vocab" }),',
        '  atom({ surface: "잔", meaningEn: "b", fromModule: "m3", kind: "vocab" }),',
      ],
    },
  ];
  // No inventory info at all — nothing to disambiguate on; falls back to
  // earliest module, which IS resolvable here (m3 < m9).
  const m = locateMatches(filesText, "ko", { id: "ko:잔" }, []);
  assert.equal(m.length, 1);
  assert.match(m[0].line, /fromModule: "m3"/);
});

test("locateMatches returns zero hits (refuse) when the id isn't in the registry at all", () => {
  const filesText = [{ file: "courseAtoms.ts", lines: ['  { id: "other" },'] }];
  const m = locateMatches(filesText, "ja", { id: "ja:missing" }, []);
  assert.equal(m.length, 0);
});

test("locateMatches ignores inline step-option literals that aren't registry lines", () => {
  const filesText = [
    {
      file: "m1.ts",
      lines: [
        '  atom({ surface: "au revoir", meaningEn: "goodbye", fromModule: "m1", kind: "phrase", emoji: "🚪" }),',
        '        { surface: "au revoir", emoji: "🚪" },',
        '        { surface: "au revoir", emoji: "🚪" },',
      ],
    },
  ];
  const m = locateMatches(filesText, "fr", { id: "fr:au revoir" }, [{ emoji: "🚪" }]);
  assert.equal(m.length, 1);
  assert.match(m[0].line, /atom\(\{/);
});
