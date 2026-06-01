/**
 * Korean course atoms — the SRS-eligible vocab + grammar spine for KO.
 *
 * Per ADR-005, every atom carries the language prefix in its id
 * (`ko:<surface>`). Surface form is the Hangul itself; romanization
 * (Revised Romanization, RR) is a derived field for accessibility /
 * lookup, never the join key.
 *
 * Phase 5 fills this list from M1 + M2 + survival vocab. M3+ atoms land
 * with their respective content modules.
 *
 * Greenfield-aware: KO has no legacy SRS state to migrate, so we can
 * start with the prefixed id from day one — no `migrateFlat` shim
 * equivalent needed.
 */
import type { Atom, AtomId, PartOfSpeech } from "@/shared/language/types";

export type KoAtomKind = "vocab" | "particle" | "phrase" | "jamo" | "syllable";

export type KoAtomSource =
  | "m1"
  | "m2"
  | "m3"
  | "sidequest-survival"
  | "future";

/** KO-specific atom shape — Hangul + Revised Romanization. */
export type KoAtom = Atom & {
  /** Revised Romanization (e.g. "annyeonghaseyo"). */
  romanization?: string;
  /** Optional Hanja form if a learner ever surfaces it. M1/M2 leave this empty. */
  hanja?: string;
  /** Atom kind, KO-internal taxonomy. */
  kind: KoAtomKind;
  /** Optional emoji art for word-image MCQs. */
  emoji?: string;
  /** Optional pronunciation hint for the alphabet trainer. */
  hint?: string;
};

function atom(opts: {
  surface: string;
  meaningEn: string;
  partOfSpeech: PartOfSpeech;
  fromModule?: KoAtomSource;
  romanization?: string;
  emoji?: string;
  kind: KoAtomKind;
  srsEligible?: boolean;
  hint?: string;
  hanja?: string;
}): KoAtom {
  return {
    id: `ko:${opts.surface}` as AtomId,
    languageId: "ko",
    surface: opts.surface,
    gloss: opts.meaningEn,
    partOfSpeech: opts.partOfSpeech,
    fromModule: opts.fromModule === "future" ? undefined : opts.fromModule,
    srsEligible: opts.srsEligible ?? true,
    romanization: opts.romanization,
    emoji: opts.emoji,
    kind: opts.kind,
    hint: opts.hint,
    hanja: opts.hanja,
  };
}

/**
 * Hangul jamo — the 24 basic letters. `srsEligible: false`: the alphabet
 * drill trains jamo via the existing alphabet path, not the cumulative
 * vocab review queue. (Mirrors Spencer's 2026-05-20 rule for JA single
 * kana — alphabet-trainer territory, not flashcards SRS.)
 */
