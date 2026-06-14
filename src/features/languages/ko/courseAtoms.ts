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
  | "m4"
  | "m5"
  | "m6"
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
  atom({ surface: "의", meaningEn: "possessive 's (of)", romanization: "ui", partOfSpeech: "particle", fromModule: "m4", kind: "particle" }),
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

/**
 * M3 vocab — first-phrases module. Greetings, the 이에요/예요 copula,
 * self-introduction vocab (저 / 이름 / 학생 / 선생님), and Sino-Korean
 * numbers 1-10. The placement bank (placementBank.ts makeM3Items) was
 * authored against this exact set, so the surfaces here are the source of
 * truth those items resolve against.
 *
 * Register note: 안녕하세요 / 감사합니다 / 네 / 아니요 already exist as
 * `sidequest-survival` phrase atoms (first-write-wins in the lookup map),
 * so M3 does NOT re-register them — it reuses them. M3 adds the phrases
 * the survival quest didn't cover plus the copula + numbers spine.
 *
 * CONTENT-TODO: verify register consistency with a Korean speaker —
 * the M3 spine mixes the 해요-style polite copula (이에요/예요) with the
 * formal 합니다-style (반갑습니다); both are correct first-meeting Korean
 * but the sequencing rationale should be confirmed against the N-level map.
 */
const M3_VOCAB: KoAtom[] = [
  // Greetings + social phrases (phrase-level)
  atom({ surface: "안녕히 가세요", meaningEn: "goodbye (to person leaving)", romanization: "annyeonghi gaseyo", partOfSpeech: "phrase", fromModule: "m3", kind: "phrase" }),
  atom({ surface: "안녕히 계세요", meaningEn: "goodbye (to person staying)", romanization: "annyeonghi gyeseyo", partOfSpeech: "phrase", fromModule: "m3", kind: "phrase" }),
  atom({ surface: "반갑습니다", meaningEn: "nice to meet you", romanization: "bangapseumnida", partOfSpeech: "phrase", fromModule: "m3", kind: "phrase" }),
  atom({ surface: "안녕", meaningEn: "hi / bye (casual)", romanization: "annyeong", partOfSpeech: "phrase", fromModule: "m3", kind: "phrase" }),
  // Self-introduction vocab
  atom({ surface: "저", meaningEn: "I / me (polite)", romanization: "jeo", emoji: "🙋", partOfSpeech: "pronoun", fromModule: "m3", kind: "vocab" }),
  atom({ surface: "이름", meaningEn: "name", romanization: "ireum", emoji: "🪪", partOfSpeech: "noun", fromModule: "m3", kind: "vocab" }),
  atom({ surface: "학생", meaningEn: "student", romanization: "haksaeng", emoji: "🧑‍🎓", partOfSpeech: "noun", fromModule: "m3", kind: "vocab" }),
  atom({ surface: "선생님", meaningEn: "teacher", romanization: "seonsaengnim", emoji: "🧑‍🏫", partOfSpeech: "noun", fromModule: "m3", kind: "vocab" }),
  atom({ surface: "친구", meaningEn: "friend", romanization: "chingu", emoji: "👫", partOfSpeech: "noun", fromModule: "m3", kind: "vocab" }),
  atom({ surface: "뭐", meaningEn: "what", romanization: "mwo", emoji: "❓", partOfSpeech: "pronoun", fromModule: "m3", kind: "vocab" }),
  // Copula — the polite 이에요 (after consonant) / 예요 (after vowel)
  atom({ surface: "이에요", meaningEn: "to be (polite, after consonant)", romanization: "ieyo", partOfSpeech: "grammar", fromModule: "m3", kind: "vocab", srsEligible: false }),
  atom({ surface: "예요", meaningEn: "to be (polite, after vowel)", romanization: "yeyo", partOfSpeech: "grammar", fromModule: "m3", kind: "vocab", srsEligible: false }),
  // Sino-Korean numbers 1-10
  atom({ surface: "일", meaningEn: "one (1, Sino)", romanization: "il", emoji: "1️⃣", partOfSpeech: "noun", fromModule: "m3", kind: "vocab" }),
  atom({ surface: "이", meaningEn: "two (2, Sino)", romanization: "i", emoji: "2️⃣", partOfSpeech: "noun", fromModule: "m3", kind: "vocab", srsEligible: false }),
  atom({ surface: "삼", meaningEn: "three (3, Sino)", romanization: "sam", emoji: "3️⃣", partOfSpeech: "noun", fromModule: "m3", kind: "vocab" }),
  atom({ surface: "사", meaningEn: "four (4, Sino)", romanization: "sa", emoji: "4️⃣", partOfSpeech: "noun", fromModule: "m3", kind: "vocab", srsEligible: false }),
  atom({ surface: "오", meaningEn: "five (5, Sino)", romanization: "o", emoji: "5️⃣", partOfSpeech: "noun", fromModule: "m3", kind: "vocab", srsEligible: false }),
  atom({ surface: "육", meaningEn: "six (6, Sino)", romanization: "yuk", emoji: "6️⃣", partOfSpeech: "noun", fromModule: "m3", kind: "vocab" }),
  atom({ surface: "칠", meaningEn: "seven (7, Sino)", romanization: "chil", emoji: "7️⃣", partOfSpeech: "noun", fromModule: "m3", kind: "vocab" }),
  atom({ surface: "팔", meaningEn: "eight (8, Sino)", romanization: "pal", emoji: "8️⃣", partOfSpeech: "noun", fromModule: "m3", kind: "vocab" }),
  atom({ surface: "구", meaningEn: "nine (9, Sino)", romanization: "gu", emoji: "9️⃣", partOfSpeech: "noun", fromModule: "m3", kind: "vocab", srsEligible: false }),
  atom({ surface: "십", meaningEn: "ten (10, Sino)", romanization: "sip", emoji: "🔟", partOfSpeech: "noun", fromModule: "m3", kind: "vocab" }),
];

