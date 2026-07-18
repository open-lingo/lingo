/**
 * Romaja → Hangul transliteration (the reverse of `hangulRomanize.ts`).
 *
 * Lets a learner on a plain QWERTY keyboard TYPE Korean: they enter Revised-
 * Romanization-style romaja ("annyeonghaseyo") and we compose it into Hangul
 * syllable blocks ("안녕하세요"). This is the desktop "Korean keyboard" — no OS
 * IME required — and doubles as a live preview for the Writing trainer.
 *
 * Hangul syllables are algorithmic: a block = initial consonant (choseong,
 * 19) + medial vowel (jungseong, 21) + optional final consonant (jongseong,
 * 28 incl. none), encoded at U+AC00 + (cho*21 + jung)*28 + jong. We greedily
 * tokenize the romaja into onset / vowel / coda and emit one block per vowel.
 *
 * Ambiguity notes (romaja is lossy; RR uses hyphens we don't require):
 *   - A single consonant between two vowels is the NEXT syllable's onset
 *     (ha·se → 하세), while two consonants split final|onset (an·nyeong).
 *   - "ng" is always read as a ㅇ coda (jung·ang), never n+g.
 *   - Already-Hangul characters, spaces, digits, and punctuation pass through
 *     untouched, so mixed / IME-typed input is safe to run through this.
 *
 * Perfect round-tripping isn't the goal (RR is pronunciation-based and drops
 * information); covering the vocab a learner actually types is.
 */

import { romanizeKorean } from "./hangulRomanize";

const S_BASE = 0xac00;

// Onset (choseong) romaja → index 0–18. ㅇ (11, silent) is implicit for a
// vowel-initial syllable and has no spelling, so it's absent here.
const ONSETS: Array<[string, number]> = [
  ["kk", 1], ["tt", 4], ["pp", 8], ["ss", 10], ["jj", 13], ["ch", 14],
  ["gg", 1], ["dd", 4], ["bb", 8],
  ["g", 0], ["n", 2], ["d", 3], ["r", 5], ["l", 5], ["m", 6], ["b", 7],
  ["s", 9], ["j", 12], ["k", 15], ["t", 16], ["p", 17], ["h", 18],
];

// Vowel (jungseong) romaja → index 0–20.
const VOWELS: Array<[string, number]> = [
  ["yae", 3], ["wae", 10], ["yeo", 6],
  ["ya", 2], ["ae", 1], ["eo", 4], ["ye", 7], ["wa", 9], ["oe", 11],
  ["yo", 12], ["wo", 14], ["we", 15], ["wi", 16], ["yu", 17], ["eu", 18],
  ["ui", 19],
  ["a", 0], ["e", 5], ["o", 8], ["u", 13], ["i", 20],
];

// Final (jongseong) romaja → index 1–27 (0 = none).
const FINALS: Array<[string, number]> = [
  ["ng", 21], ["kk", 2], ["ss", 20], ["ch", 23],
  ["g", 1], ["k", 1], ["n", 4], ["d", 7], ["t", 7], ["l", 8], ["r", 8],
  ["m", 16], ["b", 17], ["p", 17], ["s", 19], ["j", 22], ["h", 27],
];

/** Longest-match a token list at position `i`. Lists are pre-sorted so the
 *  longest candidates are tried first. */
function match(
  table: Array<[string, number]>,
  s: string,
  i: number,
): { len: number; idx: number } | null {
  for (const [roma, idx] of table) {
    if (s.startsWith(roma, i)) return { len: roma.length, idx };
  }
  return null;
}

// Single-character finals only — used to prefer a C1(coda)+C2(onset) split
// over a greedy 2-char coda (so "chingu" is 친구, not 칭우).
const FINALS_1 = FINALS.filter(([roma]) => roma.length === 1);