const JAMO_ATOMS: KoAtom[] = [
  // Plain consonants (M1)
  atom({ surface: "ㄱ", meaningEn: "g / k", romanization: "g", partOfSpeech: "other", fromModule: "m1", kind: "jamo", srsEligible: false }),
  atom({ surface: "ㄴ", meaningEn: "n", romanization: "n", partOfSpeech: "other", fromModule: "m1", kind: "jamo", srsEligible: false }),
  atom({ surface: "ㄷ", meaningEn: "d / t", romanization: "d", partOfSpeech: "other", fromModule: "m1", kind: "jamo", srsEligible: false }),
  atom({ surface: "ㄹ", meaningEn: "r / l", romanization: "r", partOfSpeech: "other", fromModule: "m1", kind: "jamo", srsEligible: false }),
  atom({ surface: "ㅁ", meaningEn: "m", romanization: "m", partOfSpeech: "other", fromModule: "m1", kind: "jamo", srsEligible: false }),
  atom({ surface: "ㅂ", meaningEn: "b / p", romanization: "b", partOfSpeech: "other", fromModule: "m1", kind: "jamo", srsEligible: false }),
  atom({ surface: "ㅅ", meaningEn: "s", romanization: "s", partOfSpeech: "other", fromModule: "m1", kind: "jamo", srsEligible: false }),
  atom({ surface: "ㅇ", meaningEn: "silent / ng", romanization: "-", partOfSpeech: "other", fromModule: "m1", kind: "jamo", srsEligible: false }),
  atom({ surface: "ㅈ", meaningEn: "j", romanization: "j", partOfSpeech: "other", fromModule: "m1", kind: "jamo", srsEligible: false }),
  atom({ surface: "ㅎ", meaningEn: "h", romanization: "h", partOfSpeech: "other", fromModule: "m1", kind: "jamo", srsEligible: false }),
  // Aspirated consonants (M2)
  atom({ surface: "ㅋ", meaningEn: "k (aspirated)", romanization: "k", partOfSpeech: "other", fromModule: "m2", kind: "jamo", srsEligible: false }),
  atom({ surface: "ㅌ", meaningEn: "t (aspirated)", romanization: "t", partOfSpeech: "other", fromModule: "m2", kind: "jamo", srsEligible: false }),
  atom({ surface: "ㅍ", meaningEn: "p (aspirated)", romanization: "p", partOfSpeech: "other", fromModule: "m2", kind: "jamo", srsEligible: false }),
  atom({ surface: "ㅊ", meaningEn: "ch", romanization: "ch", partOfSpeech: "other", fromModule: "m2", kind: "jamo", srsEligible: false }),
  // Tense consonants (M2)
  atom({ surface: "ㄲ", meaningEn: "kk (tense)", romanization: "kk", partOfSpeech: "other", fromModule: "m2", kind: "jamo", srsEligible: false }),
  atom({ surface: "ㄸ", meaningEn: "tt (tense)", romanization: "tt", partOfSpeech: "other", fromModule: "m2", kind: "jamo", srsEligible: false }),
  atom({ surface: "ㅃ", meaningEn: "pp (tense)", romanization: "pp", partOfSpeech: "other", fromModule: "m2", kind: "jamo", srsEligible: false }),
  atom({ surface: "ㅆ", meaningEn: "ss (tense)", romanization: "ss", partOfSpeech: "other", fromModule: "m2", kind: "jamo", srsEligible: false }),
  atom({ surface: "ㅉ", meaningEn: "jj (tense)", romanization: "jj", partOfSpeech: "other", fromModule: "m2", kind: "jamo", srsEligible: false }),
  // Basic vowels (M1)
  atom({ surface: "ㅏ", meaningEn: "a", romanization: "a", partOfSpeech: "other", fromModule: "m1", kind: "jamo", srsEligible: false }),
  atom({ surface: "ㅓ", meaningEn: "eo (uh)", romanization: "eo", partOfSpeech: "other", fromModule: "m1", kind: "jamo", srsEligible: false }),
  atom({ surface: "ㅗ", meaningEn: "o", romanization: "o", partOfSpeech: "other", fromModule: "m1", kind: "jamo", srsEligible: false }),
  atom({ surface: "ㅜ", meaningEn: "u", romanization: "u", partOfSpeech: "other", fromModule: "m1", kind: "jamo", srsEligible: false }),
  atom({ surface: "ㅡ", meaningEn: "eu (unrounded)", romanization: "eu", partOfSpeech: "other", fromModule: "m1", kind: "jamo", srsEligible: false }),
  atom({ surface: "ㅣ", meaningEn: "i (ee)", romanization: "i", partOfSpeech: "other", fromModule: "m1", kind: "jamo", srsEligible: false }),
  // Y-vowels (M2)
  atom({ surface: "ㅑ", meaningEn: "ya", romanization: "ya", partOfSpeech: "other", fromModule: "m2", kind: "jamo", srsEligible: false }),
  atom({ surface: "ㅕ", meaningEn: "yeo", romanization: "yeo", partOfSpeech: "other", fromModule: "m2", kind: "jamo", srsEligible: false }),
  atom({ surface: "ㅛ", meaningEn: "yo", romanization: "yo", partOfSpeech: "other", fromModule: "m2", kind: "jamo", srsEligible: false }),
  atom({ surface: "ㅠ", meaningEn: "yu", romanization: "yu", partOfSpeech: "other", fromModule: "m2", kind: "jamo", srsEligible: false }),
];

/**
 * Particles — function-word atoms. `srsEligible: true`: production via
 * cloze reps in M3+ trains them through FSRS, even though they're shorter
 * than typical vocab atoms.
 */
