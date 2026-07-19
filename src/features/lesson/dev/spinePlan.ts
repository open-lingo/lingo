/**
 * DEV · Dictionary-form-first course rewrite — DRAFT SPINE (v2, 2026-07-19).
 *
 * Draft-2 incorporates Spencer's full tile-by-tile review of draft-1
 * (archived: docs/spine-plan-review-draft1-2026-07-19.json) and the
 * CEJC frequency audit (docs/vocab-frequency-audit-2026-07-19.md).
 *
 * What changed from draft-1, per the review:
 *  - SPIRAL PRINCIPLE (Spencer's general note): no concept-dump modules.
 *    Big concepts split into an intro beat and a deepen beat, spaced apart
 *    ("hit over once or twice … in different or more complicated
 *    variations"). Pairs carry `spiralWith` and render linked.
 *  - s06 split: ない alone with existence; た moves to Time-I; なかった
 *    deepens in the connectives module.
 *  - て-form pulled EARLY with ください (traveler utility), rest of the
 *    て family is the deepen beat. Derivation flips: て from the
 *    sound-change table first, た later "same table" (Genki direction).
 *  - Counters dissolved: one generic counter at intro, others drip
 *    naturally as vocabulary calls (s08 note).
 *  - Family split your-side/others'-side (s16 note); others'-side rides
 *    the listing module (s19 note).
 *  - Comparisons split: のほうが early, いちばん later (s20 note).
 *  - とき moved sooner (s22 note); quotation intro earlier (s18 note).
 *  - Frequency backbone: seed verbs picked from CEJC top-500 (いう #20,
 *    わかる #53, おもう #38, なる #39 in the first verb modules);
 *    function nouns もの/こと/とき/ほう taught WITH their grammar;
 *    interaction layer (うん #1, はい #23, そう #9) un-stranded from the
 *    deleted survival sidequest; glue-adverb drip; ぼく/おれ recognition.
 *
 * Locked rulings still encoded: plain-form base, register-explicit
 * production from the ます module on, JLPT waypoints kept, in-place waves.
 */

export type ParitySource =
  | "Tae Kim"
  | "Genki"
  | "Cure Dolly"
  | "Manga Way"
  | "JF/Marugoto"
  | "Research"
  | "CEJC"
  | "Review";

export type ParityRef = {
  source: ParitySource;
  /** Real section/chapter/lesson/rank id — never invented. */
  ref: string;
  note?: string;
};

export type SpineUnit = {
  /** Stable draft id — notes key on this, order does not. */
  id: string;
  title: string;
  emoji: string;
  teaches: string[];
  why: string;
  parity: ParityRef[];
  salvage: string;
  /** Proposed build wave for in-place replacement (1 = first). */
  wave: number;
  milestone?: string;
  risks?: string;
  locked?: boolean;
  /** Spiral partner tile id (intro ↔ deepen beat). */
  spiralWith?: string;
};

export const SPINE_VERSION = "draft-2 (2026-07-19)";