/**
 * M4 vocab — "Things & possession". Everyday objects + the demonstrative
 * system (이거 / 그거 / 저거 — this / that-near-you / that-over-there) + the
 * possessive 의 (and its contractions 제 = 저의, 네 = 너의). Mirrors the JA
 * M4 arc (の + これ/それ/あれ) but with Korean's three-way 이/그/저 deixis.
 *
 * 거 (= 것, "thing/one") is the bound noun that 이/그/저 attach to in speech:
 * 이거 = "this thing". We teach the contracted spoken forms (이거/그거/저거,
 * 제 거 = "my thing") since that's what learners actually hear.
 *
 * CONTENT-TODO: a Korean speaker should confirm the contraction teaching
 * order (제 vs 저의) reads naturally for absolute beginners — both are
 * correct; 제 is far more common in speech.
 */
const M4_VOCAB: KoAtom[] = [
  // Everyday objects (verified Noto art for image MCQs)
  atom({ surface: "책", meaningEn: "book", romanization: "chaek", emoji: "📖", partOfSpeech: "noun", fromModule: "m4", kind: "vocab" }),
  atom({ surface: "펜", meaningEn: "pen", romanization: "pen", emoji: "🖊️", partOfSpeech: "noun", fromModule: "m4", kind: "vocab" }),
  atom({ surface: "가방", meaningEn: "bag", romanization: "gabang", emoji: "👜", partOfSpeech: "noun", fromModule: "m4", kind: "vocab" }),
  atom({ surface: "의자", meaningEn: "chair", romanization: "uija", emoji: "🪑", partOfSpeech: "noun", fromModule: "m4", kind: "vocab" }),
  atom({ surface: "문", meaningEn: "door", romanization: "mun", emoji: "🚪", partOfSpeech: "noun", fromModule: "m4", kind: "vocab" }),
  atom({ surface: "핸드폰", meaningEn: "cellphone", romanization: "haendeupon", emoji: "📱", partOfSpeech: "noun", fromModule: "m4", kind: "vocab" }),
  // Demonstrative "thing" forms (spoken contractions of 이것/그것/저것)
  atom({ surface: "이거", meaningEn: "this (thing)", romanization: "igeo", partOfSpeech: "pronoun", fromModule: "m4", kind: "vocab" }),
  atom({ surface: "그거", meaningEn: "that (thing, near you)", romanization: "geugeo", partOfSpeech: "pronoun", fromModule: "m4", kind: "vocab" }),
  atom({ surface: "저거", meaningEn: "that (thing, over there)", romanization: "jeogeo", partOfSpeech: "pronoun", fromModule: "m4", kind: "vocab" }),
  // Demonstrative determiners (이/그/저 + noun)
  atom({ surface: "이", meaningEn: "this (+ noun)", romanization: "i", partOfSpeech: "other", fromModule: "m4", kind: "vocab", srsEligible: false }),
  atom({ surface: "그", meaningEn: "that (+ noun, near you)", romanization: "geu", partOfSpeech: "other", fromModule: "m4", kind: "vocab" }),
  atom({ surface: "저", meaningEn: "that (+ noun, over there)", romanization: "jeo", partOfSpeech: "other", fromModule: "m4", kind: "vocab", srsEligible: false }),
  // Possessive contractions + the bound noun 거 / 것
  atom({ surface: "제", meaningEn: "my (polite, = 저의)", romanization: "je", partOfSpeech: "pronoun", fromModule: "m4", kind: "vocab" }),
  atom({ surface: "거", meaningEn: "thing / one (spoken 것)", romanization: "geo", partOfSpeech: "noun", fromModule: "m4", kind: "vocab", srsEligible: false }),
];

