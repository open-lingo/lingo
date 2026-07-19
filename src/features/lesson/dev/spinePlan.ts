/**
 * DEV · Dictionary-form-first course rewrite — DRAFT SPINE (2026-07-19).
 *
 * The data behind /ja/spine-plan. Each unit is a proposed module of the
 * rewritten ja course, in a proposed order Spencer can drag around and
 * annotate; nothing here is authored content — it is the PLAN, with the
 * evidence attached.
 *
 * Sources baked into `parity` refs:
 *  - Tae Kim §-numbers (guidetojapanese.org/grammar_guide.pdf numbering)
 *  - Genki I/II 3rd-ed chapter numbers (St. Olaf grammar index)
 *  - Cure Dolly "Japanese From Scratch" lesson numbers
 *  - Japanese the Manga Way chapter numbers
 *  - Marugoto/Irodori (JF) staging + processability-theory research
 * Salvage notes come from the 2026-07-19 m3–m30 inventory (what each old
 * module holds and what is expensive to re-create; TTS is keyed on exact
 * audioText, so VERBATIM-surviving sentences keep their clips).
 *
 * Locked decisions this draft encodes (Spencer 2026-07-19):
 *  1. Plain form is the taught base; verb classes explicit at introduction.
 *  2. ます arrives early as stem+helper derivation; register-explicit
 *     prompts ("Say to a friend / to a stranger") from that point on.
 *  3. JLPT waypoints kept (N5-complete capstone; N4 runway after).
 *  4. In-place wave replacement on the live course.
 */

export type ParitySource =
  | "Tae Kim"
  | "Genki"
  | "Cure Dolly"
  | "Manga Way"
  | "JF/Marugoto"
  | "Research";

export type ParityRef = {
  source: ParitySource;
  /** Real section/chapter/lesson id — never invented. */
  ref: string;
  note?: string;
};

export type SpineUnit = {
  /** Stable draft id ("s05") — notes key on this, order does not. */
  id: string;
  title: string;
  emoji: string;
  /** Grammar/skills this unit introduces. */
  teaches: string[];
  /** Why it sits here — the argument, not a summary. */
  why: string;
  parity: ParityRef[];
  /** What survives from the old course (old module ids), incl. TTS notes. */
  salvage: string;
  /** Proposed build wave for in-place replacement (1 = first). */
  wave: number;
  /** Milestone marker rendered as a badge (JLPT waypoints, script ladder). */
  milestone?: string;
  /** Known risks / open questions Spencer should weigh in on. */
  risks?: string;
  /** Locked tiles render but don't drag (kana modules, N4 runway preview). */
  locked?: boolean;
};

export const SPINE_VERSION = "draft-1 (2026-07-19)";