export const SPINE_UNITS: SpineUnit[] = [
  {
    id: "s01",
    title: "Hiragana (m1 — unchanged)",
    emoji: "あ",
    teaches: ["Hiragana rows via symbol drills", "Sound↔script mapping"],
    why: "Script acquisition is orthogonal to the rewrite. Kana engine stays as shipped. (Reviewed: keep.)",
    parity: [],
    salvage: "m1 verbatim.",
    wave: 0,
    locked: true,
  },
  {
    id: "s02",
    title: "Hiragana II + voiced/yōon (m2 — unchanged)",
    emoji: "び",
    teaches: ["Voiced rows, yōon, small っ"],
    why: "Untouched by the rewrite. (Reviewed: keep.)",
    parity: [],
    salvage: "m2 verbatim.",
    wave: 0,
    locked: true,
  },
  {
    id: "thr1",
    title: "⟳ Continuous threads (not a module — runs through everything)",
    emoji: "\u{1F9F5}",
    teaches: [
      "GLUE-ADVERB DRIP: 1–2 top-500 adverbs as vocab per module (ぜんぜん #97, ちゃんと #173, ずっと #174, たとえば #223, さっき #227, すぐ #237, きっと #287, まず #264…) — never a block",
      "COUNTER DRIP: after the generic つ counter, each new counter arrives when a word calls for it, not as a unit",
      "REGISTER DRILLS: from the ます module on, every production step names its audience; both registers stay warm forever",
      "SPIRAL BEATS: every ⟳-linked pair = intro then deepen, ≥3 modules apart, deepen uses harder sentence shapes (lintable)",
      "END-OF-LESSON REVIEWS keep the ≥60% sentence-context floor with all-new example sentences on the second beat",
    ],
    why: "Spencer's review distilled: 'splitting these teachings up into two parts and going over them sometimes more than once … in different or more complicated variations is the most amazing thing we can do.' These threads are the standing rules every module below obeys — leave notes here for anything spine-wide.",
    parity: [
      { source: "Review", ref: "general note (draft-1)", note: "spiral/split principle + programmatic measurement" },
      { source: "CEJC", ref: "audit §4", note: "glue-adverb ranks" },
    ],
    salvage: "The review-tail machinery + sentence miner already implement half of this; the spiral spacing lint is new.",
    wave: 0,
    locked: true,
  },
  {
    id: "s03",
    title: "Plain sentences: だ, は, も + Katakana I",
    emoji: "\u{1F9F1}",
    teaches: [
      "だ state-of-being (AはBだ) — plain from sentence one",
      "は topic / も also; casual questions by rising intonation",
      "そう/うん as recognition (agreement layer, CEJC #9/#1)",
      "です heard in dialogues for RECOGNITION (register preview)",
      "Katakana ア-row + ー",
    ],
    why: "Reviewed: keep. Every dict-first source starts with the plain copula sentence as the atom. New in draft-2: the interaction words そう and うん enter as recognition here — うん is the #1 word in spoken Japanese and casual agreement is how plain-style dialogue actually sounds.",
    parity: [
      { source: "Tae Kim", ref: "§3.1–3.2" },
      { source: "Cure Dolly", ref: "L1–L3" },
      { source: "Manga Way", ref: "ch 1" },
      { source: "CEJC", ref: "#1 うん, #9 そう" },
    ],
    salvage: "m3-v2 katakana rows verbatim; things/colors vocab + stories reframed だ-style.",
    wave: 1,
    milestone: "REWRITE START",
    risks: "だ-drop in casual speech (猫だ vs 猫) — grading policy needed on bare-noun answers.",
  },
  {
    id: "s04",
    title: "Possession & pointing: の, これ/それ/あれ",
    emoji: "\u{1F448}",
    teaches: [
      "の possession + attributive",
      "これ/それ/あれ/どれ; だれ",
      "Katakana II continues",
    ],
    why: "Reviewed: keep. Pure particle/noun grammar on the plain copula frame.",
    parity: [
      { source: "Tae Kim", ref: "§3.10" },
      { source: "Genki", ref: "ch 2" },
    ],
    salvage: "m4 nearly whole; copula reframe only.",
    wave: 1,
  },
  {
    id: "s05",
    title: "VERBS I: dictionary form + classes (frequency-picked seed set)",
    emoji: "⚙️",
    teaches: [
      "Dictionary form as THE verb; る/う/する/くる classes explicit, いる/える exceptions flagged",
      "を direct object; basic SOV",
      "Seed verbs BY CEJC RANK: いう #20, おもう #38 (recognition first), わかる #53, たべる, のむ, いく, くる, する, みる, かう #118, きく #120 …",
      "もの as a COMPOSITIONAL concept: たべもの = たべ+もの, のみもの = のみ+もの (food domain)",
    ],
    why: "Reviewed: keep — now sharpened by the frequency audit. Draft-1 left the seed verbs unspecified; CEJC picks them, and the old course's absurdities (いう at 'future', わかる blocked) end here. もの (#56) enters as the morpheme that explains the food words being learned in the same breath — Spencer's audit instinct, confirmed by the data (derivatives were taught before the morpheme).",
    parity: [
      { source: "Tae Kim", ref: "§3.4 + §3.7" },
      { source: "Cure Dolly", ref: "L5" },
      { source: "CEJC", ref: "audit §3 verb seed-set" },
    ],
    salvage: "m7's food/drink domain + を teaching; verb atoms already dictionary-keyed (SRS/kanji anchors untouched).",
    wave: 1,
    milestone: "VERB CLASSES VISIBLE",
  },
  {
    id: "n06a",
    title: "Plain negative ない + existence ある/いる",
    emoji: "\u{1F6AB}",
    teaches: [
      "ない by class (のまない vs たべない); わからない as the killer everyday example",
      "ある/いる existence + animacy; ある→ない irregularity while the rule is fresh",
      "ここ/そこ/あそこ, に/で location basics",
      "⟳ intro beat — past た arrives 3 modules later, なかった later still",
    ],
    why: "The s06 rework: ONE new conjugation, not four. Existence is the domain because ある's negative IS ない. Past tense moves out to Time-I where it has content to describe; negative-past deepens in the connectives module. This is the sprinkle Spencer asked for, with each beat still class-driven.",
    parity: [
      { source: "Tae Kim", ref: "§3.5" },
      { source: "Review", ref: "s06 note", note: "'too much conjugation built into one … sprinkle'" },
    ],
    salvage: "m6 places/existence vocab + animacy rule + directions dialogue; m29's ない drills.",
    wave: 1,
    spiralWith: "n04",
  },
  {
    id: "s07",
    title: "The stem grid + ます/です — politeness as a layer",
    emoji: "\u{1F3AD}",
    teaches: [
      "Godan a/i/u/e stem rows as attachment points; ます = i-stem + helper; ません/ました/ませんでした",
      "です for nouns/adjectives; です ≠ polite だ; か as the POLITE question marker",
      "はい/ええ/うん — ONE word, three registers (un-strands はい from the deleted sidequest)",
      "わたし/ぼく/おれ — pronoun register, recognition level",
      "Register-explicit production starts: every prompt names its audience",
    ],
    why: "Reviewed: keep. Draft-2 adds the interaction layer and pronoun register — the frequency audit showed はい (#23) stranded blocked in deleted sidequest content and うん (#1) homeless; teaching the yes-words as a register triple IS the register lesson, made concrete.",
    parity: [
      { source: "Tae Kim", ref: "§4.1 + §4.3" },
      { source: "Cure Dolly", ref: "L10 + L17" },
      { source: "CEJC", ref: "audit §2 interaction layer, §5 pronouns" },
    ],
    salvage: "m7 dict↔ます tables inverted; m30 register-awareness content compresses into the intro here.",
    wave: 2,
    milestone: "SCRIPT LADDER: hiragana romaji dies here (M7 cutoff holds)",
  },
  {
    id: "n02",
    title: "て-form + ください — asking for things",
    emoji: "\u{1F64F}",
    teaches: [
      "て via the sound-change table (って/んで/いて/いで/して) — taught ONCE, spent for years",
      "〜てください requests (+ bare ください with nouns)",
      "Traveler beat: order food, ask someone to wait/say it again (まってください, もういちど いってください)",
      "⟳ intro beat — ている/permission/prohibition deepen later",
    ],
    why: "The s12 rework, half one: Spencer — 'teach te earlier and teach kudasai so they can ask for things … what would a traveler or basic speaker be able to use early.' Derivation direction flips from draft-1: て comes first off the sound-change table (Genki's direction), and た later is 'same table' for free. PT research is satisfied — basic inflection (ない, ます) precedes て-combinations.",
    parity: [
      { source: "Genki", ref: "ch 6", note: "same slot ~26% through; て before た" },
      { source: "Review", ref: "s12 note", note: "traveler utility" },
      { source: "Research", ref: "PT (Kawaguchi)", note: "て-combos after basic inflection — holds" },
    ],
    salvage: "m14's group-by-group て tables nearly verbatim (the expensive asset), re-motivated.",
    wave: 2,
    spiralWith: "n06b",
  },
  {
    id: "n03",
    title: "Numbers 1–10 + first purchases",
    emoji: "\u{1FA99}",
    teaches: [
      "Sino numerals 1–10 ONLY, solid (prerequisite for Time-I — advisory gate)",
      "ONE counter: generic つ (ひとつ/ふたつ/みっつ)",
      "いくら/えん; shop dialogues spend ください in obligatory-polite register",
      "Other counters DRIP later as words call for them (thread rule)",
    ],
    why: "The s08 rework: numbers stop being a block. 1–10 + one counter + a transaction is a learnable bite; にん/まい/ほん arrive later attached to real needs. Shop register is where polite is genuinely obligatory — first arena where the s07 register drills feel real.",
    parity: [
      { source: "Review", ref: "s08 note", note: "'one or two counters … introduced naturally as words call for them'" },
      { source: "Genki", ref: "ch 1–2", note: "numbers early — we keep that, minus the counter dump" },
    ],
    salvage: "m5's two-number-system rule + cafe story + transaction TTS (mostly polite already).",
    wave: 2,
  },
  {
    id: "n04",
    title: "Time I + plain past た (compound numbers)",
    emoji: "⏰",
    teaches: [
      "COMPOSITIONAL numbers: じゅう+X / X+じゅう → 11–99 understood, not memorized (Spencer's s10 note)",
      "〜じ hours; days of week",
      "Plain past た — same sound-change table as て ('one fact, second payout')",
      "ました/でした drilled BESIDE た/だった (diary told to a friend AND a teacher)",
      "⟳ deepen of n06a's paradigm; なかった completes later",
    ],
    why: "Past tense lands where there's content to describe (yesterday, last week) — the sprinkle in action. Numbers extend compositionally exactly as Spencer's s10 note prescribed, gated (advisorily) on 1–10 mastery from n03 — FSRS can check that programmatically.",
    parity: [
      { source: "Review", ref: "s10 note", note: "juu+X pedagogy; needs 1–10 solid first" },
      { source: "Genki", ref: "ch 4", note: "past staging" },
      { source: "Cure Dolly", ref: "L4", note: "plain た early" },
    ],
    salvage: "m12 time tables (ぷん rendaku defers to the drip); m10 past sets re-anchored plain-first.",
    wave: 2,
    spiralWith: "n06a",
    risks: "Advisory mastery-gate on module entry is a NEW mechanic — soft banner, not a hard lock (exposure-over-protection ruling).",
  },
  {
    id: "s09",
    title: "Adjectives as mini-predicates (い + な)",
    emoji: "\u{1F308}",
    teaches: [
      "い-adj conjugation IN PARALLEL with plain verbs (高い/くない/かった)",
      "な-adj + だ/です; じゃない",
      "High-frequency set: いい/よい, すごい #49, うまい #197, こわい #214, だめ #113",
      "よ/ね enders (both registers); すき/きらい with が",
      "PEDAGOGY: teach-by-showing — minimal info cards, learner infers the pattern from contrasts (Spencer's s09 note)",
    ],
    why: "Reviewed: keep, with the discovery-learning note now binding for authoring. Frequency audit adds すごい/だめ — top-120 words the old course never taught.",
    parity: [
      { source: "Cure Dolly", ref: "L6–L7" },
      { source: "Review", ref: "s09 note", note: "'teach by showing … figure things out'" },
      { source: "CEJC", ref: "#49 すごい, #113 だめ" },
    ],
    salvage: "m8+m9 merged: antonym pairs, い-vs-な drill, stories (register pass).",
    wave: 3,
  },
  {
    id: "n05",
    title: "Wanting: たい + ほしい",
    emoji: "\u{1F31F}",
    teaches: [
      "たい as i-stem attachment that then CONJUGATES AS an い-adjective — the two systems click together",
      "がほしい for things",
      "にいく purpose-of-motion (stem + にいく)",
    ],
    why: "The s14 move, resolved: Spencer suggested 'closer to the intro of adjectives' — exactly right, because たい IS an い-adjective wearing a verb stem. Placed immediately after s09 so the adjective rules get their first payout.",
    parity: [
      { source: "Review", ref: "s14 note", note: "'maybe closer to the intro of adjectives?'" },
      { source: "Tae Kim", ref: "§4.10" },
      { source: "Cure Dolly", ref: "L9" },
    ],
    salvage: "m15 たい/ほしい unit + Kyoto story; m25's にいく.",
    wave: 3,
  },
  {
    id: "s11",
    title: "Relative clauses + こと/の nominalizers + とき",
    emoji: "\u{1F517}",
    teaches: [
      "Plain clause + noun (きのうかった本)",
      "こと (#44) taught AS VOCAB with nominalization; のがすき",
      "とき (#62) temporal clauses — 'when I…' is just a relative clause on 時",
      "⟳ intro beat — experience/intent (ことがある/つもり) deepen later",
    ],
    why: "Reviewed: keep — now carries とき (moved sooner per the s22 note) and こと as taught vocabulary (frequency audit: rank #44, previously absent). The audit's function-noun principle lands here: the noun and its grammar arrive together.",
    parity: [
      { source: "Tae Kim", ref: "§3.9" },
      { source: "Review", ref: "s22 note", note: "'move toki sooner'" },
      { source: "CEJC", ref: "#44 こと, #62 とき" },
    ],
    salvage: "m16's のがすき; the rest is new authoring (old course had no relative-clause unit).",
    wave: 3,
    spiralWith: "s22",
  },
  {
    id: "s13",
    title: "Connecting: から/ので, ranges, なかった completes the paradigm",
    emoji: "\u{1F9ED}",
    teaches: [
      "から reason vs origin; ので softer (register nuance); けど",
      "から…まで; months; frequency spectrum (ぜんぜん gets its ATOM here — audit fix)",
      "なかった (plain negative past) — the paradigm's last cell, spent on excuses ('didn't go because…')",
      "STRONG, VARIED sentence examples (Spencer's s13 note — binding)",
    ],
    why: "Reviewed: keep. Draft-2 gives it two extra jobs: the なかった deepen beat (sprinkle principle — excuses are the natural home of negative past + reason) and ぜんぜん's promotion from grammar-mention to reviewed vocabulary.",
    parity: [
      { source: "Tae Kim", ref: "§4.4" },
      { source: "Review", ref: "s13 note" },
      { source: "CEJC", ref: "#97 ぜんぜん" },
    ],
    salvage: "m13 nearly whole; m20's ので-vs-から rule.",
    wave: 3,
    spiralWith: "n06a",
  },
  {
    id: "n06b",
    title: "て-form II: ている + permission/prohibition",
    emoji: "\u{1F9F2}",
    teaches: [
      "ている progressive vs resultative (gloss invariant 17 rides along)",
      "てもいい / てはいけない; ないでください",
      "Sequencing clauses with て; てから",
      "⟳ deepen of n02 — same form, harder spends",
    ],
    why: "The s12 rework, half two: everything て beyond requests, landing ~6 modules after the form itself. By now て is muscle memory and each pattern is one new idea, not five.",
    parity: [
      { source: "Tae Kim", ref: "§4.5" },
      { source: "Genki", ref: "ch 6–7 split across two chapters — same instinct" },
    ],
    salvage: "m15 ている unit whole; m16 prohibition set.",
    wave: 4,
    spiralWith: "n02",
  },
  {
    id: "n07",
    title: "Family I: your side (うち)",
    emoji: "\u{1F3E0}",
    teaches: [
      "YOUR-family terms only (はは/ちち/あに/あね…) + humble register logic",
      "〜さい age; 〜にんかぞく (counter drips in as the word calls for it)",
      "ぼく/おれ deepen in family talk",
    ],
    why: "The s16 rework: one referent, one word set. The honorific others'-side words wait for Family II so learners never hold two words for 'mother' at once — Spencer's note verbatim.",
    parity: [
      { source: "Review", ref: "s16 note", note: "'split these between your family, and others'" },
      { source: "Tae Kim", ref: "§4.2" },
    ],
    salvage: "m19's term tables split down the middle; family story register-adjusted.",
    wave: 4,
    spiralWith: "s19",
  },
  {
    id: "n08",
    title: "Saying & thinking: とおもう + という",
    emoji: "\u{1F4AD}",
    teaches: [
      "Plain clause + とおもう — opinions on everything learned so far",
      "という naming/quotation",
      "おもう graduates from recognition (s05) to drilled production",
      "⟳ intro beat — でしょう/conjecture deepens later",
    ],
    why: "The s18 rework, half one: Spencer — 'we can intro these earlier right?' Yes, and it's the dict-first superpower: quotation embeds plain clauses, owned since module ~6. Genki must wait for ch 8; we don't.",
    parity: [
      { source: "Review", ref: "s18 note" },
      { source: "Tae Kim", ref: "§4.11" },
      { source: "Genki", ref: "ch 8 と思う — we beat it by the same margin the plain forms moved" },
    ],
    salvage: "m18's とおもう rule, rewritten without the polite-frame hedge.",
    wave: 4,
    spiralWith: "n13",
  },
  {
    id: "s15",
    title: "Getting around: motion particles + navigation",
    emoji: "\u{1F687}",
    teaches: [
      "で means / に arrival / へ direction; までに",
      "Positions; asking strangers (obligatory-polite register realism)",
    ],
    why: "Reviewed: keep. Domain module spending the machinery; register-realistic.",
    parity: [
      { source: "JF/Marugoto", ref: "can-do staging" },
      { source: "Genki", ref: "ch 10" },
    ],
    salvage: "m17 nearly whole incl. directions dialogue.",
    wave: 4,
    milestone: "SCRIPT LADDER: katakana romaji cutoff re-anchors here",
  },
  {
    id: "n09",
    title: "Comparisons I: のほうが…より",
    emoji: "⚖️",
    teaches: [
      "AのほうがBより pattern; ほう (#66) taught AS VOCAB with it",
      "どっち (casual) / どちら (polite) — register pair",
      "⟳ intro beat — いちばん superlatives deepen later",
    ],
    why: "The s20 move+split: 'show nohouga earlier and then try this' — のほうが is the everyday workhorse and stands alone fine; superlatives join once comparison is second nature.",
    parity: [
      { source: "Review", ref: "s20 note" },
      { source: "CEJC", ref: "#66 ほう" },
    ],
    salvage: "m22's comparative half.",
    wave: 5,
    spiralWith: "n14",
  },
  {
    id: "s19",
    title: "Listing & describing: や, たり — carrying Family II",
    emoji: "\u{1F4CB}",
    teaches: [
      "や partial list vs と complete; たりする alternatives (た-form spend)",
      "FAMILY II: others'-family honorifics (おかあさん #189, おとうさん…) — listed, compared, drilled against Family I",
      "Cup counter はい/ぱい/ばい drips with drinks vocab",
    ],
    why: "Reviewed: keep ('I love these two') — and Spencer's own suggestion lands: the others'-family side is the perfect listing content ('my mom and your mom…'), giving family its spiral second beat inside a module he already liked.",
    parity: [
      { source: "Review", ref: "s19 note", note: "'could be the other family side?'" },
      { source: "Tae Kim", ref: "§3.10" },
    ],
    salvage: "m21 (rendaku counter table, restaurant story) + m19's honorific half.",
    wave: 5,
    spiralWith: "n07",
  },
  {
    id: "s17",
    title: "Body, health & help",
    emoji: "\u{1FA7A}",
    teaches: [
      "〜がいたい (いたい #275); body parts (あたま #329, おなか #405)",
      "Pharmacy/help dialogues; ないでください spend",
    ],
    why: "Reviewed: rework→'maybe no rework, maybe later'. The frequency audit answers the doubt: いたい/あたま/おなか are all top-500 spoken — the domain is real N5 material. Kept, placed late-middle as Spencer suggested.",
    parity: [
      { source: "Review", ref: "s17 note" },
      { source: "CEJC", ref: "#275 いたい, #329 あたま, #405 おなか — corpus-validated" },
    ],
    salvage: "m20 nearly whole.",
    wave: 5,
  },
  {
    id: "s22",
    title: "Experience & intent: たことがある, つもり",
    emoji: "\u{1F5FA}️",
    teaches: [
      "たことがある experience; つもり intent",
      "Travel/life-events domain",
      "⟳ deepen of s11 — subordinate clauses, harder shapes (とき already owned)",
    ],
    why: "Reviewed: 'mostly placed right' once とき moved out — done. Now a clean deepen beat on clause machinery.",
    parity: [
      { source: "Review", ref: "s22 note" },
      { source: "Genki", ref: "ch 10–11" },
    ],
    salvage: "m25 nearly whole minus とき.",
    wave: 5,
    spiralWith: "s11",
  },
  {
    id: "s21",
    title: "Can & let's: potential, ましょう, 〜ない？",
    emoji: "\u{1F4AA}",
    teaches: [
      "Potential: godan e-stem+る (のめる), ichidan られる (たべられる), できる for する — full system, closing the old できる-only gap",
      "見える/聞こえる nuance",
      "ましょう/ませんか AND casual 〜ない？ — one speech act, both registers",
    ],
    why: "Reviewed: keep. (Draft-2 precision fix: ichidan potential is られる-attachment, not e-stem — the stem-grid story covers godan; ichidan is its own one-liner.)",
    parity: [
      { source: "Cure Dolly", ref: "L10" },
      { source: "Genki", ref: "ch 13", note: "we're ~40% earlier" },
    ],
    salvage: "m23 + m30's 〜ない？; potential drills new.",
    wave: 5,
    milestone: "closes the old course's potential-form gap",
  },
  {
    id: "n13",
    title: "Conjecture: でしょう/だろう + weather",
    emoji: "⛅",
    teaches: [
      "でしょう (polite) / だろう (plain) — one word, register pair",
      "たぶん (#87) un-blocked as vocab; きっと drips",
      "Weather/seasons domain",
      "⟳ deepen of n08's clause-embedding",
    ],
    why: "The s18 rework, half two: conjecture separated from quotation, landing after both clause-machinery beats. Weather keeps its old home as the domain.",
    parity: [
      { source: "Review", ref: "s18 note" },
      { source: "Genki", ref: "ch 12" },
      { source: "CEJC", ref: "#87 たぶん" },
    ],
    salvage: "m18 weather vocab + stories.",
    wave: 6,
    spiralWith: "n08",
  },
  {
    id: "n14",
    title: "Comparisons II: いちばん + なかで",
    emoji: "\u{1F3C6}",
    teaches: [
      "なかで…がいちばん superlatives (いちばん #158)",
      "Comparison review against n09 with all-new sentences (spiral rule)",
    ],
    why: "The s20 split, half two — superlatives once のほうが is second nature.",
    parity: [
      { source: "Review", ref: "s20 note" },
      { source: "Genki", ref: "ch 10" },
    ],
    salvage: "m22's superlative half.",
    wave: 6,
    spiralWith: "n09",
  },
  {
    id: "s23",
    title: "Explaining: んだ/んです, すぎる, なる",
    emoji: "\u{1F4A1}",
    teaches: [
      "んだ (plain) / んです (polite) explanatory — one item, two skins",
      "すぎる; く/になる change of state (なる #39 finally productive — audit flag)",
    ],
    why: "Reviewed: keep. なる's promotion from m27 vocabulary to drilled pattern here answers the frequency audit (#39).",
    parity: [
      { source: "Tae Kim", ref: "§4.7" },
      { source: "CEJC", ref: "#39 なる" },
    ],
    salvage: "m26 + m27's なる patterns.",
    wave: 6,
  },
  {
    id: "s24",
    title: "Must & should: なきゃ/なければ, ほうがいい",
    emoji: "✅",
    teaches: [
      "なければならない + casual なきゃ/なくちゃ (register skins of one rule)",
      "たほうがいい advice (ほう pays out again)",
      "STRONG sentence examples + careful introduction (Spencer's s24 note — binding)",
    ],
    why: "Reviewed: keep, with the sentence-quality note attached for authoring.",
    parity: [
      { source: "Tae Kim", ref: "§4.9" },
      { source: "Review", ref: "s24 note" },
    ],
    salvage: "m27 nearly whole.",
    wave: 6,
  },
  {
    id: "s25",
    title: "Register mastery + N5 capstone",
    emoji: "\u{1F393}",
    teaches: [
      "Mixed-register speed drills; same-scenario-twice stories; してる contractions; slang recognition (やばい #195, まじ #254 — recognition only)",
      "CAPSTONE COVERAGE RULE: reviews EVERY concept with ALL-NEW sentences (Spencer's s25 note)",
      "FAIL-ROUTING: a missed capstone item points to its source module's review (concept tags make this derivable)",
    ],
    why: "Reviewed: keep, with two binding requirements from the note: total concept coverage with fresh sentences, and a directed path back to the owning module on failure. Both are mechanically derivable — exercises carry exercised-atom/concept tags.",
    parity: [
      { source: "Review", ref: "s25 note" },
      { source: "Tae Kim", ref: "§4.17–4.18" },
    ],
    salvage: "m30 speed drills + dual story; m28 derived-review mechanism, extended with coverage + routing.",
    wave: 7,
    milestone: "JLPT N5 COMPLETE — tier interchange",
  },
  {
    id: "s26",
    title: "N4 runway (locked preview)",
    emoji: "\u{1F6E4}️",
    teaches: [
      "Conditionals たら/と/ば/なら",
      "Give & receive あげる/くれる/もらう (#171/#114/#98 — EARLY RECEPTIVE intro moves into N5 per audit; full grammar here)",
      "Volitional よう; evidentials そう/みたい/らしい; passive/causative (late per PT); keigo",
    ],
    why: "Reviewed: keep. Audit adjustment: give/receive verbs are top-120 spoken, so N5 gets recognition exposure even though the grammar (viewpoint rules) stays N4.",
    parity: [
      { source: "Research", ref: "PT (Kawaguchi 2005/2010)" },
      { source: "CEJC", ref: "#98 もらう, #114 くれる, #171 あげる" },
    ],
    salvage: "n4-pilot anchor list; old m29/m30 absorbed into the spine above.",
    wave: 8,
    locked: true,
  },
];

/** Waves for the in-place replacement rollout, rendered as group headers. */
export const WAVE_LABELS: Record<number, string> = {
  0: "Foundation + standing threads",
  1: "Wave 1 — Sentence engine (だ → verbs → ない)",
  2: "Wave 2 — Register, requests, numbers, past",
  3: "Wave 3 — Adjectives, wanting, clauses, connectives",
  4: "Wave 4 — て-deepen + situation belt begins",
  5: "Wave 5 — Situations + potential payoff",
  6: "Wave 6 — Conjecture, superlatives, explaining, obligation",
  7: "Wave 7 — Capstone",
  8: "Beyond this rewrite",
};
