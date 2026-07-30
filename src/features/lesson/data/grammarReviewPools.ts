/**
 * Grammar Deck v1 — per-point example-step pools + deterministic rotation
 * (Track B, retention design §Track B; plan `docs/grammar-deck-v1-spec-2026-07-02.md`).
 *
 * The reviewable unit is a GRAMMAR POINT (one scheduled FSRS item per point,
 * never one card per sentence — the Bunpro model, avoids FSRS sibling
 * distortion). Each point owns a POOL of interactive example steps
 * (cloze / sentence-MCQ / build — never flip cards). On each review we rotate
 * deterministically through the pool by rep count, so the surface sentence
 * varies while the schedule stays single-item.
 *
 * Two sources feed a point's pool, deduped by step id:
 *   1. AUTHORED_GRAMMAR_POOLS — hand-authored steps (this file).
 *   2. getGrammarReviewIndex() — steps auto-harvested from the curriculum
 *      (particle clozes + synthesized conjugation/counter MCQs).
 *
 * Comprehensibility is the authoring law (machine-enforced by
 * grammarReviewPools.test.ts): every sentence in a point's pool must decompose
 * entirely into course atoms with `fromModule` ≤ the point's module, taught
 * conjugation endings, and punctuation — never show a word the learner can't
 * reasonably be expected to know yet.
 */
import type { LessonStep, GrammarRuleStep } from "../types";
import type { SRSCardState } from "@/features/flashcards/data/types";
import grammarPointsJson from "./n5-grammar-points.json";
import type { GrammarPoint } from "@/features/flashcards/engine/grammarSrs";
import { getGrammarReviewIndex } from "./grammarReviewIndex";
import {
  getAvailableMockLessonIds,
  getMockLessonContent,
} from "./mockLessons";
import { cloze, sentenceMcq } from "@/features/languages/ja/grammarHelpers";

const GRAMMAR_POINTS = grammarPointsJson as GrammarPoint[];

/** Minimum authored+harvested pool size a shipped point should reach. */
export const MIN_POOL_SIZE = 3;

/** Tag an authored pool step with the grammar point it exercises (Track B
 *  grading key). cloze()/sentenceMcq() don't set exercisedGrammar, so every
 *  authored step is wrapped here. */
function g(pointId: string, step: LessonStep): LessonStep {
  return { ...step, exercisedGrammar: [pointId] };
}

/**
 * Authored per-point pools. Key = grammar point id. Each step sets
 * `exercisedGrammar: [pointId]` (via `g`) and a unique id `ja-gpool-<pointId>-<n>`.
 * Every sentence here is machine-verified comprehensible at its point's module
 * by the STRICT authored gate in `grammarReviewPools.test.ts` (decomposes into
 * atoms ≤ module + taught endings + the point token + punctuation).
 *
 * Coverage: closes the `pointsBelowMinPool()` gap for the points that CAN be
 * exercised comprehensibly with early-enough vocab. Conjugation-formation
 * points (te-form family, plain past/negative, い-adjective non-present forms,
 * modal stem-attachers …) stay uncovered on purpose — the gate's greedy-atom
 * tokenizer can't decompose a conjugated verb/adjective stem (the atom is the
 * dictionary form), so an honest sentence can't pass. Those remain listed in
 * the test's `POOL_GAP_EXEMPTIONS` with rationale.
 */
