/**
 * Loose comparison of an ASR transcript against a target Japanese phrase.
 *
 * The Web Speech API for `ja-JP` returns transcripts that are usually
 * "close enough" but rarely byte-identical to the target. Common drift:
 *
 *   - Whitespace inserted between morphemes ("お ちゃ" vs "おちゃ")
 *   - Trailing punctuation ("おちゃ。", "おちゃ?")
 *   - Long vowel collapse / expansion ("おお" ↔ "おう")
 *   - Hiragana ↔ katakana ↔ kanji substitution ("ありがとう" → "有難う")
 *   - Filler insertion ("えーと あい")
 *   - Aspirated /h/ prepended on vowel-initial words ("あい" → "hai")
 *   - Romaji returned for very short utterances ("あい" → "ai")
 *
 * We normalize both sides aggressively then compare with:
 *   - exact normalized match (pass immediately)
 *   - substring (transcript contains target, or target contains transcript)
 *   - per-character overlap with tiered thresholds
 *
 * The bar deliberately leans **lenient**. False positives during a
 * pronunciation drill are far better than false negatives — we don't
 * want to punish the learner because Chrome heard "お茶" instead of
 * "おちゃ".
 *
 * Future replacement: swap in a Whisper-based phoneme-aware compare
 * once transformers.js is wired up. See
 * `docs/superpowers/specs/2026-05-15-speech-recognition-research.md`.
 */

const PUNCT_RE = /[\s　.,!?。、！？・「」『』（）()「」]/g;

const VOWEL_INITIAL_RE = /^[あいうえおアイウエオ]/;

/** Leading /h/-row hiragana + katakana, used only when target is vowel-initial. */
const LEADING_H_RE = /^[はひふへほハヒフヘホ]/;

/** Filler interjections we strip from the *start* of the utterance. */
const FILLERS = [
  "えーと",
  "えーっと",
  "えー",
  "えっと",
  "あのー",
  "あの",
  "うーん",
  "んー",
  "ん、",
  "ん ",
];

/** Trailing chars worth stripping in addition to PUNCT_RE catches. */
const TRAILING_TRIM_RE = /[\s　。、！？!?.,]+$/;

/**
 * Minimal romaji → hiragana lookup for the cases where Chrome returns
 * pure ASCII on very short JA utterances. Covers all kana most likely
 * to be drilled in the N5 starter set. Order matters: longer keys are
 * matched before shorter ones (digraphs like "kya" before "ka").
 */
const ROMAJI_TO_KANA: Array<[string, string]> = [
  // Yōon (digraphs) — must come before single-mora entries.
  ["kya", "きゃ"], ["kyu", "きゅ"], ["kyo", "きょ"],
  ["sha", "しゃ"], ["shu", "しゅ"], ["sho", "しょ"],
  ["cha", "ちゃ"], ["chu", "ちゅ"], ["cho", "ちょ"],
  ["nya", "にゃ"], ["nyu", "にゅ"], ["nyo", "にょ"],
  ["hya", "ひゃ"], ["hyu", "ひゅ"], ["hyo", "ひょ"],
  ["mya", "みゃ"], ["myu", "みゅ"], ["myo", "みょ"],
  ["rya", "りゃ"], ["ryu", "りゅ"], ["ryo", "りょ"],
  ["gya", "ぎゃ"], ["gyu", "ぎゅ"], ["gyo", "ぎょ"],
  ["ja",  "じゃ"], ["ju",  "じゅ"], ["jo",  "じょ"],
  ["bya", "びゃ"], ["byu", "びゅ"], ["byo", "びょ"],
  ["pya", "ぴゃ"], ["pyu", "ぴゅ"], ["pyo", "ぴょ"],

  // Two-letter mora.
  ["shi", "し"], ["chi", "ち"], ["tsu", "つ"],
  ["ka", "か"], ["ki", "き"], ["ku", "く"], ["ke", "け"], ["ko", "こ"],
  ["sa", "さ"], ["su", "す"], ["se", "せ"], ["so", "そ"],
  ["ta", "た"], ["te", "て"], ["to", "と"],
  ["na", "な"], ["ni", "に"], ["nu", "ぬ"], ["ne", "ね"], ["no", "の"],
  ["ha", "は"], ["hi", "ひ"], ["fu", "ふ"], ["he", "へ"], ["ho", "ほ"],
  ["ma", "ま"], ["mi", "み"], ["mu", "む"], ["me", "め"], ["mo", "も"],
  ["ya", "や"], ["yu", "ゆ"], ["yo", "よ"],
  ["ra", "ら"], ["ri", "り"], ["ru", "る"], ["re", "れ"], ["ro", "ろ"],
  ["wa", "わ"], ["wo", "を"],
  ["ga", "が"], ["gi", "ぎ"], ["gu", "ぐ"], ["ge", "げ"], ["go", "ご"],
  ["za", "ざ"], ["ji", "じ"], ["zu", "ず"], ["ze", "ぜ"], ["zo", "ぞ"],
  ["da", "だ"], ["de", "で"], ["do", "ど"],
  ["ba", "ば"], ["bi", "び"], ["bu", "ぶ"], ["be", "べ"], ["bo", "ぼ"],
  ["pa", "ぱ"], ["pi", "ぴ"], ["pu", "ぷ"], ["pe", "ぺ"], ["po", "ぽ"],

  // Single-letter vowels last.
  ["a", "あ"], ["i", "い"], ["u", "う"], ["e", "え"], ["o", "お"],
  ["n", "ん"],
];