const PARTICLE_ATOMS: KoAtom[] = [
  atom({ surface: "은", meaningEn: "topic marker (after consonant)", romanization: "eun", partOfSpeech: "particle", fromModule: "m3", kind: "particle" }),
  atom({ surface: "는", meaningEn: "topic marker (after vowel)", romanization: "neun", partOfSpeech: "particle", fromModule: "m3", kind: "particle" }),
  atom({ surface: "이", meaningEn: "subject marker (after consonant)", romanization: "i", partOfSpeech: "particle", fromModule: "m3", kind: "particle" }),
  atom({ surface: "가", meaningEn: "subject marker (after vowel)", romanization: "ga", partOfSpeech: "particle", fromModule: "m3", kind: "particle" }),
  atom({ surface: "을", meaningEn: "object marker (after consonant)", romanization: "eul", partOfSpeech: "particle", fromModule: "m3", kind: "particle" }),
  atom({ surface: "를", meaningEn: "object marker (after vowel)", romanization: "reul", partOfSpeech: "particle", fromModule: "m3", kind: "particle" }),
  atom({ surface: "에", meaningEn: "at / to / in (time or place)", romanization: "e", partOfSpeech: "particle", fromModule: "m3", kind: "particle" }),
  atom({ surface: "에서", meaningEn: "at (location of action) / from", romanization: "eseo", partOfSpeech: "particle", fromModule: "m3", kind: "particle" }),
];

/**
 * M1 anchor vocab — words assembled from the 9 plain-consonant rows + the
 * 6 basic vowels. Each row contributes 3 anchors (see `curriculum/m1-rows.ts`).
 * Plus the 4 vowel-only words from `curriculum/m1-vowels.ts`.
 *
 * Note: some pairs like 나 ("I") and 너 ("you, casual") are emoji-blocked
 * for visual MCQs (function-word semantics) — caller falls back to
 * listening-comp / build steps. CONTENT-TODO: verify with a Korean
 * speaker that the M1 set reads naturally for absolute beginners.
 */