/**
 * M5 vocab — "Numbers, counting & ordering". The NATIVE-Korean number set
 * (하나~열, used for counting things, people, age, and hours) + the most
 * common counters (개 generic things, 명 people, 잔 cups/glasses) + 주세요
 * ("please give"). Mirrors the JA M5 arc (native numbers + ください + 〜つ/
 * 〜にん counters). Money reuses the Sino numbers already taught in M3.
 *
 * IMPORTANT Korean fact (taught, not a bug): the native numbers 1-4 and 20
 * take a CONTRACTED form directly before a counter:
 *   하나→한, 둘→두, 셋→세, 넷→네, 스물→스무.
 * So "one book" is 한 개, not 하나 개. M5 teaches both the standalone
 * counting forms and the pre-counter contractions explicitly.
 *
 * CONTENT-TODO: native-speaker check that 개/명/잔 are the right first three
 * counters for an N5-equivalent learner, and that the contraction lesson
 * lands before the ordering drill.
 */
const M5_VOCAB: KoAtom[] = [
  // Native numbers 1-10 (standalone counting forms)
  atom({ surface: "하나", meaningEn: "one (1, native)", romanization: "hana", emoji: "1️⃣", partOfSpeech: "noun", fromModule: "m5", kind: "vocab", srsEligible: false }),
  atom({ surface: "둘", meaningEn: "two (2, native)", romanization: "dul", emoji: "2️⃣", partOfSpeech: "noun", fromModule: "m5", kind: "vocab" }),
  atom({ surface: "셋", meaningEn: "three (3, native)", romanization: "set", emoji: "3️⃣", partOfSpeech: "noun", fromModule: "m5", kind: "vocab" }),
  atom({ surface: "넷", meaningEn: "four (4, native)", romanization: "net", emoji: "4️⃣", partOfSpeech: "noun", fromModule: "m5", kind: "vocab" }),
  atom({ surface: "다섯", meaningEn: "five (5, native)", romanization: "daseot", emoji: "5️⃣", partOfSpeech: "noun", fromModule: "m5", kind: "vocab" }),
  atom({ surface: "여섯", meaningEn: "six (6, native)", romanization: "yeoseot", emoji: "6️⃣", partOfSpeech: "noun", fromModule: "m5", kind: "vocab" }),
  atom({ surface: "일곱", meaningEn: "seven (7, native)", romanization: "ilgop", emoji: "7️⃣", partOfSpeech: "noun", fromModule: "m5", kind: "vocab" }),
  atom({ surface: "여덟", meaningEn: "eight (8, native)", romanization: "yeodeol", emoji: "8️⃣", partOfSpeech: "noun", fromModule: "m5", kind: "vocab" }),
  atom({ surface: "아홉", meaningEn: "nine (9, native)", romanization: "ahop", emoji: "9️⃣", partOfSpeech: "noun", fromModule: "m5", kind: "vocab" }),
  atom({ surface: "열", meaningEn: "ten (10, native)", romanization: "yeol", emoji: "🔟", partOfSpeech: "noun", fromModule: "m5", kind: "vocab" }),
  // Pre-counter contracted forms (taught explicitly)
  atom({ surface: "한", meaningEn: "one (before a counter)", romanization: "han", partOfSpeech: "other", fromModule: "m5", kind: "vocab", srsEligible: false }),
  atom({ surface: "두", meaningEn: "two (before a counter)", romanization: "du", partOfSpeech: "other", fromModule: "m5", kind: "vocab", srsEligible: false }),
  atom({ surface: "세", meaningEn: "three (before a counter)", romanization: "se", partOfSpeech: "other", fromModule: "m5", kind: "vocab", srsEligible: false }),
  // Counters
  atom({ surface: "개", meaningEn: "counter: things / items", romanization: "gae", partOfSpeech: "noun", fromModule: "m5", kind: "vocab" }),
  atom({ surface: "명", meaningEn: "counter: people", romanization: "myeong", partOfSpeech: "noun", fromModule: "m5", kind: "vocab" }),
  atom({ surface: "잔", meaningEn: "counter: cups / glasses", romanization: "jan", partOfSpeech: "noun", fromModule: "m5", kind: "vocab" }),
  // Ordering / money vocab
  atom({ surface: "주세요", meaningEn: "please give (me)", romanization: "juseyo", partOfSpeech: "verb", fromModule: "m5", kind: "vocab" }),
  atom({ surface: "물", meaningEn: "water", romanization: "mul", emoji: "💧", partOfSpeech: "noun", fromModule: "m5", kind: "vocab" }),
  atom({ surface: "빵", meaningEn: "bread", romanization: "ppang", emoji: "🍞", partOfSpeech: "noun", fromModule: "m5", kind: "vocab" }),
  atom({ surface: "얼마", meaningEn: "how much", romanization: "eolma", partOfSpeech: "pronoun", fromModule: "m5", kind: "vocab" }),
  atom({ surface: "원", meaningEn: "won (₩, currency)", romanization: "won", partOfSpeech: "noun", fromModule: "m5", kind: "vocab" }),
];