/** ASCII-only (with whitespace) check — used to gate the romaji fallback. */
const ASCII_RE = /^[\sa-z'-]+$/i;

/* -------------------------------------------------------------------------- */
/*  Normalization helpers                                                     */
/* -------------------------------------------------------------------------- */

/** Map full-width ASCII (U+FF01..U+FF5E) to half-width. */
function foldFullWidth(s: string): string {
  let out = "";
  for (const ch of s) {
    const code = ch.codePointAt(0)!;
    if (code >= 0xff01 && code <= 0xff5e) {
      out += String.fromCodePoint(code - 0xfee0);
    } else if (code === 0x3000) {
      // Ideographic space → half-width space.
      out += " ";
    } else {
      out += ch;
    }
  }
  return out;
}

/** Katakana (U+30A1..U+30F6) → hiragana (U+3041..U+3096). */
function katakanaToHiragana(s: string): string {
  let out = "";
  for (const ch of s) {
    const code = ch.codePointAt(0)!;
    if (code >= 0x30a1 && code <= 0x30f6) {
      out += String.fromCodePoint(code - 0x60);
    } else {
      out += ch;
    }
  }
  return out;
}

/** Strip filler interjections at the very start of the string. */
function stripLeadingFillers(s: string, targetStartsWithA: boolean): string {
  let out = s;
  let changed = true;
  while (changed) {
    changed = false;
    for (const f of FILLERS) {
      if (out.startsWith(f)) {
        out = out.slice(f.length).trimStart();
        changed = true;
        break;
      }
    }
    // Drop a bare leading "あ" only when the target doesn't start with あ.
    if (!targetStartsWithA && out.startsWith("あ") && out.length > 1) {
      // Only treat "あ " or "あ、" as filler — never strip when "あ" is
      // followed directly by another kana (could be a real "あい").
      const next = out.charAt(1);
      if (next === " " || next === "、" || next === "，" || next === ",") {
        out = out.slice(1).trimStart().replace(/^[、，,]\s*/, "");
        changed = true;
      }
    }
  }
  return out;
}

/** Strip trailing punctuation + whitespace. */
function stripTrailing(s: string): string {
  return s.replace(TRAILING_TRIM_RE, "");
}

/** Strip a leading /h/ when the (already-normalized) target starts with a vowel. */
function stripLeadingHForVowelTarget(
  s: string,
  targetIsVowelInitial: boolean,
): string {
  if (!targetIsVowelInitial) return s;
  return s.replace(LEADING_H_RE, "");
}

/**
 * Pure-ASCII romaji → hiragana. Greedy longest-match over the table.
 * Drops any character that isn't part of a recognized mora; this is
 * intentional — we want garbage in → garbage out, not a partial match
 * that scores well by accident.
 */
function romajiToKana(s: string): string {
  const lower = s.toLowerCase().replace(/[\s'-]+/g, "");
  let out = "";
  let i = 0;
  while (i < lower.length) {
    let matched = false;
    for (const [rom, kana] of ROMAJI_TO_KANA) {
      if (lower.startsWith(rom, i)) {
        out += kana;
        i += rom.length;
        matched = true;
        break;
      }
    }
    if (!matched) {
      // Skip the unrecognized char.
      i += 1;
    }
  }
  return out;
}

/**
 * Normalize a candidate transcript for comparison against `target`.
 * Returns the normalized string. Pure; no side effects.
 *
 * Steps:
 *   1. Full-width → half-width
 *   2. Trim leading/trailing whitespace
 *   3. Strip leading filler interjections (えーと, あの, etc.)
 *   4. Strip trailing punctuation
 *   5. Strip leading /h/ when target is vowel-initial
 *   6. Katakana → hiragana
 *   7. Romaji → kana fallback when the result is still pure ASCII
 *   8. Drop internal whitespace + punctuation, lowercase
 */
export function normalizeForCompare(s: string, target: string): string {
  if (!s) return "";

  const targetStripped = (target ?? "").replace(PUNCT_RE, "");
  const targetIsVowelInitial = VOWEL_INITIAL_RE.test(targetStripped);
  const targetStartsWithA = targetStripped.startsWith("あ")
    || targetStripped.startsWith("ア");

  let out = foldFullWidth(s).trim();
  out = stripLeadingFillers(out, targetStartsWithA);
  out = stripTrailing(out);

  // If we're still pure ASCII at this point, try the romaji fallback.
  // For vowel-initial targets, strip a leading "h" (e.g. "hai" → "ai")
  // BEFORE conversion — otherwise "hai" expands to はい and we'd lose
  // the leading vowel during the kana-side h-strip.
  if (ASCII_RE.test(out)) {
    let romSource = out;
    if (targetIsVowelInitial) {
      romSource = romSource.replace(/^[Hh]/, "");
    }
    const fromRomaji = romajiToKana(romSource);
    if (fromRomaji.length > 0) {
      out = fromRomaji;
    }
  }

  out = katakanaToHiragana(out);
  out = stripLeadingHForVowelTarget(out, targetIsVowelInitial);

  return out.replace(PUNCT_RE, "").toLowerCase();
}

/** Normalize the target itself: just punctuation strip + kana fold + lowercase. */
export function normalizeTarget(target: string): string {
  if (!target) return "";
  const folded = katakanaToHiragana(foldFullWidth(target));
  return folded.replace(PUNCT_RE, "").toLowerCase();
}

/** Normalize for compare: strip whitespace + punctuation, lowercase. */
export function normalizeJa(s: string): string {
  if (!s) return "";
  return s.replace(PUNCT_RE, "").toLowerCase();
}

/**
 * Normalize a typed translation/production answer for grading.
 *
 * Curriculum `acceptedAnswers` store Japanese space-separated for
 * readability (e.g. "きょうは くもりです"), but Japanese is written
 * without spaces — a learner typing natural spaceless kana
 * ("きょうはくもりです") must still grade as correct. We therefore:
 *   - fold trivial width/compatibility variants (NFKC): full-width ASCII
 *     and half-width katakana canonicalize to their standard forms
 *   - drop all whitespace (ASCII + ideographic)
 *   - lowercase, so English/romaji answers stay case-insensitive
 *
 * Content is preserved — particles, kana vs kanji, and word choice all
 * still matter — so genuinely wrong answers keep failing.
 */
export function normalizeTypedAnswer(s: string): string {
  if (!s) return "";
  return s.normalize("NFKC").replace(/\s+/g, "").toLowerCase();
}

/**
 * Diacritics that `accentFold` strips: everything Unicode calls a
 * diacritic EXCEPT the kana voicing marks (U+3099 dakuten / U+309A
 * handakuten). Those distinguish real Japanese words (かき persimmon vs
 * かぎ key), so folding them would silently weaken JA typed grading —
 * this fold exists for Latin accent leniency (á é í ó ú ü ñ …).
 */
const FOLDABLE_DIACRITIC_RE = /(?![\u3099\u309a])\p{Diacritic}/gu;

/** Trailing sentence punctuation ignored on BOTH sides of a typed-answer
 *  compare — toKana turns a natural final "." into 。, and authored
 *  answers vary in whether they carry one. */
const TYPED_TRAILING_PUNCT_RE = /[。．.、,!?！？\s]+$/u;

/**
 * Fold accents/diacritics: NFD-decompose, strip combining diacritics
 * (except kana voicing — see FOLDABLE_DIACRITIC_RE), recompose. The
 * decomposition step is what folds ñ→n and ü→u alongside á→a.
 * Idempotent: already-folded input passes through unchanged.
 */
export function accentFold(s: string): string {
  if (!s) return "";
  return s.normalize("NFD").replace(FOLDABLE_DIACRITIC_RE, "").normalize("NFC");
}

export type TypedAnswerGrade = {
  correct: boolean;
  /**
   * Correct, but the learner typed a de-accented rendering of a real
   * answer ("anos" for "años") — worth a nudge, never a fail. SRS/XP
   * treat this as plain correct.
   */
  accentFlagged: boolean;
  /** Properly-accented accepted answer to surface in the nudge (raw
   *  authored form), or null when not flagged. */
  accentDisplay: string | null;
};

/**
 * Grade a typed translation/production answer against `acceptedAnswers`.
 *
 * Match = exact on `normalizeTypedAnswer` (trailing punctuation ignored),
 * with an accent-fold fallback: input that differs from an accepted
 * answer only by missing/garbled diacritics still grades correct.
 *
 * Flag rule: the grade is accent-flagged when the input matched (exactly
 * or by fold) AND some accepted answer A still carrying diacritics folds
 * to the same string as the input while differing from it un-folded —
 * i.e. the learner typed a de-accented version of a real answer. This
 * deliberately catches curricula that author diacritic-stripped variants
 * into acceptedAnswers (the stripped variant matches EXACTLY, but the
 * accented sibling still triggers the nudge). The display form prefers
 * the most-accented candidate, first-authored winning ties.
 */
export function gradeTypedAnswer(
  acceptedAnswers: readonly string[],
  input: string,
): TypedAnswerGrade {
  const inputNorm = normalizeTypedAnswer(input).replace(
    TYPED_TRAILING_PUNCT_RE,
    "",
  );
  const inputFold = accentFold(inputNorm);

  let exact = false;
  let foldMatch = false;
  let display: string | null = null;
  let displayMarks = 0;

  for (const a of acceptedAnswers) {
    const aNorm = normalizeTypedAnswer(a).replace(TYPED_TRAILING_PUNCT_RE, "");
    if (aNorm === inputNorm) {
      exact = true;
      continue; // the learner typed this one — never a nudge source
    }
    const aFold = accentFold(aNorm);
    if (aFold !== inputFold) continue;
    foldMatch = true;
    if (aFold === aNorm) continue; // carries no diacritics itself
    const marks = [...aNorm.normalize("NFD").matchAll(FOLDABLE_DIACRITIC_RE)]
      .length;
    if (display === null || marks > displayMarks) {
      display = a.trim();
      displayMarks = marks;
    }
  }

  const correct = exact || foldMatch;
  return {
    correct,
    accentFlagged: correct && display !== null,
    accentDisplay: correct ? display : null,
  };
}

/* -------------------------------------------------------------------------- */
/*  Scoring                                                                   */
/* -------------------------------------------------------------------------- */

/**
 * Per-character Jaccard-ish overlap on multisets of code points. Not a
 * proper edit distance; good enough as a "did the learner say roughly
 * the right kana" signal for V1.
 */
export function charOverlap(a: string, b: string): number {
  if (!a || !b) return 0;
  const aChars = [...a];
  const bChars = [...b];
  const bCounts = new Map<string, number>();
  for (const c of bChars) bCounts.set(c, (bCounts.get(c) ?? 0) + 1);
  let hits = 0;
  for (const c of aChars) {
    const left = bCounts.get(c) ?? 0;
    if (left > 0) {
      hits += 1;
      bCounts.set(c, left - 1);
    }
  }
  // Symmetric: penalize for length mismatch.
  return hits / Math.max(aChars.length, bChars.length);
}

export type Verdict = "perfect" | "close" | "try-again";

export type MatchTiers = {
  /** Perfect-tier threshold (default 0.85). */
  perfect: number;
  /** Close-tier threshold (default 0.55). */
  close: number;
  /** Disable normalization (raw char-overlap on raw strings). */
  strict?: boolean;
};

export const DEFAULT_TIERS: MatchTiers = {
  perfect: 0.85,
  close: 0.55,
  strict: false,
};

export type AlternativeScore = {
  /** The original (raw) alternative transcript. */
  raw: string;
  /** Normalized form actually compared against the target. */
  normalized: string;
  /** Char-overlap score on normalized strings (0..1). Substring boosts to 1. */
  score: number;
  /** ASR confidence (0..1) if the API reported one. */
  confidence?: number;
};

export type MatchResult = {
  verdict: Verdict;
  /** Best score across all alternatives. */
  bestScore: number;
  /** The alternative that produced the best score. */
  bestAlternative: AlternativeScore | null;
  /** Normalized form of the target. */
  targetNormalized: string;
  /** Per-alternative scoring detail (in original order). */
  alternatives: AlternativeScore[];
};

function scoreOne(
  rawAlt: string,
  targetNorm: string,
  tiers: MatchTiers,
  confidence?: number,
): AlternativeScore {
  const normalized = tiers.strict
    ? normalizeJa(rawAlt)
    : normalizeForCompare(rawAlt, targetNorm);

  if (!normalized || !targetNorm) {
    return { raw: rawAlt, normalized, score: 0, confidence };
  }

  if (normalized === targetNorm) {
    return { raw: rawAlt, normalized, score: 1, confidence };
  }

  if (normalized.includes(targetNorm) || targetNorm.includes(normalized)) {
    // Substring is a soft "perfect" — set to 1 so the perfect tier
    // catches it regardless of length mismatch.
    return { raw: rawAlt, normalized, score: 1, confidence };
  }

  return {
    raw: rawAlt,
    normalized,
    score: charOverlap(normalized, targetNorm),
    confidence,
  };
}

/**
 * Score every alternative against the target and return a tiered
 * verdict based on the best score.
 *
 * `alternatives` should be the N-best list from the Web Speech API
 * (top-confidence first, but order isn't relied on for correctness).
 */
export function scoreAlternatives(
  target: string,
  alternatives: ReadonlyArray<{ transcript: string; confidence?: number }>,
  tiers: MatchTiers = DEFAULT_TIERS,
): MatchResult {
  const targetNorm = tiers.strict ? normalizeJa(target) : normalizeTarget(target);

  const scored: AlternativeScore[] = alternatives.map((a) =>
    scoreOne(a.transcript, targetNorm, tiers, a.confidence),
  );

  let best: AlternativeScore | null = null;
  for (const s of scored) {
    if (!best || s.score > best.score) best = s;
  }

  const bestScore = best?.score ?? 0;
  let verdict: Verdict;
  if (bestScore >= tiers.perfect) verdict = "perfect";
  else if (bestScore >= tiers.close) verdict = "close";
  else verdict = "try-again";

  return {
    verdict,
    bestScore,
    bestAlternative: best,
    targetNormalized: targetNorm,
    alternatives: scored,
  };
}

/**
 * Returns true if `transcript` is a plausible pronunciation of `target`.
 *
 * Legacy single-string API kept for backwards compatibility with the
 * existing call site and tests. New callers should use
 * `scoreAlternatives` so they get tier + best-alt + debug detail.
 *
 * The threshold (0.7) was hand-tuned against the a-row vocab from
 * `mock-ja-m1-l1.ts`. Revisit when real usage data lands.
 */
export function isUtteranceCorrect(
  target: string,
  transcript: string,
  threshold: number = 0.7,
): boolean {
  if (!target || !transcript) return false;
  const result = scoreAlternatives(target, [{ transcript }], {
    perfect: threshold,
    close: threshold,
    strict: false,
  });
  return result.bestScore >= threshold;
}
