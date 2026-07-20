/**
 * Vocab-provenance guard (2026-07-20 audit): every Japanese surface in
 * m3-neo must tokenize into words the learner owns — M1/M2 kana-module
 * anchors, structural tokens, or M3-new words whose FIRST occurrence is
 * a sanctioned intro step (exposure/teach), never e.g. a bare distractor
 * before the teach (shipped: はじめまして as an MCQ distractor 6 steps
 * before its LC).
 */
import { describe, it, expect } from "vitest";
import { M3_NEO_LESSONS } from "./m3-neo";
import { JA_COURSE_ATOMS } from "../courseAtoms";
import { M3_M7_REVIEW_POOL } from "../grammarHelpers";

const PRIOR = new Set([
  ...JA_COURSE_ATOMS.filter((a: any) => a.fromModule === "m1" || a.fromModule === "m2").map((a: any) => a.kana),
  ...M3_M7_REVIEW_POOL.filter((a) => a.fromModule === "m1" || a.fromModule === "m2").map((a) => a.kana),
]);
const STRUCTURAL = new Set(["だ", "です", "は", "も", "トム", "ミカ", "ケン", "たなか", "、", "。", "？", "！"]);
const INTRO_TYPES = new Set([
  "listening_comprehension", "dialogue_listen", "grammar_rule",
  "build_sentence", "word_image_mcq", "particle_cloze",
]);

function jaStrings(step: any): string[] {
  const out: string[] = [];
  const walk = (v: any, key: string) => {
    if (typeof v === "string") {
      if (/^[\p{Script=Hiragana}\p{Script=Katakana}ー、。？！　 ]+$/u.test(v) && key !== "id") out.push(v);
    } else if (Array.isArray(v)) v.forEach((x) => walk(x, key));
    else if (v && typeof v === "object") Object.entries(v).forEach(([k, x]) => walk(x, k));
  };
  walk(step, "");
  return out;
}

const VOCAB = new Set([...PRIOR, ...JA_COURSE_ATOMS.map((a: any) => a.kana)]);
const ALL = [...new Set([...VOCAB, ...STRUCTURAL])].sort((a, b) => b.length - a.length);
function tokenize(str0: string): { tokens: string[]; unknown: string[] } {
  const tokens: string[] = []; const unknown: string[] = [];
  const str = str0.replace(/[　 ]/g, "");
  let i = 0;
  while (i < str.length) {
    const hit = ALL.find((t) => str.startsWith(t, i));
    if (hit) { tokens.push(hit); i += hit.length; }
    else {
      let j = i + 1;
      while (j < str.length && !ALL.some((t) => str.startsWith(t, j))) j++;
      unknown.push(str.slice(i, j)); i = j;
    }
  }
  return { tokens, unknown };
}

describe("m3-neo vocab provenance", () => {
  it("no untracked multi-kana words, and every M3-new word debuts on an intro-capable step", () => {
    const firstSeen = new Map<string, string>();
    for (const lesson of M3_NEO_LESSONS) {
      for (const step of lesson.steps as any[]) {
        for (const s of jaStrings(step)) {
          const { tokens, unknown } = tokenize(s);
          for (const u of unknown) {
            // Single kana are mora tiles/distractors in decode-builds.
            expect(u.length, `untracked word "${u}" in ${step.id} "${s}"`).toBeLessThanOrEqual(1);
          }
          for (const t of tokens) {
            if (PRIOR.has(t) || STRUCTURAL.has(t) || t.length === 1) continue;
            if (!firstSeen.has(t)) firstSeen.set(t, step.type);
          }
        }
      }
    }
    for (const [word, type] of firstSeen) {
      expect(INTRO_TYPES.has(type), `"${word}" debuts on non-intro step type ${type}`).toBe(true);
    }
  });
});