const M1_VOCAB: KoAtom[] = [
  // Vowel words
  atom({ surface: "아이", meaningEn: "child", romanization: "ai", emoji: "👶", partOfSpeech: "noun", fromModule: "m1", kind: "vocab" }),
  atom({ surface: "오이", meaningEn: "cucumber", romanization: "oi", emoji: "🥒", partOfSpeech: "noun", fromModule: "m1", kind: "vocab" }),
  atom({ surface: "오", meaningEn: "five", romanization: "o", emoji: "5️⃣", partOfSpeech: "noun", fromModule: "m1", kind: "vocab" }),
  atom({ surface: "이", meaningEn: "two", romanization: "i", emoji: "2️⃣", partOfSpeech: "noun", fromModule: "m1", kind: "vocab" }),
  // ㄱ-row
  atom({ surface: "고기", meaningEn: "meat", romanization: "gogi", emoji: "🥩", partOfSpeech: "noun", fromModule: "m1", kind: "vocab" }),
  atom({ surface: "아기", meaningEn: "baby", romanization: "agi", emoji: "👶", partOfSpeech: "noun", fromModule: "m1", kind: "vocab" }),
  atom({ surface: "거기", meaningEn: "there", romanization: "geogi", emoji: "📍", partOfSpeech: "pronoun", fromModule: "m1", kind: "vocab" }),
  // ㄴ-row
  atom({ surface: "나", meaningEn: "I / me (casual)", romanization: "na", emoji: "🙋", partOfSpeech: "pronoun", fromModule: "m1", kind: "vocab" }),
  atom({ surface: "너", meaningEn: "you (casual)", romanization: "neo", emoji: "👉", partOfSpeech: "pronoun", fromModule: "m1", kind: "vocab" }),
  atom({ surface: "누구", meaningEn: "who", romanization: "nugu", emoji: "❓", partOfSpeech: "pronoun", fromModule: "m1", kind: "vocab" }),
  // ㅁ-row
  atom({ surface: "어머니", meaningEn: "mother", romanization: "eomeoni", emoji: "👩", partOfSpeech: "noun", fromModule: "m1", kind: "vocab" }),
  atom({ surface: "나무", meaningEn: "tree", romanization: "namu", emoji: "🌳", partOfSpeech: "noun", fromModule: "m1", kind: "vocab" }),
  // ㄷ-row
  atom({ surface: "구두", meaningEn: "dress shoes", romanization: "gudu", emoji: "👞", partOfSpeech: "noun", fromModule: "m1", kind: "vocab" }),
  atom({ surface: "도", meaningEn: "also / too", romanization: "do", emoji: "➕", partOfSpeech: "particle", fromModule: "m1", kind: "particle" }),
  atom({ surface: "모두", meaningEn: "all / everyone", romanization: "modu", emoji: "👥", partOfSpeech: "noun", fromModule: "m1", kind: "vocab" }),
  // ㄹ-row
  atom({ surface: "다리", meaningEn: "leg / bridge", romanization: "dari", emoji: "🦵", partOfSpeech: "noun", fromModule: "m1", kind: "vocab" }),
  atom({ surface: "머리", meaningEn: "head / hair", romanization: "meori", emoji: "🧑", partOfSpeech: "noun", fromModule: "m1", kind: "vocab" }),
  atom({ surface: "우리", meaningEn: "we / us", romanization: "uri", emoji: "🤝", partOfSpeech: "pronoun", fromModule: "m1", kind: "vocab" }),
  // ㅂ-row
  atom({ surface: "바다", meaningEn: "sea", romanization: "bada", emoji: "🌊", partOfSpeech: "noun", fromModule: "m1", kind: "vocab" }),
  atom({ surface: "비", meaningEn: "rain", romanization: "bi", emoji: "🌧️", partOfSpeech: "noun", fromModule: "m1", kind: "vocab" }),
  atom({ surface: "바보", meaningEn: "fool / silly", romanization: "babo", emoji: "🤪", partOfSpeech: "noun", fromModule: "m1", kind: "vocab" }),
  // ㅅ-row
  atom({ surface: "사", meaningEn: "four (4, Sino)", romanization: "sa", emoji: "4️⃣", partOfSpeech: "noun", fromModule: "m1", kind: "vocab" }),
  atom({ surface: "소", meaningEn: "cow", romanization: "so", emoji: "🐄", partOfSpeech: "noun", fromModule: "m1", kind: "vocab" }),
  atom({ surface: "사이", meaningEn: "between", romanization: "sai", emoji: "↔️", partOfSpeech: "noun", fromModule: "m1", kind: "vocab" }),
  // ㅈ-row
  atom({ surface: "자", meaningEn: "sleep! (imperative)", romanization: "ja", emoji: "💤", partOfSpeech: "verb", fromModule: "m1", kind: "vocab" }),
  atom({ surface: "모자", meaningEn: "hat", romanization: "moja", emoji: "🧢", partOfSpeech: "noun", fromModule: "m1", kind: "vocab" }),
  atom({ surface: "지도", meaningEn: "map", romanization: "jido", emoji: "🗺️", partOfSpeech: "noun", fromModule: "m1", kind: "vocab" }),
  // ㅎ-row
  atom({ surface: "하나", meaningEn: "one (1, native)", romanization: "hana", emoji: "1️⃣", partOfSpeech: "noun", fromModule: "m1", kind: "vocab" }),
  atom({ surface: "하루", meaningEn: "one day", romanization: "haru", emoji: "📅", partOfSpeech: "noun", fromModule: "m1", kind: "vocab" }),
  atom({ surface: "호두", meaningEn: "walnut", romanization: "hodu", emoji: "🌰", partOfSpeech: "noun", fromModule: "m1", kind: "vocab" }),
];

/**
 * M2 anchor vocab — words built from aspirated + tense + y-vowel rows.
 * Each new jamo gets at least one anchor word; words constructed so the
 * blocks come from M1 + the current M2 row. CONTENT-TODO: verify with
 * a Korean speaker that these read naturally + the polite/casual register
 * is consistent.
 */