export const SPINE_UNITS: SpineUnit[] = [
  {
    id: "s01",
    title: "Hiragana (m1 — unchanged)",
    emoji: "あ",
    teaches: ["Hiragana rows via symbol drills", "Sound↔script mapping"],
    why: "Script acquisition is orthogonal to the verb-methodology rewrite. The kana engine (alphabetSession) stays exactly as shipped.",
    parity: [],
    salvage: "m1 kept verbatim.",
    wave: 0,
    locked: true,
  },
  {
    id: "s02",
    title: "Hiragana II + voiced/yōon (m2 — unchanged)",
    emoji: "び",
    teaches: ["Voiced rows, yōon, small っ"],
    why: "Same as m1 — untouched by the rewrite.",
    parity: [],
    salvage: "m2 kept verbatim.",
    wave: 0,
    locked: true,
  },
  {
    id: "s03",
    title: "Plain sentences: だ, は, も + Katakana I",
    emoji: "\u{1F9F1}",
    teaches: [
      "だ state-of-being (AはBだ) — plain from sentence one",
      "は topic / も also",
      "Casual questions by rising intonation (の later)",
      "です heard in dialogues for RECOGNITION (register preview)",
      "Katakana ア-row + ー (old m3 thread continues)",
    ],
    why: "Every dict-first source starts with the plain copula sentence as the atom — だ before です, and だ's negative/past (じゃない/だった) land before any verb exists, so 'conjugation' is normal from day one. Honest wrinkle a polite-first course never faces: plain questions don't use か (〜だか is wrong) — rising intonation is the real mechanism, which the OLD course hid until m30. Irodori's trick imports here: polite です appears in listening from the first lesson so the register layer is heard long before it is produced.",
    parity: [
      { source: "Tae Kim", ref: "§3.1–3.2", note: "state-of-being + は/も/が before any verb" },
      { source: "Cure Dolly", ref: "L1–L3", note: "core A-is-B sentence, train-car model" },
      { source: "Manga Way", ref: "ch 1", note: "three basic sentence types, plain, register as explicit axis" },
      { source: "JF/Marugoto", ref: "Starter L1", note: "plain/colloquial in listening from lesson 1 (recognition-first)" },
    ],
    salvage: "m3-v2 katakana rows verbatim; things/colors/nationalities vocab + stories reframed だ-style (new TTS for changed sentences; katakana drills keep clips).",
    wave: 1,
    milestone: "REWRITE START",
    risks: "だ dropped in casual speech (猫だ vs 猫) — decide whether tiles accept bare-noun answers. Story dialogues need a register pass (friends → plain).",
  },
  {
    id: "s04",
    title: "Possession & pointing: の, これ/それ/あれ",
    emoji: "\u{1F448}",
    teaches: [
      "の possession + attributive",
      "これ/それ/あれ/どれ pointer system",
      "だれ (whose/who)",
      "Katakana II continues",
    ],
    why: "Pure particle/noun grammar — survives the rewrite nearly intact, just reframed onto plain copula sentences. Kept second because it needs nothing but s03's sentence frame.",
    parity: [
      { source: "Tae Kim", ref: "§3.10", note: "noun particles の/と/や cluster" },
      { source: "Genki", ref: "ch 2", note: "same territory, polite frame" },
    ],
    salvage: "m4 nearly whole (pointer grammarRule table, 'Whose is this?' story) — copula reframe only; most single-word TTS survives.",
    wave: 1,
  },
  {
    id: "s05",
    title: "VERBS I: dictionary form + verb classes",
    emoji: "⚙️",
    teaches: [
      "Dictionary form as THE verb (citation + production)",
      "る-verbs vs う-verbs vs する/くる — explicit class tags on every new verb",
      "いる/える exceptions flagged, not hidden",
      "を direct object; basic SOV order",
      "Food & action vocab",
    ],
    why: "The heart of the rewrite. Verbs enter in the form that reveals their class — のむ vs みる — so conjugation is learnable as a system instead of the old course's m29 un-explaining ('why のむ, not のみる'). Every dict-first source agrees classes must be visible at or before the first conjugation; Genki names them in ch 3 then leaves them inert until ch 8 — the exact wall we're demolishing. Old course: verbs waited until m11 and classes until m29.",
    parity: [
      { source: "Tae Kim", ref: "§3.4 + §3.7", note: "verb basics w/ classes, then を/に/で" },
      { source: "Cure Dolly", ref: "L5", note: "ichidan/godan as stem behavior" },
      { source: "Genki", ref: "ch 3", note: "classes named here but drilled ます-only — the anti-pattern" },
    ],
    salvage: "m7's food/drink vocab domain + を teaching; its dictionary↔ます mapping tables invert later (s07). Verb atoms are ALREADY dictionary-form-keyed — SRS/kanji anchors survive untouched.",
    wave: 1,
    milestone: "VERB CLASSES VISIBLE",
    risks: "Which 12–16 verbs seed the class system? Needs a curated split (る/う/irregular) with minimal-pair kana (きる cut vs きる wear-class discussion deferred).",
  },
  {
    id: "s06",
    title: "VERBS II: ない / た / なかった + existence",
    emoji: "\u{1F504}",
    teaches: [
      "Plain negative ない (class-driven: のまない vs たべない)",
      "Plain past た / negative past なかった",
      "ある/いる existence + animacy; ある→ない irregularity",
      "ここ/そこ/あそこ, に/で location basics",
    ],
    why: "The four-cell plain paradigm (だ/ない/た/なかった × verbs) completes within two modules of verbs entering — the old course took 22 modules (m7→m29). Existence verbs slot here because ある’s negative IS ない: the irregularity lands while the rule is fresh. Tae Kim orders exactly this (§3.5–§3.6) before any politeness.",
    parity: [
      { source: "Tae Kim", ref: "§3.5–§3.6" },
      { source: "Cure Dolly", ref: "L4 + L7", note: "た early; ない as い-adjective attachment" },
      { source: "Genki", ref: "ch 8–9", note: "same content, deferred to 'short forms' — the ch-8 wall" },
    ],
    salvage: "m6's places/existence vocab + animacy grammarRule + directions dialogue (register reframe); m29's plain-form drills/story move HERE nearly whole — they were authored dict-first already.",
    wave: 1,
  },
  {
    id: "s07",
    title: "The stem grid + ます/です — politeness as a layer",
    emoji: "\u{1F3AD}",
    teaches: [
      "Godan a/i/u/e stem rows as ATTACHMENT POINTS (the engine, taught once)",
      "ます = i-stem + polite helper; ません/ました/ませんでした",
      "です for nouns/adjectives; です ≠ polite だ (embedding trap)",
      "か as the POLITE question marker (pairs with s03's intonation)",
      "Register-explicit production starts: every prompt names its audience",
    ],
    why: "Spencer's ruling verbatim: 'introduce masu early and then drill both from WAY earlier on very productively.' Two modules after verbs enter, politeness arrives as one clean mechanical story — stem + ます — plus the social WHY (Tae Kim's 'not being rude in Japan'). From here both registers drill continuously with explicit audience cues, which the old course only reached at m30. Cure Dolly's L10 stem-grid framing means potential/passive/causative later cost near-zero new machinery.",
    parity: [
      { source: "Tae Kim", ref: "§4.1 + §4.3", note: "polite form via stems; か as polite question" },
      { source: "Cure Dolly", ref: "L10 + L17", note: "stem engine; ます as i-stem attachment" },
      { source: "Manga Way", ref: "ch 3", note: "です/ます early but explicitly as politeness layer" },
      { source: "Research", ref: "PT (Kawaguchi 2005)", note: "ます and た are same-stage lexical morphology — order is pedagogy's call, not acquisition's" },
    ],
    salvage: "m7's dict↔ます mapping tables invert cleanly (plain→polite is one rule); m30's register-awareness lessons (when casual is wrong, せんぱい/じょうし vocab) compress into the intro here + drills throughout.",
    wave: 2,
    milestone: "SCRIPT LADDER: hiragana romaji dies here (M7 cutoff holds)",
    risks: "Register-explicit prompt framing needs a factory-level cue system (‘Say to a friend/teacher’) — invariant 8 already exists, this makes it load-bearing everywhere.",
  },
  {
    id: "s08",
    title: "Numbers, counters & transactions",
    emoji: "\u{1F9EE}",
    teaches: [
      "Sino/native numbers, ひとつ-counters, にん-counter",
      "ください requests, money/いくら",
      "Both registers in shop dialogues (polite to staff — the natural home)",
    ],
    why: "Shop/cafe situations are where polite register is genuinely obligatory — perfect first arena for s07's register drills to feel real rather than academic. Content is register-neutral (numbers) so it salvages nearly whole.",
    parity: [
      { source: "Genki", ref: "ch 1–2", note: "numbers early; we defer slightly to put registers first" },
      { source: "Tae Kim", ref: "§4.16", note: "counting deferred far later — we side with Genki here" },
    ],
    salvage: "m5 nearly whole (two-number-system rule, counter tables, cafe story + TTS — mostly polite already, so clips survive).",
    wave: 2,
    milestone: "KANJI recognition floor stays M8 (number kanji first — unchanged)",
  },
  {
    id: "s09",
    title: "Adjectives as mini-predicates (い + な)",
    emoji: "\u{1F308}",
    teaches: [
      "い-adj conjugation IN PARALLEL with plain verbs (高い/くない/かった)",
      "な-adj + だ/です; じゃない",
      "と noun-and; この/その/あの",
      "よ/ね sentence enders (both registers)",
      "すき/きらい with が",
    ],
    why: "With plain ない/た already in hand, い-adjectives are 'verbs that conjugate the same way' — one system, not a new one (Dolly's framing). The old course's m8+m9 merge; よ/ね move up from m9 unchanged. Tae Kim also does adjectives before verbs — we deliberately flip (verbs first) because the course's SRS/exercise machinery is verb-centric and Spencer's confusion was verb-shaped.",
    parity: [
      { source: "Tae Kim", ref: "§3.3", note: "adjectives before verbs — we flip, reason in tooltip" },
      { source: "Cure Dolly", ref: "L6–L7", note: "い-adj as verb-like engines" },
      { source: "Genki", ref: "ch 5" },
    ],
    salvage: "m8+m9 merged: antonym pairs, い-vs-な discrimination drill, camera-shopping + town stories (register pass). Adjective past tables re-shape to plain-first.",
    wave: 2,
  },
  {
    id: "s10",
    title: "Time I + past in both registers",
    emoji: "⏰",
    teaches: [
      "じ/ふん clock, days, に time particle",
      "Numbers 11–99",
      "ました/でした drilled BESIDE た/だった (translation both ways)",
      "まだ/もう",
    ],
    why: "First big both-registers consolidation: same diary content narrated to a friend (plain) and to a teacher (polite). The old m10 (polite past) and m12 (time) merge — polite past is no longer a unit, it's an exercise dimension.",
    parity: [
      { source: "Genki", ref: "ch 4", note: "past tense staging" },
      { source: "JF/Marugoto", ref: "Starter", note: "time/daily-life can-dos" },
    ],
    salvage: "m12 time tables (ぷん rendaku) whole; m10's four-way past set re-anchored plain-first; 'Yuki's yesterday' story dual-register.",
    wave: 2,
  },
  {
    id: "s11",
    title: "Relative clauses + の nominalizer — the payoff",
    emoji: "\u{1F517}",
    teaches: [
      "Plain clause + noun (きのうかった本, すしをたべる人)",
      "のがすき/きらい (like doing)",
      "Sentence order freedom / omission",
    ],
    why: "THE structural payoff of dict-first and the single biggest thing the old course never taught before N4: because learners own plain forms, relative clauses arrive ~m11 instead of never. Tae Kim places this before politeness even exists (§3.9); Genki must wait for ch 9. PT research backs early clause syntax on a separate track from morphology.",
    parity: [
      { source: "Tae Kim", ref: "§3.9", note: "relative clauses pre-politeness" },
      { source: "Genki", ref: "ch 9", note: "blocked on ch-8 short forms" },
      { source: "Research", ref: "Di Biase & Kawaguchi 2013", note: "syntax and morphology develop on separate tracks" },
    ],
    salvage: "m16's のがすき content moves here; everything else is NEW authoring (the old course has no relative-clause unit to salvage).",
    wave: 3,
    risks: "Sentence-mining + review generator must learn clause-bearing sentences; visual-QA judge lenses may need a clause-rendering check.",
  },
  {
    id: "s12",
    title: "て-form: derive it, then spend it",
    emoji: "\u{1F9F2}",
    teaches: [
      "て from た (same sound-change table — taught as one fact)",
      "てください / てもいい / てはいけない",
      "ている progressive vs resultative (gloss invariant 17 carries over)",
      "Sequencing clauses with て",
    ],
    why: "Because plain た arrived at s06, て-form is a derivation, not a memorization — Tae Kim and Dolly both derive て from た's sound changes. PT research says て-combinations need basic inflection first: satisfied. The old m14's group-by-group tables survive almost verbatim, just re-motivated.",
    parity: [
      { source: "Tae Kim", ref: "§4.4–§4.5" },
      { source: "Cure Dolly", ref: "L5", note: "te/ta as one sound-change table" },
      { source: "Genki", ref: "ch 6–7" },
      { source: "Research", ref: "PT (Kawaguchi)", note: "V-て combos strictly after basic verb inflection" },
    ],
    salvage: "m14's complete て-form tables + post-office story; m15's ている unit (progressive/resultative rule) whole; m16's prohibition set. Heavy salvage — this wave is cheap.",
    wave: 3,
  },
  {
    id: "s13",
    title: "Reasons & ranges: から/ので, から…まで, frequency",
    emoji: "\u{1F9ED}",
    teaches: [
      "から reason vs から origin; ので softer (register nuance)",
      "から…まで ranges; months; frequency spectrum",
      "けど contrast",
    ],
    why: "Connective layer over now-solid clauses; ので-vs-から is inherently a register lesson so it lands after s07. Old m13+m20's connective content merges; complexity-ramp invariant 13 re-anchors here.",
    parity: [
      { source: "Tae Kim", ref: "§4.4", note: "から/ので/けど in compound-sentence unit" },
      { source: "Genki", ref: "ch 6 + 12" },
    ],
    salvage: "m13 nearly whole (frequency spectrum, months); m20's ので-vs-から contrast rule.",
    wave: 3,
  },
  {
    id: "s14",
    title: "Wanting things: たい, ほしい + stem showcase",
    emoji: "\u{1F31F}",
    teaches: [
      "たい as i-stem attachment (conjugates like い-adj — the engine pays out)",
      "がほしい",
      "にいく purpose-of-motion (stem + にいく)",
    ],
    why: "First showcase of the s07 stem grid generating 'new grammar' for free: たい and にいく are both i-stem attachments, and たい then conjugates with s09's adjective rules. Three old modules' worth of 'new forms' become one lesson of composition.",
    parity: [
      { source: "Tae Kim", ref: "§4.10" },
      { source: "Cure Dolly", ref: "L9", note: "たい as attachment" },
      { source: "Genki", ref: "ch 7 + 11" },
    ],
    salvage: "m15's たい/ほしい unit + Kyoto story (register pass); m25's にいく.",
    wave: 3,
  },
  {
    id: "s15",
    title: "Getting around: motion particles + navigation",
    emoji: "\u{1F687}",
    teaches: [
      "で means / に arrival / へ direction; までに deadline",
      "Positions, getting on/off, asking directions (polite — strangers)",
    ],
    why: "Domain module, register-realistic (you ask strangers politely). Old m17 salvages nearly whole. Sits here as the first of the situation-belt — the grammar core is done, domains apply it.",
    parity: [
      { source: "JF/Marugoto", ref: "can-do staging", note: "situation-first belt mirrors JF structure" },
      { source: "Genki", ref: "ch 10", note: "で transport" },
    ],
    salvage: "m17 nearly whole incl. police/directions dialogue; katakana romaji cutoff badge moves with whatever slot this lands in (currently M17 — recompute).",
    wave: 4,
    milestone: "SCRIPT LADDER: katakana romaji cutoff re-anchors here",
  },
  {
    id: "s16",
    title: "People & family (register goldmine)",
    emoji: "\u{1F46A}",
    teaches: [
      "うち/よそ family terms — humble vs honorific IS register",
      "〜さい age, 〜にんかぞく",
      "Addressing people (さん/names/family words)",
    ],
    why: "The in-group/out-group family-term system is the deepest register lesson in N5 — it lands far better after s07 made register a first-class concept than it did as old m19's vocab unit.",
    parity: [
      { source: "Tae Kim", ref: "§4.2" },
      { source: "Genki", ref: "ch 7 (family), ch 2 (people)" },
    ],
    salvage: "m19 nearly whole (term tables, family story).",
    wave: 4,
  },
  {
    id: "s17",
    title: "Body, health & help: がいたい, requests",
    emoji: "\u{1FA7A}",
    teaches: [
      "〜がいたい; body parts; pharmacy",
      "ないでください (please don't) — ない-form spend",
      "てから sequencing",
    ],
    why: "Situation module spending s06's ない and s12's て machinery in a high-value survival domain. Old m20 + m16 leftovers merge.",
    parity: [
      { source: "Genki", ref: "ch 6 + 12" },
    ],
    salvage: "m20 (body vocab, pharmacy dialogue) + m16's ないでください/てから.",
    wave: 4,
  },
  {
    id: "s18",
    title: "Saying & thinking: という, とおもう, でしょう",
    emoji: "\u{1F4AD}",
    teaches: [
      "Plain clause + とおもう / という (quotation)",
      "でしょう/だろう conjecture (both registers of the same word!)",
      "Weather/seasons domain",
    ],
    why: "Quotation embeds PLAIN clauses — in the old course this was receptively smuggled at m18 under a polite frame; here it's honest composition on owned material. だろう/でしょう as register pair reinforces the layer model.",
    parity: [
      { source: "Tae Kim", ref: "§4.11", note: "quotation on relative-clause machinery" },
      { source: "Genki", ref: "ch 8 (と思う) + ch 12 (でしょう)" },
    ],
    salvage: "m18 weather/nature vocab + stories; とおもう rule rewritten (no longer needs the polite-frame hedge).",
    wave: 4,
  },
  {
    id: "s19",
    title: "Listing & describing: や, たり, quotative naming",
    emoji: "\u{1F4CB}",
    teaches: [
      "や partial list vs と complete",
      "たりする alternatives (た-form spend)",
      "という naming; cup counters はい/ぱい/ばい",
    ],
    why: "Old m21+m24 merge; たり arrives while た is fresh muscle memory instead of ten modules later.",
    parity: [
      { source: "Tae Kim", ref: "§3.10 + §4.12" },
      { source: "Genki", ref: "ch 11" },
    ],
    salvage: "m21 (rendaku counter table, restaurant story) + m24 (たり rule, hobbies).",
    wave: 4,
  },
  {
    id: "s20",
    title: "Comparing: のほうが…より, いちばん",
    emoji: "⚖️",
    teaches: [
      "のほうが…より comparative; なかで…がいちばん",
      "どちら/どっち (register variants of the same word)",
    ],
    why: "Register-neutral structure, salvages whole; placed late-middle as in most curricula.",
    parity: [
      { source: "Genki", ref: "ch 10" },
    ],
    salvage: "m22 nearly whole.",
    wave: 5,
  },
  {
    id: "s21",
    title: "Can & let's: potential as e-stem, ましょう, 〜ない？",
    emoji: "\u{1F4AA}",
    teaches: [
      "Potential = e-stem + る (のめる/たべられる) — FULL potential, not just できる",
      "できる for する; 見える/聞こえる nuance",
      "ましょう / ませんか invitations AND casual 〜ない？ — same speech act, both registers",
    ],
    why: "The stem grid's biggest payout: full potential lands as one attachment rule instead of Genki's book-2 conjugation unit. Old course NEVER taught full potential (できる-only at m23, flagged by the N4 doc as the genuine gap) — this closes it inside N5. Invitations teach the same social move in both registers side by side, which the old course split across m23 and m30.",
    parity: [
      { source: "Cure Dolly", ref: "L10", note: "potential as e-stem+る" },
      { source: "Tae Kim", ref: "§4.6" },
      { source: "Genki", ref: "ch 13", note: "potential opens book 2 — we're ~40% earlier" },
    ],
    salvage: "m23 (じょうず/へた, ましょう/ませんか, できる) + m30's 〜ない？ invitations; potential drills are NEW.",
    wave: 5,
    milestone: "closes the old course's potential-form gap",
  },
  {
    id: "s22",
    title: "Experience & intent: たことがある, つもり, とき",
    emoji: "\u{1F5FA}️",
    teaches: [
      "たことがある experience; つもり intent",
      "とき temporal clauses (relative-clause spend)",
      "Travel/life-events domain",
    ],
    why: "Subordinate-clause consolidation on s11's machinery. Salvages old m25 almost whole — it was already plain-form-embedded, just unexplained.",
    parity: [
      { source: "Genki", ref: "ch 10–11" },
      { source: "Tae Kim", ref: "§3.9 applications" },
    ],
    salvage: "m25 nearly whole (four subordinate rules, trips story).",
    wave: 5,
  },
  {
    id: "s23",
    title: "Explaining & degree: んだ/んです, すぎる, なる",
    emoji: "\u{1F4A1}",
    teaches: [
      "んだ (plain) / んです (polite) explanatory — taught as one item, two skins",
      "すぎる; く/になる change of state",
    ],
    why: "んだ/んです is the register model's poster child — the old course could only teach んです and hid んだ entirely. Merges old m26 + m27's なる.",
    parity: [
      { source: "Tae Kim", ref: "§4.7 (なる) + explanatory の sections" },
      { source: "Genki", ref: "ch 12" },
    ],
    salvage: "m26 (trouble verbs, rough-morning story) + m27's なる patterns.",
    wave: 5,
  },
  {
    id: "s24",
    title: "Must & should: なきゃ/なければ, ほうがいい",
    emoji: "✅",
    teaches: [
      "なければならない + casual なきゃ/なくちゃ (same rule, register skins)",
      "たほうがいい advice",
      "Obligation/safety domain",
    ],
    why: "Final N5 grammar module; the casual contractions are first-class citizens instead of an m30 afterthought — Tae Kim teaches きゃ/ちゃ inside the must-unit itself.",
    parity: [
      { source: "Tae Kim", ref: "§4.9", note: "casual shortcuts taught WITH the form" },
      { source: "Genki", ref: "ch 12" },
    ],
    salvage: "m27 nearly whole (exam-week story).",
    wave: 5,
  },
  {
    id: "s25",
    title: "Register mastery + N5 capstone",
    emoji: "\u{1F393}",
    teaches: [
      "Mixed-register speed drills; same-scenario-twice stories",
      "Dropped particles, contractions (してる), casual enders の/さ",
      "Cumulative N5 grammar + vocab review (derived, like old m28)",
    ],
    why: "The old m30's best content — register-switching as a skill — becomes the graduation exercise, no longer the first-ever meeting with casual speech. Derived review capstone (old m28 mechanism) rides along unchanged.",
    parity: [
      { source: "Tae Kim", ref: "§4.17–4.18", note: "slang/enders as the late polish, ambient before" },
      { source: "JF/Marugoto", ref: "E2 friend-register can-dos" },
    ],
    salvage: "m30's speed drills, 'Yuki invites twice' dual story, social-role vocab; m28's derived-review mechanism verbatim.",
    wave: 6,
    milestone: "JLPT N5 COMPLETE — tier interchange",
  },
  {
    id: "s26",
    title: "N4 runway (locked preview — future modules)",
    emoji: "\u{1F6E4}️",
    teaches: [
      "Conditionals たら/と/ば/なら",
      "Giving & receiving (あげる/くれる/もらう + て-benefactives)",
      "Volitional よう, そう/みたい/らしい evidentials",
      "Passive/causative (LATE per acquisition research), keigo",
    ],
    why: "Not part of this rewrite's authoring scope — shown so the N5 spine can be judged against where it must deliver learners. PT research places passive/causative at the final acquisition stage regardless of textbook order, validating their position here.",
    parity: [
      { source: "Research", ref: "PT (Kawaguchi 2005/2010)", note: "passive/causative/benefactive = last acquisitional stage" },
      { source: "Genki", ref: "ch 13–23" },
      { source: "Tae Kim", ref: "§4.8, §4.14" },
    ],
    salvage: "n4-pilot-spine doc's anchor list carries over; old m29/m30 content largely absorbed into s06/s07/s21/s25.",
    wave: 7,
    locked: true,
  },
];

/** Waves for the in-place replacement rollout, rendered as group headers. */
export const WAVE_LABELS: Record<number, string> = {
  0: "Foundation (untouched)",
  1: "Wave 1 — Sentence engine (だ → verbs → plain paradigm)",
  2: "Wave 2 — Register layer + everyday machinery",
  3: "Wave 3 — Clauses, て-form, connectives",
  4: "Wave 4 — Situation belt",
  5: "Wave 5 — Expansion + the potential payoff",
  6: "Wave 6 — Capstone",
  7: "Beyond this rewrite",
};