/**
 * M6 vocab — "Places & existence". Place nouns + the existence verbs
 * 있어요 ("there is / I have") and 없어요 ("there isn't / I don't have"),
 * the location particles 에 (static location of existence) vs 에서 (location
 * of an action — already registered in M3 particles), the subject markers
 * 이/가 with existence, and 어디 ("where"). Mirrors the JA M6 arc (に/で/が +
 * あります/います) — but Korean uses ONE existence verb 있다 for both living
 * and non-living things, which is simpler than JA's あります/います split.
 *
 * CONTENT-TODO: native-speaker check that the 에 (existence) vs 에서 (action)
 * contrast is introduced in an order that doesn't confuse beginners, and
 * that the 어디에 있어요? question phrasing is the most natural default.
 */
const M6_VOCAB: KoAtom[] = [
  // Place nouns
  atom({ surface: "집", meaningEn: "house / home", romanization: "jip", emoji: "🏠", partOfSpeech: "noun", fromModule: "m6", kind: "vocab" }),
  atom({ surface: "학교", meaningEn: "school", romanization: "hakgyo", emoji: "🏫", partOfSpeech: "noun", fromModule: "m6", kind: "vocab" }),
  atom({ surface: "가게", meaningEn: "store / shop", romanization: "gage", emoji: "🏪", partOfSpeech: "noun", fromModule: "m6", kind: "vocab" }),
  atom({ surface: "식당", meaningEn: "restaurant", romanization: "sikdang", emoji: "🍜", partOfSpeech: "noun", fromModule: "m6", kind: "vocab" }),
  atom({ surface: "역", meaningEn: "(train) station", romanization: "yeok", emoji: "🚉", partOfSpeech: "noun", fromModule: "m6", kind: "vocab" }),
  atom({ surface: "병원", meaningEn: "hospital", romanization: "byeongwon", emoji: "🏥", partOfSpeech: "noun", fromModule: "m6", kind: "vocab" }),
  // Existence verbs
  atom({ surface: "있어요", meaningEn: "there is / I have", romanization: "isseoyo", partOfSpeech: "verb", fromModule: "m6", kind: "vocab" }),
  atom({ surface: "없어요", meaningEn: "there isn't / I don't have", romanization: "eopseoyo", partOfSpeech: "verb", fromModule: "m6", kind: "vocab" }),
  // Question word
  atom({ surface: "어디", meaningEn: "where", romanization: "eodi", partOfSpeech: "pronoun", fromModule: "m6", kind: "vocab" }),
  // Position nouns (used with 에)
  atom({ surface: "여기", meaningEn: "here", romanization: "yeogi", partOfSpeech: "pronoun", fromModule: "m6", kind: "vocab", srsEligible: false }),
  atom({ surface: "거기", meaningEn: "there (near you)", romanization: "geogi", partOfSpeech: "pronoun", fromModule: "m6", kind: "vocab", srsEligible: false }),
];

// ─── Aggregate + lookup map ──────────────────────────────────────────────

/**
 * Full KO atom registry. Order = M1 vocab → M2 vocab → M3 vocab → jamo →
 * particles → survival. Order matters for nothing today but is stable for
 * diffability.
 *
 * Duplicate surfaces across modules (e.g. 이/사/오 appear as both M1 anchor
 * words and M3 Sino numbers) are deduped first-write-wins by the lookup
 * map below; the later-module copies are marked `srsEligible: false` so the
 * SRS pool keeps one canonical card per surface.
 */
export const KO_COURSE_ATOMS: ReadonlyArray<KoAtom> = [
  ...M1_VOCAB,
  ...M2_VOCAB,
  ...M3_VOCAB,
  ...M4_VOCAB,
  ...M5_VOCAB,
  ...M6_VOCAB,
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