const M2_VOCAB: KoAtom[] = [
  // ㅋ — k aspirated
  atom({ surface: "코", meaningEn: "nose", romanization: "ko", emoji: "👃", partOfSpeech: "noun", fromModule: "m2", kind: "vocab" }),
  atom({ surface: "키", meaningEn: "height / key", romanization: "ki", emoji: "📏", partOfSpeech: "noun", fromModule: "m2", kind: "vocab" }),
  atom({ surface: "커피", meaningEn: "coffee", romanization: "keopi", emoji: "☕", partOfSpeech: "noun", fromModule: "m2", kind: "vocab" }),
  atom({ surface: "쿠키", meaningEn: "cookie", romanization: "kuki", emoji: "🍪", partOfSpeech: "noun", fromModule: "m2", kind: "vocab" }),
  // ㅌ — t aspirated
  atom({ surface: "토끼", meaningEn: "rabbit", romanization: "tokki", emoji: "🐰", partOfSpeech: "noun", fromModule: "m2", kind: "vocab" }),
  atom({ surface: "타다", meaningEn: "to ride / board", romanization: "tada", partOfSpeech: "verb", fromModule: "m2", kind: "vocab" }),
  // ㅍ — p aspirated
  atom({ surface: "피", meaningEn: "blood", romanization: "pi", emoji: "🩸", partOfSpeech: "noun", fromModule: "m2", kind: "vocab" }),
  atom({ surface: "포도", meaningEn: "grape", romanization: "podo", emoji: "🍇", partOfSpeech: "noun", fromModule: "m2", kind: "vocab" }),
  // ㅊ — ch
  atom({ surface: "차", meaningEn: "car / tea", romanization: "cha", emoji: "🚗", partOfSpeech: "noun", fromModule: "m2", kind: "vocab" }),
  atom({ surface: "치마", meaningEn: "skirt", romanization: "chima", emoji: "👗", partOfSpeech: "noun", fromModule: "m2", kind: "vocab" }),
  // Tense (M2)
  atom({ surface: "꼬리", meaningEn: "tail", romanization: "kkori", emoji: "🐈", partOfSpeech: "noun", fromModule: "m2", kind: "vocab" }),
  atom({ surface: "토끼", meaningEn: "rabbit (with tense ㄲ)", romanization: "tokki", partOfSpeech: "noun", fromModule: "m2", kind: "vocab", srsEligible: false }),
  atom({ surface: "오빠", meaningEn: "older brother (female speaker)", romanization: "oppa", emoji: "🧑", partOfSpeech: "noun", fromModule: "m2", kind: "vocab" }),
  atom({ surface: "아빠", meaningEn: "dad", romanization: "appa", emoji: "👨", partOfSpeech: "noun", fromModule: "m2", kind: "vocab" }),
  atom({ surface: "싸다", meaningEn: "to be cheap", romanization: "ssada", partOfSpeech: "adjective", fromModule: "m2", kind: "vocab" }),
  atom({ surface: "짜다", meaningEn: "to be salty", romanization: "jjada", partOfSpeech: "adjective", fromModule: "m2", kind: "vocab" }),
  // Y-vowel words (M2)
  atom({ surface: "야구", meaningEn: "baseball", romanization: "yagu", emoji: "⚾", partOfSpeech: "noun", fromModule: "m2", kind: "vocab" }),
  atom({ surface: "여기", meaningEn: "here", romanization: "yeogi", emoji: "📍", partOfSpeech: "pronoun", fromModule: "m2", kind: "vocab" }),
  atom({ surface: "교실", meaningEn: "classroom", romanization: "gyosil", emoji: "🏫", partOfSpeech: "noun", fromModule: "m2", kind: "vocab" }),
  atom({ surface: "우유", meaningEn: "milk", romanization: "uyu", emoji: "🥛", partOfSpeech: "noun", fromModule: "m2", kind: "vocab" }),
];

/**
 * Survival sidequest atoms — high-utility traveler phrases. Phrase-level
 * atoms (whole utterances), kind: "phrase".
 */