export const AUTHORED_GRAMMAR_POOLS: Readonly<Record<string, LessonStep[]>> = {
  "desu-copula": [
    g("desu-copula", cloze("ja-gpool-desu-copula-1", "がくせい", "", "です", ["です", "じゃないです", "でした"], "It's a student.", "がくせいです")),
    g("desu-copula", cloze("ja-gpool-desu-copula-2", "みず", "", "です", ["です", "じゃないです", "でした"], "It's water.", "みずです")),
    g("desu-copula", cloze("ja-gpool-desu-copula-3", "にほんじん", "", "です", ["です", "じゃないです", "でした"], "They're Japanese.", "にほんじんです")),
  ],
  // NB: stems here must stay DISJOINT from desu-copula's (がくせい/みず/
  // にほんじん) — the identical stem がくせい[_] used to live in BOTH pools
  // with opposite answers (2026-07-06 audit), making the question literally
  // unanswerable.
  "janai-desu": [
    g("janai-desu", cloze("ja-gpool-janai-desu-1", "ねこ", "", "じゃないです", ["じゃないです", "です", "でした"], "It's not a cat.", "ねこじゃないです")),
    g("janai-desu", cloze("ja-gpool-janai-desu-2", "ほん", "", "じゃないです", ["じゃないです", "です", "でした"], "It's not a book.", "ほんじゃないです")),
    g("janai-desu", cloze("ja-gpool-janai-desu-3", "ともだち", "", "じゃないです", ["じゃないです", "です", "でした"], "They're not a friend.", "ともだちじゃないです")),
  ],
  "kore-sore-are-dore": [
    g("kore-sore-are-dore", cloze("ja-gpool-kore-sore-are-dore-1", "", "はほんです", "これ", ["これ", "それ", "あれ", "どれ"], "This is a book.", "これはほんです")),
    g("kore-sore-are-dore", cloze("ja-gpool-kore-sore-are-dore-2", "", "はかさです", "それ", ["それ", "これ", "あれ", "どれ"], "That is an umbrella.", "それはかさです")),
    g("kore-sore-are-dore", cloze("ja-gpool-kore-sore-are-dore-3", "", "はくるまです", "あれ", ["あれ", "これ", "それ", "どれ"], "That over there is a car.", "あれはくるまです")),
  ],
  "kono-sono-ano-dono": [
    g("kono-sono-ano-dono", cloze("ja-gpool-kono-sono-ano-dono-1", "", "ほんはたかいです", "この", ["この", "その", "あの", "どの"], "This book is expensive.", "このほんはたかいです")),
    g("kono-sono-ano-dono", cloze("ja-gpool-kono-sono-ano-dono-2", "", "くるまはあたらしいです", "その", ["その", "この", "あの", "どの"], "That car is new.", "そのくるまはあたらしいです")),
    g("kono-sono-ano-dono", cloze("ja-gpool-kono-sono-ano-dono-3", "", "みせはとおいです", "あの", ["あの", "この", "その", "どの"], "That shop over there is far.", "あのみせはとおいです")),
  ],
  "arimasu": [
    g("arimasu", cloze("ja-gpool-arimasu-1", "ここにえきが", "", "あります", ["あります", "います", "です"], "There is a station here.", "ここにえきがあります")),
    g("arimasu", cloze("ja-gpool-arimasu-2", "あそこにぎんこうが", "", "あります", ["あります", "います", "です"], "There is a bank over there.", "あそこにぎんこうがあります")),
    g("arimasu", cloze("ja-gpool-arimasu-3", "がっこうにとしょかんが", "", "あります", ["あります", "います", "です"], "There is a library at the school.", "がっこうにとしょかんがあります")),
  ],
  // Authored 2026-07-06: imasu's harvested pool was 100% て+います progressive
  // sentences mis-attributed from m15 (te-iru's construction); the harvest
  // window drops them all, so existential います gets an authored trio
  // mirroring arimasu's (animate subjects, same option set).
  "imasu": [
    g("imasu", cloze("ja-gpool-imasu-1", "こうえんにねこが", "", "います", ["います", "あります", "です"], "There is a cat in the park.", "こうえんにねこがいます")),
    g("imasu", cloze("ja-gpool-imasu-2", "がっこうにせんせいが", "", "います", ["います", "あります", "です"], "There is a teacher at the school.", "がっこうにせんせいがいます")),
    g("imasu", cloze("ja-gpool-imasu-3", "えきにともだちが", "", "います", ["います", "あります", "です"], "My friend is at the station.", "えきにともだちがいます")),
  ],
  "numbers-1-10": [
    g("numbers-1-10", sentenceMcq({ id: "ja-gpool-numbers-1-10-1", prompt: "Which word is 3?", correctKana: "さん", distractorsKana: ["し", "ご", "なな"], explanation: "3 is さん.", exercisedAtomKanas: ["さん"] })),
    g("numbers-1-10", sentenceMcq({ id: "ja-gpool-numbers-1-10-2", prompt: "Which word is 7?", correctKana: "なな", distractorsKana: ["ろく", "はち", "きゅう"], explanation: "7 is なな (or しち).", exercisedAtomKanas: ["なな"] })),
    g("numbers-1-10", sentenceMcq({ id: "ja-gpool-numbers-1-10-3", prompt: "Which word is 10?", correctKana: "じゅう", distractorsKana: ["いち", "きゅう", "ろく"], explanation: "10 is じゅう.", exercisedAtomKanas: ["じゅう"] })),
  ],
  "numbers-11-99": [
    g("numbers-11-99", sentenceMcq({ id: "ja-gpool-numbers-11-99-1", prompt: "Which word is 11?", correctKana: "じゅういち", distractorsKana: ["いちじゅう", "じゅうに", "じゅう"], explanation: "11 = じゅう + いち.", exercisedAtomKanas: ["じゅう", "いち"] })),
    g("numbers-11-99", sentenceMcq({ id: "ja-gpool-numbers-11-99-2", prompt: "Which word is 20?", correctKana: "にじゅう", distractorsKana: ["じゅうに", "にじゅうに", "ふたじゅう"], explanation: "20 = に + じゅう.", exercisedAtomKanas: ["に", "じゅう"] })),
    g("numbers-11-99", sentenceMcq({ id: "ja-gpool-numbers-11-99-3", prompt: "Which word is 35?", correctKana: "さんじゅうご", distractorsKana: ["ごじゅうさん", "さんじゅう", "さんご"], explanation: "35 = さんじゅう + ご.", exercisedAtomKanas: ["さん", "じゅう", "ご"] })),
  ],
  "numbers-100-10000": [
    g("numbers-100-10000", sentenceMcq({ id: "ja-gpool-numbers-100-10000-1", prompt: "Which word is 200?", correctKana: "にひゃく", distractorsKana: ["ひゃくに", "にせん", "ふたひゃく"], explanation: "200 = に + ひゃく.", exercisedAtomKanas: ["に", "ひゃく"] })),
    g("numbers-100-10000", sentenceMcq({ id: "ja-gpool-numbers-100-10000-2", prompt: "Which word is 5000?", correctKana: "ごせん", distractorsKana: ["せんご", "ごひゃく", "ごまん"], explanation: "5000 = ご + せん.", exercisedAtomKanas: ["ご", "せん"] })),
    g("numbers-100-10000", sentenceMcq({ id: "ja-gpool-numbers-100-10000-3", prompt: "Which word is 10,000?", correctKana: "いちまん", distractorsKana: ["まんいち", "いちせん", "じゅうせん"], explanation: "10,000 = いち + まん.", exercisedAtomKanas: ["いち", "まん"] })),
  ],
  "i-adj-present": [
    // 2026-07-29: was 「このみずはつめたいです」 — つめたい is now honestly
    // fromModule m14 (vocab pack 4 re-home), which exposed this m12-point
    // step as teach-before-taught; おいしい is m12's own.
    g("i-adj-present", sentenceMcq({ id: "ja-gpool-i-adj-present-1", prompt: "Say politely: 'This tea is delicious.'", correctKana: "このちゃはおいしいです", distractorsKana: ["このちゃはおいしです", "このちゃはおいしいだ", "このちゃはおいしくないです"], explanation: "い-adjective keeps い, then adds です.", exercisedAtomKanas: ["ちゃ", "おいしい"] })),
    g("i-adj-present", sentenceMcq({ id: "ja-gpool-i-adj-present-2", prompt: "Say politely: 'This town is big.'", correctKana: "このまちはおおきいです", distractorsKana: ["このまちはおおきです", "このまちはおおきいだ", "このまちはおおきくないです"], explanation: "おおきい + です — never drop the い before です.", exercisedAtomKanas: ["まち", "おおきい"] })),
    g("i-adj-present", sentenceMcq({ id: "ja-gpool-i-adj-present-3", prompt: "Say politely: 'This book is cheap.'", correctKana: "このほんはやすいです", distractorsKana: ["このほんはやすです", "このほんはやすいだ", "このほんはやすかったです"], explanation: "い-adjective + です for a polite present statement.", exercisedAtomKanas: ["ほん", "やすい"] })),
  ],
  "na-adj-present": [
    g("na-adj-present", sentenceMcq({ id: "ja-gpool-na-adj-present-1", prompt: "Say politely: 'This room is quiet.'", correctKana: "このへやはしずかです", distractorsKana: ["このへやはしずかいです", "このへやはしずかだです", "このへやはしずかくないです"], explanation: "な-adjective stem + です (no い).", exercisedAtomKanas: ["へや", "しずか"] })),
    g("na-adj-present", sentenceMcq({ id: "ja-gpool-na-adj-present-2", prompt: "Say politely: 'The station is convenient.'", correctKana: "えきはべんりです", distractorsKana: ["えきはべんりいです", "えきはべんりだです", "えきはべんりじゃないです"], explanation: "べんり + です.", exercisedAtomKanas: ["えき", "べんり"] })),
    g("na-adj-present", sentenceMcq({ id: "ja-gpool-na-adj-present-3", prompt: "Say politely: 'This town is lively.'", correctKana: "このまちはにぎやかです", distractorsKana: ["このまちはにぎやかいです", "このまちはにぎやかだです", "このまちはにぎやくないです"], explanation: "な-adjective + です.", exercisedAtomKanas: ["まち", "にぎやか"] })),
  ],
  "na-adj-negative": [
    g("na-adj-negative", sentenceMcq({ id: "ja-gpool-na-adj-negative-1", prompt: "Say politely: 'This room is not quiet.'", correctKana: "このへやはしずかじゃないです", distractorsKana: ["このへやはしずかくないです", "このへやはしずかじゃないだ", "このへやはしずかじゃなかった"], explanation: "な-adjective + じゃないです for polite negative.", exercisedAtomKanas: ["へや", "しずか"] })),
    g("na-adj-negative", sentenceMcq({ id: "ja-gpool-na-adj-negative-2", prompt: "Say politely: 'The station is not convenient.'", correctKana: "えきはべんりじゃないです", distractorsKana: ["えきはべんりくないです", "えきはべんりじゃないだ", "えきはべんりじゃありませんでした"], explanation: "べんり + じゃないです.", exercisedAtomKanas: ["えき", "べんり"] })),
    g("na-adj-negative", sentenceMcq({ id: "ja-gpool-na-adj-negative-3", prompt: "Say politely: 'This town is not lively.'", correctKana: "このまちはにぎやかじゃないです", distractorsKana: ["このまちはにぎやくないです", "このまちはにぎやかじゃないだ", "このまちはにぎやかくない"], explanation: "な-adjective + じゃないです.", exercisedAtomKanas: ["まち", "にぎやか"] })),
  ],
  "na-adj-past": [
    g("na-adj-past", sentenceMcq({ id: "ja-gpool-na-adj-past-1", prompt: "Say politely: 'The room was quiet.'", correctKana: "へやはしずかでした", distractorsKana: ["へやはしずかかったです", "へやはしずかでしただ", "へやはしずかだった"], explanation: "な-adjective + でした for polite past.", exercisedAtomKanas: ["へや", "しずか"] })),
    g("na-adj-past", sentenceMcq({ id: "ja-gpool-na-adj-past-2", prompt: "Say politely: 'The test was tough.'", correctKana: "テストはたいへんでした", distractorsKana: ["テストはたいへんかったです", "テストはたいへんでしただ", "テストはたいへんだった"], explanation: "たいへん + でした.", exercisedAtomKanas: ["たいへん"] })),
    g("na-adj-past", sentenceMcq({ id: "ja-gpool-na-adj-past-3", prompt: "Say politely: 'The town was lively.'", correctKana: "まちはにぎやかでした", distractorsKana: ["まちはにぎやかかったです", "まちはにぎやかでしただ", "まちはにぎやくなかった"], explanation: "な-adjective + でした.", exercisedAtomKanas: ["まち", "にぎやか"] })),
  ],
  "mada-mou": [
    g("mada-mou", cloze("ja-gpool-mada-mou-1", "", "おそいです", "もう", ["もう", "まだ", "あまり", "よく"], "It's already late.", "もうおそいです")),
    g("mada-mou", cloze("ja-gpool-mada-mou-2", "", "はやいです", "まだ", ["まだ", "もう", "あまり", "よく"], "It's still early.", "まだはやいです")),
    g("mada-mou", cloze("ja-gpool-mada-mou-3", "", "いいです", "もう", ["もう", "まだ", "あまり", "よく"], "That's enough already.", "もういいです")),
  ],
  "ni-time": [
    g("ni-time", cloze("ja-gpool-ni-time-1", "にちようび", "ほんをよみます", "に", ["に", "は", "を", "で"], "On Sunday I read a book.", "にちようびにほんをよみます")),
    g("ni-time", cloze("ja-gpool-ni-time-2", "げつようび", "がっこうにいきます", "に", ["に", "は", "を", "で"], "On Monday I go to school.", "げつようびにがっこうにいきます")),
    g("ni-time", cloze("ja-gpool-ni-time-3", "どようび", "みずをのみます", "に", ["に", "は", "を", "で"], "On Saturday I drink water.", "どようびにみずをのみます")),
  ],
  "frequency-adverbs": [
    g("frequency-adverbs", cloze("ja-gpool-frequency-adverbs-1", "", "みずをのみます", "いつも", ["いつも", "よく", "ときどき", "あまり"], "I always drink water.", "いつもみずをのみます")),
    g("frequency-adverbs", cloze("ja-gpool-frequency-adverbs-2", "", "ほんをよみます", "よく", ["よく", "いつも", "ときどき", "あまり"], "I often read books.", "よくほんをよみます")),
    g("frequency-adverbs", cloze("ja-gpool-frequency-adverbs-3", "", "てがみをかきます", "ときどき", ["ときどき", "いつも", "よく", "あまり"], "I sometimes write letters.", "ときどきてがみをかきます")),
  ],
  "kara-time": [
    g("kara-time", cloze("ja-gpool-kara-time-1", "ごご", "がっこうにいきます", "から", ["から", "まで", "に", "で"], "From the afternoon I go to school.", "ごごからがっこうにいきます")),
    g("kara-time", cloze("ja-gpool-kara-time-2", "あさ", "ほんをよみます", "から", ["から", "まで", "に", "を"], "From the morning I read books.", "あさからほんをよみます")),
    g("kara-time", cloze("ja-gpool-kara-time-3", "ごぜん", "みずをのみます", "から", ["から", "まで", "に", "で"], "From the morning I drink water.", "ごぜんからみずをのみます")),
  ],
  "kara-because": [
    g("kara-because", cloze("ja-gpool-kara-because-1", "とおい", "じてんしゃでいきます", "から", ["から", "まで", "に", "と"], "Because it's far, I go by bicycle.", "とおいからじてんしゃでいきます")),
    g("kara-because", cloze("ja-gpool-kara-because-2", "たかい", "かさをみます", "から", ["から", "まで", "に", "が"], "Because it's expensive, I just look at the umbrella.", "たかいからかさをみます")),
    g("kara-because", cloze("ja-gpool-kara-because-3", "さむい", "うちにいます", "から", ["から", "まで", "に", "と"], "Because it's cold, I stay home.", "さむいからうちにいます")),
  ],
  "ga-hoshii": [
    g("ga-hoshii", cloze("ja-gpool-ga-hoshii-1", "みず", "ほしいです", "が", ["が", "を", "は", "に"], "I want water.", "みずがほしいです")),
    g("ga-hoshii", cloze("ja-gpool-ga-hoshii-2", "くるま", "ほしいです", "が", ["が", "を", "は", "に"], "I want a car.", "くるまがほしいです")),
    g("ga-hoshii", cloze("ja-gpool-ga-hoshii-3", "かばん", "ほしいです", "が", ["が", "を", "は", "に"], "I want a bag.", "かばんがほしいです")),
  ],
  "ga-itai": [
    g("ga-itai", cloze("ja-gpool-ga-itai-1", "め", "いたいです", "が", ["が", "を", "は", "に"], "My eyes hurt.", "めがいたいです")),
    g("ga-itai", cloze("ja-gpool-ga-itai-2", "あたま", "いたいです", "が", ["が", "を", "は", "に"], "My head hurts.", "あたまがいたいです")),
    g("ga-itai", cloze("ja-gpool-ga-itai-3", "おなか", "いたいです", "が", ["が", "を", "は", "に"], "My stomach hurts.", "おなかがいたいです")),
  ],
  "suki-kirai-no": [
    g("suki-kirai-no", cloze("ja-gpool-suki-kirai-no-1", "およぐの", "すきです", "が", ["が", "を", "は", "に"], "I like swimming.", "およぐのがすきです")),
    g("suki-kirai-no", cloze("ja-gpool-suki-kirai-no-2", "はしるの", "きらいです", "が", ["が", "を", "は", "に"], "I dislike running.", "はしるのがきらいです")),
    g("suki-kirai-no", cloze("ja-gpool-suki-kirai-no-3", "かくの", "すきです", "が", ["が", "を", "は", "に"], "I like writing.", "かくのがすきです")),
  ],
  "no-ga-jouzu": [
    g("no-ga-jouzu", cloze("ja-gpool-no-ga-jouzu-1", "およぐの", "じょうずです", "が", ["が", "を", "は", "に"], "I'm good at swimming.", "およぐのがじょうずです")),
    g("no-ga-jouzu", cloze("ja-gpool-no-ga-jouzu-2", "はなすの", "じょうずです", "が", ["が", "を", "は", "に"], "I'm good at speaking.", "はなすのがじょうずです")),
    g("no-ga-jouzu", cloze("ja-gpool-no-ga-jouzu-3", "かくの", "じょうずです", "が", ["が", "を", "は", "に"], "I'm good at writing.", "かくのがじょうずです")),
  ],
  "no-ga-heta": [
    g("no-ga-heta", cloze("ja-gpool-no-ga-heta-1", "およぐの", "へたです", "が", ["が", "を", "は", "に"], "I'm bad at swimming.", "およぐのがへたです")),
    g("no-ga-heta", cloze("ja-gpool-no-ga-heta-2", "はしるの", "へたです", "が", ["が", "を", "は", "に"], "I'm bad at running.", "はしるのがへたです")),
    g("no-ga-heta", cloze("ja-gpool-no-ga-heta-3", "よむの", "へたです", "が", ["が", "を", "は", "に"], "I'm bad at reading.", "よむのがへたです")),
  ],
  "no-ga-suki": [
    g("no-ga-suki", cloze("ja-gpool-no-ga-suki-1", "うたうの", "すきです", "が", ["が", "を", "は", "に"], "I like singing.", "うたうのがすきです")),
    g("no-ga-suki", cloze("ja-gpool-no-ga-suki-2", "はなすの", "すきです", "が", ["が", "を", "は", "に"], "I like talking.", "はなすのがすきです")),
    g("no-ga-suki", cloze("ja-gpool-no-ga-suki-3", "みるの", "すきです", "が", ["が", "を", "は", "に"], "I like watching.", "みるのがすきです")),
  ],
  "ichiban-superlative": [
    g("ichiban-superlative", cloze("ja-gpool-ichiban-superlative-1", "このみせが", "やすいです", "いちばん", ["いちばん", "とても", "あまり", "よく"], "This shop is the cheapest.", "このみせがいちばんやすいです")),
    g("ichiban-superlative", cloze("ja-gpool-ichiban-superlative-2", "このほんが", "おもしろいです", "いちばん", ["いちばん", "とても", "あまり", "よく"], "This book is the most interesting.", "このほんがいちばんおもしろいです")),
    g("ichiban-superlative", cloze("ja-gpool-ichiban-superlative-3", "このくるまが", "はやいです", "いちばん", ["いちばん", "とても", "あまり", "よく"], "This car is the fastest.", "このくるまがいちばんはやいです")),
  ],
  "family-register": [
    g("family-register", sentenceMcq({ id: "ja-gpool-family-register-1", prompt: "Which word means your OWN father?", correctKana: "ちち", distractorsKana: ["はは", "あに", "おとうさん"], explanation: "ちち = my (own) father; おとうさん = someone else's.", exercisedAtomKanas: ["ちち"] })),
    g("family-register", sentenceMcq({ id: "ja-gpool-family-register-2", prompt: "Which word means your OWN mother?", correctKana: "はは", distractorsKana: ["ちち", "あね", "おかあさん"], explanation: "はは = my (own) mother; おかあさん is the polite/other form.", exercisedAtomKanas: ["はは"] })),
    g("family-register", sentenceMcq({ id: "ja-gpool-family-register-3", prompt: "Which word politely means someone's father?", correctKana: "おとうさん", distractorsKana: ["ちち", "はは", "おとうと"], explanation: "おとうさん = (someone's) father, honorific.", exercisedAtomKanas: ["おとうさん"] })),
  ],
  "deshou": [
    g("deshou", cloze("ja-gpool-deshou-1", "あしたさむい", "", "でしょう", ["でしょう", "です", "でした"], "It'll probably be cold tomorrow.", "あしたさむいでしょう")),
    g("deshou", cloze("ja-gpool-deshou-2", "あしたあめ", "", "でしょう", ["でしょう", "です", "でした"], "It'll probably rain tomorrow.", "あしたあめでしょう")),
    g("deshou", cloze("ja-gpool-deshou-3", "あしたいい", "", "でしょう", ["でしょう", "です", "でした"], "It'll probably be nice tomorrow.", "あしたいいでしょう")),
  ],
  "tsumori-desu": [
    g("tsumori-desu", sentenceMcq({ id: "ja-gpool-tsumori-desu-1", prompt: "Say: 'I intend to swim tomorrow.'", correctKana: "あしたおよぐつもりです", distractorsKana: ["あしたおよぎつもりです", "あしたおよぐつもりでした", "あしたおよぐつもり"], explanation: "dictionary form + つもりです = 'intend to'.", exercisedAtomKanas: ["あした", "およぐ"] })),
    g("tsumori-desu", sentenceMcq({ id: "ja-gpool-tsumori-desu-2", prompt: "Say: 'I intend to read a book.'", correctKana: "ほんをよむつもりです", distractorsKana: ["ほんをよみつもりです", "ほんをよむつもりだ", "ほんをよんつもりです"], explanation: "Plain verb + つもりです.", exercisedAtomKanas: ["ほん", "よむ"] })),
    g("tsumori-desu", sentenceMcq({ id: "ja-gpool-tsumori-desu-3", prompt: "Say: 'I intend to drink water.'", correctKana: "みずをのむつもりです", distractorsKana: ["みずをのみつもりです", "みずをのむつもりでした", "みずをのんつもりです"], explanation: "のむ + つもりです.", exercisedAtomKanas: ["みず", "のむ"] })),
  ],
  "to-omoimasu": [
    g("to-omoimasu", sentenceMcq({ id: "ja-gpool-to-omoimasu-1", prompt: "Say: 'I think it'll be cold tomorrow.'", correctKana: "あしたさむいとおもいます", distractorsKana: ["あしたさむいおもいます", "あしたさむいとおもます", "あしたさむいとおもいました"], explanation: "plain form + と + おもいます.", exercisedAtomKanas: ["あした", "さむい"] })),
    g("to-omoimasu", sentenceMcq({ id: "ja-gpool-to-omoimasu-2", prompt: "Say: 'I think this book is expensive.'", correctKana: "このほんはたかいとおもいます", distractorsKana: ["このほんはたかいおもいます", "このほんはたかいとおもます", "このほんはたかいとおもう"], explanation: "clause + と + おもいます.", exercisedAtomKanas: ["ほん", "たかい"] })),
    g("to-omoimasu", sentenceMcq({ id: "ja-gpool-to-omoimasu-3", prompt: "Say: 'I think the station is far.'", correctKana: "えきはとおいとおもいます", distractorsKana: ["えきはとおいおもいます", "えきはとおいとおもました", "えきはとおいとおもいませ"], explanation: "と marks the quoted thought before おもいます.", exercisedAtomKanas: ["えき", "とおい"] })),
  ],
  "n-desu": [
    g("n-desu", sentenceMcq({ id: "ja-gpool-n-desu-1", prompt: "Say (explaining): 'It's that my head hurts.'", correctKana: "あたまがいたいんです", distractorsKana: ["あたまがいたいのです", "あたまがいたいです", "あたまがいたいんだ"], explanation: "い-adjective + んです adds an explanatory nuance.", exercisedAtomKanas: ["あたま", "いたい"] })),
    g("n-desu", sentenceMcq({ id: "ja-gpool-n-desu-2", prompt: "Say (explaining): 'It's that I want this book.'", correctKana: "このほんがほしいんです", distractorsKana: ["このほんがほしいのです", "このほんがほしいです", "このほんがほしいんだ"], explanation: "plain form + んです = 'the thing is…'.", exercisedAtomKanas: ["ほん", "ほしい"] })),
    g("n-desu", sentenceMcq({ id: "ja-gpool-n-desu-3", prompt: "Say (explaining): 'It's that the shop is far.'", correctKana: "みせがとおいんです", distractorsKana: ["みせがとおいのです", "みせがとおいです", "みせがとおいんだ"], explanation: "んです gives a reason/explanation.", exercisedAtomKanas: ["みせ", "とおい"] })),
  ],
  "ku-ni-naru": [
    g("ku-ni-naru", sentenceMcq({ id: "ja-gpool-ku-ni-naru-1", prompt: "Say: 'The room becomes clean.'", correctKana: "へやがきれいになる", distractorsKana: ["へやがきれいくなる", "へやがきれいなる", "へやがきれいにする"], explanation: "な-adjective + に + なる = 'become'.", exercisedAtomKanas: ["へや", "きれい", "なる"] })),
    g("ku-ni-naru", sentenceMcq({ id: "ja-gpool-ku-ni-naru-2", prompt: "Say: 'The town becomes quiet.'", correctKana: "まちがしずかになる", distractorsKana: ["まちがしずかくなる", "まちがしずかなる", "まちがしずかにする"], explanation: "しずか + に + なる.", exercisedAtomKanas: ["まち", "しずか", "なる"] })),
    g("ku-ni-naru", sentenceMcq({ id: "ja-gpool-ku-ni-naru-3", prompt: "Say: 'The station becomes convenient.'", correctKana: "えきがべんりになる", distractorsKana: ["えきがべんりくなる", "えきがべんりなる", "えきがべんりにする"], explanation: "な-adjective takes に before なる.", exercisedAtomKanas: ["えき", "べんり", "なる"] })),
  ],
  "counter-ji": [
    g("counter-ji", sentenceMcq({ id: "ja-gpool-counter-ji-1", prompt: "How do you say '3 o'clock'?", correctKana: "さんじ", distractorsKana: ["さんふん", "みっつ", "さんまい"], explanation: "3 o'clock = さん + じ (時).", exercisedAtomKanas: ["さん"] })),
    g("counter-ji", sentenceMcq({ id: "ja-gpool-counter-ji-2", prompt: "How do you say '2 o'clock'?", correctKana: "にじ", distractorsKana: ["にふん", "ふたつ", "にまい"], explanation: "2 o'clock = に + じ.", exercisedAtomKanas: ["に"] })),
    g("counter-ji", sentenceMcq({ id: "ja-gpool-counter-ji-3", prompt: "How do you say '10 o'clock'?", correctKana: "じゅうじ", distractorsKana: ["じゅうふん", "じゅっこ", "じゅうまい"], explanation: "10 o'clock = じゅう + じ.", exercisedAtomKanas: ["じゅう"] })),
  ],
  "counter-fun": [
    g("counter-fun", sentenceMcq({ id: "ja-gpool-counter-fun-1", prompt: "How do you say '5 minutes'?", correctKana: "ごふん", distractorsKana: ["ごじ", "いつつ", "ごまい"], explanation: "5 minutes = ご + ふん (分).", exercisedAtomKanas: ["ご"] })),
    g("counter-fun", sentenceMcq({ id: "ja-gpool-counter-fun-2", prompt: "How do you say '2 minutes'?", correctKana: "にふん", distractorsKana: ["にじ", "ふたつ", "にまい"], explanation: "2 minutes = に + ふん.", exercisedAtomKanas: ["に"] })),
    g("counter-fun", sentenceMcq({ id: "ja-gpool-counter-fun-3", prompt: "How do you say '3 minutes'?", correctKana: "さんぷん", distractorsKana: ["さんじ", "みっつ", "さんまい"], explanation: "3 minutes = さん + ぷん (rendaku).", exercisedAtomKanas: ["さん"] })),
  ],
  "counter-ko": [
    g("counter-ko", sentenceMcq({ id: "ja-gpool-counter-ko-1", prompt: "How do you count '3 items'?", correctKana: "さんこ", distractorsKana: ["さんじ", "さんまい", "さんぼん"], explanation: "3 items = さん + こ (個).", exercisedAtomKanas: ["さん"] })),
    g("counter-ko", sentenceMcq({ id: "ja-gpool-counter-ko-2", prompt: "How do you count '5 items'?", correctKana: "ごこ", distractorsKana: ["ごじ", "ごまい", "ごほん"], explanation: "5 items = ご + こ.", exercisedAtomKanas: ["ご"] })),
    g("counter-ko", sentenceMcq({ id: "ja-gpool-counter-ko-3", prompt: "How do you count '7 items'?", correctKana: "ななこ", distractorsKana: ["ななじ", "ななまい", "ななほん"], explanation: "7 items = なな + こ.", exercisedAtomKanas: ["なな"] })),
  ],
  "counter-mai": [
    g("counter-mai", sentenceMcq({ id: "ja-gpool-counter-mai-1", prompt: "How do you count '3 sheets'?", correctKana: "さんまい", distractorsKana: ["さんこ", "さんじ", "さんぼん"], explanation: "3 flat things = さん + まい (枚).", exercisedAtomKanas: ["さん"] })),
    g("counter-mai", sentenceMcq({ id: "ja-gpool-counter-mai-2", prompt: "How do you count '5 sheets'?", correctKana: "ごまい", distractorsKana: ["ごこ", "ごじ", "ごほん"], explanation: "5 flat things = ご + まい.", exercisedAtomKanas: ["ご"] })),
    g("counter-mai", sentenceMcq({ id: "ja-gpool-counter-mai-3", prompt: "How do you count '10 sheets'?", correctKana: "じゅうまい", distractorsKana: ["じゅうこ", "じゅうじ", "じゅうほん"], explanation: "10 flat things = じゅう + まい.", exercisedAtomKanas: ["じゅう"] })),
  ],
  "counter-hon": [
    g("counter-hon", sentenceMcq({ id: "ja-gpool-counter-hon-1", prompt: "How do you count '3 long objects'?", correctKana: "さんぼん", distractorsKana: ["さんまい", "さんこ", "さんじ"], explanation: "3 long things = さん + ぼん (本, rendaku).", exercisedAtomKanas: ["さん"] })),
    g("counter-hon", sentenceMcq({ id: "ja-gpool-counter-hon-2", prompt: "How do you count '5 long objects'?", correctKana: "ごほん", distractorsKana: ["ごまい", "ごこ", "ごじ"], explanation: "5 long things = ご + ほん.", exercisedAtomKanas: ["ご"] })),
    g("counter-hon", sentenceMcq({ id: "ja-gpool-counter-hon-3", prompt: "How do you count '2 long objects'?", correctKana: "にほん", distractorsKana: ["にまい", "にこ", "にじ"], explanation: "2 long things = に + ほん.", exercisedAtomKanas: ["に"] })),
  ],
  "counter-sai": [
    g("counter-sai", sentenceMcq({ id: "ja-gpool-counter-sai-1", prompt: "How do you say '5 years old'?", correctKana: "ごさい", distractorsKana: ["ごじ", "ごまい", "ごほん"], explanation: "5 years old = ご + さい (歳).", exercisedAtomKanas: ["ご"] })),
    g("counter-sai", sentenceMcq({ id: "ja-gpool-counter-sai-2", prompt: "How do you say '7 years old'?", correctKana: "ななさい", distractorsKana: ["ななじ", "ななまい", "ななこ"], explanation: "7 years old = なな + さい. (10歳 needs the irregular じゅっさい, so it isn't drilled here.)", exercisedAtomKanas: ["なな"] })),
    g("counter-sai", sentenceMcq({ id: "ja-gpool-counter-sai-3", prompt: "How do you say '3 years old'?", correctKana: "さんさい", distractorsKana: ["さんじ", "さんまい", "さんぼん"], explanation: "3 years old = さん + さい.", exercisedAtomKanas: ["さん"] })),
  ],
  "counter-hai": [
    g("counter-hai", sentenceMcq({ id: "ja-gpool-counter-hai-1", prompt: "How do you count '3 cups'?", correctKana: "さんばい", distractorsKana: ["さんまい", "さんこ", "さんじ"], explanation: "3 cups = さん + ばい (杯, rendaku).", exercisedAtomKanas: ["さん"] })),
    g("counter-hai", sentenceMcq({ id: "ja-gpool-counter-hai-2", prompt: "How do you count '2 cups'?", correctKana: "にはい", distractorsKana: ["にまい", "にこ", "にじ"], explanation: "2 cups = に + はい.", exercisedAtomKanas: ["に"] })),
    g("counter-hai", sentenceMcq({ id: "ja-gpool-counter-hai-3", prompt: "How do you count '5 cups'?", correctKana: "ごはい", distractorsKana: ["ごまい", "ごこ", "ごじ"], explanation: "5 cups = ご + はい.", exercisedAtomKanas: ["ご"] })),
  ],
};

