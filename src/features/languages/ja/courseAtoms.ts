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
 * IDs are stable forever once shipped. To add a word: append a new
 * CourseAtom entry — do NOT renumber.
 */
import type { Flashcard, FlashcardDeck, Example } from "@/features/flashcards/data/types";

export type CourseAtomKind = "vocab" | "particle" | "phrase";

export type CourseAtomSource =
  | "m1" | "m2" | "m3" | "m4" | "m5" | "m6" | "m7"
  | "m8" | "m9" | "m10" | "m11" | "m12" | "m13" | "m14" | "m15" | "m16" | "m17"
  | "m18" | "m19" | "m20" | "m21" | "m22" | "m23" | "m24" | "m25" | "m26" | "m27"
  | "m28" | "m29" | "m30"
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
  /** Lesson ID where this atom is first introduced (best-effort; null for "future"). */
  introducedByLessonId?: string;
  /** Atom kind. */
  kind: CourseAtomKind;
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
  { id: "ai", kana: "あい", romaji: "ai", meaningEn: "love", fromModule: "m1", introducedByLessonId: "ja-m1-l1", kind: "vocab" },
  { id: "iie", kana: "いいえ", romaji: "iie", meaningEn: "no", fromModule: "m1", introducedByLessonId: "ja-m1-l1", kind: "vocab", blocked: true, note: "interjection/function word" },
  { id: "uma", kana: "うま", kanji: "馬", romaji: "uma", meaningEn: "horse", fromModule: "m1", introducedByLessonId: "ja-m1-l7-ma", kind: "vocab" },
  { id: "kai", kana: "かい", romaji: "kai", meaningEn: "shell", emoji: "🐚", fromModule: "m1", kind: "vocab" },
  { id: "kao", kana: "かお", kanji: "顔", romaji: "kao", meaningEn: "face", emoji: "😀", fromModule: "m1", kind: "vocab" },
  { id: "kame", kana: "かめ", romaji: "kame", meaningEn: "turtle", fromModule: "m1", introducedByLessonId: "ja-m1-l7-ma", kind: "vocab" },
  { id: "kinoko", kana: "きのこ", romaji: "kinoko", meaningEn: "mushroom", fromModule: "m1", introducedByLessonId: "ja-m1-l5-na", kind: "vocab" },
  { id: "sakura", kana: "さくら", kanji: "桜", romaji: "sakura", meaningEn: "cherry blossom", fromModule: "m1", introducedByLessonId: "ja-m1-l9-ra", kind: "vocab" },
  { id: "tsuki", kana: "つき", kanji: "月", romaji: "tsuki", meaningEn: "moon", emoji: "🌙", fromModule: "m1", kind: "vocab" },
  { id: "fune", kana: "ふね", kanji: "船", romaji: "fune", meaningEn: "boat", emoji: "🚢", fromModule: "m1", kind: "vocab" },
  { id: "hoshi", kana: "ほし", kanji: "星", romaji: "hoshi", meaningEn: "star", emoji: "⭐", fromModule: "m1", kind: "vocab" },
  { id: "momo", kana: "もも", kanji: "桃", romaji: "momo", meaningEn: "peach", emoji: "🍑", fromModule: "m1", kind: "vocab" },
  { id: "ue", kana: "うえ", kanji: "上", romaji: "ue", meaningEn: "on top of", emoji: "⬆️", fromModule: "m1", introducedByLessonId: "ja-m1-l1", kind: "vocab", note: "up arrow as 'on top of' cue" },
  { id: "hito", kana: "ひと", kanji: "人", romaji: "hito", meaningEn: "person", emoji: "🧑", fromModule: "m1", introducedByLessonId: "ja-m1-l6-ha", kind: "vocab", note: "gender-neutral person" },
  { id: "nani", kana: "なに", kanji: "何", romaji: "nani", meaningEn: "what", emoji: "❓", fromModule: "m1", introducedByLessonId: "ja-m1-l5-na", kind: "vocab", blocked: true, note: "interrogative — abstract grammar" },
  { id: "koe", kana: "こえ", kanji: "声", romaji: "koe", meaningEn: "voice", emoji: "🗣️", fromModule: "m1", introducedByLessonId: "ja-m1-l2-ka", kind: "vocab", note: "speaking head" },
  { id: "ie", kana: "いえ", kanji: "家", romaji: "ie", meaningEn: "house", emoji: "🏠", fromModule: "m1", introducedByLessonId: "ja-m1-l1", kind: "vocab" },
  { id: "yama", kana: "やま", kanji: "山", romaji: "yama", meaningEn: "mountain", emoji: "⛰️", fromModule: "m1", introducedByLessonId: "ja-m1-l8-ya", kind: "vocab" },
  { id: "kawa", kana: "かわ", kanji: "川 / 河", romaji: "kawa", meaningEn: "river", emoji: "🏞️", fromModule: "m1", introducedByLessonId: "ja-m1-l10-wa", kind: "vocab" },
  { id: "asa", kana: "あさ", kanji: "朝", romaji: "asa", meaningEn: "morning", emoji: "🌅", fromModule: "m1", introducedByLessonId: "ja-m1-l3-sa", kind: "vocab" },
  { id: "uta", kana: "うた", kanji: "歌", romaji: "uta", meaningEn: "song", emoji: "🎤", fromModule: "m1", introducedByLessonId: "ja-m1-l4-ta", kind: "vocab", note: "microphone as song cue (music note taken)" },
  { id: "ike", kana: "いけ", kanji: "池", romaji: "ike", meaningEn: "pond", emoji: "🦆", fromModule: "m1", introducedByLessonId: "ja-m1-l2-ka", kind: "vocab", note: "duck implies pond" },
  { id: "umi", kana: "うみ", kanji: "海", romaji: "umi", meaningEn: "sea", emoji: "🌊", fromModule: "m1", kind: "vocab", note: "wave" },
  { id: "inu", kana: "いぬ", kanji: "犬", romaji: "inu", meaningEn: "dog", emoji: "🐕", fromModule: "m1", introducedByLessonId: "ja-m3-3", kind: "vocab" },
  { id: "neko", kana: "ねこ", kanji: "猫", romaji: "neko", meaningEn: "cat", emoji: "🐱", fromModule: "m1", introducedByLessonId: "ja-m3-3", kind: "vocab" },
  { id: "sora", kana: "そら", kanji: "空", romaji: "sora", meaningEn: "sky", emoji: "☁️", fromModule: "m1", introducedByLessonId: "ja-m1-l3-sa", kind: "vocab", note: "cloud as sky proxy" },
  { id: "iro", kana: "いろ", kanji: "色", romaji: "iro", meaningEn: "colour", emoji: "🎨", fromModule: "m1", introducedByLessonId: "ja-m1-l9-ra", kind: "vocab", note: "palette = colour" },
  { id: "hana", kana: "はな", kanji: "花", romaji: "hana", meaningEn: "flower", emoji: "🌸", fromModule: "m1", kind: "vocab" },
  { id: "yuki", kana: "ゆき", kanji: "雪", romaji: "yuki", meaningEn: "snow", emoji: "❄️", fromModule: "m1", introducedByLessonId: "ja-m1-l8-ya", kind: "vocab" },
  { id: "aoi", kana: "あおい", kanji: "青い", romaji: "aoi", meaningEn: "blue", emoji: "🟦", fromModule: "m1", introducedByLessonId: "ja-m1-l1", kind: "vocab" },
  { id: "hana-nose", kana: "はな", kanji: "鼻", romaji: "hana", meaningEn: "nose", emoji: "👃", fromModule: "m1", kind: "vocab" },
  { id: "ebi", kana: "えび", romaji: "ebi", meaningEn: "shrimp", fromModule: "m2", introducedByLessonId: "ja-m2-b", kind: "vocab" },
  { id: "kagi", kana: "かぎ", romaji: "kagi", meaningEn: "key", emoji: "🔑", fromModule: "m2", introducedByLessonId: "ja-m2-g", kind: "vocab" },
  { id: "kyuuri", kana: "きゅうり", romaji: "kyuuri", meaningEn: "cucumber", fromModule: "m2", introducedByLessonId: "ja-m2-yoon-intro", kind: "vocab" },
  { id: "sanpo", kana: "さんぽ", kanji: "散歩", romaji: "sanpo", meaningEn: "walk/stroll", emoji: "🚶", fromModule: "m2", kind: "vocab" },
  { id: "zou", kana: "ぞう", kanji: "象", romaji: "zou", meaningEn: "elephant", fromModule: "m2", introducedByLessonId: "ja-m2-z", kind: "vocab" },
  { id: "doa-door", kana: "どあ", romaji: "doa", meaningEn: "door", fromModule: "m2", introducedByLessonId: "ja-m2-d", kind: "vocab", kanaDrillOnly: true, note: "ど-drill spelling only — the word is ドア (atom `doa`)." },
  { id: "pan", kana: "ぱん", romaji: "pan", meaningEn: "bread", fromModule: "m2", introducedByLessonId: "ja-m2-p", kind: "vocab", kanaDrillOnly: true, note: "ぱ-drill spelling only — the word is パン (atom `ja-m7-4-v-pan`)." },
  { id: "piano", kana: "ぴあの", romaji: "piano", meaningEn: "piano", fromModule: "m2", introducedByLessonId: "ja-m2-p", kind: "vocab", kanaDrillOnly: true, note: "ぴ-drill spelling only — the word is ピアノ (no atom yet)." },
  { id: "buta", kana: "ぶた", kanji: "豚", romaji: "buta", meaningEn: "pig", fromModule: "m2", introducedByLessonId: "ja-m2-b", kind: "vocab" },
  { id: "purin", kana: "ぷりん", romaji: "purin", meaningEn: "pudding", fromModule: "m2", introducedByLessonId: "ja-m2-p", kind: "vocab" },
  { id: "pen", kana: "ぺん", romaji: "pen", meaningEn: "pen", fromModule: "m2", introducedByLessonId: "ja-m2-p", kind: "vocab", kanaDrillOnly: true, note: "ぺ-drill spelling only — the word is ペン (atom `ja-m4-1-v-pen`)." },
  { id: "tiishatsu", kana: "ティーシャツ", romaji: "tiishatsu", meaningEn: "T-shirt", emoji: "👕", fromModule: "future", kind: "vocab", note: "Extension katakana (ティ) — never base-readable in the M3-M12 gojūon rollout; accept-romaji only. Moved off the mis-early m2 (kana module, pre-katakana) 2026-07-01 per katakana-rollout spec §4.2." },
  { id: "paatii", kana: "パーティー", romaji: "paatii", meaningEn: "party", emoji: "🎉", fromModule: "m23", introducedByLessonId: "ja-m23-2-2", kind: "vocab", note: "Extension katakana (ティ) — never base-readable in the M3-M12 gojūon rollout; accept-romaji only. Moved off the mis-early m2 2026-07-01 per katakana-rollout spec §4.2, to m23 where ja-m23-2-2 formally introduces it (ましょう invitations)." },
  { id: "kyou", kana: "きょう", kanji: "今日", romaji: "kyou", meaningEn: "today", emoji: "📅", fromModule: "m2", introducedByLessonId: "ja-m2-yoon-intro", kind: "vocab", note: "calendar as today cue" },
  { id: "karada", kana: "からだ", kanji: "体", romaji: "karada", meaningEn: "body", emoji: "🧍", fromModule: "m2", introducedByLessonId: "ja-m2-d", kind: "vocab" },
  { id: "genki", kana: "げんき", kanji: "元気", romaji: "genki", meaningEn: "health, vitality", emoji: "💪", fromModule: "m2", introducedByLessonId: "ja-m2-g", kind: "vocab", note: "flexed bicep as vitality cue" },
  { id: "shashin", kana: "しゃしん", kanji: "写真", romaji: "shashin", meaningEn: "photograph", emoji: "📷", fromModule: "m2", introducedByLessonId: "ja-m2-yoon-sh-ch", kind: "vocab" },
  { id: "kippu", kana: "きっぷ", kanji: "切符", romaji: "kippu", meaningEn: "ticket", emoji: "🎫", fromModule: "m2", kind: "vocab" },
  { id: "kazoku", kana: "かぞく", kanji: "家族", romaji: "kazoku", meaningEn: "family", emoji: "👨‍👩‍👧", fromModule: "m2", kind: "vocab", note: "ZWJ family — renders in Noto" },
  { id: "boushi", kana: "ぼうし", kanji: "帽子", romaji: "boushi", meaningEn: "hat", emoji: "🎩", fromModule: "m2", introducedByLessonId: "ja-m2-b", kind: "vocab" },
  { id: "ryouri", kana: "りょうり", kanji: "料理", romaji: "ryouri", meaningEn: "cuisine", emoji: "🍱", fromModule: "m2", introducedByLessonId: "ja-m2-yoon-rare", kind: "vocab", note: "bento as cuisine proxy" },
  { id: "jikan", kana: "じかん", kanji: "時間", romaji: "jikan", meaningEn: "time", emoji: "⏰", fromModule: "m2", introducedByLessonId: "ja-m2-z", kind: "vocab" },
  { id: "gyuunyuu", kana: "ぎゅうにゅう", kanji: "牛乳", romaji: "gyuunyuu", meaningEn: "milk", emoji: "🥛", fromModule: "m2", kind: "vocab" },
  { id: "hyaku", kana: "ひゃく", kanji: "百", romaji: "hyaku", meaningEn: "hundred", emoji: "💯", fromModule: "m2", introducedByLessonId: "ja-m2-yoon-rare", kind: "vocab" },
  { id: "megane", kana: "めがね", kanji: "眼鏡", romaji: "megane", meaningEn: "glasses", emoji: "👓", fromModule: "m2", introducedByLessonId: "ja-m2-g", kind: "vocab" },
  { id: "mado", kana: "まど", kanji: "窓", romaji: "mado", meaningEn: "window", emoji: "🪟", fromModule: "m2", kind: "vocab" },
  { id: "asobu", kana: "あそぶ", kanji: "遊ぶ", romaji: "asobu", meaningEn: "to play", emoji: "🎲", fromModule: "m2", kind: "vocab", note: "die as play proxy" },
  { id: "enpitsu", kana: "えんぴつ", kanji: "鉛筆", romaji: "enpitsu", meaningEn: "pencil", emoji: "✏️", fromModule: "m2", kind: "vocab" },
  { id: "denwa", kana: "でんわ", kanji: "電話", romaji: "denwa", meaningEn: "telephone", emoji: "📞", fromModule: "m2", introducedByLessonId: "ja-m2-d", kind: "vocab" },
  { id: "kaze-wind", kana: "かぜ", kanji: "風", romaji: "kaze", meaningEn: "wind", emoji: "🌬️", fromModule: "m2", introducedByLessonId: "ja-m2-z", kind: "vocab", note: "wind face" },
  { id: "kaze", kana: "かぜ", kanji: "風邪", romaji: "kaze", meaningEn: "a cold", emoji: "🤧", fromModule: "m2", introducedByLessonId: "ja-m2-z", kind: "vocab", note: "sneezing face" },
  { id: "ja-m3-3-adj-big", kana: "あれは おおきいです", romaji: "are wa ookii desu", meaningEn: "That (over there) is big.", fromModule: "future", introducedByLessonId: "ja-m3-3", kind: "phrase" },
  { id: "p-ka", kana: "か", romaji: "ka", meaningEn: "question particle", fromModule: "m3", introducedByLessonId: "ja-m3-2-1", kind: "particle" },
  { id: "ja-m3-3-adj-blue", kana: "これは あおいです", romaji: "kore wa aoi desu", meaningEn: "This is blue.", fromModule: "future", introducedByLessonId: "ja-m3-3", kind: "phrase" },
  { id: "ja-m3-7-warmup-sumimasen", kana: "すみません", romaji: "sumimasen", meaningEn: "Excuse me", fromModule: "m3", introducedByLessonId: "ja-m3-7", kind: "vocab" },
  { id: "ja-m3-2-v-nihonjin", kana: "にほんじん", kanji: "日本人", romaji: "nihonjin", meaningEn: "Japanese (person)", fromModule: "m3", introducedByLessonId: "ja-m3-2", kind: "vocab" },
  { id: "p-wa", kana: "は", romaji: "wa", meaningEn: "topic marker", fromModule: "m3", introducedByLessonId: "ja-m3-4-1", kind: "particle" },
  { id: "ja-m3-2-v-amerikajin", kana: "アメリカじん", kanji: "アメリカ人", romaji: "amerikajin", meaningEn: "American (person)", fromModule: "m3", introducedByLessonId: "ja-m3-2", kind: "vocab" },
  { id: "ja-m3-1-coffee", kana: "コーヒー", romaji: "koohii", meaningEn: "coffee", emoji: "☕", fromModule: "m8", introducedByLessonId: "ja-m8-kata", kind: "phrase", note: "Kept as the M3 why-katakana hook (ja-m3-1) but SRS-attributed to m8, where the ハ row makes コーヒー fully base-readable (katakana-rollout spec §4.2 known-safe move). Unlocks on ja-m8-kata completion." },
  { id: "ja-m3-1-coffee-desu", kana: "コーヒー です", romaji: "koohii desu", meaningEn: "It's coffee.", fromModule: "future", introducedByLessonId: "ja-m3-1", kind: "phrase" },
  { id: "ja-m3-1-taxi", kana: "タクシー", romaji: "takushii", meaningEn: "taxi", emoji: "🚕", fromModule: "future", introducedByLessonId: "ja-m3-1", kind: "phrase" },
  { id: "ja-m3-1-taxi-desu", kana: "タクシー です", romaji: "takushii desu", meaningEn: "It's a taxi.", fromModule: "future", introducedByLessonId: "ja-m3-1", kind: "phrase" },
  { id: "biiru", kana: "ビール", romaji: "biiru", meaningEn: "beer", emoji: "🍺", fromModule: "m11", introducedByLessonId: "ja-m11-kata", kind: "vocab", note: "SRS-attributed to m11 — the ラ row makes ビール base-readable (spec §4.2 known-safe move). Unlocks on ja-m11-kata." },
  { id: "hoteru", kana: "ホテル", romaji: "hoteru", meaningEn: "hotel", emoji: "🏨", fromModule: "m11", introducedByLessonId: "ja-m11-kata", kind: "vocab", note: "SRS-attributed to m11 — ル (ラ row) is ホテル's last base glyph (spec §4.2). Unlocks on ja-m11-kata." },
  { id: "resutoran", kana: "レストラン", romaji: "resutoran", meaningEn: "restaurant", emoji: "🍽️", fromModule: "m12", introducedByLessonId: "ja-m12-kata", kind: "vocab", note: "SRS-attributed to m12 — ン (ワ row) is レストラン's last base glyph; base katakana complete (spec §4.2). Unlocks on ja-m12-kata." },
  { id: "ja-m3-2-v-sensei", kana: "せんせい", kanji: "先生", romaji: "sensei", meaningEn: "teacher, doctor", emoji: "🧑‍🏫", fromModule: "m3", introducedByLessonId: "ja-m3-2", kind: "vocab" },
  { id: "ja-m3-3-v-tomodachi", kana: "ともだち", kanji: "友達", romaji: "tomodachi", meaningEn: "friend", emoji: "👫", fromModule: "m3", introducedByLessonId: "ja-m3-3", kind: "vocab" },
  { id: "ja-m3-2-v-namae", kana: "なまえ", kanji: "名前", romaji: "namae", meaningEn: "name", emoji: "🪪", fromModule: "m3", introducedByLessonId: "ja-m3-2", kind: "vocab", note: "ID card" },
  { id: "ja-m3-2-v-gakusei", kana: "がくせい", kanji: "学生", romaji: "gakusei", meaningEn: "student", emoji: "🎓", fromModule: "m3", introducedByLessonId: "ja-m3-2", kind: "vocab" },
  { id: "ja-m3-3-v-hon", kana: "ほん", kanji: "本", romaji: "hon", meaningEn: "book", emoji: "📖", fromModule: "m3", introducedByLessonId: "ja-m3-3", kind: "vocab" },
  { id: "ja-m3-3-v-mizu", kana: "みず", kanji: "水", romaji: "mizu", meaningEn: "water", emoji: "💧", fromModule: "m3", introducedByLessonId: "ja-m3-3", kind: "vocab" },
  // ── m3-neo pilot (dict-form-first rewrite, spine s03) — interaction layer ──
  { id: "un", kana: "うん", romaji: "un", meaningEn: "yeah (casual yes)", fromModule: "m3", introducedByLessonId: "ja-m3-neo-4", kind: "vocab", blocked: true, excludeFromSrs: true, note: "m3-neo pilot: casual agreement, CEJC #1 — RECOGNITION only. blocked (no image MCQs) + excludeFromSrs (the SRS deck has no per-modality split, and the production ruling is deferred to the register module — spine n15), so it never enters production drills or pool draws." },
  { id: "sou", kana: "そう", romaji: "sou", meaningEn: "that's right", fromModule: "m3", introducedByLessonId: "ja-m3-neo-4", kind: "vocab", blocked: true, excludeFromSrs: true, note: "m3-neo pilot: agreement/acknowledgement, CEJC #9 — RECOGNITION only (abstract function word; same exclusion rationale as うん)." },
  { id: "arigatou-casual", kana: "ありがとう", romaji: "arigatou", meaningEn: "thanks (casual)", fromModule: "m3", introducedByLessonId: "ja-m3-neo-5", kind: "phrase", note: "m3-neo pilot: casual thanks — register pair with ありがとうございます, taught as a chunk (guide type 5). Found untracked by the 2026-07-20 vocab-provenance audit." },
  { id: "hajimemashite", kana: "はじめまして", romaji: "hajimemashite", meaningEn: "Nice to meet you", fromModule: "m3", introducedByLessonId: "ja-m3-neo-5", kind: "phrase", note: "m3-neo pilot: first-meeting formula taught as an unanalyzed chunk (guide type 5)" },
  { id: "anata", kana: "あなた", romaji: "anata", meaningEn: "you", emoji: "🫵", fromModule: "future", introducedByLessonId: "ja-m4-4-1", kind: "vocab", blocked: true, note: "pronoun — rubric explicit block" },
  { id: "ja-m4-3-v-isu", kana: "いす", romaji: "isu", meaningEn: "chair", emoji: "🪑", fromModule: "m4", introducedByLessonId: "ja-m4-3", kind: "vocab" },
  { id: "ja-m4-1-v-kaban", kana: "かばん", romaji: "kaban", meaningEn: "bag, basket", emoji: "👜", fromModule: "m4", introducedByLessonId: "ja-m4-1", kind: "vocab" },
  { id: "p-ga", kana: "が", romaji: "ga", meaningEn: "subject marker", fromModule: "m4", introducedByLessonId: "ja-m6-4-1", kind: "particle" },
  { id: "ja-m4-1-v-keitai", kana: "けいたい", romaji: "keitai", meaningEn: "Mobile phone", fromModule: "m4", introducedByLessonId: "ja-m4-1", kind: "vocab" },
  { id: "kore", kana: "これ", romaji: "kore", shortGloss: "this (by me)", meaningEn: "this", emoji: "👇", fromModule: "m4", introducedByLessonId: "ja-m1-l9-ra", kind: "vocab", blocked: true, note: "demonstrative — per rubric" },
  { id: "chichi", kana: "ちち", kanji: "父", romaji: "chichi", meaningEn: "(my) father", emoji: "👨‍👦", fromModule: "m8", introducedByLessonId: "ja-m4-1-1", kind: "vocab" },
  { id: "p-to", kana: "と", romaji: "to", meaningEn: "and / with", fromModule: "m4", introducedByLessonId: "ja-m4-1-1", kind: "particle" },
  { id: "dore", kana: "どれ", romaji: "dore", meaningEn: "which (of three or more)", emoji: "🤔", fromModule: "m4", introducedByLessonId: "ja-m4-4-1", kind: "vocab", blocked: true, note: "demonstrative — rubric blocks" },
  { id: "nihon", kana: "にほん", kanji: "日本", romaji: "nihon", meaningEn: "Japan", emoji: "🇯🇵", fromModule: "m4", introducedByLessonId: "ja-m4-2-1", kind: "vocab" },
  { id: "p-no", kana: "の", romaji: "no", meaningEn: "possession", fromModule: "m4", introducedByLessonId: "ja-m4-2-1", kind: "particle" },
  { id: "haha", kana: "はは", kanji: "母", romaji: "haha", meaningEn: "(my) mother", emoji: "👩‍👦", fromModule: "m8", introducedByLessonId: "ja-m4-1-1", kind: "vocab" },
  { id: "p-mo", kana: "も", romaji: "mo", meaningEn: "also", fromModule: "m3", introducedByLessonId: "ja-m3-7", kind: "particle", note: "Formally taught in M3-7 via RULE_MO + phrase exposure + dialogue use (moved from M4 2026-05-21 to close the original curriculum-audit 'も missing' gap)." },
  { id: "watashi", kana: "わたし", kanji: "私", romaji: "watashi", meaningEn: "I/me", emoji: "🙋", fromModule: "m4", introducedByLessonId: "ja-m4-2-1", kind: "vocab" },
  { id: "amerika", kana: "アメリカ", romaji: "amerika", meaningEn: "America", emoji: "🇺🇸", fromModule: "m4", introducedByLessonId: "ja-m4-2-2", kind: "vocab" },
  { id: "ja-m4-1-v-kamera", kana: "カメラ", romaji: "kamera", meaningEn: "camera", emoji: "📷", fromModule: "m11", introducedByLessonId: "ja-m11-kata", kind: "vocab", note: "Still exposed (romaji-assisted) in m4, but SRS-attributed to m11 where ラ makes カメラ base-readable (spec §4.2). Unlocks on ja-m11-kata." },
  { id: "ja-m4-1-v-pen", kana: "ペン", romaji: "pen", meaningEn: "pen", emoji: "🖊️", fromModule: "m12", introducedByLessonId: "ja-m12-kata", kind: "vocab", note: "Katakana ペン (distinct from hiragana ぺん atom `pen`). Exposed in m4 but SRS-attributed to m12 where ン completes base readability (spec §4.2). Unlocks on ja-m12-kata." },
  { id: "nan", kana: "なん", kanji: "何", romaji: "nan", meaningEn: "what", emoji: "❓", fromModule: "m4", introducedByLessonId: "ja-m4-4-1", kind: "vocab", blocked: true, note: "interrogative — abstract grammar" },
  { id: "ja-m4-3-v-kasa", kana: "かさ", kanji: "傘", romaji: "kasa", meaningEn: "umbrella", emoji: "☂️", fromModule: "m4", introducedByLessonId: "ja-m4-3", kind: "vocab" },
  { id: "ani", kana: "あに", kanji: "兄", romaji: "ani", meaningEn: "(humble) older brother", emoji: "👦", fromModule: "m3", introducedByLessonId: "ja-m3-5", kind: "vocab", note: "boy; pair with phrase context per rubric. M3-5 formal intro added 2026-05-21 to close the M3 forward-leak — M3-5/6/7 already used あに as a re-exposure carrier (Wave-4B n=1 fix) so the atom is fully drilled by M3 even though it was previously tagged as M4 vocab." },
  { id: "ane", kana: "あね", kanji: "姉", romaji: "ane", meaningEn: "(humble) older sister", emoji: "👩", fromModule: "m19", introducedByLessonId: "ja-m4-1-1", kind: "vocab", note: "woman; kanji 姉 carries older cue" },
  { id: "ja-m4-3-v-tegami", kana: "てがみ", kanji: "手紙", romaji: "tegami", meaningEn: "letter", emoji: "✉️", fromModule: "m4", introducedByLessonId: "ja-m4-3", kind: "vocab" },
  { id: "shinbun", kana: "しんぶん", kanji: "新聞", romaji: "shinbun", meaningEn: "newspaper", emoji: "📰", fromModule: "m8", introducedByLessonId: "ja-m4-1-1", kind: "vocab" },
  { id: "tokei", kana: "とけい", kanji: "時計", romaji: "tokei", meaningEn: "watch, clock", emoji: "⌚", fromModule: "m1", introducedByLessonId: "ja-m1-l4-ta", kind: "vocab" },
  { id: "tsukue", kana: "つくえ", kanji: "机", romaji: "tsukue", meaningEn: "desk", emoji: "🪑", fromModule: "future", introducedByLessonId: "ja-m4-1-1", kind: "vocab", note: "chair-adjacent; closest furniture glyph (no desk emoji)" },
  { id: "ja-m4-3-v-jitensha", kana: "じてんしゃ", kanji: "自転車", romaji: "jitensha", meaningEn: "bicycle", emoji: "🚲", fromModule: "m4", introducedByLessonId: "ja-m4-3", kind: "vocab" },
  { id: "ja-m4-5-v-dare", kana: "だれ", kanji: "誰", romaji: "dare", meaningEn: "who", emoji: "🙋‍♂️", fromModule: "m4", introducedByLessonId: "ja-m4-5", kind: "vocab", blocked: true, note: "question pronoun" },
  { id: "ja-m4-1-v-kuruma", kana: "くるま", kanji: "車", romaji: "kuruma", meaningEn: "car, vehicle", emoji: "🚗", fromModule: "m4", introducedByLessonId: "ja-m4-1", kind: "vocab" },
  { id: "ja-m4-3-v-jisho", kana: "じしょ", kanji: "辞書", romaji: "jisho", meaningEn: "dictionary", emoji: "📖", fromModule: "m4", introducedByLessonId: "ja-m4-3", kind: "vocab", note: "open book" },
  { id: "zasshi", kana: "ざっし", kanji: "雑誌", romaji: "zasshi", meaningEn: "magazine", emoji: "📖", fromModule: "m24", introducedByLessonId: "ja-m4-1-1", kind: "vocab", note: "open book as magazine proxy" },
  { id: "ja-m5-7-v-arigatou", kana: "ありがとうございます", romaji: "arigatou gozaimasu", meaningEn: "Thank you (polite)", fromModule: "m5", introducedByLessonId: "ja-m5-7", kind: "phrase" },
  { id: "ja-m5-4-v-ikura", kana: "いくら", romaji: "ikura", meaningEn: "how much?", emoji: "💲", fromModule: "m5", introducedByLessonId: "ja-m5-4", kind: "vocab", blocked: true, note: "question word" },
  { id: "ja-m5-4-v-en", kana: "えん", kanji: "円", romaji: "en", meaningEn: "Yen", fromModule: "m5", introducedByLessonId: "ja-m5-4", kind: "vocab" },
  { id: "kara", kana: "から", romaji: "kara", meaningEn: "from (origin)", fromModule: "m5", introducedByLessonId: "ja-m5-6-1", kind: "vocab" },
  { id: "ja-m5-2-kudasai-card", kana: "ください", romaji: "kudasai", meaningEn: "please", emoji: "🤲", fromModule: "m5", introducedByLessonId: "ja-m5-2", kind: "phrase", blocked: true, note: "polite-request auxiliary; function word" },
  { id: "ja-m5-3-v-gonin", kana: "ごにん", kanji: "五人", romaji: "go nin", meaningEn: "5 people", fromModule: "future", introducedByLessonId: "ja-m5-3", kind: "vocab" },
  { id: "ja-m5-3-v-sannin", kana: "さんにん", kanji: "三人", romaji: "san nin", meaningEn: "3 people", fromModule: "m5", introducedByLessonId: "ja-m5-3", kind: "vocab" },
  { id: "ja-m5-3-v-yonin", kana: "よにん", kanji: "四人", romaji: "yo nin", meaningEn: "4 people", fromModule: "m5", introducedByLessonId: "ja-m5-3", kind: "vocab" },
  { id: "ja-m5-4-v-ocha", kana: "おちゃ", kanji: "お茶", romaji: "ocha", meaningEn: "green tea", emoji: "🍵", fromModule: "m5", introducedByLessonId: "ja-m5-4", kind: "vocab" },
  { id: "ja-m5-4-v-okane", kana: "おかね", kanji: "お金", romaji: "okane", meaningEn: "money", emoji: "💰", fromModule: "m5", introducedByLessonId: "ja-m5-4", kind: "vocab" },
  { id: "ja-m5-1-v-1", kana: "いち", kanji: "一", romaji: "ichi", meaningEn: "one", emoji: "1️⃣", fromModule: "m5", introducedByLessonId: "ja-m5-1", kind: "vocab" },
  { id: "ja-m5-5-v-hitotsu", kana: "ひとつ", kanji: "一つ", romaji: "hitotsu", meaningEn: "one", emoji: "1️⃣", fromModule: "m5", introducedByLessonId: "ja-m5-5", kind: "vocab" },
  { id: "ja-m5-3-v-hitori", kana: "ひとり", kanji: "一人", romaji: "hitori", meaningEn: "one person", emoji: "🧍", fromModule: "m5", introducedByLessonId: "ja-m5-3", kind: "vocab", note: "single standing figure as one-person cue" },
  { id: "ja-m5-2-v-7", kana: "なな", kanji: "七", romaji: "nana", meaningEn: "seven", emoji: "7️⃣", fromModule: "m5", introducedByLessonId: "ja-m5-2", kind: "vocab" },
  { id: "ja-m5-1-v-3", kana: "さん", kanji: "三", romaji: "san", meaningEn: "three", emoji: "3️⃣", fromModule: "m5", introducedByLessonId: "ja-m5-1", kind: "vocab" },
  { id: "ja-m5-5-v-mittsu", kana: "みっつ", kanji: "三つ", romaji: "mittsu", meaningEn: "three", emoji: "3️⃣", fromModule: "m5", introducedByLessonId: "ja-m5-5", kind: "vocab" },
  { id: "ja-m5-2-v-9", kana: "きゅう", kanji: "九", romaji: "kyuu", meaningEn: "nine", emoji: "9️⃣", fromModule: "m5", introducedByLessonId: "ja-m5-2", kind: "vocab" },
  { id: "ja-m5-1-v-2", kana: "に", kanji: "二", romaji: "ni", meaningEn: "two", emoji: "2️⃣", fromModule: "m5", introducedByLessonId: "ja-m5-1", kind: "vocab" },
  { id: "ja-m5-5-v-futatsu", kana: "ふたつ", kanji: "二つ", romaji: "futatsu", meaningEn: "two", emoji: "2️⃣", fromModule: "future", introducedByLessonId: "ja-m5-5", kind: "vocab" },
  { id: "ja-m5-3-v-futari", kana: "ふたり", kanji: "二人", romaji: "futari", meaningEn: "two people", emoji: "👥", fromModule: "m5", introducedByLessonId: "ja-m5-3", kind: "vocab", note: "two silhouettes" },
  { id: "ja-m5-1-v-5", kana: "ご", kanji: "五", romaji: "go", meaningEn: "five", emoji: "5️⃣", fromModule: "m5", introducedByLessonId: "ja-m5-1", kind: "vocab" },
  { id: "ja-m5-2-v-8", kana: "はち", kanji: "八", romaji: "hachi", meaningEn: "eight", emoji: "8️⃣", fromModule: "m5", introducedByLessonId: "ja-m5-2", kind: "vocab" },
  { id: "ja-m5-2-v-6", kana: "ろく", kanji: "六", romaji: "roku", meaningEn: "six", emoji: "6️⃣", fromModule: "m5", introducedByLessonId: "ja-m5-2", kind: "vocab" },
  { id: "ja-m5-2-v-10", kana: "じゅう", kanji: "十", romaji: "juu", meaningEn: "ten", emoji: "🔟", fromModule: "m5", introducedByLessonId: "ja-m5-2", kind: "vocab" },
  { id: "ja-m5-1-v-4", kana: "よん", kanji: "四", romaji: "yon", meaningEn: "four", emoji: "4️⃣", fromModule: "m5", introducedByLessonId: "ja-m5-1", kind: "vocab" },
  { id: "arimasu", kana: "あります", romaji: "arimasu", meaningEn: "exists (thing)", emoji: "📦", fromModule: "m6", introducedByLessonId: "ja-m6-4-1", kind: "vocab" },
  { id: "imasu", kana: "います", romaji: "imasu", meaningEn: "exists (alive)", emoji: "🧑", fromModule: "m6", introducedByLessonId: "ja-m6-2-1", kind: "vocab" },
  // Neo m6 (Negatives & Existence): existence negatives. ない is the IRREGULAR
  // negative of ある; いない the ordinary る-drop negative of いる (2026-07-20).
  // Neo m6 ない-form atoms (2026-07-24): registered so the romaji lexicon
  // word-groups them on tiles ("shinai", never "shi nai" — Spencer walk)
  // and provenance/exposure see them. excludeFromSrs: their retention is
  // tracked by the conjugation transform cells (conj:nai:<class>), not
  // vocab flashcards — a たべない flip-card would double-count たべる.
  // blocked: negatives aren't imageable.
  { id: "ja-m6-neo-tabenai", kana: "たべない", romaji: "tabenai", meaningEn: "won't eat / don't eat", shortGloss: "won't eat", fromModule: "m6", introducedByLessonId: "ja-m6-neo-1", kind: "vocab", blocked: true, excludeFromSrs: true },
  { id: "ja-m6-neo-minai", kana: "みない", romaji: "minai", meaningEn: "won't watch / don't watch", shortGloss: "won't watch", fromModule: "m6", introducedByLessonId: "ja-m6-neo-1", kind: "vocab", blocked: true, excludeFromSrs: true },
  { id: "ja-m6-neo-nomanai", kana: "のまない", romaji: "nomanai", meaningEn: "won't drink / don't drink", shortGloss: "won't drink", fromModule: "m6", introducedByLessonId: "ja-m6-neo-2", kind: "vocab", blocked: true, excludeFromSrs: true },
  { id: "ja-m6-neo-ikanai", kana: "いかない", romaji: "ikanai", meaningEn: "won't go / isn't going", shortGloss: "won't go", fromModule: "m6", introducedByLessonId: "ja-m6-neo-2", kind: "vocab", blocked: true, excludeFromSrs: true },
  { id: "ja-m6-neo-kawanai", kana: "かわない", romaji: "kawanai", meaningEn: "won't buy / don't buy", shortGloss: "won't buy", fromModule: "m6", introducedByLessonId: "ja-m6-neo-2", kind: "vocab", blocked: true, excludeFromSrs: true },
  { id: "ja-m6-neo-wakaranai", kana: "わからない", romaji: "wakaranai", meaningEn: "don't understand / don't get it", shortGloss: "don't understand", fromModule: "m6", introducedByLessonId: "ja-m6-neo-2", kind: "vocab", blocked: true, excludeFromSrs: true },
  { id: "ja-m6-neo-shinai", kana: "しない", romaji: "shinai", meaningEn: "won't do / don't do", shortGloss: "won't do", fromModule: "m6", introducedByLessonId: "ja-m6-neo-3", kind: "vocab", blocked: true, excludeFromSrs: true },
  { id: "ja-m6-neo-konai", kana: "こない", romaji: "konai", meaningEn: "won't come / isn't coming", shortGloss: "won't come", fromModule: "m6", introducedByLessonId: "ja-m6-neo-3", kind: "vocab", blocked: true, excludeFromSrs: true },
  { id: "ja-m6-neo-nai-aru", kana: "ない", romaji: "nai", meaningEn: "there isn't (neg. of ある)", fromModule: "m6", introducedByLessonId: "ja-m6-neo-6", kind: "vocab" },
  { id: "ja-m6-neo-inai", kana: "いない", romaji: "inai", meaningEn: "there isn't (neg. of いる)", fromModule: "m6", introducedByLessonId: "ja-m6-neo-6", kind: "vocab" },
  { id: "ja-m6-1-uchi", kana: "うち", romaji: "uchi", meaningEn: "Home / my place", fromModule: "m6", introducedByLessonId: "ja-m6-1", kind: "vocab" },
  { id: "kuukou", kana: "くうこう", kanji: "空港", romaji: "kuukou", meaningEn: "airport", emoji: "✈️", fromModule: "m7", introducedByLessonId: "ja-m6-1-1", kind: "vocab" },
  { id: "p-de", kana: "で", romaji: "de", meaningEn: "at / by means of", fromModule: "m6", introducedByLessonId: "ja-m6-3-1", kind: "particle" },
  { id: "ja-m6-8-warm-doko", kana: "どこ", romaji: "doko", meaningEn: "where", fromModule: "m6", introducedByLessonId: "ja-m6-8", kind: "vocab", blocked: true, note: "interrogative demonstrative; abstract" },
  { id: "p-ni", kana: "に", romaji: "ni", meaningEn: "to / at / location", fromModule: "m6", introducedByLessonId: "ja-m6-2-1", kind: "particle" },
  { id: "ja-m6-1-konbini", kana: "コンビニ", romaji: "konbini", meaningEn: "Convenience store", fromModule: "m12", introducedByLessonId: "ja-m12-kata", kind: "vocab", note: "Exposed (romaji) in m6, but SRS-attributed to m12 where ン completes base readability (spec §4.2). Unlocks on ja-m12-kata." },
  { id: "ja-m6-1-toire", kana: "トイレ", romaji: "toire", meaningEn: "toilet", emoji: "🚽", fromModule: "m11", introducedByLessonId: "ja-m11-kata", kind: "vocab", note: "Exposed in m6, SRS-attributed to m11 where レ (ラ row) makes トイレ base-readable (spec §4.2). Unlocks on ja-m11-kata." },
  { id: "basu", kana: "バス", romaji: "basu", meaningEn: "bus", emoji: "🚌", fromModule: "m8", introducedByLessonId: "ja-m8-kata", kind: "vocab", note: "SRS-attributed to m8 — the ハ row (バ = ハ+dakuten) makes バス base-readable (spec §4.2 known-safe move). Unlocks on ja-m8-kata." },
  { id: "ja-m6-1-koen", kana: "こうえん", kanji: "公園", romaji: "kouen", meaningEn: "park", emoji: "🏞️", fromModule: "m6", introducedByLessonId: "ja-m6-1", kind: "vocab" },
  { id: "toshokan", kana: "としょかん", kanji: "図書館", romaji: "toshokan", meaningEn: "library", emoji: "📚", fromModule: "m6", introducedByLessonId: "ja-m6-3-1", kind: "vocab" },
  { id: "chikatetsu", kana: "ちかてつ", kanji: "地下鉄", romaji: "chikatetsu", meaningEn: "underground train", emoji: "🚇", fromModule: "future", introducedByLessonId: "ja-m6-1-1", kind: "vocab" },
  { id: "ja-m6-1-gakkou", kana: "がっこう", kanji: "学校", romaji: "gakkou", meaningEn: "school", emoji: "🏫", fromModule: "m6", introducedByLessonId: "ja-m6-1", kind: "vocab" },
  { id: "ja-m6-1-mise", kana: "みせ", kanji: "店", romaji: "mise", meaningEn: "shop", emoji: "🏪", fromModule: "m6", introducedByLessonId: "ja-m6-1", kind: "vocab" },
  { id: "byouin", kana: "びょういん", kanji: "病院", romaji: "byouin", meaningEn: "hospital", emoji: "🏥", fromModule: "m17", introducedByLessonId: "ja-m6-1-1", kind: "vocab" },
  { id: "ja-m6-8-warm-chikai", kana: "ちかい", kanji: "近い", romaji: "chikai", meaningEn: "near", emoji: "📍", fromModule: "m6", introducedByLessonId: "ja-m6-8", kind: "vocab", note: "map pin as proximity cue (weak)" },
  { id: "ja-m6-8-warm-tooi", kana: "とおい", kanji: "遠い", romaji: "tooi", meaningEn: "far", emoji: "🔭", fromModule: "m6", introducedByLessonId: "ja-m6-8", kind: "vocab", note: "telescope = far / distant" },
  { id: "ja-m6-1-heya", kana: "へや", kanji: "部屋", romaji: "heya", meaningEn: "room", emoji: "🚪", fromModule: "m6", introducedByLessonId: "ja-m6-1", kind: "vocab", note: "door as room proxy; concrete spatial referent" },
  { id: "yuubinkyoku", kana: "ゆうびんきょく", kanji: "郵便局", romaji: "yuubinkyoku", meaningEn: "post office", emoji: "🏤", fromModule: "future", introducedByLessonId: "ja-m6-1-1", kind: "vocab", note: "post office building" },
  { id: "ginkou", kana: "ぎんこう", kanji: "銀行", romaji: "ginkou", meaningEn: "bank", emoji: "🏦", fromModule: "m6", introducedByLessonId: "ja-m6-8-2", kind: "vocab" },
  { id: "densha", kana: "でんしゃ", kanji: "電車", romaji: "densha", meaningEn: "electric train", emoji: "🚆", fromModule: "m6", introducedByLessonId: "ja-m6-3-1", kind: "vocab" },
  { id: "ja-m6-1-eki", kana: "えき", kanji: "駅", romaji: "eki", meaningEn: "station", emoji: "🚉", fromModule: "m6", introducedByLessonId: "ja-m6-1", kind: "vocab", note: "station emoji" },
  { id: "ikimasu", kana: "いきます", romaji: "ikimasu", meaningEn: "go (polite)", emoji: "🚶", fromModule: "m7", introducedByLessonId: "ja-m7-neo-2", kind: "vocab" },
  { id: "ja-m7-8-warm-irasshai", kana: "いらっしゃいませ", romaji: "irasshaimase", meaningEn: "Welcome (shop greeting)", fromModule: "m7", introducedByLessonId: "ja-m7-8", kind: "phrase" },
  { id: "kakimasu", kana: "かきます", romaji: "kakimasu", meaningEn: "write (polite)", emoji: "✍️", fromModule: "future", introducedByLessonId: "ja-m7-2-1", kind: "vocab" },
  { id: "ja-m7-8-warm-kashikomari", kana: "かしこまりました", romaji: "kashikomarimashita", meaningEn: "Understood. (formal acknowledgement)", fromModule: "future", introducedByLessonId: "ja-m7-8", kind: "phrase" },
  { id: "ja-m7-8-warm-gochuumon", kana: "ごちゅうもんは", romaji: "go-chuumon wa", meaningEn: "Your order? (polite)", fromModule: "future", introducedByLessonId: "ja-m7-8", kind: "phrase" },
  { id: "ja-m7-4-v-sake", kana: "さけ", kanji: "酒", romaji: "sake", meaningEn: "Sake (rice wine)", fromModule: "future", introducedByLessonId: "ja-m7-4", kind: "vocab" },
  { id: "ja-m7-4-v-sushi", kana: "すし", kanji: "寿司", romaji: "sushi", meaningEn: "Sushi", fromModule: "m7", introducedByLessonId: "ja-m7-4", kind: "vocab" },
  { id: "tabemasu", kana: "たべます", romaji: "tabemasu", meaningEn: "eat (polite)", emoji: "🍴", fromModule: "m7", introducedByLessonId: "ja-m7-neo-1", kind: "vocab" },
  { id: "ja-m7-8-warm-nanmei", kana: "なんめいさまですか", romaji: "nan-mei sama desu ka", meaningEn: "How many people?", fromModule: "future", introducedByLessonId: "ja-m7-8", kind: "phrase" },
  { id: "nomimasu", kana: "のみます", romaji: "nomimasu", meaningEn: "drink (polite)", emoji: "🥤", fromModule: "m7", introducedByLessonId: "ja-m7-neo-1", kind: "vocab" },
  { id: "mimasu", kana: "みます", romaji: "mimasu", meaningEn: "watch (polite)", emoji: "👀", fromModule: "m7", introducedByLessonId: "ja-m7-neo-2", kind: "vocab" },
  { id: "yomimasu", kana: "よみます", romaji: "yomimasu", meaningEn: "read (polite)", emoji: "📚", fromModule: "m7", introducedByLessonId: "ja-m7-2-1", kind: "vocab" },
  { id: "ja-m7-2-ex-1", kana: "わたしは すしを たべます", romaji: "watashi wa sushi wo tabemasu", meaningEn: "I eat sushi. (polite)", fromModule: "future", introducedByLessonId: "ja-m7-2", kind: "phrase" },
  { id: "ja-m7-2-ex-2", kana: "わたしは ほんを よみます", romaji: "watashi wa hon wo yomimasu", meaningEn: "I read a book. (polite)", fromModule: "future", introducedByLessonId: "ja-m7-2", kind: "phrase" },
  { id: "p-wo", kana: "を", romaji: "wo", meaningEn: "direct object marker", fromModule: "m7", introducedByLessonId: "ja-m7-3-1", kind: "particle" },
  { id: "ja-m7-4-v-juusu", kana: "ジュース", romaji: "juusu", meaningEn: "Juice", fromModule: "m5", introducedByLessonId: "ja-m5-kata", kind: "vocab", note: "First fully base-readable loanword — the サ row (M5) closes ジュース (spec §4.2). Unlocks on ja-m5-kata." },
  { id: "ja-m7-4-v-pan", kana: "パン", romaji: "pan", meaningEn: "bread", emoji: "🍞", fromModule: "m12", introducedByLessonId: "ja-m12-kata", kind: "vocab", note: "Katakana パン (distinct from hiragana ぱん atom `pan`). SRS-attributed to m12 where ン completes base readability (spec §4.2). Unlocks on ja-m12-kata." },
  { id: "ja-m7-4-v-ramen", kana: "ラーメン", romaji: "raamen", meaningEn: "Ramen", fromModule: "m12", introducedByLessonId: "ja-m12-kata", kind: "vocab", note: "SRS-attributed to m12 — ン (ワ row) is ラーメン's last base glyph (spec §4.2). Unlocks on ja-m12-kata." },
  { id: "osake", kana: "おさけ", kanji: "お酒", romaji: "osake", meaningEn: "alcohol, rice wine", emoji: "🍶", fromModule: "m21", introducedByLessonId: "ja-m7-1-1", kind: "vocab" },
  { id: "ja-m7-4-v-gohan", kana: "ごはん", kanji: "御飯", romaji: "gohan", meaningEn: "cooked rice, meal", emoji: "🍚", fromModule: "m7", introducedByLessonId: "ja-m7-4", kind: "vocab" },
  { id: "ja-m7-1-v-kaku", kana: "かく", kanji: "書く", romaji: "kaku", meaningEn: "to write", emoji: "✍️", fromModule: "m7", introducedByLessonId: "ja-m7-1", kind: "vocab" },
  { id: "ja-m7-1-v-iku", kana: "いく", kanji: "行く", romaji: "iku", meaningEn: "to go, to travel", emoji: "🚶", fromModule: "m7", introducedByLessonId: "ja-m7-1", kind: "vocab", note: "person walking" },
  { id: "ja-m7-1-v-miru", kana: "みる", kanji: "見る  観る", romaji: "miru", meaningEn: "to watch, to look at", shortGloss: "to watch", emoji: "👁️", fromModule: "m7", introducedByLessonId: "ja-m7-1", kind: "vocab" },
  { id: "ja-m7-1-v-yomu", kana: "よむ", kanji: "読む", romaji: "yomu", meaningEn: "to read", emoji: "📖", fromModule: "m7", introducedByLessonId: "ja-m7-1", kind: "vocab" },
  { id: "ja-m7-1-v-taberu", kana: "たべる", kanji: "食べる", romaji: "taberu", meaningEn: "to eat", emoji: "🍽️", fromModule: "m7", introducedByLessonId: "ja-m7-1", kind: "vocab" },
  { id: "ja-m7-1-v-nomu", kana: "のむ", kanji: "飲む", romaji: "nomu", meaningEn: "to drink", emoji: "🥤", fromModule: "m7", introducedByLessonId: "ja-m7-1", kind: "vocab", note: "cup with straw" },
  { id: "ja-surv-ikura", kana: "いくらですか", romaji: "ikura desu ka", meaningEn: "How much is it?", fromModule: "sidequest-survival", introducedByLessonId: "ja-sidequest-survival-phrases", kind: "phrase" },
  { id: "ja-surv-itsu", kana: "いつ", romaji: "itsu", meaningEn: "when", fromModule: "sidequest-survival", introducedByLessonId: "ja-sidequest-survival-phrases", kind: "phrase", blocked: true, note: "interrogative" },
  { id: "ja-surv-onegaishimasu", kana: "おねがいします", romaji: "onegaishimasu", meaningEn: "Please", fromModule: "sidequest-survival", introducedByLessonId: "ja-sidequest-survival-phrases", kind: "phrase" },
  { id: "ja-surv-konnichiwa", kana: "こんにちは", romaji: "konnichiwa", meaningEn: "Hello / good afternoon", fromModule: "sidequest-survival", introducedByLessonId: "ja-sidequest-survival-phrases", kind: "phrase" },
  { id: "ja-surv-gomennasai", kana: "ごめんなさい", romaji: "gomen nasai", meaningEn: "I'm sorry", fromModule: "sidequest-survival", introducedByLessonId: "ja-sidequest-survival-phrases", kind: "phrase" },
  { id: "ja-surv-janai", kana: "じゃないです", romaji: "janai desu", meaningEn: "is not / are not", fromModule: "sidequest-survival", introducedByLessonId: "ja-sidequest-survival-phrases", kind: "phrase" },
  { id: "ja-surv-desu", kana: "です", romaji: "desu", meaningEn: "is / are (polite copula)", fromModule: "sidequest-survival", introducedByLessonId: "ja-sidequest-survival-phrases", kind: "phrase" },
  { id: "ja-surv-doko", kana: "どこですか", romaji: "doko desu ka", meaningEn: "Where is it?", fromModule: "sidequest-survival", introducedByLessonId: "ja-sidequest-survival-phrases", kind: "phrase" },
  { id: "ja-surv-hai", kana: "はい", romaji: "hai", meaningEn: "yes", fromModule: "sidequest-survival", introducedByLessonId: "ja-sidequest-survival-phrases", kind: "phrase", blocked: true, note: "interjection/function word" },
  { id: "ja-surv-wakarimashita", kana: "わかりました", romaji: "wakarimashita", meaningEn: "I understand / got it", fromModule: "sidequest-survival", introducedByLessonId: "ja-sidequest-survival-phrases", kind: "phrase" },
  { id: "asatte", kana: "あさって", romaji: "asatte", meaningEn: "day after tomorrow", emoji: "📅", fromModule: "m12", kind: "vocab", note: "calendar; pair with phrase context" },
  { id: "asoko", kana: "あそこ", romaji: "asoko", shortGloss: "over there", meaningEn: "over there", fromModule: "m6", kind: "vocab", blocked: true, note: "spatial demonstrative — per rubric" },
  { id: "achira", kana: "あちら", romaji: "achira", meaningEn: "there", fromModule: "m8", kind: "vocab", blocked: true, note: "spatial demonstrative — per rubric" },
  { id: "atchi", kana: "あっち", romaji: "atchi", meaningEn: "over there", fromModule: "future", kind: "vocab", blocked: true, note: "demonstrative spatial — rubric block" },
  { id: "ano", kana: "あの", romaji: "ano", meaningEn: "that over there", fromModule: "m8", kind: "vocab", blocked: true, note: "demonstrative — rubric block" },
  { id: "abiru", kana: "あびる", romaji: "abiru", meaningEn: "to bathe, to shower", emoji: "🚿", fromModule: "future", kind: "vocab" },
  { id: "amari", kana: "あまり", romaji: "amari", meaningEn: "not very", fromModule: "m9", kind: "vocab", blocked: true, note: "abstract grammar adverb" },
  { id: "aru", kana: "ある", romaji: "aru", meaningEn: "to be, to have (used for inanimate objects)", fromModule: "m11", kind: "vocab", blocked: true, note: "existence-of — rubric explicit block" },
  { id: "are", kana: "あれ", romaji: "are", shortGloss: "that (over there)", meaningEn: "that", fromModule: "m4", kind: "vocab", blocked: true, note: "demonstrative — rubric block" },
  { id: "ii--yoi", kana: "いい / よい", romaji: "ii-/-yoi", meaningEn: "good", emoji: "👍", fromModule: "m8", kind: "vocab", note: "thumbs up as good proxy" },
  { id: "ikaga", kana: "いかが", romaji: "ikaga", meaningEn: "how", fromModule: "m21", introducedByLessonId: "ja-m21-6-2", kind: "vocab", blocked: true, note: "interrogative adverb — abstract grammar" },
  { id: "ikutsu", kana: "いくつ", romaji: "ikutsu", meaningEn: "how many?, how old?", fromModule: "m14", introducedByLessonId: "ja-m14-6-2", kind: "vocab", blocked: true, note: "interrogative" },
  { id: "ichiban", kana: "いちばん", romaji: "ichiban", meaningEn: "best, first", emoji: "🥇", fromModule: "m22", introducedByLessonId: "ja-m22-1-1", kind: "vocab" },
  { id: "itsumo", kana: "いつも", romaji: "itsumo", meaningEn: "always", fromModule: "m11", kind: "vocab", blocked: true, note: "frequency adverb" },
  { id: "iroiro", kana: "いろいろ", romaji: "iroiro", meaningEn: "various", emoji: "🌈", fromModule: "m22", introducedByLessonId: "ja-m22-4-2", kind: "vocab", note: "rainbow as variety cue" },
  { id: "ee", kana: "ええ", romaji: "ee", meaningEn: "yes", emoji: "✅", fromModule: "m7", introducedByLessonId: "ja-m7-neo-6", kind: "vocab" },
  { id: "oishii", kana: "おいしい", romaji: "oishii", meaningEn: "delicious", emoji: "😋", fromModule: "m8", kind: "vocab" },
  { id: "onaka", kana: "おなか", romaji: "onaka", meaningEn: "stomach", emoji: "🫃", fromModule: "m20", kind: "vocab" },
  { id: "obaasan", kana: "おばあさん", romaji: "obaasan", meaningEn: "grandmother, female senior-citizen", emoji: "👵", fromModule: "m19", kind: "vocab" },
  { id: "omawarisan", kana: "おまわりさん", romaji: "omawarisan", meaningEn: "friendly term for policeman", emoji: "👮", fromModule: "m17", introducedByLessonId: "ja-m17-8-2", kind: "vocab" },
  { id: "omoshiroi", kana: "おもしろい", romaji: "omoshiroi", meaningEn: "interesting", emoji: "🤩", fromModule: "m8", kind: "vocab", note: "starstruck = fascinated/interesting" },
  { id: "kakaru", kana: "かかる", romaji: "kakaru", meaningEn: "to take time or money", fromModule: "future", kind: "vocab", blocked: true, note: "abstract verb of cost/duration" },
  { id: "kakeru", kana: "かける", romaji: "kakeru", meaningEn: "to call by phone", emoji: "📞", fromModule: "m14", kind: "vocab" },
  { id: "kawaii", kana: "かわいい", romaji: "kawaii", meaningEn: "cute", emoji: "🥰", fromModule: "m19", kind: "vocab" },
  { id: "kirei", kana: "きれい", romaji: "kirei", meaningEn: "pretty, clean", emoji: "✨", fromModule: "m9", kind: "vocab", note: "sparkles as clean/pretty proxy" },
  { id: "koko", kana: "ここ", romaji: "koko", meaningEn: "here", fromModule: "m6", kind: "vocab", blocked: true, note: "spatial demonstrative — per rubric" },
  { id: "kochira", kana: "こちら", romaji: "kochira", meaningEn: "this person or way", fromModule: "m8", kind: "vocab", blocked: true, note: "demonstrative — per rubric" },
  { id: "kotchi", kana: "こっち", romaji: "kotchi", meaningEn: "this person or way", fromModule: "future", kind: "vocab", blocked: true, note: "demonstrative — spatial pronoun" },
  { id: "kono", kana: "この", romaji: "kono", meaningEn: "this", fromModule: "m8", kind: "vocab", blocked: true, note: "demonstrative — rubric block" },
  { id: "konna", kana: "こんな", romaji: "konna", meaningEn: "such", fromModule: "m9", introducedByLessonId: "ja-m9-6-2", kind: "vocab", blocked: true, note: "demonstrative determiner — abstract grammar" },
  { id: "saa", kana: "さあ", romaji: "saa", meaningEn: "well…", fromModule: "m26", introducedByLessonId: "ja-m26-7-1", kind: "vocab", blocked: true, note: "interjection — no concrete referent" },
  { id: "shikashi", kana: "しかし", romaji: "shikashi", meaningEn: "however", fromModule: "m26", introducedByLessonId: "ja-m26-1-2", kind: "vocab", blocked: true, note: "conjunction" },
  { id: "shouyu", kana: "しょうゆ", romaji: "shouyu", meaningEn: "soy sauce", emoji: "🍶", fromModule: "future", kind: "vocab", note: "sake bottle as closest condiment vessel; weak" },
  { id: "ja--jaa", kana: "じゃ / じゃあ", romaji: "ja-/-jaa", meaningEn: "well then…", fromModule: "m26", introducedByLessonId: "ja-m26-5-2", kind: "vocab", blocked: true, note: "discourse particle" },
  { id: "suguni", kana: "すぐに", romaji: "suguni", meaningEn: "instantly", emoji: "⚡", fromModule: "m17", introducedByLessonId: "ja-m17-8-2", kind: "vocab", note: "lightning = instant" },
  { id: "suru", kana: "する", romaji: "suru", meaningEn: "to do, to make", fromModule: "m11", kind: "vocab", blocked: true, note: "generic abstract verb" },
  { id: "sekken", kana: "せっけん", romaji: "sekken", meaningEn: "economy", emoji: "🧼", fromModule: "m20", kind: "vocab", note: "soap — note: meaning field appears mislabeled (せっけん=soap)" },
  { id: "soushite--soshite", kana: "そうして / そして", romaji: "soushite-/-soshite", meaningEn: "and", fromModule: "m26", introducedByLessonId: "ja-m26-1-2", kind: "vocab", blocked: true, note: "conjunction / function word" },
  { id: "soko", kana: "そこ", romaji: "soko", meaningEn: "that place", fromModule: "m6", kind: "vocab", blocked: true, note: "demonstrative — rubric blocks" },
  { id: "sochira", kana: "そちら", romaji: "sochira", meaningEn: "over there", fromModule: "m8", kind: "vocab", blocked: true, note: "spatial demonstrative — per rubric" },
  { id: "sotchi", kana: "そっち", romaji: "sotchi", meaningEn: "over there", fromModule: "future", kind: "vocab", blocked: true, note: "demonstrative — rubric block" },
  { id: "sono", kana: "その", romaji: "sono", meaningEn: "that", fromModule: "m8", kind: "vocab", blocked: true, note: "demonstrative — abstract grammar per rubric" },
  { id: "soba", kana: "そば", romaji: "soba", meaningEn: "near, beside", fromModule: "m17", kind: "vocab", blocked: true, note: "positional — abstract" },
  { id: "sore", kana: "それ", romaji: "sore", shortGloss: "that (by you)", meaningEn: "that", fromModule: "m4", kind: "vocab", blocked: true, note: "demonstrative — per rubric" },
  { id: "sorekara", kana: "それから", romaji: "sorekara", meaningEn: "after that", fromModule: "m10", kind: "vocab", blocked: true, note: "conjunction — abstract grammar" },
  { id: "soredeha", kana: "それでは", romaji: "soredeha", meaningEn: "in that situation", fromModule: "future", kind: "vocab", blocked: true, note: "discourse connector" },
  { id: "taihen", kana: "たいへん", romaji: "taihen", meaningEn: "very", fromModule: "m9", kind: "vocab", blocked: true, note: "intensifier adverb" },
  { id: "takusan", kana: "たくさん", romaji: "takusan", meaningEn: "many", fromModule: "m20", introducedByLessonId: "ja-m20-3-1", kind: "vocab", blocked: true, note: "abstract quantifier; no specific referent" },
  { id: "tate", kana: "たて", romaji: "tate", meaningEn: "length, height", emoji: "📏", fromModule: "future", kind: "vocab", note: "ruler = measurement" },
  { id: "tabako", kana: "たばこ", romaji: "tabako", meaningEn: "tobacco, cigarettes", emoji: "🚬", fromModule: "m16", kind: "vocab" },
  { id: "tabun", kana: "たぶん", romaji: "tabun", meaningEn: "probably", fromModule: "m18", introducedByLessonId: "ja-m18-2-1", kind: "vocab", blocked: true, note: "modal adverb" },
  { id: "dandan", kana: "だんだん", romaji: "dandan", meaningEn: "gradually", fromModule: "m27", introducedByLessonId: "ja-m27-4-1", kind: "vocab", blocked: true, note: "adverb of degree; no referent" },
  { id: "chawan", kana: "ちゃわん", romaji: "chawan", meaningEn: "rice bowl", emoji: "🍚", fromModule: "m21", kind: "vocab", note: "cooked rice in bowl" },
  { id: "choudo", kana: "ちょうど", romaji: "choudo", meaningEn: "exactly", fromModule: "m21", introducedByLessonId: "ja-m21-7-2", kind: "vocab", blocked: true, note: "abstract adverb; no concrete referent" },
  { id: "chotto", kana: "ちょっと", romaji: "chotto", meaningEn: "somewhat", fromModule: "m9", kind: "vocab", blocked: true, note: "adverb/abstract degree marker" },
  { id: "tsukeru", kana: "つける", romaji: "tsukeru", meaningEn: "to turn on", emoji: "💡", fromModule: "future", kind: "vocab", note: "lightbulb as turn-on cue" },
  { id: "tsumaranai", kana: "つまらない", romaji: "tsumaranai", meaningEn: "boring", emoji: "🥱", fromModule: "m8", kind: "vocab", note: "yawn = boredom" },
  { id: "dekiru", kana: "できる", romaji: "dekiru", meaningEn: "to be able to", fromModule: "m23", introducedByLessonId: "ja-m23-8-1", kind: "vocab", blocked: true, note: "modal/auxiliary verb; abstract" },
  { id: "deha", kana: "では", romaji: "deha", meaningEn: "with that...", fromModule: "m26", introducedByLessonId: "ja-m26-5-2", kind: "vocab", blocked: true, note: "particle/conjunction" },
  { id: "demo", kana: "でも", romaji: "demo", meaningEn: "but", fromModule: "m26", introducedByLessonId: "ja-m26-1-2", kind: "vocab", blocked: true, note: "conjunction" },
  { id: "totemo", kana: "とても", romaji: "totemo", meaningEn: "very", fromModule: "m9", kind: "vocab", blocked: true, note: "intensifier adverb; no referent" },
  { id: "dou", kana: "どう", romaji: "dou", meaningEn: "how, in what way", fromModule: "m8", kind: "vocab", blocked: true, note: "interrogative" },
  { id: "doushite", kana: "どうして", romaji: "doushite", meaningEn: "for what reason", fromModule: "m13", introducedByLessonId: "ja-m13-4-2", kind: "vocab", blocked: true, note: "interrogative" },
  { id: "douzo", kana: "どうぞ", romaji: "douzo", meaningEn: "please", emoji: "🙏", fromModule: "m21", introducedByLessonId: "ja-m21-4-1", kind: "vocab", note: "folded hands" },
  { id: "doumo", kana: "どうも", romaji: "doumo", meaningEn: "thanks", emoji: "🙏", fromModule: "m21", introducedByLessonId: "ja-m21-4-2", kind: "vocab" },
  { id: "dochira", kana: "どちら", romaji: "dochira", meaningEn: "which of two", fromModule: "m8", kind: "vocab", blocked: true, note: "demonstrative — rubric blocks" },
  { id: "dotchi", kana: "どっち", romaji: "dotchi", meaningEn: "which", fromModule: "future", kind: "vocab", blocked: true, note: "interrogative pronoun" },
  { id: "donata", kana: "どなた", romaji: "donata", meaningEn: "who", fromModule: "m19", introducedByLessonId: "ja-m19-4-2", kind: "vocab", blocked: true, note: "interrogative pronoun — per rubric" },
  { id: "dono", kana: "どの", romaji: "dono", meaningEn: "which", fromModule: "m8", kind: "vocab", blocked: true, note: "demonstrative — rubric blocks" },
  { id: "naze", kana: "なぜ", romaji: "naze", meaningEn: "why", fromModule: "m13", introducedByLessonId: "ja-m13-4-1", kind: "vocab", blocked: true, note: "question word / abstract grammar" },
  { id: "nado", kana: "など", romaji: "nado", meaningEn: "et cetera", fromModule: "m21", introducedByLessonId: "ja-m21-3-2", kind: "vocab", blocked: true, note: "particle" },
  { id: "naru", kana: "なる", romaji: "naru", meaningEn: "to become", emoji: "🔄", fromModule: "m27", introducedByLessonId: "ja-m27-4-1", kind: "vocab", blocked: true, note: "cycle reads as 'refresh' not 'become'" },
  { id: "haku", kana: "はく", romaji: "haku", meaningEn: "to wear, to put on trousers", emoji: "👖", fromModule: "future", kind: "vocab", note: "jeans as put-on-trousers cue" },
  { id: "hashi", kana: "はし", romaji: "hashi", meaningEn: "chopsticks", emoji: "🥢", fromModule: "m21", kind: "vocab" },
  { id: "furo", kana: "ふろ", romaji: "furo", meaningEn: "bath", emoji: "🛁", fromModule: "future", kind: "vocab" },
  { id: "hoka", kana: "ほか", romaji: "hoka", meaningEn: "other, the rest", fromModule: "m21", introducedByLessonId: "ja-m21-7-1", kind: "vocab", blocked: true, note: "abstract relational word" },
  { id: "hontou", kana: "ほんとう", romaji: "hontou", meaningEn: "truth", fromModule: "m11", kind: "vocab", blocked: true, note: "abstract noun; no concrete referent" },
  { id: "mazui", kana: "まずい", romaji: "mazui", meaningEn: "unpleasant", emoji: "🤢", fromModule: "m8", kind: "vocab", note: "nauseated face for bad-taste cue" },
  { id: "mata", kana: "また", romaji: "mata", meaningEn: "again, and", fromModule: "m11", kind: "vocab", blocked: true, note: "adverb/conjunction" },
  { id: "mada", kana: "まだ", romaji: "mada", meaningEn: "yet, still", fromModule: "m11", kind: "vocab", blocked: true, note: "tense/aspect adverb — abstract grammar" },
  { id: "massugu", kana: "まっすぐ", romaji: "massugu", meaningEn: "straight ahead, direct", emoji: "⬆️", fromModule: "m17", kind: "vocab", note: "up arrow as straight-ahead direction" },
  { id: "minna", kana: "みんな", romaji: "minna", meaningEn: "everyone", emoji: "👥", fromModule: "m19", introducedByLessonId: "ja-m19-4-2", kind: "vocab" },
  { id: "mou", kana: "もう", romaji: "mou", meaningEn: "already", fromModule: "m11", kind: "vocab", blocked: true, note: "tense/aspect adverb" },
  { id: "motto", kana: "もっと", romaji: "motto", meaningEn: "more", emoji: "➕", fromModule: "m22", introducedByLessonId: "ja-m22-1-1", kind: "vocab", note: "plus = more" },
  { id: "yaru", kana: "やる", romaji: "yaru", meaningEn: "to do", fromModule: "m15", introducedByLessonId: "ja-m15-2-2", kind: "vocab", blocked: true, note: "generic verb; same meaning as する — polite-form duplicate per rubric" },
  { id: "yukkurito", kana: "ゆっくりと", romaji: "yukkurito", meaningEn: "slowly", emoji: "🐢", fromModule: "m20", introducedByLessonId: "ja-m20-2-2", kind: "vocab", note: "turtle as slowness cue" },
  { id: "yoku", kana: "よく", romaji: "yoku", meaningEn: "often, well", fromModule: "m11", kind: "vocab", blocked: true, note: "adverb of frequency/manner; abstract" },
  { id: "yorihou", kana: "より、ほう", romaji: "yori?hou", meaningEn: "Used for comparison.", fromModule: "m22", introducedByLessonId: "ja-m22-1-1", kind: "vocab", blocked: true, note: "comparison particle — abstract grammar" },
  { id: "rippa", kana: "りっぱ", romaji: "rippa", meaningEn: "splendid", emoji: "✨", fromModule: "future", kind: "vocab", note: "sparkles = splendid/admirable" },
  { id: "apaato", kana: "アパート", romaji: "apaato", meaningEn: "apartment", emoji: "🏢", fromModule: "future", kind: "vocab", note: "apartment building" },
  { id: "erebeetaa", kana: "エレベーター", romaji: "erebeetaa", meaningEn: "elevator", emoji: "🛗", fromModule: "m16", kind: "vocab" },
  { id: "kappu", kana: "カップ", romaji: "kappu", meaningEn: "cup", emoji: "🥤", fromModule: "m21", kind: "vocab" },
  { id: "karendaa", kana: "カレンダー", romaji: "karendaa", meaningEn: "calendar", emoji: "📅", fromModule: "future", kind: "vocab" },
  { id: "karee", kana: "カレー", romaji: "karee", meaningEn: "curry", emoji: "🍛", fromModule: "m22", kind: "vocab" },
  { id: "kiro--kiroguramu", kana: "キロ / キログラム", romaji: "kiro-/-kiroguramu", meaningEn: "kilogram", emoji: "⚖️", fromModule: "future", kind: "vocab", note: "balance scale as weight proxy" },
  { id: "kiro--kiromeetoru", kana: "キロ / キロメートル", romaji: "kiro-/-kiromeetoru", meaningEn: "kilometre", fromModule: "future", kind: "vocab", blocked: true, note: "unit of measure; no referent" },
  { id: "gitaa", kana: "ギター", romaji: "gitaa", meaningEn: "guitar", emoji: "🎸", fromModule: "future", kind: "vocab" },
  { id: "kurasu", kana: "クラス", romaji: "kurasu", meaningEn: "class", emoji: "🏫", fromModule: "m13", introducedByLessonId: "ja-m13-6-1", kind: "vocab", note: "school as class proxy" },
  { id: "guramu", kana: "グラム", romaji: "guramu", meaningEn: "gram", emoji: "⚖️", fromModule: "future", kind: "vocab", note: "scale = mass unit" },
  { id: "koppu", kana: "コップ", romaji: "koppu", meaningEn: "a glass", emoji: "🥛", fromModule: "m21", kind: "vocab", note: "glass of milk; closest" },
  { id: "kopiisuru", kana: "コピーする", romaji: "kopiisuru", meaningEn: "to copy", emoji: "📑", fromModule: "future", kind: "vocab", note: "stacked copies" },
  { id: "kooto", kana: "コート", romaji: "kooto", meaningEn: "coat, tennis court", emoji: "🧥", fromModule: "m6", introducedByLessonId: "ja-m6-kata", kind: "vocab", note: "coat (primary sense). SRS-attributed to m6 — the タ row closes コート (ト), taught alongside タクシー (spec §4.2). Unlocks on ja-m6-kata." },
  { id: "shatsu", kana: "シャツ", romaji: "shatsu", meaningEn: "shirt", emoji: "👕", fromModule: "future", kind: "vocab" },
  { id: "shawaa", kana: "シャワー", romaji: "shawaa", meaningEn: "shower", emoji: "🚿", fromModule: "m13", kind: "vocab" },
  { id: "sukaato", kana: "スカート", romaji: "sukaato", meaningEn: "skirt", emoji: "👗", fromModule: "future", kind: "vocab", note: "dress is closest Noto" },
  { id: "sutoobu", kana: "ストーブ", romaji: "sutoobu", meaningEn: "heater", emoji: "🔥", fromModule: "future", kind: "vocab", note: "fire — heater context; weak but concrete" },
  { id: "supuun", kana: "スプーン", romaji: "supuun", meaningEn: "spoon", emoji: "🥄", fromModule: "m21", kind: "vocab" },
  { id: "supootsu", kana: "スポーツ", romaji: "supootsu", meaningEn: "sport", emoji: "⚽", fromModule: "m15", kind: "vocab", note: "soccer ball as sport proxy" },
  { id: "surippa", kana: "スリッパ", romaji: "surippa", meaningEn: "slippers", emoji: "🥿", fromModule: "future", kind: "vocab", note: "flat shoe — closest slipper glyph" },
  { id: "zubon", kana: "ズボン", romaji: "zubon", meaningEn: "trousers", emoji: "👖", fromModule: "future", kind: "vocab" },
  { id: "seetaa", kana: "セーター", romaji: "seetaa", meaningEn: "sweater, jumper", emoji: "🧥", fromModule: "future", kind: "vocab" },
  { id: "zero", kana: "ゼロ", romaji: "zero", meaningEn: "zero", emoji: "0️⃣", fromModule: "future", kind: "vocab" },
  { id: "tesuto", kana: "テスト", romaji: "tesuto", meaningEn: "test", emoji: "📝", fromModule: "m6", introducedByLessonId: "ja-m6-kata", kind: "vocab", note: "memo. SRS-attributed to m6 — テ + ト (タ row) close テスト; ス already taught in the M5 サ row (spec §4.2). Unlocks on ja-m6-kata." },
  { id: "terebi", kana: "テレビ", romaji: "terebi", meaningEn: "television", emoji: "📺", fromModule: "m11", introducedByLessonId: "ja-m11-kata", kind: "vocab", note: "SRS-attributed to m11 — レ (ラ row) is テレビ's last base glyph (spec §4.2 known-safe move). Unlocks on ja-m11-kata." },
  { id: "teeburu", kana: "テーブル", romaji: "teeburu", meaningEn: "table", fromModule: "future", kind: "vocab", note: "no clean Noto table emoji; rely on custom art or phrase" },
  { id: "teepu", kana: "テープ", romaji: "teepu", meaningEn: "tape", emoji: "📼", fromModule: "future", kind: "vocab" },
  { id: "teepurekoodaa", kana: "テープレコーダー", romaji: "teepurekoodaa", meaningEn: "tape recorder", emoji: "📼", fromModule: "future", kind: "vocab", note: "videocassette — closest cassette glyph" },
  { id: "depaato", kana: "デパート", romaji: "depaato", meaningEn: "department store", emoji: "🏬", fromModule: "future", kind: "vocab" },
  { id: "doa", kana: "ドア", romaji: "doa", meaningEn: "Western style door", emoji: "🚪", fromModule: "m6", introducedByLessonId: "ja-m6-kata", kind: "vocab", note: "SRS-attributed to m6 — ド (タ row + dakuten) closes ドア; ア taught in the M3 ア row (spec §4.2). Unlocks on ja-m6-kata." },
  { id: "naifu", kana: "ナイフ", romaji: "naifu", meaningEn: "knife", emoji: "🔪", fromModule: "m8", introducedByLessonId: "ja-m8-kata", kind: "vocab", note: "SRS-attributed to m8 — フ (ハ row) is ナイフ's last base glyph (ナ from M7) (spec §4.2). Unlocks on ja-m8-kata." },
  { id: "nyuusu", kana: "ニュース", romaji: "nyuusu", meaningEn: "news", emoji: "📰", fromModule: "m7", introducedByLessonId: "ja-m7-kata", kind: "vocab", note: "newspaper as news proxy. SRS-attributed to m7 — the ナ row anchors ニュース (spec §4.2; ja-m7-kata teaches it). Unlocks on ja-m7-kata." },
  { id: "nekutai", kana: "ネクタイ", romaji: "nekutai", meaningEn: "tie, necktie", emoji: "👔", fromModule: "m7", introducedByLessonId: "ja-m7-kata", kind: "vocab", note: "SRS-attributed to m7 — ネ (ナ row) closes ネクタイ (ク M4, タ M6, イ M3) (spec §4.2). Unlocks on ja-m7-kata." },
  { id: "nooto", kana: "ノート", romaji: "nooto", meaningEn: "notebook, exercise book", emoji: "📓", fromModule: "m7", introducedByLessonId: "ja-m7-kata", kind: "vocab", note: "SRS-attributed to m7 — ノ (ナ row) closes ノート (ト M6) (spec §4.2). Unlocks on ja-m7-kata." },
  { id: "hankachi", kana: "ハンカチ", romaji: "hankachi", meaningEn: "handkerchief", emoji: "🧻", fromModule: "future", kind: "vocab", blocked: true, note: "no handkerchief glyph; toilet paper misreads" },
  { id: "bataa", kana: "バター", romaji: "bataa", meaningEn: "butter", emoji: "🧈", fromModule: "future", kind: "vocab" },
  { id: "firumu", kana: "フィルム", romaji: "firumu", meaningEn: "roll of film", emoji: "🎞️", fromModule: "future", kind: "vocab" },
  { id: "fooku", kana: "フォーク", romaji: "fooku", meaningEn: "fork", emoji: "🍴", fromModule: "m21", kind: "vocab" },
  { id: "puuru", kana: "プール", romaji: "puuru", meaningEn: "swimming pool", emoji: "🏊", fromModule: "future", kind: "vocab", note: "swimmer as pool cue" },
  { id: "beddo", kana: "ベッド", romaji: "beddo", meaningEn: "bed", emoji: "🛏️", fromModule: "future", kind: "vocab" },
  { id: "petto", kana: "ペット", romaji: "petto", meaningEn: "pet", emoji: "🐕", fromModule: "future", kind: "vocab", note: "dog as canonical pet" },
  { id: "peeji", kana: "ページ", romaji: "peeji", meaningEn: "page", emoji: "📄", fromModule: "future", kind: "vocab" },
  { id: "botan", kana: "ボタン", romaji: "botan", meaningEn: "button", emoji: "🔘", fromModule: "future", kind: "vocab", note: "radio button" },
  { id: "boorupen", kana: "ボールペン", romaji: "boorupen", meaningEn: "ball-point pen", emoji: "🖊️", fromModule: "future", kind: "vocab" },
  { id: "poketto", kana: "ポケット", romaji: "poketto", meaningEn: "pocket", emoji: "👖", fromModule: "future", kind: "vocab", note: "jeans as pocket proxy" },
  { id: "posuto", kana: "ポスト", romaji: "posuto", meaningEn: "post", emoji: "📮", fromModule: "m14", kind: "vocab", note: "postbox" },
  { id: "matchi", kana: "マッチ", romaji: "matchi", meaningEn: "match", emoji: "🔥", fromModule: "future", kind: "vocab", note: "fire as match-strike proxy (no match-stick emoji)" },
  { id: "meetoru", kana: "メートル", romaji: "meetoru", meaningEn: "metre", emoji: "📏", fromModule: "future", kind: "vocab", note: "ruler" },
  { id: "rajio", kana: "ラジオ", romaji: "rajio", meaningEn: "radio", emoji: "📻", fromModule: "m24", kind: "vocab" },
  { id: "rajikase--rajiokasetto", kana: "ラジカセ / ラジオカセット", romaji: "rajikase-/-rajiokasetto", meaningEn: "radio cassette player", emoji: "📻", fromModule: "future", kind: "vocab" },
  { id: "rekoodo", kana: "レコード", romaji: "rekoodo", meaningEn: "record", emoji: "💿", fromModule: "future", kind: "vocab", note: "optical disc; record-like" },
  { id: "waishatsu", kana: "ワイシャツ", romaji: "waishatsu", meaningEn: "business shirt", emoji: "👔", fromModule: "future", kind: "vocab", blocked: true, note: "necktie already used; collision risk" },
  { id: "oniisan", kana: "おにいさん", kanji: "お兄さん", romaji: "oniisan", meaningEn: "(honorable) older brother", emoji: "👨", fromModule: "m19", kind: "vocab", note: "man + kanji 兄" },
  { id: "oneesan", kana: "おねえさん", kanji: "お姉さん", romaji: "oneesan", meaningEn: "(honorable) older sister", emoji: "👩", fromModule: "m19", kind: "vocab", note: "woman; kanji 姉 carries 'older'" },
  { id: "obentou", kana: "おべんとう", kanji: "お弁当", romaji: "obentou", meaningEn: "boxed lunch", emoji: "🍱", fromModule: "m21", kind: "vocab" },
  { id: "otearai", kana: "おてあらい", kanji: "お手洗い", romaji: "otearai", meaningEn: "bathroom", emoji: "🚻", fromModule: "future", kind: "vocab" },
  { id: "okaasan", kana: "おかあさん", kanji: "お母さん", romaji: "okaasan", meaningEn: "(honorable) mother", emoji: "👩", fromModule: "m19", kind: "vocab", note: "woman; pair with phrase context" },
  { id: "otousan", kana: "おとうさん", kanji: "お父さん", romaji: "otousan", meaningEn: "(honorable) father", emoji: "👨", fromModule: "m19", kind: "vocab", blocked: true, note: "man glyph reads as 'man' not 'father'; rubric flags parent words" },
  { id: "osara", kana: "おさら", kanji: "お皿", romaji: "osara", meaningEn: "plate, dish", emoji: "🍽️", fromModule: "m21", kind: "vocab", note: "plate-with-utensils" },
  { id: "okashi", kana: "おかし", kanji: "お菓子", romaji: "okashi", meaningEn: "sweets, candy", emoji: "🍬", fromModule: "future", kind: "vocab" },
  { id: "ofuro", kana: "おふろ", kanji: "お風呂", romaji: "ofuro", meaningEn: "bath", emoji: "🛁", fromModule: "m13", kind: "vocab" },
  { id: "sarainen", kana: "さらいねん", kanji: "さ来年", romaji: "sarainen", meaningEn: "year after next", fromModule: "future", kind: "vocab", blocked: true, note: "temporal abstraction" },
  { id: "toriniku", kana: "とりにく", kanji: "とり肉", romaji: "toriniku", meaningEn: "chicken meat", emoji: "🍗", fromModule: "m21", kind: "vocab" },
  { id: "mouichido", kana: "もういちど", kanji: "もう一度", romaji: "mouichido", meaningEn: "again", emoji: "🔁", fromModule: "m11", kind: "vocab", note: "repeat arrow" },
  { id: "ichinichi", kana: "いちにち", kanji: "一日", romaji: "ichinichi", meaningEn: "(1) one day, (2) first of month", fromModule: "m20", kind: "vocab", blocked: true, note: "counter/date abstraction" },
  { id: "ototoshi", kana: "おととし", kanji: "一昨年", romaji: "ototoshi", meaningEn: "year before last", fromModule: "m10", kind: "vocab", blocked: true, note: "temporal abstraction" },
  { id: "ototoi", kana: "おととい", kanji: "一昨日", romaji: "ototoi", meaningEn: "day before yesterday", fromModule: "m10", kind: "vocab", blocked: true, note: "temporal abstraction" },
  { id: "hitotsuki", kana: "ひとつき", kanji: "一月", romaji: "hitotsuki", meaningEn: "one month", fromModule: "m13", introducedByLessonId: "ja-m13-2-2", kind: "vocab", blocked: true, note: "abstract duration; calendar reads as date not span" },
  { id: "issho", kana: "いっしょ", kanji: "一緒", romaji: "issho", meaningEn: "together", emoji: "👫", fromModule: "m23", kind: "vocab" },
  { id: "shichi", kana: "しち", kanji: "七", romaji: "shichi", meaningEn: "seven", emoji: "7️⃣", fromModule: "m13", kind: "vocab" },
  { id: "nanatsu", kana: "ななつ", kanji: "七つ", romaji: "nanatsu", meaningEn: "seven", emoji: "7️⃣", fromModule: "future", kind: "vocab" },
  { id: "nanoka", kana: "なのか", kanji: "七日", romaji: "nanoka", meaningEn: "seven days, the seventh day", fromModule: "future", kind: "vocab", blocked: true, note: "no ordinal-day glyph" },
  { id: "man", kana: "まん", kanji: "万", romaji: "man", meaningEn: "ten thousand", fromModule: "m14", kind: "vocab", blocked: true, note: "no glyph for 10000; ambiguous" },
  { id: "mannenhitsu", kana: "まんねんひつ", kanji: "万年筆", romaji: "mannenhitsu", meaningEn: "fountain pen", emoji: "🖋️", fromModule: "future", kind: "vocab", note: "fountain pen — exact match" },
  { id: "joubu", kana: "じょうぶ", kanji: "丈夫", romaji: "joubu", meaningEn: "strong, durable", emoji: "💪", fromModule: "m9", kind: "vocab", note: "flexed arm for strong/durable" },
  { id: "mikka", kana: "みっか", kanji: "三日", romaji: "mikka", meaningEn: "three days, third day of the month", fromModule: "future", kind: "vocab", blocked: true, note: "no glyph for ordinal day-3" },
  { id: "ageru", kana: "あげる", kanji: "上げる", romaji: "ageru", meaningEn: "to give", emoji: "🎁", fromModule: "future", kind: "vocab", note: "gift as giving cue" },
  { id: "jouzu", kana: "じょうず", kanji: "上手", romaji: "jouzu", meaningEn: "skillful", emoji: "👌", fromModule: "m9", kind: "vocab", note: "OK-hand as skillful cue" },
  { id: "uwagi", kana: "うわぎ", kanji: "上着", romaji: "uwagi", meaningEn: "jacket", emoji: "🧥", fromModule: "future", kind: "vocab" },
  { id: "shita", kana: "した", kanji: "下", romaji: "shita", meaningEn: "below", emoji: "⬇️", fromModule: "m17", introducedByLessonId: "ja-m17-8-1", kind: "vocab", note: "directional concrete" },
  { id: "heta", kana: "へた", kanji: "下手", romaji: "heta", meaningEn: "unskillful", emoji: "👎", fromModule: "m9", kind: "vocab", note: "thumbs down as unskillful proxy" },
  { id: "ryoushin", kana: "りょうしん", kanji: "両親", romaji: "ryoushin", meaningEn: "both parents", emoji: "👪", fromModule: "future", kind: "vocab", note: "family glyph implies parents" },
  { id: "narabu", kana: "ならぶ", kanji: "並ぶ", romaji: "narabu", meaningEn: "to line up, to stand in a line", fromModule: "future", kind: "vocab", blocked: true, note: "no single-glyph for line-up; abstract action" },
  { id: "naraberu", kana: "ならべる", kanji: "並べる", romaji: "naraberu", meaningEn: "to line up, to set up", emoji: "📊", fromModule: "future", kind: "vocab", blocked: true, note: "no clean glyph for 'arrange in a row'; risk of confusion" },
  { id: "naka", kana: "なか", kanji: "中", romaji: "naka", meaningEn: "inside", emoji: "🎯", fromModule: "m17", introducedByLessonId: "ja-m17-8-1", kind: "vocab", blocked: true, note: "bullseye reads as 'target' not 'middle'" },
  { id: "marui", kana: "まるい", kanji: "丸い / 円い", romaji: "marui", meaningEn: "round, circular", emoji: "⭕", fromModule: "future", kind: "vocab", note: "circle" },
  { id: "noru", kana: "のる", kanji: "乗る", romaji: "noru", meaningEn: "to get on, to ride", emoji: "🚗", fromModule: "m17", kind: "vocab", note: "car as ride proxy" },
  { id: "ku", kana: "く", kanji: "九", romaji: "ku", meaningEn: "nine", emoji: "9️⃣", fromModule: "future", kind: "vocab" },
  { id: "kokonotsu", kana: "ここのつ", kanji: "九つ", romaji: "kokonotsu", meaningEn: "nine", emoji: "9️⃣", fromModule: "future", kind: "vocab" },
  { id: "kokonoka", kana: "ここのか", kanji: "九日", romaji: "kokonoka", meaningEn: "nine days, ninth day", fromModule: "future", kind: "vocab", blocked: true, note: "no ordinal-day glyph" },
  { id: "hatsuka", kana: "はつか", kanji: "二十日", romaji: "hatsuka", meaningEn: "twenty days, twentieth", fromModule: "future", kind: "vocab", blocked: true, note: "day counter; abstract" },
  { id: "hatachi", kana: "はたち", kanji: "二十歳", romaji: "hatachi", meaningEn: "20 years old, 20th year", emoji: "🔞", fromModule: "future", kind: "vocab", note: "age-20 milestone; Japanese coming-of-age" },
  { id: "futsuka", kana: "ふつか", kanji: "二日", romaji: "futsuka", meaningEn: "two days, second day of the month", fromModule: "future", kind: "vocab", blocked: true, note: "day counter; abstract" },
  { id: "itsutsu", kana: "いつつ", kanji: "五つ", romaji: "itsutsu", meaningEn: "five", emoji: "5️⃣", fromModule: "future", kind: "vocab" },
  { id: "itsuka", kana: "いつか", kanji: "五日", romaji: "itsuka", meaningEn: "five days, fifth day", fromModule: "future", kind: "vocab", blocked: true, note: "day counter; abstract" },
  { id: "kousaten", kana: "こうさてん", kanji: "交差点", romaji: "kousaten", meaningEn: "intersection", emoji: "🚦", fromModule: "future", kind: "vocab", note: "traffic light for intersection" },
  { id: "kouban", kana: "こうばん", kanji: "交番", romaji: "kouban", meaningEn: "police box", emoji: "🚓", fromModule: "future", kind: "vocab", note: "police car; closest Noto for police context" },
  { id: "ima", kana: "いま", kanji: "今", romaji: "ima", meaningEn: "now", emoji: "⏰", fromModule: "m12", kind: "vocab", note: "clock = now/time" },
  { id: "kotoshi", kana: "ことし", kanji: "今年", romaji: "kotoshi", meaningEn: "this year", fromModule: "m18", kind: "vocab", blocked: true, note: "deictic time expression" },
  { id: "konban", kana: "こんばん", kanji: "今晩", romaji: "konban", meaningEn: "this evening", emoji: "🌃", fromModule: "future", kind: "vocab", note: "night scene as evening cue (loses 'this' nuance)" },
  { id: "kongetsu", kana: "こんげつ", kanji: "今月", romaji: "kongetsu", meaningEn: "this month", emoji: "📅", fromModule: "future", kind: "vocab", note: "calendar" },
  { id: "kesa", kana: "けさ", kanji: "今朝", romaji: "kesa", meaningEn: "this morning", emoji: "🌅", fromModule: "m10", kind: "vocab", note: "sunrise as morning cue (loses 'this' nuance — phrase context needed)" },
  { id: "konshuu", kana: "こんしゅう", kanji: "今週", romaji: "konshuu", meaningEn: "this week", fromModule: "m12", kind: "vocab", blocked: true, note: "temporal abstraction" },
  { id: "shigoto", kana: "しごと", kanji: "仕事", romaji: "shigoto", meaningEn: "job", emoji: "💼", fromModule: "m12", kind: "vocab" },
  { id: "yasumi", kana: "やすみ", kanji: "休み", romaji: "yasumi", meaningEn: "rest, holiday", emoji: "😴", fromModule: "m10", kind: "vocab", note: "sleeping face as rest proxy" },
  { id: "yasumu", kana: "やすむ", kanji: "休む", romaji: "yasumu", meaningEn: "to rest", emoji: "😴", fromModule: "future", kind: "vocab", note: "sleeping face — rest" },
  { id: "au", kana: "あう", kanji: "会う", romaji: "au", meaningEn: "to meet", emoji: "🤝", fromModule: "m25", kind: "vocab" },
  { id: "kaisha", kana: "かいしゃ", kanji: "会社", romaji: "kaisha", meaningEn: "company", emoji: "🏢", fromModule: "m7", introducedByLessonId: "ja-m7-neo-7", kind: "vocab", note: "office building" },
  { id: "obasan", kana: "おばさん", kanji: "伯母さん / 叔母さん", romaji: "obasan", meaningEn: "aunt", emoji: "👩", fromModule: "future", kind: "vocab", note: "woman; pair with phrase for aunt context" },
  { id: "ojiisan", kana: "おじいさん", kanji: "伯父 / 叔父", romaji: "ojiisan", meaningEn: "grandfather, male senior citizen", emoji: "👴", fromModule: "m19", kind: "vocab", note: "older man" },
  { id: "hikui", kana: "ひくい", kanji: "低い", romaji: "hikui", meaningEn: "short, low", emoji: "⬇️", fromModule: "future", kind: "vocab", note: "down arrow as low cue (weak; ⬆️ used for 上)" },
  { id: "sumu", kana: "すむ", kanji: "住む", romaji: "sumu", meaningEn: "to live in", emoji: "🏠", fromModule: "m15", kind: "vocab", note: "house as live-in cue" },
  { id: "tsukuru", kana: "つくる", kanji: "作る", romaji: "tsukuru", meaningEn: "to make", emoji: "🔨", fromModule: "m24", kind: "vocab", note: "hammer as making/building proxy" },
  { id: "sakubun", kana: "さくぶん", kanji: "作文", romaji: "sakubun", meaningEn: "composition, writing", emoji: "📝", fromModule: "future", kind: "vocab" },
  { id: "tsukau", kana: "つかう", kanji: "使う", romaji: "tsukau", meaningEn: "to use", emoji: "🔧", fromModule: "m29", introducedByLessonId: "ja-m29-1-1", kind: "vocab", note: "tools — using; upgraded from future 2026-07-16 (m29 plain-form pilot)" },
  { id: "benri", kana: "べんり", kanji: "便利", romaji: "benri", meaningEn: "useful, convenient", emoji: "🛠️", fromModule: "m9", kind: "vocab", note: "tools as useful proxy" },
  { id: "kariru", kana: "かりる", kanji: "借りる", romaji: "kariru", meaningEn: "to borrow", emoji: "🤝", fromModule: "future", kind: "vocab", note: "handshake as borrow/lend cue (weak but acceptable)" },
  { id: "hataraku", kana: "はたらく", kanji: "働く", romaji: "hataraku", meaningEn: "to work", emoji: "💼", fromModule: "m7", introducedByLessonId: "ja-m7-neo-7", kind: "vocab", note: "briefcase" },
  { id: "kyoudai", kana: "きょうだい", kanji: "兄弟", romaji: "kyoudai", meaningEn: "(humble) siblings", emoji: "👫", fromModule: "future", kind: "vocab", note: "two people; siblings" },
  { id: "saki", kana: "さき", kanji: "先", romaji: "saki", meaningEn: "the future, previous", fromModule: "m16", introducedByLessonId: "ja-m16-3-2", kind: "vocab", blocked: true, note: "abstract temporal/positional — no concrete referent" },
  { id: "sengetsu", kana: "せんげつ", kanji: "先月", romaji: "sengetsu", meaningEn: "last month", fromModule: "m10", kind: "vocab", blocked: true, note: "abstract time reference" },
  { id: "senshuu", kana: "せんしゅう", kanji: "先週", romaji: "senshuu", meaningEn: "last week", fromModule: "m10", kind: "vocab", blocked: true, note: "temporal abstraction" },
  { id: "hairu", kana: "はいる", kanji: "入る", romaji: "hairu", meaningEn: "to enter, to contain", emoji: "🚪", fromModule: "m16", kind: "vocab", note: "door as entering cue" },
  { id: "ireru", kana: "いれる", kanji: "入れる", romaji: "ireru", meaningEn: "to put in", emoji: "📥", fromModule: "future", kind: "vocab", note: "inbox tray = put in" },
  { id: "iriguchi", kana: "いりぐち", kanji: "入口", romaji: "iriguchi", meaningEn: "entrance", emoji: "🚪", fromModule: "future", kind: "vocab", note: "door + kanji 入" },
  { id: "zenbu", kana: "ぜんぶ", kanji: "全部", romaji: "zenbu", meaningEn: "all, everything", fromModule: "m29", introducedByLessonId: "ja-m29-2-2", kind: "vocab", blocked: true, note: "quantifier abstract; upgraded from future 2026-07-16 (m29 plain-form pilot)" },
  { id: "yattsu", kana: "やっつ", kanji: "八つ", romaji: "yattsu", meaningEn: "eight", emoji: "8️⃣", fromModule: "future", kind: "vocab" },
  { id: "youka", kana: "ようか", kanji: "八日", romaji: "youka", meaningEn: "eight days, eighth day of the month", fromModule: "future", kind: "vocab", blocked: true, note: "no ordinal-day glyph" },
  { id: "yaoya", kana: "やおや", kanji: "八百屋", romaji: "yaoya", meaningEn: "greengrocer", emoji: "🥬", fromModule: "future", kind: "vocab", note: "leafy greens stand-in for greengrocer" },
  { id: "muttsu", kana: "むっつ", kanji: "六つ", romaji: "muttsu", meaningEn: "six", emoji: "6️⃣", fromModule: "future", kind: "vocab" },
  { id: "muika", kana: "むいか", kanji: "六日", romaji: "muika", meaningEn: "six days, sixth day of the month", fromModule: "future", kind: "vocab", blocked: true, note: "date concept — no clean visual" },
  { id: "fuyu", kana: "ふゆ", kanji: "冬", romaji: "fuyu", meaningEn: "winter", emoji: "❄️", fromModule: "m18", kind: "vocab" },
  { id: "tsumetai", kana: "つめたい", kanji: "冷たい", romaji: "tsumetai", meaningEn: "cold to the touch", emoji: "🧊", fromModule: "m8", kind: "vocab", note: "ice cube" },
  { id: "reizouko", kana: "れいぞうこ", kanji: "冷蔵庫", romaji: "reizouko", meaningEn: "refrigerator", emoji: "🧊", fromModule: "future", kind: "vocab", note: "ice cube as cold-storage proxy" },
  { id: "dekakeru", kana: "でかける", kanji: "出かける", romaji: "dekakeru", meaningEn: "to go out", emoji: "🚶", fromModule: "m17", kind: "vocab", note: "person walking" },
  { id: "dasu", kana: "だす", kanji: "出す", romaji: "dasu", meaningEn: "to put out", emoji: "📤", fromModule: "future", kind: "vocab", note: "outbox tray as put-out cue" },
  { id: "deru", kana: "でる", kanji: "出る", romaji: "deru", meaningEn: "to appear, to leave", emoji: "🚪", fromModule: "future", kind: "vocab", note: "door — leave/exit" },
  { id: "deguchi", kana: "でぐち", kanji: "出口", romaji: "deguchi", meaningEn: "exit", emoji: "🚪", fromModule: "future", kind: "vocab", note: "door — paired w/ kanji 出" },
  { id: "wakaru", kana: "わかる", kanji: "分かる", romaji: "wakaru", meaningEn: "to be understood", shortGloss: "to understand", emoji: "💡", fromModule: "future", kind: "vocab", blocked: true, note: "lightbulb already used for 電気; understanding too abstract. shortGloss uses the learner-facing sense so tiles sit consistently beside わからない 'don't understand' (m6 walk 2026-07-23)" },
  { id: "kiru-cut", kana: "きる", kanji: "切る", romaji: "kiru", meaningEn: "to cut", emoji: "✂️", fromModule: "future", kind: "vocab" },
  { id: "kitte", kana: "きって", kanji: "切手", romaji: "kitte", meaningEn: "postage stamp", emoji: "📮", fromModule: "m14", kind: "vocab", note: "postbox; no stamp emoji in Noto" },
  { id: "hajime", kana: "はじめ", kanji: "初め / 始め", romaji: "hajime", meaningEn: "beginning", emoji: "🏁", fromModule: "future", kind: "vocab", note: "checkered flag — start" },
  { id: "hajimete", kana: "はじめて", kanji: "初めて", romaji: "hajimete", meaningEn: "for the first time", fromModule: "m25", introducedByLessonId: "ja-m25-4-2", kind: "vocab", blocked: true, note: "abstract adverb" },
  { id: "mae", kana: "まえ", kanji: "前", romaji: "mae", meaningEn: "before", fromModule: "m17", introducedByLessonId: "ja-m17-8-1", kind: "vocab", blocked: true, note: "polysemy: spatial 'in front' vs temporal 'before'; ambiguous" },
  { id: "benkyousuru", kana: "べんきょうする", kanji: "勉強", romaji: "benkyousuru", meaningEn: "to study", emoji: "📚", fromModule: "m10", kind: "vocab", note: "books" },
  { id: "doubutsu", kana: "どうぶつ", kanji: "動物", romaji: "doubutsu", meaningEn: "animal", emoji: "🐾", fromModule: "future", kind: "vocab", note: "paw prints as animal cue" },
  { id: "tsutomeru", kana: "つとめる", kanji: "勤める", romaji: "tsutomeru", meaningEn: "to work for someone", emoji: "💼", fromModule: "future", kind: "vocab", note: "briefcase as employment proxy" },
  { id: "kita", kana: "きた", kanji: "北", romaji: "kita", meaningEn: "north", emoji: "🧭", fromModule: "future", kind: "vocab", note: "compass for cardinal direction" },
  { id: "isha", kana: "いしゃ", kanji: "医者", romaji: "isha", meaningEn: "medical doctor", emoji: "👨‍⚕️", fromModule: "m20", kind: "vocab" },
  { id: "too", kana: "とお", kanji: "十", romaji: "too", meaningEn: "ten", emoji: "🔟", fromModule: "future", kind: "vocab" },
  { id: "tooka", kana: "とおか", kanji: "十日", romaji: "tooka", meaningEn: "ten days, the tenth day", fromModule: "future", kind: "vocab", blocked: true, note: "day counter; abstract" },
  { id: "sen", kana: "せん", kanji: "千", romaji: "sen", meaningEn: "thousand", fromModule: "m14", kind: "vocab", blocked: true, note: "no canonical emoji for 1000; ambiguous with 100" },
  { id: "gozen", kana: "ごぜん", kanji: "午前", romaji: "gozen", meaningEn: "morning", emoji: "🌅", fromModule: "m12", kind: "vocab", note: "sunrise" },
  { id: "gogo", kana: "ごご", kanji: "午後", romaji: "gogo", meaningEn: "afternoon", emoji: "🌇", fromModule: "m12", kind: "vocab", note: "late-day cityscape as afternoon cue" },
  { id: "han", kana: "はん", kanji: "半", romaji: "han", meaningEn: "half", emoji: "🌗", fromModule: "m12", kind: "vocab", note: "| swapped ½→🌗 (Noto has no fraction glyph; half-moon reads as 'half')" },
  { id: "hanbun", kana: "はんぶん", kanji: "半分", romaji: "hanbun", meaningEn: "half minute", emoji: "🌗", fromModule: "future", kind: "vocab", note: "half symbol | swapped ½→🌗 (Noto has no fraction glyph; half-moon reads as 'half')" },
  { id: "minami", kana: "みなみ", kanji: "南", romaji: "minami", meaningEn: "south", emoji: "⬇️", fromModule: "future", kind: "vocab", note: "down-arrow as south cue (map convention)" },
  { id: "abunai", kana: "あぶない", kanji: "危ない", romaji: "abunai", meaningEn: "dangerous", emoji: "⚠️", fromModule: "future", kind: "vocab" },
  { id: "tamago", kana: "たまご", kanji: "卵", romaji: "tamago", meaningEn: "egg", emoji: "🥚", fromModule: "m21", kind: "vocab" },
  { id: "atsui-kind", kana: "あつい", kanji: "厚い", romaji: "atsui", meaningEn: "kind, deep, thick", fromModule: "future", kind: "vocab", blocked: true, note: "polysemous abstract adjective" },
  { id: "kyonen", kana: "きょねん", kanji: "去年", romaji: "kyonen", meaningEn: "last year", fromModule: "m10", kind: "vocab", blocked: true, note: "abstract time reference; no visual referent" },
  { id: "toru", kana: "とる", kanji: "取る", romaji: "toru", meaningEn: "to take something", emoji: "🤲", fromModule: "m16", kind: "vocab", note: "open hands receiving" },
  { id: "kuchi", kana: "くち", kanji: "口", romaji: "kuchi", meaningEn: "mouth, opening", emoji: "👄", fromModule: "m20", kind: "vocab" },
  { id: "furui", kana: "ふるい", kanji: "古い", romaji: "furui", meaningEn: "old (not used for people)", emoji: "🏚️", fromModule: "m8", kind: "vocab", note: "derelict house — old" },
  { id: "daidokoro", kana: "だいどころ", kanji: "台所", romaji: "daidokoro", meaningEn: "kitchen", emoji: "🍳", fromModule: "future", kind: "vocab", note: "cooking pan stands in for kitchen" },
  { id: "migi", kana: "みぎ", kanji: "右", romaji: "migi", meaningEn: "right side", emoji: "➡️", fromModule: "m17", kind: "vocab" },
  { id: "onaji", kana: "おなじ", kanji: "同じ", romaji: "onaji", meaningEn: "same", emoji: "🟰", fromModule: "m22", kind: "vocab", note: "equals sign" },
  { id: "mukou", kana: "むこう", kanji: "向こう", romaji: "mukou", meaningEn: "over there", fromModule: "m17", kind: "vocab", blocked: true, note: "spatial demonstrative" },
  { id: "suu", kana: "すう", kanji: "吸う", romaji: "suu", meaningEn: "to smoke, to suck", emoji: "🚬", fromModule: "m16", kind: "vocab", note: "cigarette as smoke cue" },
  { id: "fuku", kana: "ふく", kanji: "吹く", romaji: "fuku", meaningEn: "to blow", emoji: "💨", fromModule: "future", kind: "vocab", note: "wind-puff as blowing cue" },
  { id: "yobu", kana: "よぶ", kanji: "呼ぶ", romaji: "yobu", meaningEn: "to call out, to invite", emoji: "📣", fromModule: "future", kind: "vocab", note: "megaphone as call-out cue" },
  { id: "saku", kana: "さく", kanji: "咲く", romaji: "saku", meaningEn: "to bloom", emoji: "🌷", fromModule: "future", kind: "vocab", note: "tulip; avoid 🌸 per rubric (cherry blossom specific)" },
  { id: "mondai", kana: "もんだい", kanji: "問題", romaji: "mondai", meaningEn: "problem", emoji: "❓", fromModule: "future", kind: "vocab", note: "question mark as problem proxy" },
  { id: "kissaten", kana: "きっさてん", kanji: "喫茶店", romaji: "kissaten", meaningEn: "coffee lounge", emoji: "☕", fromModule: "m13", kind: "vocab", note: "coffee cup; café" },
  // BLOCKED 2026-07-27 (m13-neo authoring). し is a ONE-KANA surface, so the
  // invariant-30 guard's substring scan matched it inside したい / わたし /
  // おいしい and demanded a picture debut in every module tagged m13 — for a
  // reading the neo course never teaches (m9 teaches よん, not し). A 4️⃣ MCQ
  // whose answer is the bare kana し is also genuinely ambiguous against the
  // kana ladder. `blocked` is exactly the "no image MCQ" flag; nothing else
  // about the atom changes.
  { id: "shi", kana: "し", kanji: "四", romaji: "shi", meaningEn: "four", emoji: "4️⃣", fromModule: "m13", kind: "vocab", blocked: true },
  { id: "yottsu", kana: "よっつ", kanji: "四つ", romaji: "yottsu", meaningEn: "four", emoji: "4️⃣", fromModule: "future", kind: "vocab" },
  { id: "yokka", kana: "よっか", kanji: "四日", romaji: "yokka", meaningEn: "four days, fouth day of the month", emoji: "4️⃣", fromModule: "future", kind: "vocab", note: "number 4" },
  { id: "komaru", kana: "こまる", kanji: "困る", romaji: "komaru", meaningEn: "to be worried", emoji: "😟", fromModule: "m26", kind: "vocab", note: "worried face" },
  { id: "kuni", kana: "くに", kanji: "国", romaji: "kuni", meaningEn: "country", emoji: "🗾", fromModule: "future", kind: "vocab", note: "Japan map as country cue (concrete shape)" },
  { id: "doyoubi", kana: "どようび", kanji: "土曜日", romaji: "doyoubi", meaningEn: "Saturday", emoji: "📅", fromModule: "m12", kind: "vocab", note: "generic calendar" },
  { id: "chizu", kana: "ちず", kanji: "地図", romaji: "chizu", meaningEn: "map", emoji: "🗺️", fromModule: "future", kind: "vocab" },
  { id: "shio", kana: "しお", kanji: "塩", romaji: "shio", meaningEn: "salt", emoji: "🧂", fromModule: "future", kind: "vocab" },
  { id: "uru", kana: "うる", kanji: "売る", romaji: "uru", meaningEn: "to sell", emoji: "🏷️", fromModule: "future", kind: "vocab", note: "price tag as sell proxy" },
  { id: "natsu", kana: "なつ", kanji: "夏", romaji: "natsu", meaningEn: "summer", emoji: "🌻", fromModule: "m18", kind: "vocab", note: "sunflower as summer cue (☀️ taken for warm)" },
  { id: "natsuyasumi", kana: "なつやすみ", kanji: "夏休み", romaji: "natsuyasumi", meaningEn: "summer holiday", emoji: "🏖️", fromModule: "m13", kind: "vocab" },
  { id: "yuugata", kana: "ゆうがた", kanji: "夕方", romaji: "yuugata", meaningEn: "evening", emoji: "🌇", fromModule: "m12", kind: "vocab", note: "sunset over buildings" },
  { id: "yuuhan", kana: "ゆうはん", kanji: "夕飯", romaji: "yuuhan", meaningEn: "dinner", emoji: "🍽️", fromModule: "future", kind: "vocab" },
  { id: "soto", kana: "そと", kanji: "外", romaji: "soto", meaningEn: "outside", emoji: "🌳", fromModule: "m13", kind: "vocab", note: "tree = outdoors" },
  { id: "gaikoku", kana: "がいこく", kanji: "外国", romaji: "gaikoku", meaningEn: "foreign country", emoji: "🌏", fromModule: "m25", kind: "vocab", note: "globe as foreign-country cue" },
  { id: "gaikokujin", kana: "がいこくじん", kanji: "外国人", romaji: "gaikokujin", meaningEn: "foreigner", emoji: "🌍", fromModule: "future", kind: "vocab", note: "globe — foreign/abroad" },
  { id: "ooi", kana: "おおい", kanji: "多い", romaji: "ooi", meaningEn: "many", fromModule: "m22", introducedByLessonId: "ja-m22-2-2", kind: "vocab", blocked: true, note: "abstract quantifier; no canonical referent" },
  { id: "yoru", kana: "よる", kanji: "夜", romaji: "yoru", meaningEn: "evening, night", emoji: "🌙", fromModule: "m12", kind: "vocab" },
  { id: "ookii", kana: "おおきい", kanji: "大きい", romaji: "ookii", meaningEn: "big", emoji: "🐘", fromModule: "m8", kind: "vocab", note: "elephant = big (size adjective)" },
  { id: "ookina", kana: "おおきな", kanji: "大きな", romaji: "ookina", meaningEn: "big", emoji: "🐘", fromModule: "m9", kind: "vocab", note: "elephant as big proxy" },
  { id: "daijoubu", kana: "だいじょうぶ", kanji: "大丈夫", romaji: "daijoubu", meaningEn: "all right", emoji: "👌", fromModule: "m9", kind: "vocab", note: "OK sign" },
  { id: "otona", kana: "おとな", kanji: "大人", romaji: "otona", meaningEn: "adult", emoji: "🧑", fromModule: "m19", kind: "vocab" },
  { id: "taishikan", kana: "たいしかん", kanji: "大使館", romaji: "taishikan", meaningEn: "embassy", emoji: "🏛️", fromModule: "future", kind: "vocab", note: "classical building as embassy cue" },
  { id: "taisetsu", kana: "たいせつ", kanji: "大切", romaji: "taisetsu", meaningEn: "important", emoji: "❗", fromModule: "m27", kind: "vocab", note: "exclamation as importance cue" },
  { id: "oozei", kana: "おおぜい", kanji: "大勢", romaji: "oozei", meaningEn: "great number of people", emoji: "👨‍👩‍👧‍👦", fromModule: "future", kind: "vocab", note: "family cluster = many people" },
  { id: "daisuki", kana: "だいすき", kanji: "大好き", romaji: "daisuki", meaningEn: "to be very likeable", emoji: "❤️", fromModule: "future", kind: "vocab", note: "heart as love cue" },
  { id: "daigaku", kana: "だいがく", kanji: "大学", romaji: "daigaku", meaningEn: "university", emoji: "🎓", fromModule: "m19", kind: "vocab", note: "graduation cap" },
  { id: "tenki", kana: "てんき", kanji: "天気", romaji: "tenki", meaningEn: "weather", emoji: "⛅", fromModule: "m18", kind: "vocab", note: "sun-behind-cloud as generic weather cue" },
  { id: "futoi", kana: "ふとい", kanji: "太い", romaji: "futoi", meaningEn: "fat", fromModule: "future", kind: "vocab", blocked: true, note: "polysemy fat/thick; person-emoji reads as body-shape; risky" },
  { id: "okusan", kana: "おくさん", kanji: "奥さん", romaji: "okusan", meaningEn: "(honorable) wife", emoji: "👰", fromModule: "future", kind: "vocab", note: "bride stands in for wife" },
  { id: "onna", kana: "おんな", kanji: "女", romaji: "onna", meaningEn: "woman", emoji: "👩", fromModule: "m19", kind: "vocab" },
  { id: "onnanoko", kana: "おんなのこ", kanji: "女の子", romaji: "onnanoko", meaningEn: "girl", emoji: "👧", fromModule: "m19", kind: "vocab" },
  { id: "suki", kana: "すき", kanji: "好き", romaji: "suki", meaningEn: "likeable", emoji: "❤️", fromModule: "m9", kind: "vocab", note: "heart" },
  { id: "imouto", kana: "いもうと", kanji: "妹", romaji: "imouto", meaningEn: "(humble) younger sister", emoji: "👧", fromModule: "m19", kind: "vocab", note: "younger-girl approximation; sister relation context-dependent" },
  { id: "hajimaru", kana: "はじまる", kanji: "始まる", romaji: "hajimaru", meaningEn: "to begin", emoji: "▶️", fromModule: "future", kind: "vocab", note: "play button as start proxy" },
  { id: "iya", kana: "いや", kanji: "嫌", romaji: "iya", meaningEn: "unpleasant", emoji: "🤢", fromModule: "future", kind: "vocab", note: "disgust face = unpleasant" },
  { id: "kirai", kana: "きらい", kanji: "嫌い", romaji: "kirai", meaningEn: "hate", emoji: "🙅", fromModule: "m9", kind: "vocab", note: "person gesturing no" },
  { id: "kodomo", kana: "こども", kanji: "子供", romaji: "kodomo", meaningEn: "child", emoji: "🧒", fromModule: "m19", kind: "vocab" },
  { id: "jibiki", kana: "じびき", kanji: "字引", romaji: "jibiki", meaningEn: "dictionary", emoji: "📖", fromModule: "future", kind: "vocab", note: "open book" },
  { id: "yasui", kana: "やすい", kanji: "安い", romaji: "yasui", meaningEn: "cheap", emoji: "🪙", fromModule: "m8", kind: "vocab", note: "coin as cheap/small-money proxy" },
  { id: "katei", kana: "かてい", kanji: "家庭", romaji: "katei", meaningEn: "household", emoji: "🏠", fromModule: "future", kind: "vocab", note: "house" },
  { id: "shukudai", kana: "しゅくだい", kanji: "宿題", romaji: "shukudai", meaningEn: "homework", emoji: "📝", fromModule: "m16", kind: "vocab" },
  { id: "samui", kana: "さむい", kanji: "寒い", romaji: "samui", meaningEn: "cold", emoji: "🥶", fromModule: "m8", kind: "vocab", note: "cold face" },
  { id: "neru", kana: "ねる", kanji: "寝る", romaji: "neru", meaningEn: "to go to bed, to sleep", emoji: "🛏️", fromModule: "m17", kind: "vocab", note: "bed" },
  { id: "fuutou", kana: "ふうとう", kanji: "封筒", romaji: "fuutou", meaningEn: "envelope", emoji: "✉️", fromModule: "m14", kind: "vocab" },
  { id: "chiisai", kana: "ちいさい", kanji: "小さい", romaji: "chiisai", meaningEn: "little", fromModule: "m8", kind: "vocab", blocked: true, note: "abstract adjective; no canonical referent" },
  { id: "chiisana", kana: "ちいさな", kanji: "小さな", romaji: "chiisana", meaningEn: "little", fromModule: "future", kind: "vocab", blocked: true, note: "prenominal adjective; abstract size, no referent" },
  { id: "sukoshi", kana: "すこし", kanji: "少し", romaji: "sukoshi", meaningEn: "few", emoji: "🤏", fromModule: "m9", kind: "vocab", note: "pinching hand as small-amount proxy" },
  { id: "sukunai", kana: "すくない", kanji: "少ない", romaji: "sukunai", meaningEn: "a few", fromModule: "m22", introducedByLessonId: "ja-m22-3-2", kind: "vocab", blocked: true, note: "abstract quantifier" },
  { id: "iru-be", kana: "いる", kanji: "居る", romaji: "iru", meaningEn: "to be, to have (used for people and animals)", fromModule: "m11", introducedByLessonId: "ja-m11-4-1", kind: "vocab", blocked: true, note: "existence-of — rubric explicit block" },
  { id: "hidari", kana: "ひだり", kanji: "左", romaji: "hidari", meaningEn: "left hand side", emoji: "👈", fromModule: "m17", kind: "vocab" },
  { id: "sasu", kana: "さす", kanji: "差す", romaji: "sasu", meaningEn: "to stretch out hands, to raise an umbrella", fromModule: "future", kind: "vocab", blocked: true, note: "polysemous action verb" },
  { id: "kaeru", kana: "かえる", kanji: "帰る", romaji: "kaeru", meaningEn: "to go back", emoji: "🏠", fromModule: "m14", kind: "vocab", note: "home as return-destination cue" },
  { id: "toshi", kana: "とし", kanji: "年", romaji: "toshi", meaningEn: "year", emoji: "📅", fromModule: "m11", kind: "vocab", note: "calendar as year proxy" },
  { id: "hiroi", kana: "ひろい", kanji: "広い", romaji: "hiroi", meaningEn: "spacious, wide", emoji: "🏜️", fromModule: "m8", kind: "vocab", note: "open desert as spacious cue (weak)" },
  { id: "suwaru", kana: "すわる", kanji: "座る", romaji: "suwaru", meaningEn: "to sit", emoji: "🪑", fromModule: "m16", kind: "vocab", note: "chair as sitting proxy" },
  { id: "niwa", kana: "にわ", kanji: "庭", romaji: "niwa", meaningEn: "garden", emoji: "🌳", fromModule: "m18", kind: "vocab", note: "tree as garden proxy" },
  { id: "rouka", kana: "ろうか", kanji: "廊下", romaji: "rouka", meaningEn: "corridor", fromModule: "m16", kind: "vocab", blocked: true, note: "no corridor emoji in Noto" },
  { id: "tatemono", kana: "たてもの", kanji: "建物", romaji: "tatemono", meaningEn: "building", emoji: "🏢", fromModule: "m17", kind: "vocab" },
  { id: "hiku", kana: "ひく", kanji: "引く", romaji: "hiku", meaningEn: "to pull", emoji: "🪝", fromModule: "m20", kind: "vocab", note: "hook implies pulling" },
  { id: "otouto", kana: "おとうと", kanji: "弟", romaji: "otouto", meaningEn: "younger brother", emoji: "👦", fromModule: "m19", kind: "vocab", note: "boy reads younger-male; pair w/ kanji" },
  { id: "yowai", kana: "よわい", kanji: "弱い", romaji: "yowai", meaningEn: "weak", emoji: "🪶", fromModule: "m18", kind: "vocab", note: "feather connotes weak/light" },
  { id: "tsuyoi", kana: "つよい", kanji: "強い", romaji: "tsuyoi", meaningEn: "powerful", emoji: "💪", fromModule: "m27", kind: "vocab", note: "flexed bicep" },
  { id: "hiku-play", kana: "ひく", kanji: "弾く", romaji: "hiku", meaningEn: "to play an instrument with strings, including piano", emoji: "🎹", fromModule: "future", kind: "vocab", note: "piano keys" },
  { id: "matsu", kana: "まつ", kanji: "待つ", romaji: "matsu", meaningEn: "to wait", emoji: "⏳", fromModule: "m14", kind: "vocab", note: "hourglass" },
  { id: "ato", kana: "あと", kanji: "後", romaji: "ato", meaningEn: "afterwards", fromModule: "m13", introducedByLessonId: "ja-m13-6-2", kind: "vocab", blocked: true, note: "abstract temporal adverb" },
  { id: "ushiro", kana: "うしろ", kanji: "後ろ", romaji: "ushiro", meaningEn: "behind", emoji: "⬅️", fromModule: "m17", introducedByLessonId: "ja-m17-8-1", kind: "vocab", blocked: true, note: "spatial relation; arrow ambiguous with left" },
  { id: "wasureru", kana: "わすれる", kanji: "忘れる", romaji: "wasureru", meaningEn: "to forget", emoji: "🤔", fromModule: "m26", kind: "vocab", note: "thinking face as memory-lapse cue (weak)" },
  { id: "isogashii", kana: "いそがしい", kanji: "忙しい", romaji: "isogashii", meaningEn: "busy, irritated", emoji: "😰", fromModule: "m15", kind: "vocab", note: "anxious sweat = busy/overwhelmed" },
  { id: "warui", kana: "わるい", kanji: "悪い", romaji: "warui", meaningEn: "bad", emoji: "👎", fromModule: "m8", kind: "vocab" },
  { id: "imi", kana: "いみ", kanji: "意味", romaji: "imi", meaningEn: "meaning", fromModule: "m26", introducedByLessonId: "ja-m26-5-1", kind: "vocab", blocked: true, note: "abstract noun — per rubric" },
  { id: "to", kana: "と", kanji: "戸", romaji: "to", meaningEn: "Japanese style door", emoji: "🚪", fromModule: "future", kind: "vocab" },
  { id: "tokoro", kana: "ところ", kanji: "所", romaji: "tokoro", meaningEn: "place", fromModule: "m9", introducedByLessonId: "ja-m9-1-2", kind: "vocab", blocked: true, note: "abstract noun (per rubric: ところ explicitly flagged)" },
  { id: "te", kana: "て", kanji: "手", romaji: "te", meaningEn: "hand", emoji: "✋", fromModule: "m20", kind: "vocab" },
  { id: "osu", kana: "おす", kanji: "押す", romaji: "osu", meaningEn: "to push, to stamp something", emoji: "👆", fromModule: "future", kind: "vocab", note: "pointing/pushing finger" },
  { id: "motsu", kana: "もつ", kanji: "持つ", romaji: "motsu", meaningEn: "to hold", emoji: "✊", fromModule: "m15", kind: "vocab", note: "fist as holding cue" },
  { id: "soujisuru", kana: "そうじする", kanji: "掃除", romaji: "soujisuru", meaningEn: "to clean, to sweep", emoji: "🧹", fromModule: "future", kind: "vocab", note: "broom" },
  { id: "jugyou", kana: "じゅぎょう", kanji: "授業", romaji: "jugyou", meaningEn: "lesson, class work", emoji: "👨‍🏫", fromModule: "m7", introducedByLessonId: "ja-m7-neo-7", kind: "vocab", note: "teacher as class cue" },
  { id: "toru-take", kana: "とる", kanji: "撮る", romaji: "toru", meaningEn: "to take a photo or record a film", emoji: "📸", fromModule: "m16", kind: "vocab", note: "camera with flash" },
  { id: "oshieru", kana: "おしえる", kanji: "教える", romaji: "oshieru", meaningEn: "to teach, to tell", emoji: "👨‍🏫", fromModule: "m14", kind: "vocab", note: "teacher ZWJ glyph" },
  { id: "kyoushitsu", kana: "きょうしつ", kanji: "教室", romaji: "kyoushitsu", meaningEn: "classroom", emoji: "🏫", fromModule: "m16", kind: "vocab", note: "school; closest concrete" },
  { id: "sanposuru", kana: "さんぽする", kanji: "散歩", romaji: "sanposuru", meaningEn: "to stroll", emoji: "🚶", fromModule: "future", kind: "vocab" },
  { id: "bunshou", kana: "ぶんしょう", kanji: "文章", romaji: "bunshou", meaningEn: "sentence, text", emoji: "📝", fromModule: "future", kind: "vocab" },
  { id: "atarashii", kana: "あたらしい", kanji: "新しい", romaji: "atarashii", meaningEn: "new", emoji: "🆕", fromModule: "m8", kind: "vocab" },
  { id: "kata", kana: "かた", kanji: "方", romaji: "kata", meaningEn: "person, way of doing", fromModule: "m19", introducedByLessonId: "ja-m19-4-2", kind: "vocab", blocked: true, note: "polysemous abstract noun (per rubric)" },
  { id: "ryokou", kana: "りょこう", kanji: "旅行", romaji: "ryokou", meaningEn: "travel", emoji: "✈️", fromModule: "m15", kind: "vocab" },
  { id: "nichiyoubi", kana: "にちようび", kanji: "日曜日", romaji: "nichiyoubi", meaningEn: "Sunday", emoji: "📅", fromModule: "m12", kind: "vocab", note: "generic calendar" },
  { id: "hayai-early", kana: "はやい", kanji: "早い", romaji: "hayai", meaningEn: "early", emoji: "⏰", fromModule: "m12", kind: "vocab", note: "alarm clock for early" },
  { id: "akarui", kana: "あかるい", kanji: "明い", romaji: "akarui", meaningEn: "bright", emoji: "💡", fromModule: "future", kind: "vocab", note: "lightbulb" },
  { id: "ashita", kana: "あした", kanji: "明日", romaji: "ashita", meaningEn: "tomorrow", fromModule: "m12", kind: "vocab", blocked: true, note: "abstract time reference" },
  { id: "yasashii", kana: "やさしい", kanji: "易しい", romaji: "yasashii", meaningEn: "easy, simple", fromModule: "m8", kind: "vocab", blocked: true, note: "abstract adjective; homophone with 'kind' increases ambiguity" },
  { id: "eiga", kana: "えいが", kanji: "映画", romaji: "eiga", meaningEn: "movie", emoji: "🎬", fromModule: "m15", kind: "vocab" },
  { id: "eigakan", kana: "えいがかん", kanji: "映画館", romaji: "eigakan", meaningEn: "cinema", emoji: "🎦", fromModule: "future", kind: "vocab" },
  { id: "haru", kana: "はる", kanji: "春", romaji: "haru", meaningEn: "spring", emoji: "🌸", fromModule: "m18", kind: "vocab", note: "cherry blossom = spring" },
  { id: "yuube", kana: "ゆうべ", kanji: "昨夜", romaji: "yuube", meaningEn: "last night", emoji: "🌙", fromModule: "m10", kind: "vocab", note: "crescent moon" },
  { id: "kinou", kana: "きのう", kanji: "昨日", romaji: "kinou", meaningEn: "yesterday", emoji: "📅", fromModule: "m10", kind: "vocab", note: "calendar; pair with phrase" },
  { id: "hiru", kana: "ひる", kanji: "昼", romaji: "hiru", meaningEn: "noon, daytime", emoji: "☀️", fromModule: "m12", kind: "vocab", note: "sun = daytime" },
  { id: "hirugohan", kana: "ひるごはん", kanji: "昼御飯", romaji: "hirugohan", meaningEn: "midday meal", emoji: "🍱", fromModule: "m11", kind: "vocab", note: "bento reads as midday meal" },
  { id: "tokidoki", kana: "ときどき", kanji: "時々", romaji: "tokidoki", meaningEn: "sometimes", fromModule: "m11", kind: "vocab", blocked: true, note: "frequency adverb" },
  { id: "ban", kana: "ばん", kanji: "晩", romaji: "ban", meaningEn: "evening", emoji: "🌆", fromModule: "m12", kind: "vocab" },
  { id: "bangohan", kana: "ばんごはん", kanji: "晩御飯", romaji: "bangohan", meaningEn: "evening meal", emoji: "🍱", fromModule: "m23", introducedByLessonId: "ja-m23-2-2", kind: "vocab", note: "bento meal. introducedByLessonId pinned 2026-07-01: paatii's static entry on ja-m23-2-2 suppresses that lesson's fallback unlock path, and this was the only lesson surfacing ばんごはん." },
  { id: "hare", kana: "はれ", kanji: "晴れ", romaji: "hare", meaningEn: "clear weather", emoji: "☀️", fromModule: "m18", kind: "vocab", note: "sun" },
  { id: "hareru", kana: "はれる", kanji: "晴れる", romaji: "hareru", meaningEn: "to be sunny", emoji: "🌞", fromModule: "future", kind: "vocab" },
  { id: "hima", kana: "ひま", kanji: "暇", romaji: "hima", meaningEn: "free time", emoji: "🛋️", fromModule: "m9", kind: "vocab", note: "couch = leisure/free time" },
  { id: "atsui", kana: "あつい", kanji: "暑い", romaji: "atsui", meaningEn: "hot", emoji: "🥵", fromModule: "m8", kind: "vocab", note: "hot face" },
  { id: "atatakai", kana: "あたたかい", kanji: "暖かい", romaji: "atatakai", meaningEn: "warm", emoji: "☀️", fromModule: "m18", kind: "vocab", note: "sun as warmth cue" },
  { id: "kurai", kana: "くらい", kanji: "暗い", romaji: "kurai", meaningEn: "gloomy", emoji: "🌑", fromModule: "m27", kind: "vocab", note: "new moon = dark" },
  { id: "kumori", kana: "くもり", kanji: "曇り", romaji: "kumori", meaningEn: "cloudy weather", emoji: "☁️", fromModule: "m18", kind: "vocab" },
  { id: "kumoru", kana: "くもる", kanji: "曇る", romaji: "kumoru", meaningEn: "to become cloudy, to become dim", emoji: "☁️", fromModule: "future", kind: "vocab", note: "cloud — also used for 空 sky, mild collision" },
  { id: "magaru", kana: "まがる", kanji: "曲る", romaji: "magaru", meaningEn: "to turn, to bend", emoji: "↩️", fromModule: "m17", kind: "vocab", note: "curved arrow" },
  { id: "getsuyoubi", kana: "げつようび", kanji: "月曜日", romaji: "getsuyoubi", meaningEn: "Monday", emoji: "📅", fromModule: "m12", kind: "vocab", note: "calendar" },
  { id: "yuumei", kana: "ゆうめい", kanji: "有名", romaji: "yuumei", meaningEn: "famous", emoji: "⭐", fromModule: "m9", kind: "vocab", note: "star as fame cue" },
  { id: "fuku-clothes", kana: "ふく", kanji: "服", romaji: "fuku", meaningEn: "clothes", emoji: "👕", fromModule: "m13", kind: "vocab", note: "t-shirt" },
  { id: "asagohan", kana: "あさごはん", kanji: "朝御飯", romaji: "asagohan", meaningEn: "breakfast", emoji: "🍳", fromModule: "m16", kind: "vocab", note: "fried egg — also used for 台所; mild collision" },
  { id: "ki", kana: "き", kanji: "木", romaji: "ki", meaningEn: "tree, wood", emoji: "🌳", fromModule: "m18", kind: "vocab" },
  { id: "mokuyoubi", kana: "もくようび", kanji: "木曜日", romaji: "mokuyoubi", meaningEn: "Thursday", fromModule: "m12", kind: "vocab", blocked: true, note: "day-of-week label; needs text not image" },
  { id: "hondana", kana: "ほんだな", kanji: "本棚", romaji: "hondana", meaningEn: "bookshelves", emoji: "📚", fromModule: "future", kind: "vocab", note: "stacked books" },
  { id: "mura", kana: "むら", kanji: "村", romaji: "mura", meaningEn: "village", emoji: "🏘️", fromModule: "future", kind: "vocab" },
  { id: "kuru", kana: "くる", kanji: "来る", romaji: "kuru", meaningEn: "to come", fromModule: "m11", kind: "vocab", blocked: true, note: "directional verb; arrow ambiguous with go/return" },
  { id: "rainen", kana: "らいねん", kanji: "来年", romaji: "rainen", meaningEn: "next year", emoji: "📅", fromModule: "m25", kind: "vocab", note: "calendar; pair with phrase context" },
  { id: "raigetsu", kana: "らいげつ", kanji: "来月", romaji: "raigetsu", meaningEn: "next month", fromModule: "m25", kind: "vocab", blocked: true, note: "temporal abstraction" },
  { id: "raishuu", kana: "らいしゅう", kanji: "来週", romaji: "raishuu", meaningEn: "next week", fromModule: "m18", kind: "vocab", blocked: true, note: "deictic time expression" },
  { id: "higashi", kana: "ひがし", kanji: "東", romaji: "higashi", meaningEn: "east", emoji: "🧭", fromModule: "future", kind: "vocab", blocked: true, note: "compass already used for 西; can't distinguish east vs west via emoji" },
  { id: "kudamono", kana: "くだもの", kanji: "果物", romaji: "kudamono", meaningEn: "fruit", emoji: "🍎", fromModule: "m22", kind: "vocab", note: "apple as fruit cue" },
  { id: "tanoshii", kana: "たのしい", kanji: "楽しい", romaji: "tanoshii", meaningEn: "enjoyable", emoji: "😄", fromModule: "m15", kind: "vocab" },
  { id: "yoko", kana: "よこ", kanji: "横", romaji: "yoko", meaningEn: "beside, side, width", emoji: "↔️", fromModule: "m17", introducedByLessonId: "ja-m17-8-1", kind: "vocab", note: "horizontal arrow for side/width" },
  { id: "hashi-bridge", kana: "はし", kanji: "橋", romaji: "hashi", meaningEn: "bridge", emoji: "🌉", fromModule: "m17", kind: "vocab" },
  { id: "tsugi", kana: "つぎ", kanji: "次", romaji: "tsugi", meaningEn: "next", fromModule: "m13", introducedByLessonId: "ja-m13-6-2", kind: "vocab", blocked: true, note: "abstract ordinal/temporal — no concrete referent" },
  { id: "hoshii", kana: "ほしい", kanji: "欲しい", romaji: "hoshii", meaningEn: "want", emoji: "🤲", fromModule: "m15", kind: "vocab", note: "cupped hands as wanting cue (weak)" },
  { id: "utau", kana: "うたう", kanji: "歌う", romaji: "utau", meaningEn: "to sing", emoji: "🎤", fromModule: "m23", kind: "vocab", note: "microphone" },
  { id: "tomaru", kana: "とまる", kanji: "止まる", romaji: "tomaru", meaningEn: "to come to a halt", emoji: "🛑", fromModule: "m17", kind: "vocab" },
  { id: "aruku", kana: "あるく", kanji: "歩く", romaji: "aruku", meaningEn: "to walk", emoji: "🚶", fromModule: "m17", kind: "vocab" },
  { id: "ha", kana: "は", kanji: "歯", romaji: "ha", meaningEn: "tooth", emoji: "🦷", fromModule: "m20", kind: "vocab" },
  { id: "shinu", kana: "しぬ", kanji: "死ぬ", romaji: "shinu", meaningEn: "to die", emoji: "💀", fromModule: "future", kind: "vocab" },
  { id: "maitoshi", kana: "まいとし", kanji: "毎年", romaji: "maitoshi", meaningEn: "every year", fromModule: "m11", kind: "vocab", blocked: true, note: "abstract time interval" },
  { id: "mainen", kana: "まいねん", kanji: "毎年", romaji: "mainen", meaningEn: "every year", fromModule: "future", kind: "vocab", blocked: true, note: "abstract time interval" },
  { id: "mainichi", kana: "まいにち", kanji: "毎日", romaji: "mainichi", meaningEn: "every day", fromModule: "m11", kind: "vocab", blocked: true, note: "abstract time interval" },
  { id: "maiban", kana: "まいばん", kanji: "毎晩", romaji: "maiban", meaningEn: "every night", emoji: "🌙", fromModule: "m20", kind: "vocab", note: "moon as night cue (frequency lost — phrase context needed)" },
  { id: "maigetsu", kana: "まいげつ", kanji: "毎月", romaji: "maigetsu", meaningEn: "every month", fromModule: "future", kind: "vocab", blocked: true, note: "abstract recurrence" },
  { id: "maitsuki", kana: "まいつき", kanji: "毎月", romaji: "maitsuki", meaningEn: "every month", fromModule: "m11", kind: "vocab", blocked: true, note: "abstract recurrence" },
  { id: "maiasa", kana: "まいあさ", kanji: "毎朝", romaji: "maiasa", meaningEn: "every morning", emoji: "🌅", fromModule: "m20", kind: "vocab", note: "sunrise reads as morning" },
  { id: "maishuu", kana: "まいしゅう", kanji: "毎週", romaji: "maishuu", meaningEn: "every week", fromModule: "m11", kind: "vocab", blocked: true, note: "abstract recurrence" },
  { id: "suiyoubi", kana: "すいようび", kanji: "水曜日", romaji: "suiyoubi", meaningEn: "Wednesday", emoji: "📅", fromModule: "m12", kind: "vocab", note: "generic calendar" },
  { id: "kitanai", kana: "きたない", kanji: "汚い", romaji: "kitanai", meaningEn: "dirty", emoji: "🗑️", fromModule: "future", kind: "vocab", blocked: true, note: "trash reads as 'garbage' not 'dirty'" },
  { id: "oyogu", kana: "およぐ", kanji: "泳ぐ", romaji: "oyogu", meaningEn: "to swim", emoji: "🏊", fromModule: "m14", kind: "vocab" },
  { id: "youfuku", kana: "ようふく", kanji: "洋服", romaji: "youfuku", meaningEn: "western-style clothes", emoji: "👔", fromModule: "future", kind: "vocab", note: "necktie/shirt" },
  { id: "arau", kana: "あらう", kanji: "洗う", romaji: "arau", meaningEn: "to wash", emoji: "🧼", fromModule: "m16", kind: "vocab", note: "soap = wash" },
  { id: "sentaku", kana: "せんたく", kanji: "洗濯", romaji: "sentaku", meaningEn: "washing", emoji: "🧺", fromModule: "m16", kind: "vocab", note: "laundry basket" },
  { id: "kieru", kana: "きえる", kanji: "消える", romaji: "kieru", meaningEn: "to disappear", emoji: "💨", fromModule: "future", kind: "vocab", note: "puff = vanish" },
  { id: "kesu", kana: "けす", kanji: "消す", romaji: "kesu", meaningEn: "to erase, to turn off power", emoji: "🧽", fromModule: "future", kind: "vocab", note: "sponge as erase proxy" },
  { id: "suzushii", kana: "すずしい", kanji: "涼しい", romaji: "suzushii", meaningEn: "refreshing", emoji: "🍃", fromModule: "m18", kind: "vocab", note: "leaf in wind — cool/refreshing" },
  { id: "watasu", kana: "わたす", kanji: "渡す", romaji: "watasu", meaningEn: "to hand over", emoji: "🤝", fromModule: "future", kind: "vocab", note: "handshake/handoff" },
  { id: "wataru", kana: "わたる", kanji: "渡る", romaji: "wataru", meaningEn: "to go across", emoji: "🚸", fromModule: "m17", kind: "vocab", note: "pedestrian crossing" },
  { id: "nurui", kana: "ぬるい", kanji: "温い", romaji: "nurui", meaningEn: "luke warm", fromModule: "future", kind: "vocab", blocked: true, note: "subtle temperature distinction; no referent that reads as 'lukewarm' vs warm/hot" },
  { id: "kanji", kana: "かんじ", kanji: "漢字", romaji: "kanji", meaningEn: "Chinese character", emoji: "🈶", fromModule: "future", kind: "vocab", note: "Japanese ideograph block" },
  { id: "kayoubi", kana: "かようび", kanji: "火曜日", romaji: "kayoubi", meaningEn: "Tuesday", fromModule: "m12", kind: "vocab", blocked: true, note: "weekday name — no glyph distinguishes" },
  { id: "haizara", kana: "はいざら", kanji: "灰皿", romaji: "haizara", meaningEn: "ashtray", emoji: "🚬", fromModule: "future", kind: "vocab", note: "cigarette as proxy; closest concrete" },
  { id: "nakusu", kana: "なくす", kanji: "無くす", romaji: "nakusu", meaningEn: "to lose something", fromModule: "m17", introducedByLessonId: "ja-m17-8-2", kind: "vocab", blocked: true, note: "abstract action" },
  { id: "urusai", kana: "うるさい", kanji: "煩い", romaji: "urusai", meaningEn: "noisy, annoying", emoji: "📢", fromModule: "future", kind: "vocab", note: "loudspeaker = noisy" },
  { id: "atsui-hot", kana: "あつい", kanji: "熱い", romaji: "atsui", meaningEn: "hot to the touch", emoji: "🔥", fromModule: "m8", kind: "vocab", note: "fire — hot" },
  { id: "gyuuniku", kana: "ぎゅうにく", kanji: "牛肉", romaji: "gyuuniku", meaningEn: "beef", emoji: "🐄", fromModule: "future", kind: "vocab", note: "cow as beef cue (🥩 taken for generic meat)" },
  { id: "mono", kana: "もの", kanji: "物", romaji: "mono", meaningEn: "thing", fromModule: "m24", introducedByLessonId: "ja-m24-2-1", kind: "vocab", blocked: true, note: "abstract noun — per rubric" },
  { id: "semai", kana: "せまい", kanji: "狭い", romaji: "semai", meaningEn: "narrow", emoji: "↔️", fromModule: "m26", kind: "vocab", blocked: true, note: "no clean narrow glyph; left-right arrow reads as wide" },
  { id: "genkan", kana: "げんかん", kanji: "玄関", romaji: "genkan", meaningEn: "entry hall", emoji: "🚪", fromModule: "future", kind: "vocab", note: "door as entry proxy" },
  { id: "amai", kana: "あまい", kanji: "甘い", romaji: "amai", meaningEn: "sweet", emoji: "🍬", fromModule: "future", kind: "vocab", note: "candy as sweet proxy" },
  { id: "umareru", kana: "うまれる", kanji: "生まれる", romaji: "umareru", meaningEn: "to be born", emoji: "👶", fromModule: "future", kind: "vocab" },
  { id: "seito", kana: "せいと", kanji: "生徒", romaji: "seito", meaningEn: "pupil", emoji: "🎒", fromModule: "m19", kind: "vocab", note: "backpack as pupil cue" },
  { id: "otoko", kana: "おとこ", kanji: "男", romaji: "otoko", meaningEn: "man", emoji: "👨", fromModule: "m19", kind: "vocab" },
  { id: "otokonoko", kana: "おとこのこ", kanji: "男の子", romaji: "otokonoko", meaningEn: "boy", emoji: "👦", fromModule: "m19", kind: "vocab" },
  { id: "machi", kana: "まち", kanji: "町", romaji: "machi", meaningEn: "town, city", emoji: "🏘️", fromModule: "m8", kind: "vocab" },
  { id: "ryuugakusei", kana: "りゅうがくせい", kanji: "留学生", romaji: "ryuugakusei", meaningEn: "overseas student", emoji: "🎓", fromModule: "m25", introducedByLessonId: "ja-m25-5-2", kind: "vocab", note: "graduation cap" },
  { id: "bangou", kana: "ばんごう", kanji: "番号", romaji: "bangou", meaningEn: "number", emoji: "🔢", fromModule: "future", kind: "vocab" },
  { id: "tsukareru", kana: "つかれる", kanji: "疲れる", romaji: "tsukareru", meaningEn: "to get tired", emoji: "😩", fromModule: "m26", kind: "vocab", note: "weary face" },
  { id: "byouki", kana: "びょうき", kanji: "病気", romaji: "byouki", meaningEn: "illness", emoji: "🤒", fromModule: "m20", kind: "vocab", note: "face with thermometer" },
  { id: "itai", kana: "いたい", kanji: "痛い", romaji: "itai", meaningEn: "painful", emoji: "🤕", fromModule: "m20", kind: "vocab" },
  { id: "noboru", kana: "のぼる", kanji: "登る", romaji: "noboru", meaningEn: "to climb", emoji: "🧗", fromModule: "future", kind: "vocab", note: "person climbing" },
  { id: "shiro", kana: "しろ", kanji: "白", romaji: "shiro", meaningEn: "white", emoji: "⚪", fromModule: "future", kind: "vocab" },
  { id: "shiroi", kana: "しろい", kanji: "白い", romaji: "shiroi", meaningEn: "white", emoji: "⬜", fromModule: "future", kind: "vocab", note: "white square" },
  { id: "minasan", kana: "みなさん", kanji: "皆さん", romaji: "minasan", meaningEn: "everyone", emoji: "👥", fromModule: "m19", introducedByLessonId: "ja-m19-4-2", kind: "vocab", note: "synonym of みんな" },
  { id: "me", kana: "め", kanji: "目", romaji: "me", meaningEn: "eye", emoji: "👁️", fromModule: "m20", kind: "vocab" },
  { id: "tsuku", kana: "つく", kanji: "着く", romaji: "tsuku", meaningEn: "to arrive at", emoji: "🛬", fromModule: "future", kind: "vocab", note: "landing plane as arrival cue" },
  { id: "kiru", kana: "きる", kanji: "着る", romaji: "kiru", meaningEn: "to put on from the shoulders down", emoji: "👕", fromModule: "future", kind: "vocab", note: "shirt as put-on cue" },
  { id: "shiru", kana: "しる", kanji: "知る", romaji: "shiru", meaningEn: "to know", emoji: "💡", fromModule: "m15", kind: "vocab", blocked: true, note: "lightbulb used elsewhere; cognition too abstract" },
  { id: "mijikai", kana: "みじかい", kanji: "短い", romaji: "mijikai", meaningEn: "short", emoji: "📏", fromModule: "m8", kind: "vocab", note: "ruler for length adjectives" },
  { id: "satou", kana: "さとう", kanji: "砂糖", romaji: "satou", meaningEn: "sugar", emoji: "🍬", fromModule: "future", kind: "vocab", note: "candy as sugar proxy" },
  { id: "migaku", kana: "みがく", kanji: "磨く", romaji: "migaku", meaningEn: "to brush teeth, to polish", emoji: "🪥", fromModule: "m20", kind: "vocab", note: "toothbrush" },
  { id: "watakushi", kana: "わたくし", kanji: "私", romaji: "watakushi", meaningEn: "(humble) I, myself", fromModule: "m19", introducedByLessonId: "ja-m19-3-2", kind: "vocab", blocked: true, note: "pronoun — rubric blocks pronouns" },
  { id: "aki", kana: "あき", kanji: "秋", romaji: "aki", meaningEn: "autumn", emoji: "🍂", fromModule: "m18", kind: "vocab" },
  { id: "tatsu", kana: "たつ", kanji: "立つ", romaji: "tatsu", meaningEn: "to stand", emoji: "🧍", fromModule: "future", kind: "vocab" },
  { id: "kotaeru", kana: "こたえる", kanji: "答える", romaji: "kotaeru", meaningEn: "to answer", emoji: "🙋", fromModule: "future", kind: "vocab", note: "raising hand" },
  { id: "hako", kana: "はこ", kanji: "箱", romaji: "hako", meaningEn: "box", emoji: "📦", fromModule: "future", kind: "vocab" },
  { id: "koucha", kana: "こうちゃ", kanji: "紅茶", romaji: "koucha", meaningEn: "black tea", emoji: "🍵", fromModule: "future", kind: "vocab", note: "teacup; pair with phrase" },
  { id: "kami", kana: "かみ", kanji: "紙", romaji: "kami", meaningEn: "paper", emoji: "📄", fromModule: "future", kind: "vocab" },
  { id: "hosoi", kana: "ほそい", kanji: "細い", romaji: "hosoi", meaningEn: "thin", fromModule: "future", kind: "vocab", blocked: true, note: "abstract adjective; no clean Noto referent" },
  { id: "owaru", kana: "おわる", kanji: "終る", romaji: "owaru", meaningEn: "to finish", emoji: "🏁", fromModule: "future", kind: "vocab", note: "checkered flag as finish cue" },
  { id: "kekkon", kana: "けっこん", kanji: "結婚", romaji: "kekkon", meaningEn: "marriage", emoji: "💍", fromModule: "m19", introducedByLessonId: "ja-m19-5-2", kind: "vocab", note: "ring" },
  { id: "kekkou", kana: "けっこう", kanji: "結構", romaji: "kekkou", meaningEn: "splendid, enough", fromModule: "m21", introducedByLessonId: "ja-m21-6-2", kind: "vocab", blocked: true, note: "polysemous abstract adjective/adverb" },
  { id: "e", kana: "え", kanji: "絵", romaji: "e", meaningEn: "picture", emoji: "🖼️", fromModule: "m24", kind: "vocab", note: "framed picture" },
  { id: "midori", kana: "みどり", kanji: "緑", romaji: "midori", meaningEn: "green", emoji: "🟢", fromModule: "future", kind: "vocab" },
  { id: "shimeru-tie", kana: "しめる", kanji: "締める", romaji: "shimeru", meaningEn: "to tie", emoji: "🎀", fromModule: "future", kind: "vocab", note: "ribbon" },
  { id: "renshuusuru", kana: "れんしゅうする", kanji: "練習", romaji: "renshuusuru", meaningEn: "to practice", emoji: "📓", fromModule: "m27", kind: "vocab", note: "notebook as practice proxy" },
  { id: "oku", kana: "おく", kanji: "置く", romaji: "oku", meaningEn: "to put", emoji: "📥", fromModule: "future", kind: "vocab", note: "inbox tray — place/put" },
  { id: "narau", kana: "ならう", kanji: "習う", romaji: "narau", meaningEn: "to learn", emoji: "🎓", fromModule: "future", kind: "vocab" },
  { id: "mimi", kana: "みみ", kanji: "耳", romaji: "mimi", meaningEn: "ear", emoji: "👂", fromModule: "m20", kind: "vocab" },
  { id: "kiku", kana: "きく", kanji: "聞く", romaji: "kiku", meaningEn: "to hear, to listen to, to ask", emoji: "👂", fromModule: "m24", kind: "vocab", note: "ear" },
  { id: "niku", kana: "にく", kanji: "肉", romaji: "niku", meaningEn: "meat", emoji: "🥩", fromModule: "m22", kind: "vocab" },
  { id: "se", kana: "せ", kanji: "背", romaji: "se", meaningEn: "height, stature", emoji: "📏", fromModule: "future", kind: "vocab", note: "ruler for stature" },
  { id: "sebiro", kana: "せびろ", kanji: "背広", romaji: "sebiro", meaningEn: "business suit", emoji: "🤵", fromModule: "future", kind: "vocab", note: "person in suit" },
  { id: "nugu", kana: "ぬぐ", kanji: "脱ぐ", romaji: "nugu", meaningEn: "to take off clothes", emoji: "👔", fromModule: "future", kind: "vocab", blocked: true, note: "necktie reads as clothing not removing; verb action not visualizable" },
  { id: "jibun", kana: "じぶん", kanji: "自分", romaji: "jibun", meaningEn: "oneself", fromModule: "m16", introducedByLessonId: "ja-m16-6-1", kind: "vocab", blocked: true, note: "reflexive pronoun" },
  { id: "jidousha", kana: "じどうしゃ", kanji: "自動車", romaji: "jidousha", meaningEn: "automobile", emoji: "🚙", fromModule: "future", kind: "vocab" },
  { id: "kabin", kana: "かびん", kanji: "花瓶", romaji: "kabin", meaningEn: "a vase", emoji: "🏺", fromModule: "future", kind: "vocab", note: "amphora — closest Noto vase" },
  { id: "wakai", kana: "わかい", kanji: "若い", romaji: "wakai", meaningEn: "young", emoji: "👶", fromModule: "future", kind: "vocab", note: "baby connotes young" },
  { id: "eigo", kana: "えいご", kanji: "英語", romaji: "eigo", meaningEn: "English language", emoji: "🇺🇸", fromModule: "m9", kind: "vocab", note: "US flag — wired via separate flag dir" },
  { id: "chairo", kana: "ちゃいろ", kanji: "茶色", romaji: "chairo", meaningEn: "brown", emoji: "🟫", fromModule: "future", kind: "vocab", note: "brown square" },
  { id: "nimotsu", kana: "にもつ", kanji: "荷物", romaji: "nimotsu", meaningEn: "luggage", emoji: "🧳", fromModule: "future", kind: "vocab" },
  { id: "hagaki", kana: "はがき", kanji: "葉書", romaji: "hagaki", meaningEn: "postcard", emoji: "📮", fromModule: "m14", kind: "vocab", note: "postbox as proxy for postcard" },
  { id: "usui", kana: "うすい", kanji: "薄い", romaji: "usui", meaningEn: "thin, weak", fromModule: "future", kind: "vocab", blocked: true, note: "polysemy: thin (paper) vs weak (tea/color); no single concrete referent" },
  { id: "kusuri", kana: "くすり", kanji: "薬", romaji: "kusuri", meaningEn: "medicine", emoji: "💊", fromModule: "m20", kind: "vocab" },
  { id: "nishi", kana: "にし", kanji: "西", romaji: "nishi", meaningEn: "west", emoji: "🧭", fromModule: "future", kind: "vocab", note: "compass — west direction" },
  { id: "iru", kana: "いる", kanji: "要る", romaji: "iru", meaningEn: "to need", emoji: "❗", fromModule: "future", kind: "vocab", blocked: true, note: "exclamation reads as 'attention' not 'need'" },
  { id: "miseru", kana: "みせる", kanji: "見せる", romaji: "miseru", meaningEn: "to show", emoji: "👀", fromModule: "m14", kind: "vocab", note: "eyes — showing/look at this" },
  { id: "oboeru", kana: "おぼえる", kanji: "覚える", romaji: "oboeru", meaningEn: "to memorise, to learn", emoji: "🧠", fromModule: "m29", introducedByLessonId: "ja-m29-2-1", kind: "vocab", note: "brain; upgraded from future 2026-07-16 (m29 plain-form pilot)" },
  { id: "kado", kana: "かど", kanji: "角", romaji: "kado", meaningEn: "a corner", emoji: "📐", fromModule: "future", kind: "vocab", note: "triangle ruler — corner/angle" },
  { id: "iu", kana: "いう", kanji: "言う", romaji: "iu", meaningEn: "to say", emoji: "💬", fromModule: "future", kind: "vocab", note: "speech bubble" },
  { id: "omou", kana: "おもう", kanji: "思う", romaji: "omou", meaningEn: "to think", emoji: "💭", fromModule: "m5", introducedByLessonId: "ja-m5-neo-8", kind: "vocab", note: "thought balloon; m5-neo L8 teaches it recognition-first via the そう おもう chunk (dict-form-first rewrite) — no analyzed と quotation until later" },
  { id: "kotoba", kana: "ことば", kanji: "言葉", romaji: "kotoba", meaningEn: "word, language", emoji: "🔤", fromModule: "future", kind: "vocab", note: "ABC input symbol as language proxy" },
  { id: "hanashi", kana: "はなし", kanji: "話", romaji: "hanashi", meaningEn: "talk, story", emoji: "💬", fromModule: "m14", kind: "vocab" },
  { id: "hanasu", kana: "はなす", kanji: "話す", romaji: "hanasu", meaningEn: "to speak", emoji: "🗣️", fromModule: "m14", kind: "vocab" },
  { id: "tanjoubi", kana: "たんじょうび", kanji: "誕生日", romaji: "tanjoubi", meaningEn: "birthday", emoji: "🎂", fromModule: "m19", introducedByLessonId: "ja-m19-5-2", kind: "vocab" },
  { id: "keikan", kana: "けいかん", kanji: "警官", romaji: "keikan", meaningEn: "policeman", emoji: "👮", fromModule: "m17", introducedByLessonId: "ja-m17-8-2", kind: "vocab" },
  { id: "butaniku", kana: "ぶたにく", kanji: "豚肉", romaji: "butaniku", meaningEn: "pork", emoji: "🥓", fromModule: "future", kind: "vocab", note: "bacon as pork cue" },
  { id: "saifu", kana: "さいふ", kanji: "財布", romaji: "saifu", meaningEn: "wallet", emoji: "👛", fromModule: "m14", kind: "vocab", note: "purse — closest wallet glyph" },
  { id: "kaimono", kana: "かいもの", kanji: "買い物", romaji: "kaimono", meaningEn: "shopping", emoji: "🛍️", fromModule: "m15", kind: "vocab" },
  { id: "kau", kana: "かう", kanji: "買う", romaji: "kau", meaningEn: "to buy", emoji: "🛒", fromModule: "m25", kind: "vocab" },
  { id: "kasu", kana: "かす", kanji: "貸す", romaji: "kasu", meaningEn: "to lend", emoji: "🤝", fromModule: "m14", kind: "vocab", note: "handshake reads as exchange/lend" },
  { id: "haru-stick", kana: "はる", kanji: "貼る", romaji: "haru", meaningEn: "to stick", fromModule: "m14", introducedByLessonId: "ja-m14-6-2", kind: "vocab", blocked: true, note: "no concrete Noto referent; pair with phrase" },
  { id: "nigiyaka", kana: "にぎやか", kanji: "賑やか", romaji: "nigiyaka", meaningEn: "bustling, busy", emoji: "🎉", fromModule: "m9", kind: "vocab", note: "party popper as lively proxy" },
  { id: "shitsumon", kana: "しつもん", kanji: "質問", romaji: "shitsumon", meaningEn: "question", emoji: "❓", fromModule: "future", kind: "vocab", note: "question mark" },
  { id: "aka", kana: "あか", kanji: "赤", romaji: "aka", meaningEn: "red", emoji: "🟥", fromModule: "future", kind: "vocab", note: "red square — shares with 赤い" },
  { id: "akai", kana: "あかい", kanji: "赤い", romaji: "akai", meaningEn: "red", emoji: "🟥", fromModule: "future", kind: "vocab", note: "red square" },
  { id: "hashiru", kana: "はしる", kanji: "走る", romaji: "hashiru", meaningEn: "to run", emoji: "🏃", fromModule: "m16", kind: "vocab" },
  { id: "okiru", kana: "おきる", kanji: "起きる", romaji: "okiru", meaningEn: "to get up", emoji: "⏰", fromModule: "m16", kind: "vocab", note: "alarm clock — wake up" },
  { id: "ashi", kana: "あし", kanji: "足", romaji: "ashi", meaningEn: "foot, leg", emoji: "🦶", fromModule: "m20", kind: "vocab" },
  { id: "karui", kana: "かるい", kanji: "軽い", romaji: "karui", meaningEn: "light", emoji: "🪶", fromModule: "future", kind: "vocab", note: "feather = light weight" },
  { id: "karai", kana: "からい", kanji: "辛い", romaji: "karai", meaningEn: "spicy", emoji: "🌶️", fromModule: "m26", kind: "vocab" },
  { id: "hen", kana: "へん", kanji: "辺", romaji: "hen", meaningEn: "area", emoji: "🗺️", fromModule: "m16", introducedByLessonId: "ja-m16-5-2", kind: "vocab", note: "map as area proxy" },
  { id: "chikaku", kana: "ちかく", kanji: "近く", romaji: "chikaku", meaningEn: "near", emoji: "📍", fromModule: "m18", kind: "vocab", note: "pin as near-here proxy" },
  { id: "kaesu", kana: "かえす", kanji: "返す", romaji: "kaesu", meaningEn: "to return something", emoji: "↩️", fromModule: "future", kind: "vocab", note: "return arrow" },
  { id: "hayai", kana: "はやい", kanji: "速い", romaji: "hayai", meaningEn: "quick", emoji: "💨", fromModule: "m8", kind: "vocab", note: "dashing-away motion lines" },
  { id: "osoi", kana: "おそい", kanji: "遅い", romaji: "osoi", meaningEn: "late, slow", emoji: "🐢", fromModule: "m8", kind: "vocab", note: "turtle = slow" },
  { id: "michi", kana: "みち", kanji: "道", romaji: "michi", meaningEn: "street", emoji: "🛣️", fromModule: "m17", kind: "vocab", note: "motorway as street proxy" },
  { id: "chigau", kana: "ちがう", kanji: "違う", romaji: "chigau", meaningEn: "to differ", emoji: "❌", fromModule: "m22", kind: "vocab", note: "X as 'wrong/different' proxy" },
  { id: "omoi", kana: "おもい", kanji: "重い", romaji: "omoi", meaningEn: "heavy", emoji: "🏋️", fromModule: "future", kind: "vocab", note: "weightlifter = heavy" },
  { id: "yasai", kana: "やさい", kanji: "野菜", romaji: "yasai", meaningEn: "vegetable", emoji: "🥕", fromModule: "m22", kind: "vocab" },
  { id: "kinyoubi", kana: "きんようび", kanji: "金曜日", romaji: "kinyoubi", meaningEn: "Friday", fromModule: "m12", kind: "vocab", blocked: true, note: "day-of-week label; needs text" },
  { id: "nagai", kana: "ながい", kanji: "長い", romaji: "nagai", meaningEn: "long", emoji: "📏", fromModule: "m8", kind: "vocab", note: "ruler as length cue" },
  { id: "mon", kana: "もん", kanji: "門", romaji: "mon", meaningEn: "gate", emoji: "⛩️", fromModule: "future", kind: "vocab", note: "torii reads as Japanese gate" },
  { id: "shimaru", kana: "しまる", kanji: "閉まる", romaji: "shimaru", meaningEn: "to close, to be closed", fromModule: "future", kind: "vocab", blocked: true, note: "intransitive variant of 閉める — same physical event" },
  { id: "shimeru", kana: "しめる", kanji: "閉める", romaji: "shimeru", meaningEn: "to close something", emoji: "🚪", fromModule: "m14", kind: "vocab", blocked: true, note: "door already used for 玄関; verb action not visualizable" },
  { id: "aku", kana: "あく", kanji: "開く", romaji: "aku", meaningEn: "to open, to become open", emoji: "🔓", fromModule: "future", kind: "vocab", note: "unlocked = becoming open" },
  { id: "akeru", kana: "あける", kanji: "開ける", romaji: "akeru", meaningEn: "to open", emoji: "🔓", fromModule: "m14", kind: "vocab", note: "transitive open" },
  { id: "oriru", kana: "おりる", kanji: "降りる", romaji: "oriru", meaningEn: "to get off, to descend", emoji: "⬇️", fromModule: "m17", kind: "vocab", note: "down-arrow = descend" },
  { id: "furu", kana: "ふる", kanji: "降る", romaji: "furu", meaningEn: "to fall, e.g. rain or snow", emoji: "🌧️", fromModule: "future", kind: "vocab", note: "rain cloud as falling-rain cue" },
  { id: "kaidan", kana: "かいだん", kanji: "階段", romaji: "kaidan", meaningEn: "stairs", emoji: "🪜", fromModule: "m16", kind: "vocab", note: "ladder; closest Noto for stairs" },
  { id: "tonari", kana: "となり", kanji: "隣", romaji: "tonari", meaningEn: "next door to", fromModule: "m18", kind: "vocab", blocked: true, note: "spatial relation; no visual referent" },
  { id: "muzukashii", kana: "むずかしい", kanji: "難しい", romaji: "muzukashii", meaningEn: "difficult", emoji: "😖", fromModule: "m8", kind: "vocab", note: "confounded face as difficulty cue" },
  { id: "ame", kana: "あめ", kanji: "雨", romaji: "ame", meaningEn: "rain", emoji: "🌧️", fromModule: "m18", kind: "vocab" },
  { id: "rei", kana: "れい", kanji: "零", romaji: "rei", meaningEn: "zero", emoji: "0️⃣", fromModule: "future", kind: "vocab" },
  { id: "denki", kana: "でんき", kanji: "電気", romaji: "denki", meaningEn: "electricity, electric light", emoji: "💡", fromModule: "m13", kind: "vocab", note: "light bulb covers electric light" },
  { id: "ao", kana: "あお", kanji: "青", romaji: "ao", meaningEn: "blue", emoji: "🔵", fromModule: "future", kind: "vocab" },
  { id: "shizuka", kana: "しずか", kanji: "静か", romaji: "shizuka", meaningEn: "quiet", emoji: "🤫", fromModule: "m9", kind: "vocab", note: "shushing face" },
  { id: "kutsu", kana: "くつ", kanji: "靴", romaji: "kutsu", meaningEn: "shoes", emoji: "👞", fromModule: "m15", kind: "vocab" },
  { id: "kutsushita", kana: "くつした", kanji: "靴下", romaji: "kutsushita", meaningEn: "socks", emoji: "🧦", fromModule: "future", kind: "vocab" },
  { id: "ongaku", kana: "おんがく", kanji: "音楽", romaji: "ongaku", meaningEn: "music", emoji: "🎵", fromModule: "m15", kind: "vocab" },
  { id: "atama", kana: "あたま", kanji: "頭", romaji: "atama", meaningEn: "head", emoji: "🧠", fromModule: "m20", kind: "vocab", blocked: true, note: "brain reads as 'remember' (used for 覚える); no clean head-anatomy glyph" },
  { id: "tanomu", kana: "たのむ", kanji: "頼む", romaji: "tanomu", meaningEn: "to ask", emoji: "🙏", fromModule: "future", kind: "vocab", note: "request gesture" },
  { id: "tobu", kana: "とぶ", kanji: "飛ぶ", romaji: "tobu", meaningEn: "to fly, to hop", emoji: "🕊️", fromModule: "future", kind: "vocab", note: "dove as flying proxy" },
  { id: "hikouki", kana: "ひこうき", kanji: "飛行機", romaji: "hikouki", meaningEn: "aeroplane", emoji: "✈️", fromModule: "future", kind: "vocab" },
  { id: "tabemono", kana: "たべもの", kanji: "食べ物", romaji: "tabemono", meaningEn: "food", emoji: "🍱", fromModule: "m21", kind: "vocab", note: "bento as food cue" },
  { id: "shokudou", kana: "しょくどう", kanji: "食堂", romaji: "shokudou", meaningEn: "dining hall", emoji: "🍽️", fromModule: "future", kind: "vocab", note: "plate with utensils" },
  { id: "nomimono", kana: "のみもの", kanji: "飲み物", romaji: "nomimono", meaningEn: "a drink", emoji: "🥤", fromModule: "m21", kind: "vocab" },
  { id: "ame-candy", kana: "あめ", kanji: "飴", romaji: "ame", meaningEn: "candy", emoji: "🍬", fromModule: "future", kind: "vocab" },
  { id: "takai", kana: "たかい", kanji: "高い", romaji: "takai", meaningEn: "tall, expensive", fromModule: "m8", kind: "vocab", blocked: true, note: "polysemy flagged in rubric — tall vs expensive needs separate cards" },
  { id: "sakana", kana: "さかな", kanji: "魚", romaji: "sakana", meaningEn: "fish", emoji: "🐟", fromModule: "m22", kind: "vocab" },
  { id: "tori", kana: "とり", kanji: "鳥", romaji: "tori", meaningEn: "bird", emoji: "🐦", fromModule: "future", kind: "vocab" },
  { id: "naku", kana: "なく", kanji: "鳴く", romaji: "naku", meaningEn: "animal noise. to chirp, roar or croak etc.", emoji: "🐦", fromModule: "future", kind: "vocab", note: "bird as canonical chirper" },
  { id: "kiiro", kana: "きいろ", kanji: "黄色", romaji: "kiiro", meaningEn: "yellow", emoji: "🟡", fromModule: "future", kind: "vocab" },
  { id: "kiiroi", kana: "きいろい", kanji: "黄色い", romaji: "kiiroi", meaningEn: "yellow", emoji: "🟨", fromModule: "future", kind: "vocab", note: "yellow square" },
  { id: "kuro", kana: "くろ", kanji: "黒", romaji: "kuro", meaningEn: "black", emoji: "⬛", fromModule: "future", kind: "vocab", note: "black square" },
  { id: "kuroi", kana: "くろい", kanji: "黒い", romaji: "kuroi", meaningEn: "black", emoji: "⬛", fromModule: "future", kind: "vocab", note: "adjective form of 黒 — shares glyph" },
  // ── M29 — Plain form (N4 pilot, 2026-07-16). Verb-heavy by design: plain
  //    form is a verb-conjugation module, so new atoms are transformable
  //    verbs. Most of the spine's original 21-atom list turned out to
  //    already be claimed by earlier modules (あそぶ m2, ともだち m3, まつ/
  //    はなす/および/しめる/あける m14, はしる/じぶん m16, うたう m23,
  //    わすれる m26) — those are reused here as REVIEW content, not
  //    re-taught (see m29.ts file header for the full reconciliation note).
  //    Genuinely new atoms below; つかう/おぼえる/ぜんぶ upgraded from
  //    "future" above rather than duplicated here.
  { id: "tetsudau", kana: "てつだう", kanji: "手伝う", romaji: "tetsudau", meaningEn: "to help", emoji: "🤝", fromModule: "m29", introducedByLessonId: "ja-m29-1-1", kind: "vocab" },
  { id: "isogu", kana: "いそぐ", kanji: "急ぐ", romaji: "isogu", meaningEn: "to hurry", emoji: "💨", fromModule: "m29", introducedByLessonId: "ja-m29-1-1", kind: "vocab" },
  { id: "sagasu", kana: "さがす", kanji: "探す", romaji: "sagasu", meaningEn: "to look for", emoji: "🔍", fromModule: "m29", introducedByLessonId: "ja-m29-1-2", kind: "vocab" },
  { id: "naosu", kana: "なおす", kanji: "直す", romaji: "naosu", meaningEn: "to fix, to repair", emoji: "🛠️", fromModule: "m29", introducedByLessonId: "ja-m29-1-2", kind: "vocab" },
  { id: "hakobu", kana: "はこぶ", kanji: "運ぶ", romaji: "hakobu", meaningEn: "to carry", emoji: "📦", fromModule: "m29", introducedByLessonId: "ja-m29-1-2", kind: "vocab" },
  { id: "erabu", kana: "えらぶ", kanji: "選ぶ", romaji: "erabu", meaningEn: "to choose", emoji: "✅", fromModule: "m29", introducedByLessonId: "ja-m29-1-2", kind: "vocab" },
  { id: "katazukeru", kana: "かたづける", kanji: "片付ける", romaji: "katazukeru", meaningEn: "to tidy up", emoji: "🧹", fromModule: "m29", introducedByLessonId: "ja-m29-2-1", kind: "vocab" },
  // ── M30 — Casual register (N4 pilot #2, 2026-07-17). Vocab allocation is
  //    docs/n4-pilot-spine-2026-07-16.md's 20-atom m30 table. Two
  //    reconciliation notes (same discipline as m29's header, §13.8):
  //      - たぶん ("probably") is ALREADY an m18 atom (courseAtoms.ts, blocked,
  //        introducedByLessonId ja-m18-2-1). It is NOT re-registered here —
  //        m30 uses it as review vocabulary only (ja-m30-1-1/1-2).
  //      - The spine's bare き ("feeling, mind") would collide with the
  //        existing m18 tree atom き (木) in JA_COURSE_ATOMS_BY_KANA (a
  //        kana-keyed map — a second entry would silently overwrite the
  //        tree lookup). Taught instead as the fixed collocation きになる
  //        ("it's on my mind / I'm curious about it") — same abstract
  //        concept, no kana collision, and arguably more natural to teach
  //        as a whole idiom than the bare noun anyway.
  //    19 genuinely new atoms below (all fromModule "m30").
  { id: "mochiron", kana: "もちろん", romaji: "mochiron", meaningEn: "of course", fromModule: "m30", introducedByLessonId: "ja-m30-1-1", kind: "vocab", blocked: true, note: "modal adverb — casual register pilot" },
  { id: "zettai", kana: "ぜったい", kanji: "絶対", romaji: "zettai", meaningEn: "absolutely", fromModule: "m30", introducedByLessonId: "ja-m30-1-2", kind: "vocab", blocked: true, note: "modal adverb — casual register pilot" },
  { id: "keigo", kana: "けいご", kanji: "敬語", romaji: "keigo", meaningEn: "polite language (keigo)", emoji: "🙇", fromModule: "m30", introducedByLessonId: "ja-m30-2-1", kind: "vocab", note: "compound register noun — taught via listeningComp + speaking, not image MCQ" },
  { id: "shitashii", kana: "したしい", kanji: "親しい", romaji: "shitashii", meaningEn: "close, familiar", emoji: "💞", fromModule: "m30", introducedByLessonId: "ja-m30-2-1", kind: "vocab", note: "adjective — taught via build, not image MCQ (guide §13.1)" },
  { id: "teinei", kana: "ていねい", kanji: "丁寧", romaji: "teinei", meaningEn: "polite, careful", emoji: "🎀", fromModule: "m30", introducedByLessonId: "ja-m30-2-2", kind: "vocab", note: "adjective — taught via build, not image MCQ (guide §13.1)" },
  { id: "shitsurei", kana: "しつれい", kanji: "失礼", romaji: "shitsurei", meaningEn: "rude, impolite", emoji: "🙅", fromModule: "m30", introducedByLessonId: "ja-m30-2-2", kind: "vocab", note: "adjective — taught via build, not image MCQ (guide §13.1)" },
  { id: "tameguchi", kana: "ためぐち", kanji: "ため口", romaji: "tameguchi", meaningEn: "casual speech", emoji: "🗣️", fromModule: "m30", introducedByLessonId: "ja-m30-3-1", kind: "vocab", note: "compound register noun — taught via listeningComp + speaking, not image MCQ" },
  { id: "nande", kana: "なんで", kanji: "何で", romaji: "nande", meaningEn: "why (casual)", fromModule: "m30", introducedByLessonId: "ja-m30-3-1", kind: "vocab", blocked: true, note: "casual interrogative" },
  { id: "doushitano", kana: "どうしたの", romaji: "doushitano", meaningEn: "what's up?", fromModule: "m30", introducedByLessonId: "ja-m30-3-1", kind: "vocab", blocked: true, note: "casual function phrase — also the pair-3 grammar pattern" },
  { id: "kininaru", kana: "きになる", kanji: "気になる", romaji: "kininaru", meaningEn: "on my mind, curious/concerned about", fromModule: "m30", introducedByLessonId: "ja-m30-3-2", kind: "vocab", blocked: true, note: "fixed idiom replacing spine's bare き — see file header" },
  { id: "betsuni", kana: "べつに", kanji: "別に", romaji: "betsuni", meaningEn: "not particularly", fromModule: "m30", introducedByLessonId: "ja-m30-3-2", kind: "vocab", blocked: true, note: "casual filler adverb" },
  { id: "senpai", kana: "せんぱい", kanji: "先輩", romaji: "senpai", meaningEn: "senior (at school/work)", emoji: "🎓", fromModule: "m30", introducedByLessonId: "ja-m30-4-1", kind: "vocab" },
  { id: "joushi", kana: "じょうし", kanji: "上司", romaji: "joushi", meaningEn: "boss, superior", emoji: "💼", fromModule: "m30", introducedByLessonId: "ja-m30-4-1", kind: "vocab" },
  { id: "douryou", kana: "どうりょう", kanji: "同僚", romaji: "douryou", meaningEn: "colleague", emoji: "🧑‍💼", fromModule: "m30", introducedByLessonId: "ja-m30-4-1", kind: "vocab" },
  { id: "yappari", kana: "やっぱり", romaji: "yappari", meaningEn: "as expected, after all", fromModule: "m30", introducedByLessonId: "ja-m30-4-1", kind: "vocab", blocked: true, note: "modal adverb — casual register pilot" },
  { id: "kouhai", kana: "こうはい", kanji: "後輩", romaji: "kouhai", meaningEn: "junior (at school/work)", emoji: "🧑‍🎓", fromModule: "m30", introducedByLessonId: "ja-m30-4-2", kind: "vocab" },
  { id: "shiriai", kana: "しりあい", kanji: "知り合い", romaji: "shiriai", meaningEn: "acquaintance", emoji: "🤵", fromModule: "m30", introducedByLessonId: "ja-m30-4-2", kind: "vocab" },
  { id: "osananajimi", kana: "おさななじみ", kanji: "幼馴染", romaji: "osananajimi", meaningEn: "childhood friend", emoji: "🧒", fromModule: "m30", introducedByLessonId: "ja-m30-4-2", kind: "vocab" },
  { id: "nakama", kana: "なかま", kanji: "仲間", romaji: "nakama", meaningEn: "comrade, mate", emoji: "👥", fromModule: "m30", introducedByLessonId: "ja-m30-4-2", kind: "vocab" },
  // ── m7-neo (spine tile s07) — the polite layer: ます / ません / です ──
  { id: "shimasu", kana: "します", romaji: "shimasu", meaningEn: "do, make (polite)", fromModule: "m7", introducedByLessonId: "ja-m7-neo-2", kind: "vocab" },
  { id: "kimasu", kana: "きます", romaji: "kimasu", meaningEn: "come (polite)", fromModule: "m7", introducedByLessonId: "ja-m7-neo-2", kind: "vocab" },
  { id: "kaimasu", kana: "かいます", romaji: "kaimasu", meaningEn: "buy (polite)", fromModule: "m7", introducedByLessonId: "ja-m7-neo-1", kind: "vocab" },
  { id: "kikimasu", kana: "ききます", romaji: "kikimasu", meaningEn: "listen, ask (polite)", fromModule: "m7", introducedByLessonId: "ja-m7-neo-1", kind: "vocab" },
  { id: "asobimasu", kana: "あそびます", romaji: "asobimasu", meaningEn: "play (polite)", fromModule: "m7", introducedByLessonId: "ja-m7-neo-1", kind: "vocab" },
  { id: "tabemasen", kana: "たべません", romaji: "tabemasen", meaningEn: "don't eat (polite)", fromModule: "m7", introducedByLessonId: "ja-m7-neo-1", kind: "vocab" },
  { id: "nomimasen", kana: "のみません", romaji: "nomimasen", meaningEn: "don't drink (polite)", fromModule: "m7", introducedByLessonId: "ja-m7-neo-1", kind: "vocab" },
  { id: "mimasen", kana: "みません", romaji: "mimasen", meaningEn: "don't watch (polite)", fromModule: "m7", introducedByLessonId: "ja-m7-neo-1", kind: "vocab" },
  { id: "ikimasen", kana: "いきません", romaji: "ikimasen", meaningEn: "don't go, not travelling (polite)", fromModule: "m7", introducedByLessonId: "ja-m7-neo-1", kind: "vocab" },
  { id: "kimasen", kana: "きません", romaji: "kimasen", meaningEn: "doesn't come (polite)", fromModule: "m7", introducedByLessonId: "ja-m7-neo-1", kind: "vocab" },
  { id: "shimasen", kana: "しません", romaji: "shimasen", meaningEn: "don't do, won't make (polite)", fromModule: "m7", introducedByLessonId: "ja-m7-neo-1", kind: "vocab" },
  { id: "hatarakimasen", kana: "はたらきません", romaji: "hatarakimasen", meaningEn: "don't work (polite)", fromModule: "m7", introducedByLessonId: "ja-m7-neo-1", kind: "vocab" },
  { id: "arimasen", kana: "ありません", romaji: "arimasen", meaningEn: "doesn't have, isn't there (polite)", fromModule: "m7", introducedByLessonId: "ja-m7-neo-1", kind: "vocab" },
  { id: "hatarakimasu", kana: "はたらきます", romaji: "hatarakimasu", meaningEn: "work (polite)", fromModule: "m7", introducedByLessonId: "ja-m7-neo-7", kind: "vocab" },
  { id: "sama", kana: "さま", romaji: "sama", meaningEn: "-sama (respectful name suffix)", shortGloss: "-sama", fromModule: "m7", introducedByLessonId: "ja-m7-neo-8", kind: "vocab" },
  { id: "kun", kana: "くん", romaji: "kun", meaningEn: "-kun (familiar, usually boys)", shortGloss: "-kun", fromModule: "m7", introducedByLessonId: "ja-m7-neo-8", kind: "vocab" },
  { id: "chan", kana: "ちゃん", romaji: "chan", meaningEn: "-chan (affectionate)", shortGloss: "-chan", fromModule: "m7", introducedByLessonId: "ja-m7-neo-8", kind: "vocab" },
  // ── m8-neo (tile n02) — て-form + ください ──
  { id: "tabete", kana: "たべて", romaji: "tabete", meaningEn: "eat (te-form)", fromModule: "m8", introducedByLessonId: "ja-m8-neo-1", kind: "vocab" },
  { id: "mite", kana: "みて", romaji: "mite", meaningEn: "watch, look (te-form)", fromModule: "m8", introducedByLessonId: "ja-m8-neo-1", kind: "vocab" },
  { id: "nonde", kana: "のんで", romaji: "nonde", meaningEn: "drink (te-form)", fromModule: "m8", introducedByLessonId: "ja-m8-neo-2", kind: "vocab" },
  { id: "katte", kana: "かって", romaji: "katte", meaningEn: "buy (te-form)", fromModule: "m8", introducedByLessonId: "ja-m8-neo-2", kind: "vocab" },
  { id: "kiite", kana: "きいて", romaji: "kiite", meaningEn: "listen, ask (te-form)", fromModule: "m8", introducedByLessonId: "ja-m8-neo-2", kind: "vocab" },
  { id: "asonde", kana: "あそんで", romaji: "asonde", meaningEn: "play (te-form)", fromModule: "m8", introducedByLessonId: "ja-m8-neo-2", kind: "vocab" },
  { id: "itte", kana: "いって", romaji: "itte", meaningEn: "go, travel (te-form)", fromModule: "m8", introducedByLessonId: "ja-m8-neo-3", kind: "vocab" },
  { id: "shite", kana: "して", romaji: "shite", meaningEn: "do, make (te-form)", fromModule: "m8", introducedByLessonId: "ja-m8-neo-3", kind: "vocab" },
  { id: "kite", kana: "きて", romaji: "kite", meaningEn: "come (te-form)", fromModule: "m8", introducedByLessonId: "ja-m8-neo-3", kind: "vocab" },
  { id: "oshiete", kana: "おしえて", romaji: "oshiete", meaningEn: "teach, tell (te-form)", fromModule: "m8", introducedByLessonId: "ja-m8-neo-7", kind: "vocab" },
  { id: "shokuji", kana: "しょくじ", romaji: "shokuji", meaningEn: "a meal", fromModule: "m8", introducedByLessonId: "ja-m8-neo-5", kind: "vocab" },
  { id: "cha", kana: "ちゃ", romaji: "cha", meaningEn: "tea", fromModule: "m8", introducedByLessonId: "ja-m8-neo-5", kind: "vocab" },
  { id: "kome", kana: "こめ", romaji: "kome", meaningEn: "rice (uncooked)", shortGloss: "rice (raw)", fromModule: "m8", introducedByLessonId: "ja-m8-neo-6", kind: "vocab" },
  // ── m9-neo (tile n03) — numbers, counters, purchases ──
  { id: "kane", kana: "かね", romaji: "kane", meaningEn: "money", fromModule: "m9", introducedByLessonId: "ja-m9-neo-5", kind: "vocab" },
  // ── m10-neo (tile n15) — register in the wild ──
  { id: "uun", kana: "ううん", romaji: "uun", meaningEn: "nope (casual no)", shortGloss: "nope", fromModule: "m10", introducedByLessonId: "ja-m10-neo-2", kind: "vocab" },
  { id: "dame", kana: "だめ", romaji: "dame", meaningEn: "no good, not allowed", shortGloss: "no good", fromModule: "m10", introducedByLessonId: "ja-m10-neo-5", kind: "vocab" },
  { id: "boku", kana: "ぼく", romaji: "boku", meaningEn: "I, me (casual, usually male)", shortGloss: "I (casual)", fromModule: "m10", introducedByLessonId: "ja-m10-neo-6", kind: "vocab" },
  { id: "shirimasu", kana: "しります", romaji: "shirimasu", meaningEn: "know (polite)", fromModule: "m10", introducedByLessonId: "ja-m10-neo-1", kind: "vocab" },
  { id: "shirimasen", kana: "しりません", romaji: "shirimasen", meaningEn: "don't know (polite)", fromModule: "m10", introducedByLessonId: "ja-m10-neo-1", kind: "vocab" },
  { id: "wakarimasu", kana: "わかります", romaji: "wakarimasu", meaningEn: "understand (polite)", fromModule: "m10", introducedByLessonId: "ja-m10-neo-1", kind: "vocab" },
  { id: "chigaimasu", kana: "ちがいます", romaji: "chigaimasu", meaningEn: "that's not right (polite)", fromModule: "m10", introducedByLessonId: "ja-m10-neo-1", kind: "vocab" },
  { id: "maa", kana: "まあ", romaji: "maa", meaningEn: "well, sort of", shortGloss: "well…", fromModule: "m10", introducedByLessonId: "ja-m10-neo-8", kind: "vocab" },
  // ── m11-neo (tile n04) — time I + plain past た ──
  // Multiples of ten. Registered as whole surfaces because the tokenizer is
  // longest-match and every hour below is a PREFIX of one of these
  // (ごじ ⊂ ごじゅう); without them ごじゅうえん cannot be tiled.
  { id: "sanjuu", kana: "さんじゅう", romaji: "sanjuu", meaningEn: "thirty", fromModule: "m11", introducedByLessonId: "ja-m11-neo-1", kind: "vocab" },
  { id: "yonjuu", kana: "よんじゅう", romaji: "yonjuu", meaningEn: "forty", fromModule: "m11", introducedByLessonId: "ja-m11-neo-1", kind: "vocab" },
  { id: "gojuu", kana: "ごじゅう", romaji: "gojuu", meaningEn: "fifty", fromModule: "m11", introducedByLessonId: "ja-m11-neo-1", kind: "vocab" },
  { id: "rokujuu", kana: "ろくじゅう", romaji: "rokujuu", meaningEn: "sixty", fromModule: "m11", introducedByLessonId: "ja-m11-neo-1", kind: "vocab" },
  { id: "nanajuu", kana: "ななじゅう", romaji: "nanajuu", meaningEn: "seventy", fromModule: "m11", introducedByLessonId: "ja-m11-neo-1", kind: "vocab" },
  // Clock hours. No emoji by design: a clock face cannot discriminate よじ
  // from くじ, so these are never image-MCQ material (inv 30/44).
  { id: "ichiji", kana: "いちじ", romaji: "ichiji", meaningEn: "one o'clock", fromModule: "m11", introducedByLessonId: "ja-m11-neo-2", kind: "vocab" },
  { id: "niji", kana: "にじ", romaji: "niji", meaningEn: "two o'clock", fromModule: "m11", introducedByLessonId: "ja-m11-neo-2", kind: "vocab" },
  { id: "sanji", kana: "さんじ", romaji: "sanji", meaningEn: "three o'clock", fromModule: "m11", introducedByLessonId: "ja-m11-neo-2", kind: "vocab" },
  { id: "yoji", kana: "よじ", romaji: "yoji", meaningEn: "four o'clock", fromModule: "m11", introducedByLessonId: "ja-m11-neo-2", kind: "vocab" },
  { id: "goji", kana: "ごじ", romaji: "goji", meaningEn: "five o'clock", fromModule: "m11", introducedByLessonId: "ja-m11-neo-2", kind: "vocab" },
  { id: "rokuji", kana: "ろくじ", romaji: "rokuji", meaningEn: "six o'clock", fromModule: "m11", introducedByLessonId: "ja-m11-neo-2", kind: "vocab" },
  { id: "shichiji", kana: "しちじ", romaji: "shichiji", meaningEn: "seven o'clock", fromModule: "m11", introducedByLessonId: "ja-m11-neo-2", kind: "vocab" },
  { id: "hachiji", kana: "はちじ", romaji: "hachiji", meaningEn: "eight o'clock", fromModule: "m11", introducedByLessonId: "ja-m11-neo-2", kind: "vocab" },
  { id: "kuji", kana: "くじ", romaji: "kuji", meaningEn: "nine o'clock", fromModule: "m11", introducedByLessonId: "ja-m11-neo-2", kind: "vocab" },
  { id: "juuji", kana: "じゅうじ", romaji: "juuji", meaningEn: "ten o'clock", fromModule: "m11", introducedByLessonId: "ja-m11-neo-2", kind: "vocab" },
  { id: "nanji", kana: "なんじ", romaji: "nanji", meaningEn: "what time", fromModule: "m11", introducedByLessonId: "ja-m11-neo-2", kind: "vocab", blocked: true, note: "interrogative — no concrete referent" },
  // Plain past. した (する) and きた (くる) are deliberately NOT registered:
  // both kana already belong to 下 / 北 in this deck, and a second entry
  // would silently overwrite the kana-keyed lookup those m16/m17 atoms need.
  // The conjugation lexicon already tokenizes them, and the IR carries their
  // gloss, so nothing is lost but the duplicate row.
  { id: "tabeta", kana: "たべた", romaji: "tabeta", meaningEn: "ate (eat, past)", fromModule: "m11", introducedByLessonId: "ja-m11-neo-4", kind: "vocab" },
  { id: "nonda", kana: "のんだ", romaji: "nonda", meaningEn: "drank (drink, past)", fromModule: "m11", introducedByLessonId: "ja-m11-neo-4", kind: "vocab" },
  { id: "kiita", kana: "きいた", romaji: "kiita", meaningEn: "heard (hear, past)", fromModule: "m11", introducedByLessonId: "ja-m11-neo-4", kind: "vocab" },
  { id: "mita", kana: "みた", romaji: "mita", meaningEn: "watched (watch, past)", fromModule: "m11", introducedByLessonId: "ja-m11-neo-4", kind: "vocab" },
  { id: "katta", kana: "かった", romaji: "katta", meaningEn: "bought (buy, past)", fromModule: "m11", introducedByLessonId: "ja-m11-neo-4", kind: "vocab" },
  { id: "asonda", kana: "あそんだ", romaji: "asonda", meaningEn: "played (play, past)", fromModule: "m11", introducedByLessonId: "ja-m11-neo-4", kind: "vocab" },
  { id: "itta-iku", kana: "いった", romaji: "itta", meaningEn: "went (travel, past)", fromModule: "m11", introducedByLessonId: "ja-m11-neo-5", kind: "vocab" },
  { id: "wakatta", kana: "わかった", romaji: "wakatta", meaningEn: "understood (past)", fromModule: "m11", introducedByLessonId: "ja-m11-neo-5", kind: "vocab" },
  // Copula past
  { id: "datta", kana: "だった", romaji: "datta", meaningEn: "was, were (plain)", shortGloss: "was (plain)", fromModule: "m11", introducedByLessonId: "ja-m11-neo-6", kind: "vocab", blocked: true, note: "copula — no concrete referent" },
  { id: "deshita", kana: "でした", romaji: "deshita", meaningEn: "was, were (polite)", shortGloss: "was (polite)", fromModule: "m11", introducedByLessonId: "ja-m11-neo-8", kind: "vocab", blocked: true, note: "copula — no concrete referent" },
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
  { id: "janai", kana: "じゃない", romaji: "janai", meaningEn: "isn't (noun or な-adjective)", shortGloss: "isn't", fromModule: "m12", introducedByLessonId: "ja-m12-neo-6", kind: "vocab", blocked: true, note: "copula — no concrete referent" },
  { id: "janakatta", kana: "じゃなかった", romaji: "janakatta", meaningEn: "wasn't (noun or な-adjective)", shortGloss: "wasn't", fromModule: "m12", introducedByLessonId: "ja-m12-neo-7", kind: "vocab", blocked: true, note: "copula — no concrete referent" },
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
  { id: "ii", kana: "いい", romaji: "ii", meaningEn: "good, fine, OK", shortGloss: "good", fromModule: "m12", introducedByLessonId: "ja-m12-neo-1", kind: "vocab", blocked: true, note: "abstract quality adjective — no honest emoji" },
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
  { id: "ikemasen", kana: "いけません", romaji: "ikemasen", meaningEn: "must not, not allowed", shortGloss: "must not", fromModule: "m14", introducedByLessonId: "ja-m14-neo-7", kind: "vocab", blocked: true, note: "fixed prohibition helper — no concrete referent" },
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
  { id: "koto", kana: "こと", romaji: "koto", meaningEn: "thing, the act of doing", shortGloss: "thing (act of)", fromModule: "m15", introducedByLessonId: "ja-m15-neo-4", kind: "vocab", blocked: true, note: "nominalizer / abstract 'thing' — no concrete referent" },
  { id: "toki-when", kana: "とき", romaji: "toki", meaningEn: "time, when", shortGloss: "time, when", fromModule: "m15", introducedByLessonId: "ja-m15-neo-5", kind: "vocab", blocked: true, note: "temporal function noun — an emoji clock would read as じかん/とけい" },
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
  { id: "node", kana: "ので", romaji: "node", meaningEn: "because (softer)", shortGloss: "because", fromModule: "m16", introducedByLessonId: "ja-m16-neo-3", kind: "vocab", blocked: true, note: "conjunctive particle — no concrete referent" },
  { id: "kedo", kana: "けど", romaji: "kedo", meaningEn: "but", fromModule: "m16", introducedByLessonId: "ja-m16-neo-4", kind: "vocab", blocked: true, note: "conjunctive particle — no concrete referent" },
  { id: "made", kana: "まで", romaji: "made", meaningEn: "until, as far as", shortGloss: "until", fromModule: "m16", introducedByLessonId: "ja-m16-neo-6", kind: "vocab", blocked: true, note: "span-end particle — no concrete referent" },
  { id: "gatsu", kana: "がつ", romaji: "gatsu", meaningEn: "month (in a date)", shortGloss: "month", fromModule: "m16", introducedByLessonId: "ja-m16-neo-6", kind: "vocab", blocked: true, note: "bound month suffix — 📅 already belongs to きょう" },
  { id: "zenzen", kana: "ぜんぜん", romaji: "zenzen", meaningEn: "not at all (with a negative)", shortGloss: "not at all", fromModule: "m16", introducedByLessonId: "ja-m16-neo-8", kind: "vocab", blocked: true, note: "polarity adverb — only ever appears beside a negative" },
  { id: "mai-counter", kana: "まい", romaji: "mai", meaningEn: "counter for flat things", shortGloss: "flat-thing counter", fromModule: "m16", introducedByLessonId: "ja-m16-neo-9", kind: "vocab", blocked: true, note: "bound counter — no concrete referent of its own" },
  // なかった is the ONE conjugated surface m16 has to register. Every other
  // past-negative it teaches is derivable — たべなかった / のまなかった /
  // いかなかった come out of VERB_ENTRIES via the nai-past chain, さむかった out
  // of ADJ_ENTRIES — but ある and いる are absent from VERB_ENTRIES entirely, so
  // ある's past negative exists in no lexicon the guards read. Without a row
  // here 「じかんが なかったから」 tokenizes as なか ("inside") + った, which is
  // both an untracked fragment AND a silent SRS mis-credit: the same class m14
  // documented for いけません and m15 for こと/とき.
  { id: "nakatta", kana: "なかった", romaji: "nakatta", meaningEn: "there wasn't, didn't have", shortGloss: "didn't have", fromModule: "m16", introducedByLessonId: "ja-m16-neo-8", kind: "vocab", blocked: true, note: "past negative of ある — ある is not in VERB_ENTRIES, so no lexicon derives it" },
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
  { id: "sai-counter", kana: "さい", romaji: "sai", meaningEn: "years old (counter for age)", shortGloss: "years old", fromModule: "m17", introducedByLessonId: "ja-m17-neo-5", kind: "vocab", blocked: true, note: "bound age counter — no concrete referent of its own" },
  { id: "nin-counter", kana: "にん", romaji: "nin", meaningEn: "counter for people", shortGloss: "people counter", fromModule: "m17", introducedByLessonId: "ja-m17-neo-4", kind: "vocab", blocked: true, note: "bound people counter — 🧍 already belongs to からだ and 👥 to ひと" },
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
  とる: "toru", // 取る to take, not 撮る to photograph
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
 * `front`: kana (with kanji prefix if available, e.g. "毎朝 (まいあさ)").
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
  const front = atom.kanji ? `${atom.kanji} (${atom.kana})` : atom.kana;
  return {
    id: canonicalAtomId(atom),
    front,
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
