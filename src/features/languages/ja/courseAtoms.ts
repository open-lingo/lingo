/**
 * Japanese course-wide flashcard atom deck — source of truth for every
 * vocabulary word in the JLPT N5 curriculum (+ sidequest extras + particles).
 *
 * Generated 2026-05-19 by docs-driven compile script. Inputs:
 *   - docs/n5-vocab-emoji-map-2026-05-18.json (662 N5 atoms; kanji + emoji)
 *   - _jaGrammarHelpers.M3_M7_REVIEW_POOL (M3-M7 attribution)
 *   - hiraganaCurriculum anchor words (M1 + M2 attribution)
 *   - mock-ja-m{3-v2,4,5,6,7}.ts (introducedByLessonId)
 *   - mock-ja-sidequest-survival.ts (15 sidequest phrases)
 *
 * 2026-06-12 — M8-M27 attribution backfill: `fromModule` for 246 atoms was
 * flipped from "future" to the module whose curriculum file actually
 * surfaces the word (verified against n5-module-vocab-map.json + string
 * containment over curriculum/m{8..27}.ts step content; homograph false
 * positives manually excluded). Atoms still on "future" are either backlog,
 * planned for m28+, or not yet surfaced by any authored module.
 *
 * 2026-08-14 — m30 (n4-01) authored: FOUR rows moved "future" → "m30" (おく,
 * ならう, しつもん, こたえる). They are the only atoms m30 declares that already
 * had a registry row, and "future" is not a real module, so the module-fallback
 * unlock path in `lessonAtomIndex` could never fire for them: the learner would
 * have been graded on all four and none would ever have entered the SRS deck
 * (`lessonAtomAttribution.test.ts`'s graded-but-never-unlockable ratchet caught
 * it). Only the tag changed — no kana, no id, so no tokenization anywhere in the
 * course moved. The other 30 atoms m30 declares are derived forms and process
 * nouns with no row at all, which is the m11-m28 precedent for IR-local atoms.
 *
 * All four are also `blocked` — the same "no image MCQ" flag し carries, and for
 * the same class of reason (the m19/m24/m26 SHARED-GLYPH ruling): 🎓 is がくせい's
 * and だいがく's, ❓ is なに's and なん's, 🙋 is わたし's, and every one of those
 * is a word the learner has MET, so a picture MCQ could offer two options with
 * the same art. おく is blocked for a second reason on top: the te-oku rule card
 * has to name it, and a `kind: rule` beat compiles to a PINNED step ahead of the
 * interleaved middle, which would steal the debut (the m14 trap). `blocked` is
 * exactly the "no image MCQ" flag; nothing else about these atoms changes, and
 * it is what makes the registry agree with the IR's own `imageable: false`.
 *
 * 2026-08-15 — m31 (n4-02) authored: FOUR more rows re-tagged, the same ratchet
 * m30 hit. あげる, かりる and おかし were on "future"; たんじょうび was the same
 * defect in better disguise — tagged "m19" with `introducedByLessonId:
 * "ja-m19-5-2"`, a lesson that lives in `curriculum/_archive/m19.ts`. The neo
 * m19 does not teach the word and no IR module lists it, so that tag could not
 * unlock it either; the dead `introducedByLessonId` came off with the retag.
 * Three of the four are `blocked` under the m19/m24/m26 SHARED-GLYPH ruling or
 * the m14 rule-card-steals-the-debut ruling, and the reason is on each row.
 * たんじょうび is NOT blocked: 🎂 is carried by exactly one row in this file, so
 * it is m31's single image debut. Only `fromModule` (and `blocked`) changed —
 * no kana, no id, so no tokenization anywhere in the course moved.
 *
 * IDs are stable forever once shipped. To add a word: append a new
 * CourseAtom entry — do NOT renumber.
 */
import type { Flashcard, FlashcardDeck, Example } from "@/features/flashcards/data/types";
import type { PartOfSpeech } from "@/shared/language/types";
import type { VerbGroup } from "./conjugationTables";

export type CourseAtomKind = "vocab" | "particle" | "phrase";

/**
 * Engine class value for a conjugable JA lemma — the exact input the
 * conjugation engine consumes: a `VerbGroup` for verbs (fed to
 * `conjugateVerb`), or the adjective type. `i-adj` is mechanically conjugated
 * by `conjugateIAdj`; `na-adj` conjugates via the copula pattern (だ/です),
 * which the ADJ table stores directly rather than a dedicated engine fn.
 */
export type JaConjugationClass = VerbGroup | "i-adj" | "na-adj";

/**
 * Links a dictionary-form (lemma) atom to the conjugation engine. Present only
 * on lemma verbs / adjectives whose class is known — conjugated-form atoms
 * (たべます, たべた, …) and lemma verbs with an unresolved る-class carry `pos`
 * but no link.
 */
export interface JaConjugationLink {
  /** Class the engine accepts. */
  class: JaConjugationClass;
  /** `VERB_ENTRIES` / `ADJ_ENTRIES` id when this lemma is in the tables. */
  entryId?: string;
}

export type CourseAtomSource =
  | "m1" | "m2" | "m3" | "m4" | "m5" | "m6" | "m7"
  | "m8" | "m9" | "m10" | "m11" | "m12" | "m13" | "m14" | "m15" | "m16" | "m17"
  | "m18" | "m19" | "m20" | "m21" | "m22" | "m23" | "m24" | "m25" | "m26" | "m27"
  | "m28" | "m29" | "m30" | "m31" | "m32" | "m33" | "m34" | "m35" | "m36" | "m37"
  | "m38"
  // Forward N4 attributions (2026-08-09 A2 re-home of the retired m30
  // pilot's atoms; spec 2026-08-06-n4-open-and-transform-teaching-design.md).
  // None of these modules is authored yet, so atoms tagged with them never
  // unlock, never seed placement (applyPlacementResult filters on live
  // module ids), and never enter the review pool — the truthful state until
  // something teaches them. "thr-n4" is the spine's N4 thread tile
  // (docs/spine-n4.md §4) — the glue-adverb drip, not a module.
  | "m49" | "m50" | "thr-n4"
  | "sidequest-survival"
  | "future";

export type CourseAtom = {
  /** Stable ID. Kebab-case romaji of the kana. NEVER changes once shipped. */
  id: string;
  /** Canonical kana surface form. */
  kana: string;
  /** Kanji form if the N5 atom has one. Render-time gated by future unlock map. */
  kanji?: string;
  /** Romaji for accessibility / search / fallback display. */
  romaji: string;
  /** English meaning. Short — one phrase, not a definition. */
  meaningEn: string;
  /**
   * Even shorter form for width-constrained tiles (match pairs). Also the
   * place to pin ONE sense when meaningEn lists several and a derived form
   * (e.g. みない "won't watch") must sit consistently beside the base on
   * the same card (Spencer m6 walk 2026-07-23). Full meaningEn stays on
   * flashcards and teaching surfaces.
   */
  shortGloss?: string;
  /** Optional emoji art. */
  emoji?: string;
  /** Where this atom first enters the curriculum. */
  fromModule: CourseAtomSource;
  /**
   * Explicit frequency-deck rank (1 = unlocks earliest). REQUIRED on every
   * `fromModule: "future"` vocab atom that is SRS-eligible — those atoms ARE
   * the frequency drip, and rank used to be derived from array position, so
   * re-homing any atom off "future" silently reshuffled every later atom's
   * unlock module (a learner-visible churn of an opt-in deck). Seeded once
   * from the 2026-08-26 derived order; ranks are stable ids, NOT contiguous —
   * an atom leaving "future" retires its rank, a new backlog atom takes
   * max+1. Guarded by `frequencyAtoms.test.ts`.
   */
  freqRank?: number;
  /** Lesson ID where this atom is first introduced (best-effort; null for "future"). */
  introducedByLessonId?: string;
  /** Atom kind. */
  kind: CourseAtomKind;
  /** Part of speech. Required — every atom carries one. */
  pos: PartOfSpeech;
  /** Conjugation-engine link, on conjugable lemmas only. */
  conjugation?: JaConjugationLink;
  /** True if N5 emoji map flagged this atom as visual-MCQ-blocked. */
  blocked?: boolean;
  /**
   * True if this atom should NOT enter the flashcards SRS pool. Used for
   * single-kana atoms whose practice belongs in the alphabet trainer
   * (Practice page), not in the cumulative vocab review queue. Spencer's
   * rule (2026-05-20): atoms where `kana.length === 1` and the atom is
   * NOT a particle and has no `emoji` carrier are alphabet-trainer
   * territory — exclude.
   */
  excludeFromSrs?: boolean;
  /**
   * True when this atom's kana is NOT how the word is really written — a
   * loanword spelled in hiragana purely so the M1/M2 kana-decoding drills
   * have a word for that glyph (どあ for ど, ぱん/ぺん/ぴあの for the ぱ row).
   * The real word is katakana (ドア・パン・ペン・ピアノ), which is a separate
   * atom taught once katakana lands.
   *
   * Spencer's ruling 2026-07-24: "it has to be katakana no? doa in hiragana
   * isn't a word right?" — correct. These may appear ONLY inside their own
   * kana-decoding lesson. They must never be drawn as a word: not as build
   * distractor fill, not as match-pair draws, not in review pools. The bug
   * that surfaced it: どあ was filling tile banks in m6-neo-7/8 while ドア
   * was live in the same module.
   */
  kanaDrillOnly?: boolean;
  /** N5 emoji map's authoring note, kept as provenance. */
  note?: string;
};

export const JA_COURSE_ATOMS: ReadonlyArray<CourseAtom> = [
  { id: "ai", emoji: "❤️", kana: "あい", romaji: "ai", meaningEn: "love", fromModule: "m1", introducedByLessonId: "ja-m1-l1", kind: "vocab", pos: "noun" },
  { id: "iie", kana: "いいえ", romaji: "iie", meaningEn: "no", fromModule: "m1", introducedByLessonId: "ja-m1-l1", kind: "vocab", blocked: true, note: "interjection/function word", pos: "interjection" },
  { id: "uma", emoji: "🐎", kana: "うま", kanji: "馬", romaji: "uma", meaningEn: "horse", fromModule: "m1", introducedByLessonId: "ja-m1-l7-ma", kind: "vocab", pos: "noun" },
  { id: "kai", kana: "かい", romaji: "kai", meaningEn: "shell", emoji: "🐚", fromModule: "m1", kind: "vocab", pos: "noun" },
  { id: "kao", kana: "かお", kanji: "顔", romaji: "kao", meaningEn: "face", emoji: "😀", fromModule: "m1", kind: "vocab", pos: "noun" },
  { id: "kame", emoji: "🐢", kana: "かめ", romaji: "kame", meaningEn: "turtle", fromModule: "m1", introducedByLessonId: "ja-m1-l7-ma", kind: "vocab", pos: "noun" },
  { id: "kinoko", emoji: "🍄", kana: "きのこ", romaji: "kinoko", meaningEn: "mushroom", fromModule: "m1", introducedByLessonId: "ja-m1-l5-na", kind: "vocab", pos: "noun" },
  { id: "sakura", emoji: "🌸", kana: "さくら", kanji: "桜", romaji: "sakura", meaningEn: "cherry blossom", fromModule: "m1", introducedByLessonId: "ja-m1-l9-ra", kind: "vocab", pos: "noun" },
  { id: "tsuki", kana: "つき", kanji: "月", romaji: "tsuki", meaningEn: "moon", emoji: "🌙", fromModule: "m1", kind: "vocab", pos: "noun" },
  { id: "fune", kana: "ふね", kanji: "船", romaji: "fune", meaningEn: "boat", emoji: "🚢", fromModule: "m1", kind: "vocab", pos: "noun" },
  { id: "hoshi", kana: "ほし", kanji: "星", romaji: "hoshi", meaningEn: "star", emoji: "⭐", fromModule: "m1", kind: "vocab", pos: "noun" },
  { id: "momo", kana: "もも", kanji: "桃", romaji: "momo", meaningEn: "peach", emoji: "🍑", fromModule: "m1", kind: "vocab", pos: "noun" },
  { id: "ue", kana: "うえ", kanji: "上", romaji: "ue", meaningEn: "on top of", emoji: "⬆️", fromModule: "m1", introducedByLessonId: "ja-m1-l1", kind: "vocab", note: "up arrow as 'on top of' cue", pos: "noun" },
  { id: "hito", kana: "ひと", kanji: "人", romaji: "hito", meaningEn: "person", emoji: "🧑", fromModule: "m1", introducedByLessonId: "ja-m1-l6-ha", kind: "vocab", note: "gender-neutral person", pos: "noun" },
  { id: "nani", kana: "なに", kanji: "何", romaji: "nani", meaningEn: "what", emoji: "❓", fromModule: "m1", introducedByLessonId: "ja-m1-l5-na", kind: "vocab", blocked: true, note: "interrogative — abstract grammar", pos: "pronoun" },
  { id: "koe", kana: "こえ", kanji: "声", romaji: "koe", meaningEn: "voice", emoji: "🗣️", fromModule: "m1", introducedByLessonId: "ja-m1-l2-ka", kind: "vocab", note: "speaking head", pos: "noun" },
  { id: "ie", kana: "いえ", kanji: "家", romaji: "ie", meaningEn: "house", emoji: "🏠", fromModule: "m1", introducedByLessonId: "ja-m1-l1", kind: "vocab", pos: "noun" },
  { id: "yama", kana: "やま", kanji: "山", romaji: "yama", meaningEn: "mountain", emoji: "⛰️", fromModule: "m1", introducedByLessonId: "ja-m1-l8-ya", kind: "vocab", pos: "noun" },
  { id: "kawa", kana: "かわ", kanji: "川 / 河", romaji: "kawa", meaningEn: "river", fromModule: "m1", introducedByLessonId: "ja-m1-l10-wa", kind: "vocab", pos: "noun" },
  { id: "asa", kana: "あさ", kanji: "朝", romaji: "asa", meaningEn: "morning", emoji: "🌅", fromModule: "m1", introducedByLessonId: "ja-m1-l3-sa", kind: "vocab", pos: "noun" },
  { id: "uta", kana: "うた", kanji: "歌", romaji: "uta", meaningEn: "song", emoji: "🎤", fromModule: "m1", introducedByLessonId: "ja-m1-l4-ta", kind: "vocab", note: "microphone as song cue (music note taken)", pos: "noun" },
  { id: "ike", kana: "いけ", kanji: "池", romaji: "ike", meaningEn: "pond", emoji: "🦆", fromModule: "m1", introducedByLessonId: "ja-m1-l2-ka", kind: "vocab", note: "duck implies pond; emoji kept 2026-09-02 despite the Wave C art decision — moduleCompiler.ts's pool/gate logic (emojiPool, invariant-30, gloss-before-production) only ever checks this raw field, never LINGO_CUSTOM_ART, so m1's authored image-mcq debut and m6's later reference both depend on it staying non-empty. lingoArtUrl(\"ja\", \"いけ\") is checked FIRST at every render call site, so the custom pond PNG still wins visually everywhere; this field only keeps the compiler's own internal gates satisfied.", pos: "noun" },
  { id: "umi", kana: "うみ", kanji: "海", romaji: "umi", meaningEn: "sea", emoji: "🌊", fromModule: "m3", kind: "vocab", note: "wave", pos: "noun" },
  { id: "inu", kana: "いぬ", kanji: "犬", romaji: "inu", meaningEn: "dog", emoji: "🐕", fromModule: "m1", introducedByLessonId: "ja-m3-3", kind: "vocab", pos: "noun" },
  { id: "neko", kana: "ねこ", kanji: "猫", romaji: "neko", meaningEn: "cat", emoji: "🐱", fromModule: "m1", introducedByLessonId: "ja-m3-3", kind: "vocab", pos: "noun" },
  { id: "sora", kana: "そら", kanji: "空", romaji: "sora", meaningEn: "sky", emoji: "🌌", fromModule: "m1", introducedByLessonId: "ja-m1-l3-sa", kind: "vocab", note: "cloud as sky proxy", pos: "noun" },
  { id: "iro", kana: "いろ", kanji: "色", romaji: "iro", meaningEn: "colour", emoji: "🎨", fromModule: "m1", introducedByLessonId: "ja-m1-l9-ra", kind: "vocab", note: "palette = colour", pos: "noun" },
  { id: "hana", kana: "はな", kanji: "花", romaji: "hana", meaningEn: "flower", emoji: "🌼", fromModule: "m1", kind: "vocab", pos: "noun" },
  { id: "yuki", kana: "ゆき", kanji: "雪", romaji: "yuki", meaningEn: "snow", emoji: "❄️", fromModule: "m1", introducedByLessonId: "ja-m1-l8-ya", kind: "vocab", pos: "noun" },
  { id: "aoi", kana: "あおい", kanji: "青い", romaji: "aoi", meaningEn: "blue", emoji: "🟦", fromModule: "m1", introducedByLessonId: "ja-m1-l1", kind: "vocab", pos: "adjective", conjugation: { class: "i-adj" } },
  { id: "hana-nose", kana: "はな", kanji: "鼻", romaji: "hana", meaningEn: "nose", emoji: "👃", fromModule: "future", freqRank: 1, kind: "vocab", pos: "noun" },
  { id: "ebi", emoji: "🦐", kana: "えび", romaji: "ebi", meaningEn: "shrimp", fromModule: "m2", introducedByLessonId: "ja-m2-b", kind: "vocab", pos: "noun" },
  { id: "kagi", kana: "かぎ", romaji: "kagi", meaningEn: "key", emoji: "🔑", fromModule: "m2", introducedByLessonId: "ja-m2-g", kind: "vocab", pos: "noun" },
  { id: "kyuuri", emoji: "🥒", kana: "きゅうり", romaji: "kyuuri", meaningEn: "cucumber", fromModule: "m2", introducedByLessonId: "ja-m2-yoon-intro", kind: "vocab", pos: "noun" },
  { id: "sanpo", kana: "さんぽ", kanji: "散歩", romaji: "sanpo", meaningEn: "walk/stroll", emoji: "🚶", fromModule: "m5", kind: "vocab", pos: "noun" },
  { id: "zou", emoji: "🐘", kana: "ぞう", kanji: "象", romaji: "zou", meaningEn: "elephant", fromModule: "m2", introducedByLessonId: "ja-m2-z", kind: "vocab", pos: "noun" },
  { id: "doa-door", emoji: "🚪", kana: "どあ", romaji: "doa", meaningEn: "door", fromModule: "m2", introducedByLessonId: "ja-m2-d", kind: "vocab", kanaDrillOnly: true, note: "ど-drill spelling only — the word is ドア (atom `doa`).", pos: "noun" },
  { id: "pan", emoji: "🍞", kana: "ぱん", romaji: "pan", meaningEn: "bread", fromModule: "m2", introducedByLessonId: "ja-m2-p", kind: "vocab", kanaDrillOnly: true, note: "ぱ-drill spelling only — the word is パン (atom `ja-m7-4-v-pan`).", pos: "noun" },
  { id: "piano", emoji: "🎹", kana: "ぴあの", romaji: "piano", meaningEn: "piano", fromModule: "m2", introducedByLessonId: "ja-m2-p", kind: "vocab", kanaDrillOnly: true, note: "ぴ-drill spelling only — the word is ピアノ (no atom yet).", pos: "noun" },
  { id: "buta", emoji: "🐷", kana: "ぶた", kanji: "豚", romaji: "buta", meaningEn: "pig", fromModule: "m2", introducedByLessonId: "ja-m2-b", kind: "vocab", pos: "noun" },
  { id: "purin", emoji: "🍮", kana: "ぷりん", romaji: "purin", meaningEn: "pudding", fromModule: "m2", introducedByLessonId: "ja-m2-p", kind: "vocab", pos: "noun" },
  { id: "pen", emoji: "🖊️", kana: "ぺん", romaji: "pen", meaningEn: "pen", fromModule: "m2", introducedByLessonId: "ja-m2-p", kind: "vocab", kanaDrillOnly: true, note: "ぺ-drill spelling only — the word is ペン (atom `ja-m4-1-v-pen`).", pos: "noun" },
  { id: "tiishatsu", kana: "ティーシャツ", romaji: "tiishatsu", meaningEn: "T-shirt", emoji: "👕", fromModule: "future", freqRank: 2, kind: "vocab", note: "Extension katakana (ティ) — never base-readable in the M3-M12 gojūon rollout; accept-romaji only. Moved off the mis-early m2 (kana module, pre-katakana) 2026-07-01 per katakana-rollout spec §4.2.", pos: "noun" },
  { id: "paatii", kana: "パーティー", romaji: "paatii", meaningEn: "party", emoji: "🎉", fromModule: "future", freqRank: 3, introducedByLessonId: "ja-m23-2-2", kind: "vocab", note: "Extension katakana (ティ) — never base-readable in the M3-M12 gojūon rollout; accept-romaji only. Moved off the mis-early m2 2026-07-01 per katakana-rollout spec §4.2, to m23 where ja-m23-2-2 formally introduces it (ましょう invitations).", pos: "noun" },
  { id: "kyou", kana: "きょう", kanji: "今日", romaji: "kyou", meaningEn: "today", emoji: "📆", fromModule: "m2", introducedByLessonId: "ja-m2-yoon-intro", kind: "vocab", note: "calendar as today cue", pos: "noun" },
  { id: "karada", kana: "からだ", kanji: "体", romaji: "karada", meaningEn: "body", emoji: "🧍", fromModule: "m2", introducedByLessonId: "ja-m2-d", kind: "vocab", pos: "noun" },
  { id: "genki", kana: "げんき", kanji: "元気", romaji: "genki", meaningEn: "health, vitality", emoji: "💪", fromModule: "m2", introducedByLessonId: "ja-m2-g", kind: "vocab", note: "flexed bicep as vitality cue", pos: "adjective", conjugation: { class: "na-adj", entryId: "genki" } },
  { id: "shashin", kana: "しゃしん", kanji: "写真", romaji: "shashin", meaningEn: "photograph", emoji: "📷", fromModule: "m2", introducedByLessonId: "ja-m2-yoon-sh-ch", kind: "vocab", pos: "noun" },
  { id: "kippu", kana: "きっぷ", kanji: "切符", romaji: "kippu", meaningEn: "ticket", emoji: "🎫", fromModule: "m2", kind: "vocab", pos: "noun" },
  { id: "kazoku", kana: "かぞく", kanji: "家族", romaji: "kazoku", meaningEn: "family", emoji: "👨‍👩‍👧", fromModule: "m2", kind: "vocab", note: "ZWJ family — renders in Noto", pos: "noun" },
  { id: "boushi", kana: "ぼうし", kanji: "帽子", romaji: "boushi", meaningEn: "hat", emoji: "🎩", fromModule: "m2", introducedByLessonId: "ja-m2-b", kind: "vocab", pos: "noun" },
  { id: "ryouri", kana: "りょうり", kanji: "料理", romaji: "ryouri", meaningEn: "cuisine", emoji: "🍱", fromModule: "m2", introducedByLessonId: "ja-m2-yoon-rare", kind: "vocab", note: "bento as cuisine proxy", pos: "noun" },
  { id: "jikan", kana: "じかん", kanji: "時間", romaji: "jikan", meaningEn: "time", emoji: "⏰", fromModule: "m2", introducedByLessonId: "ja-m2-z", kind: "vocab", pos: "noun" },
  { id: "gyuunyuu", kana: "ぎゅうにゅう", kanji: "牛乳", romaji: "gyuunyuu", meaningEn: "milk", emoji: "🥛", fromModule: "m5", kind: "vocab", pos: "noun" },
  { id: "hyaku", kana: "ひゃく", kanji: "百", romaji: "hyaku", meaningEn: "hundred", emoji: "💯", fromModule: "m2", introducedByLessonId: "ja-m2-yoon-rare", kind: "vocab", pos: "number" },
  { id: "megane", kana: "めがね", kanji: "眼鏡", romaji: "megane", meaningEn: "glasses", emoji: "👓", fromModule: "m2", introducedByLessonId: "ja-m2-g", kind: "vocab", pos: "noun" },
  { id: "mado", kana: "まど", kanji: "窓", romaji: "mado", meaningEn: "window", emoji: "🪟", fromModule: "m2", kind: "vocab", pos: "noun" },
  { id: "asobu", kana: "あそぶ", kanji: "遊ぶ", romaji: "asobu", meaningEn: "to play", emoji: "🎲", fromModule: "m4", kind: "vocab", note: "die as play proxy", pos: "verb", conjugation: { class: "godan", entryId: "asobu" } },
  { id: "enpitsu", kana: "えんぴつ", kanji: "鉛筆", romaji: "enpitsu", meaningEn: "pencil", emoji: "✏️", fromModule: "m2", kind: "vocab", pos: "noun" },
  { id: "denwa", kana: "でんわ", kanji: "電話", romaji: "denwa", meaningEn: "telephone", emoji: "📞", fromModule: "m2", introducedByLessonId: "ja-m2-d", kind: "vocab", pos: "noun" },
  { id: "kaze-wind", kana: "かぜ", kanji: "風", romaji: "kaze", meaningEn: "wind", emoji: "🌬️", fromModule: "m2", introducedByLessonId: "ja-m2-z", kind: "vocab", note: "wind face", pos: "noun" },
  { id: "kaze", kana: "かぜ", kanji: "風邪", romaji: "kaze", meaningEn: "a cold", emoji: "🤧", fromModule: "m2", introducedByLessonId: "ja-m2-z", kind: "vocab", note: "sneezing face", pos: "noun" },
  { id: "ja-m3-3-adj-big", kana: "あれは おおきいです", romaji: "are wa ookii desu", meaningEn: "That (over there) is big.", fromModule: "future", introducedByLessonId: "ja-m3-3", kind: "phrase", pos: "expression" },
  { id: "p-ka", kana: "か", romaji: "ka", meaningEn: "question particle", fromModule: "m3", introducedByLessonId: "ja-m3-2-1", kind: "particle", pos: "particle" },
  { id: "ja-m3-3-adj-blue", kana: "これは あおいです", romaji: "kore wa aoi desu", meaningEn: "This is blue.", fromModule: "future", introducedByLessonId: "ja-m3-3", kind: "phrase", pos: "expression" },
  { id: "ja-m3-7-warmup-sumimasen", kana: "すみません", romaji: "sumimasen", meaningEn: "Excuse me", fromModule: "m3", introducedByLessonId: "ja-m3-7", kind: "vocab", pos: "interjection" },
  { id: "ja-m3-2-v-nihonjin", kana: "にほんじん", kanji: "日本人", romaji: "nihonjin", meaningEn: "Japanese (person)", fromModule: "m3", introducedByLessonId: "ja-m3-2", kind: "vocab", pos: "noun" },
  { id: "p-wa", kana: "は", romaji: "wa", meaningEn: "topic marker", fromModule: "m3", introducedByLessonId: "ja-m3-4-1", kind: "particle", pos: "particle" },
  { id: "ja-m3-2-v-amerikajin", kana: "アメリカじん", kanji: "アメリカ人", romaji: "amerikajin", meaningEn: "American (person)", fromModule: "m3", introducedByLessonId: "ja-m3-2", kind: "vocab", pos: "noun" },
  { id: "ja-m3-1-coffee", kana: "コーヒー", romaji: "koohii", meaningEn: "coffee", emoji: "☕", fromModule: "m14", introducedByLessonId: "ja-m8-kata", kind: "phrase", note: "Kept as the M3 why-katakana hook (ja-m3-1) but SRS-attributed to m8, where the ハ row makes コーヒー fully base-readable (katakana-rollout spec §4.2 known-safe move). Unlocks on ja-m8-kata completion.", pos: "expression" },
  { id: "ja-m3-1-coffee-desu", kana: "コーヒー です", romaji: "koohii desu", meaningEn: "It's coffee.", fromModule: "future", introducedByLessonId: "ja-m3-1", kind: "phrase", pos: "expression" },
  { id: "ja-m3-1-taxi", kana: "タクシー", romaji: "takushii", meaningEn: "taxi", emoji: "🚕", fromModule: "future", introducedByLessonId: "ja-m3-1", kind: "phrase", pos: "expression" },
  { id: "ja-m3-1-taxi-desu", kana: "タクシー です", romaji: "takushii desu", meaningEn: "It's a taxi.", fromModule: "future", introducedByLessonId: "ja-m3-1", kind: "phrase", pos: "expression" },
  { id: "biiru", kana: "ビール", romaji: "biiru", meaningEn: "beer", emoji: "🍺", fromModule: "m11", introducedByLessonId: "ja-m11-kata", kind: "vocab", note: "SRS-attributed to m11 — the ラ row makes ビール base-readable (spec §4.2 known-safe move). Unlocks on ja-m11-kata.", pos: "noun" },
  { id: "hoteru", kana: "ホテル", romaji: "hoteru", meaningEn: "hotel", emoji: "🏨", fromModule: "m23", introducedByLessonId: "ja-m11-kata", kind: "vocab", note: "SRS-attributed to m11 — ル (ラ row) is ホテル's last base glyph (spec §4.2). Unlocks on ja-m11-kata.", pos: "noun" },
  { id: "resutoran", kana: "レストラン", romaji: "resutoran", meaningEn: "restaurant", emoji: "🍽️", fromModule: "m12", introducedByLessonId: "ja-m12-kata", kind: "vocab", note: "SRS-attributed to m12 — ン (ワ row) is レストラン's last base glyph; base katakana complete (spec §4.2). Unlocks on ja-m12-kata.", pos: "noun" },
  { id: "ja-m3-2-v-sensei", kana: "せんせい", kanji: "先生", romaji: "sensei", meaningEn: "teacher, doctor", emoji: "🧑‍🏫", fromModule: "m3", introducedByLessonId: "ja-m3-2", kind: "vocab", pos: "noun" },
  { id: "ja-m3-3-v-tomodachi", kana: "ともだち", kanji: "友達", romaji: "tomodachi", meaningEn: "friend", emoji: "👫", fromModule: "m3", introducedByLessonId: "ja-m3-3", kind: "vocab", pos: "noun" },
  { id: "ja-m3-2-v-namae", kana: "なまえ", kanji: "名前", romaji: "namae", meaningEn: "name", emoji: "🪪", fromModule: "m4", introducedByLessonId: "ja-m3-2", kind: "vocab", note: "ID card", pos: "noun" },
  { id: "ja-m3-2-v-gakusei", kana: "がくせい", kanji: "学生", romaji: "gakusei", meaningEn: "student", emoji: "🎓", fromModule: "m3", introducedByLessonId: "ja-m3-2", kind: "vocab", pos: "noun" },
  { id: "ja-m3-3-v-hon", kana: "ほん", kanji: "本", romaji: "hon", meaningEn: "book", emoji: "📖", fromModule: "m1", introducedByLessonId: "ja-m3-3", kind: "vocab", pos: "noun" },
  { id: "ja-m3-3-v-mizu", kana: "みず", kanji: "水", romaji: "mizu", meaningEn: "water", emoji: "💧", fromModule: "m2", introducedByLessonId: "ja-m3-3", kind: "vocab", pos: "noun" },
  // ── m3-neo pilot (dict-form-first rewrite, spine s03) — interaction layer ──
  { id: "un", kana: "うん", romaji: "un", meaningEn: "yeah (casual yes)", fromModule: "m3", introducedByLessonId: "ja-m3-neo-4", kind: "vocab", blocked: true, excludeFromSrs: true, note: "m3-neo pilot: casual agreement, CEJC #1 — RECOGNITION only. blocked (no image MCQs) + excludeFromSrs (the SRS deck has no per-modality split, and the production ruling is deferred to the register module — spine n15), so it never enters production drills or pool draws.", pos: "interjection" },
  { id: "sou", kana: "そう", romaji: "sou", meaningEn: "that's right", fromModule: "m3", introducedByLessonId: "ja-m3-neo-4", kind: "vocab", blocked: true, excludeFromSrs: true, note: "m3-neo pilot: agreement/acknowledgement, CEJC #9 — RECOGNITION only (abstract function word; same exclusion rationale as うん).", pos: "interjection" },
  { id: "arigatou-casual", kana: "ありがとう", romaji: "arigatou", meaningEn: "thanks (casual)", fromModule: "m3", introducedByLessonId: "ja-m3-neo-5", kind: "phrase", note: "m3-neo pilot: casual thanks — register pair with ありがとうございます, taught as a chunk (guide type 5). Found untracked by the 2026-07-20 vocab-provenance audit.", pos: "expression" },
  { id: "hajimemashite", kana: "はじめまして", romaji: "hajimemashite", meaningEn: "Nice to meet you", fromModule: "m3", introducedByLessonId: "ja-m3-neo-5", kind: "phrase", note: "m3-neo pilot: first-meeting formula taught as an unanalyzed chunk (guide type 5)", pos: "expression" },
  { id: "anata", kana: "あなた", romaji: "anata", meaningEn: "you", emoji: "🫵", fromModule: "future", freqRank: 4, introducedByLessonId: "ja-m4-4-1", kind: "vocab", blocked: true, note: "pronoun — rubric explicit block", pos: "pronoun" },
  { id: "ja-m4-3-v-isu", kana: "いす", romaji: "isu", meaningEn: "chair", emoji: "🪑", fromModule: "m4", introducedByLessonId: "ja-m4-3", kind: "vocab", pos: "noun" },
  { id: "ja-m4-1-v-kaban", kana: "かばん", romaji: "kaban", meaningEn: "bag, basket", emoji: "👜", fromModule: "m2", introducedByLessonId: "ja-m4-1", kind: "vocab", pos: "noun" },
  { id: "p-ga", kana: "が", romaji: "ga", meaningEn: "subject marker", fromModule: "m6", introducedByLessonId: "ja-m6-4-1", kind: "particle", pos: "particle" },
  { id: "ja-m4-1-v-keitai", emoji: "📱", kana: "けいたい", romaji: "keitai", meaningEn: "Mobile phone", fromModule: "m4", introducedByLessonId: "ja-m4-1", kind: "vocab", pos: "noun" },
  { id: "kore", kana: "これ", romaji: "kore", shortGloss: "this (by me)", meaningEn: "this", emoji: "👇", fromModule: "m1", introducedByLessonId: "ja-m1-l9-ra", kind: "vocab", blocked: true, note: "demonstrative — per rubric", pos: "pronoun" },
  { id: "chichi", kana: "ちち", kanji: "父", romaji: "chichi", meaningEn: "(my) father", emoji: "👨‍👦", fromModule: "m17", introducedByLessonId: "ja-m4-1-1", blocked: true, kind: "vocab", pos: "noun", note: "no picture debut (inv-30 census 2026-08-20): named first by its own module's rule card, which compiles to a pinned step no debut MCQ can precede (m20/m21 card-steals-the-picture rule; netsu precedent)" },
  { id: "p-to", kana: "と", romaji: "to", meaningEn: "and / with", fromModule: "m4", introducedByLessonId: "ja-m4-1-1", kind: "particle", pos: "particle" },
  { id: "dore", kana: "どれ", romaji: "dore", meaningEn: "which (of three or more)", emoji: "🤔", fromModule: "m4", introducedByLessonId: "ja-m4-4-1", kind: "vocab", blocked: true, note: "demonstrative — rubric blocks", pos: "pronoun" },
  { id: "nihon", kana: "にほん", kanji: "日本", romaji: "nihon", meaningEn: "Japan", emoji: "🇯🇵", fromModule: "m4", introducedByLessonId: "ja-m4-2-1", kind: "vocab", pos: "proper-noun" },
  { id: "p-no", kana: "の", romaji: "no", meaningEn: "possession", fromModule: "m4", introducedByLessonId: "ja-m4-2-1", kind: "particle", pos: "particle" },
  { id: "haha", kana: "はは", kanji: "母", romaji: "haha", meaningEn: "(my) mother", emoji: "👩‍👦", fromModule: "m17", introducedByLessonId: "ja-m4-1-1", blocked: true, kind: "vocab", pos: "noun", note: "no picture debut (inv-30 census 2026-08-20): named first by its own module's rule card, which compiles to a pinned step no debut MCQ can precede (m20/m21 card-steals-the-picture rule; netsu precedent)" },
  { id: "p-mo", kana: "も", romaji: "mo", meaningEn: "also", fromModule: "m3", introducedByLessonId: "ja-m3-7", kind: "particle", note: "Formally taught in M3-7 via RULE_MO + phrase exposure + dialogue use (moved from M4 2026-05-21 to close the original curriculum-audit 'も missing' gap).", pos: "particle" },
  { id: "watashi", kana: "わたし", kanji: "私", romaji: "watashi", meaningEn: "I/me", emoji: "🙋", fromModule: "m1", introducedByLessonId: "ja-m4-2-1", kind: "vocab", pos: "pronoun" },
  { id: "amerika", kana: "アメリカ", romaji: "amerika", meaningEn: "America", emoji: "🇺🇸", fromModule: "m4", introducedByLessonId: "ja-m4-2-2", kind: "vocab", pos: "proper-noun" },
  { id: "ja-m4-1-v-kamera", kana: "カメラ", romaji: "kamera", meaningEn: "camera", emoji: "📷", fromModule: "m15", introducedByLessonId: "ja-m11-kata", kind: "vocab", note: "Still exposed (romaji-assisted) in m4, but SRS-attributed to m11 where ラ makes カメラ base-readable (spec §4.2). Unlocks on ja-m11-kata.", pos: "noun" },
  { id: "ja-m4-1-v-pen", kana: "ペン", romaji: "pen", meaningEn: "pen", emoji: "🖊️", fromModule: "m12", introducedByLessonId: "ja-m12-kata", kind: "vocab", note: "Katakana ペン (distinct from hiragana ぺん atom `pen`). Exposed in m4 but SRS-attributed to m12 where ン completes base readability (spec §4.2). Unlocks on ja-m12-kata.", pos: "noun" },
  { id: "nan", kana: "なん", kanji: "何", romaji: "nan", meaningEn: "what", emoji: "❓", fromModule: "m4", introducedByLessonId: "ja-m4-4-1", kind: "vocab", blocked: true, note: "interrogative — abstract grammar", pos: "pronoun" },
  { id: "ja-m4-3-v-kasa", kana: "かさ", kanji: "傘", romaji: "kasa", meaningEn: "umbrella", emoji: "☂️", fromModule: "m4", introducedByLessonId: "ja-m4-3", kind: "vocab", pos: "noun" },
  { id: "ani", kana: "あに", kanji: "兄", romaji: "ani", meaningEn: "(humble) older brother", emoji: "👦", fromModule: "m17", introducedByLessonId: "ja-m3-5", blocked: true, kind: "vocab", note: "boy; pair with phrase context per rubric. M3-5 formal intro added 2026-05-21 to close the M3 forward-leak — M3-5/6/7 already used あに as a re-exposure carrier (Wave-4B n=1 fix) so the atom is fully drilled by M3 even though it was previously tagged as M4 vocab.; no picture debut (inv-30 census 2026-08-20): おとうと's 👦 owns the glyph (m19/m24 ruling: a debut distractor the picture names equally well); also long in WORD_IMAGE_MCQ_BLOCKLIST (age cue carried by kanji, not face)", pos: "noun" },
  { id: "ane", kana: "あね", kanji: "姉", romaji: "ane", meaningEn: "(humble) older sister", emoji: "👩", fromModule: "m17", introducedByLessonId: "ja-m4-1-1", blocked: true, kind: "vocab", note: "woman; kanji 姉 carries older cue; no picture debut (inv-30 census 2026-08-20): named first by its own module's rule card, which compiles to a pinned step no debut MCQ can precede (m20/m21 card-steals-the-picture rule; netsu precedent)", pos: "noun" },
  { id: "ja-m4-3-v-tegami", kana: "てがみ", kanji: "手紙", romaji: "tegami", meaningEn: "letter", emoji: "✉️", fromModule: "m4", introducedByLessonId: "ja-m4-3", kind: "vocab", pos: "noun" },
  { id: "shinbun", kana: "しんぶん", kanji: "新聞", romaji: "shinbun", meaningEn: "newspaper", emoji: "📰", fromModule: "future", freqRank: 5, introducedByLessonId: "ja-m4-1-1", kind: "vocab", pos: "noun" },
  { id: "tokei", kana: "とけい", kanji: "時計", romaji: "tokei", meaningEn: "watch, clock", emoji: "⌚", fromModule: "m1", introducedByLessonId: "ja-m1-l4-ta", kind: "vocab", pos: "noun" },
  { id: "tsukue", kana: "つくえ", kanji: "机", romaji: "tsukue", meaningEn: "desk", emoji: "🪑", fromModule: "m27", introducedByLessonId: "ja-m4-1-1", kind: "vocab", blocked: true, note: "chair-adjacent; closest furniture glyph (no desk emoji) — blocked because 🪑 is shared with いす, a met word (m27's shared-glyph ruling)", pos: "noun" },
  { id: "ja-m4-3-v-jitensha", kana: "じてんしゃ", kanji: "自転車", romaji: "jitensha", meaningEn: "bicycle", emoji: "🚲", fromModule: "m4", introducedByLessonId: "ja-m4-3", kind: "vocab", pos: "noun" },
  { id: "ja-m4-5-v-dare", kana: "だれ", kanji: "誰", romaji: "dare", meaningEn: "who", emoji: "🙋‍♂️", fromModule: "m4", introducedByLessonId: "ja-m4-5", kind: "vocab", blocked: true, note: "question pronoun", pos: "pronoun" },
  { id: "ja-m4-1-v-kuruma", kana: "くるま", kanji: "車", romaji: "kuruma", meaningEn: "car, vehicle", emoji: "🚗", fromModule: "m4", introducedByLessonId: "ja-m4-1", kind: "vocab", pos: "noun" },
  { id: "ja-m4-3-v-jisho", kana: "じしょ", kanji: "辞書", romaji: "jisho", meaningEn: "dictionary", emoji: "📖", fromModule: "m4", introducedByLessonId: "ja-m4-3", kind: "vocab", note: "open book", pos: "noun" },
  { id: "zasshi", kana: "ざっし", kanji: "雑誌", romaji: "zasshi", meaningEn: "magazine", emoji: "📖", fromModule: "future", freqRank: 6, introducedByLessonId: "ja-m4-1-1", kind: "vocab", note: "open book as magazine proxy", pos: "noun" },
  { id: "ja-m5-7-v-arigatou", kana: "ありがとうございます", romaji: "arigatou gozaimasu", meaningEn: "Thank you (polite)", fromModule: "m3", introducedByLessonId: "ja-m3-neo-5", kind: "phrase", note: "m5→m3 (2026-08-20 drift guard): the m3-neo-5 phrases lesson is the real teach (audio primer lc-arigatou); the old ja-m5-7 pointer was dangling", pos: "expression" },
  { id: "ja-m5-4-v-ikura", kana: "いくら", romaji: "ikura", meaningEn: "how much?", emoji: "💲", fromModule: "m5", introducedByLessonId: "ja-m5-4", kind: "vocab", blocked: true, note: "question word", pos: "adverb" },
  { id: "ja-m5-4-v-en", kana: "えん", kanji: "円", romaji: "en", meaningEn: "Yen", fromModule: "m5", introducedByLessonId: "ja-m5-4", kind: "vocab", pos: "noun" },
  { id: "kara", kana: "から", romaji: "kara", meaningEn: "from (origin)", fromModule: "m5", introducedByLessonId: "ja-m15-neo-8", kind: "vocab", pos: "particle" },
  { id: "ja-m5-2-kudasai-card", kana: "ください", romaji: "kudasai", meaningEn: "please", emoji: "🤲", fromModule: "m8", introducedByLessonId: "ja-m5-2", kind: "phrase", blocked: true, note: "polite-request auxiliary; function word", pos: "expression" },
  { id: "ja-m5-3-v-gonin", kana: "ごにん", kanji: "五人", romaji: "go nin", meaningEn: "5 people", fromModule: "m21", introducedByLessonId: "ja-m21-neo-6", kind: "vocab", pos: "number" },
  { id: "ja-m5-3-v-sannin", kana: "さんにん", kanji: "三人", romaji: "san nin", meaningEn: "3 people", fromModule: "m17", introducedByLessonId: "ja-m5-3", kind: "vocab", pos: "number" },
  { id: "ja-m5-3-v-yonin", kana: "よにん", kanji: "四人", romaji: "yo nin", meaningEn: "4 people", fromModule: "m17", introducedByLessonId: "ja-m5-3", kind: "vocab", pos: "number" },
  { id: "ja-m5-4-v-ocha", kana: "おちゃ", kanji: "お茶", romaji: "ocha", meaningEn: "green tea", emoji: "🍵", fromModule: "m2", introducedByLessonId: "ja-m5-4", kind: "vocab", pos: "noun" },
  { id: "ja-m5-4-v-okane", kana: "おかね", kanji: "お金", romaji: "okane", meaningEn: "money", emoji: "💰", fromModule: "m27", introducedByLessonId: "ja-m5-4", kind: "vocab", pos: "noun" },
  { id: "ja-m5-1-v-1", kana: "いち", kanji: "一", romaji: "ichi", meaningEn: "one", emoji: "1️⃣", fromModule: "m9", introducedByLessonId: "ja-m5-1", kind: "vocab", pos: "number" },
  { id: "ja-m5-5-v-hitotsu", kana: "ひとつ", kanji: "一つ", romaji: "hitotsu", meaningEn: "one", emoji: "1️⃣", fromModule: "m9", introducedByLessonId: "ja-m5-5", kind: "vocab", pos: "number" },
  { id: "ja-m5-3-v-hitori", kana: "ひとり", kanji: "一人", romaji: "hitori", meaningEn: "one person", emoji: "🧍", fromModule: "m17", introducedByLessonId: "ja-m5-3", blocked: true, kind: "vocab", note: "single standing figure as one-person cue; no picture debut (inv-30 census 2026-08-20): からだ/たつ's 🧍 owns the glyph (m19/m24 ruling: a debut distractor the picture names equally well)", pos: "number" },
  { id: "ja-m5-2-v-7", kana: "なな", kanji: "七", romaji: "nana", meaningEn: "seven", emoji: "7️⃣", fromModule: "m9", introducedByLessonId: "ja-m5-2", kind: "vocab", pos: "number" },
  { id: "ja-m5-1-v-3", kana: "さん", kanji: "三", romaji: "san", meaningEn: "three", emoji: "3️⃣", fromModule: "m9", introducedByLessonId: "ja-m5-1", kind: "vocab", pos: "number" },
  { id: "ja-m5-5-v-mittsu", kana: "みっつ", kanji: "三つ", romaji: "mittsu", meaningEn: "three", emoji: "3️⃣", fromModule: "m9", introducedByLessonId: "ja-m5-5", kind: "vocab", pos: "number" },
  { id: "ja-m5-2-v-9", kana: "きゅう", kanji: "九", romaji: "kyuu", meaningEn: "nine", emoji: "9️⃣", fromModule: "m9", introducedByLessonId: "ja-m5-2", kind: "vocab", pos: "number" },
  { id: "ja-m5-1-v-2", kana: "に", kanji: "二", romaji: "ni", meaningEn: "two", emoji: "2️⃣", fromModule: "future", freqRank: 8, introducedByLessonId: "ja-m5-1", kind: "vocab", pos: "number" },
  { id: "ja-m5-5-v-futatsu", kana: "ふたつ", kanji: "二つ", romaji: "futatsu", meaningEn: "two", emoji: "2️⃣", fromModule: "m9", introducedByLessonId: "ja-m5-5", kind: "vocab", pos: "number" },
  { id: "ja-m5-3-v-futari", kana: "ふたり", kanji: "二人", romaji: "futari", meaningEn: "two people", emoji: "👥", fromModule: "m17", introducedByLessonId: "ja-m5-3", blocked: true, kind: "vocab", note: "two silhouettes; no picture debut (inv-30 census 2026-08-20): named first by its own module's rule card, which compiles to a pinned step no debut MCQ can precede (m20/m21 card-steals-the-picture rule; netsu precedent)", pos: "number" },
  { id: "ja-m5-1-v-5", kana: "ご", kanji: "五", romaji: "go", meaningEn: "five", emoji: "5️⃣", fromModule: "m9", introducedByLessonId: "ja-m5-1", kind: "vocab", pos: "number" },
  { id: "ja-m5-2-v-8", kana: "はち", kanji: "八", romaji: "hachi", meaningEn: "eight", emoji: "8️⃣", fromModule: "m9", introducedByLessonId: "ja-m5-2", kind: "vocab", pos: "number" },
  { id: "ja-m5-2-v-6", kana: "ろく", kanji: "六", romaji: "roku", meaningEn: "six", emoji: "6️⃣", fromModule: "m9", introducedByLessonId: "ja-m5-2", kind: "vocab", pos: "number" },
  { id: "ja-m5-2-v-10", kana: "じゅう", kanji: "十", romaji: "juu", meaningEn: "ten", emoji: "🔟", fromModule: "m2", introducedByLessonId: "ja-m5-2", kind: "vocab", pos: "number" },
  { id: "ja-m5-1-v-4", kana: "よん", kanji: "四", romaji: "yon", meaningEn: "four", emoji: "4️⃣", fromModule: "m9", introducedByLessonId: "ja-m5-1", kind: "vocab", pos: "number" },
  { id: "arimasu", kana: "あります", romaji: "arimasu", meaningEn: "exists (thing)", emoji: "📦", fromModule: "m6", introducedByLessonId: "ja-m7-neo-7", kind: "vocab", pos: "verb" },
  { id: "imasu", kana: "います", romaji: "imasu", meaningEn: "exists (alive)", emoji: "🧑", fromModule: "future", freqRank: 9, introducedByLessonId: "ja-m6-2-1", kind: "vocab", pos: "verb" },
  // Neo m6 (Negatives & Existence): existence negatives. ない is the IRREGULAR
  // negative of ある; いない the ordinary る-drop negative of いる (2026-07-20).
  // Neo m6 ない-form atoms (2026-07-24): registered so the romaji lexicon
  // word-groups them on tiles ("shinai", never "shi nai" — Spencer walk)
  // and provenance/exposure see them. excludeFromSrs: their retention is
  // tracked by the conjugation transform cells (conj:nai:<class>), not
  // vocab flashcards — a たべない flip-card would double-count たべる.
  // blocked: negatives aren't imageable.
  { id: "ja-m6-neo-tabenai", kana: "たべない", romaji: "tabenai", meaningEn: "won't eat / don't eat", shortGloss: "won't eat", fromModule: "m6", introducedByLessonId: "ja-m6-neo-1", kind: "vocab", blocked: true, excludeFromSrs: true, pos: "verb" },
  { id: "ja-m6-neo-minai", kana: "みない", romaji: "minai", meaningEn: "won't watch / don't watch", shortGloss: "won't watch", fromModule: "m6", introducedByLessonId: "ja-m6-neo-1", kind: "vocab", blocked: true, excludeFromSrs: true, pos: "verb" },
  { id: "ja-m6-neo-nomanai", kana: "のまない", romaji: "nomanai", meaningEn: "won't drink / don't drink", shortGloss: "won't drink", fromModule: "m6", introducedByLessonId: "ja-m6-neo-2", kind: "vocab", blocked: true, excludeFromSrs: true, pos: "verb" },
  { id: "ja-m6-neo-ikanai", kana: "いかない", romaji: "ikanai", meaningEn: "won't go / isn't going", shortGloss: "won't go", fromModule: "m6", introducedByLessonId: "ja-m6-neo-2", kind: "vocab", blocked: true, excludeFromSrs: true, pos: "verb" },
  { id: "ja-m6-neo-kawanai", kana: "かわない", romaji: "kawanai", meaningEn: "won't buy / don't buy", shortGloss: "won't buy", fromModule: "m6", introducedByLessonId: "ja-m6-neo-2", kind: "vocab", blocked: true, excludeFromSrs: true, pos: "verb" },
  { id: "ja-m6-neo-wakaranai", kana: "わからない", romaji: "wakaranai", meaningEn: "don't understand / don't get it", shortGloss: "don't understand", fromModule: "m6", introducedByLessonId: "ja-m6-neo-2", kind: "vocab", blocked: true, excludeFromSrs: true, pos: "verb" },
  { id: "ja-m6-neo-shinai", kana: "しない", romaji: "shinai", meaningEn: "won't do / don't do", shortGloss: "won't do", fromModule: "m6", introducedByLessonId: "ja-m6-neo-3", kind: "vocab", blocked: true, excludeFromSrs: true, pos: "verb" },
  { id: "ja-m6-neo-konai", kana: "こない", romaji: "konai", meaningEn: "won't come / isn't coming", shortGloss: "won't come", fromModule: "m6", introducedByLessonId: "ja-m6-neo-3", kind: "vocab", blocked: true, excludeFromSrs: true, pos: "verb" },
  { id: "ja-m6-neo-nai-aru", kana: "ない", romaji: "nai", meaningEn: "there isn't (neg. of ある)", fromModule: "m6", introducedByLessonId: "ja-m6-neo-6", kind: "vocab", pos: "verb" },
  { id: "ja-m6-neo-inai", kana: "いない", romaji: "inai", meaningEn: "there isn't (neg. of いる)", fromModule: "m6", introducedByLessonId: "ja-m6-neo-6", kind: "vocab", pos: "verb" },
  { id: "ja-m6-1-uchi", kana: "うち", romaji: "uchi", meaningEn: "Home / my place", fromModule: "m16", introducedByLessonId: "ja-m6-1", kind: "vocab", pos: "noun" },
  { id: "kuukou", kana: "くうこう", kanji: "空港", romaji: "kuukou", meaningEn: "airport", emoji: "✈️", fromModule: "m23", introducedByLessonId: "ja-m6-1-1", blocked: true, kind: "vocab", pos: "noun", note: "no picture debut (inv-30 census 2026-08-20): りょこう's ✈️ owns the glyph (m19/m24 ruling: a debut distractor the picture names equally well)" },
  { id: "p-de", kana: "で", romaji: "de", meaningEn: "at / by means of", fromModule: "m6", introducedByLessonId: "ja-m6-3-1", kind: "particle", pos: "particle" },
  { id: "ja-m6-8-warm-doko", kana: "どこ", romaji: "doko", meaningEn: "where", fromModule: "m6", introducedByLessonId: "ja-m6-8", kind: "vocab", blocked: true, note: "interrogative demonstrative; abstract", pos: "pronoun" },
  { id: "p-ni", kana: "に", romaji: "ni", meaningEn: "to / at / location", fromModule: "m6", introducedByLessonId: "ja-m6-2-1", kind: "particle", pos: "particle" },
  { id: "ja-m6-1-konbini", emoji: "🏪", kana: "コンビニ", romaji: "konbini", meaningEn: "Convenience store", fromModule: "m12", introducedByLessonId: "ja-m12-kata", kind: "vocab", note: "Exposed (romaji) in m6, but SRS-attributed to m12 where ン completes base readability (spec §4.2). Unlocks on ja-m12-kata.", pos: "noun" },
  { id: "ja-m6-1-toire", kana: "トイレ", romaji: "toire", meaningEn: "toilet", emoji: "🚽", fromModule: "m11", introducedByLessonId: "ja-m11-kata", kind: "vocab", note: "Exposed in m6, SRS-attributed to m11 where レ (ラ row) makes トイレ base-readable (spec §4.2). Unlocks on ja-m11-kata.", pos: "noun" },
  { id: "basu", kana: "バス", romaji: "basu", meaningEn: "bus", emoji: "🚌", fromModule: "m19", introducedByLessonId: "ja-m8-kata", kind: "vocab", note: "SRS-attributed to m8 — the ハ row (バ = ハ+dakuten) makes バス base-readable (spec §4.2 known-safe move). Unlocks on ja-m8-kata.", pos: "noun" },
  { id: "ja-m6-1-koen", kana: "こうえん", kanji: "公園", romaji: "kouen", meaningEn: "park", emoji: "🏞️", fromModule: "m32", introducedByLessonId: "ja-m6-1", blocked: true, kind: "vocab", pos: "noun", note: "no picture debut (inv-30 census 2026-08-20): かわ's 🏞️ owns the glyph (m19/m24 ruling: a debut distractor the picture names equally well)" },
  { id: "toshokan", kana: "としょかん", kanji: "図書館", romaji: "toshokan", meaningEn: "library", emoji: "📚", fromModule: "m19", introducedByLessonId: "ja-m6-3-1", kind: "vocab", pos: "noun" },
  { id: "chikatetsu", kana: "ちかてつ", kanji: "地下鉄", romaji: "chikatetsu", meaningEn: "underground train", emoji: "🚇", fromModule: "m19", introducedByLessonId: "ja-m6-1-1", kind: "vocab", pos: "noun" },
  { id: "ja-m6-1-gakkou", kana: "がっこう", kanji: "学校", romaji: "gakkou", meaningEn: "school", emoji: "🏫", fromModule: "m19", introducedByLessonId: "ja-m6-1", kind: "vocab", pos: "noun" },
  { id: "ja-m6-1-mise", kana: "みせ", kanji: "店", romaji: "mise", meaningEn: "shop", emoji: "🏪", fromModule: "m8", introducedByLessonId: "ja-m6-1", kind: "vocab", pos: "noun" },
  { id: "byouin", kana: "びょういん", kanji: "病院", romaji: "byouin", meaningEn: "hospital", emoji: "🏥", fromModule: "m19", introducedByLessonId: "ja-m6-1-1", kind: "vocab", pos: "noun" },
  { id: "ja-m6-8-warm-chikai", kana: "ちかい", kanji: "近い", romaji: "chikai", meaningEn: "near", emoji: "📍", fromModule: "m20", introducedByLessonId: "ja-m6-8", kind: "vocab", note: "map pin as proximity cue (weak)", pos: "adjective", conjugation: { class: "i-adj", entryId: "chikai" } },
  { id: "ja-m6-8-warm-tooi", kana: "とおい", kanji: "遠い", romaji: "tooi", meaningEn: "far", emoji: "🔭", fromModule: "m20", introducedByLessonId: "ja-m6-8", kind: "vocab", note: "telescope = far / distant", pos: "adjective", conjugation: { class: "i-adj", entryId: "tooi" } },
  { id: "ja-m6-1-heya", kana: "へや", kanji: "部屋", romaji: "heya", meaningEn: "room", emoji: "🚪", fromModule: "m27", introducedByLessonId: "ja-m6-1", blocked: true, kind: "vocab", note: "door as room proxy; concrete spatial referent; no picture debut (inv-30 census 2026-08-20): はいる's 🚪 owns the glyph (m19/m24 ruling: a debut distractor the picture names equally well)", pos: "noun" },
  { id: "yuubinkyoku", kana: "ゆうびんきょく", kanji: "郵便局", romaji: "yuubinkyoku", meaningEn: "post office", emoji: "🏤", fromModule: "future", freqRank: 10, introducedByLessonId: "ja-m6-1-1", kind: "vocab", note: "post office building", pos: "noun" },
  { id: "ginkou", kana: "ぎんこう", kanji: "銀行", romaji: "ginkou", meaningEn: "bank", emoji: "🏦", fromModule: "future", freqRank: 11, introducedByLessonId: "ja-m6-8-2", kind: "vocab", pos: "noun" },
  { id: "densha", kana: "でんしゃ", kanji: "電車", romaji: "densha", meaningEn: "electric train", emoji: "🚆", fromModule: "m19", introducedByLessonId: "ja-m6-3-1", kind: "vocab", pos: "noun" },
  { id: "ja-m6-1-eki", kana: "えき", kanji: "駅", romaji: "eki", meaningEn: "station", emoji: "🚉", fromModule: "m1", introducedByLessonId: "ja-m6-1", kind: "vocab", note: "station emoji", pos: "noun" },
  { id: "ikimasu", kana: "いきます", romaji: "ikimasu", meaningEn: "go (polite)", emoji: "🚶", fromModule: "m7", introducedByLessonId: "ja-m7-neo-2", kind: "vocab", pos: "verb" },
  { id: "ja-m7-8-warm-irasshai", kana: "いらっしゃいませ", romaji: "irasshaimase", meaningEn: "Welcome (shop greeting)", fromModule: "m7", introducedByLessonId: "ja-m7-8", kind: "phrase", pos: "expression" },
  { id: "kakimasu", kana: "かきます", romaji: "kakimasu", meaningEn: "write (polite)", emoji: "✍️", fromModule: "future", freqRank: 12, introducedByLessonId: "ja-m7-2-1", kind: "vocab", pos: "verb" },
  { id: "ja-m7-8-warm-kashikomari", kana: "かしこまりました", romaji: "kashikomarimashita", meaningEn: "Understood. (formal acknowledgement)", fromModule: "future", introducedByLessonId: "ja-m7-8", kind: "phrase", pos: "expression" },
  { id: "ja-m7-8-warm-gochuumon", kana: "ごちゅうもんは", romaji: "go-chuumon wa", meaningEn: "Your order? (polite)", fromModule: "future", introducedByLessonId: "ja-m7-8", kind: "phrase", pos: "expression" },
  { id: "ja-m7-4-v-sake", emoji: "🍶", kana: "さけ", kanji: "酒", romaji: "sake", meaningEn: "Sake (rice wine)", fromModule: "future", freqRank: 13, introducedByLessonId: "ja-m7-4", kind: "vocab", pos: "noun" },
  { id: "ja-m7-4-v-sushi", emoji: "🍣", kana: "すし", kanji: "寿司", romaji: "sushi", meaningEn: "Sushi", fromModule: "m1", introducedByLessonId: "ja-m7-4", kind: "vocab", pos: "noun" },
  { id: "tabemasu", kana: "たべます", romaji: "tabemasu", meaningEn: "eat (polite)", emoji: "🍴", fromModule: "m7", introducedByLessonId: "ja-m7-neo-1", kind: "vocab", pos: "verb" },
  { id: "ja-m7-8-warm-nanmei", kana: "なんめいさまですか", romaji: "nan-mei sama desu ka", meaningEn: "How many people?", fromModule: "future", introducedByLessonId: "ja-m7-8", kind: "phrase", pos: "expression" },
  { id: "nomimasu", kana: "のみます", romaji: "nomimasu", meaningEn: "drink (polite)", emoji: "🥤", fromModule: "m7", introducedByLessonId: "ja-m7-neo-1", kind: "vocab", pos: "verb" },
  { id: "mimasu", kana: "みます", romaji: "mimasu", meaningEn: "watch (polite)", emoji: "👀", fromModule: "m7", introducedByLessonId: "ja-m7-neo-2", kind: "vocab", pos: "verb" },
  { id: "yomimasu", kana: "よみます", romaji: "yomimasu", meaningEn: "read (polite)", emoji: "📚", fromModule: "future", freqRank: 14, introducedByLessonId: "ja-m7-2-1", kind: "vocab", pos: "verb" },
  { id: "ja-m7-2-ex-1", kana: "わたしは すしを たべます", romaji: "watashi wa sushi wo tabemasu", meaningEn: "I eat sushi. (polite)", fromModule: "future", introducedByLessonId: "ja-m7-2", kind: "phrase", pos: "expression" },
  { id: "ja-m7-2-ex-2", kana: "わたしは ほんを よみます", romaji: "watashi wa hon wo yomimasu", meaningEn: "I read a book. (polite)", fromModule: "future", introducedByLessonId: "ja-m7-2", kind: "phrase", pos: "expression" },
  { id: "p-wo", kana: "を", romaji: "wo", meaningEn: "direct object marker", fromModule: "m7", introducedByLessonId: "ja-m7-3-1", kind: "particle", pos: "particle" },
  { id: "ja-m7-4-v-juusu", emoji: "🧃", kana: "ジュース", romaji: "juusu", meaningEn: "Juice", fromModule: "m5", introducedByLessonId: "ja-m5-kata", kind: "vocab", note: "First fully base-readable loanword — the サ row (M5) closes ジュース (spec §4.2). Unlocks on ja-m5-kata.", pos: "noun" },
  { id: "ja-m7-4-v-pan", kana: "パン", romaji: "pan", meaningEn: "bread", emoji: "🍞", fromModule: "m9", introducedByLessonId: "ja-m12-kata", kind: "vocab", note: "Katakana パン (distinct from hiragana ぱん atom `pan`). SRS-attributed to m12 where ン completes base readability (spec §4.2). Unlocks on ja-m12-kata.", pos: "noun" },
  { id: "ja-m7-4-v-ramen", emoji: "🍜", kana: "ラーメン", romaji: "raamen", meaningEn: "Ramen", fromModule: "m12", introducedByLessonId: "ja-m12-kata", kind: "vocab", note: "SRS-attributed to m12 — ン (ワ row) is ラーメン's last base glyph (spec §4.2). Unlocks on ja-m12-kata.", pos: "noun" },
  { id: "osake", kana: "おさけ", kanji: "お酒", romaji: "osake", meaningEn: "alcohol, rice wine", emoji: "🍶", fromModule: "m21", introducedByLessonId: "ja-m7-1-1", kind: "vocab", pos: "noun" },
  { id: "ja-m7-4-v-gohan", kana: "ごはん", kanji: "御飯", romaji: "gohan", meaningEn: "cooked rice, meal", emoji: "🍚", fromModule: "m2", introducedByLessonId: "ja-m7-4", kind: "vocab", pos: "noun" },
  { id: "ja-m7-1-v-kaku", kana: "かく", kanji: "書く", romaji: "kaku", meaningEn: "to write", emoji: "✍️", fromModule: "m16", kind: "vocab", note: "taught by m16 vocab pack 5 2026-07-30 (B067); was m7 with a dead ja-m7-1 attribution — deleted so the lessonAtomIndex fallback attributes it", pos: "verb", conjugation: { class: "godan", entryId: "kaku" } },
  { id: "ja-m7-1-v-iku", kana: "いく", kanji: "行く", romaji: "iku", meaningEn: "to go, to travel", emoji: "🚶", fromModule: "m5", introducedByLessonId: "ja-m7-1", kind: "vocab", note: "person walking", pos: "verb", conjugation: { class: "godan", entryId: "iku" } },
  { id: "ja-m7-1-v-miru", kana: "みる", kanji: "見る  観る", romaji: "miru", meaningEn: "to watch, to look at", shortGloss: "to watch", emoji: "👁️", fromModule: "m5", introducedByLessonId: "ja-m7-1", kind: "vocab", pos: "verb", conjugation: { class: "ichidan", entryId: "miru" } },
  { id: "ja-m7-1-v-yomu", kana: "よむ", kanji: "読む", romaji: "yomu", meaningEn: "to read", emoji: "📖", fromModule: "m1", kind: "vocab", blocked: true, note: "taught by m16 vocab pack 5 2026-07-30 (B067); was m7 with a dead ja-m7-1 attribution — deleted. blocked: 📖 belongs to ほん", pos: "verb", conjugation: { class: "godan", entryId: "yomu" } },
  { id: "ja-m7-1-v-taberu", kana: "たべる", kanji: "食べる", romaji: "taberu", meaningEn: "to eat", emoji: "🍽️", fromModule: "m2", introducedByLessonId: "ja-m7-1", kind: "vocab", pos: "verb", conjugation: { class: "ichidan", entryId: "taberu" } },
  { id: "ja-m7-1-v-nomu", kana: "のむ", kanji: "飲む", romaji: "nomu", meaningEn: "to drink", emoji: "🥤", fromModule: "m5", introducedByLessonId: "ja-m7-1", kind: "vocab", note: "cup with straw", pos: "verb", conjugation: { class: "godan", entryId: "nomu" } },
  { id: "ja-surv-ikura", kana: "いくらですか", romaji: "ikura desu ka", meaningEn: "How much is it?", fromModule: "m9", introducedByLessonId: "ja-m9-neo-4", kind: "phrase", pos: "expression" },
  { id: "ja-surv-itsu", kana: "いつ", romaji: "itsu", meaningEn: "when", fromModule: "m11", introducedByLessonId: "ja-m11-neo-9", kind: "phrase", blocked: true, note: "interrogative", pos: "expression" },
  { id: "ja-surv-onegaishimasu", kana: "おねがいします", romaji: "onegaishimasu", meaningEn: "Please", fromModule: "sidequest-survival", introducedByLessonId: "ja-sidequest-survival-phrases", kind: "phrase", pos: "expression" },
  { id: "ja-surv-konnichiwa", kana: "こんにちは", romaji: "konnichiwa", meaningEn: "Hello / good afternoon", fromModule: "sidequest-survival", introducedByLessonId: "ja-sidequest-survival-phrases", kind: "phrase", pos: "expression" },
  { id: "ja-surv-gomennasai", kana: "ごめんなさい", romaji: "gomen nasai", meaningEn: "I'm sorry", fromModule: "m3", introducedByLessonId: "ja-m3-neo-5", kind: "phrase", pos: "expression" },
  { id: "ja-surv-janai", kana: "じゃないです", romaji: "janai desu", meaningEn: "is not / are not", fromModule: "m29", introducedByLessonId: "ja-m29-neo-1", kind: "phrase", pos: "expression" },
  { id: "ja-surv-desu", kana: "です", romaji: "desu", meaningEn: "is / are (polite copula)", fromModule: "m7", introducedByLessonId: "ja-m7-neo-4", kind: "phrase", pos: "expression" },
  { id: "ja-surv-doko", kana: "どこですか", romaji: "doko desu ka", meaningEn: "Where is it?", fromModule: "m19", introducedByLessonId: "ja-m19-neo-9", kind: "phrase", pos: "expression" },
  { id: "ja-surv-hai", kana: "はい", romaji: "hai", meaningEn: "yes", fromModule: "m7", introducedByLessonId: "ja-m7-neo-1", kind: "phrase", blocked: true, note: "interjection/function word", pos: "expression" },
  { id: "ja-surv-wakarimashita", kana: "わかりました", romaji: "wakarimashita", meaningEn: "I understand / got it", fromModule: "sidequest-survival", introducedByLessonId: "ja-sidequest-survival-phrases", kind: "phrase", pos: "expression" },
  { id: "asatte", kana: "あさって", romaji: "asatte", meaningEn: "day after tomorrow", fromModule: "m11", kind: "vocab", blocked: true, note: "abstract time reference like あした — generic 📅 can't depict it (IR declares imageable:false; B075); taught by m11 vocab pack 2026-07-29 (B067); was m12", pos: "noun" },
  { id: "asoko", kana: "あそこ", romaji: "asoko", shortGloss: "over there", meaningEn: "over there", fromModule: "m6", kind: "vocab", blocked: true, note: "spatial demonstrative — per rubric", pos: "pronoun" },
  { id: "achira", kana: "あちら", romaji: "achira", meaningEn: "there", fromModule: "future", freqRank: 15, kind: "vocab", blocked: true, note: "spatial demonstrative — per rubric", pos: "pronoun" },
  { id: "atchi", kana: "あっち", romaji: "atchi", meaningEn: "over there", fromModule: "future", freqRank: 16, kind: "vocab", blocked: true, note: "demonstrative spatial — rubric block", pos: "pronoun" },
  { id: "ano", kana: "あの", romaji: "ano", meaningEn: "that over there", fromModule: "m17", kind: "vocab", blocked: true, note: "demonstrative — rubric block", pos: "determiner" },
  { id: "abiru", kana: "あびる", romaji: "abiru", meaningEn: "to bathe, to shower", emoji: "🚿", fromModule: "future", freqRank: 17, kind: "vocab", pos: "verb", conjugation: { class: "ichidan", entryId: "abiru" } },
  { id: "amari", kana: "あまり", romaji: "amari", meaningEn: "not very", fromModule: "m22", kind: "vocab", blocked: true, note: "abstract grammar adverb", pos: "adverb" },
  { id: "aru", kana: "ある", romaji: "aru", meaningEn: "to be, to have (used for inanimate objects)", fromModule: "m6", kind: "vocab", blocked: true, note: "existence-of — rubric explicit block", pos: "verb", conjugation: { class: "godan" } },
  { id: "are", kana: "あれ", romaji: "are", shortGloss: "that (over there)", meaningEn: "that", fromModule: "m4", kind: "vocab", blocked: true, note: "demonstrative — rubric block", pos: "pronoun" },
  { id: "ii--yoi", kana: "いい / よい", romaji: "ii-/-yoi", meaningEn: "good", emoji: "👍", fromModule: "m12", kind: "vocab", note: "thumbs up as good proxy", pos: "adjective" },
  { id: "ikaga", kana: "いかが", romaji: "ikaga", meaningEn: "how", fromModule: "future", freqRank: 18, introducedByLessonId: "ja-m21-6-2", kind: "vocab", blocked: true, note: "interrogative adverb — abstract grammar", pos: "adverb" },
  { id: "ikutsu", kana: "いくつ", romaji: "ikutsu", meaningEn: "how many?, how old?", fromModule: "future", freqRank: 19, introducedByLessonId: "ja-m14-6-2", kind: "vocab", blocked: true, note: "interrogative", pos: "adverb" },
  { id: "ichiban", kana: "いちばん", romaji: "ichiban", meaningEn: "best, first", emoji: "🥇", fromModule: "m26", introducedByLessonId: "ja-m22-1-1", blocked: true, kind: "vocab", pos: "adverb", note: "no picture debut (inv-30 census 2026-08-20): named first by its own module's rule card, which compiles to a pinned step no debut MCQ can precede (m20/m21 card-steals-the-picture rule; netsu precedent)" },
  { id: "itsumo", kana: "いつも", romaji: "itsumo", meaningEn: "always", fromModule: "m22", kind: "vocab", blocked: true, note: "frequency adverb", pos: "adverb" },
  { id: "iroiro", kana: "いろいろ", romaji: "iroiro", meaningEn: "various", emoji: "🌈", fromModule: "future", freqRank: 20, introducedByLessonId: "ja-m22-4-2", kind: "vocab", note: "rainbow as variety cue", pos: "adjective", conjugation: { class: "na-adj" } },
  { id: "ee", kana: "ええ", romaji: "ee", meaningEn: "yes", emoji: "✅", fromModule: "m7", introducedByLessonId: "ja-m7-neo-6", kind: "vocab", pos: "interjection" },
  { id: "oishii", kana: "おいしい", romaji: "oishii", meaningEn: "delicious", emoji: "😋", fromModule: "m12", kind: "vocab", pos: "adjective", conjugation: { class: "i-adj", entryId: "oishii" } },
  { id: "onaka", kana: "おなか", romaji: "onaka", meaningEn: "stomach", emoji: "🫃", fromModule: "m22", kind: "vocab", pos: "noun" },
  { id: "obaasan", kana: "おばあさん", romaji: "obaasan", meaningEn: "grandmother, female senior-citizen", emoji: "👵", fromModule: "future", freqRank: 21, kind: "vocab", pos: "noun" },
  { id: "omawarisan", kana: "おまわりさん", romaji: "omawarisan", meaningEn: "friendly term for policeman", emoji: "👮", fromModule: "future", freqRank: 22, introducedByLessonId: "ja-m17-8-2", kind: "vocab", pos: "noun" },
  { id: "omoshiroi", kana: "おもしろい", romaji: "omoshiroi", meaningEn: "interesting", emoji: "🤩", fromModule: "m12", kind: "vocab", note: "starstruck = fascinated/interesting", pos: "adjective", conjugation: { class: "i-adj", entryId: "omoshiroi" } },
  { id: "kakaru", kana: "かかる", romaji: "kakaru", meaningEn: "to take time or money", fromModule: "m32", kind: "vocab", blocked: true, note: "abstract verb of cost/duration", pos: "verb", conjugation: { class: "godan", entryId: "kakaru" } },
  { id: "kakeru", kana: "かける", romaji: "kakeru", meaningEn: "to call by phone", emoji: "📞", fromModule: "m32", blocked: true, kind: "vocab", pos: "verb", conjugation: { class: "ichidan" }, note: "no picture debut (inv-30 census 2026-08-20): でんわ's 📞 owns the glyph (m19/m24 ruling: a debut distractor the picture names equally well)" },
  { id: "kawaii", kana: "かわいい", romaji: "kawaii", meaningEn: "cute", emoji: "🥰", fromModule: "future", freqRank: 23, kind: "vocab", pos: "adjective", conjugation: { class: "i-adj" } },
  { id: "kirei", kana: "きれい", romaji: "kirei", meaningEn: "pretty, clean", emoji: "✨", fromModule: "m12", kind: "vocab", note: "sparkles as clean/pretty proxy", pos: "adjective", conjugation: { class: "na-adj", entryId: "kirei" } },
  { id: "koko", kana: "ここ", romaji: "koko", meaningEn: "here", fromModule: "m6", kind: "vocab", blocked: true, note: "spatial demonstrative — per rubric", pos: "pronoun" },
  { id: "kochira", kana: "こちら", romaji: "kochira", meaningEn: "this person or way", fromModule: "m10", kind: "vocab", blocked: true, note: "demonstrative — per rubric", pos: "pronoun" },
  { id: "kotchi", kana: "こっち", romaji: "kotchi", meaningEn: "this person or way", fromModule: "future", freqRank: 24, kind: "vocab", blocked: true, note: "demonstrative — spatial pronoun", pos: "pronoun" },
  { id: "kono", kana: "この", romaji: "kono", meaningEn: "this", fromModule: "m17", kind: "vocab", blocked: true, note: "demonstrative — rubric block", pos: "determiner" },
  { id: "konna", kana: "こんな", romaji: "konna", meaningEn: "such", fromModule: "future", freqRank: 25, introducedByLessonId: "ja-m9-6-2", kind: "vocab", blocked: true, note: "demonstrative determiner — abstract grammar", pos: "determiner" },
  { id: "saa", kana: "さあ", romaji: "saa", meaningEn: "well…", fromModule: "future", freqRank: 26, introducedByLessonId: "ja-m26-7-1", kind: "vocab", blocked: true, note: "interjection — no concrete referent", pos: "interjection" },
  { id: "shikashi", kana: "しかし", romaji: "shikashi", meaningEn: "however", fromModule: "future", freqRank: 27, introducedByLessonId: "ja-m26-1-2", kind: "vocab", blocked: true, note: "conjunction", pos: "conjunction" },
  { id: "shouyu", kana: "しょうゆ", romaji: "shouyu", meaningEn: "soy sauce", fromModule: "future", freqRank: 28, kind: "vocab", note: "sake bottle as closest condiment vessel; weak", pos: "noun" },
  { id: "ja--jaa", kana: "じゃ / じゃあ", romaji: "ja-/-jaa", meaningEn: "well then…", fromModule: "m26", introducedByLessonId: "ja-m26-5-2", kind: "vocab", blocked: true, note: "discourse particle", pos: "conjunction" },
  { id: "suguni", kana: "すぐに", romaji: "suguni", meaningEn: "instantly", emoji: "⚡", fromModule: "future", freqRank: 29, introducedByLessonId: "ja-m17-8-2", kind: "vocab", note: "lightning = instant", pos: "adverb" },
  { id: "suru", kana: "する", romaji: "suru", meaningEn: "to do, to make", fromModule: "m11", kind: "vocab", blocked: true, note: "generic abstract verb", pos: "verb", conjugation: { class: "irregular", entryId: "suru" } },
  { id: "sekken", kana: "せっけん", romaji: "sekken", meaningEn: "soap", emoji: "🧼", fromModule: "m13", kind: "vocab", note: "taught by m13 vocab pack 2026-07-29 (B067); was m20; meaningEn fixed from the mislabeled 'economy'", pos: "noun" },
  { id: "soushite--soshite", kana: "そうして / そして", romaji: "soushite-/-soshite", meaningEn: "and", fromModule: "future", freqRank: 30, introducedByLessonId: "ja-m26-1-2", kind: "vocab", blocked: true, note: "conjunction / function word", pos: "conjunction" },
  { id: "soko", kana: "そこ", romaji: "soko", meaningEn: "that place", fromModule: "m6", kind: "vocab", blocked: true, note: "demonstrative — rubric blocks", pos: "pronoun" },
  { id: "sochira", kana: "そちら", romaji: "sochira", meaningEn: "over there", fromModule: "future", freqRank: 31, kind: "vocab", blocked: true, note: "spatial demonstrative — per rubric", pos: "pronoun" },
  { id: "sotchi", kana: "そっち", romaji: "sotchi", meaningEn: "over there", fromModule: "future", freqRank: 32, kind: "vocab", blocked: true, note: "demonstrative — rubric block", pos: "pronoun" },
  { id: "sono", kana: "その", romaji: "sono", meaningEn: "that", fromModule: "m17", kind: "vocab", blocked: true, note: "demonstrative — abstract grammar per rubric", pos: "determiner" },
  { id: "soba", kana: "そば", romaji: "soba", meaningEn: "near, beside", fromModule: "future", freqRank: 33, kind: "vocab", blocked: true, note: "positional — abstract", pos: "noun" },
  { id: "sore", kana: "それ", romaji: "sore", shortGloss: "that (by you)", meaningEn: "that", fromModule: "m4", kind: "vocab", blocked: true, note: "demonstrative — per rubric", pos: "pronoun" },
  { id: "sorekara", kana: "それから", romaji: "sorekara", meaningEn: "after that", fromModule: "future", freqRank: 34, kind: "vocab", blocked: true, note: "conjunction — abstract grammar", pos: "conjunction" },
  { id: "soredeha", kana: "それでは", romaji: "soredeha", meaningEn: "in that situation", fromModule: "future", freqRank: 35, kind: "vocab", blocked: true, note: "discourse connector", pos: "conjunction" },
  { id: "taihen", kana: "たいへん", romaji: "taihen", meaningEn: "very", fromModule: "future", freqRank: 36, kind: "vocab", blocked: true, note: "intensifier adverb", pos: "adverb" },
  { id: "takusan", kana: "たくさん", romaji: "takusan", meaningEn: "many", fromModule: "future", freqRank: 37, introducedByLessonId: "ja-m20-3-1", kind: "vocab", blocked: true, note: "abstract quantifier; no specific referent", pos: "adverb" },
  { id: "tate", kana: "たて", romaji: "tate", meaningEn: "length, height", emoji: "📏", fromModule: "future", freqRank: 38, kind: "vocab", note: "ruler = measurement", pos: "noun" },
  { id: "tabako", kana: "たばこ", romaji: "tabako", meaningEn: "tobacco, cigarettes", shortGloss: "cigarettes", emoji: "🚬", fromModule: "m16", kind: "vocab", note: "taught by m16 vocab pack 6 2026-07-30 (B067)", pos: "noun" },
  { id: "tabun", kana: "たぶん", romaji: "tabun", meaningEn: "probably", fromModule: "m25", introducedByLessonId: "ja-m18-2-1", kind: "vocab", blocked: true, note: "modal adverb", pos: "adverb" },
  { id: "dandan", kana: "だんだん", romaji: "dandan", meaningEn: "gradually", fromModule: "m27", introducedByLessonId: "ja-m27-neo-9", kind: "vocab", blocked: true, note: "adverb of degree; no referent", pos: "adverb" },
  { id: "chawan", kana: "ちゃわん", romaji: "chawan", meaningEn: "rice bowl", emoji: "🍚", fromModule: "future", freqRank: 39, kind: "vocab", note: "cooked rice in bowl", pos: "noun" },
  { id: "choudo", kana: "ちょうど", romaji: "choudo", meaningEn: "exactly", fromModule: "future", freqRank: 40, introducedByLessonId: "ja-m21-7-2", kind: "vocab", blocked: true, note: "abstract adverb; no concrete referent", pos: "adverb" },
  { id: "chotto", kana: "ちょっと", romaji: "chotto", meaningEn: "somewhat", fromModule: "m10", kind: "vocab", blocked: true, note: "adverb/abstract degree marker", pos: "adverb" },
  { id: "tsukeru", kana: "つける", romaji: "tsukeru", meaningEn: "to turn on", emoji: "💡", fromModule: "future", freqRank: 41, kind: "vocab", note: "lightbulb as turn-on cue", pos: "verb", conjugation: { class: "ichidan", entryId: "tsukeru" } },
  { id: "tsumaranai", kana: "つまらない", romaji: "tsumaranai", meaningEn: "boring", emoji: "🥱", fromModule: "future", freqRank: 42, kind: "vocab", note: "yawn = boredom", pos: "adjective", conjugation: { class: "i-adj", entryId: "tsumaranai" } },
  { id: "dekiru", kana: "できる", romaji: "dekiru", meaningEn: "to be able to", fromModule: "m24", introducedByLessonId: "ja-m23-8-1", kind: "vocab", blocked: true, note: "modal/auxiliary verb; abstract", pos: "verb", conjugation: { class: "ichidan" } },
  { id: "deha", kana: "では", romaji: "deha", meaningEn: "with that...", fromModule: "m26", introducedByLessonId: "ja-m26-5-2", kind: "vocab", blocked: true, note: "particle/conjunction", pos: "conjunction" },
  { id: "demo", kana: "でも", romaji: "demo", meaningEn: "but", fromModule: "future", freqRank: 43, introducedByLessonId: "ja-m26-1-2", kind: "vocab", blocked: true, note: "conjunction", pos: "conjunction" },
  { id: "totemo", kana: "とても", romaji: "totemo", meaningEn: "very", fromModule: "future", freqRank: 44, kind: "vocab", blocked: true, note: "intensifier adverb; no referent", pos: "adverb" },
  { id: "dou", kana: "どう", romaji: "dou", meaningEn: "how, in what way", fromModule: "m12", kind: "vocab", blocked: true, note: "interrogative", pos: "adverb" },
  { id: "doushite", kana: "どうして", romaji: "doushite", meaningEn: "for what reason", fromModule: "m27", introducedByLessonId: "ja-m13-4-2", kind: "vocab", blocked: true, note: "interrogative", pos: "adverb" },
  { id: "douzo", kana: "どうぞ", romaji: "douzo", meaningEn: "please", emoji: "🫴", fromModule: "future", freqRank: 45, introducedByLessonId: "ja-m21-4-1", kind: "vocab", note: "folded hands", pos: "interjection" },
  { id: "doumo", kana: "どうも", romaji: "doumo", meaningEn: "thanks", emoji: "🙏", fromModule: "future", freqRank: 46, introducedByLessonId: "ja-m21-4-2", kind: "vocab", pos: "interjection" },
  { id: "dochira", kana: "どちら", romaji: "dochira", meaningEn: "which of two", fromModule: "m20", kind: "vocab", blocked: true, note: "demonstrative — rubric blocks", pos: "pronoun" },
  { id: "dotchi", kana: "どっち", romaji: "dotchi", meaningEn: "which", fromModule: "m20", kind: "vocab", blocked: true, note: "interrogative pronoun", pos: "pronoun" },
  { id: "donata", kana: "どなた", romaji: "donata", meaningEn: "who", fromModule: "future", freqRank: 47, introducedByLessonId: "ja-m19-4-2", kind: "vocab", blocked: true, note: "interrogative pronoun — per rubric", pos: "pronoun" },
  { id: "dono", kana: "どの", romaji: "dono", meaningEn: "which", fromModule: "m17", kind: "vocab", blocked: true, note: "demonstrative — rubric blocks", pos: "determiner" },
  { id: "naze", kana: "なぜ", romaji: "naze", meaningEn: "why", fromModule: "future", freqRank: 48, introducedByLessonId: "ja-m13-4-1", kind: "vocab", blocked: true, note: "question word / abstract grammar", pos: "adverb" },
  { id: "nado", kana: "など", romaji: "nado", meaningEn: "et cetera", fromModule: "m21", introducedByLessonId: "ja-m21-3-2", kind: "vocab", blocked: true, note: "particle", pos: "noun" },
  { id: "naru", kana: "なる", romaji: "naru", meaningEn: "to become", emoji: "🔄", fromModule: "m27", introducedByLessonId: "ja-m27-4-1", kind: "vocab", blocked: true, note: "cycle reads as 'refresh' not 'become'", pos: "verb", conjugation: { class: "godan" } },
  { id: "haku", kana: "はく", romaji: "haku", meaningEn: "to wear, to put on trousers", emoji: "👖", fromModule: "future", freqRank: 49, kind: "vocab", note: "jeans as put-on-trousers cue", pos: "verb", conjugation: { class: "godan" } },
  { id: "hashi", kana: "はし", romaji: "hashi", meaningEn: "chopsticks", emoji: "🥢", fromModule: "future", freqRank: 50, kind: "vocab", pos: "noun" },
  { id: "furo", kana: "ふろ", romaji: "furo", meaningEn: "bath", emoji: "🛁", fromModule: "future", freqRank: 51, kind: "vocab", pos: "noun" },
  { id: "hoka", kana: "ほか", romaji: "hoka", meaningEn: "other, the rest", fromModule: "future", freqRank: 52, introducedByLessonId: "ja-m21-7-1", kind: "vocab", blocked: true, note: "abstract relational word", pos: "noun" },
  { id: "hontou", kana: "ほんとう", romaji: "hontou", meaningEn: "truth", fromModule: "future", freqRank: 53, kind: "vocab", blocked: true, note: "abstract noun; no concrete referent", pos: "noun" },
  { id: "mazui", kana: "まずい", romaji: "mazui", meaningEn: "unpleasant", emoji: "🤢", fromModule: "future", freqRank: 54, kind: "vocab", note: "nauseated face for bad-taste cue", pos: "adjective", conjugation: { class: "i-adj", entryId: "mazui" } },
  { id: "mata", kana: "また", romaji: "mata", meaningEn: "again, once more", fromModule: "m34", introducedByLessonId: "ja-m34-neo-2", kind: "vocab", blocked: true, note: "adverb/conjunction — debuts in m34's ru-irregular rule example (また こよう)", pos: "adverb" },
  { id: "mada", kana: "まだ", romaji: "mada", meaningEn: "yet, still", fromModule: "m14", kind: "vocab", blocked: true, note: "tense/aspect adverb — abstract grammar", pos: "adverb" },
  { id: "massugu", kana: "まっすぐ", romaji: "massugu", meaningEn: "straight ahead, direct", emoji: "⬆️", fromModule: "m32", kind: "vocab", note: "up arrow as straight-ahead direction", pos: "adverb" },
  { id: "minna", kana: "みんな", romaji: "minna", meaningEn: "everyone", emoji: "👥", fromModule: "future", freqRank: 55, introducedByLessonId: "ja-m19-4-2", kind: "vocab", pos: "pronoun" },
  { id: "mou", kana: "もう", romaji: "mou", meaningEn: "already", fromModule: "m14", kind: "vocab", blocked: true, note: "tense/aspect adverb", pos: "adverb" },
  { id: "motto", kana: "もっと", romaji: "motto", meaningEn: "more", emoji: "➕", fromModule: "future", freqRank: 56, introducedByLessonId: "ja-m22-1-1", kind: "vocab", note: "plus = more", pos: "adverb" },
  { id: "yaru", kana: "やる", romaji: "yaru", meaningEn: "to do", fromModule: "m15", introducedByLessonId: "ja-m15-2-2", kind: "vocab", blocked: true, note: "generic verb; same meaning as する — polite-form duplicate per rubric", pos: "verb", conjugation: { class: "godan" } },
  { id: "yukkurito", kana: "ゆっくりと", romaji: "yukkurito", meaningEn: "slowly", emoji: "🦥", fromModule: "future", freqRank: 57, introducedByLessonId: "ja-m20-2-2", kind: "vocab", note: "turtle as slowness cue", pos: "adverb" },
  { id: "yoku", kana: "よく", romaji: "yoku", meaningEn: "often, well", fromModule: "m10", kind: "vocab", blocked: true, note: "adverb of frequency/manner; abstract", pos: "adverb" },
  { id: "yorihou", kana: "より、ほう", romaji: "yori?hou", meaningEn: "Used for comparison.", fromModule: "m20", introducedByLessonId: "ja-m22-1-1", kind: "vocab", blocked: true, note: "comparison particle — abstract grammar", pos: "particle" },
  { id: "rippa", kana: "りっぱ", romaji: "rippa", meaningEn: "splendid", emoji: "🏆", fromModule: "future", freqRank: 58, kind: "vocab", note: "sparkles = splendid/admirable", pos: "adjective", conjugation: { class: "na-adj" } },
  { id: "apaato", kana: "アパート", romaji: "apaato", meaningEn: "apartment", emoji: "🏢", fromModule: "future", freqRank: 59, kind: "vocab", note: "apartment building", pos: "noun" },
  { id: "erebeetaa", kana: "エレベーター", romaji: "erebeetaa", meaningEn: "a lift, an elevator", emoji: "🛗", fromModule: "m33", kind: "vocab", pos: "noun" },
  { id: "kappu", kana: "カップ", romaji: "kappu", meaningEn: "cup", emoji: "🥤", fromModule: "future", freqRank: 60, kind: "vocab", pos: "noun" },
  { id: "karendaa", kana: "カレンダー", romaji: "karendaa", meaningEn: "calendar", emoji: "📅", fromModule: "future", freqRank: 61, kind: "vocab", pos: "noun" },
  { id: "karee", kana: "カレー", romaji: "karee", meaningEn: "curry", emoji: "🍛", fromModule: "future", freqRank: 62, kind: "vocab", pos: "noun" },
  { id: "kiro--kiroguramu", kana: "キロ / キログラム", romaji: "kiro-/-kiroguramu", meaningEn: "kilogram", emoji: "⚖️", fromModule: "future", freqRank: 63, kind: "vocab", note: "balance scale as weight proxy", pos: "noun" },
  { id: "kiro--kiromeetoru", kana: "キロ / キロメートル", romaji: "kiro-/-kiromeetoru", meaningEn: "kilometre", fromModule: "future", freqRank: 64, kind: "vocab", blocked: true, note: "unit of measure; no referent", pos: "noun" },
  { id: "gitaa", kana: "ギター", romaji: "gitaa", meaningEn: "guitar", emoji: "🎸", fromModule: "future", freqRank: 65, kind: "vocab", pos: "noun" },
  { id: "kurasu", kana: "クラス", romaji: "kurasu", meaningEn: "class", emoji: "🏫", fromModule: "m16", kind: "vocab", blocked: true, note: "taught by m16 vocab pack 5 2026-07-30 (B067); was m13 with a dead ja-m13-6-1 attribution — deleted. blocked: 🏫 belongs to きょうしつ, taught in the same lesson", pos: "noun" },
  { id: "guramu", kana: "グラム", romaji: "guramu", meaningEn: "gram", emoji: "⚖️", fromModule: "future", freqRank: 66, kind: "vocab", note: "scale = mass unit", pos: "noun" },
  { id: "koppu", kana: "コップ", romaji: "koppu", meaningEn: "a glass", emoji: "🥛", fromModule: "future", freqRank: 67, kind: "vocab", note: "glass of milk; closest", pos: "noun" },
  { id: "kopiisuru", kana: "コピーする", romaji: "kopiisuru", meaningEn: "to copy", emoji: "📑", fromModule: "future", freqRank: 68, kind: "vocab", note: "stacked copies", pos: "verb", conjugation: { class: "irregular" } },
  { id: "kooto", kana: "コート", romaji: "kooto", meaningEn: "coat, tennis court", emoji: "🧥", fromModule: "m6", introducedByLessonId: "ja-m6-kata", kind: "vocab", note: "coat (primary sense). SRS-attributed to m6 — the タ row closes コート (ト), taught alongside タクシー (spec §4.2). Unlocks on ja-m6-kata.", pos: "noun" },
  { id: "shatsu", kana: "シャツ", romaji: "shatsu", meaningEn: "shirt", emoji: "👕", fromModule: "future", freqRank: 69, kind: "vocab", pos: "noun" },
  { id: "shawaa", kana: "シャワー", romaji: "shawaa", meaningEn: "shower", emoji: "🚿", fromModule: "m13", kind: "vocab", note: "taught by m13 vocab pack 2026-07-29 (B067); fromModule was already m13", pos: "noun" },
  { id: "sukaato", kana: "スカート", romaji: "sukaato", meaningEn: "skirt", emoji: "👗", fromModule: "future", freqRank: 70, kind: "vocab", note: "dress is closest Noto", pos: "noun" },
  { id: "sutoobu", kana: "ストーブ", romaji: "sutoobu", meaningEn: "heater", fromModule: "future", freqRank: 71, kind: "vocab", note: "fire — heater context; weak but concrete", pos: "noun" },
  { id: "supuun", kana: "スプーン", romaji: "supuun", meaningEn: "spoon", emoji: "🥄", fromModule: "future", freqRank: 72, kind: "vocab", pos: "noun" },
  { id: "supootsu", kana: "スポーツ", romaji: "supootsu", meaningEn: "sport", emoji: "⚽", fromModule: "m16", kind: "vocab", note: "soccer ball as sport proxy. Taught by m16 vocab pack 6 2026-07-30 (B067); was m15", pos: "noun" },
  { id: "surippa", kana: "スリッパ", romaji: "surippa", meaningEn: "slippers", emoji: "🥿", fromModule: "future", freqRank: 73, kind: "vocab", note: "flat shoe — closest slipper glyph", pos: "noun" },
  { id: "zubon", kana: "ズボン", romaji: "zubon", meaningEn: "trousers", emoji: "👖", fromModule: "future", freqRank: 74, kind: "vocab", pos: "noun" },
  { id: "seetaa", kana: "セーター", romaji: "seetaa", meaningEn: "sweater, jumper", emoji: "🧥", fromModule: "future", freqRank: 75, kind: "vocab", pos: "noun" },
  { id: "zero", kana: "ゼロ", romaji: "zero", meaningEn: "zero", emoji: "0️⃣", fromModule: "future", freqRank: 76, kind: "vocab", pos: "number" },
  { id: "tesuto", kana: "テスト", romaji: "tesuto", meaningEn: "test", emoji: "📝", fromModule: "m33", introducedByLessonId: "ja-m6-kata", blocked: true, kind: "vocab", note: "memo. SRS-attributed to m6 — テ + ト (タ row) close テスト; ス already taught in the M5 サ row (spec §4.2). Unlocks on ja-m6-kata.; no picture debut (inv-30 census 2026-08-20): しゅくだい's 📝 owns the glyph (m19/m24 ruling: a debut distractor the picture names equally well)", pos: "noun" },
  { id: "terebi", kana: "テレビ", romaji: "terebi", meaningEn: "television", emoji: "📺", fromModule: "m32", introducedByLessonId: "ja-m11-kata", kind: "vocab", note: "SRS-attributed to m11 — レ (ラ row) is テレビ's last base glyph (spec §4.2 known-safe move). Unlocks on ja-m11-kata.", pos: "noun" },
  { id: "teeburu", kana: "テーブル", romaji: "teeburu", meaningEn: "table", fromModule: "future", freqRank: 77, kind: "vocab", note: "no clean Noto table emoji; rely on custom art or phrase", pos: "noun" },
  { id: "teepu", kana: "テープ", romaji: "teepu", meaningEn: "tape", emoji: "📼", fromModule: "future", freqRank: 78, kind: "vocab", pos: "noun" },
  { id: "teepurekoodaa", kana: "テープレコーダー", romaji: "teepurekoodaa", meaningEn: "tape recorder", emoji: "📼", fromModule: "future", freqRank: 79, kind: "vocab", note: "videocassette — closest cassette glyph", pos: "noun" },
  { id: "depaato", kana: "デパート", romaji: "depaato", meaningEn: "department store", emoji: "🏬", fromModule: "future", freqRank: 80, kind: "vocab", pos: "noun" },
  { id: "doa", kana: "ドア", romaji: "doa", meaningEn: "Western style door", emoji: "🚪", fromModule: "m14", kind: "vocab", blocked: true, note: "taught by m14 vocab pack 2026-07-29 (B067); was m6 with a dead ja-m6-kata attribution (that row lesson never tiles ドア) — deleted so the lessonAtomIndex fallback attributes it. blocked: 🚪 is shared five ways (どあ/でる/はいる/いりぐち)", pos: "noun" },
  { id: "naifu", kana: "ナイフ", romaji: "naifu", meaningEn: "knife", emoji: "🔪", fromModule: "m8", introducedByLessonId: "ja-m8-kata", kind: "vocab", note: "SRS-attributed to m8 — フ (ハ row) is ナイフ's last base glyph (ナ from M7) (spec §4.2). Unlocks on ja-m8-kata.", pos: "noun" },
  { id: "nyuusu", kana: "ニュース", romaji: "nyuusu", meaningEn: "news", emoji: "📰", fromModule: "m7", introducedByLessonId: "ja-m7-kata", kind: "vocab", note: "newspaper as news proxy. SRS-attributed to m7 — the ナ row anchors ニュース (spec §4.2; ja-m7-kata teaches it). Unlocks on ja-m7-kata.", pos: "noun" },
  { id: "nekutai", kana: "ネクタイ", romaji: "nekutai", meaningEn: "tie, necktie", emoji: "👔", fromModule: "m7", introducedByLessonId: "ja-m7-kata", kind: "vocab", note: "SRS-attributed to m7 — ネ (ナ row) closes ネクタイ (ク M4, タ M6, イ M3) (spec §4.2). Unlocks on ja-m7-kata.", pos: "noun" },
  { id: "nooto", kana: "ノート", romaji: "nooto", meaningEn: "notebook, exercise book", emoji: "📓", fromModule: "m16", kind: "vocab", note: "taught by m16 vocab pack 5 2026-07-30 (B067); was m7 attributed to ja-m7-kata (a RETIRED old-course kata lesson on no map tile — the ドア/ja-m6-kata class) — deleted so the fallback attributes it", pos: "noun" },
  { id: "hankachi", kana: "ハンカチ", romaji: "hankachi", meaningEn: "handkerchief", emoji: "🧻", fromModule: "future", freqRank: 81, kind: "vocab", blocked: true, note: "no handkerchief glyph; toilet paper misreads", pos: "noun" },
  { id: "bataa", kana: "バター", romaji: "bataa", meaningEn: "butter", emoji: "🧈", fromModule: "future", freqRank: 82, kind: "vocab", pos: "noun" },
  { id: "firumu", kana: "フィルム", romaji: "firumu", meaningEn: "roll of film", emoji: "🎞️", fromModule: "future", freqRank: 83, kind: "vocab", pos: "noun" },
  { id: "fooku", kana: "フォーク", romaji: "fooku", meaningEn: "fork", emoji: "🍴", fromModule: "future", freqRank: 84, kind: "vocab", pos: "noun" },
  { id: "puuru", kana: "プール", romaji: "puuru", meaningEn: "swimming pool", emoji: "🏊", fromModule: "future", freqRank: 85, kind: "vocab", note: "swimmer as pool cue", pos: "noun" },
  { id: "beddo", kana: "ベッド", romaji: "beddo", meaningEn: "bed", emoji: "🛏️", fromModule: "future", freqRank: 86, kind: "vocab", pos: "noun" },
  { id: "petto", kana: "ペット", romaji: "petto", meaningEn: "pet", emoji: "🐕", fromModule: "future", freqRank: 87, kind: "vocab", note: "dog as canonical pet", pos: "noun" },
  { id: "peeji", kana: "ページ", romaji: "peeji", meaningEn: "page", emoji: "📄", fromModule: "future", freqRank: 88, kind: "vocab", pos: "noun" },
  { id: "botan", kana: "ボタン", romaji: "botan", meaningEn: "button", emoji: "🔘", fromModule: "m32", kind: "vocab", note: "radio button", pos: "noun" },
  { id: "boorupen", kana: "ボールペン", romaji: "boorupen", meaningEn: "ball-point pen", emoji: "🖊️", fromModule: "future", freqRank: 89, kind: "vocab", pos: "noun" },
  { id: "poketto", kana: "ポケット", romaji: "poketto", meaningEn: "pocket", fromModule: "future", freqRank: 90, kind: "vocab", note: "jeans as pocket proxy", pos: "noun" },
  { id: "posuto", kana: "ポスト", romaji: "posuto", meaningEn: "post", emoji: "📮", fromModule: "future", freqRank: 91, kind: "vocab", note: "postbox", pos: "noun" },
  { id: "matchi", kana: "マッチ", romaji: "matchi", meaningEn: "match", emoji: "🔥", fromModule: "future", freqRank: 92, kind: "vocab", note: "fire as match-strike proxy (no match-stick emoji)", pos: "noun" },
  { id: "meetoru", kana: "メートル", romaji: "meetoru", meaningEn: "metre", emoji: "📏", fromModule: "future", freqRank: 93, kind: "vocab", note: "ruler", pos: "noun" },
  { id: "rajio", kana: "ラジオ", romaji: "rajio", meaningEn: "radio", emoji: "📻", fromModule: "future", freqRank: 94, kind: "vocab", pos: "noun" },
  { id: "rajikase--rajiokasetto", kana: "ラジカセ / ラジオカセット", romaji: "rajikase-/-rajiokasetto", meaningEn: "radio cassette player", emoji: "📻", fromModule: "future", freqRank: 95, kind: "vocab", pos: "noun" },
  { id: "rekoodo", kana: "レコード", romaji: "rekoodo", meaningEn: "record", emoji: "💿", fromModule: "future", freqRank: 96, kind: "vocab", note: "optical disc; record-like", pos: "noun" },
  { id: "waishatsu", kana: "ワイシャツ", romaji: "waishatsu", meaningEn: "business shirt", emoji: "👔", fromModule: "future", freqRank: 97, kind: "vocab", blocked: true, note: "necktie already used; collision risk", pos: "noun" },
  { id: "oniisan", kana: "おにいさん", kanji: "お兄さん", romaji: "oniisan", meaningEn: "(honorable) older brother", emoji: "👨", fromModule: "m21", blocked: true, kind: "vocab", note: "man + kanji 兄; no picture debut (inv-30 census 2026-08-20): named first by its own module's rule card, which compiles to a pinned step no debut MCQ can precede (m20/m21 card-steals-the-picture rule; netsu precedent)", pos: "noun" },
  { id: "oneesan", kana: "おねえさん", kanji: "お姉さん", romaji: "oneesan", meaningEn: "(honorable) older sister", emoji: "👩", fromModule: "m21", blocked: true, kind: "vocab", note: "woman; kanji 姉 carries 'older'; no picture debut (inv-30 census 2026-08-20): あね's 👩 owns the glyph (m19/m24 ruling: a debut distractor the picture names equally well)", pos: "noun" },
  { id: "obentou", kana: "おべんとう", kanji: "お弁当", romaji: "obentou", meaningEn: "boxed lunch", emoji: "🍱", fromModule: "future", freqRank: 98, kind: "vocab", pos: "noun" },
  { id: "otearai", kana: "おてあらい", kanji: "お手洗い", romaji: "otearai", meaningEn: "bathroom", emoji: "🚻", fromModule: "future", freqRank: 99, kind: "vocab", pos: "noun" },
  { id: "okaasan", kana: "おかあさん", kanji: "お母さん", romaji: "okaasan", meaningEn: "(honorable) mother", emoji: "👩", fromModule: "m21", blocked: true, kind: "vocab", note: "woman; pair with phrase context; no picture debut (inv-30 census 2026-08-20): あね's 👩 owns the glyph (m19/m24 ruling: a debut distractor the picture names equally well)", pos: "noun" },
  { id: "otousan", kana: "おとうさん", kanji: "お父さん", romaji: "otousan", meaningEn: "(honorable) father", emoji: "👨", fromModule: "m21", kind: "vocab", blocked: true, note: "man glyph reads as 'man' not 'father'; rubric flags parent words", pos: "noun" },
  { id: "osara", kana: "おさら", kanji: "お皿", romaji: "osara", meaningEn: "plate, dish", emoji: "🍽️", fromModule: "future", freqRank: 100, kind: "vocab", note: "plate-with-utensils", pos: "noun" },
  { id: "okashi", kana: "おかし", kanji: "お菓子", romaji: "okashi", meaningEn: "sweets, candy", emoji: "🍬", fromModule: "m31", kind: "vocab", blocked: true, note: "blocked — 🍬 is also あまい, さとう and あめ (candy)", pos: "noun" },
  { id: "ofuro", kana: "おふろ", kanji: "お風呂", romaji: "ofuro", meaningEn: "bath", emoji: "🛁", fromModule: "future", freqRank: 101, kind: "vocab", pos: "noun" },
  { id: "sarainen", kana: "さらいねん", kanji: "さ来年", romaji: "sarainen", meaningEn: "year after next", fromModule: "future", freqRank: 102, kind: "vocab", blocked: true, note: "temporal abstraction", pos: "noun" },
  { id: "toriniku", kana: "とりにく", kanji: "とり肉", romaji: "toriniku", meaningEn: "chicken meat", emoji: "🍗", fromModule: "m13", kind: "vocab", pos: "noun" },
  { id: "mouichido", kana: "もういちど", kanji: "もう一度", romaji: "mouichido", meaningEn: "again", emoji: "🔁", fromModule: "future", freqRank: 103, kind: "vocab", note: "repeat arrow", pos: "adverb" },
  { id: "ichinichi", kana: "いちにち", kanji: "一日", romaji: "ichinichi", meaningEn: "(1) one day, (2) first of month", fromModule: "future", freqRank: 104, kind: "vocab", blocked: true, note: "counter/date abstraction", pos: "number" },
  { id: "ototoshi", kana: "おととし", kanji: "一昨年", romaji: "ototoshi", meaningEn: "year before last", fromModule: "future", freqRank: 105, kind: "vocab", blocked: true, note: "temporal abstraction", pos: "noun" },
  { id: "ototoi", kana: "おととい", kanji: "一昨日", romaji: "ototoi", meaningEn: "day before yesterday", fromModule: "future", freqRank: 106, kind: "vocab", blocked: true, note: "temporal abstraction", pos: "noun" },
  { id: "hitotsuki", kana: "ひとつき", kanji: "一月", romaji: "hitotsuki", meaningEn: "one month", fromModule: "future", freqRank: 107, introducedByLessonId: "ja-m13-2-2", kind: "vocab", blocked: true, note: "abstract duration; calendar reads as date not span", pos: "noun" },
  { id: "issho", kana: "いっしょ", kanji: "一緒", romaji: "issho", meaningEn: "together", emoji: "👫", fromModule: "m24", blocked: true, kind: "vocab", pos: "adverb", note: "no picture debut (inv-30 census 2026-08-20): ともだち's 👫 owns the glyph (m19/m24 ruling: a debut distractor the picture names equally well)" },
  { id: "shichi", kana: "しち", kanji: "七", romaji: "shichi", meaningEn: "seven", emoji: "7️⃣", fromModule: "future", freqRank: 108, kind: "vocab", pos: "number" },
  { id: "nanatsu", kana: "ななつ", kanji: "七つ", romaji: "nanatsu", meaningEn: "seven", emoji: "7️⃣", fromModule: "future", freqRank: 109, kind: "vocab", pos: "number" },
  { id: "nanoka", kana: "なのか", kanji: "七日", romaji: "nanoka", meaningEn: "seven days, the seventh day", fromModule: "future", freqRank: 110, kind: "vocab", blocked: true, note: "no ordinal-day glyph", pos: "number" },
  { id: "man", kana: "まん", kanji: "万", romaji: "man", meaningEn: "ten thousand", fromModule: "m20", kind: "vocab", blocked: true, note: "no glyph for 10000; ambiguous", pos: "number" },
  { id: "mannenhitsu", kana: "まんねんひつ", kanji: "万年筆", romaji: "mannenhitsu", meaningEn: "fountain pen", emoji: "🖋️", fromModule: "future", freqRank: 111, kind: "vocab", note: "fountain pen — exact match", pos: "noun" },
  { id: "joubu", kana: "じょうぶ", kanji: "丈夫", romaji: "joubu", meaningEn: "strong, durable", emoji: "💪", fromModule: "future", freqRank: 112, kind: "vocab", note: "flexed arm for strong/durable", pos: "adjective", conjugation: { class: "na-adj" } },
  { id: "mikka", kana: "みっか", kanji: "三日", romaji: "mikka", meaningEn: "three days, third day of the month", fromModule: "future", freqRank: 113, kind: "vocab", blocked: true, note: "no glyph for ordinal day-3", pos: "number" },
  { id: "ageru", kana: "あげる", kanji: "上げる", romaji: "ageru", meaningEn: "to give", emoji: "🎁", fromModule: "m31", kind: "vocab", blocked: true, note: "gift as giving cue; blocked — the m31 ageru rule card names it, and a pinned rule step would steal the image debut", pos: "verb", conjugation: { class: "ichidan" } },
  { id: "jouzu", kana: "じょうず", kanji: "上手", romaji: "jouzu", meaningEn: "skillful", emoji: "👌", fromModule: "m24", blocked: true, kind: "vocab", note: "OK-hand as skillful cue; no picture debut (inv-30 census 2026-08-20): だいじょうぶ's 👌 owns the glyph (m19/m24 ruling: a debut distractor the picture names equally well)", pos: "adjective", conjugation: { class: "na-adj", entryId: "jouzu" } },
  { id: "uwagi", kana: "うわぎ", kanji: "上着", romaji: "uwagi", meaningEn: "jacket", emoji: "🧥", fromModule: "future", freqRank: 114, kind: "vocab", pos: "noun" },
  { id: "shita", kana: "した", kanji: "下", romaji: "shita", meaningEn: "below", emoji: "⬇️", fromModule: "future", freqRank: 115, introducedByLessonId: "ja-m17-8-1", kind: "vocab", note: "directional concrete", pos: "noun" },
  { id: "heta", kana: "へた", kanji: "下手", romaji: "heta", meaningEn: "unskillful", emoji: "👎", fromModule: "m24", blocked: true, kind: "vocab", note: "thumbs down as unskillful proxy; no picture debut (inv-30 census 2026-08-20): named first by its own module's rule card, which compiles to a pinned step no debut MCQ can precede (m20/m21 card-steals-the-picture rule; netsu precedent)", pos: "adjective", conjugation: { class: "na-adj", entryId: "heta" } },
  { id: "ryoushin", kana: "りょうしん", kanji: "両親", romaji: "ryoushin", meaningEn: "both parents", emoji: "👪", fromModule: "future", freqRank: 116, kind: "vocab", note: "family glyph implies parents", pos: "noun" },
  { id: "narabu", kana: "ならぶ", kanji: "並ぶ", romaji: "narabu", meaningEn: "to line up, to stand in a line", fromModule: "future", freqRank: 117, kind: "vocab", blocked: true, note: "no single-glyph for line-up; abstract action", pos: "verb", conjugation: { class: "godan" } },
  { id: "naraberu", kana: "ならべる", kanji: "並べる", romaji: "naraberu", meaningEn: "to line up, to set up", emoji: "📊", fromModule: "future", freqRank: 118, kind: "vocab", blocked: true, note: "no clean glyph for 'arrange in a row'; risk of confusion", pos: "verb", conjugation: { class: "ichidan" } },
  { id: "naka", kana: "なか", kanji: "中", romaji: "naka", meaningEn: "inside", emoji: "🎯", fromModule: "m6", introducedByLessonId: "ja-m17-8-1", kind: "vocab", blocked: true, note: "bullseye reads as 'target' not 'middle'", pos: "noun" },
  { id: "marui", kana: "まるい", kanji: "丸い / 円い", romaji: "marui", meaningEn: "round, circular", emoji: "⭕", fromModule: "future", freqRank: 119, kind: "vocab", note: "circle", pos: "adjective", conjugation: { class: "i-adj" } },
  { id: "noru", kana: "のる", kanji: "乗る", romaji: "noru", meaningEn: "to get on, to ride", emoji: "🚗", fromModule: "m23", blocked: true, kind: "vocab", note: "car as ride proxy; no picture debut (inv-30 census 2026-08-20): くるま's 🚗 owns the glyph (m19/m24 ruling: a debut distractor the picture names equally well)", pos: "verb", conjugation: { class: "godan", entryId: "noru" } },
  { id: "ku", kana: "く", kanji: "九", romaji: "ku", meaningEn: "nine", emoji: "9️⃣", fromModule: "future", freqRank: 120, kind: "vocab", pos: "number" },
  { id: "kokonotsu", kana: "ここのつ", kanji: "九つ", romaji: "kokonotsu", meaningEn: "nine", emoji: "9️⃣", fromModule: "future", freqRank: 121, kind: "vocab", pos: "number" },
  { id: "kokonoka", kana: "ここのか", kanji: "九日", romaji: "kokonoka", meaningEn: "nine days, ninth day", fromModule: "future", freqRank: 122, kind: "vocab", blocked: true, note: "no ordinal-day glyph", pos: "number" },
  { id: "hatsuka", kana: "はつか", kanji: "二十日", romaji: "hatsuka", meaningEn: "twenty days, twentieth", fromModule: "future", freqRank: 123, kind: "vocab", blocked: true, note: "day counter; abstract", pos: "number" },
  { id: "hatachi", kana: "はたち", kanji: "二十歳", romaji: "hatachi", meaningEn: "20 years old, 20th year", emoji: "🔞", fromModule: "m17", kind: "vocab", blocked: true, note: "age-20 milestone; Japanese coming-of-age — blocked because 🔞 is an age-restriction sign, not the age (m17's own ruling: every new atom there is imageable: false)", pos: "number" },
  { id: "futsuka", kana: "ふつか", kanji: "二日", romaji: "futsuka", meaningEn: "two days, second day of the month", fromModule: "future", freqRank: 124, kind: "vocab", blocked: true, note: "day counter; abstract", pos: "number" },
  { id: "itsutsu", kana: "いつつ", kanji: "五つ", romaji: "itsutsu", meaningEn: "five", emoji: "5️⃣", fromModule: "future", freqRank: 125, kind: "vocab", pos: "number" },
  { id: "itsuka", kana: "いつか", kanji: "五日", romaji: "itsuka", meaningEn: "five days, fifth day", fromModule: "future", freqRank: 126, kind: "vocab", blocked: true, note: "day counter; abstract", pos: "number" },
  { id: "kousaten", kana: "こうさてん", kanji: "交差点", romaji: "kousaten", meaningEn: "intersection", emoji: "🚦", fromModule: "m32", kind: "vocab", note: "traffic light for intersection", pos: "noun" },
  { id: "kouban", kana: "こうばん", kanji: "交番", romaji: "kouban", meaningEn: "police box", fromModule: "future", freqRank: 127, kind: "vocab", note: "police car; closest Noto for police context", pos: "noun" },
  { id: "ima", kana: "いま", kanji: "今", romaji: "ima", meaningEn: "now", emoji: "⏰", fromModule: "m10", kind: "vocab", note: "clock = now/time", pos: "noun" },
  { id: "kotoshi", kana: "ことし", kanji: "今年", romaji: "kotoshi", meaningEn: "this year", fromModule: "m11", kind: "vocab", blocked: true, note: "deictic time expression; taught by m11 vocab pack 2026-07-29 (B067); was m18", pos: "noun" },
  { id: "konban", kana: "こんばん", kanji: "今晩", romaji: "konban", meaningEn: "this evening", emoji: "🌃", fromModule: "future", freqRank: 128, kind: "vocab", note: "night scene as evening cue (loses 'this' nuance)", pos: "noun" },
  { id: "kongetsu", kana: "こんげつ", kanji: "今月", romaji: "kongetsu", meaningEn: "this month", emoji: "📅", fromModule: "future", freqRank: 129, kind: "vocab", note: "calendar", pos: "noun" },
  { id: "kesa", kana: "けさ", kanji: "今朝", romaji: "kesa", meaningEn: "this morning", emoji: "🌅", fromModule: "m13", kind: "vocab", blocked: true, note: "taught by m13 vocab pack 2026-07-29 (B067); was m10. blocked: 🌅 belongs to あさ — sunrise cannot discriminate 'this' morning", pos: "noun" },
  { id: "konshuu", kana: "こんしゅう", kanji: "今週", romaji: "konshuu", meaningEn: "this week", fromModule: "future", freqRank: 130, kind: "vocab", blocked: true, note: "temporal abstraction", pos: "noun" },
  { id: "shigoto", kana: "しごと", kanji: "仕事", romaji: "shigoto", meaningEn: "job", emoji: "💼", fromModule: "m28", blocked: true, kind: "vocab", pos: "noun", note: "no picture debut (inv-30 census 2026-08-20): はたらく's 💼 owns the glyph (m19/m24 ruling: a debut distractor the picture names equally well)" },
  { id: "yasumi", kana: "やすみ", kanji: "休み", romaji: "yasumi", meaningEn: "rest, holiday", emoji: "😴", fromModule: "m16", kind: "vocab", note: "sleeping face as rest proxy", pos: "noun" },
  { id: "yasumu", kana: "やすむ", kanji: "休む", romaji: "yasumu", meaningEn: "to rest", emoji: "😴", fromModule: "future", freqRank: 131, kind: "vocab", note: "sleeping face — rest", pos: "verb", conjugation: { class: "godan" } },
  { id: "au", kana: "あう", kanji: "会う", romaji: "au", meaningEn: "to meet", emoji: "🤝", fromModule: "future", freqRank: 132, kind: "vocab", pos: "verb", conjugation: { class: "godan" } },
  { id: "kaisha", kana: "かいしゃ", kanji: "会社", romaji: "kaisha", meaningEn: "company", emoji: "🏢", fromModule: "m7", introducedByLessonId: "ja-m7-neo-7", kind: "vocab", note: "office building", pos: "noun" },
  { id: "obasan", kana: "おばさん", kanji: "伯母さん / 叔母さん", romaji: "obasan", meaningEn: "aunt", emoji: "👩", fromModule: "future", freqRank: 133, kind: "vocab", note: "woman; pair with phrase for aunt context", pos: "noun" },
  { id: "ojiisan", kana: "おじいさん", kanji: "伯父 / 叔父", romaji: "ojiisan", meaningEn: "grandfather, male senior citizen", emoji: "👴", fromModule: "future", freqRank: 134, kind: "vocab", note: "older man", pos: "noun" },
  { id: "hikui", kana: "ひくい", kanji: "低い", romaji: "hikui", meaningEn: "short, low", emoji: "⬇️", fromModule: "future", freqRank: 135, kind: "vocab", note: "down arrow as low cue (weak; ⬆️ used for 上)", pos: "adjective", conjugation: { class: "i-adj" } },
  { id: "sumu", kana: "すむ", kanji: "住む", romaji: "sumu", meaningEn: "to live in", emoji: "🏠", fromModule: "future", freqRank: 136, kind: "vocab", note: "house as live-in cue", pos: "verb", conjugation: { class: "godan", entryId: "sumu" } },
  { id: "tsukuru", kana: "つくる", kanji: "作る", romaji: "tsukuru", meaningEn: "to make", emoji: "🔨", fromModule: "future", freqRank: 137, kind: "vocab", note: "hammer as making/building proxy", pos: "verb", conjugation: { class: "godan" } },
  { id: "sakubun", kana: "さくぶん", kanji: "作文", romaji: "sakubun", meaningEn: "composition, writing", emoji: "📝", fromModule: "future", freqRank: 138, kind: "vocab", pos: "noun" },
  { id: "tsukau", kana: "つかう", kanji: "使う", romaji: "tsukau", meaningEn: "to use", emoji: "🔧", fromModule: "m16", kind: "vocab", note: "taught by m16 vocab pack 5 2026-07-30 (B067); was m29 with a dead ja-m29-1-1 attribution (old-course id — live m29 is ja-m29-neo-*) — deleted", pos: "verb", conjugation: { class: "godan", entryId: "tsukau" } },
  { id: "benri", kana: "べんり", kanji: "便利", romaji: "benri", meaningEn: "useful, convenient", emoji: "🛠️", fromModule: "m36", introducedByLessonId: "ja-m36-neo-6", kind: "vocab", blocked: true, note: "tools as useful proxy; blocked — IR marks m36 imageable:false, no image debut generated; 🛠️ stays as legacy flashcard art (the なおす m35 collision precedent)", pos: "adjective", conjugation: { class: "na-adj", entryId: "benri" } },
  { id: "kariru", kana: "かりる", kanji: "借りる", romaji: "kariru", meaningEn: "to borrow", emoji: "🤝", fromModule: "m31", kind: "vocab", blocked: true, note: "handshake as borrow/lend cue (weak but acceptable); blocked — 🤝 is also あう, かす and てつだう, all MET", pos: "verb", conjugation: { class: "ichidan" } },
  { id: "hataraku", kana: "はたらく", kanji: "働く", romaji: "hataraku", meaningEn: "to work", emoji: "💼", fromModule: "m7", introducedByLessonId: "ja-m7-neo-7", kind: "vocab", note: "briefcase", pos: "verb", conjugation: { class: "godan", entryId: "hataraku" } },
  { id: "kyoudai", kana: "きょうだい", kanji: "兄弟", romaji: "kyoudai", meaningEn: "(humble) siblings", emoji: "👫", fromModule: "m17", kind: "vocab", blocked: true, note: "two people; siblings — blocked because 👫 reads as two friends, not siblings (m17 ships every new atom there imageable: false)", pos: "noun" },
  { id: "saki", kana: "さき", kanji: "先", romaji: "saki", meaningEn: "the future, previous", fromModule: "future", freqRank: 139, introducedByLessonId: "ja-m16-3-2", kind: "vocab", blocked: true, note: "abstract temporal/positional — no concrete referent", pos: "noun" },
  { id: "sengetsu", kana: "せんげつ", kanji: "先月", romaji: "sengetsu", meaningEn: "last month", fromModule: "m11", kind: "vocab", blocked: true, note: "abstract time reference; taught by m11 vocab pack 2026-07-29 (B067); was m10", pos: "noun" },
  { id: "senshuu", kana: "せんしゅう", kanji: "先週", romaji: "senshuu", meaningEn: "last week", fromModule: "m11", kind: "vocab", blocked: true, note: "temporal abstraction; taught by m11 vocab pack 2026-07-29 (B067); was m10", pos: "noun" },
  { id: "hairu", kana: "はいる", kanji: "入る", romaji: "hairu", meaningEn: "to enter, to contain", emoji: "🚪", fromModule: "m23", blocked: true, kind: "vocab", note: "door as entering cue; no picture debut: 4-persona audit 2026-08-20: 🚪 graded 3/3/3/3 — a door reads exit/house as much as enter", pos: "verb", conjugation: { class: "godan", entryId: "hairu" } },
  { id: "ireru", kana: "いれる", kanji: "入れる", romaji: "ireru", meaningEn: "to put in", fromModule: "m33", kind: "vocab", blocked: true, note: "transitivity pair with はいる (m16) — blocked: 📥 cannot say whether somebody put the thing in", pos: "verb", conjugation: { class: "ichidan" } },
  { id: "iriguchi", kana: "いりぐち", kanji: "入口", romaji: "iriguchi", meaningEn: "entrance", emoji: "🚪", fromModule: "future", freqRank: 140, kind: "vocab", note: "door + kanji 入", pos: "noun" },
  { id: "zenbu", kana: "ぜんぶ", kanji: "全部", romaji: "zenbu", meaningEn: "all, everything", fromModule: "m38", introducedByLessonId: "ja-m38-neo-1", kind: "vocab", blocked: true, note: "quantifier abstract; re-stamped future → m38 2026-08-25 (m38 landing): the old ja-m29-2-2 attribution pointed into curriculum/_archive/m29.ts, dead per isDeadAttribution — m38-neo-1's own introduces: names it (ぜんぶ たべてしまった)", pos: "adverb" },
  { id: "yattsu", kana: "やっつ", kanji: "八つ", romaji: "yattsu", meaningEn: "eight", emoji: "8️⃣", fromModule: "future", freqRank: 141, kind: "vocab", pos: "number" },
  { id: "youka", kana: "ようか", kanji: "八日", romaji: "youka", meaningEn: "eight days, eighth day of the month", fromModule: "future", freqRank: 142, kind: "vocab", blocked: true, note: "no ordinal-day glyph", pos: "number" },
  { id: "yaoya", kana: "やおや", kanji: "八百屋", romaji: "yaoya", meaningEn: "greengrocer", emoji: "🥬", fromModule: "future", freqRank: 143, kind: "vocab", note: "leafy greens stand-in for greengrocer", pos: "noun" },
  { id: "muttsu", kana: "むっつ", kanji: "六つ", romaji: "muttsu", meaningEn: "six", emoji: "6️⃣", fromModule: "future", freqRank: 144, kind: "vocab", pos: "number" },
  { id: "muika", kana: "むいか", kanji: "六日", romaji: "muika", meaningEn: "six days, sixth day of the month", fromModule: "future", freqRank: 145, kind: "vocab", blocked: true, note: "date concept — no clean visual", pos: "number" },
  { id: "fuyu", kana: "ふゆ", kanji: "冬", romaji: "fuyu", meaningEn: "winter", emoji: "❄️", fromModule: "m25", blocked: true, kind: "vocab", pos: "noun", note: "no picture debut (inv-30 census 2026-08-20): ゆき's ❄️ owns the glyph (m19/m24 ruling: a debut distractor the picture names equally well)" },
  { id: "tsumetai", kana: "つめたい", kanji: "冷たい", romaji: "tsumetai", meaningEn: "cold to the touch", emoji: "🧊", fromModule: "m14", kind: "vocab", note: "ice cube; taught by m14 vocab pack 2026-07-29 (B067); was m8. Object-cold — keep distinct from さむい (weather-cold, m16 kara card)", pos: "adjective", conjugation: { class: "i-adj", entryId: "tsumetai" } },
  { id: "reizouko", kana: "れいぞうこ", kanji: "冷蔵庫", romaji: "reizouko", meaningEn: "refrigerator", emoji: "🧊", fromModule: "future", freqRank: 146, kind: "vocab", note: "ice cube as cold-storage proxy", pos: "noun" },
  { id: "dekakeru", kana: "でかける", kanji: "出かける", romaji: "dekakeru", meaningEn: "to go out", emoji: "🚶", fromModule: "future", freqRank: 147, kind: "vocab", note: "person walking", pos: "verb", conjugation: { class: "ichidan", entryId: "dekakeru" } },
  { id: "dasu", kana: "だす", kanji: "出す", romaji: "dasu", meaningEn: "to take out, to put out", fromModule: "m33", kind: "vocab", blocked: true, note: "transitivity pair with でる — blocked, same reason", pos: "verb", conjugation: { class: "godan" } },
  { id: "deru", kana: "でる", kanji: "出る", romaji: "deru", meaningEn: "to come out, to leave", fromModule: "m33", kind: "vocab", blocked: true, note: "transitivity pair with だす — blocked: 🚪 is already ドア's and はいる's", pos: "verb", conjugation: { class: "ichidan", entryId: "deru" } },
  { id: "deguchi", kana: "でぐち", kanji: "出口", romaji: "deguchi", meaningEn: "exit", emoji: "🚪", fromModule: "future", freqRank: 148, kind: "vocab", note: "door — paired w/ kanji 出", pos: "noun" },
  { id: "wakaru", kana: "わかる", kanji: "分かる", romaji: "wakaru", meaningEn: "to be understood", shortGloss: "to understand", emoji: "💡", fromModule: "future", freqRank: 149, kind: "vocab", blocked: true, note: "lightbulb already used for 電気; understanding too abstract. shortGloss uses the learner-facing sense so tiles sit consistently beside わからない 'don't understand' (m6 walk 2026-07-23)", pos: "verb", conjugation: { class: "godan", entryId: "wakaru" } },
  { id: "kiru-cut", kana: "きる", kanji: "切る", romaji: "kiru", meaningEn: "to cut", emoji: "✂️", fromModule: "future", freqRank: 150, kind: "vocab", pos: "verb", conjugation: { class: "godan" } },
  { id: "kitte", kana: "きって", kanji: "切手", romaji: "kitte", meaningEn: "postage stamp", emoji: "📮", fromModule: "future", freqRank: 151, kind: "vocab", note: "postbox; no stamp emoji in Noto", pos: "noun" },
  { id: "hajime", kana: "はじめ", kanji: "初め / 始め", romaji: "hajime", meaningEn: "beginning", emoji: "🚩", fromModule: "future", freqRank: 152, kind: "vocab", note: "checkered flag — start", pos: "noun" },
  { id: "hajimete", kana: "はじめて", kanji: "初めて", romaji: "hajimete", meaningEn: "for the first time", fromModule: "m11", kind: "vocab", blocked: true, note: "abstract adverb; taught by m11 vocab pack 2026-07-29 (B067); was m25 with dangling ja-m25-4-2 attribution — left unset so the lessonAtomIndex fallback attributes it", pos: "noun" },
  { id: "mae", kana: "まえ", kanji: "前", romaji: "mae", meaningEn: "before", fromModule: "m15", introducedByLessonId: "ja-m17-8-1", kind: "vocab", blocked: true, note: "polysemy: spatial 'in front' vs temporal 'before'; ambiguous", pos: "noun" },
  { id: "benkyousuru", kana: "べんきょうする", kanji: "勉強", romaji: "benkyousuru", meaningEn: "to study", emoji: "📚", fromModule: "future", freqRank: 153, kind: "vocab", note: "books", pos: "verb", conjugation: { class: "irregular", entryId: "benkyousuru" } },
  { id: "doubutsu", kana: "どうぶつ", kanji: "動物", romaji: "doubutsu", meaningEn: "animal", emoji: "🐾", fromModule: "m26", kind: "vocab", note: "paw prints as animal cue", pos: "noun" },
  { id: "tsutomeru", kana: "つとめる", kanji: "勤める", romaji: "tsutomeru", meaningEn: "to work for someone", emoji: "💼", fromModule: "future", freqRank: 154, kind: "vocab", note: "briefcase as employment proxy", pos: "verb", conjugation: { class: "ichidan" } },
  { id: "kita", kana: "きた", kanji: "北", romaji: "kita", meaningEn: "north", emoji: "🧭", fromModule: "future", freqRank: 155, kind: "vocab", note: "compass for cardinal direction", pos: "noun" },
  { id: "isha", kana: "いしゃ", kanji: "医者", romaji: "isha", meaningEn: "medical doctor", emoji: "👨‍⚕️", fromModule: "m22", kind: "vocab", pos: "noun" },
  { id: "too", kana: "とお", kanji: "十", romaji: "too", meaningEn: "ten", emoji: "🔟", fromModule: "m32", blocked: true, kind: "vocab", pos: "number", note: "no picture debut (inv-30 census 2026-08-20): じゅう's 🔟 owns the glyph (m19/m24 ruling: a debut distractor the picture names equally well)" },
  { id: "tooka", kana: "とおか", kanji: "十日", romaji: "tooka", meaningEn: "ten days, the tenth day", fromModule: "future", freqRank: 156, kind: "vocab", blocked: true, note: "day counter; abstract", pos: "number" },
  { id: "sen", kana: "せん", kanji: "千", romaji: "sen", meaningEn: "thousand", fromModule: "m20", kind: "vocab", blocked: true, note: "no canonical emoji for 1000; ambiguous with 100", pos: "number" },
  { id: "gozen", kana: "ごぜん", kanji: "午前", romaji: "gozen", meaningEn: "morning", emoji: "🌅", fromModule: "m11", blocked: true, kind: "vocab", note: "sunrise; no picture debut (inv-30 census 2026-08-20): あさ's 🌅 owns the glyph (m19/m24 ruling: a debut distractor the picture names equally well)", pos: "noun" },
  { id: "gogo", kana: "ごご", kanji: "午後", romaji: "gogo", meaningEn: "afternoon", emoji: "🌇", fromModule: "m11", kind: "vocab", note: "late-day cityscape as afternoon cue", pos: "noun" },
  { id: "han", kana: "はん", kanji: "半", romaji: "han", meaningEn: "half", emoji: "🌗", fromModule: "m11", blocked: true, kind: "vocab", note: "| swapped ½→🌗 (Noto has no fraction glyph; half-moon reads as 'half'); no picture debut: 4-persona audit 2026-08-20: 🌗 graded 2/2/2/2 — the moon phase reads night/moon, never a clock half", pos: "noun" },
  { id: "hanbun", kana: "はんぶん", kanji: "半分", romaji: "hanbun", meaningEn: "half minute", emoji: "🌗", fromModule: "future", freqRank: 157, kind: "vocab", note: "half symbol | swapped ½→🌗 (Noto has no fraction glyph; half-moon reads as 'half')", pos: "noun" },
  { id: "minami", kana: "みなみ", kanji: "南", romaji: "minami", meaningEn: "south", emoji: "⬇️", fromModule: "future", freqRank: 158, kind: "vocab", note: "down-arrow as south cue (map convention)", pos: "noun" },
  { id: "abunai", kana: "あぶない", kanji: "危ない", romaji: "abunai", meaningEn: "dangerous", emoji: "⚠️", fromModule: "future", freqRank: 159, kind: "vocab", pos: "adjective", conjugation: { class: "i-adj" } },
  { id: "tamago", kana: "たまご", kanji: "卵", romaji: "tamago", meaningEn: "egg", emoji: "🥚", fromModule: "m20", kind: "vocab", pos: "noun" },
  { id: "atsui-kind", kana: "あつい", kanji: "厚い", romaji: "atsui", meaningEn: "kind, deep, thick", fromModule: "future", freqRank: 160, kind: "vocab", blocked: true, note: "polysemous abstract adjective", pos: "adjective", conjugation: { class: "i-adj" } },
  { id: "kyonen", kana: "きょねん", kanji: "去年", romaji: "kyonen", meaningEn: "last year", fromModule: "m11", kind: "vocab", blocked: true, note: "abstract time reference; no visual referent; taught by m11 vocab pack 2026-07-29 (B067); was m10", pos: "noun" },
  { id: "toru", kana: "とる", kanji: "取る", romaji: "toru", meaningEn: "to take something", emoji: "🤲", fromModule: "future", freqRank: 161, kind: "vocab", note: "open hands receiving", pos: "verb", conjugation: { class: "godan", entryId: "toru" } },
  { id: "kuchi", kana: "くち", kanji: "口", romaji: "kuchi", meaningEn: "mouth, opening", emoji: "👄", fromModule: "m22", kind: "vocab", pos: "noun" },
  { id: "furui", kana: "ふるい", kanji: "古い", romaji: "furui", meaningEn: "old (not used for people)", emoji: "🏚️", fromModule: "m12", kind: "vocab", note: "derelict house — old", pos: "adjective", conjugation: { class: "i-adj", entryId: "furui" } },
  { id: "daidokoro", kana: "だいどころ", kanji: "台所", romaji: "daidokoro", meaningEn: "kitchen", emoji: "🍳", fromModule: "future", freqRank: 162, kind: "vocab", note: "cooking pan stands in for kitchen", pos: "noun" },
  { id: "migi", kana: "みぎ", kanji: "右", romaji: "migi", meaningEn: "right side", emoji: "➡️", fromModule: "m32", kind: "vocab", pos: "noun" },
  { id: "onaji", kana: "おなじ", kanji: "同じ", romaji: "onaji", meaningEn: "same", emoji: "🟰", fromModule: "future", freqRank: 163, kind: "vocab", note: "equals sign", pos: "noun" },
  { id: "mukou", kana: "むこう", kanji: "向こう", romaji: "mukou", meaningEn: "over there", fromModule: "future", freqRank: 164, kind: "vocab", blocked: true, note: "spatial demonstrative", pos: "noun" },
  { id: "suu", kana: "すう", kanji: "吸う", romaji: "suu", meaningEn: "to smoke", emoji: "🚬", fromModule: "m16", kind: "vocab", blocked: true, note: "taught by m16 vocab pack 6 2026-07-30 (B067). Gloss trimmed to the one taught sense (D4; also 'to suck/sip'). blocked: 🚬 belongs to たばこ, taught in the same lesson", pos: "verb", conjugation: { class: "godan", entryId: "suu" } },
  { id: "fuku", kana: "ふく", kanji: "吹く", romaji: "fuku", meaningEn: "to blow", emoji: "💨", fromModule: "future", freqRank: 165, kind: "vocab", note: "wind-puff as blowing cue", pos: "verb", conjugation: { class: "godan" } },
  { id: "yobu", kana: "よぶ", kanji: "呼ぶ", romaji: "yobu", meaningEn: "to call out, to invite", emoji: "📣", fromModule: "future", freqRank: 166, kind: "vocab", note: "megaphone as call-out cue", pos: "verb", conjugation: { class: "godan" } },
  { id: "saku", kana: "さく", kanji: "咲く", romaji: "saku", meaningEn: "to bloom", emoji: "🌷", fromModule: "m32", kind: "vocab", blocked: true, note: "tulip, avoiding 🌸 per rubric (cherry-blossom specific); blocked anyway — a tulip still reads as はな, which is met from m1", pos: "verb", conjugation: { class: "godan" } },
  { id: "mondai", kana: "もんだい", kanji: "問題", romaji: "mondai", meaningEn: "problem", emoji: "❓", fromModule: "future", freqRank: 167, kind: "vocab", note: "question mark as problem proxy", pos: "noun" },
  { id: "kissaten", kana: "きっさてん", kanji: "喫茶店", romaji: "kissaten", meaningEn: "coffee lounge", emoji: "☕", fromModule: "m13", kind: "vocab", note: "coffee cup; café", pos: "noun" },
  // BLOCKED 2026-07-27 (m13-neo authoring). し is a ONE-KANA surface, so the
  // invariant-30 guard's substring scan matched it inside したい / わたし /
  // おいしい and demanded a picture debut in every module tagged m13 — for a
  // reading the neo course never teaches (m9 teaches よん, not し). A 4️⃣ MCQ
  // whose answer is the bare kana し is also genuinely ambiguous against the
  // kana ladder. `blocked` is exactly the "no image MCQ" flag; nothing else
  // about the atom changes.
  { id: "shi", kana: "し", kanji: "四", romaji: "shi", meaningEn: "four", emoji: "4️⃣", fromModule: "m13", kind: "vocab", blocked: true, pos: "number" },
  { id: "yottsu", kana: "よっつ", kanji: "四つ", romaji: "yottsu", meaningEn: "four", emoji: "4️⃣", fromModule: "future", freqRank: 168, kind: "vocab", pos: "number" },
  { id: "yokka", kana: "よっか", kanji: "四日", romaji: "yokka", meaningEn: "four days, fouth day of the month", emoji: "4️⃣", fromModule: "future", freqRank: 169, kind: "vocab", note: "number 4", pos: "number" },
  { id: "komaru", kana: "こまる", kanji: "困る", romaji: "komaru", meaningEn: "to be stuck, to be in trouble", shortGloss: "be stuck", emoji: "😟", fromModule: "m35", introducedByLessonId: "ja-m35-neo-5", kind: "vocab", blocked: true, note: "blocked: 😟 reads generic 'worried', not specifically 'stuck/in a bind' — こまる and たすかる are states no picture names honestly (m35 IR); 😟 stays as the row's legacy flashcard art, but no word_image_mcq debut is generated for it", pos: "verb", conjugation: { class: "godan" } },
  { id: "kuni", kana: "くに", kanji: "国", romaji: "kuni", meaningEn: "country", emoji: "🗾", fromModule: "future", freqRank: 170, kind: "vocab", note: "Japan map as country cue (concrete shape)", pos: "noun" },
  { id: "doyoubi", kana: "どようび", kanji: "土曜日", romaji: "doyoubi", meaningEn: "Saturday", fromModule: "m11", kind: "vocab", blocked: true, note: "day-of-week label; needs text not image; taught by m11 vocab pack 2026-07-29 (B067); was m12", pos: "noun" },
  { id: "chizu", kana: "ちず", kanji: "地図", romaji: "chizu", meaningEn: "map", emoji: "🗺️", fromModule: "future", freqRank: 171, kind: "vocab", pos: "noun" },
  { id: "shio", kana: "しお", kanji: "塩", romaji: "shio", meaningEn: "salt", emoji: "🧂", fromModule: "future", freqRank: 172, kind: "vocab", pos: "noun" },
  { id: "uru", kana: "うる", kanji: "売る", romaji: "uru", meaningEn: "to sell", emoji: "🏷️", fromModule: "m9", kind: "vocab", note: "price tag as sell proxy", pos: "verb", conjugation: { class: "godan" } },
  { id: "natsu", kana: "なつ", kanji: "夏", romaji: "natsu", meaningEn: "summer", emoji: "🌻", fromModule: "m25", kind: "vocab", note: "sunflower as summer cue (☀️ taken for warm)", pos: "noun" },
  { id: "natsuyasumi", kana: "なつやすみ", kanji: "夏休み", romaji: "natsuyasumi", meaningEn: "summer holiday", emoji: "🏖️", fromModule: "m13", kind: "vocab", pos: "noun" },
  { id: "yuugata", kana: "ゆうがた", kanji: "夕方", romaji: "yuugata", meaningEn: "evening", emoji: "🌇", fromModule: "future", freqRank: 173, kind: "vocab", note: "sunset over buildings", pos: "noun" },
  { id: "yuuhan", kana: "ゆうはん", kanji: "夕飯", romaji: "yuuhan", meaningEn: "dinner", emoji: "🍽️", fromModule: "future", freqRank: 174, kind: "vocab", pos: "noun" },
  { id: "soto", kana: "そと", kanji: "外", romaji: "soto", meaningEn: "outside", emoji: "🌳", fromModule: "m31", introducedByLessonId: "ja-m31-neo-1", kind: "vocab", blocked: true, note: "tree = outdoors; taught by m31-neo-1's axis card (うち/そと is the module's concept). no picture debut (inv-30 census 2026-08-20): にわ/き own 🌳 and the card names it first", pos: "noun" },
  { id: "gaikoku", kana: "がいこく", kanji: "外国", romaji: "gaikoku", meaningEn: "foreign country", emoji: "🌏", fromModule: "m23", kind: "vocab", note: "globe as foreign-country cue", pos: "noun" },
  { id: "gaikokujin", kana: "がいこくじん", kanji: "外国人", romaji: "gaikokujin", meaningEn: "foreigner", emoji: "🌍", fromModule: "future", freqRank: 175, kind: "vocab", note: "globe — foreign/abroad", pos: "noun" },
  { id: "ooi", kana: "おおい", kanji: "多い", romaji: "ooi", meaningEn: "many", fromModule: "future", freqRank: 176, introducedByLessonId: "ja-m22-2-2", kind: "vocab", blocked: true, note: "abstract quantifier; no canonical referent", pos: "adjective", conjugation: { class: "i-adj" } },
  { id: "yoru", kana: "よる", kanji: "夜", romaji: "yoru", meaningEn: "evening, night", emoji: "🌙", fromModule: "future", freqRank: 177, kind: "vocab", pos: "noun" },
  { id: "ookii", kana: "おおきい", kanji: "大きい", romaji: "ookii", meaningEn: "big", emoji: "🐋", fromModule: "m12", kind: "vocab", note: "elephant = big (size adjective)", pos: "adjective", conjugation: { class: "i-adj", entryId: "ookii" } },
  { id: "ookina", kana: "おおきな", kanji: "大きな", romaji: "ookina", meaningEn: "big", emoji: "🐋", fromModule: "future", freqRank: 178, kind: "vocab", note: "elephant as big proxy", pos: "determiner" },
  { id: "daijoubu", kana: "だいじょうぶ", kanji: "大丈夫", romaji: "daijoubu", meaningEn: "all right", emoji: "👌", fromModule: "m3", kind: "vocab", note: "OK sign", pos: "adjective", conjugation: { class: "na-adj", entryId: "daijoubu" } },
  { id: "otona", kana: "おとな", kanji: "大人", romaji: "otona", meaningEn: "adult", emoji: "🧑", fromModule: "future", freqRank: 179, kind: "vocab", pos: "noun" },
  { id: "taishikan", kana: "たいしかん", kanji: "大使館", romaji: "taishikan", meaningEn: "embassy", emoji: "🏛️", fromModule: "future", freqRank: 180, kind: "vocab", note: "classical building as embassy cue", pos: "noun" },
  { id: "taisetsu", kana: "たいせつ", kanji: "大切", romaji: "taisetsu", meaningEn: "important", emoji: "❗", fromModule: "m16", kind: "vocab", blocked: true, note: "taught by m16 vocab pack 6 2026-07-30 (B067, substitute for the homograph-loser 歯); was m27. blocked: an exclamation mark cannot name importance", pos: "adjective", conjugation: { class: "na-adj" } },
  { id: "oozei", kana: "おおぜい", kanji: "大勢", romaji: "oozei", meaningEn: "great number of people", emoji: "👨‍👩‍👧‍👦", fromModule: "future", freqRank: 181, kind: "vocab", note: "family cluster = many people", pos: "noun" },
  { id: "daisuki", kana: "だいすき", kanji: "大好き", romaji: "daisuki", meaningEn: "to be very likeable", emoji: "😍", fromModule: "future", freqRank: 182, kind: "vocab", note: "heart as love cue", pos: "adjective", conjugation: { class: "na-adj" } },
  { id: "daigaku", kana: "だいがく", kanji: "大学", romaji: "daigaku", meaningEn: "university", emoji: "🎓", fromModule: "m13", kind: "vocab", note: "graduation cap", pos: "noun" },
  { id: "tenki", kana: "てんき", kanji: "天気", romaji: "tenki", meaningEn: "weather", emoji: "⛅", fromModule: "m25", kind: "vocab", note: "sun-behind-cloud as generic weather cue", pos: "noun" },
  { id: "futoi", kana: "ふとい", kanji: "太い", romaji: "futoi", meaningEn: "fat", fromModule: "future", freqRank: 183, kind: "vocab", blocked: true, note: "polysemy fat/thick; person-emoji reads as body-shape; risky", pos: "adjective", conjugation: { class: "i-adj" } },
  { id: "okusan", kana: "おくさん", kanji: "奥さん", romaji: "okusan", meaningEn: "(honorable) wife", emoji: "👰", fromModule: "future", freqRank: 184, kind: "vocab", note: "bride stands in for wife", pos: "noun" },
  { id: "onna", kana: "おんな", kanji: "女", romaji: "onna", meaningEn: "woman", emoji: "👩", fromModule: "future", freqRank: 185, kind: "vocab", pos: "noun" },
  { id: "onnanoko", kana: "おんなのこ", kanji: "女の子", romaji: "onnanoko", meaningEn: "girl", emoji: "👧", fromModule: "future", freqRank: 186, kind: "vocab", pos: "noun" },
  { id: "suki", kana: "すき", kanji: "好き", romaji: "suki", meaningEn: "likeable", emoji: "💗", fromModule: "m13", kind: "vocab", blocked: true, note: "heart. fromModule re-homed m9 → m13 (2026-07-29, B067/B068): ja-m13-neo-7 introduces it — the legacy tag mismatched its live teaching module. blocked: the suki-kirai-no rule card IS the debut (m13 IR note), and ❤️ cannot cue 'likeable' against love-words", pos: "adjective", conjugation: { class: "na-adj", entryId: "suki" } },
  { id: "imouto", kana: "いもうと", kanji: "妹", romaji: "imouto", meaningEn: "(humble) younger sister", emoji: "👧", fromModule: "m17", blocked: true, kind: "vocab", note: "younger-girl approximation; sister relation context-dependent; no picture debut (inv-30 census 2026-08-20): named first by its own module's rule card, which compiles to a pinned step no debut MCQ can precede (m20/m21 card-steals-the-picture rule; netsu precedent)", pos: "noun" },
  { id: "hajimaru", kana: "はじまる", kanji: "始まる", romaji: "hajimaru", meaningEn: "to begin, to start (of itself)", fromModule: "m33", kind: "vocab", blocked: true, note: "transitivity pair with はじめる — blocked: a start is the same picture whoever started it", pos: "verb", conjugation: { class: "godan" } },
  { id: "iya", kana: "いや", kanji: "嫌", romaji: "iya", meaningEn: "unpleasant", emoji: "😒", fromModule: "future", freqRank: 187, kind: "vocab", note: "disgust face = unpleasant", pos: "adjective", conjugation: { class: "na-adj" } },
  { id: "kirai", kana: "きらい", kanji: "嫌い", romaji: "kirai", meaningEn: "hate", emoji: "🙅", fromModule: "m13", kind: "vocab", blocked: true, note: "person gesturing no. fromModule re-homed m9 → m13 (2026-07-29, B067/B068): ja-m13-neo-7 introduces it — the legacy tag left it graded-but-never-unlockable. blocked: the suki-kirai-no rule card IS the debut (m13 IR note)", pos: "adjective", conjugation: { class: "na-adj", entryId: "kirai" } },
  { id: "kodomo", kana: "こども", kanji: "子供", romaji: "kodomo", meaningEn: "child", emoji: "🧒", fromModule: "m31", kind: "vocab", pos: "noun" },
  { id: "jibiki", kana: "じびき", kanji: "字引", romaji: "jibiki", meaningEn: "dictionary", emoji: "📖", fromModule: "future", freqRank: 188, kind: "vocab", note: "open book", pos: "noun" },
  { id: "yasui", kana: "やすい", kanji: "安い", romaji: "yasui", meaningEn: "cheap", emoji: "🪙", fromModule: "m9", kind: "vocab", note: "coin as cheap/small-money proxy", pos: "adjective", conjugation: { class: "i-adj", entryId: "yasui" } },
  { id: "katei", kana: "かてい", kanji: "家庭", romaji: "katei", meaningEn: "household", emoji: "🏠", fromModule: "future", freqRank: 189, kind: "vocab", note: "house", pos: "noun" },
  { id: "shukudai", kana: "しゅくだい", kanji: "宿題", romaji: "shukudai", meaningEn: "homework", emoji: "📝", fromModule: "m32", blocked: true, kind: "vocab", pos: "noun", note: "no picture debut (inv-30 census 2026-08-20): テスト's 📝 owns the glyph (m19/m24 ruling: a debut distractor the picture names equally well)" },
  { id: "samui", kana: "さむい", kanji: "寒い", romaji: "samui", meaningEn: "cold", emoji: "🥶", fromModule: "m16", kind: "vocab", note: "cold face", pos: "adjective", conjugation: { class: "i-adj", entryId: "samui" } },
  { id: "neru", kana: "ねる", kanji: "寝る", romaji: "neru", meaningEn: "to go to bed, to sleep", emoji: "🛏️", fromModule: "m32", kind: "vocab", blocked: true, note: "bed; no picture debut (inv-30 census 2026-08-20): named first by m32-neo-1's own rule card example 「ごはんを たべたら、ねる。」, a pinned step no debut MCQ can precede (m20/m21 rule; netsu precedent)", pos: "verb", conjugation: { class: "ichidan", entryId: "neru" } },
  { id: "fuutou", kana: "ふうとう", kanji: "封筒", romaji: "fuutou", meaningEn: "envelope", emoji: "✉️", fromModule: "future", freqRank: 190, kind: "vocab", pos: "noun" },
  { id: "chiisai", kana: "ちいさい", kanji: "小さい", romaji: "chiisai", meaningEn: "little", fromModule: "m12", kind: "vocab", blocked: true, note: "abstract adjective; no canonical referent", pos: "adjective", conjugation: { class: "i-adj", entryId: "chiisai" } },
  { id: "chiisana", kana: "ちいさな", kanji: "小さな", romaji: "chiisana", meaningEn: "little", fromModule: "future", freqRank: 191, kind: "vocab", blocked: true, note: "prenominal adjective; abstract size, no referent", pos: "determiner" },
  { id: "sukoshi", kana: "すこし", kanji: "少し", romaji: "sukoshi", meaningEn: "few", emoji: "🤏", fromModule: "future", freqRank: 192, kind: "vocab", note: "pinching hand as small-amount proxy", pos: "adverb" },
  { id: "sukunai", kana: "すくない", kanji: "少ない", romaji: "sukunai", meaningEn: "a few", fromModule: "future", freqRank: 193, introducedByLessonId: "ja-m22-3-2", kind: "vocab", blocked: true, note: "abstract quantifier", pos: "noun" },
  { id: "iru-be", kana: "いる", kanji: "居る", romaji: "iru", meaningEn: "to be, to have (used for people and animals)", fromModule: "m6", introducedByLessonId: "ja-m11-4-1", kind: "vocab", blocked: true, note: "existence-of — rubric explicit block", pos: "verb", conjugation: { class: "ichidan" } },
  { id: "hidari", kana: "ひだり", kanji: "左", romaji: "hidari", meaningEn: "left hand side", emoji: "👈", fromModule: "m32", kind: "vocab", pos: "noun" },
  { id: "sasu", kana: "さす", kanji: "差す", romaji: "sasu", meaningEn: "to stretch out hands, to raise an umbrella", fromModule: "future", freqRank: 194, kind: "vocab", blocked: true, note: "polysemous action verb", pos: "verb", conjugation: { class: "godan" } },
  { id: "kaeru", kana: "かえる", kanji: "帰る", romaji: "kaeru", meaningEn: "to go back", emoji: "🏠", fromModule: "m19", kind: "vocab", blocked: true, note: "home as return-destination cue; re-homed m14→m19 2026-07-29 (B068 trap 2: m19 is the live teaching module — its IR declares it new); blocked: 🏠 is いえ/すむ, m19 IR keeps it imageable:false", pos: "verb", conjugation: { class: "godan", entryId: "kaeru" } },
  { id: "toshi", kana: "とし", kanji: "年", romaji: "toshi", meaningEn: "year", emoji: "🗓️", fromModule: "future", freqRank: 195, kind: "vocab", note: "calendar as year proxy", pos: "noun" },
  { id: "hiroi", kana: "ひろい", kanji: "広い", romaji: "hiroi", meaningEn: "spacious, wide", emoji: "🏜️", fromModule: "m27", kind: "vocab", note: "open desert as spacious cue (weak)", pos: "adjective", conjugation: { class: "i-adj", entryId: "hiroi" } },
  { id: "suwaru", kana: "すわる", kanji: "座る", romaji: "suwaru", meaningEn: "to sit", emoji: "🪑", fromModule: "future", freqRank: 196, kind: "vocab", note: "chair as sitting proxy", pos: "verb", conjugation: { class: "godan", entryId: "suwaru" } },
  { id: "niwa", kana: "にわ", kanji: "庭", romaji: "niwa", meaningEn: "garden", emoji: "🌳", fromModule: "future", freqRank: 197, kind: "vocab", note: "tree as garden proxy", pos: "noun" },
  { id: "rouka", kana: "ろうか", kanji: "廊下", romaji: "rouka", meaningEn: "corridor", fromModule: "future", freqRank: 198, kind: "vocab", blocked: true, note: "no corridor emoji in Noto", pos: "noun" },
  { id: "tatemono", kana: "たてもの", kanji: "建物", romaji: "tatemono", meaningEn: "building", emoji: "🏢", fromModule: "future", freqRank: 199, kind: "vocab", pos: "noun" },
  { id: "hiku", kana: "ひく", kanji: "引く", romaji: "hiku", meaningEn: "to pull", emoji: "🪝", fromModule: "m14", kind: "vocab", note: "hook implies pulling; taught by m14 vocab pack 2026-07-29 (B067); was m20", pos: "verb", conjugation: { class: "godan", entryId: "hiku" } },
  { id: "otouto", kana: "おとうと", kanji: "弟", romaji: "otouto", meaningEn: "younger brother", emoji: "👦", fromModule: "m17", blocked: true, kind: "vocab", note: "boy reads younger-male; pair w/ kanji; no picture debut (inv-30 census 2026-08-20): あに's 👦 owns the glyph (m19/m24 ruling: a debut distractor the picture names equally well)", pos: "noun" },
  { id: "yowai", kana: "よわい", kanji: "弱い", romaji: "yowai", meaningEn: "weak", emoji: "🪶", fromModule: "m16", kind: "vocab", blocked: true, note: "taught by m16 vocab pack 6 2026-07-30 (B067); was m18. blocked: a feather cannot honestly cue 'weak' — bad image is worse than no image", pos: "adjective", conjugation: { class: "i-adj" } },
  { id: "tsuyoi", kana: "つよい", kanji: "強い", romaji: "tsuyoi", meaningEn: "powerful", emoji: "💪", fromModule: "m28", blocked: true, kind: "vocab", note: "flexed bicep; no picture debut (inv-30 census 2026-08-20): げんき's 💪 owns the glyph (m19/m24 ruling: a debut distractor the picture names equally well)", pos: "adjective", conjugation: { class: "i-adj" } },
  { id: "hiku-play", kana: "ひく", kanji: "弾く", romaji: "hiku", meaningEn: "to play an instrument with strings, including piano", emoji: "🎻", fromModule: "future", freqRank: 200, kind: "vocab", note: "piano keys", pos: "verb", conjugation: { class: "godan" } },
  { id: "matsu", kana: "まつ", kanji: "待つ", romaji: "matsu", meaningEn: "to wait", emoji: "⏳", fromModule: "m14", kind: "vocab", note: "hourglass", pos: "verb", conjugation: { class: "godan", entryId: "matsu" } },
  { id: "ato", kana: "あと", kanji: "後", romaji: "ato", meaningEn: "afterwards", fromModule: "future", freqRank: 201, introducedByLessonId: "ja-m13-6-2", kind: "vocab", blocked: true, note: "abstract temporal adverb", pos: "noun" },
  { id: "ushiro", kana: "うしろ", kanji: "後ろ", romaji: "ushiro", meaningEn: "behind", emoji: "⬅️", fromModule: "future", freqRank: 202, introducedByLessonId: "ja-m17-8-1", kind: "vocab", blocked: true, note: "spatial relation; arrow ambiguous with left", pos: "noun" },
  { id: "wasureru", kana: "わすれる", kanji: "忘れる", romaji: "wasureru", meaningEn: "to forget", emoji: "🤔", fromModule: "future", freqRank: 203, kind: "vocab", note: "thinking face as memory-lapse cue (weak)", pos: "verb", conjugation: { class: "ichidan" } },
  { id: "isogashii", kana: "いそがしい", kanji: "忙しい", romaji: "isogashii", meaningEn: "busy, irritated", emoji: "😰", fromModule: "m15", kind: "vocab", note: "anxious sweat = busy/overwhelmed", pos: "adjective", conjugation: { class: "i-adj" } },
  { id: "warui", kana: "わるい", kanji: "悪い", romaji: "warui", meaningEn: "bad", emoji: "👎", fromModule: "m16", kind: "vocab", blocked: true, note: "taught by m16 vocab pack 6 2026-07-30 (B067); was m8. blocked: 👎 is a gesture — it reads 'no/dislike', not 'bad' — and the わるい/よわい pair debuts on the rule card", pos: "adjective", conjugation: { class: "i-adj", entryId: "warui" } },
  { id: "imi", kana: "いみ", kanji: "意味", romaji: "imi", meaningEn: "meaning", fromModule: "m16", kind: "vocab", blocked: true, note: "abstract noun — per rubric. Taught by m16 vocab pack 5 2026-07-30 (B067); was m26 with a dead ja-m26-5-1 attribution — deleted", pos: "noun" },
  { id: "to", kana: "と", kanji: "戸", romaji: "to", meaningEn: "Japanese style door", emoji: "🚪", fromModule: "future", freqRank: 204, kind: "vocab", pos: "noun" },
  { id: "tokoro", kana: "ところ", kanji: "所", romaji: "tokoro", meaningEn: "place", fromModule: "future", freqRank: 205, introducedByLessonId: "ja-m9-1-2", kind: "vocab", blocked: true, note: "abstract noun (per rubric: ところ explicitly flagged)", pos: "noun" },
  { id: "te", kana: "て", kanji: "手", romaji: "te", meaningEn: "hand", emoji: "✋", fromModule: "m22", kind: "vocab", pos: "noun" },
  { id: "osu", kana: "おす", kanji: "押す", romaji: "osu", meaningEn: "to push, to stamp something", emoji: "👆", fromModule: "m32", kind: "vocab", blocked: true, note: "pointing/pushing finger; blocked — 👆 reads as まっすぐ's ⬆️ at thumbnail size, and まっすぐ is met one lesson earlier", pos: "verb", conjugation: { class: "godan" } },
  { id: "motsu", kana: "もつ", kanji: "持つ", romaji: "motsu", meaningEn: "to hold", emoji: "✊", fromModule: "m14", kind: "vocab", note: "fist as holding cue; taught by m14 vocab pack 2026-07-29 (B067); was m15", pos: "verb", conjugation: { class: "godan", entryId: "motsu" } },
  { id: "soujisuru", kana: "そうじする", kanji: "掃除", romaji: "soujisuru", meaningEn: "to clean, to sweep", emoji: "🧹", fromModule: "future", freqRank: 206, kind: "vocab", note: "broom", pos: "verb", conjugation: { class: "irregular" } },
  { id: "jugyou", kana: "じゅぎょう", kanji: "授業", romaji: "jugyou", meaningEn: "lesson, class work", emoji: "👨‍🏫", fromModule: "m7", introducedByLessonId: "ja-m7-neo-7", kind: "vocab", note: "teacher as class cue", pos: "noun" },
  { id: "toru-take", kana: "とる", kanji: "撮る", romaji: "toru", meaningEn: "to take a photo or record a film", emoji: "📸", fromModule: "m30", kind: "vocab", note: "camera with flash", pos: "verb", conjugation: { class: "godan" } },
  { id: "oshieru", kana: "おしえる", kanji: "教える", romaji: "oshieru", meaningEn: "to teach, to tell", emoji: "👨‍🏫", fromModule: "m8", kind: "vocab", note: "teacher ZWJ glyph", pos: "verb", conjugation: { class: "ichidan", entryId: "oshieru" } },
  { id: "kyoushitsu", kana: "きょうしつ", kanji: "教室", romaji: "kyoushitsu", meaningEn: "classroom", emoji: "🏫", fromModule: "m16", kind: "vocab", note: "school; closest concrete", pos: "noun" },
  { id: "sanposuru", kana: "さんぽする", kanji: "散歩", romaji: "sanposuru", meaningEn: "to stroll", emoji: "🚶", fromModule: "future", freqRank: 208, kind: "vocab", pos: "verb", conjugation: { class: "irregular" } },
  { id: "bunshou", kana: "ぶんしょう", kanji: "文章", romaji: "bunshou", meaningEn: "sentence, text", emoji: "📝", fromModule: "future", freqRank: 209, kind: "vocab", pos: "noun" },
  { id: "atarashii", kana: "あたらしい", kanji: "新しい", romaji: "atarashii", meaningEn: "new", emoji: "🆕", fromModule: "m12", kind: "vocab", pos: "adjective", conjugation: { class: "i-adj", entryId: "atarashii" } },
  { id: "kata", kana: "かた", kanji: "方", romaji: "kata", meaningEn: "person, way of doing", fromModule: "future", freqRank: 210, introducedByLessonId: "ja-m19-4-2", kind: "vocab", blocked: true, note: "polysemous abstract noun (per rubric)", pos: "noun" },
  { id: "ryokou", kana: "りょこう", kanji: "旅行", romaji: "ryokou", meaningEn: "travel", emoji: "✈️", fromModule: "m15", kind: "vocab", pos: "noun" },
  { id: "nichiyoubi", kana: "にちようび", kanji: "日曜日", romaji: "nichiyoubi", meaningEn: "Sunday", fromModule: "m11", kind: "vocab", blocked: true, note: "day-of-week label; needs text not image; taught by m11 vocab pack 2026-07-29 (B067); was m12", pos: "noun" },
  { id: "hayai-early", kana: "はやい", kanji: "早い", romaji: "hayai", meaningEn: "early", emoji: "⏰", fromModule: "m13", kind: "vocab", blocked: true, note: "taught by m13 vocab pack 2026-07-29 (B067); was m12. blocked: ⏰ belongs to じかん. Course-wide homograph ruling (m20): bare kana はやい resolves HERE, the 'early' sense — 速い stays untaught", pos: "adjective", conjugation: { class: "i-adj", entryId: "hayai" } },
  { id: "akarui", kana: "あかるい", kanji: "明い", romaji: "akarui", meaningEn: "bright", emoji: "💡", fromModule: "future", freqRank: 211, kind: "vocab", note: "lightbulb", pos: "adjective", conjugation: { class: "i-adj" } },
  { id: "ashita", kana: "あした", kanji: "明日", romaji: "ashita", meaningEn: "tomorrow", fromModule: "m11", kind: "vocab", blocked: true, note: "abstract time reference; re-homed m12→m11 2026-07-29 (B068 trap 2: ja-m11-neo-3 introduces it)", pos: "noun" },
  { id: "yasashii", kana: "やさしい", kanji: "易しい", romaji: "yasashii", meaningEn: "easy, simple", fromModule: "m16", kind: "vocab", blocked: true, note: "abstract adjective; homophone with 'kind' increases ambiguity. Taught by m16 vocab pack 5 2026-07-30 (B067); was m8", pos: "adjective", conjugation: { class: "i-adj", entryId: "yasashii" } },
  { id: "eiga", kana: "えいが", kanji: "映画", romaji: "eiga", meaningEn: "movie", emoji: "🎬", fromModule: "m15", kind: "vocab", pos: "noun" },
  { id: "eigakan", kana: "えいがかん", kanji: "映画館", romaji: "eigakan", meaningEn: "cinema", emoji: "🎦", fromModule: "future", freqRank: 212, kind: "vocab", pos: "noun" },
  { id: "haru", kana: "はる", kanji: "春", romaji: "haru", meaningEn: "spring", emoji: "🌱", fromModule: "m25", blocked: true, kind: "vocab", note: "cherry blossom = spring; no picture debut (inv-30 census 2026-08-20): はな's 🌸 owns the glyph (m19/m24 ruling: a debut distractor the picture names equally well)", pos: "noun" },
  { id: "yuube", kana: "ゆうべ", kanji: "昨夜", romaji: "yuube", meaningEn: "last night", emoji: "🌙", fromModule: "m13", kind: "vocab", blocked: true, note: "taught by m13 vocab pack 2026-07-29 (B067); was m10. blocked: 🌙 belongs to つき", pos: "noun" },
  { id: "kinou", kana: "きのう", kanji: "昨日", romaji: "kinou", meaningEn: "yesterday", emoji: "📅", fromModule: "m11", blocked: true, kind: "vocab", note: "calendar; pair with phrase; no picture debut (inv-30 census 2026-08-20): きょう's 📅 owns the glyph (m19/m24 ruling: a debut distractor the picture names equally well)", pos: "noun" },
  { id: "hiru", kana: "ひる", kanji: "昼", romaji: "hiru", meaningEn: "noon, daytime", emoji: "☀️", fromModule: "future", freqRank: 213, kind: "vocab", note: "sun = daytime", pos: "noun" },
  { id: "hirugohan", kana: "ひるごはん", kanji: "昼御飯", romaji: "hirugohan", meaningEn: "midday meal", emoji: "🍱", fromModule: "future", freqRank: 214, kind: "vocab", note: "bento reads as midday meal", pos: "noun" },
  { id: "tokidoki", kana: "ときどき", kanji: "時々", romaji: "tokidoki", meaningEn: "sometimes", fromModule: "m22", kind: "vocab", blocked: true, note: "frequency adverb", pos: "adverb" },
  { id: "ban", kana: "ばん", kanji: "晩", romaji: "ban", meaningEn: "evening", emoji: "🌆", fromModule: "m12", kind: "vocab", pos: "noun" },
  { id: "bangohan", kana: "ばんごはん", kanji: "晩御飯", romaji: "bangohan", meaningEn: "evening meal", emoji: "🍱", fromModule: "m32", introducedByLessonId: "ja-m23-2-2", blocked: true, kind: "vocab", note: "bento meal. introducedByLessonId pinned 2026-07-01: paatii's static entry on ja-m23-2-2 suppresses that lesson's fallback unlock path, and this was the only lesson surfacing ばんごはん.; no picture debut (inv-30 census 2026-08-20): りょうり/たべもの's 🍱 owns the glyph (m19/m24 ruling: a debut distractor the picture names equally well)", pos: "noun" },
  { id: "hare", kana: "はれ", kanji: "晴れ", romaji: "hare", meaningEn: "clear weather", emoji: "☀️", fromModule: "m25", kind: "vocab", note: "sun", pos: "noun" },
  { id: "hareru", kana: "はれる", kanji: "晴れる", romaji: "hareru", meaningEn: "to be sunny", emoji: "🌞", fromModule: "future", freqRank: 215, kind: "vocab", pos: "verb", conjugation: { class: "ichidan" } },
  { id: "hima", kana: "ひま", kanji: "暇", romaji: "hima", meaningEn: "free time", emoji: "🛋️", fromModule: "m9", kind: "vocab", note: "couch = leisure/free time", pos: "adjective", conjugation: { class: "na-adj", entryId: "hima" } },
  { id: "atsui", kana: "あつい", kanji: "暑い", romaji: "atsui", meaningEn: "hot", emoji: "🥵", fromModule: "m25", kind: "vocab", note: "hot face", pos: "adjective", conjugation: { class: "i-adj", entryId: "atsui" } },
  { id: "atatakai", kana: "あたたかい", kanji: "暖かい", romaji: "atatakai", meaningEn: "warm", emoji: "☀️", fromModule: "m25", blocked: true, kind: "vocab", note: "sun as warmth cue; no picture debut (inv-30 census 2026-08-20): はれ's ☀️ owns the glyph (m19/m24 ruling: a debut distractor the picture names equally well)", pos: "adjective", conjugation: { class: "i-adj", entryId: "atatakai" } },
  { id: "kurai", kana: "くらい", kanji: "暗い", romaji: "kurai", meaningEn: "gloomy", emoji: "🌑", fromModule: "future", freqRank: 216, kind: "vocab", note: "new moon = dark", pos: "adjective", conjugation: { class: "i-adj" } },
  { id: "kumori", kana: "くもり", kanji: "曇り", romaji: "kumori", meaningEn: "cloudy weather", emoji: "☁️", fromModule: "m25", blocked: true, kind: "vocab", pos: "noun", note: "no picture debut (inv-30 census 2026-08-20): そら's ☁️ owns the glyph (m19/m24 ruling: a debut distractor the picture names equally well)" },
  { id: "kumoru", kana: "くもる", kanji: "曇る", romaji: "kumoru", meaningEn: "to become cloudy, to become dim", emoji: "☁️", fromModule: "future", freqRank: 217, kind: "vocab", note: "cloud — also used for 空 sky, mild collision", pos: "verb", conjugation: { class: "godan" } },
  { id: "magaru", kana: "まがる", kanji: "曲る", romaji: "magaru", meaningEn: "to turn, to bend", emoji: "↩️", fromModule: "m32", kind: "vocab", note: "curved arrow", pos: "verb", conjugation: { class: "godan" } },
  { id: "getsuyoubi", kana: "げつようび", kanji: "月曜日", romaji: "getsuyoubi", meaningEn: "Monday", fromModule: "m11", kind: "vocab", blocked: true, note: "day-of-week label; needs text not image; taught by m11 vocab pack 2026-07-29 (B067); was m12", pos: "noun" },
  { id: "yuumei", kana: "ゆうめい", kanji: "有名", romaji: "yuumei", meaningEn: "famous", emoji: "⭐", fromModule: "m12", kind: "vocab", note: "star as fame cue", pos: "adjective", conjugation: { class: "na-adj", entryId: "yuumei" } },
  { id: "fuku-clothes", kana: "ふく", kanji: "服", romaji: "fuku", meaningEn: "clothes", emoji: "👕", fromModule: "m13", kind: "vocab", note: "t-shirt", pos: "noun" },
  { id: "asagohan", kana: "あさごはん", kanji: "朝御飯", romaji: "asagohan", meaningEn: "breakfast", emoji: "🍳", fromModule: "future", freqRank: 218, kind: "vocab", note: "fried egg — also used for 台所; mild collision", pos: "noun" },
  { id: "ki", kana: "き", kanji: "木", romaji: "ki", meaningEn: "tree, wood", emoji: "🌳", fromModule: "m18", kind: "vocab", pos: "noun" },
  { id: "mokuyoubi", kana: "もくようび", kanji: "木曜日", romaji: "mokuyoubi", meaningEn: "Thursday", fromModule: "m11", kind: "vocab", blocked: true, note: "day-of-week label; needs text not image; taught by m11 vocab pack 2026-07-29 (B067); was m12", pos: "noun" },
  { id: "hondana", kana: "ほんだな", kanji: "本棚", romaji: "hondana", meaningEn: "bookshelves", emoji: "📚", fromModule: "future", freqRank: 219, kind: "vocab", note: "stacked books", pos: "noun" },
  { id: "mura", kana: "むら", kanji: "村", romaji: "mura", meaningEn: "village", emoji: "🏘️", fromModule: "future", freqRank: 220, kind: "vocab", pos: "noun" },
  { id: "kuru", kana: "くる", kanji: "来る", romaji: "kuru", meaningEn: "to come", fromModule: "m11", kind: "vocab", blocked: true, note: "directional verb; arrow ambiguous with go/return", pos: "verb", conjugation: { class: "irregular", entryId: "kuru" } },
  { id: "rainen", kana: "らいねん", kanji: "来年", romaji: "rainen", meaningEn: "next year", emoji: "📅", fromModule: "m34", introducedByLessonId: "ja-m34-neo-5", kind: "vocab", blocked: true, note: "calendar glyph is every time-word's picture (きょう/きのう share 📅) — no honest MCQ; debuts in m34 L5 intent sentences", pos: "noun" },
  { id: "raigetsu", kana: "らいげつ", kanji: "来月", romaji: "raigetsu", meaningEn: "next month", fromModule: "m11", kind: "vocab", blocked: true, note: "temporal abstraction; taught by m11 vocab pack 2026-07-29 (B067); was m25", pos: "noun" },
  { id: "raishuu", kana: "らいしゅう", kanji: "来週", romaji: "raishuu", meaningEn: "next week", fromModule: "m34", introducedByLessonId: "ja-m34-neo-2", kind: "vocab", blocked: true, note: "deictic time expression — debuts in m34 L2 (らいしゅう また こよう)", pos: "noun" },
  { id: "higashi", kana: "ひがし", kanji: "東", romaji: "higashi", meaningEn: "east", emoji: "🧭", fromModule: "future", freqRank: 221, kind: "vocab", blocked: true, note: "compass already used for 西; can't distinguish east vs west via emoji", pos: "noun" },
  { id: "kudamono", kana: "くだもの", kanji: "果物", romaji: "kudamono", meaningEn: "fruit", emoji: "🍎", fromModule: "m26", kind: "vocab", note: "apple as fruit cue", pos: "noun" },
  { id: "tanoshii", kana: "たのしい", kanji: "楽しい", romaji: "tanoshii", meaningEn: "enjoyable", emoji: "😄", fromModule: "m18", kind: "vocab", pos: "adjective", conjugation: { class: "i-adj" } },
  { id: "yoko", kana: "よこ", kanji: "横", romaji: "yoko", meaningEn: "beside, side, width", emoji: "↔️", fromModule: "future", freqRank: 222, introducedByLessonId: "ja-m17-8-1", kind: "vocab", note: "horizontal arrow for side/width", pos: "noun" },
  { id: "hashi-bridge", kana: "はし", kanji: "橋", romaji: "hashi", meaningEn: "bridge", emoji: "🌉", fromModule: "future", freqRank: 223, kind: "vocab", pos: "noun" },
  { id: "tsugi", kana: "つぎ", kanji: "次", romaji: "tsugi", meaningEn: "next", fromModule: "future", freqRank: 224, introducedByLessonId: "ja-m13-6-2", kind: "vocab", blocked: true, note: "abstract ordinal/temporal — no concrete referent", pos: "noun" },
  { id: "hoshii", kana: "ほしい", kanji: "欲しい", romaji: "hoshii", meaningEn: "want", emoji: "🤲", fromModule: "m13", kind: "vocab", blocked: true, note: "cupped hands as wanting cue (weak). fromModule re-homed m15 → m13 (2026-07-29, B067/B068): ja-m13-neo-6 introduces it — the legacy tag left it graded-but-never-unlockable. blocked: the ga-hoshii rule card IS the debut (m13 IR note), and the weak 🤲 cannot carry it", pos: "adjective", conjugation: { class: "i-adj" } },
  { id: "utau", kana: "うたう", kanji: "歌う", romaji: "utau", meaningEn: "to sing", emoji: "🎤", fromModule: "m13", kind: "vocab", note: "microphone", pos: "verb", conjugation: { class: "godan" } },
  { id: "tomaru", kana: "とまる", kanji: "止まる", romaji: "tomaru", meaningEn: "to come to a halt", emoji: "🛑", fromModule: "m32", kind: "vocab", pos: "verb", conjugation: { class: "godan", entryId: "tomaru" } },
  { id: "aruku", kana: "あるく", kanji: "歩く", romaji: "aruku", meaningEn: "to walk", emoji: "🚶", fromModule: "m19", blocked: true, kind: "vocab", pos: "verb", conjugation: { class: "godan", entryId: "aruku" }, note: "no picture debut (inv-30 census 2026-08-20): さんぽ/いく's 🚶 owns the glyph (m19/m24 ruling: a debut distractor the picture names equally well)" },
  { id: "ha", kana: "は", kanji: "歯", romaji: "ha", meaningEn: "tooth", emoji: "🦷", fromModule: "future", freqRank: 225, kind: "vocab", pos: "noun" },
  { id: "shinu", kana: "しぬ", kanji: "死ぬ", romaji: "shinu", meaningEn: "to die", emoji: "💀", fromModule: "future", freqRank: 226, kind: "vocab", pos: "verb", conjugation: { class: "godan" } },
  { id: "maitoshi", kana: "まいとし", kanji: "毎年", romaji: "maitoshi", meaningEn: "every year", fromModule: "m11", kind: "vocab", blocked: true, note: "abstract time interval; taught by m11 vocab pack 2026-07-29 (B067)", pos: "noun" },
  { id: "mainen", kana: "まいねん", kanji: "毎年", romaji: "mainen", meaningEn: "every year", fromModule: "future", freqRank: 227, kind: "vocab", blocked: true, note: "abstract time interval", pos: "noun" },
  { id: "mainichi", kana: "まいにち", kanji: "毎日", romaji: "mainichi", meaningEn: "every day", fromModule: "m28", kind: "vocab", blocked: true, note: "abstract time interval", pos: "noun" },
  { id: "maiban", kana: "まいばん", kanji: "毎晩", romaji: "maiban", meaningEn: "every night", emoji: "🌙", fromModule: "future", freqRank: 228, kind: "vocab", note: "moon as night cue (frequency lost — phrase context needed)", pos: "noun" },
  { id: "maigetsu", kana: "まいげつ", kanji: "毎月", romaji: "maigetsu", meaningEn: "every month", fromModule: "future", freqRank: 229, kind: "vocab", blocked: true, note: "abstract recurrence", pos: "noun" },
  { id: "maitsuki", kana: "まいつき", kanji: "毎月", romaji: "maitsuki", meaningEn: "every month", fromModule: "future", freqRank: 230, kind: "vocab", blocked: true, note: "abstract recurrence", pos: "noun" },
  { id: "maiasa", kana: "まいあさ", kanji: "毎朝", romaji: "maiasa", meaningEn: "every morning", emoji: "🌅", fromModule: "future", freqRank: 231, kind: "vocab", note: "sunrise reads as morning", pos: "noun" },
  { id: "maishuu", kana: "まいしゅう", kanji: "毎週", romaji: "maishuu", meaningEn: "every week", fromModule: "future", freqRank: 232, kind: "vocab", blocked: true, note: "abstract recurrence", pos: "noun" },
  { id: "suiyoubi", kana: "すいようび", kanji: "水曜日", romaji: "suiyoubi", meaningEn: "Wednesday", fromModule: "m11", kind: "vocab", blocked: true, note: "day-of-week label; needs text not image; taught by m11 vocab pack 2026-07-29 (B067); was m12", pos: "noun" },
  { id: "kitanai", kana: "きたない", kanji: "汚い", romaji: "kitanai", meaningEn: "dirty", emoji: "🗑️", fromModule: "future", freqRank: 233, kind: "vocab", blocked: true, note: "trash reads as 'garbage' not 'dirty'", pos: "adjective", conjugation: { class: "i-adj" } },
  { id: "oyogu", kana: "およぐ", kanji: "泳ぐ", romaji: "oyogu", meaningEn: "to swim", emoji: "🏊", fromModule: "m14", kind: "vocab", pos: "verb", conjugation: { class: "godan", entryId: "oyogu" } },
  { id: "youfuku", kana: "ようふく", kanji: "洋服", romaji: "youfuku", meaningEn: "western-style clothes", emoji: "👔", fromModule: "future", freqRank: 234, kind: "vocab", note: "necktie/shirt", pos: "noun" },
  { id: "arau", kana: "あらう", kanji: "洗う", romaji: "arau", meaningEn: "to wash", emoji: "🧼", fromModule: "m13", kind: "vocab", blocked: true, note: "taught by m13 vocab pack 2026-07-29 (B067); was m16. blocked: 🧼 belongs to せっけん, taught in the same lesson", pos: "verb", conjugation: { class: "godan", entryId: "arau" } },
  { id: "sentaku", kana: "せんたく", kanji: "洗濯", romaji: "sentaku", meaningEn: "washing", emoji: "🧺", fromModule: "future", freqRank: 235, kind: "vocab", note: "laundry basket", pos: "noun" },
  { id: "kieru", kana: "きえる", kanji: "消える", romaji: "kieru", meaningEn: "to go out, to go off", fromModule: "m33", kind: "vocab", blocked: true, note: "transitivity pair with けす — blocked: 💨 already belongs to はやい/いそぐ/ふく", pos: "verb", conjugation: { class: "ichidan" } },
  { id: "kesu", kana: "けす", kanji: "消す", romaji: "kesu", meaningEn: "to turn off, to switch off", fromModule: "m33", kind: "vocab", blocked: true, note: "transitivity pair with きえる — blocked: 🧽 reads as erasing, not as switching off", pos: "verb", conjugation: { class: "godan", entryId: "kesu" } },
  { id: "suzushii", kana: "すずしい", kanji: "涼しい", romaji: "suzushii", meaningEn: "refreshing", emoji: "🍃", fromModule: "m25", kind: "vocab", note: "leaf in wind — cool/refreshing", pos: "adjective", conjugation: { class: "i-adj" } },
  { id: "watasu", kana: "わたす", kanji: "渡す", romaji: "watasu", meaningEn: "to hand over", emoji: "🤝", fromModule: "future", freqRank: 236, kind: "vocab", note: "handshake/handoff", pos: "verb", conjugation: { class: "godan" } },
  { id: "wataru", kana: "わたる", kanji: "渡る", romaji: "wataru", meaningEn: "to go across", emoji: "🚸", fromModule: "m32", kind: "vocab", note: "pedestrian crossing", pos: "verb", conjugation: { class: "godan", entryId: "wataru" } },
  { id: "nurui", kana: "ぬるい", kanji: "温い", romaji: "nurui", meaningEn: "luke warm", fromModule: "future", freqRank: 237, kind: "vocab", blocked: true, note: "subtle temperature distinction; no referent that reads as 'lukewarm' vs warm/hot", pos: "adjective", conjugation: { class: "i-adj" } },
  { id: "kanji", kana: "かんじ", kanji: "漢字", romaji: "kanji", meaningEn: "Chinese character", emoji: "🈶", fromModule: "m38", introducedByLessonId: "ja-m38-neo-9", kind: "vocab", note: "Japanese ideograph block; re-stamped future → m38 2026-08-25 (m38 landing) — m38-neo-9's own introduces: names it (かんじに なれてきた)", pos: "noun" },
  { id: "kayoubi", kana: "かようび", kanji: "火曜日", romaji: "kayoubi", meaningEn: "Tuesday", fromModule: "m11", kind: "vocab", blocked: true, note: "weekday name — no glyph distinguishes; taught by m11 vocab pack 2026-07-29 (B067); was m12", pos: "noun" },
  { id: "haizara", kana: "はいざら", kanji: "灰皿", romaji: "haizara", meaningEn: "ashtray", emoji: "🚬", fromModule: "future", freqRank: 238, kind: "vocab", note: "cigarette as proxy; closest concrete", pos: "noun" },
  { id: "nakusu", kana: "なくす", kanji: "無くす", romaji: "nakusu", meaningEn: "to lose something", fromModule: "m38", introducedByLessonId: "ja-m38-neo-2", kind: "vocab", blocked: true, note: "abstract action; re-stamped future → m38, re-pointed off the stale ja-m17-8-2 attribution 2026-08-25 (m38 landing): that lesson lives in curriculum/_archive/m17.ts, dead per isDeadAttribution — m38-neo-2's own introduces: names it (かぎを なくしてしまった)", pos: "verb", conjugation: { class: "godan" } },
  { id: "urusai", kana: "うるさい", kanji: "煩い", romaji: "urusai", meaningEn: "noisy, annoying", emoji: "📢", fromModule: "m28", kind: "vocab", note: "loudspeaker = noisy", pos: "adjective", conjugation: { class: "i-adj" } },
  { id: "atsui-hot", kana: "あつい", kanji: "熱い", romaji: "atsui", meaningEn: "hot to the touch", emoji: "🔥", fromModule: "future", freqRank: 239, kind: "vocab", note: "fire — hot", pos: "adjective", conjugation: { class: "i-adj" } },
  { id: "gyuuniku", kana: "ぎゅうにく", kanji: "牛肉", romaji: "gyuuniku", meaningEn: "beef", emoji: "🐄", fromModule: "future", freqRank: 240, kind: "vocab", note: "cow as beef cue (🥩 taken for generic meat)", pos: "noun" },
  { id: "mono", kana: "もの", kanji: "物", romaji: "mono", meaningEn: "thing", fromModule: "m24", introducedByLessonId: "ja-m24-2-1", kind: "vocab", blocked: true, note: "abstract noun — per rubric", pos: "noun" },
  { id: "semai", kana: "せまい", kanji: "狭い", romaji: "semai", meaningEn: "narrow", emoji: "↔️", fromModule: "m27", kind: "vocab", blocked: true, note: "no clean narrow glyph; left-right arrow reads as wide", pos: "adjective", conjugation: { class: "i-adj", entryId: "semai" } },
  { id: "genkan", kana: "げんかん", kanji: "玄関", romaji: "genkan", meaningEn: "entry hall", fromModule: "future", freqRank: 241, kind: "vocab", note: "door as entry proxy", pos: "noun" },
  { id: "amai", kana: "あまい", kanji: "甘い", romaji: "amai", meaningEn: "sweet", emoji: "🍬", fromModule: "future", freqRank: 242, kind: "vocab", note: "candy as sweet proxy", pos: "adjective", conjugation: { class: "i-adj" } },
  { id: "umareru", kana: "うまれる", kanji: "生まれる", romaji: "umareru", meaningEn: "to be born", emoji: "👶", fromModule: "future", freqRank: 243, kind: "vocab", pos: "verb", conjugation: { class: "ichidan" } },
  { id: "seito", kana: "せいと", kanji: "生徒", romaji: "seito", meaningEn: "pupil", emoji: "🎒", fromModule: "m28", kind: "vocab", note: "backpack as pupil cue", pos: "noun" },
  { id: "otoko", kana: "おとこ", kanji: "男", romaji: "otoko", meaningEn: "man", emoji: "👨", fromModule: "future", freqRank: 244, kind: "vocab", pos: "noun" },
  { id: "otokonoko", kana: "おとこのこ", kanji: "男の子", romaji: "otokonoko", meaningEn: "boy", emoji: "👦", fromModule: "future", freqRank: 245, kind: "vocab", pos: "noun" },
  { id: "machi", kana: "まち", kanji: "町", romaji: "machi", meaningEn: "town, city", emoji: "🏘️", fromModule: "future", freqRank: 246, kind: "vocab", pos: "noun" },
  { id: "ryuugakusei", kana: "りゅうがくせい", kanji: "留学生", romaji: "ryuugakusei", meaningEn: "overseas student", emoji: "🎓", fromModule: "future", freqRank: 247, introducedByLessonId: "ja-m25-5-2", kind: "vocab", note: "graduation cap", pos: "noun" },
  { id: "bangou", kana: "ばんごう", kanji: "番号", romaji: "bangou", meaningEn: "number", emoji: "🔢", fromModule: "future", freqRank: 248, kind: "vocab", pos: "noun" },
  { id: "tsukareru", kana: "つかれる", kanji: "疲れる", romaji: "tsukareru", meaningEn: "to get tired", emoji: "😩", fromModule: "m32", kind: "vocab", note: "weary face", pos: "verb", conjugation: { class: "ichidan" } },
  { id: "byouki", kana: "びょうき", kanji: "病気", romaji: "byouki", meaningEn: "illness", emoji: "🤒", fromModule: "m22", kind: "vocab", note: "face with thermometer", pos: "noun" },
  { id: "itai", kana: "いたい", kanji: "痛い", romaji: "itai", meaningEn: "painful", emoji: "🤕", fromModule: "m22", kind: "vocab", pos: "adjective", conjugation: { class: "i-adj" } },
  { id: "noboru", kana: "のぼる", kanji: "登る", romaji: "noboru", meaningEn: "to climb", emoji: "🧗", fromModule: "future", freqRank: 249, kind: "vocab", note: "person climbing", pos: "verb", conjugation: { class: "godan" } },
  { id: "shiro", kana: "しろ", kanji: "白", romaji: "shiro", meaningEn: "white", emoji: "⚪", fromModule: "future", freqRank: 250, kind: "vocab", pos: "noun" },
  { id: "shiroi", kana: "しろい", kanji: "白い", romaji: "shiroi", meaningEn: "white", emoji: "⬜", fromModule: "future", freqRank: 251, kind: "vocab", note: "white square", pos: "adjective", conjugation: { class: "i-adj" } },
  { id: "minasan", kana: "みなさん", kanji: "皆さん", romaji: "minasan", meaningEn: "everyone", emoji: "👥", fromModule: "future", freqRank: 252, introducedByLessonId: "ja-m19-4-2", kind: "vocab", note: "synonym of みんな", pos: "pronoun" },
  { id: "me", kana: "め", kanji: "目", romaji: "me", meaningEn: "eye", emoji: "👁️", fromModule: "m16", kind: "vocab", blocked: true, note: "was m20 (stale old-course tag). First exercised by ja-m16-neo-11's けいたいは めに わるい (vocab pack 6, 2026-07-30) — re-homed so the drift table and the D2/unlock gates agree; m22 gives it the full body-lesson debut and its IR declares め imageable:false (👁️ belongs to みる), so blocked matches", pos: "noun" },
  { id: "tsuku", kana: "つく", kanji: "着く", romaji: "tsuku", meaningEn: "to arrive at", emoji: "🛬", fromModule: "m23", kind: "vocab", note: "landing plane as arrival cue", pos: "verb", conjugation: { class: "godan" } },
  { id: "kiru", kana: "きる", kanji: "着る", romaji: "kiru", meaningEn: "to put on from the shoulders down", emoji: "👕", fromModule: "future", freqRank: 253, kind: "vocab", note: "shirt as put-on cue", pos: "verb", conjugation: { class: "ichidan", entryId: "kiru-wear" } },
  { id: "shiru", kana: "しる", kanji: "知る", romaji: "shiru", meaningEn: "to know", emoji: "💡", fromModule: "m10", kind: "vocab", blocked: true, note: "lightbulb used elsewhere; cognition too abstract", pos: "verb", conjugation: { class: "godan", entryId: "shiru" } },
  { id: "mijikai", kana: "みじかい", kanji: "短い", romaji: "mijikai", meaningEn: "short", emoji: "📏", fromModule: "m27", blocked: true, kind: "vocab", note: "ruler for length adjectives; no picture debut (inv-30 census 2026-08-20): ながい's 📏 (mutual) owns the glyph (m19/m24 ruling: a debut distractor the picture names equally well)", pos: "adjective", conjugation: { class: "i-adj", entryId: "mijikai" } },
  { id: "satou", kana: "さとう", kanji: "砂糖", romaji: "satou", meaningEn: "sugar", emoji: "🍬", fromModule: "future", freqRank: 254, kind: "vocab", note: "candy as sugar proxy", pos: "noun" },
  { id: "migaku", kana: "みがく", kanji: "磨く", romaji: "migaku", meaningEn: "to brush teeth, to polish", emoji: "🪥", fromModule: "m13", kind: "vocab", note: "toothbrush; taught by m13 vocab pack 2026-07-29 (B067); was m20. m13 spends the polish sense (くるま/とけい) — 歯 arrives with pack 6 (m16)", pos: "verb", conjugation: { class: "godan", entryId: "migaku" } },
  { id: "watakushi", kana: "わたくし", kanji: "私", romaji: "watakushi", meaningEn: "(humble) I, myself", fromModule: "future", freqRank: 255, introducedByLessonId: "ja-m19-3-2", kind: "vocab", blocked: true, note: "pronoun — rubric blocks pronouns", pos: "pronoun" },
  { id: "aki", kana: "あき", kanji: "秋", romaji: "aki", meaningEn: "autumn", emoji: "🍂", fromModule: "m25", kind: "vocab", pos: "noun" },
  { id: "tatsu", kana: "たつ", kanji: "立つ", romaji: "tatsu", meaningEn: "to stand", emoji: "🧍", fromModule: "m8", introducedByLessonId: "ja-m8-neo-2", kind: "vocab", pos: "verb", conjugation: { class: "godan" } },
  { id: "kotaeru", kana: "こたえる", kanji: "答える", romaji: "kotaeru", meaningEn: "to answer", emoji: "🙋", fromModule: "m30", kind: "vocab", blocked: true, note: "raising hand", pos: "verb", conjugation: { class: "ichidan" } },
  { id: "hako", kana: "はこ", kanji: "箱", romaji: "hako", meaningEn: "box", emoji: "📦", fromModule: "future", freqRank: 256, kind: "vocab", pos: "noun" },
  { id: "koucha", kana: "こうちゃ", kanji: "紅茶", romaji: "koucha", meaningEn: "black tea", emoji: "🫖", fromModule: "future", freqRank: 257, kind: "vocab", note: "teacup; pair with phrase", pos: "noun" },
  { id: "kami", kana: "かみ", kanji: "紙", romaji: "kami", meaningEn: "paper", emoji: "📄", fromModule: "m27", kind: "vocab", pos: "noun" },
  { id: "hosoi", kana: "ほそい", kanji: "細い", romaji: "hosoi", meaningEn: "thin", fromModule: "future", freqRank: 258, kind: "vocab", blocked: true, note: "abstract adjective; no clean Noto referent", pos: "adjective", conjugation: { class: "i-adj" } },
  { id: "owaru", kana: "おわる", kanji: "終る", romaji: "owaru", meaningEn: "to finish", emoji: "🏁", fromModule: "m32", kind: "vocab", note: "checkered flag as finish cue", pos: "verb", conjugation: { class: "godan" } },
  { id: "kekkon", kana: "けっこん", kanji: "結婚", romaji: "kekkon", meaningEn: "marriage", emoji: "💍", fromModule: "m34", introducedByLessonId: "ja-m34-neo-7", kind: "vocab", blocked: true, note: "ring — blocked: m34's IR marks this atom imageable:false (its intended debut art is 💒, VENDOR emoji_u1f492.svg — not yet in src/pub/noto-emoji/svg); 💍 stays as the row's legacy flashcard art, but no word_image_mcq debut is generated for it", pos: "noun" },
  { id: "kekkou", kana: "けっこう", kanji: "結構", romaji: "kekkou", meaningEn: "splendid, enough", fromModule: "m10", introducedByLessonId: "ja-m21-6-2", kind: "vocab", blocked: true, note: "polysemous abstract adjective/adverb", pos: "adjective", conjugation: { class: "na-adj" } },
  { id: "e", kana: "え", kanji: "絵", romaji: "e", meaningEn: "picture", emoji: "🖼️", fromModule: "m24", kind: "vocab", note: "framed picture", pos: "noun" },
  { id: "midori", kana: "みどり", kanji: "緑", romaji: "midori", meaningEn: "green", emoji: "🟢", fromModule: "future", freqRank: 259, kind: "vocab", pos: "noun" },
  { id: "shimeru-tie", kana: "しめる", kanji: "締める", romaji: "shimeru", meaningEn: "to tie", emoji: "🎀", fromModule: "future", freqRank: 260, kind: "vocab", note: "ribbon", pos: "verb", conjugation: { class: "ichidan" } },
  { id: "renshuusuru", kana: "れんしゅうする", kanji: "練習", romaji: "renshuusuru", meaningEn: "to practice", emoji: "📓", fromModule: "m34", kind: "vocab", note: "notebook as practice proxy", pos: "verb", conjugation: { class: "irregular" } },
  { id: "oku", kana: "おく", kanji: "置く", romaji: "oku", meaningEn: "to put", emoji: "📥", fromModule: "m30", kind: "vocab", blocked: true, note: "inbox tray — place/put", pos: "verb", conjugation: { class: "godan" } },
  { id: "narau", kana: "ならう", kanji: "習う", romaji: "narau", meaningEn: "to learn", emoji: "🎓", fromModule: "m30", kind: "vocab", blocked: true, pos: "verb", conjugation: { class: "godan" } },
  { id: "mimi", kana: "みみ", kanji: "耳", romaji: "mimi", meaningEn: "ear", emoji: "👂", fromModule: "m22", blocked: true, kind: "vocab", pos: "noun", note: "no picture debut (inv-30 census 2026-08-20): きく's 👂 owns the glyph (m19/m24 ruling: a debut distractor the picture names equally well)" },
  { id: "kiku", kana: "きく", kanji: "聞く", romaji: "kiku", meaningEn: "to hear, to listen to, to ask", emoji: "👂", fromModule: "m5", kind: "vocab", note: "ear", pos: "verb", conjugation: { class: "godan" } },
  { id: "niku", kana: "にく", kanji: "肉", romaji: "niku", meaningEn: "meat", emoji: "🥩", fromModule: "m26", kind: "vocab", pos: "noun" },
  { id: "se", kana: "せ", kanji: "背", romaji: "se", meaningEn: "height, stature", emoji: "📏", fromModule: "future", freqRank: 262, kind: "vocab", note: "ruler for stature", pos: "noun" },
  { id: "sebiro", kana: "せびろ", kanji: "背広", romaji: "sebiro", meaningEn: "business suit", emoji: "🤵", fromModule: "future", freqRank: 263, kind: "vocab", note: "person in suit", pos: "noun" },
  { id: "nugu", kana: "ぬぐ", kanji: "脱ぐ", romaji: "nugu", meaningEn: "to take off clothes", emoji: "👔", fromModule: "future", freqRank: 264, kind: "vocab", blocked: true, note: "necktie reads as clothing not removing; verb action not visualizable", pos: "verb", conjugation: { class: "godan" } },
  { id: "jibun", kana: "じぶん", kanji: "自分", romaji: "jibun", meaningEn: "oneself", fromModule: "future", freqRank: 265, introducedByLessonId: "ja-m16-6-1", kind: "vocab", blocked: true, note: "reflexive pronoun", pos: "pronoun" },
  { id: "jidousha", kana: "じどうしゃ", kanji: "自動車", romaji: "jidousha", meaningEn: "automobile", emoji: "🚙", fromModule: "future", freqRank: 266, kind: "vocab", pos: "noun" },
  { id: "kabin", kana: "かびん", kanji: "花瓶", romaji: "kabin", meaningEn: "a vase", emoji: "🏺", fromModule: "future", freqRank: 267, kind: "vocab", note: "amphora — closest Noto vase", pos: "noun" },
  { id: "wakai", kana: "わかい", kanji: "若い", romaji: "wakai", meaningEn: "young", emoji: "👶", fromModule: "future", freqRank: 268, kind: "vocab", note: "baby connotes young", pos: "adjective", conjugation: { class: "i-adj" } },
  { id: "eigo", kana: "えいご", kanji: "英語", romaji: "eigo", meaningEn: "English language", emoji: "🇺🇸", fromModule: "m26", blocked: true, kind: "vocab", note: "US flag — wired via separate flag dir; no picture debut (inv-30 census 2026-08-20): アメリカ's 🇺🇸 owns the glyph (m19/m24 ruling: a debut distractor the picture names equally well)", pos: "noun" },
  { id: "chairo", kana: "ちゃいろ", kanji: "茶色", romaji: "chairo", meaningEn: "brown", emoji: "🟫", fromModule: "future", freqRank: 269, kind: "vocab", note: "brown square", pos: "noun" },
  { id: "nimotsu", kana: "にもつ", kanji: "荷物", romaji: "nimotsu", meaningEn: "luggage", emoji: "🧳", fromModule: "future", freqRank: 270, kind: "vocab", pos: "noun" },
  { id: "hagaki", kana: "はがき", kanji: "葉書", romaji: "hagaki", meaningEn: "postcard", emoji: "📮", fromModule: "future", freqRank: 271, kind: "vocab", note: "postbox as proxy for postcard", pos: "noun" },
  { id: "usui", kana: "うすい", kanji: "薄い", romaji: "usui", meaningEn: "thin, weak", fromModule: "future", freqRank: 272, kind: "vocab", blocked: true, note: "polysemy: thin (paper) vs weak (tea/color); no single concrete referent", pos: "adjective", conjugation: { class: "i-adj" } },
  { id: "kusuri", kana: "くすり", kanji: "薬", romaji: "kusuri", meaningEn: "medicine", emoji: "💊", fromModule: "m22", kind: "vocab", pos: "noun" },
  { id: "nishi", kana: "にし", kanji: "西", romaji: "nishi", meaningEn: "west", emoji: "🧭", fromModule: "future", freqRank: 273, kind: "vocab", note: "compass — west direction", pos: "noun" },
  { id: "iru", kana: "いる", kanji: "要る", romaji: "iru", meaningEn: "to need", emoji: "❗", fromModule: "future", freqRank: 274, kind: "vocab", blocked: true, note: "exclamation reads as 'attention' not 'need'", pos: "verb", conjugation: { class: "godan" } },
  { id: "miseru", kana: "みせる", kanji: "見せる", romaji: "miseru", meaningEn: "to show", emoji: "👀", fromModule: "m14", kind: "vocab", note: "eyes — showing/look at this", pos: "verb", conjugation: { class: "ichidan", entryId: "miseru" } },
  { id: "oboeru", kana: "おぼえる", kanji: "覚える", romaji: "oboeru", meaningEn: "to memorise, to learn", emoji: "🧠", fromModule: "m11", kind: "vocab", note: "brain; taught by m11 vocab pack 2026-07-29 (B067); was m29 with dangling ja-m29-2-1 attribution — left unset so the lessonAtomIndex fallback attributes it", pos: "verb", conjugation: { class: "ichidan" } },
  { id: "kado", kana: "かど", kanji: "角", romaji: "kado", meaningEn: "a corner", emoji: "📐", fromModule: "m32", kind: "vocab", note: "triangle ruler — corner/angle", pos: "noun" },
  { id: "iu", kana: "いう", kanji: "言う", romaji: "iu", meaningEn: "to say", emoji: "💬", fromModule: "m5", kind: "vocab", note: "speech bubble", pos: "verb", conjugation: { class: "godan" } },
  { id: "omou", kana: "おもう", kanji: "思う", romaji: "omou", meaningEn: "to think", emoji: "💭", fromModule: "m5", introducedByLessonId: "ja-m5-neo-8", kind: "vocab", note: "thought balloon; m5-neo L8 teaches it recognition-first via the そう おもう chunk (dict-form-first rewrite) — no analyzed と quotation until later", pos: "verb", conjugation: { class: "godan" } },
  { id: "kotoba", kana: "ことば", kanji: "言葉", romaji: "kotoba", meaningEn: "word, language", emoji: "🔤", fromModule: "m26", kind: "vocab", note: "ABC input symbol as language proxy", pos: "noun" },
  { id: "hanashi", kana: "はなし", kanji: "話", romaji: "hanashi", meaningEn: "talk, story", emoji: "💬", fromModule: "future", freqRank: 275, kind: "vocab", pos: "noun" },
  { id: "hanasu", kana: "はなす", kanji: "話す", romaji: "hanasu", meaningEn: "to speak", emoji: "🗣️", fromModule: "m18", kind: "vocab", pos: "verb", conjugation: { class: "godan" } },
  { id: "tanjoubi", kana: "たんじょうび", kanji: "誕生日", romaji: "tanjoubi", meaningEn: "birthday", emoji: "🎂", fromModule: "m31", kind: "vocab", pos: "noun" },
  { id: "keikan", kana: "けいかん", kanji: "警官", romaji: "keikan", meaningEn: "policeman", emoji: "👮", fromModule: "future", freqRank: 276, introducedByLessonId: "ja-m17-8-2", kind: "vocab", pos: "noun" },
  { id: "butaniku", kana: "ぶたにく", kanji: "豚肉", romaji: "butaniku", meaningEn: "pork", emoji: "🥓", fromModule: "future", freqRank: 277, kind: "vocab", note: "bacon as pork cue", pos: "noun" },
  { id: "saifu", kana: "さいふ", kanji: "財布", romaji: "saifu", meaningEn: "wallet", emoji: "👛", fromModule: "m28", kind: "vocab", note: "purse — closest wallet glyph", pos: "noun" },
  { id: "kaimono", kana: "かいもの", kanji: "買い物", romaji: "kaimono", meaningEn: "shopping", emoji: "🛍️", fromModule: "m5", kind: "vocab", pos: "noun" },
  { id: "kau", kana: "かう", kanji: "買う", romaji: "kau", meaningEn: "to buy", emoji: "🛒", fromModule: "m5", kind: "vocab", pos: "verb", conjugation: { class: "godan", entryId: "kau" } },
  { id: "kasu", kana: "かす", kanji: "貸す", romaji: "kasu", meaningEn: "to lend", emoji: "🤝", fromModule: "m8", introducedByLessonId: "ja-m8-neo-11", kind: "vocab", note: "handshake reads as exchange/lend", pos: "verb", conjugation: { class: "godan", entryId: "kasu" } },
  { id: "haru-stick", kana: "はる", kanji: "貼る", romaji: "haru", meaningEn: "to stick", fromModule: "future", freqRank: 278, introducedByLessonId: "ja-m14-6-2", kind: "vocab", blocked: true, note: "no concrete Noto referent; pair with phrase", pos: "verb", conjugation: { class: "godan" } },
  { id: "nigiyaka", kana: "にぎやか", kanji: "賑やか", romaji: "nigiyaka", meaningEn: "bustling, busy", emoji: "🎉", fromModule: "m12", kind: "vocab", note: "party popper as lively proxy", pos: "adjective", conjugation: { class: "na-adj", entryId: "nigiyaka" } },
  { id: "shitsumon", kana: "しつもん", kanji: "質問", romaji: "shitsumon", meaningEn: "question", emoji: "❓", fromModule: "m30", kind: "vocab", blocked: true, note: "question mark", pos: "noun" },
  { id: "aka", kana: "あか", kanji: "赤", romaji: "aka", meaningEn: "red", emoji: "🟥", fromModule: "future", freqRank: 279, kind: "vocab", note: "red square — shares with 赤い", pos: "noun" },
  { id: "akai", kana: "あかい", kanji: "赤い", romaji: "akai", meaningEn: "red", emoji: "🟥", fromModule: "m13", kind: "vocab", note: "red square", pos: "adjective", conjugation: { class: "i-adj" } },
  { id: "hashiru", kana: "はしる", kanji: "走る", romaji: "hashiru", meaningEn: "to run", emoji: "🏃", fromModule: "m16", kind: "vocab", note: "taught by m16 vocab pack 6 2026-07-30 (B067); trainer entry un-parked 30 → 16", pos: "verb", conjugation: { class: "godan", entryId: "hashiru" } },
  { id: "okiru", kana: "おきる", kanji: "起きる", romaji: "okiru", meaningEn: "to get up", emoji: "⏰", fromModule: "m13", kind: "vocab", blocked: true, note: "taught by m13 vocab pack 2026-07-29 (B067); was m16. blocked: ⏰ belongs to じかん", pos: "verb", conjugation: { class: "ichidan", entryId: "okiru" } },
  { id: "ashi", kana: "あし", kanji: "足", romaji: "ashi", meaningEn: "foot, leg", emoji: "🦶", fromModule: "m22", kind: "vocab", pos: "noun" },
  { id: "karui", kana: "かるい", kanji: "軽い", romaji: "karui", meaningEn: "light", emoji: "🪶", fromModule: "m36", introducedByLessonId: "ja-m36-neo-9", kind: "vocab", blocked: true, note: "feather = light weight; blocked — IR marks m36 imageable:false, no image debut generated; 🪶 stays as legacy flashcard art", pos: "adjective", conjugation: { class: "i-adj" } },
  { id: "karai", kana: "からい", kanji: "辛い", romaji: "karai", meaningEn: "spicy", emoji: "🌶️", fromModule: "m28", kind: "vocab", pos: "adjective", conjugation: { class: "i-adj" } },
  { id: "hen", kana: "へん", kanji: "辺", romaji: "hen", meaningEn: "area", emoji: "🗺️", fromModule: "future", freqRank: 281, introducedByLessonId: "ja-m16-5-2", kind: "vocab", note: "map as area proxy", pos: "noun" },
  { id: "chikaku", kana: "ちかく", kanji: "近く", romaji: "chikaku", meaningEn: "near", emoji: "📍", fromModule: "future", freqRank: 282, kind: "vocab", note: "pin as near-here proxy", pos: "adverb" },
  { id: "kaesu", kana: "かえす", kanji: "返す", romaji: "kaesu", meaningEn: "to return something", emoji: "↩️", fromModule: "future", freqRank: 283, kind: "vocab", note: "return arrow", pos: "verb", conjugation: { class: "godan" } },
  { id: "hayai", kana: "はやい", kanji: "速い", romaji: "hayai", meaningEn: "quick", emoji: "💨", fromModule: "future", freqRank: 284, kind: "vocab", note: "dashing-away motion lines", pos: "adjective", conjugation: { class: "i-adj", entryId: "hayai" } },
  { id: "osoi", kana: "おそい", kanji: "遅い", romaji: "osoi", meaningEn: "late, slow", emoji: "🐌", fromModule: "m27", kind: "vocab", note: "turtle = slow", pos: "adjective", conjugation: { class: "i-adj", entryId: "osoi" } },
  { id: "michi", kana: "みち", kanji: "道", romaji: "michi", meaningEn: "street", emoji: "🛣️", fromModule: "m32", kind: "vocab", note: "motorway as street proxy", pos: "noun" },
  { id: "chigau", kana: "ちがう", kanji: "違う", romaji: "chigau", meaningEn: "to differ", emoji: "❌", fromModule: "m10", kind: "vocab", note: "X as 'wrong/different' proxy", pos: "verb", conjugation: { class: "godan" } },
  { id: "omoi", kana: "おもい", kanji: "重い", romaji: "omoi", meaningEn: "heavy", emoji: "🏋️", fromModule: "m26", kind: "vocab", note: "weightlifter = heavy", pos: "adjective", conjugation: { class: "i-adj" } },
  { id: "yasai", kana: "やさい", kanji: "野菜", romaji: "yasai", meaningEn: "vegetable", emoji: "🥕", fromModule: "m26", kind: "vocab", pos: "noun" },
  { id: "kinyoubi", kana: "きんようび", kanji: "金曜日", romaji: "kinyoubi", meaningEn: "Friday", fromModule: "m11", kind: "vocab", blocked: true, note: "day-of-week label; needs text; taught by m11 vocab pack 2026-07-29 (B067); was m12", pos: "noun" },
  { id: "nagai", kana: "ながい", kanji: "長い", romaji: "nagai", meaningEn: "long", emoji: "📏", fromModule: "m27", blocked: true, kind: "vocab", note: "ruler as length cue; no picture debut (inv-30 census 2026-08-20): みじかい's 📏 (mutual) owns the glyph (m19/m24 ruling: a debut distractor the picture names equally well)", pos: "adjective", conjugation: { class: "i-adj", entryId: "nagai" } },
  { id: "mon", kana: "もん", kanji: "門", romaji: "mon", meaningEn: "gate", emoji: "⛩️", fromModule: "future", freqRank: 285, kind: "vocab", note: "torii reads as Japanese gate", pos: "noun" },
  { id: "shimaru", kana: "しまる", kanji: "閉まる", romaji: "shimaru", meaningEn: "to close (of itself), to shut", fromModule: "m33", kind: "vocab", blocked: true, note: "transitivity pair with しめる (m14) — blocked: a shut door is the same picture whoever shut it", pos: "verb", conjugation: { class: "godan" } },
  { id: "shimeru", kana: "しめる", kanji: "閉める", romaji: "shimeru", meaningEn: "to close something", emoji: "🚪", fromModule: "m14", kind: "vocab", blocked: true, note: "door already used for 玄関; verb action not visualizable. Taught by m14 vocab pack 2026-07-29 (B067); fromModule was already m14", pos: "verb", conjugation: { class: "ichidan", entryId: "shimeru" } },
  { id: "aku", kana: "あく", kanji: "開く", romaji: "aku", meaningEn: "to open (of itself), to come open", fromModule: "m33", kind: "vocab", blocked: true, note: "transitivity pair with あける (m14) — blocked: 🔓 is already あける's and an open lock is the same picture whoever opened it", pos: "verb", conjugation: { class: "godan" } },
  { id: "akeru", kana: "あける", kanji: "開ける", romaji: "akeru", meaningEn: "to open", emoji: "🔓", fromModule: "m14", kind: "vocab", blocked: true, note: "taught by m14 vocab pack 2026-07-29 (B067); fromModule was already m14. blocked: an open padlock cannot cue 'open the door' honestly, and the pair debuts on the rule card with しめる", pos: "verb", conjugation: { class: "ichidan", entryId: "akeru" } },
  { id: "oriru", kana: "おりる", kanji: "降りる", romaji: "oriru", meaningEn: "to get off, to descend", emoji: "⬇️", fromModule: "future", freqRank: 286, kind: "vocab", note: "down-arrow = descend", pos: "verb", conjugation: { class: "ichidan", entryId: "oriru" } },
  { id: "furu", kana: "ふる", kanji: "降る", romaji: "furu", meaningEn: "to fall, e.g. rain or snow", emoji: "🌧️", fromModule: "m25", kind: "vocab", blocked: true, note: "rain cloud as falling-rain cue — blocked because 🌧️ is あめ's picture and あめ is taught in the same module", pos: "verb", conjugation: { class: "godan" } },
  { id: "kaidan", kana: "かいだん", kanji: "階段", romaji: "kaidan", meaningEn: "stairs", emoji: "🪜", fromModule: "future", freqRank: 287, kind: "vocab", note: "ladder; closest Noto for stairs", pos: "noun" },
  { id: "tonari", kana: "となり", kanji: "隣", romaji: "tonari", meaningEn: "next door to", fromModule: "future", freqRank: 288, kind: "vocab", blocked: true, note: "spatial relation; no visual referent", pos: "noun" },
  { id: "muzukashii", kana: "むずかしい", kanji: "難しい", romaji: "muzukashii", meaningEn: "difficult", emoji: "😖", fromModule: "m18", kind: "vocab", note: "confounded face as difficulty cue", pos: "adjective", conjugation: { class: "i-adj", entryId: "muzukashii" } },
  { id: "ame", kana: "あめ", kanji: "雨", romaji: "ame", meaningEn: "rain", emoji: "🌧️", fromModule: "m25", kind: "vocab", pos: "noun" },
  { id: "rei", kana: "れい", kanji: "零", romaji: "rei", meaningEn: "zero", emoji: "0️⃣", fromModule: "future", freqRank: 289, kind: "vocab", pos: "number" },
  { id: "denki", kana: "でんき", kanji: "電気", romaji: "denki", meaningEn: "electricity, electric light", emoji: "💡", fromModule: "m14", kind: "vocab", blocked: true, note: "taught by m14 vocab pack 2026-07-29 (B067); was m13. blocked: 💡 belongs to わかる/しる", pos: "noun" },
  { id: "ao", kana: "あお", kanji: "青", romaji: "ao", meaningEn: "blue", emoji: "🔵", fromModule: "future", freqRank: 290, kind: "vocab", pos: "noun" },
  { id: "shizuka", kana: "しずか", kanji: "静か", romaji: "shizuka", meaningEn: "quiet", emoji: "🤫", fromModule: "m12", kind: "vocab", note: "shushing face", pos: "adjective", conjugation: { class: "na-adj", entryId: "shizuka" } },
  { id: "kutsu", kana: "くつ", kanji: "靴", romaji: "kutsu", meaningEn: "shoes", emoji: "👞", fromModule: "m15", kind: "vocab", pos: "noun" },
  { id: "kutsushita", kana: "くつした", kanji: "靴下", romaji: "kutsushita", meaningEn: "socks", emoji: "🧦", fromModule: "future", freqRank: 291, kind: "vocab", pos: "noun" },
  { id: "ongaku", kana: "おんがく", kanji: "音楽", romaji: "ongaku", meaningEn: "music", emoji: "🎵", fromModule: "m15", kind: "vocab", pos: "noun" },
  { id: "atama", kana: "あたま", kanji: "頭", romaji: "atama", meaningEn: "head", emoji: "🧠", fromModule: "m22", kind: "vocab", blocked: true, note: "brain reads as 'remember' (used for 覚える); no clean head-anatomy glyph", pos: "noun" },
  { id: "tanomu", kana: "たのむ", kanji: "頼む", romaji: "tanomu", meaningEn: "to ask", emoji: "🙏", fromModule: "future", freqRank: 292, kind: "vocab", note: "request gesture", pos: "verb", conjugation: { class: "godan" } },
  { id: "tobu", kana: "とぶ", kanji: "飛ぶ", romaji: "tobu", meaningEn: "to fly, to hop", emoji: "🕊️", fromModule: "future", freqRank: 293, kind: "vocab", note: "dove as flying proxy", pos: "verb", conjugation: { class: "godan" } },
  { id: "hikouki", kana: "ひこうき", kanji: "飛行機", romaji: "hikouki", meaningEn: "aeroplane", emoji: "✈️", fromModule: "m23", kind: "vocab", blocked: true, note: "blocked because ✈️ is already りょこう's emoji and りょこう is a met word — m23's ruling", pos: "noun" },
  { id: "tabemono", kana: "たべもの", kanji: "食べ物", romaji: "tabemono", meaningEn: "food", emoji: "🍱", fromModule: "m5", kind: "vocab", note: "bento as food cue", pos: "noun" },
  { id: "shokudou", kana: "しょくどう", kanji: "食堂", romaji: "shokudou", meaningEn: "dining hall", emoji: "🍽️", fromModule: "future", freqRank: 294, kind: "vocab", note: "plate with utensils", pos: "noun" },
  { id: "nomimono", kana: "のみもの", kanji: "飲み物", romaji: "nomimono", meaningEn: "a drink", emoji: "🥤", fromModule: "m5", kind: "vocab", pos: "noun" },
  { id: "ame-candy", kana: "あめ", kanji: "飴", romaji: "ame", meaningEn: "candy", emoji: "🍬", fromModule: "future", freqRank: 295, kind: "vocab", pos: "noun" },
  { id: "takai", kana: "たかい", kanji: "高い", romaji: "takai", meaningEn: "tall, expensive", fromModule: "m9", kind: "vocab", blocked: true, note: "polysemy flagged in rubric — tall vs expensive needs separate cards", pos: "adjective", conjugation: { class: "i-adj", entryId: "takai" } },
  { id: "sakana", kana: "さかな", kanji: "魚", romaji: "sakana", meaningEn: "fish", emoji: "🐟", fromModule: "m26", kind: "vocab", pos: "noun" },
  { id: "tori", kana: "とり", kanji: "鳥", romaji: "tori", meaningEn: "bird", emoji: "🐦", fromModule: "future", freqRank: 296, kind: "vocab", pos: "noun" },
  { id: "naku", kana: "なく", kanji: "鳴く", romaji: "naku", meaningEn: "animal noise. to chirp, roar or croak etc.", emoji: "🐦", fromModule: "future", freqRank: 297, kind: "vocab", note: "bird as canonical chirper", pos: "noun" },
  { id: "kiiro", kana: "きいろ", kanji: "黄色", romaji: "kiiro", meaningEn: "yellow", emoji: "🟡", fromModule: "future", freqRank: 298, kind: "vocab", pos: "noun" },
  { id: "kiiroi", kana: "きいろい", kanji: "黄色い", romaji: "kiiroi", meaningEn: "yellow", emoji: "🟨", fromModule: "future", freqRank: 299, kind: "vocab", note: "yellow square", pos: "adjective", conjugation: { class: "i-adj" } },
  { id: "kuro", kana: "くろ", kanji: "黒", romaji: "kuro", meaningEn: "black", emoji: "⬛", fromModule: "future", freqRank: 300, kind: "vocab", note: "black square", pos: "noun" },
  { id: "kuroi", kana: "くろい", kanji: "黒い", romaji: "kuroi", meaningEn: "black", emoji: "⬛", fromModule: "future", freqRank: 301, kind: "vocab", note: "adjective form of 黒 — shares glyph", pos: "adjective", conjugation: { class: "i-adj" } },
  // ── M29 — Plain form (N4 pilot, 2026-07-16). Verb-heavy by design: plain
  //    form is a verb-conjugation module, so new atoms are transformable
  //    verbs. Most of the spine's original 21-atom list turned out to
  //    already be claimed by earlier modules (あそぶ m2, ともだち m3, まつ/
  //    はなす/および/しめる/あける m14, はしる/じぶん m16, うたう m23,
  //    わすれる m26) — those are reused here as REVIEW content, not
  //    re-taught (see m29.ts file header for the full reconciliation note).
  //    Genuinely new atoms below; つかう/おぼえる/ぜんぶ upgraded from
  //    "future" above rather than duplicated here.
  { id: "tetsudau", kana: "てつだう", kanji: "手伝う", romaji: "tetsudau", meaningEn: "to help, to lend a hand", shortGloss: "help", emoji: "🤝", fromModule: "m35", introducedByLessonId: "ja-m35-neo-1", kind: "vocab", blocked: true, note: "blocked: 🤝 already belongs to あう, かす and かりる — no honest un-colliding vendored emoji found at m35 wiring; IR marks this atom imageable:false. 🤝 stays as the row's legacy flashcard art, but no word_image_mcq debut is generated for it (the けっこん precedent)", pos: "verb", conjugation: { class: "godan", entryId: "tetsudau" } },
  { id: "isogu", kana: "いそぐ", kanji: "急ぐ", romaji: "isogu", meaningEn: "to hurry", emoji: "💨", fromModule: "m8", introducedByLessonId: "ja-m8-neo-11", kind: "vocab", pos: "verb", conjugation: { class: "godan" } },
  { id: "sagasu", kana: "さがす", kanji: "探す", romaji: "sagasu", meaningEn: "to look for", emoji: "🔍", fromModule: "m34", introducedByLessonId: "ja-m34-neo-5", kind: "vocab", pos: "verb", conjugation: { class: "godan" } },
  { id: "naosu", kana: "なおす", kanji: "直す", romaji: "naosu", meaningEn: "to fix, to repair", emoji: "🛠️", fromModule: "m35", introducedByLessonId: "ja-m35-neo-6", kind: "vocab", blocked: true, note: "blocked: 🛠️ already belongs to べんり ('useful/convenient'), and even alone a wrench reads as 'tool', not the act of repairing; IR marks this atom imageable:false. 🛠️ stays as the row's legacy flashcard art, but no word_image_mcq debut is generated for it", pos: "verb", conjugation: { class: "godan" } },
  { id: "hakobu", kana: "はこぶ", kanji: "運ぶ", romaji: "hakobu", meaningEn: "to carry, to transport", shortGloss: "carry", emoji: "📦", fromModule: "m35", introducedByLessonId: "ja-m35-neo-3", kind: "vocab", pos: "verb", conjugation: { class: "godan" } },
  { id: "erabu", kana: "えらぶ", kanji: "選ぶ", romaji: "erabu", meaningEn: "to choose", emoji: "✅", fromModule: "future", freqRank: 302, introducedByLessonId: "ja-m29-1-2", kind: "vocab", pos: "verb", conjugation: { class: "godan" } },
  { id: "katazukeru", kana: "かたづける", kanji: "片付ける", romaji: "katazukeru", meaningEn: "to tidy up", emoji: "🧹", fromModule: "future", freqRank: 303, introducedByLessonId: "ja-m29-2-1", kind: "vocab", pos: "verb", conjugation: { class: "ichidan" } },
  // ── Ex-M30 pilot atoms — RE-HOMED 2026-08-09 (spec
  //    2026-08-06-n4-open-and-transform-teaching-design.md A2). The July
  //    "Casual register" pilot (curriculum/m30.ts) was retired (spec A1);
  //    the spine reassigns m30 = n4-01 「て + helper I」, and leaving these
  //    19 tagged "m30" would have silently converted casual-register words
  //    into vocabulary for a て+helper module (`fromModule` drives the
  //    review pool, D2, and placement seeding — vocab-exposure-audit
  //    2026-07-29 §1). New homes, per the spec + docs/spine-n4.md:
  //      - "thr-n4" (glue-adverb drip, spine §4): やっぱり・もちろん・べつに
  //        named verbatim; ぜったい joins as a known late-teaching straggler.
  //      - "m49" (Keigo I): けいご・ていねい・しつれい・せんぱい・こうはい・
  //        じょうし・どうりょう are all in the spine's m49 `prefer` vocab
  //        list (しつれい is m49-first; m50 re-lists it). ためぐち rides
  //        along — it names the bottom of the register scale the m49 axis
  //        card states outright, and neither keigo module's vocab table
  //        names it. しりあい also lands here: the spec listed it unowned
  //        with "tag forward to a future module" latitude, and the spine's
  //        m49 `salvage` line names it verbatim.
  //      - "future" (unowned): なんで・どうしたの・きになる・おさななじみ・
  //        なかま・したしい — no spine unit claims them; the established
  //        "future" sentinel keeps them registered but never unlockable
  //        until something teaches them.
  //    `introducedByLessonId` was DELETED from all 19 (they pointed at the
  //    deleted ja-m30-* lessons and would otherwise be dangling — B068
  //    ratchet). Reconciliation notes from the pilot that still apply:
  //      - たぶん ("probably") stays an m18 atom — never re-registered here.
  //      - きになる deliberately replaces the spine's bare き ("feeling,
  //        mind"), which would collide with the m18 tree atom き (木) in
  //        JA_COURSE_ATOMS_BY_KANA.
  { id: "mochiron", kana: "もちろん", romaji: "mochiron", meaningEn: "of course", fromModule: "thr-n4", kind: "vocab", blocked: true, note: "modal adverb — thr-n4 glue-adverb drip", pos: "interjection" },
  { id: "zettai", kana: "ぜったい", kanji: "絶対", romaji: "zettai", meaningEn: "absolutely", fromModule: "thr-n4", kind: "vocab", blocked: true, note: "modal adverb — thr-n4 glue-adverb drip", pos: "adverb" },
  { id: "keigo", kana: "けいご", kanji: "敬語", romaji: "keigo", meaningEn: "polite language (keigo)", emoji: "🙇", fromModule: "m49", kind: "vocab", note: "compound register noun — taught via listeningComp + speaking, not image MCQ", pos: "noun" },
  { id: "shitashii", kana: "したしい", kanji: "親しい", romaji: "shitashii", meaningEn: "close, familiar", emoji: "💞", fromModule: "future", freqRank: 304, kind: "vocab", note: "adjective — taught via build, not image MCQ (guide §13.1)", pos: "adjective", conjugation: { class: "i-adj" } },
  { id: "teinei", kana: "ていねい", kanji: "丁寧", romaji: "teinei", meaningEn: "polite, careful", emoji: "🎀", fromModule: "m49", kind: "vocab", note: "adjective — taught via build, not image MCQ (guide §13.1)", pos: "adjective", conjugation: { class: "na-adj" } },
  { id: "shitsurei", kana: "しつれい", kanji: "失礼", romaji: "shitsurei", meaningEn: "rude, impolite", emoji: "🙅", fromModule: "m49", kind: "vocab", note: "adjective — taught via build, not image MCQ (guide §13.1)", pos: "adjective", conjugation: { class: "na-adj" } },
  { id: "tameguchi", kana: "ためぐち", kanji: "ため口", romaji: "tameguchi", meaningEn: "casual speech", emoji: "🗣️", fromModule: "m49", kind: "vocab", note: "compound register noun — taught via listeningComp + speaking, not image MCQ", pos: "noun" },
  { id: "nande", kana: "なんで", kanji: "何で", romaji: "nande", meaningEn: "why (casual)", fromModule: "future", freqRank: 305, kind: "vocab", blocked: true, note: "casual interrogative", pos: "adverb" },
  { id: "doushitano", kana: "どうしたの", romaji: "doushitano", meaningEn: "what's up?", fromModule: "future", freqRank: 306, kind: "vocab", blocked: true, note: "casual function phrase", pos: "expression" },
  { id: "kininaru", kana: "きになる", kanji: "気になる", romaji: "kininaru", meaningEn: "on my mind, curious/concerned about", fromModule: "future", freqRank: 307, kind: "vocab", blocked: true, note: "fixed idiom replacing spine's bare き — see block comment above", pos: "expression" },
  { id: "betsuni", kana: "べつに", kanji: "別に", romaji: "betsuni", meaningEn: "not particularly", fromModule: "thr-n4", kind: "vocab", blocked: true, note: "casual filler adverb — thr-n4 glue-adverb drip", pos: "adverb" },
  { id: "senpai", kana: "せんぱい", kanji: "先輩", romaji: "senpai", meaningEn: "senior (at school/work)", emoji: "🎓", fromModule: "m49", kind: "vocab", pos: "noun" },
  { id: "joushi", kana: "じょうし", kanji: "上司", romaji: "joushi", meaningEn: "boss, superior", emoji: "💼", fromModule: "m49", kind: "vocab", pos: "noun" },
  { id: "douryou", kana: "どうりょう", kanji: "同僚", romaji: "douryou", meaningEn: "colleague", emoji: "🧑‍💼", fromModule: "m49", kind: "vocab", pos: "noun" },
  { id: "yappari", kana: "やっぱり", romaji: "yappari", meaningEn: "as expected, after all", fromModule: "thr-n4", kind: "vocab", blocked: true, note: "modal adverb — thr-n4 glue-adverb drip", pos: "adverb" },
  { id: "kouhai", kana: "こうはい", kanji: "後輩", romaji: "kouhai", meaningEn: "junior (at school/work)", emoji: "🧑‍🎓", fromModule: "m49", kind: "vocab", pos: "noun" },
  { id: "shiriai", kana: "しりあい", kanji: "知り合い", romaji: "shiriai", meaningEn: "acquaintance", emoji: "👤", fromModule: "m49", kind: "vocab", pos: "noun" },
  { id: "osananajimi", kana: "おさななじみ", kanji: "幼馴染", romaji: "osananajimi", meaningEn: "childhood friend", emoji: "🧒", fromModule: "future", freqRank: 308, kind: "vocab", pos: "noun" },
  { id: "nakama", kana: "なかま", kanji: "仲間", romaji: "nakama", meaningEn: "comrade, mate", emoji: "👥", fromModule: "future", freqRank: 309, kind: "vocab", pos: "noun" },
  // ── Taught-but-unregistered backfill (freq-gap wave 0, 2026-08-26) ──
  // These have been ON TILES for modules without a registry row — invisible
  // to the tokenizer's crediting and to SRS. Registered with the whole-course
  // tile diff in hand (empty — see docs/ja-freq-gap-plan-2026-08-26.md §4.2).
  // NOT registered: ちゃう (bound-morpheme, ships inside whole 〜ちゃった
  // atoms — same ruling as m30's とく) and だけ (FROZEN_UNREGISTERED — a
  // global だけ atom shatters だけど tiles in nine modules; see
  // irAtomRegistration.test.ts).
  { id: "moshi", kana: "もし", kanji: "もし", romaji: "moshi", meaningEn: "if (conditional adverb)", fromModule: "m37", kind: "vocab", blocked: true, note: "taught inside m37's conditional sentences; needs its two deepen beats (plan §1.3) for ≥3 authored occurrences — wave 1", pos: "adverb" },
  { id: "uso", kana: "うそ", kanji: "嘘", romaji: "uso", meaningEn: "a lie", fromModule: "m1", kind: "vocab", blocked: true, note: "kana build word since m1-sa; vocab-unit teaching lands with the m10 insert pack (two-stage attribution, guide §13.8) — leave introducedByLessonId unset until that lesson exists (B068: a dangling id is a ratchet failure, and a static entry suppresses the module-fallback unlock)", pos: "noun" },
  { id: "ore", kana: "おれ", kanji: "俺", romaji: "ore", meaningEn: "I (rough, masculine)", fromModule: "m10", kind: "vocab", blocked: true, note: "recognition only — production register is m47's call (plan §3.2); registered so it can exist as a flashcard at all", pos: "pronoun" },
  { id: "p-nagara", kana: "ながら", romaji: "nagara", meaningEn: "while doing (simultaneous action)", fromModule: "m36", kind: "particle", pos: "particle" },
  { id: "p-tte", kana: "って", romaji: "tte", meaningEn: "casual quotative (= と)", fromModule: "m18", kind: "particle", note: "bound-morpheme hazard (inv 41): って is a substring of every whole-registered て-form with a geminate (いって/かって/まって/しって…) — those atoms win longest-match, and the whole-course tile diff at registration was clean. Re-run the tile diff if a new 〜って form ships un-atomized.", pos: "particle" },
  // ── m7-neo (spine tile s07) — the polite layer: ます / ません / です ──
  { id: "shimasu", kana: "します", romaji: "shimasu", meaningEn: "do, make (polite)", fromModule: "m7", introducedByLessonId: "ja-m7-neo-2", kind: "vocab", pos: "verb" },
  { id: "kimasu", kana: "きます", romaji: "kimasu", meaningEn: "come (polite)", fromModule: "m7", introducedByLessonId: "ja-m7-neo-2", kind: "vocab", pos: "verb" },
  { id: "kaimasu", kana: "かいます", romaji: "kaimasu", meaningEn: "buy (polite)", fromModule: "m7", introducedByLessonId: "ja-m7-neo-1", kind: "vocab", pos: "verb" },
  { id: "kikimasu", kana: "ききます", romaji: "kikimasu", meaningEn: "listen, ask (polite)", fromModule: "m7", introducedByLessonId: "ja-m7-neo-1", kind: "vocab", pos: "verb" },
  { id: "asobimasu", kana: "あそびます", romaji: "asobimasu", meaningEn: "play (polite)", fromModule: "m7", introducedByLessonId: "ja-m7-neo-1", kind: "vocab", pos: "verb" },
  { id: "tabemasen", kana: "たべません", romaji: "tabemasen", meaningEn: "don't eat (polite)", fromModule: "m7", introducedByLessonId: "ja-m7-neo-1", kind: "vocab", pos: "verb" },
  { id: "nomimasen", kana: "のみません", romaji: "nomimasen", meaningEn: "don't drink (polite)", fromModule: "m7", introducedByLessonId: "ja-m7-neo-1", kind: "vocab", pos: "verb" },
  { id: "mimasen", kana: "みません", romaji: "mimasen", meaningEn: "don't watch (polite)", fromModule: "m7", introducedByLessonId: "ja-m7-neo-1", kind: "vocab", pos: "verb" },
  { id: "ikimasen", kana: "いきません", romaji: "ikimasen", meaningEn: "don't go, not travelling (polite)", fromModule: "m7", introducedByLessonId: "ja-m7-neo-1", kind: "vocab", pos: "verb" },
  { id: "kimasen", kana: "きません", romaji: "kimasen", meaningEn: "doesn't come (polite)", fromModule: "m7", introducedByLessonId: "ja-m7-neo-1", kind: "vocab", pos: "verb" },
  { id: "shimasen", kana: "しません", romaji: "shimasen", meaningEn: "don't do, won't make (polite)", fromModule: "m7", introducedByLessonId: "ja-m7-neo-1", kind: "vocab", pos: "verb" },
  { id: "hatarakimasen", kana: "はたらきません", romaji: "hatarakimasen", meaningEn: "don't work (polite)", fromModule: "m7", introducedByLessonId: "ja-m7-neo-1", kind: "vocab", pos: "verb" },
  { id: "arimasen", kana: "ありません", romaji: "arimasen", meaningEn: "doesn't have, isn't there (polite)", fromModule: "m7", introducedByLessonId: "ja-m7-neo-1", kind: "vocab", pos: "verb" },
  { id: "hatarakimasu", kana: "はたらきます", romaji: "hatarakimasu", meaningEn: "work (polite)", fromModule: "m7", introducedByLessonId: "ja-m7-neo-7", kind: "vocab", pos: "verb" },
  { id: "sama", kana: "さま", romaji: "sama", meaningEn: "-sama (respectful name suffix)", shortGloss: "-sama", fromModule: "m7", introducedByLessonId: "ja-m7-neo-8", kind: "vocab", pos: "noun" },
  { id: "kun", kana: "くん", romaji: "kun", meaningEn: "-kun (familiar, usually boys)", shortGloss: "-kun", fromModule: "m7", introducedByLessonId: "ja-m7-neo-8", kind: "vocab", pos: "noun" },
  { id: "chan", kana: "ちゃん", romaji: "chan", meaningEn: "-chan (affectionate)", shortGloss: "-chan", fromModule: "m7", introducedByLessonId: "ja-m7-neo-8", kind: "vocab", pos: "noun" },
  // ── m8-neo (tile n02) — て-form + ください ──
  { id: "tabete", kana: "たべて", romaji: "tabete", meaningEn: "eat (te-form)", fromModule: "m8", introducedByLessonId: "ja-m8-neo-1", kind: "vocab", pos: "verb" },
  { id: "mite", kana: "みて", romaji: "mite", meaningEn: "watch, look (te-form)", fromModule: "m8", introducedByLessonId: "ja-m8-neo-1", kind: "vocab", pos: "verb" },
  { id: "nonde", kana: "のんで", romaji: "nonde", meaningEn: "drink (te-form)", fromModule: "m8", introducedByLessonId: "ja-m8-neo-10", kind: "vocab", pos: "verb" },
  { id: "katte", kana: "かって", romaji: "katte", meaningEn: "buy (te-form)", fromModule: "m8", introducedByLessonId: "ja-m8-neo-2", kind: "vocab", pos: "verb" },
  { id: "tatte", kana: "たって", romaji: "tatte", meaningEn: "stand (te-form)", shortGloss: "stand (te)", fromModule: "m8", introducedByLessonId: "ja-m8-neo-2", kind: "vocab", pos: "verb" },
  { id: "yatte", kana: "やって", romaji: "yatte", meaningEn: "do (te-form)", shortGloss: "do (te)", fromModule: "m8", introducedByLessonId: "ja-m8-neo-2", kind: "vocab", pos: "verb" },
  { id: "isoide", kana: "いそいで", romaji: "isoide", meaningEn: "hurry (te-form)", shortGloss: "hurry (te)", fromModule: "m8", introducedByLessonId: "ja-m8-neo-11", kind: "vocab", pos: "verb" },
  { id: "kashite", kana: "かして", romaji: "kashite", meaningEn: "lend (te-form)", shortGloss: "lend (te)", fromModule: "m8", introducedByLessonId: "ja-m8-neo-11", kind: "vocab", pos: "verb" },
  { id: "kiite", kana: "きいて", romaji: "kiite", meaningEn: "listen, ask (te-form)", fromModule: "m8", introducedByLessonId: "ja-m8-neo-11", kind: "vocab", pos: "verb" },
  { id: "asonde", kana: "あそんで", romaji: "asonde", meaningEn: "play (te-form)", fromModule: "m8", introducedByLessonId: "ja-m8-neo-10", kind: "vocab", pos: "verb" },
  { id: "itte", kana: "いって", romaji: "itte", meaningEn: "go, travel (te-form)", fromModule: "m8", introducedByLessonId: "ja-m8-neo-3", kind: "vocab", pos: "verb" },
  { id: "shite", kana: "して", romaji: "shite", meaningEn: "do, make (te-form)", fromModule: "m8", introducedByLessonId: "ja-m8-neo-3", kind: "vocab", pos: "verb" },
  { id: "kite", kana: "きて", romaji: "kite", meaningEn: "come (te-form)", fromModule: "m8", introducedByLessonId: "ja-m8-neo-3", kind: "vocab", pos: "verb" },
  { id: "oshiete", kana: "おしえて", romaji: "oshiete", meaningEn: "teach, tell (te-form)", fromModule: "m8", introducedByLessonId: "ja-m8-neo-7", kind: "vocab", pos: "verb" },
  { id: "shokuji", kana: "しょくじ", romaji: "shokuji", meaningEn: "a meal", fromModule: "m8", introducedByLessonId: "ja-m8-neo-5", kind: "vocab", pos: "noun" },
  { id: "cha", kana: "ちゃ", romaji: "cha", meaningEn: "tea", fromModule: "m8", introducedByLessonId: "ja-m8-neo-5", kind: "vocab", pos: "noun" },
  { id: "kome", kana: "こめ", romaji: "kome", meaningEn: "rice (uncooked)", shortGloss: "rice (raw)", fromModule: "m8", introducedByLessonId: "ja-m8-neo-6", kind: "vocab", pos: "noun" },
  // ── m9-neo (tile n03) — numbers, counters, purchases ──
  { id: "kane", kana: "かね", romaji: "kane", meaningEn: "money", fromModule: "m9", introducedByLessonId: "ja-m9-neo-5", kind: "vocab", pos: "noun" },
  // ── m10-neo (tile n15) — register in the wild ──
  { id: "uun", kana: "ううん", romaji: "uun", meaningEn: "nope (casual no)", shortGloss: "nope", fromModule: "m10", introducedByLessonId: "ja-m10-neo-2", kind: "vocab", pos: "interjection" },
  { id: "dame", kana: "だめ", romaji: "dame", meaningEn: "no good, not allowed", shortGloss: "no good", fromModule: "m10", introducedByLessonId: "ja-m10-neo-5", kind: "vocab", pos: "adjective", conjugation: { class: "na-adj" } },
  { id: "boku", kana: "ぼく", romaji: "boku", meaningEn: "I, me (casual, usually male)", shortGloss: "I (casual)", fromModule: "m10", introducedByLessonId: "ja-m10-neo-6", kind: "vocab", pos: "pronoun" },
  { id: "shirimasu", kana: "しります", romaji: "shirimasu", meaningEn: "know (polite)", fromModule: "m10", introducedByLessonId: "ja-m10-neo-1", kind: "vocab", pos: "verb" },
  { id: "shirimasen", kana: "しりません", romaji: "shirimasen", meaningEn: "don't know (polite)", fromModule: "m10", introducedByLessonId: "ja-m10-neo-1", kind: "vocab", pos: "verb" },
  { id: "wakarimasu", kana: "わかります", romaji: "wakarimasu", meaningEn: "understand (polite)", fromModule: "m10", introducedByLessonId: "ja-m10-neo-1", kind: "vocab", pos: "verb" },
  { id: "chigaimasu", kana: "ちがいます", romaji: "chigaimasu", meaningEn: "that's not right (polite)", fromModule: "m10", introducedByLessonId: "ja-m10-neo-1", kind: "vocab", pos: "verb" },
  { id: "maa", kana: "まあ", romaji: "maa", meaningEn: "well, sort of", shortGloss: "well…", fromModule: "m10", introducedByLessonId: "ja-m10-neo-8", kind: "vocab", pos: "interjection" },
  // ── m11-neo (tile n04) — time I + plain past た ──
  // Multiples of ten. Registered as whole surfaces because the tokenizer is
  // longest-match and every hour below is a PREFIX of one of these
  // (ごじ ⊂ ごじゅう); without them ごじゅうえん cannot be tiled.
  { id: "sanjuu", kana: "さんじゅう", romaji: "sanjuu", meaningEn: "thirty", fromModule: "m11", introducedByLessonId: "ja-m11-neo-1", kind: "vocab", pos: "number" },
  { id: "yonjuu", kana: "よんじゅう", romaji: "yonjuu", meaningEn: "forty", fromModule: "m11", introducedByLessonId: "ja-m11-neo-1", kind: "vocab", pos: "number" },
  { id: "gojuu", kana: "ごじゅう", romaji: "gojuu", meaningEn: "fifty", fromModule: "m11", introducedByLessonId: "ja-m11-neo-1", kind: "vocab", pos: "number" },
  { id: "rokujuu", kana: "ろくじゅう", romaji: "rokujuu", meaningEn: "sixty", fromModule: "m11", introducedByLessonId: "ja-m11-neo-1", kind: "vocab", pos: "number" },
  { id: "nanajuu", kana: "ななじゅう", romaji: "nanajuu", meaningEn: "seventy", fromModule: "m11", introducedByLessonId: "ja-m11-neo-1", kind: "vocab", pos: "number" },
  // Clock hours. No emoji by design: a clock face cannot discriminate よじ
  // from くじ, so these are never image-MCQ material (inv 30/44).
  { id: "ichiji", kana: "いちじ", romaji: "ichiji", meaningEn: "one o'clock", fromModule: "m11", introducedByLessonId: "ja-m11-neo-2", kind: "vocab", pos: "number" },
  { id: "niji", kana: "にじ", romaji: "niji", meaningEn: "two o'clock", fromModule: "m11", introducedByLessonId: "ja-m11-neo-2", kind: "vocab", pos: "number" },
  { id: "sanji", kana: "さんじ", romaji: "sanji", meaningEn: "three o'clock", fromModule: "m11", introducedByLessonId: "ja-m11-neo-2", kind: "vocab", pos: "number" },
  { id: "yoji", kana: "よじ", romaji: "yoji", meaningEn: "four o'clock", fromModule: "m11", introducedByLessonId: "ja-m11-neo-2", kind: "vocab", pos: "number" },
  { id: "goji", kana: "ごじ", romaji: "goji", meaningEn: "five o'clock", fromModule: "m11", introducedByLessonId: "ja-m11-neo-2", kind: "vocab", pos: "number" },
  { id: "rokuji", kana: "ろくじ", romaji: "rokuji", meaningEn: "six o'clock", fromModule: "m11", introducedByLessonId: "ja-m11-neo-2", kind: "vocab", pos: "number" },
  { id: "shichiji", kana: "しちじ", romaji: "shichiji", meaningEn: "seven o'clock", fromModule: "m11", introducedByLessonId: "ja-m11-neo-2", kind: "vocab", pos: "number" },
  { id: "hachiji", kana: "はちじ", romaji: "hachiji", meaningEn: "eight o'clock", fromModule: "m11", introducedByLessonId: "ja-m11-neo-2", kind: "vocab", pos: "number" },
  { id: "kuji", kana: "くじ", romaji: "kuji", meaningEn: "nine o'clock", fromModule: "m11", introducedByLessonId: "ja-m11-neo-2", kind: "vocab", pos: "number" },
  { id: "juuji", kana: "じゅうじ", romaji: "juuji", meaningEn: "ten o'clock", fromModule: "m11", introducedByLessonId: "ja-m11-neo-2", kind: "vocab", pos: "number" },
  { id: "nanji", kana: "なんじ", romaji: "nanji", meaningEn: "what time", fromModule: "m11", introducedByLessonId: "ja-m11-neo-2", kind: "vocab", blocked: true, note: "interrogative — no concrete referent", pos: "number" },
  // Plain past. した (する) and きた (くる) are deliberately NOT registered:
  // both kana already belong to 下 / 北 in this deck, and a second entry
  // would silently overwrite the kana-keyed lookup those m16/m17 atoms need.
  // The conjugation lexicon already tokenizes them, and the IR carries their
  // gloss, so nothing is lost but the duplicate row.
  { id: "tabeta", kana: "たべた", romaji: "tabeta", meaningEn: "ate (eat, past)", fromModule: "m11", introducedByLessonId: "ja-m11-neo-4", kind: "vocab", pos: "noun" },
  { id: "nonda", kana: "のんだ", romaji: "nonda", meaningEn: "drank (drink, past)", fromModule: "m11", introducedByLessonId: "ja-m11-neo-4", kind: "vocab", pos: "noun" },
  { id: "kiita", kana: "きいた", romaji: "kiita", meaningEn: "heard (hear, past)", fromModule: "m11", introducedByLessonId: "ja-m11-neo-4", kind: "vocab", pos: "noun" },
  { id: "mita", kana: "みた", romaji: "mita", meaningEn: "watched (watch, past)", fromModule: "m11", introducedByLessonId: "ja-m11-neo-4", kind: "vocab", pos: "noun" },
  { id: "katta", kana: "かった", romaji: "katta", meaningEn: "bought (buy, past)", fromModule: "m11", introducedByLessonId: "ja-m11-neo-4", kind: "vocab", pos: "noun" },
  { id: "asonda", kana: "あそんだ", romaji: "asonda", meaningEn: "played (play, past)", fromModule: "m11", introducedByLessonId: "ja-m11-neo-4", kind: "vocab", pos: "noun" },
  { id: "itta-iku", kana: "いった", romaji: "itta", meaningEn: "went (travel, past)", fromModule: "m11", introducedByLessonId: "ja-m11-neo-5", kind: "vocab", pos: "noun" },
  { id: "wakatta", kana: "わかった", romaji: "wakatta", meaningEn: "understood (past)", fromModule: "m11", introducedByLessonId: "ja-m11-neo-5", kind: "vocab", pos: "verb" },
  // Copula past
  { id: "datta", kana: "だった", romaji: "datta", meaningEn: "was, were (plain)", shortGloss: "was (plain)", fromModule: "m11", introducedByLessonId: "ja-m11-neo-6", kind: "vocab", blocked: true, note: "copula — no concrete referent", pos: "verb" },
  { id: "deshita", kana: "でした", romaji: "deshita", meaningEn: "was, were (polite)", shortGloss: "was (polite)", fromModule: "m11", introducedByLessonId: "ja-m11-neo-8", kind: "vocab", blocked: true, note: "copula — no concrete referent", pos: "verb" },
  // ── m12-neo (tile s09) — adjectives as mini-predicates ──
  // ONLY the two copula chunks are registered. Every い-adjective form this
  // module teaches (たかくない / おおきかった / よくなかった …) is already a
  // REAL surface via ADJ_ENTRIES, so the conjugation lexicon tokenizes it and
  // the IR carries its gloss — registering inflections here would regress
  // flashcard import + annotateJapaneseText the way m11's polite-past forms
  // would have. じゃない / じゃなかった have no such backing: ADJ_ENTRIES only
  // stores the POLITE な-adjective column (しずかじゃないです), so without
  // these two the tokenizer cannot split しずかじゃない and the tile bank
  // cannot spell it.
  { id: "janai", kana: "じゃない", romaji: "janai", meaningEn: "isn't (noun or な-adjective)", shortGloss: "isn't", fromModule: "m12", introducedByLessonId: "ja-m12-neo-6", kind: "vocab", blocked: true, note: "copula — no concrete referent", pos: "expression" },
  { id: "janakatta", kana: "じゃなかった", romaji: "janakatta", meaningEn: "wasn't (noun or な-adjective)", shortGloss: "wasn't", fromModule: "m12", introducedByLessonId: "ja-m12-neo-7", kind: "vocab", blocked: true, note: "copula — no concrete referent", pos: "expression" },
  // Polite past (たべました / のみました / いきました / しました / かいました) is
  // deliberately NOT registered here. The forms are already real surfaces via
  // the conjugation lexicon, and registering them REGRESSES two shipped
  // behaviours: the flashcard importer stops mapping 食べました back to its
  // dictionary atom (match.test.ts), and annotateJapaneseText stops splitting
  // のみました into stem + ました helper (romajiLexicon.test.ts). The IR carries
  // their glosses, which is all the compiled lessons need.
  //
  // BACKFILL (2026-07-27, m14 authoring): いい is TAUGHT by m12-neo-1 but was
  // never registered — it lives only in m12's IR `newAtoms`, and an IR-only
  // atom is invisible to the module COMPILER's tokenizer (which knows
  // courseAtoms + the module's own newAtoms, nothing else). m14 needs it for
  // 〜ても いい: without this row 「たべても いい」 tokenizes to
  // たべて・も・<unknown いい> and trips the `unbuildable` gate. ADJ_ENTRIES
  // already carries the inflections (よくない/よかった), so only the
  // dictionary surface is registered here.
  { id: "ii", kana: "いい", romaji: "ii", meaningEn: "good, fine, OK", shortGloss: "good", fromModule: "m12", introducedByLessonId: "ja-m12-neo-1", kind: "vocab", blocked: true, note: "abstract quality adjective — no honest emoji", pos: "adjective", conjugation: { class: "i-adj", entryId: "ii" } },
  // ── m14-neo (tile n06b) — ている + permission/prohibition ──
  // ONE registration only. Every other surface this module teaches is either
  // already an atom (ください, たべない …) or a REAL form the conjugation
  // lexicon derives (しって, すんで, およがない via VERB_ENTRIES), and ている
  // itself is deliberately NOT an atom: it tokenizes as て-form + いる, which
  // is exactly the composition the module teaches, so the build tiles show
  // 「たべて」+「いる」 instead of hiding the pattern in one tile.
  // いけません has no such backing — いける is absent from VERB_ENTRIES, so
  // 「たべては いけません」 otherwise tokenizes as たべて・は・いけ・ま・せん
  // (crediting せん "thousand" to SRS, the documented homograph trap) and the
  // tile bank cannot spell the sentence.
  { id: "ikemasen", kana: "いけません", romaji: "ikemasen", meaningEn: "must not, not allowed", shortGloss: "must not", fromModule: "m14", introducedByLessonId: "ja-m14-neo-7", kind: "vocab", blocked: true, note: "fixed prohibition helper — no concrete referent", pos: "expression" },
  // ── m15-neo (tile s11) — relative clauses + こと/の + とき ──
  // TWO registrations. Every other surface m15 teaches is already an atom
  // (えいが/くつ/りょこう/いそがしい carry m15 `fromModule` tags of their own,
  // まえ carries a stale m17 one) or a REAL form the conjugation lexicon
  // derives (かった, のんだ, いってから = いって + から …). こと and とき are
  // derivable from nothing: without a row here the guards' tokenizer reads
  // them as untracked words and the compiler's `unbuildable` gate rejects
  // every sentence that uses them, exactly as m14 documented for いけません.
  // Both are `blocked` — an abstract function noun has no honest emoji, and
  // the rule cards that teach them are their introduction.
  { id: "koto", kana: "こと", romaji: "koto", meaningEn: "thing, the act of doing", shortGloss: "thing (act of)", fromModule: "m15", introducedByLessonId: "ja-m15-neo-4", kind: "vocab", blocked: true, note: "nominalizer / abstract 'thing' — no concrete referent", pos: "noun" },
  { id: "toki-when", kana: "とき", romaji: "toki", meaningEn: "time, when", shortGloss: "time, when", fromModule: "m15", introducedByLessonId: "ja-m15-neo-5", kind: "vocab", blocked: true, note: "temporal function noun — an emoji clock would read as じかん/とけい", pos: "noun" },
  // ── m16-neo (tile s13) — から/ので/けど, から…まで, past negatives ──
  // SIX registrations, all `blocked` (function words and counters have no
  // honest emoji). Every other surface m16 teaches is either already an atom
  // (さむい/やすみ/うち carry stale old-course tags of their own) or a REAL form
  // the conjugation lexicon derives from VERB_ENTRIES/ADJ_ENTRIES
  // (たべませんでした, たべなかった, さむかった …). These six are derivable from
  // nothing: without a row here the guards' tokenizer reads them as untracked
  // words and the compiler's `unbuildable` gate rejects every sentence that
  // uses them — the same reason m15 registered こと/とき.
  // まい and がつ are deliberately the ONLY counter atoms: months and sheet
  // counts are built compositionally from a number the learner already owns +
  // the suffix (「ろく」+「がつ」, 「さん」+「まい」), which is both the pedagogy
  // and what keeps twelve month atoms out of the registry. Bound-suffix check
  // (inv 41): がつ is a substring of no other atom, and every atom containing
  // まい (せまい/あまい/まいにち/まいばん/まいあさ/まいしゅう/まいとし/まいねん/
  // まいげつ/まいつき) is itself registered, so longest-match consumes them
  // whole and まい can never be split out of one.
  { id: "node", kana: "ので", romaji: "node", meaningEn: "because (softer)", shortGloss: "because", fromModule: "m16", introducedByLessonId: "ja-m16-neo-3", kind: "vocab", blocked: true, note: "conjunctive particle — no concrete referent", pos: "particle" },
  { id: "kedo", kana: "けど", romaji: "kedo", meaningEn: "but", fromModule: "m16", introducedByLessonId: "ja-m16-neo-4", kind: "vocab", blocked: true, note: "conjunctive particle — no concrete referent", pos: "conjunction" },
  { id: "made", kana: "まで", romaji: "made", meaningEn: "until, as far as", shortGloss: "until", fromModule: "m16", introducedByLessonId: "ja-m16-neo-6", kind: "vocab", blocked: true, note: "span-end particle — no concrete referent", pos: "particle" },
  { id: "gatsu", kana: "がつ", romaji: "gatsu", meaningEn: "month (in a date)", shortGloss: "month", fromModule: "m16", introducedByLessonId: "ja-m16-neo-6", kind: "vocab", blocked: true, note: "bound month suffix — 📅 already belongs to きょう", pos: "counter" },
  { id: "zenzen", kana: "ぜんぜん", romaji: "zenzen", meaningEn: "not at all (with a negative)", shortGloss: "not at all", fromModule: "m16", introducedByLessonId: "ja-m16-neo-8", kind: "vocab", blocked: true, note: "polarity adverb — only ever appears beside a negative", pos: "adverb" },
  { id: "mai-counter", kana: "まい", romaji: "mai", meaningEn: "counter for flat things", shortGloss: "flat-thing counter", fromModule: "m16", introducedByLessonId: "ja-m16-neo-9", kind: "vocab", blocked: true, note: "bound counter — no concrete referent of its own", pos: "counter" },
  // なかった is the ONE conjugated surface m16 has to register. Every other
  // past-negative it teaches is derivable — たべなかった / のまなかった /
  // いかなかった come out of VERB_ENTRIES via the nai-past chain, さむかった out
  // of ADJ_ENTRIES — but ある and いる are absent from VERB_ENTRIES entirely, so
  // ある's past negative exists in no lexicon the guards read. Without a row
  // here 「じかんが なかったから」 tokenizes as なか ("inside") + った, which is
  // both an untracked fragment AND a silent SRS mis-credit: the same class m14
  // documented for いけません and m15 for こと/とき.
  { id: "nakatta", kana: "なかった", romaji: "nakatta", meaningEn: "there wasn't, didn't have", shortGloss: "didn't have", fromModule: "m16", introducedByLessonId: "ja-m16-neo-8", kind: "vocab", blocked: true, note: "past negative of ある — ある is not in VERB_ENTRIES, so no lexicon derives it", pos: "verb" },
  // ── m17-neo (tile n07) — Family I: your side (うち) ──
  // TWO registrations, and they are the ONLY surfaces this module adds to the
  // tokenizer. Every other atom m17 declares already HAS a row here under a
  // stale old-course tag — ちち/はは (m8), あに (m3), あね/おとうと/いもうと
  // (m19), ひとり/さんにん/よにん (m5), きょうだい/はたち ("future"),
  // この/その/あの/どの (m8) — so declaring them in the IR only fixes their
  // PROVENANCE (priorVocab contains none of them), it does not touch tiling.
  // Both are `blocked`: a bound counter has no concrete referent of its own,
  // and the rule cards that teach them are their introduction.
  // Bound-suffix check (inv 41), run before shipping because a new short atom
  // re-tokenizes the WHOLE course: every registered atom containing さい —
  // ください / ごめんなさい / ちいさい / うるさい / やさい / さいふ — is itself
  // an atom and strictly longer, so longest-match consumes it whole and さい can
  // never be split out of one. Same for にん: さんにん / よにん / ごにん are all
  // registered, and にほんじん / アメリカじん contain じん, not にん.
  { id: "sai-counter", kana: "さい", romaji: "sai", meaningEn: "years old (counter for age)", shortGloss: "years old", fromModule: "m17", introducedByLessonId: "ja-m17-neo-5", kind: "vocab", blocked: true, note: "bound age counter — no concrete referent of its own", pos: "counter" },
  { id: "nin-counter", kana: "にん", romaji: "nin", meaningEn: "counter for people", shortGloss: "people counter", fromModule: "m17", introducedByLessonId: "ja-m17-neo-4", kind: "vocab", blocked: true, note: "bound people counter — 🧍 already belongs to からだ and 👥 to ひと", pos: "counter" },
  // ── m19-neo (tile s15) — Getting around: motion particles ──
  // FOUR registrations, and they are the only surfaces this module adds to the
  // tokenizer. Every other atom m19 declares already HAS a row here under a
  // stale old-course tag — がっこう/としょかん/でんしゃ (m6), びょういん/あるく
  // (m17), バス (m8), ちかてつ ("future"), かえる (m14) — so declaring them in
  // the IR only fixes their PROVENANCE (priorVocab contains none of them); it
  // does not touch tiling.
  // Bound-suffix / retokenization check (inv 41 + the m16-ので trap), run before
  // shipping because a new short atom re-tokenizes the WHOLE course: へ is
  // ALREADY in moduleCompiler's PARTICLES list, so this row changes no
  // tokenization at all, and the four registered atoms that contain へ (へや,
  // たいへん, へた, へん) are each strictly longer, so longest-match consumes
  // them whole. ふん / ぷん / じゅっぷん are substrings of NO registered atom and
  // occur in NO existing curriculum surface, so they cannot be split out of
  // anything either.
  // へ is `blocked` for the usual particle reason (no concrete referent) and the
  // minute counters because a bound counter has none of its own; the L2 and L5
  // rule cards are their introduction.
  { id: "p-e", kana: "へ", romaji: "e", meaningEn: "to, toward (direction)", shortGloss: "toward", fromModule: "m19", introducedByLessonId: "ja-m19-neo-2", kind: "particle", blocked: true, note: "direction particle — WRITTEN he, READ e", pos: "particle" },
  { id: "fun-counter", kana: "ふん", romaji: "fun", meaningEn: "minutes (after 2, 5, 7, 9)", shortGloss: "minutes", fromModule: "m19", introducedByLessonId: "ja-m19-neo-5", kind: "vocab", blocked: true, note: "bound minute counter — no concrete referent of its own", pos: "counter" },
  { id: "pun-counter", kana: "ぷん", romaji: "pun", meaningEn: "minutes (after 1, 3, 4, 6, 8, 10)", shortGloss: "minutes -pun", fromModule: "m19", introducedByLessonId: "ja-m19-neo-5", kind: "vocab", blocked: true, note: "the rendaku half of the minute counter", pos: "counter" },
  { id: "juppun", kana: "じゅっぷん", romaji: "juppun", meaningEn: "ten minutes", shortGloss: "ten minutes", fromModule: "m19", introducedByLessonId: "ja-m19-neo-5", kind: "vocab", blocked: true, note: "geminating cell — じゅっ decomposes to nothing, so the whole form is the atom", pos: "number" },
  // ── m20-neo (tile n09) — Comparisons I: のほうが…より ──
  // EIGHT registrations. Every other atom m20 declares already HAS a row —
  // ちかい/とおい (m6), どっち/どちら, せん/まん (m14), たまご (m21) — so
  // declaring those in the IR only fixes their PROVENANCE; it does not touch
  // tiling.
  // Retokenization check (inv 41 + the m16-ので trap), run against a dump of
  // every compiled tile in the course BEFORE shipping, because a new short
  // atom re-tokenizes the WHOLE course: ほう and より occur in no curriculum
  // surface and inside no registered atom. こ is the dangerous one — one
  // character — but longest-match-first means it can only win where nothing
  // longer matched, and every こ-bearing atom in the registry (ここ, これ,
  // この, こと, こない, こえ, こめ, こうえん, きのこ, ねこ, こちら, けっこう,
  // がっこう …) is strictly longer and is consumed whole. The five
  // hundred/thousand cells are 4-5 kana and are substrings of nothing.
  { id: "hou", kana: "ほう", romaji: "hou", meaningEn: "the more ~ one, this side", shortGloss: "the ~ one", fromModule: "m20", introducedByLessonId: "ja-m20-neo-1", kind: "vocab", blocked: true, note: "comparison noun — abstract, no referent a picture could name", pos: "noun" },
  { id: "p-yori", kana: "より", romaji: "yori", meaningEn: "than (in a comparison)", shortGloss: "than", fromModule: "m20", introducedByLessonId: "ja-m20-neo-1", kind: "particle", blocked: true, note: "comparison particle — marks the LOSER of the comparison", pos: "particle" },
  { id: "ko-counter", kana: "こ", romaji: "ko", meaningEn: "counter for small objects", shortGloss: "-ko counter", fromModule: "m20", introducedByLessonId: "ja-m20-neo-6", kind: "vocab", blocked: true, note: "bound generic counter — no concrete referent of its own", pos: "counter" },
  { id: "sanbyaku", kana: "さんびゃく", romaji: "sanbyaku", meaningEn: "three hundred", shortGloss: "300", fromModule: "m20", introducedByLessonId: "ja-m20-neo-4", kind: "vocab", blocked: true, note: "sound-change cell — さん + ひゃく never surfaces, so the whole form is the atom", pos: "number" },
  { id: "roppyaku", kana: "ろっぴゃく", romaji: "roppyaku", meaningEn: "six hundred", shortGloss: "600", fromModule: "m20", introducedByLessonId: "ja-m20-neo-4", kind: "vocab", blocked: true, note: "geminating sound-change cell — ろっ decomposes to nothing", pos: "number" },
  { id: "happyaku", kana: "はっぴゃく", romaji: "happyaku", meaningEn: "eight hundred", shortGloss: "800", fromModule: "m20", introducedByLessonId: "ja-m20-neo-4", kind: "vocab", blocked: true, note: "geminating sound-change cell — はっ decomposes to nothing", pos: "number" },
  { id: "sanzen", kana: "さんぜん", romaji: "sanzen", meaningEn: "three thousand", shortGloss: "3000", fromModule: "m20", introducedByLessonId: "ja-m20-neo-5", kind: "vocab", blocked: true, note: "sound-change cell — さん + せん never surfaces", pos: "number" },
  { id: "hassen", kana: "はっせん", romaji: "hassen", meaningEn: "eight thousand", shortGloss: "8000", fromModule: "m20", introducedByLessonId: "ja-m20-neo-5", kind: "vocab", blocked: true, note: "geminating sound-change cell — はっ decomposes to nothing", pos: "number" },

  // ── m21 (spine s19) — LISTING, and the CUP COUNTER cell by cell ─────────
  //
  // や is the open-list particle; every other m21 word already had a registry
  // row (the Family II honorifics, など, コーヒー, おさけ) or is a derived
  // 〜たり form, which stays IR-only per the m14 rule for inflections.
  //
  // THE CUP COUNTER IS ALL WHOLE CELLS, and that is forced rather than chosen.
  // 「はい」 is ALREADY an atom — the m3-era interjection "yes"
  // (`ja-surv-hai`) — and `JA_COURSE_ATOMS_BY_KANA` is LAST-WINS, so adding a
  // second はい row would flip every 「はい」 in the course from the
  // interjection to the counter and silently re-credit SRS on ~66 existing
  // surfaces. No cell can therefore compose from number + counter the way
  // m19's さん + ぷん and m20's ご + ひゃく did; each cell is its own lexical
  // unit and each gets a row. Consequence worth stating: さん never tokenizes
  // out of 「さんばい」, so 三 is never credited from it and
  // `honorificAtomTagging`'s NUMERAL_CONTEXT needed no new entry — exactly
  // the note m20 left for さんびゃく / さんぜん.
  //
  // Readings follow `classifiers.ts`, this repo's shipped counter table.
  // にはい is banned as a surface twice over (the に/二 homograph AND the
  // はい/はい one); ななはい / はっぱい / きゅうはい / じゅっぱい are named in
  // m21's L5 card prose only. All six strings below were checked against every
  // compiled tile in the whole ja course before and after registration (the
  // m16-ので class): the diff was empty.
  { id: "p-ya", kana: "や", romaji: "ya", meaningEn: "and (an open list — A や B means A and B among others)", shortGloss: "and (some of)", fromModule: "m21", introducedByLessonId: "ja-m21-neo-1", kind: "particle", blocked: true, note: "listing particle — an open list, against と's closed one", pos: "particle" },
  { id: "ippai", kana: "いっぱい", romaji: "ippai", meaningEn: "one cupful, one glass", shortGloss: "1 cup", fromModule: "m21", introducedByLessonId: "ja-m21-neo-5", kind: "vocab", blocked: true, note: "geminating cell — いっ decomposes to nothing, and はい cannot be an atom (it is the interjection)", pos: "number" },
  { id: "sanbai", kana: "さんばい", romaji: "sanbai", meaningEn: "three cupfuls", shortGloss: "3 cups", fromModule: "m21", introducedByLessonId: "ja-m21-neo-5", kind: "vocab", blocked: true, note: "rendaku cell — さん turns はい into ばい", pos: "number" },
  { id: "yonhai", kana: "よんはい", romaji: "yonhai", meaningEn: "four cupfuls", shortGloss: "4 cups", fromModule: "m21", introducedByLessonId: "ja-m21-neo-6", kind: "vocab", blocked: true, note: "regular cell, whole because はい cannot be an atom (ja-surv-hai owns the kana)", pos: "number" },
  { id: "gohai", kana: "ごはい", romaji: "gohai", meaningEn: "five cupfuls", shortGloss: "5 cups", fromModule: "m21", introducedByLessonId: "ja-m21-neo-6", kind: "vocab", blocked: true, note: "regular cell, whole for the same reason as よんはい", pos: "number" },
  { id: "roppai", kana: "ろっぱい", romaji: "roppai", meaningEn: "six cupfuls", shortGloss: "6 cups", fromModule: "m21", introducedByLessonId: "ja-m21-neo-5", kind: "vocab", blocked: true, note: "geminating cell — ろっ decomposes to nothing", pos: "number" },
  { id: "nanbai", kana: "なんばい", romaji: "nanbai", meaningEn: "how many cupfuls", shortGloss: "how many cups", fromModule: "m21", introducedByLessonId: "ja-m21-neo-6", kind: "vocab", blocked: true, note: "interrogative cell — なん takes the rendaku ばい", pos: "number" },

  // 〜たり forms. Registered for the same reason the て-forms (たべて, m8) and
  // the plain pasts (のんだ, m11) are: without a row the SRS annotator cannot
  // resolve the surface at all, so a whole lesson's production would credit
  // nothing, and the guards' tokenizer splits 「たべたり」 into たべた + り.
  // Each is a WHOLE atom because it has to be — a bare り is a one-character
  // junk tile that no diagnostic can see.
  { id: "tabetari", kana: "たべたり", romaji: "tabetari", meaningEn: "eat, and things like that", shortGloss: "eat, etc.", fromModule: "m21", introducedByLessonId: "ja-m21-neo-7", kind: "vocab", blocked: true, note: "〜たり form of たべる — a listing form, no single referent a picture could name", pos: "verb" },
  { id: "nondari", kana: "のんだり", romaji: "nondari", meaningEn: "drink, and things like that", shortGloss: "drink, etc.", fromModule: "m21", introducedByLessonId: "ja-m21-neo-7", kind: "vocab", blocked: true, note: "〜たり form of のむ", pos: "verb" },
  { id: "mitari", kana: "みたり", romaji: "mitari", meaningEn: "watch, and things like that", shortGloss: "watch, etc.", fromModule: "m21", introducedByLessonId: "ja-m21-neo-7", kind: "vocab", blocked: true, note: "〜たり form of みる — watch/look at, never 'read' (verbGlossFidelity)", pos: "verb" },
  { id: "kiitari", kana: "きいたり", romaji: "kiitari", meaningEn: "listen, and things like that", shortGloss: "listen, etc.", fromModule: "m21", introducedByLessonId: "ja-m21-neo-7", kind: "vocab", blocked: true, note: "〜たり form of きく", pos: "verb" },
  { id: "asondari", kana: "あそんだり", romaji: "asondari", meaningEn: "play, and things like that", shortGloss: "play, etc.", fromModule: "m21", introducedByLessonId: "ja-m21-neo-8", kind: "vocab", blocked: true, note: "〜たり form of あそぶ", pos: "verb" },
  { id: "ittari", kana: "いったり", romaji: "ittari", meaningEn: "go, and things like that", shortGloss: "go, etc.", fromModule: "m21", introducedByLessonId: "ja-m21-neo-8", kind: "vocab", blocked: true, note: "〜たり form of いく — 'go', never 'say' (the m18 いった homograph ruling)", pos: "verb" },

  // ── m22 (spine s17) — BODY, HEALTH & HELP ────────────────────────────────
  //
  // Most of the domain already had registry rows under stale old-course m20
  // tags (あたま / おなか / め / みみ / あし / くち / て / くすり / びょうき /
  // いたい / いしゃ), so m22 declares those in its IR `newAtoms` only — the
  // m15-m21 provenance move, which adds nothing to the course-wide tokenizer
  // and therefore cannot raise the m16-ので regression class. Eleven surfaces
  // had NO row and are added here; all eleven were checked for retokenization
  // damage first by dumping every compiled tile in the whole ja course before
  // and after (the diff was empty).
  //
  // 歯 "tooth" and 風邪 "a cold" are BANNED from this module and the ban is
  // mechanical: は is the topic particle and かぜ resolves to 風 "wind"
  // (JA_PRIMARY_ATOM_BY_KANA), so both are homograph LOSERS — no token can
  // ever identify them, so nothing can be scheduled for them.
  // `homographTeaching.test.ts` fails the build on anyone who tries.
  { id: "netsu", kana: "ねつ", kanji: "熱", romaji: "netsu", meaningEn: "a fever", shortGloss: "fever", fromModule: "m22", introducedByLessonId: "ja-m22-neo-3", kind: "vocab", blocked: true, note: "no picture, for two reasons: 🌡️ and びょうき's 🤒 are confusable and both land in L3, and the card that TEACHES 「ねつが ある」 compiles to a pinned step ahead of the interleaved middle — so it would steal any debut MCQ (the m20/m21 card-steals-the-picture rule)", pos: "noun" },
  { id: "nodo", kana: "のど", romaji: "nodo", meaningEn: "throat", shortGloss: "throat", fromModule: "m22", introducedByLessonId: "ja-m22-neo-3", kind: "vocab", blocked: true, note: "no honest glyph for a throat — 🗣️ is こえ and 👅 is a tongue; debuts on a rule card", pos: "noun" },

  // THE 本 COUNTER, CELL BY CELL — forced, not chosen, exactly as m21's 〜はい
  // was. 「ほん」 is already the m3 atom for "book" and `JA_COURSE_ATOMS_BY_KANA`
  // is last-wins, so registering the counter under that kana would flip all
  // ~488 existing ほん surfaces and silently re-credit SRS. Nothing can compose
  // from number + counter the way m19's さん + ぷん and m20's ご + ひゃく did:
  // 「ごほん」 would tokenize as ご (5) + ほん (book). Each cell that reaches a
  // tile is therefore its own atom. Consequence: さん never tokenizes out of
  // 「さんぼん」, so 三 is never credited from it and `honorificAtomTagging`
  // needed no change (its NUMERAL_CONTEXT already lists ぼん).
  // 「にほん」 IS BANNED THREE TIMES OVER — the documented に/二 homograph, に +
  // ほん splitting into the numeral plus "book", and 「にほん」 being the atom
  // for JAPAN (153 occurrences in the corpus). Readings follow
  // `classifiers.ts`, this repo's shipped counter table; ななほん / はっぽん /
  // きゅうほん / じゅっぽん are named in m22's L7 card prose only.
  { id: "ippon", kana: "いっぽん", romaji: "ippon", meaningEn: "one long thin thing", shortGloss: "1 (long thing)", fromModule: "m22", introducedByLessonId: "ja-m22-neo-7", kind: "vocab", blocked: true, note: "geminating cell — いっ decomposes to nothing, and ほん cannot be an atom (it is 'book')", pos: "number" },
  { id: "sanbon", kana: "さんぼん", romaji: "sanbon", meaningEn: "three long thin things", shortGloss: "3 (long things)", fromModule: "m22", introducedByLessonId: "ja-m22-neo-7", kind: "vocab", blocked: true, note: "rendaku cell — さん turns ほん into ぼん", pos: "number" },
  { id: "roppon", kana: "ろっぽん", romaji: "roppon", meaningEn: "six long thin things", shortGloss: "6 (long things)", fromModule: "m22", introducedByLessonId: "ja-m22-neo-7", kind: "vocab", blocked: true, note: "geminating cell — ろっ decomposes to nothing", pos: "number" },
  { id: "nanbon", kana: "なんぼん", romaji: "nanbon", meaningEn: "how many long thin things", shortGloss: "how many?", fromModule: "m22", introducedByLessonId: "ja-m22-neo-7", kind: "vocab", blocked: true, note: "interrogative cell — なん takes the rendaku ぼん", pos: "number" },
  { id: "yonhon", kana: "よんほん", romaji: "yonhon", meaningEn: "four long thin things", shortGloss: "4 (long things)", fromModule: "m22", introducedByLessonId: "ja-m22-neo-9", kind: "vocab", blocked: true, note: "regular cell, whole because ほん cannot be an atom", pos: "number" },
  { id: "gohon", kana: "ごほん", romaji: "gohon", meaningEn: "five long thin things", shortGloss: "5 (long things)", fromModule: "m22", introducedByLessonId: "ja-m22-neo-9", kind: "vocab", blocked: true, note: "regular cell — ご + ほん would otherwise read as 'five books'", pos: "number" },

  // FREQUENCY ADVERBS need NO rows here. いつも / ときどき / あまり already have
  // them under stale old-course m9/m11 tags (and よく / ぜんぜん under m20 /
  // m16), so m22 declares all five in its IR `newAtoms` only — the m15-m21
  // provenance move. Adding a second row would have been a duplicate id, which
  // `courseAtoms.test.ts` catches, and a second by-kana entry, which the
  // last-wins map would have resolved silently.

  // ── m23 · EXPERIENCE & INTENT (spine tile s22) ───────────────────────────
  //
  // FOUR rows, and only four: がいこく / ひこうき / くうこう / ホテル / のる /
  // はいる / つく all already have rows under stale old-course tags and are
  // declared in m23's IR `newAtoms` only (the m15-m22 provenance move), which
  // adds nothing to the course-wide tokenizer. These four had NO row and each
  // was checked against the whole corpus first: every one of the four strings
  // occurs in ZERO existing surfaces, so registering them cannot re-tokenize
  // anything — the m16-ので regression class is impossible here.
  //
  // つもり is the module's headline noun. It is the ONLY genuinely course-wide
  // registration in the cycle, and 「つもりだ」 tiles as つもり + だ, the same
  // shape m22's 「げんきだ」 already ships.
  { id: "tsumori", kana: "つもり", kanji: "積もり", romaji: "tsumori", meaningEn: "intention, plan — what you mean to do", shortGloss: "intend to", fromModule: "m23", introducedByLessonId: "ja-m23-neo-3", kind: "vocab", blocked: true, note: "an intention has no referent a picture could name, and the tsumori-desu card must name the word — a rule card compiles to a pinned step ahead of the interleaved middle and would steal any debut MCQ", pos: "noun" },
  // PLAIN PAST, continued from m11. The same ban applies and for the same
  // reason: した (する) and きた (くる) stay unregistered because 下 and 北 own
  // those kana, and あった (ある) is not registered because it would collide
  // with 会った "met". はいった is likewise absent — it fragments to はい + った,
  // the interjection eating the stem — so m23 uses はいる in the non-past only.
  { id: "notta", kana: "のった", romaji: "notta", meaningEn: "got on, rode (get on, past)", shortGloss: "got on", fromModule: "m23", introducedByLessonId: "ja-m23-neo-2", kind: "vocab", blocked: true, note: "inflected form — no picture; 🚗 is くるま's and のる's already", pos: "noun" },
  { id: "oyoida", kana: "およいだ", romaji: "oyoida", meaningEn: "swam (swim, past)", shortGloss: "swam", fromModule: "m23", introducedByLessonId: "ja-m23-neo-2", kind: "vocab", blocked: true, note: "inflected form — no picture; 🏊 belongs to およぐ", pos: "noun" },
  { id: "hataraita", kana: "はたらいた", romaji: "hataraita", meaningEn: "worked (work, past)", shortGloss: "worked", fromModule: "m23", introducedByLessonId: "ja-m23-neo-1", kind: "vocab", blocked: true, note: "inflected form — no picture; 💼 belongs to はたらく", pos: "noun" },

  // ── m24 · CAN & LET'S (spine tile s21) ───────────────────────────────────
  //
  // The POTENTIAL FORM is a derivation, not a vocabulary list, but no lexicon
  // in this repo can spell one: `ChainForm` has no `potential` cell, so
  // `getRealFormLexicon()` and the compiler's `STEMS` are both blind to
  // のめる / たべられる. Every potential surface that reaches a tile therefore
  // needs a whole atom, exactly as m11 did for the plain past and m14 for the
  // て-form.
  //
  // EVERY string below was checked against the whole live corpus first and
  // occurs in ZERO existing surfaces, so registering it cannot re-tokenize
  // anything (the m16-ので regression class is impossible). The forms that were
  // WANTED and REJECTED, all for kana collisions with atoms that already exist:
  //   かう → かえる  is 帰る "to go back" (m14 row)
  //   かく → かける  is 掛ける "to call by phone" (m14 row)
  //   つく → つける  is 付ける "to turn on" (row exists)
  // Those three verbs are simply never put in the potential in this module.
  // いける is safe DESPITE いけ 池 "pond" and いけません: the tokenizer is
  // longest-match, so いける (3) beats いけ (2) and いけません (5) still beats
  // both — verified by dumping the compiled tiles, not assumed.
  { id: "nomeru", kana: "のめる", romaji: "nomeru", meaningEn: "can drink (potential of のむ)", shortGloss: "can drink", fromModule: "m24", introducedByLessonId: "ja-m24-neo-1", kind: "vocab", blocked: true, note: "derived form — no picture; 🥤 belongs to のむ", pos: "verb" },
  { id: "ikeru", kana: "いける", romaji: "ikeru", meaningEn: "can go (potential of いく)", shortGloss: "can go", fromModule: "m24", introducedByLessonId: "ja-m24-neo-1", kind: "vocab", blocked: true, note: "derived form — no picture; 🚶 belongs to いく", pos: "verb" },
  { id: "oyogeru", kana: "およげる", romaji: "oyogeru", meaningEn: "can swim (potential of およぐ)", shortGloss: "can swim", fromModule: "m24", introducedByLessonId: "ja-m24-neo-1", kind: "vocab", blocked: true, note: "derived form — no picture; 🏊 belongs to およぐ", pos: "verb" },
  { id: "hanaseru", kana: "はなせる", romaji: "hanaseru", meaningEn: "can speak (potential of はなす)", shortGloss: "can speak", fromModule: "m24", introducedByLessonId: "ja-m24-neo-7", kind: "vocab", blocked: true, note: "derived form — no picture; 🗣️ belongs to はなす", pos: "verb" },
  { id: "arukeru", kana: "あるける", romaji: "arukeru", meaningEn: "can walk (potential of あるく)", shortGloss: "can walk", fromModule: "m24", introducedByLessonId: "ja-m24-neo-9", kind: "vocab", blocked: true, note: "derived form — no picture; 🚶 belongs to あるく", pos: "verb" },
  { id: "taberareru", kana: "たべられる", romaji: "taberareru", meaningEn: "can eat (potential of たべる)", shortGloss: "can eat", fromModule: "m24", introducedByLessonId: "ja-m24-neo-2", kind: "vocab", blocked: true, note: "derived form — no picture; 🍽️ belongs to たべる", pos: "verb" },
  { id: "mirareru", kana: "みられる", romaji: "mirareru", meaningEn: "can watch (potential of みる)", shortGloss: "can watch", fromModule: "m24", introducedByLessonId: "ja-m24-neo-2", kind: "vocab", blocked: true, note: "derived form — no picture; 👁️ belongs to みる", pos: "verb" },
  { id: "korareru", kana: "こられる", romaji: "korareru", meaningEn: "can come (potential of くる)", shortGloss: "can come", fromModule: "m24", introducedByLessonId: "ja-m24-neo-2", kind: "vocab", blocked: true, note: "derived form — no picture; くる has none either", pos: "verb" },
  // ら抜きことば — RECOGNITION ONLY (spine s21: "understand it, produce the full
  // form"). Registered because the module HEARS them in dialogue and listening
  // comprehension, and an unregistered surface is an untracked word rather than
  // a taught variant. Never a build target anywhere in the course.
  { id: "tabereru", kana: "たべれる", romaji: "tabereru", meaningEn: "can eat (casual ら-dropped form)", shortGloss: "can eat (casual)", fromModule: "m24", introducedByLessonId: "ja-m24-neo-2", kind: "vocab", blocked: true, note: "ら抜き variant. `blocked` here means NOT-IMAGEABLE (no word_image_mcq) — it does not enforce anything else. Recognition-only is enforced by the guard in m24-neo.test.ts ('ら抜き forms are RECOGNITION only'), which bans these from production targets and requires >=3 heard beats. Still SRS-eligible on purpose, so recognition stays live after m24.", pos: "verb" },
  { id: "mireru", kana: "みれる", romaji: "mireru", meaningEn: "can watch (casual ら-dropped form)", shortGloss: "can watch (casual)", fromModule: "m24", introducedByLessonId: "ja-m24-neo-2", kind: "vocab", blocked: true, note: "ら抜き variant. See たべれる — `blocked` is not-imageable only; the production ban lives in m24-neo.test.ts. SRS-eligible on purpose.", pos: "verb" },
  // NEGATIVE POTENTIAL. A potential verb is ichidan whatever its base was, so
  // this is m6's ない-form applied to a new stem — which is why the L5 card is
  // `nai-form` re-taught rather than a new point.
  { id: "nomenai", kana: "のめない", romaji: "nomenai", meaningEn: "can't drink (negative potential of のむ)", shortGloss: "can't drink", fromModule: "m24", introducedByLessonId: "ja-m24-neo-5", kind: "vocab", blocked: true, note: "derived form — no picture", pos: "verb" },
  { id: "taberarenai", kana: "たべられない", romaji: "taberarenai", meaningEn: "can't eat (negative potential of たべる)", shortGloss: "can't eat", fromModule: "m24", introducedByLessonId: "ja-m24-neo-5", kind: "vocab", blocked: true, note: "derived form — no picture", pos: "verb" },
  { id: "dekinai", kana: "できない", romaji: "dekinai", meaningEn: "can't do it, isn't possible", shortGloss: "can't do", fromModule: "m24", introducedByLessonId: "ja-m24-neo-5", kind: "vocab", blocked: true, note: "derived form — no picture; できる has none either", pos: "verb" },
  // SPONTANEOUS PERCEPTION — not the potential, which is the whole point of the
  // L6 card: みられる is "I get to watch", みえる is "it is visible".
  { id: "mieru", kana: "みえる", romaji: "mieru", meaningEn: "to be visible, to be in sight", shortGloss: "is visible", fromModule: "m24", introducedByLessonId: "ja-m24-neo-6", kind: "vocab", blocked: true, note: "a state of the world, not an action — 👁️ is みる's and め's, and a picture cannot separate 'watch' from 'is visible'", pos: "verb", conjugation: { class: "ichidan" } },
  { id: "kikoeru", kana: "きこえる", romaji: "kikoeru", meaningEn: "to be audible, to reach the ear", shortGloss: "is audible", fromModule: "m24", introducedByLessonId: "ja-m24-neo-6", kind: "vocab", blocked: true, note: "a state of the world, not an action — 👂 is みみ's and きく's", pos: "verb", conjugation: { class: "ichidan" } },
  // ましょう is a BOUND SUFFIX and inv 41 says to check what else in the corpus
  // contains the string before shipping one. Checked: ZERO live Japanese
  // surfaces contain ましょう (m30's only hit is inside an ENGLISH option, and
  // `jaSurfaceForms.ts` GENERATES the form for flashcard credit rather than
  // storing it). Registering it buys every taught verb's volitional at once —
  // 「たべましょう」 tiles as たべ + ましょう, the ます-stem tile m19's 〜に いく
  // already ships — instead of one whole atom per verb.
  { id: "mashou", kana: "ましょう", romaji: "mashou", meaningEn: "let's ~ (polite suggestion, on the ます-stem)", shortGloss: "let's ~", fromModule: "m24", introducedByLessonId: "ja-m24-neo-10", kind: "vocab", blocked: true, note: "bound suffix — no referent a picture could name", pos: "expression" },

  // ── m25 · CONJECTURE (spine tile n13) ────────────────────────────────────
  //
  // FIVE rows, and only five. The whole weather/seasons domain (てんき / はれ /
  // くもり / あめ / あつい / すずしい / あたたかい / はる / なつ / あき / ふゆ /
  // ふる) already has registry rows under stale old-course m18/m8/m1 tags, so
  // m25 declares those in its IR `newAtoms` only — the m15-m24 provenance move,
  // which adds nothing to the course-wide tokenizer and therefore cannot raise
  // the m16-ので regression class.
  //
  // でしょう / でしょ / だろう / きっと had NO row and each was checked against
  // the whole live corpus first: all four strings occur in ZERO existing
  // Japanese surfaces (the only でしょう hits in the repo are the hand-authored
  // `ja-gpool-deshou-*` grammar-review clozes, which are a POOL keyed to this
  // very grammar point, plus English prose), so registering them cannot
  // re-tokenize anything that exists.
  //
  // かな IS THE RISKY ONE and it was measured, not assumed. The string occurs
  // inside 520 live surfaces — every いかない, every しずかな / にぎやかな, and
  // さかな — so the question is whether the longest-match tokenizer can ever
  // LAND on the か. It cannot: いかない (4) and さかな (3) are atoms that start
  // earlier and win outright, and a な-adjective run tokenizes as しずか + な
  // with the pointer already past the か. Verified by dumping every compiled
  // tile in every IR module before and after adding this row — the diff was
  // empty.
  //
  // でしょう is BOUND to the predicate in front of it (inv 41), exactly as m24's
  // ましょう is bound to a ます-stem, so 「あめでしょう」 tiles as あめ + でしょう
  // and 「さむいでしょう」 as さむい + でしょう. That is the point: the tile bank
  // SHOWS the attachment instead of hiding it in one whole-word atom per
  // predicate. Unlike ましょう the stem is a free word, so the m24 noun-stem trap
  // (し 四 / き 木 / まち 町) cannot arise here.
  { id: "deshou", kana: "でしょう", romaji: "deshou", meaningEn: "probably, I expect (conjecture)", shortGloss: "probably", fromModule: "m25", introducedByLessonId: "ja-m25-neo-1", kind: "vocab", blocked: true, note: "bound sentence-ender — no referent a picture could name", pos: "expression" },
  { id: "desho", kana: "でしょ", romaji: "desho", meaningEn: "right? (casual でしょう, checking agreement)", shortGloss: "right?", fromModule: "m25", introducedByLessonId: "ja-m25-neo-10", kind: "vocab", blocked: true, note: "casual contraction of でしょう; longest-match keeps でしょう (4) ahead of it (3)", pos: "expression" },
  { id: "darou", kana: "だろう", romaji: "darou", meaningEn: "probably (plain conjecture — recognition)", shortGloss: "probably (plain)", fromModule: "m25", introducedByLessonId: "ja-m25-neo-9", kind: "vocab", blocked: true, note: "recognition only — sentence-final だろう to a listener is blunt/masculine (spine n13)", pos: "expression" },
  { id: "kana-wonder", kana: "かな", romaji: "kana", meaningEn: "I wonder (thinking out loud)", shortGloss: "I wonder", fromModule: "m25", introducedByLessonId: "ja-m25-neo-6", kind: "vocab", blocked: true, note: "sentence-ender — no referent; checked against いかない / さかな / しずかな for retokenization, diff empty", pos: "particle" },
  { id: "kitto", kana: "きっと", romaji: "kitto", meaningEn: "surely, definitely", shortGloss: "surely", fromModule: "m25", introducedByLessonId: "ja-m25-neo-5", kind: "vocab", blocked: true, note: "abstract modal adverb — no honest emoji (the m30 べつに/やっぱり class)", pos: "adverb" },

  // ── m30 / m31 (N4 tier) — THE IR-ONLY VOCABULARY BACKFILL, 2026-08-18 ─────
  //
  // Both N4 modules taught real vocabulary that lived ONLY in their IR
  // `newAtoms`. An IR-only atom is visible to the module compiler's tokenizer
  // and to nothing else — so these words were taught in lessons, graded in
  // lessons, and could never enter the flashcard deck, because `courseDeck.ts`
  // builds from THIS array. m31 is titled あげる・くれる・もらう and shipped
  // with あげる registered and the other two not.
  //
  // Found by the scene vocabulary gate (it had to union the IR's own
  // `introduces` lists to work at all). Full measurement:
  // docs/issues/n4-vocab-never-reaches-srs-2026-08-18.md.
  //
  // Every row is `blocked: true` because every one of them is `imageable:
  // false` in the IR, and none carries an emoji — which is allowed:
  // `isSrsEligibleAtom` only rejects SINGLE-kana atoms with no emoji, and all
  // of these are multi-kana. So they get a text flashcard, which is the point.
  //
  // NOT registered, deliberately: m30's かっとく / しとく. They are contractions
  // of 〜ておく (かって+おく) — derived forms, not lemmas — so registering them
  // would put a contracted form in the deck as if it were a word. The IR tagged
  // both `kind: vocab`; retagged `kind: grammar-chunk` on 2026-08-19, joining
  // ください / だった / でした / じゃない / いけません — the established tag for a
  // grammatical form registered WHOLE for the tokenizer's sake (spine D15).
  //
  // Retokenization checked the m22 / m25 way — every compiled tile in the
  // whole JA course dumped before and after (6,113 rows); see the issue doc
  // for the diff.

  // m30 (n4-01) — て + helper I
  { id: "toriaezu", kana: "とりあえず", romaji: "toriaezu", meaningEn: "for now, to start with", shortGloss: "for now", fromModule: "m30", kind: "vocab", blocked: true, note: "abstract modal adverb — no honest emoji (the べつに/やっぱり class); registered WHOLE so it cannot tile as とり (bird) + あえず", pos: "adverb" },
  { id: "shiraberu", kana: "しらべる", romaji: "shiraberu", meaningEn: "to look up, to check", shortGloss: "look up", fromModule: "m30", kind: "vocab", blocked: true, pos: "verb", conjugation: { class: "ichidan" } },
  { id: "kimeru", kana: "きめる", romaji: "kimeru", meaningEn: "to decide", shortGloss: "decide", fromModule: "m30", kind: "vocab", blocked: true, pos: "verb", conjugation: { class: "ichidan" } },
  { id: "tsuzukeru", kana: "つづける", romaji: "tsuzukeru", meaningEn: "to keep going, to continue", shortGloss: "keep going", fromModule: "m30", kind: "vocab", blocked: true, pos: "verb", conjugation: { class: "ichidan" } },
  { id: "okuru", kana: "おくる", romaji: "okuru", meaningEn: "to send", shortGloss: "send", fromModule: "m30", kind: "vocab", blocked: true, pos: "verb", conjugation: { class: "godan" } },
  { id: "saisho", kana: "さいしょ", romaji: "saisho", meaningEn: "the first one, at the start", shortGloss: "at first", fromModule: "m30", kind: "vocab", blocked: true, note: "abstract position-in-sequence — no referent a picture could name", pos: "noun" },
  { id: "kekka", kana: "けっか", romaji: "kekka", meaningEn: "the result", shortGloss: "result", fromModule: "m30", kind: "vocab", blocked: true, pos: "noun" },
  { id: "yoyaku", kana: "よやく", romaji: "yoyaku", meaningEn: "a booking, a reservation", shortGloss: "booking", fromModule: "m30", kind: "vocab", blocked: true, pos: "noun" },
  { id: "junbi", kana: "じゅんび", romaji: "junbi", meaningEn: "getting ready, preparation", shortGloss: "preparation", fromModule: "m30", kind: "vocab", blocked: true, pos: "noun" },
  { id: "setsumei", kana: "せつめい", romaji: "setsumei", meaningEn: "an explanation", shortGloss: "explanation", fromModule: "m30", kind: "vocab", blocked: true, pos: "noun" },
  { id: "kotae", kana: "こたえ", romaji: "kotae", meaningEn: "the answer", shortGloss: "answer", fromModule: "m30", kind: "vocab", blocked: true, note: "longest-match keeps こたえる (4) ahead of こたえ (3), so the verb still tiles whole", pos: "noun" },
  { id: "renshuu", kana: "れんしゅう", romaji: "renshuu", meaningEn: "practice", shortGloss: "practice", fromModule: "m30", kind: "vocab", blocked: true, pos: "noun" },

  // m31 (n4-02) — give & receive I
  { id: "kureru", kana: "くれる", romaji: "kureru", meaningEn: "to give (to me, or to my side)", shortGloss: "give me", fromModule: "m31", kind: "vocab", blocked: true, note: "direction is the meaning and a picture cannot carry it — the transfer scene does; blocked so the rule card cannot steal an image debut", pos: "verb", conjugation: { class: "ichidan" } },
  { id: "morau", kana: "もらう", romaji: "morau", meaningEn: "to get, to receive", shortGloss: "receive", fromModule: "m31", kind: "vocab", blocked: true, note: "same event as くれる from the other end — no picture separates them", pos: "verb", conjugation: { class: "godan" } },
  { id: "kudasaru", kana: "くださる", romaji: "kudasaru", meaningEn: "to give me (honorific)", shortGloss: "give me (hon.)", fromModule: "m31", kind: "vocab", blocked: true, note: "RECOGNITION ONLY in the spine — see the production-direction question in the issue doc, the same open question as m24's ら抜き", pos: "verb", conjugation: { class: "godan" } },
  { id: "itadaku", kana: "いただく", romaji: "itadaku", meaningEn: "to receive (honorific)", shortGloss: "receive (hon.)", fromModule: "m31", kind: "vocab", blocked: true, note: "RECOGNITION ONLY in the spine — see the issue doc", pos: "verb", conjugation: { class: "godan" } },
  { id: "yorokobu", kana: "よろこぶ", romaji: "yorokobu", meaningEn: "to be delighted", shortGloss: "be delighted", fromModule: "m31", kind: "vocab", blocked: true, pos: "verb", conjugation: { class: "godan" } },
  { id: "purezento", kana: "プレゼント", romaji: "purezento", meaningEn: "a present", shortGloss: "present", fromModule: "m31", kind: "vocab", blocked: true, note: "blocked per the IR — 🎁 already belongs to あげる", pos: "noun" },
  { id: "keeki", kana: "ケーキ", romaji: "keeki", meaningEn: "a cake", shortGloss: "cake", fromModule: "m31", kind: "vocab", blocked: true, note: "blocked per the IR — 🍰 collides with おかし's 🍬 family", pos: "noun" },
  { id: "hanataba", kana: "はなたば", romaji: "hanataba", meaningEn: "a bouquet", shortGloss: "bouquet", fromModule: "m31", kind: "vocab", blocked: true, note: "blocked — 💐 reads as はな, which is MET", pos: "noun" },
  { id: "orei", kana: "おれい", romaji: "orei", meaningEn: "thanks, a thank-you gift", shortGloss: "thanks", fromModule: "m31", kind: "vocab", blocked: true, pos: "noun" },
  { id: "kaado", kana: "カード", romaji: "kaado", meaningEn: "a card", shortGloss: "card", fromModule: "m31", kind: "vocab", blocked: true, pos: "noun" },
  { id: "omiyage", kana: "おみやげ", romaji: "omiyage", meaningEn: "a souvenir", shortGloss: "souvenir", fromModule: "m31", kind: "vocab", blocked: true, pos: "noun" },
  { id: "kondo", kana: "こんど", romaji: "kondo", meaningEn: "next time, this coming", shortGloss: "next time", fromModule: "m31", kind: "vocab", blocked: true, note: "abstract time reference — no referent a picture could name", pos: "adverb" },
  { id: "oiwai", kana: "おいわい", romaji: "oiwai", meaningEn: "a celebration, a congratulatory gift", shortGloss: "celebration", fromModule: "m31", kind: "vocab", blocked: true, pos: "noun" },
  { id: "kinen", kana: "きねん", romaji: "kinen", meaningEn: "a commemoration, a keepsake", shortGloss: "keepsake", fromModule: "m31", kind: "vocab", blocked: true, pos: "noun" },
  { id: "ureshii", kana: "うれしい", romaji: "ureshii", meaningEn: "happy, glad", shortGloss: "happy", fromModule: "m31", kind: "vocab", blocked: true, note: "blocked — 😊 is also たのしい and げんき, both MET", pos: "adjective", conjugation: { class: "i-adj" } },
  { id: "shinsetsu", kana: "しんせつ", romaji: "shinsetsu", meaningEn: "kind", shortGloss: "kind", fromModule: "m31", kind: "vocab", blocked: true, note: "na-adjective — abstract quality, no honest emoji", pos: "adjective", conjugation: { class: "na-adj" } },
  { id: "omedetou", kana: "おめでとう", romaji: "omedetou", meaningEn: "congratulations", shortGloss: "congrats", fromModule: "m31", kind: "phrase", blocked: true, pos: "expression" },

  // m32 (n4-03) — conditionals I: たら, with と as the contrast.
  //
  // THIRTEEN of this module's words are ADOPTED rather than invented. Seven
  // (みち みぎ ひだり まっすぐ まがる わたる とまる) were tagged `m17` and
  // appear in NO lesson in any module — dead rows in the deck definition that
  // no unlock path could ever reach, because the module fallback only matches
  // atoms whose surface actually occurs in a lesson's steps. Six more
  // (おす ボタン こうさてん かど さく おわる) sat on `future`. m32 is where
  // と-for-directions and と-for-machines finally need all of them, so they are
  // retagged here and taught here. See the orphan-row issue doc.
  { id: "mawasu", kana: "まわす", kanji: "回す", romaji: "mawasu", meaningEn: "to turn, to rotate", shortGloss: "turn", emoji: "🔃", fromModule: "m32", kind: "vocab", blocked: true, note: "rotating arrows — turning a key or a dial, not まがる's change of direction; blocked because three curly-arrow glyphs (🔃 ↩️ 🔀) land in this one module and only two can carry a picture", pos: "verb", conjugation: { class: "godan" } },
  { id: "ugoku", kana: "うごく", kanji: "動く", romaji: "ugoku", meaningEn: "to move, to run (of a machine)", shortGloss: "move", emoji: "\u2699\ufe0f", fromModule: "m32", kind: "vocab", note: "turning gears \u2014 something running under its own power", pos: "verb", conjugation: { class: "godan" } },
  { id: "kikai", kana: "きかい", kanji: "機械", romaji: "kikai", meaningEn: "a machine", shortGloss: "machine", emoji: "\u{1f916}", fromModule: "m32", kind: "vocab", pos: "noun" },
  { id: "oto", kana: "おと", kanji: "音", romaji: "oto", meaningEn: "a sound", shortGloss: "sound", emoji: "\u{1f50a}", fromModule: "m32", kind: "vocab", pos: "noun" },
  { id: "chikamichi", kana: "ちかみち", kanji: "近道", romaji: "chikamichi", meaningEn: "a shortcut", shortGloss: "shortcut", emoji: "\u{1f500}", fromModule: "m32", kind: "vocab", note: "diverging arrows \u2014 a route that leaves the main road and rejoins it", pos: "noun" },
  { id: "tooru", kana: "とおる", kanji: "通る", romaji: "tooru", meaningEn: "to go along, to pass through", shortGloss: "pass through", fromModule: "m32", kind: "vocab", blocked: true, note: "blocked \u2014 a verb of passage has no honest glyph, and the nearest candidate reads as \u307f\u3061's road sign at thumbnail size", pos: "verb", conjugation: { class: "godan" } },
  { id: "gurai", kana: "ぐらい", romaji: "gurai", meaningEn: "about, approximately (of an amount)", shortGloss: "about", fromModule: "m32", kind: "vocab", blocked: true, note: "closed-class suffix \u2014 abstract, no referent a picture could name", pos: "particle" },
  { id: "goro", kana: "ごろ", romaji: "goro", meaningEn: "around (of a point in time)", shortGloss: "around", fromModule: "m32", kind: "vocab", blocked: true, note: "closed-class suffix; pairs with \u3050\u3089\u3044 and is separated from it by what it attaches to, not by meaning", pos: "particle" },

  // ── m33 · Transitivity I (n4-04). Every PAIR VERB is `blocked`, and that is
  //    the module's central authoring decision rather than a shortage of
  //    glyphs: あく and あける describe the same visible event and differ only
  //    in whether a person is behind it, so any picture that named one would
  //    name the other. An image debut for either half would teach that the two
  //    are interchangeable — the single error the module exists to prevent.
  //    The three nouns carry the pictures instead. See ir/m33.ir.yaml.
  { id: "tomeru", kana: "とめる", kanji: "止める", romaji: "tomeru", meaningEn: "to stop (something), to park", shortGloss: "stop (something)", fromModule: "m33", kind: "vocab", blocked: true, note: "transitivity pair with とまる (m32) — blocked: a halted car is the same picture either way, and 🛑 is already とまる's", pos: "verb", conjugation: { class: "ichidan" } },
  { id: "kimaru", kana: "きまる", kanji: "決まる", romaji: "kimaru", meaningEn: "to be decided, to be settled", shortGloss: "be settled", fromModule: "m33", kind: "vocab", blocked: true, note: "transitivity pair with きめる (m30) — blocked: a settled plan has no referent a picture could name", pos: "verb", conjugation: { class: "godan" } },
  { id: "hajimeru", kana: "はじめる", kanji: "始める", romaji: "hajimeru", meaningEn: "to begin something, to start something", shortGloss: "start (something)", fromModule: "m33", kind: "vocab", blocked: true, note: "transitivity pair with はじまる — blocked: ▶️ is already はじまる's and the two are the same picture", pos: "verb", conjugation: { class: "ichidan" } },
  { id: "ochiru", kana: "おちる", kanji: "落ちる", romaji: "ochiru", meaningEn: "to fall, to drop (of itself)", shortGloss: "fall", fromModule: "m33", kind: "vocab", blocked: true, note: "transitivity pair with おとす — blocked: a falling object is the same picture whoever let go of it", pos: "verb", conjugation: { class: "ichidan" } },
  { id: "otosu", kana: "おとす", kanji: "落とす", romaji: "otosu", meaningEn: "to drop something, to let something fall", shortGloss: "drop (something)", fromModule: "m33", kind: "vocab", blocked: true, note: "transitivity pair with おちる — blocked, same reason", pos: "verb", conjugation: { class: "godan" } },
  { id: "kaigi", kana: "かいぎ", kanji: "会議", romaji: "kaigi", meaningEn: "a meeting", shortGloss: "meeting", emoji: "\u{1f4cb}", fromModule: "m33", kind: "vocab", note: "clipboard — an agenda, the one thing a meeting always has", pos: "noun" },
  { id: "hikidashi", kana: "ひきだし", kanji: "引き出し", romaji: "hikidashi", meaningEn: "a drawer", shortGloss: "drawer", emoji: "\u{1f5c4}\ufe0f", fromModule: "m33", kind: "vocab", note: "file cabinet — the m33 carrier noun: a drawer opens, shuts, and has things put in and taken out of it, so one word carries four of the nine pairs", pos: "noun" },

  // ── m34 · Volitional: よう/おう + とおもう, ことにする (n4-05). One real image
  //    debut: もくひょう takes 🎯 honestly — なか's own blocked note (m6, above)
  //    already established the bullseye reads "target/goal", never "middle",
  //    so nothing here contradicts it. Everything else is abstract: a future,
  //    a plan, a dream, a graduation and a savings account have no honest
  //    referent, and やめる/がんばる have no honest picture either — a 💪 reads
  //    "strong", not "keep at it". See ir/m34.ir.yaml.
  { id: "yume", kana: "ゆめ", kanji: "夢", romaji: "yume", meaningEn: "a dream — asleep, or for the future", shortGloss: "dream", fromModule: "m34", kind: "vocab", blocked: true, note: "abstract — a sleeping face reads 'asleep', not 'dream' or 'a future goal'", pos: "noun" },
  { id: "yotei", kana: "よてい", kanji: "予定", romaji: "yotei", meaningEn: "a plan, a schedule", shortGloss: "plan", fromModule: "m34", kind: "vocab", blocked: true, note: "blocked: 📅 already belongs to きょう, and a calendar can't distinguish 'plan' from 'calendar' itself", pos: "noun" },
  { id: "shourai", kana: "しょうらい", kanji: "将来", romaji: "shourai", meaningEn: "the future (someone's own)", shortGloss: "the future", fromModule: "m34", kind: "vocab", blocked: true, note: "abstract — 'someone's own future' has no referent a picture could name", pos: "noun" },
  { id: "sotsugyou", kana: "そつぎょう", kanji: "卒業", romaji: "sotsugyou", meaningEn: "graduation", shortGloss: "graduation", fromModule: "m34", kind: "vocab", blocked: true, note: "blocked: 🎓 already belongs to がくせい/だいがく, and a cap can't distinguish the graduation EVENT from 'student'", pos: "noun" },
  { id: "mokuhyou", kana: "もくひょう", kanji: "目標", romaji: "mokuhyou", meaningEn: "a goal, a target", shortGloss: "goal", emoji: "🎯", fromModule: "m34", kind: "vocab", note: "bullseye — honest per なか's own blocked note: 🎯 reads 'target/goal', not 'middle'", pos: "noun" },
  { id: "chokin", kana: "ちょきん", kanji: "貯金", romaji: "chokin", meaningEn: "savings, saving money", shortGloss: "savings", fromModule: "m34", kind: "vocab", blocked: true, note: "blocked: 💰 already belongs to おかね, and a pile of coins can't distinguish 'savings' from money itself", pos: "noun" },
  { id: "yameru", kana: "やめる", kanji: "止める", romaji: "yameru", meaningEn: "to quit, to stop doing", shortGloss: "quit", fromModule: "m34", kind: "vocab", blocked: true, note: "abstract cessation has no honest picture — a stop sign is already とめる's/とまる's (m32/m33)", pos: "verb", conjugation: { class: "ichidan" } },
  { id: "ganbaru", kana: "がんばる", kanji: "頑張る", romaji: "ganbaru", meaningEn: "to do one's best, to keep at it", shortGloss: "do one's best", fromModule: "m34", kind: "vocab", blocked: true, note: "blocked: 💪 reads 'strong', not 'keep at it' — the effort is the whole meaning and no still image shows it", pos: "verb", conjugation: { class: "godan" } },

  // ── m35 (spine n4-06) — GIVE & RECEIVE II: the favor-request ladder ──────
  // てつだう/はこぶ/なおす/こまる re-stamped above (all were future-stamped
  // or old-course-tagged already, the sagasu/m34 precedent); the four rows
  // below are genuinely new. たすかる/おねがい/むかえ are all blocked — states
  // and abstract requests, no picture names any of them honestly, per the
  // IR's own newAtoms comment. しか follows the や/より particle-row
  // precedent exactly (blocked, no image MCQ, particle kind/pos).
  //
  // だけ is DELIBERATELY NOT REGISTERED HERE — verified 2026-08-25 by
  // dumping every compiled build_sentence tile course-wide before and after
  // a trial registration (the m16-ので class check this file's own header
  // describes). だ (the plain copula, m6) is a 1-char atom; けど (m16's
  // "but" conjunction) is a 2-char atom; unspaced な/noun+だ+けど
  // constructions (「ゆきだけど」, 「しずかだけど」, …) are shipped, unspaced,
  // in NINE modules (m16, m17, m19, m20, m21, m22, m23, m24, m25, m26, m27,
  // m28). Registering だけ as a 2-char global atom makes moduleCompiler's
  // course-wide longest-match tokenizer prefer it at every one of those
  // だ+けど boundaries (2 chars beats だ's 1), shattering the shipped tiles
  // into a bogus だけ／ど split — confirmed by re-running the full curriculum
  // suite: `fromModuleDrift.test.ts` flagged だけ "exercised at m16" and a
  // course-wide tile dump showed the ど orphan tile in ~30 already-shipped
  // build_sentence/listening_build steps across those nine modules. None of
  // those modules' IR is in this landing's scope to fix, and there is no
  // per-module tokenizer opt-out available from `courseAtoms.ts` alone — so
  // the only safe move is the SAME escape hatch `fromModuleDrift.test.ts`
  // already documents for other short grammatical atoms: leave it
  // unregistered here (IR-only). m35's own tokenizer sees だけ fine via its
  // OWN `ir.newAtoms` declaration (`atomIndex()` in moduleCompiler.ts layers
  // `ir.newAtoms` over the global registry per-module), so m35's lessons
  // compile and tile correctly either way; だけ simply never becomes a
  // flashcard/SRS atom. Flagged for Spencer — see the session report.
  { id: "tasukaru", kana: "たすかる", kanji: "助かる", romaji: "tasukaru", meaningEn: "to be saved, to be a big help (it saves me)", shortGloss: "be a help", fromModule: "m35", introducedByLessonId: "ja-m35-neo-9", kind: "vocab", blocked: true, note: "state verb, no picture names honestly — こまる's mirror (m35 IR)", pos: "verb", conjugation: { class: "godan" } },
  { id: "onegai", kana: "おねがい", romaji: "onegai", meaningEn: "a favor, a request", shortGloss: "favor", fromModule: "m35", introducedByLessonId: "ja-m35-neo-5", kind: "vocab", blocked: true, note: "abstract — a favor/request has no honest referent; 🙏 reads 'pray/thanks', not 'a request'", pos: "noun" },
  { id: "mukae", kana: "むかえ", romaji: "mukae", meaningEn: "a pick-up — going to meet someone (むかえに いく)", shortGloss: "pick-up", fromModule: "m35", introducedByLessonId: "ja-m35-neo-9", kind: "vocab", blocked: true, note: "abstract — 'going to meet someone' collapses into あう's 🤝 with nothing left to distinguish 'pick-up' from 'meeting'", pos: "noun" },
  { id: "p-shika", kana: "しか", romaji: "shika", meaningEn: "only (with a negative — counts what is missing)", shortGloss: "only (+neg)", fromModule: "m35", introducedByLessonId: "ja-m35-neo-7", kind: "particle", blocked: true, note: "limiting particle — REQUIRES a negative verb; counts what's missing, and REPLACES が/を outright (no がしか, no をしか)", pos: "particle" },

  // m36 (n4-07, "looks like") new atoms. All 14 lemma newAtoms register here;
  // the attachment-site forms (おいしそう, ふりそう, いきたがっている,
  // つかいやすい, ききながら, たべすぎた, …) stay IR-only per DERIVED_KINDS —
  // registering them would put an inflection in the flashcard deck. All four
  // atoms the m36 IR originally marked `imageable: true` (かなしい, こわい,
  // ねむい, きけん) were checked at this wiring stage and every one failed:
  // 😢(u1f622)/😱(u1f631)/😪(u1f62a) have no vendored SVG in
  // src/pub/noto-emoji/svg/, and ⚠️(u26a0) IS vendored but already belongs to
  // あぶない for the identical sense "dangerous" (a MET-word glyph collision).
  // All four IR entries were flipped to `imageable: false` and m36 recompiled
  // (node scripts/compile-ir.mjs m36) — the one-field flip this gate permits.
  { id: "kanashii", kana: "かなしい", kanji: "悲しい", romaji: "kanashii", meaningEn: "sad", shortGloss: "sad", fromModule: "m36", introducedByLessonId: "ja-m36-neo-9", kind: "vocab", blocked: true, note: "blocked: 😢 (u1f622) has no vendored SVG in src/pub/noto-emoji/svg/ — no honest image without vendoring a new asset at this wiring stage; IR flipped imageable:false (m36 IR)", pos: "adjective", conjugation: { class: "i-adj" } },
  { id: "sabishii", kana: "さびしい", kanji: "寂しい", romaji: "sabishii", meaningEn: "lonely", shortGloss: "lonely", fromModule: "m36", introducedByLessonId: "ja-m36-neo-9", kind: "vocab", blocked: true, note: "abstract feeling adjective — IR marks imageable:false, no honest picture", pos: "adjective", conjugation: { class: "i-adj" } },
  { id: "yawarakai", kana: "やわらかい", kanji: "柔らかい", romaji: "yawarakai", meaningEn: "soft, tender", shortGloss: "soft", fromModule: "m36", introducedByLessonId: "ja-m36-neo-1", kind: "vocab", blocked: true, note: "food-texture adjective — IR marks imageable:false, no honest single-frame picture", pos: "adjective", conjugation: { class: "i-adj" } },
  { id: "katai", kana: "かたい", kanji: "硬い", romaji: "katai", meaningEn: "hard, tough (to bite or bend)", shortGloss: "hard", fromModule: "m36", introducedByLessonId: "ja-m36-neo-1", kind: "vocab", blocked: true, note: "food-texture adjective — IR marks imageable:false, no honest single-frame picture", pos: "adjective", conjugation: { class: "i-adj" } },
  { id: "kowai", kana: "こわい", kanji: "怖い", romaji: "kowai", meaningEn: "scary, frightening", shortGloss: "scary", fromModule: "m36", introducedByLessonId: "ja-m36-neo-9", kind: "vocab", blocked: true, note: "blocked: 😱 (u1f631) has no vendored SVG in src/pub/noto-emoji/svg/; IR flipped imageable:false (m36 IR)", pos: "adjective", conjugation: { class: "i-adj" } },
  { id: "hazukashii", kana: "はずかしい", kanji: "恥ずかしい", romaji: "hazukashii", meaningEn: "embarrassing, embarrassed", shortGloss: "embarrassing", fromModule: "m36", introducedByLessonId: "ja-m36-neo-9", kind: "vocab", blocked: true, note: "abstract feeling adjective — IR marks imageable:false, no honest picture", pos: "adjective", conjugation: { class: "i-adj" } },
  { id: "nemui", kana: "ねむい", kanji: "眠い", romaji: "nemui", meaningEn: "sleepy", shortGloss: "sleepy", fromModule: "m36", introducedByLessonId: "ja-m36-neo-9", kind: "vocab", blocked: true, note: "blocked: 😪 (u1f62a) has no vendored SVG in src/pub/noto-emoji/svg/; IR flipped imageable:false (m36 IR)", pos: "adjective", conjugation: { class: "i-adj" } },
  { id: "futoru", kana: "ふとる", kanji: "太る", romaji: "futoru", meaningEn: "to put on weight", shortGloss: "put on weight", fromModule: "m36", introducedByLessonId: "ja-m36-neo-5", kind: "vocab", blocked: true, note: "state-change verb — IR marks imageable:false, no honest single-frame picture distinguishing it from やせる", pos: "verb", conjugation: { class: "godan" } },
  { id: "yaseru", kana: "やせる", kanji: "痩せる", romaji: "yaseru", meaningEn: "to lose weight, to get thin", shortGloss: "lose weight", fromModule: "m36", introducedByLessonId: "ja-m36-neo-5", kind: "vocab", blocked: true, note: "state-change verb — IR marks imageable:false, no honest single-frame picture distinguishing it from ふとる", pos: "verb", conjugation: { class: "ichidan" } },
  { id: "anzen", kana: "あんぜん", kanji: "安全", romaji: "anzen", meaningEn: "safe, safety", shortGloss: "safe", fromModule: "m36", introducedByLessonId: "ja-m36-neo-10", kind: "vocab", blocked: true, note: "abstract safety judgment — IR marks imageable:false, no honest picture", pos: "adjective", conjugation: { class: "na-adj" } },
  { id: "kiken", kana: "きけん", kanji: "危険", romaji: "kiken", meaningEn: "dangerous, danger", shortGloss: "dangerous", fromModule: "m36", introducedByLessonId: "ja-m36-neo-10", kind: "vocab", blocked: true, note: "blocked: ⚠️ (u26a0) is already あぶない's glyph for the same meaning 'dangerous' — a MET-word glyph collision; IR flipped imageable:false (m36 IR)", pos: "adjective", conjugation: { class: "na-adj" } },
  { id: "fuben", kana: "ふべん", kanji: "不便", romaji: "fuben", meaningEn: "inconvenient", shortGloss: "inconvenient", fromModule: "m36", introducedByLessonId: "ja-m36-neo-6", kind: "vocab", blocked: true, note: "abstract quality na-adjective — IR marks imageable:false, no honest picture", pos: "adjective", conjugation: { class: "na-adj", entryId: "fubeni" } },

  // ── m37 (n4-08, "Conditionals II: ば + なら") — none of these six atoms had
  // a prior/future-stamped row (checked before authoring). まにあう and
  // おくれる have NO conjugationTables.ts entry either, so both register
  // without an entryId, same as futoru/yaseru above. All blocked: abstract
  // nouns, a function-word particle, and verbs with no honest single-frame
  // picture. Per DERIVED_KINDS none of the IR's verb-form/adj-form ledger
  // atoms (いけば, たべれば, よければ, いくなら, だったら, かったら, …) are
  // registered here — they stay IR-only, exactly like every prior module's
  // conjugated forms.
  { id: "hitsuyou", kana: "ひつよう", kanji: "必要", romaji: "hitsuyou", meaningEn: "necessary, needed", shortGloss: "necessary", fromModule: "m37", introducedByLessonId: "ja-m37-neo-6", kind: "vocab", blocked: true, note: "abstract na-adjective judgment — no honest picture for 'necessary'", pos: "adjective", conjugation: { class: "na-adj" } },
  { id: "tsugou", kana: "つごう", kanji: "都合", romaji: "tsugou", meaningEn: "convenience — how one's schedule sits", shortGloss: "schedule fit", fromModule: "m37", introducedByLessonId: "ja-m37-neo-6", kind: "vocab", blocked: true, note: "abstract noun — no honest picture for 'how a schedule sits'", pos: "noun" },
  { id: "maniau", kana: "まにあう", romaji: "maniau", meaningEn: "to be in time, to make it", shortGloss: "make it in time", fromModule: "m37", introducedByLessonId: "ja-m37-neo-1", kind: "vocab", blocked: true, note: "abstract timing verb — no honest single-frame picture distinguishing 'made it' from any other arrival", pos: "verb", conjugation: { class: "godan" } },
  { id: "okureru", kana: "おくれる", romaji: "okureru", meaningEn: "to be late, to fall behind", shortGloss: "be late", fromModule: "m37", introducedByLessonId: "ja-m37-neo-9", kind: "vocab", blocked: true, note: "abstract timing verb — no honest single-frame picture, and a clock face is already generic apparatus", pos: "verb", conjugation: { class: "ichidan" } },
  { id: "p-hodo", kana: "ほど", romaji: "hodo", meaningEn: "to the degree that (extent)", shortGloss: "to the degree", fromModule: "m37", introducedByLessonId: "ja-m37-neo-9", kind: "particle", blocked: true, note: "extent particle — follows the や/しか particle-row precedent, no image MCQ for function words", pos: "particle" },
  { id: "p-nara", kana: "なら", romaji: "nara", meaningEn: "if it's (that) we're talking about — topic conditional", shortGloss: "if it's ~", fromModule: "m37", introducedByLessonId: "ja-m37-neo-6", kind: "particle", blocked: true, note: "checked against the だけ landmine class before registering: なら (2 chars) risks shattering the ならう-family surfaces (ならう/ならって/ならってみる/ならっておく, m30 + m32 review) under the course-wide longest-match tokenizer. Verified SAFE by a course-wide tile dump (m6-m37, 5802 lines) before/after this registration — byte-identical, zero diff. ならう (3 chars, globally registered) and ならって (5 chars, m30's own IR-local newAtom) both sort ahead of なら in the length-descending vocab list, so longest-match finds them first at every occurrence; なら never gets a chance to intercept. Follows the や/しか particle-row precedent.", pos: "particle" },

  // ── m38 (n4-09, "て + helper II: 〜てしまう/ちゃう + 〜ていく/〜てくる") ──
  // Nine new lemma rows (checked: none had a prior/future-stamped row before
  // this landing — grepped individually). なくす/ぜんぶ/かんじ were already
  // future-stamped rows re-pointed above instead of duplicated here. All nine
  // blocked: change-of-state and abstract verbs with no honest single-frame
  // picture (the m33 jidoushi-tadoushi doctrine's own ruling — こわす/こわれる
  // is that exact pair, taught late on purpose). None has a conjugationTables
  // VERB_ENTRIES row, so all register class-only, no entryId — same as
  // m37's まにあう/おくれる and m36's futoru/yaseru above. Per DERIVED_KINDS
  // none of the IR's helper/contraction ledger atoms (なくしてしまった,
  // たべちゃった, もっていく, なれてきた, くれて, あった, …) are registered
  // here — they stay IR-only, same as every prior module's conjugated forms.
  { id: "kowasu", kana: "こわす", kanji: "壊す", romaji: "kowasu", meaningEn: "to break (something)", shortGloss: "break (it)", fromModule: "m38", introducedByLessonId: "ja-m38-neo-2", kind: "vocab", blocked: true, note: "transitivity pair with こわれる (m33 doctrine, taught late on purpose) — no honest single-frame picture distinguishing 'I broke it' from 'it broke'", pos: "verb", conjugation: { class: "godan" } },
  { id: "kowareru", kana: "こわれる", kanji: "壊れる", romaji: "kowareru", meaningEn: "to break (of itself)", shortGloss: "break (it does)", fromModule: "m38", introducedByLessonId: "ja-m38-neo-2", kind: "vocab", blocked: true, note: "transitivity pair with こわす — no honest single-frame picture distinguishing 'it broke' from 'I broke it'", pos: "verb", conjugation: { class: "ichidan" } },
  { id: "fueru", kana: "ふえる", kanji: "増える", romaji: "fueru", meaningEn: "to increase (of itself)", shortGloss: "increase", fromModule: "m38", introducedByLessonId: "ja-m38-neo-7", kind: "vocab", blocked: true, note: "abstract change-of-state verb (trajectory-in-time set with へる/かわる) — no honest single frame distinguishes 'increasing' from any other still image", pos: "verb", conjugation: { class: "ichidan" } },
  { id: "heru", kana: "へる", kanji: "減る", romaji: "heru", meaningEn: "to decrease (of itself)", shortGloss: "decrease", fromModule: "m38", introducedByLessonId: "ja-m38-neo-7", kind: "vocab", blocked: true, note: "abstract change-of-state verb, ふえる's pair — no honest single-frame picture", pos: "verb", conjugation: { class: "godan" } },
  { id: "kawaru", kana: "かわる", kanji: "変わる", romaji: "kawaru", meaningEn: "to change (of itself)", shortGloss: "change", fromModule: "m38", introducedByLessonId: "ja-m38-neo-7", kind: "vocab", blocked: true, note: "abstract change-of-state verb — no honest single-frame picture; checked against the かえる \"go home\" homograph collision risk the IR flagged (m38.ir.yaml notes) — かわる's own conjugated forms (かわった, かわっていく) don't collide with かえる's (かえった, かえって) under the course-wide longest-match tokenizer, verified by grep over the compiled m38 surfaces", pos: "verb", conjugation: { class: "godan" } },
  { id: "nareru", kana: "なれる", kanji: "慣れる", romaji: "nareru", meaningEn: "to get used to", shortGloss: "get used to", fromModule: "m38", introducedByLessonId: "ja-m38-neo-9", kind: "vocab", blocked: true, note: "abstract adaptation verb — no honest single-frame picture for 'getting used to' something", pos: "verb", conjugation: { class: "ichidan" } },
  { id: "machigaeru", kana: "まちがえる", kanji: "間違える", romaji: "machigaeru", meaningEn: "to get (something) wrong", shortGloss: "get wrong", fromModule: "m38", introducedByLessonId: "ja-m38-neo-9", kind: "vocab", blocked: true, note: "abstract error verb — no honest single-frame picture for 'getting it wrong'", pos: "verb", conjugation: { class: "ichidan" } },
  { id: "modoru", kana: "もどる", kanji: "戻る", romaji: "modoru", meaningEn: "to go back, to return (to a place)", shortGloss: "go back", fromModule: "m38", introducedByLessonId: "ja-m38-neo-6", kind: "vocab", blocked: true, note: "motion-return verb — blocked alongside the trajectory set (もっていく/もってくる/つれる) rather than singled out; no picture distinguishes 'going back' from any other departure/arrival glyph already owned by いく/くる", pos: "verb", conjugation: { class: "godan" } },
  { id: "tsureru", kana: "つれる", kanji: "連れる", romaji: "tsureru", meaningEn: "to take (someone) along", shortGloss: "take along", fromModule: "m38", introducedByLessonId: "ja-m38-neo-6", kind: "vocab", blocked: true, note: "deferred from m35 for this module's trajectory frame (m38.ir.yaml notes) — no honest single-frame picture distinguishes つれる 'take a person' from もつ 'carry a thing'", pos: "verb", conjugation: { class: "ichidan" } },

];
/**
 * Which atom a BARE KANA means when several share it.
 *
 * 17 kana are ambiguous, and two different maps were resolving them two
 * different ways: `new Map(entries)` here is LAST-wins, while the compiler's
 * `atomIndex` is FIRST-wins. So a はな sentence displayed "flower" (compiler)
 * while crediting SRS to 鼻 "nose" (this map) — the gloss looked right and the
 * scheduling was wrong, which is why it survived m12 QA of the visible text.
 *
 * Declaration order is arbitrary, so neither first- nor last-wins is
 * defensible; the sense has to be chosen. These are the readings a beginner
 * course means by default — particles over their numeral/noun homophones, and
 * the more basic vocabulary item otherwise. A module that needs the other
 * sense must reference it by id, not by kana.
 *
 * `homophoneAtomResolution.test.ts` fails if a new collision appears without a
 * ruling here, or if the two maps ever disagree again.
 */
export const JA_PRIMARY_ATOM_BY_KANA: Readonly<Record<string, string>> = {
  は: "p-wa", // topic particle, not 歯 "tooth"
  に: "p-ni", // particle, not 二 "two"
  と: "p-to", // particle, not 戸 "door"
  はな: "hana", // 花 flower, not 鼻 nose
  かぜ: "kaze-wind", // 風 wind, not 風邪 a cold
  あめ: "ame", // 雨 rain, not 飴 candy
  はし: "hashi", // 箸 chopsticks, not 橋 bridge
  はる: "haru", // 春 spring, not 貼る to stick
  あつい: "atsui", // 暑い hot, not 厚い thick
  はやい: "hayai-early", // 早い early — the course teaches clock time first
  ふく: "fuku-clothes", // 服 clothes, not 吹く to blow
  きる: "kiru", // 着る to wear, not 切る to cut
  いる: "iru-be", // to exist, not 要る to need
  ひく: "hiku", // 引く to pull, not 弾く to play (strings)
  // R16 teach-them wave (2026-09-02): FLIPPED to 撮る. The only live use of
  // bare とる in the course is m30 L7/L9 photography (「しゃしんを とってみる」);
  // 取る is a `future` word no lesson exercises, so the old ruling credited
  // every photo to an atom the learner never meets. Tile diff before/after: empty.
  とる: "toru-take", // 撮る to photograph — 取る (toru) is unused by any lesson
  しめる: "shimeru", // 閉める to close, not 締める to tie
};

/**
 * Indexed by kana for fast lookup from lesson step commits. Ambiguous kana
 * resolve through JA_PRIMARY_ATOM_BY_KANA; everything else is first-wins, so
 * the map is order-stable rather than silently last-write-wins.
 */
export const JA_COURSE_ATOMS_BY_KANA: ReadonlyMap<string, CourseAtom> = (() => {
  const byId = new Map(JA_COURSE_ATOMS.map((a) => [a.id, a]));
  const out = new Map<string, CourseAtom>();
  for (const a of JA_COURSE_ATOMS) {
    const ruled = JA_PRIMARY_ATOM_BY_KANA[a.kana];
    if (ruled) {
      const primary = byId.get(ruled);
      if (primary) out.set(a.kana, primary);
      continue;
    }
    if (!out.has(a.kana)) out.set(a.kana, a);
  }
  return out;
})();

/** Indexed by id for the SRS / unlock layer. */
export const JA_COURSE_ATOMS_BY_ID: ReadonlyMap<string, CourseAtom> = new Map(
  JA_COURSE_ATOMS.map((a) => [a.id, a]),
);

/**
 * Adapt a CourseAtom to the existing Flashcard shape used by DecksApi /
 * the SRS engine. Keeps consumers unchanged until the migration lands.
 *
 * `front`: kanji if available, else kana (e.g. "毎朝"); the kana reading
 *          moves to `reading.kana` instead of being baked into `front`.
 * `back`:  English meaning.
 */
/** Canonical SRS/card id for an atom (`ja:biiru`). Matches the key scheme
 *  used by the SRS store and the unlock store (ADR-005), so a generated
 *  card, its FSRS state, and its unlock flag all share one id. */
export function canonicalAtomId(atom: CourseAtom): string {
  return atom.id.includes(":") ? atom.id : `ja:${atom.id}`;
}

export function courseAtomToFlashcard(
  atom: CourseAtom,
  // `image` is passed in (not derived here) so this module needn't import
  // notoEmoji — that would create a courseAtoms→notoEmoji→courseAtomsFor
  // init cycle. The deck-enrichment layer resolves the emoji URL.
  opts?: { unlocked?: boolean; example?: Example; image?: string },
): Flashcard {
  const front = atom.kanji ?? atom.kana;
  const reading = atom.kanji
    ? { surface: atom.kanji, kana: atom.kana }
    : undefined;
  return {
    id: canonicalAtomId(atom),
    front,
    reading,
    back: atom.meaningEn,
    note: atom.note,
    type: "word",
    image: opts?.image,
    examples: opts?.example ? [opts.example] : undefined,
    unlocked: opts?.unlocked,
    parts: undefined,
  };
}

/**
 * Predicate: should this atom enter the flashcards SRS pool?
 *
 * Excludes:
 *  - Atoms explicitly tagged `excludeFromSrs: true` (alphabet-trainer
 *    territory — single-kana standalone-word atoms).
 *  - Implicit single-kana vocab atoms without an emoji carrier: when an
 *    atom is one character long, has no emoji, and is not a particle,
 *    it's almost certainly an alphabet-trainer atom that snuck into the
 *    registry. Treat the same as `excludeFromSrs: true`.
 *
 * Includes:
 *  - All particles (single-kana but grammatically essential — taught via
 *    cloze, mastery is real).
 *  - Single-kana vocab atoms WITH an emoji carrier (numerals に / ご etc.
 *    — emoji disambiguates the meaning).
 *  - All multi-kana vocab.
 */
export function isSrsEligibleAtom(atom: CourseAtom): boolean {
  if (atom.excludeFromSrs === true) return false;
  if (atom.kind === "particle") return true;
  const kanaLength = Array.from(atom.kana).length;
  if (kanaLength === 1 && !atom.emoji) return false;
  return true;
}

/**
 * Build the course-wide JA flashcard deck.
 *
 * `unlockedIds`: if provided, only atoms with ids in the set are marked
 * unlocked. Omit to leave `unlocked` undefined (engine treats as locked
 * for course decks).
 *
 * Filters out atoms ineligible for SRS (see `isSrsEligibleAtom`) — these
 * are alphabet-trainer atoms whose practice surface is the Practice page,
 * not the vocab flashcards deck.
 */
export function buildJaCourseDeck(opts?: {
  /** Canonical (`ja:`-prefixed) unlocked ids, from the unlock store. */
  unlockedIds?: ReadonlySet<string>;
  /** Optional per-atom mined example sentence, keyed by canonical id. */
  examplesByCardId?: ReadonlyMap<string, Example>;
  /** Optional per-atom card image URL, keyed by canonical id. */
  imagesByCardId?: ReadonlyMap<string, string>;
}): FlashcardDeck {
  const cards: Flashcard[] = JA_COURSE_ATOMS.filter(isSrsEligibleAtom).map(
    (atom) => {
      const cardId = canonicalAtomId(atom);
      return courseAtomToFlashcard(atom, {
        unlocked: opts?.unlockedIds ? opts.unlockedIds.has(cardId) : undefined,
        example: opts?.examplesByCardId?.get(cardId),
        image: opts?.imagesByCardId?.get(cardId),
      });
    },
  );
  return {
    id: "ja-course",
    languageId: "ja",
    name: "Japanese — full course",
    cards,
    courseId: "mock-1",
    locale: "en",
  };
}