const matchOnset = (s: string, i: number) => match(ONSETS, s, i);
const matchVowel = (s: string, i: number) => match(VOWELS, s, i);
const matchFinal = (s: string, i: number) => match(FINALS, s, i);
const matchFinal1 = (s: string, i: number) => match(FINALS_1, s, i);

function compose(cho: number, jung: number, jong: number): string {
  return String.fromCharCode(S_BASE + (cho * 21 + jung) * 28 + jong);
}

/**
 * Convert a romaja string to Hangul. Non-romaja runs (existing Hangul,
 * whitespace, digits, punctuation, unmatched letters) pass through unchanged,
 * so partial input while typing degrades gracefully.
 */
export function romajaToHangul(input: string): string {
  if (!input) return "";
  const s = input.toLowerCase();
  let out = "";
  let i = 0;
  const n = s.length;

  while (i < n) {
    const ch = s[i];
    // Only a–z participate; everything else (Hangul, spaces, punctuation,
    // digits) is emitted verbatim — but re-read the ORIGINAL casing/char.
    if (ch < "a" || ch > "z") {
      out += input[i];
      i++;
      continue;
    }

    // Onset: consume a leading consonant only if a vowel follows it.
    let cho = 11; // silent ㅇ
    const on = matchOnset(s, i);
    if (on && matchVowel(s, i + on.len)) {
      cho = on.idx;
      i += on.len;
    }

    const v = matchVowel(s, i);
    if (!v) {
      // A consonant with no vowel to attach to (e.g. a stray letter). Emit it
      // raw and move on rather than dropping input.
      out += input[i];
      i++;
      continue;
    }
    i += v.len;

    // Coda: a consonant right after the vowel is this syllable's final UNLESS
    // it's a single consonant that itself onsets the next vowel.
    let jong = 0;
    const nextOnset = matchOnset(s, i);
    if (nextOnset && matchVowel(s, i + nextOnset.len)) {
      jong = 0; // single consonant belongs to the next syllable (ha·se)
    } else {
      // Prefer a 1-char coda when the following consonant onsets a vowel
      // (chin·gu → 친구), otherwise take the greedy coda (…ng / cluster / end).
      const f1 = matchFinal1(s, i);
      if (f1) {
        const afterF1 = i + f1.len;
        const o2 = matchOnset(s, afterF1);
        if (o2 && matchVowel(s, afterF1 + o2.len)) {
          jong = f1.idx;
          i = afterF1;
        } else {
          const f = matchFinal(s, i);
          if (f) {
            jong = f.idx;
            i += f.len;
          }
        }
      } else {
        const f = matchFinal(s, i);
        if (f) {
          jong = f.idx;
          i += f.len;
        }
      }
    }

    out += compose(cho, v.idx, jong);
  }

  return out;
}

/**
 * True when a learner's typed answer matches a Korean target, accepting three
 * input styles so desktop (romaja), IME (Hangul), and approximate spellings
 * all pass:
 *   1. exact Hangul (they used a Korean IME),
 *   2. romaja that composes to the target (annyeong → 안녕), and
 *   3. pronunciation-equal romaja (handles RR assimilation the literal
 *      composition can't reverse, e.g. 감사합니다 ↔ "gamsahamnida").
 * Whitespace/case are ignored; punctuation is left to the caller's own
 * normalization for the exact path.
 */
export function koreanInputMatches(typed: string, target: string): boolean {
  const strip = (x: string) => x.replace(/\s+/g, "").toLowerCase();
  const a = typed.trim();
  const b = target.trim();
  if (!a) return false;
  if (strip(a) === strip(b)) return true;

  const aHangul = romajaToHangul(a);
  if (strip(aHangul) === strip(b)) return true;

  const targetRoman = strip(romanizeKorean(b));
  // Re-romanize the learner's composed Hangul so RR assimilation is applied to
  // both sides; also accept raw romaja typed straight against the target's RR.
  return strip(romanizeKorean(aHangul)) === targetRoman || strip(a) === targetRoman;
}
