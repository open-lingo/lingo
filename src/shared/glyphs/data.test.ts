import { describe, it, expect } from "vitest";
import hiragana from "./data/hiragana.json";
import katakana from "./data/katakana.json";
import hangul from "./data/hangul.json";
import kanji from "./data/kanji.json";
import {
  getAlphabetById,
  getAlphabetDisplaySections,
} from "@/shared/domain/languageConfig";
import { N5_KANJI } from "@/features/languages/ja/secondScript/n5Kanji";

type GlyphFile = {
  viewBox: [number, number, number, number];
  characters: Record<
    string,
    { strokes: Array<{ d: string; start: [number, number] }> }
  >;
};

// Yoon (small-ya combos) and tiny-modifier characters that exist as standalone
// glyphs but the lesson flow intentionally never asks the learner to trace.
// `alphabetSession.shouldIncludeDrawingSteps` enforces this — we mirror its
// list here so the data check matches the runtime contract.
const COMPOSED_OR_SKIPPED = new Set([
  "りゃ",
  "りゅ",
  "りょ",
  "リャ",
  "リュ",
  "リョ",
]);

function drawableChars(alphabetId: "hiragana" | "katakana"): string[] {
  const def = getAlphabetById("ja", alphabetId);
  if (!def) throw new Error(`alphabet ${alphabetId} not found`);
  const all = def.characters ?? [];
  return all.filter((c) => !COMPOSED_OR_SKIPPED.has(c));
}

describe("kana glyph data", () => {
  it.each([
    ["hiragana", hiragana as unknown as GlyphFile] as const,
    ["katakana", katakana as unknown as GlyphFile] as const,
  ])("%s file has a non-empty viewBox", (_id, file) => {
    expect(file.viewBox).toHaveLength(4);
    expect(file.viewBox[2]).toBeGreaterThan(0);
    expect(file.viewBox[3]).toBeGreaterThan(0);
  });

  it("every drawable hiragana character has stroke data", () => {
    const file = hiragana as unknown as GlyphFile;
    const missing: string[] = [];
    for (const ch of drawableChars("hiragana")) {
      const entry = file.characters[ch];
      if (!entry || !entry.strokes?.length) missing.push(ch);
    }
    expect(missing).toEqual([]);
  });

  it("every drawable katakana character has stroke data", () => {
    const file = katakana as unknown as GlyphFile;
    const missing: string[] = [];
    for (const ch of drawableChars("katakana")) {
      const entry = file.characters[ch];
      if (!entry || !entry.strokes?.length) missing.push(ch);
    }
    expect(missing).toEqual([]);
  });

  it("hangul file has a non-empty viewBox", () => {
    const file = hangul as unknown as GlyphFile;
    expect(file.viewBox).toHaveLength(4);
    expect(file.viewBox[2]).toBeGreaterThan(0);
    expect(file.viewBox[3]).toBeGreaterThan(0);
  });

  it("every Hangul jamo in the alphabet def has stroke data", () => {
    const file = hangul as unknown as GlyphFile;
    const def = getAlphabetById("ko", "hangul");
    if (!def) throw new Error("hangul alphabet not found");
    // The jamo the learner actually traces come from the alphabet's
    // characters list (40 basic jamo). Syllable blocks are out of scope.
    const jamo = def.characters ?? [];
    expect(jamo.length).toBeGreaterThan(0);
    const missing: string[] = [];
    for (const ch of jamo) {
      const entry = file.characters[ch];
      if (!entry || !entry.strokes?.length) missing.push(ch);
    }
    expect(missing).toEqual([]);
  });

  it("Hangul stroke data covers every section character", () => {
    const file = hangul as unknown as GlyphFile;
    const def = getAlphabetById("ko", "hangul");
    if (!def) throw new Error("hangul alphabet not found");
    const sectionChars = getAlphabetDisplaySections(def).flatMap(
      (s) => s.characters,
    );
    const missing = sectionChars.filter(
      (ch) => !file.characters[ch]?.strokes?.length,
    );
    expect(missing).toEqual([]);
  });

  // The kanji file is NOT an alphabet — no AlphabetDef points at it and kanji
  // production is out of scope. Its consumer is the reading side (the kana→kanji
  // reveal draws a glyph stroke by stroke), and the failure mode there is
  // silent: `KanjiStrokeDraw` falls back to rendering the plain character, so a
  // catalog glyph with no data looks like a static reveal rather than an error.
  // Hence the coverage check — add a glyph to N5_KANJI without re-running
  // `node scripts/build-kanjivg-data.mjs` and this is what tells you.
  it("every N5_KANJI glyph has stroke data", () => {
    const file = kanji as unknown as GlyphFile;
    expect(N5_KANJI.length).toBeGreaterThan(0);
    const missing = N5_KANJI.map((e) => e.character).filter(
      (ch) => !file.characters[ch]?.strokes?.length,
    );
    expect(missing).toEqual([]);
  });

  it("kanji file has a non-empty viewBox", () => {
    const file = kanji as unknown as GlyphFile;
    expect(file.viewBox).toHaveLength(4);
    expect(file.viewBox[2]).toBeGreaterThan(0);
    expect(file.viewBox[3]).toBeGreaterThan(0);
  });

  it("every stroke entry has a path and a start point", () => {
    const all: Array<[string, GlyphFile]> = [
      ["hiragana", hiragana as unknown as GlyphFile],
      ["katakana", katakana as unknown as GlyphFile],
      ["hangul", hangul as unknown as GlyphFile],
      ["kanji", kanji as unknown as GlyphFile],
    ];
    const broken: string[] = [];
    for (const [scriptId, file] of all) {
      for (const [ch, entry] of Object.entries(file.characters)) {
        for (let i = 0; i < entry.strokes.length; i++) {
          const s = entry.strokes[i];
          if (typeof s.d !== "string" || s.d.length === 0) {
            broken.push(`${scriptId}:${ch}:${i}:missing-d`);
          }
          if (
            !Array.isArray(s.start) ||
            s.start.length !== 2 ||
            typeof s.start[0] !== "number" ||
            typeof s.start[1] !== "number"
          ) {
            broken.push(`${scriptId}:${ch}:${i}:bad-start`);
          }
        }
      }
    }
    expect(broken).toEqual([]);
  });
});