const SURVIVAL_ATOMS: KoAtom[] = [
  atom({ surface: "안녕하세요", meaningEn: "hello (polite)", romanization: "annyeonghaseyo", partOfSpeech: "phrase", fromModule: "sidequest-survival", kind: "phrase" }),
  atom({ surface: "감사합니다", meaningEn: "thank you (formal)", romanization: "gamsahamnida", partOfSpeech: "phrase", fromModule: "sidequest-survival", kind: "phrase" }),
  atom({ surface: "고마워요", meaningEn: "thanks (polite, casual)", romanization: "gomawoyo", partOfSpeech: "phrase", fromModule: "sidequest-survival", kind: "phrase" }),
  atom({ surface: "죄송합니다", meaningEn: "I'm sorry (formal)", romanization: "joesonghamnida", partOfSpeech: "phrase", fromModule: "sidequest-survival", kind: "phrase" }),
  atom({ surface: "괜찮아요", meaningEn: "it's okay / I'm okay", romanization: "gwaenchanayo", partOfSpeech: "phrase", fromModule: "sidequest-survival", kind: "phrase" }),
  atom({ surface: "네", meaningEn: "yes", romanization: "ne", partOfSpeech: "phrase", fromModule: "sidequest-survival", kind: "phrase" }),
  atom({ surface: "아니요", meaningEn: "no", romanization: "aniyo", partOfSpeech: "phrase", fromModule: "sidequest-survival", kind: "phrase" }),
  atom({ surface: "얼마예요?", meaningEn: "how much is it?", romanization: "eolmayeyo", partOfSpeech: "phrase", fromModule: "sidequest-survival", kind: "phrase" }),
  atom({ surface: "어디예요?", meaningEn: "where is it?", romanization: "eodiyeyo", partOfSpeech: "phrase", fromModule: "sidequest-survival", kind: "phrase" }),
  atom({ surface: "화장실이 어디예요?", meaningEn: "where is the restroom?", romanization: "hwajangsiri eodiyeyo", partOfSpeech: "phrase", fromModule: "sidequest-survival", kind: "phrase" }),
  atom({ surface: "도와주세요", meaningEn: "please help me", romanization: "dowajuseyo", partOfSpeech: "phrase", fromModule: "sidequest-survival", kind: "phrase" }),
  atom({ surface: "물 주세요", meaningEn: "water, please", romanization: "mul juseyo", partOfSpeech: "phrase", fromModule: "sidequest-survival", kind: "phrase" }),
  atom({ surface: "이거 주세요", meaningEn: "this one, please", romanization: "igeo juseyo", partOfSpeech: "phrase", fromModule: "sidequest-survival", kind: "phrase" }),
  atom({ surface: "한국어 못해요", meaningEn: "I don't speak Korean (well)", romanization: "hangugeo motaeyo", partOfSpeech: "phrase", fromModule: "sidequest-survival", kind: "phrase" }),
  atom({ surface: "다시 말해주세요", meaningEn: "please say it again", romanization: "dasi malhaejuseyo", partOfSpeech: "phrase", fromModule: "sidequest-survival", kind: "phrase" }),
  atom({ surface: "잠시만요", meaningEn: "one moment, please", romanization: "jamsimanyo", partOfSpeech: "phrase", fromModule: "sidequest-survival", kind: "phrase" }),
];

// ─── Aggregate + lookup map ──────────────────────────────────────────────

/**
 * Full KO atom registry. Order = M1 vocab → M2 vocab → jamo → particles
 * → survival. Order matters for nothing today but is stable for diffability.
 */
export const KO_COURSE_ATOMS: ReadonlyArray<KoAtom> = [
  ...M1_VOCAB,
  ...M2_VOCAB,
  ...JAMO_ATOMS,
  ...PARTICLE_ATOMS,
  ...SURVIVAL_ATOMS,
];

/** Surface → atom lookup (used by `grammarHelpers.ts` to resolve atom ids
 *  during step authoring). First-write-wins on duplicates — the dup atom
 *  `토끼` is registered twice (ㅌ-row + ㄲ-row); the M2 vocab listing keeps
 *  the second one srsEligible: false so the SRS pool dedups by id. */
export const KO_ATOMS_BY_SURFACE: ReadonlyMap<string, KoAtom> = (() => {
  const m = new Map<string, KoAtom>();
  for (const a of KO_COURSE_ATOMS) {
    if (!m.has(a.surface)) m.set(a.surface, a);
  }
  return m;
})();