/**
 * Authored pool ∪ harvested index for a point, deduped by step id (authored
 * steps take precedence on id collision). Returns a fresh array; empty when
 * the point has no steps from either source.
 */
export function getGrammarPool(pointId: string): LessonStep[] {
  const authored = AUTHORED_GRAMMAR_POOLS[pointId] ?? [];
  const harvested = getGrammarReviewIndex().get(pointId) ?? [];
  const seen = new Set<string>();
  const out: LessonStep[] = [];
  for (const step of [...authored, ...harvested]) {
    if (seen.has(step.id)) continue;
    seen.add(step.id);
    out.push(step);
  }
  return out;
}

/**
 * Deterministic rotation: `pool[(recognition.reps + production.reps) % len]`.
 * `state === null` → `pool[0]`. Returns null for an empty pool. Pure — no
 * `Date.now()` / `Math.random()`, so the same (pointId, state) always yields
 * the same step (session replay + tests rely on this).
 */
export function pickPoolStep(
  pointId: string,
  state: SRSCardState | null,
): LessonStep | null {
  const pool = getGrammarPool(pointId);
  if (pool.length === 0) return null;
  if (state === null) return pool[0];
  const reps = state.recognition.reps + state.production.reps;
  return pool[reps % pool.length];
}

// ── Grammar-rule preface index ────────────────────────────────────────────
// Memoized scan of JA content mockLessons for `grammar_rule` steps tagged
// with a `grammarPointId`, so the session can show the rule card before a
// point's FIRST review (teach-before-test). Models the memoized single-walk
// pattern of getGrammarReviewIndex; review-lesson ids are skipped to avoid
// the grammarReviewIndex recursion trap (and because reviews aren't sources).

let ruleIndex: Map<string, GrammarRuleStep> | null = null;

function buildGrammarRuleIndex(): Map<string, GrammarRuleStep> {
  const out = new Map<string, GrammarRuleStep>();
  for (const lessonId of getAvailableMockLessonIds()) {
    if (/-review-[12]$/.test(lessonId)) continue;
    const lesson = getMockLessonContent(lessonId);
    if (!lesson || lesson.languageId !== "ja") continue;
    for (const step of lesson.steps) {
      if (step.type !== "grammar_rule") continue;
      const pid = (step as GrammarRuleStep).grammarPointId;
      if (!pid) continue;
      // First tagged rule wins — a point's canonical teaching card is the
      // one authored in its own module (curriculum order is stable).
      if (!out.has(pid)) out.set(pid, step as GrammarRuleStep);
    }
  }
  return out;
}

/**
 * The `grammar_rule` step that teaches `pointId`, from tagged curriculum
 * content — used to show the rule before a point's FIRST scheduled review.
 * Returns null for points with no tagged rule card (session just skips the
 * preface). Memoized.
 */
export function getGrammarRuleStepForPoint(
  pointId: string,
): GrammarRuleStep | null {
  if (!ruleIndex) ruleIndex = buildGrammarRuleIndex();
  return ruleIndex.get(pointId) ?? null;
}

/** Test/dev helper: drop the memoized rule index. */
export function __resetGrammarRuleIndex(): void {
  ruleIndex = null;
}

function moduleOrder(m: string): number {
  const x = /^m(\d+)$/.exec(m);
  return x ? Number(x[1]) : Infinity;
}

/**
 * Shipped points whose module is ≤ m27 and whose merged pool is below
 * `MIN_POOL_SIZE` — i.e. the coverage gaps authored pools must close.
 * Task 2's exit criterion is driving the matching test exemption list to `[]`.
 */
export function pointsBelowMinPool(): string[] {
  return GRAMMAR_POINTS.filter(
    (p) =>
      p.status === "shipped" &&
      moduleOrder(p.module) <= 27 &&
      getGrammarPool(p.id).length < MIN_POOL_SIZE,
  ).map((p) => p.id);
}
