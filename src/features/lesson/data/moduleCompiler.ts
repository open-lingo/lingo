/**
 * Deterministic module compiler (authoring pipeline v2, 2026-07-20).
 *
 * Turns an authored content IR (docs/content-ir-spec-2026-07-20.md) into
 * LessonContent[] that satisfies the moduleBarGuards invariants BY
 * CONSTRUCTION: step-type assignment, ordering (no adjacent same-type, ≤2
 * selection-taps), the house review tail, one -capstone in the stretch window,
 * and close-on-match. Phase-1 authors the pedagogy (YAML); this is phase 2.
 *
 * `diagnoseModule` is the author⇄compiler feedback channel: it reports what
 * the IR is missing (density-short, distractor-thin, …) so the content author
 * can fix the YAML instead of the compiler guessing.
 */
import type {
  LessonContent,
  LessonStep,
  TransferDiagramSpec,
} from "@/features/lesson/types";
import {
  SELECTION_TYPES,
  TEACH_FIRST_INTRO_TYPES,
  jaSurfaces,
} from "@/features/lesson/data/stepTaxonomy";
import { JA_COURSE_ATOMS_BY_KANA } from "@/features/languages/ja/courseAtoms";
import { VERB_ENTRIES, ADJ_ENTRIES } from "@/features/languages/ja/conjugationTables";
import { conjugateVerb } from "@/features/languages/ja/conjugationEngine";
import {
  audience,
  registerCheatSheet,
} from "@/features/languages/ja/registerAudiences";
import {
  build,
  cloze,
  dialogueListen,
  conjugationTransform,
  grammarRule,
  kanjiReading,
  listeningBuildSentence,
  listeningCompSentence,
  translationMcq,
  reviewMatchPairs,
  speaking,
  translateStep,
  vocabMcq,
  WORD_IMAGE_MCQ_BLOCKLIST,
  type ReviewAtom,
} from "@/features/languages/ja/grammarHelpers";

// ── IR types ────────────────────────────────────────────────────────────────
export type IRAtom = {
  kana: string;
  romaji?: string;
  gloss: string;
  /** Compact gloss for width-constrained surfaces (match-pair tiles). The
   *  full teaching gloss stays everywhere else. Long glosses without one
   *  overflow the match card below the fold (Gate 10, m6 2026-07-23). */
  shortGloss?: string;
  imageable?: boolean;
  kind?: string;
  derivedFrom?: string;
  verbClass?: string;
};
export type IRGrammarPoint = {
  id: string;
  /**
   * Names this card when a module writes several under one `id` — the lesson's
   * rule beat selects it by the same string. One point taught across three
   * lessons keeps one id (and so one SRS history) while each lesson states its
   * own rule. Omit it when the id has a single card.
   */
  variant?: string;
  rule: string;
  examples: { ja: string; en: string }[];
  antiPattern?: { ja: string; why: string };
  /**
   * Declares this point as a CONJUGATION rule (spec 2026-07-23): the
   * compiler auto-emits a transform-card ramp right after the rule step —
   * recognition drills of the transformation itself, before any sentence
   * work — built from the module's `newAtoms` whose `derivedFrom` +
   * `verbClass` match. `classes` uses IR verbClass names (ru/u/irregular).
   */
  conjugation?: { form: string; classes: string[] };
  /**
   * Declares this point as a DIRECTION rule: the card renders the transfer
   * diagram instead of describing the arrow in prose. Authored in the IR as
   * data (see TransferDiagramSpec) so one renderer serves every verb set.
   */
  diagram?: TransferDiagramSpec;
};
export type IRBeat =
  /**
   * `variant` disambiguates when a module writes SEVERAL cards under one
   * grammarPointId — m6 authors three `nai-form` cards, one each for る-verbs,
   * う-verbs and the irregulars. They used to be resolved through a
   * `Map(id -> point)`, so the last one silently won and lessons 1 and 2 both
   * rendered the する/くる card: the る-verb and う-verb rules were written,
   * compiled, and unreachable (found by Spencer's learner walk, 2026-07-27 —
   * the learner could not derive みない from みる because no card said how).
   * An ambiguous reference is now a compile diagnostic, not a coin flip.
   *
   * The id stays SHARED on purpose: one grammar point taught across three
   * lessons is still one thing to the SRS, and re-keying it would fragment
   * every learner's review history for that point.
   */
  | { kind: "rule"; grammarPointId: string; variant?: string; reteach?: boolean }
  | {
      /** `challenge` is the current name for the per-lesson integration
       *  beat (inv 26); `capstone` is the legacy alias still used by m6's
       *  IR until it is re-authored. Treated identically everywhere. */
      kind: "sentence" | "capstone" | "challenge";
      ja: string;
      en: string;
      mode: "build" | "translate" | "listening";
      exercises?: string[];
      combines?: string[];
      /** Additional CORRECT surfaces to grade right (each expands through
       *  the same variant machinery) — e.g. それが わからない beside the
       *  authored それは わからない: が isn't taught yet, but correct
       *  Japanese must never grade wrong (Spencer 2026-07-23). */
      alsoAccept?: string[];
      /** Known learner trap on this beat: a WRONG surface + why. Compiles
       *  to a reactive tip on the step; the tip gate fires it only when
       *  the learner's typed answer actually contains the trap (それを…
       *  with わかる — the transitive-“get” instinct). */
      pitfall?: { wrong: string; why: string; title?: string };
    }
  | {
      kind: "particle-cloze";
      stem: string;
      tail: string;
      answer: string;
      options: string[];
      en: string;
      explanation?: string;
    }
  | {
      kind: "dialogue";
      lines: { speaker: string; ja: string; en?: string }[];
      questions: { q: string; options: string[]; answer: string }[];
    }
  | {
      /**
       * Authored listening-comprehension beat. Until now `listening_comprehension`
       * existed ONLY as compiler filler — the IR had no way to author one, so a
       * module could not deliberately drill the RECOGNITION direction at all.
       * That is a large part of why register content came out 100% production.
       *
       * `q` defaults to the factory's "What does this mean?"; override it to ask
       * about something other than meaning — "Who is this said to?" is how
       * register gets a recognition beat with no English scenario anywhere.
       */
      kind: "listening-comp";
      audio: string;
      answer: string;
      distractors: [string, string, string];
      q?: string;
      explanation?: string;
      exercises?: string[];
    }
  | {
      /**
       * KANJI READING BEAT (kanji-set-1/2/3, RUN-PLAN ledger rows m18/m23/m28).
       *
       * The course's kanji policy is a READING ladder, never a writing one:
       * `applyKanjiSurfaces` swaps kana display for kanji automatically from
       * m8 on, and the only AUTHORED kanji step is `kanji_reading` — a kanji
       * shown bare, four kana readings, pick the right one. That factory
       * already exists (grammarHelpers.kanjiReading, shipped 2026-07-16 and
       * used by m30); this beat is the IR's front door to it, so an
       * IR-compiled module can pay its kanji-set row without hand-authoring
       * TS or inventing a second mechanism.
       *
       * `kana` names an ALREADY-TAUGHT atom — the ladder tests reading, not
       * vocabulary, so a kanji step is never a word's first exposure. The
       * surface and its unlock module come from the shipped rollout catalog
       * (`KANJI_ELIGIBLE_ATOMS`), which is why the beat cannot test a glyph
       * the ladder has not reached. `distractors` overrides the generated
       * near-misses (valid-but-wrong on/kun, wrong okurigana stem, rendaku
       * slip) when the generator has fewer than three.
       */
      kind: "kanji";
      kana: string;
      /** Override the surface (homograph atoms, counter forms). */
      kanji?: string;
      /** Hand-authored near-miss readings; defaults to `readingDistractors`. */
      distractors?: string[];
      exercises?: string[];
    }
  | {
      /**
       * REGISTER BEAT — the ONLY beat that may emit register scaffolding
       * (audience picture, politeness meter, cheat sheet, vocative frame).
       *
       * Isolation is the point (Spencer 2026-07-27: "these lesson types and
       * ways of teaching should be isolated to register"). Because one beat
       * kind owns all four fields, an ordinary teaching lesson cannot grow an
       * audience emoji by accident — there is no beat that would produce one.
       * `registerScaffoldIsolation.test.ts` holds the line.
       *
       * `stage` is the FADE (Spencer: "should fade out of active teaching as
       * they learn the register of said words"), mirroring
       * conjugation_transform's LEARN/KNOW/OWN ladder:
       *   1 LEARN — cheat sheet pinned above the options, meter shown
       *   2 KNOW  — sheet withdrawn, meter is the last hint
       *   3 OWN   — no scaffold at all; a vocative frame carries the context
       *             in Japanese, so the cue costs no English
       * Stage 1 fires ONCE per word, course-wide. After stage 3 the word is
       * ordinary vocabulary and belongs in ordinary beats.
       */
      kind: "register";
      stage: 1 | 2 | 3;
      /** Key into REGISTER_AUDIENCES — supplies emoji, label and level. */
      audience: string;
      /** The correct form for this audience. */
      answer: string;
      /** Full option set; every entry must already be taught (inv 33). */
      options: string[];
      /** Prompt. Names the ACT ("Say yes."), never the audience — that is
       *  what the picture is for. */
      en: string;
      /** Stage 3 only: Japanese vocative frame around the answer slot. */
      frame?: { before: string; after?: string };
      /** Stage 1 only: the level→form mapping the cheat sheet renders. */
      cheatSheet?: { 1: string; 2: string; 3: string };
      exercises?: string[];
    };
export type IRLesson = {
  id: string;
  title?: string;
  focus?: string;
  introduces?: string[];
  beats: IRBeat[];
  reviewPool?: string[];
  /** Inv 25 (Spencer 2026-07-26): a module is 8-11 `teaching` + 3 `review`
   *  + 1 `challenge`, and the challenge lesson is always LAST. Declare it
   *  explicitly rather than inferring from beat shape or id suffix — the
   *  old inference ("no capstone beat means review", plus an id-ends-in-12
   *  special case) cannot express three review lessons. Omitted → inferred
   *  for back-compat with m6's IR. */
  role?: "teaching" | "review" | "challenge";
};
export type ModuleIR = {
  module: string;
  title: string;
  register?: string;
  priorNeoModules?: string[];
  newAtoms?: IRAtom[];
  /**
   * Every kana taught by an EARLIER module. Injected by compile-ir.mjs, which
   * can read the other modules; compileModule itself only ever sees one IR.
   * Not authored by hand — it is derived, and regenerating is a recompile.
   */
  priorVocab?: string[];
  /**
   * The ATOM RECORDS behind those kana, for the ones earlier modules declared
   * only in their IR. Same provenance as `priorVocab`; carried separately
   * because the tokenizer and the gloss surfaces need more than the surface.
   */
  priorAtoms?: IRAtom[];
  grammarPoints?: IRGrammarPoint[];
  /** Grammar points this module EXERCISES but does not TEACH — taught by an
   *  earlier module, so they carry no rule/examples here. `exercises:` and
   *  `combines:` may name these freely; anything in neither list is a typo
   *  (diagnostic `unknown-grammar-point`). Also the declared surface for
   *  cross-module grammar review to draw on. */
  priorGrammarPoints?: string[];
  lessons: IRLesson[];
};

export type Diagnostic = {
  lesson: string;
  kind:
    | "provenance"
    | "density-short"
    | "density-over"
    | "variety-thin"
    | "distractor-thin"
    | "capstone-missing"
    | "repeat"
    | "dialogue-distractor-synth"
    | "gloss-long"
    | "gloss-mismatch"
    | "unbuildable"
    | "image-debut"
    | "ordering"
    /** `exercises:`/`combines:` names a grammar point the IR never
     *  declares — silent typos used to sail straight through. */
    | "unknown-grammar-point"
    /** Inv 26: a challenge step whose grammar-point combination already
     *  appeared in an earlier beat — longer-but-familiar is not a
     *  challenge. */
    | "challenge-not-novel";
  detail: string;
};

// ── atom + tokenizer plumbing ────────────────────────────────────────────────
type Atom = {
  kana: string;
  meaningEn: string;
  shortGloss?: string;
  emoji?: string;
  fromModule: ReviewAtom["fromModule"];
};

/** Match-pair tiles are width-constrained; long glosses wrap and push pairs
 *  below the fold (Spencer m6 walk 2026-07-23: "definitions on these words
 *  need to be shorter — display the longer on the flash cards"). Tiles use
 *  the authored shortGloss when present, else the first `/`- or `,`-segment
 *  of the teaching gloss ("won't eat / don't eat" → "won't eat"). The full
 *  gloss is untouched everywhere else — flashcards, speaking, MCQ. */
function matchTileGloss(a: { meaningEn: string; shortGloss?: string }): string {
  return a.shortGloss ?? a.meaningEn.split(/[/,;]/)[0].trim();
}

// Kana-faithful romaji (Spencer ruling: は→ha, を→wo, へ→he — the particle's
// spelling, not its pronunciation). Display-only, for grammar-card examples.
const ROMAJI: Record<string, string> = {
  きゃ: "kya", きゅ: "kyu", きょ: "kyo", しゃ: "sha", しゅ: "shu", しょ: "sho",
  ちゃ: "cha", ちゅ: "chu", ちょ: "cho", にゃ: "nya", にゅ: "nyu", にょ: "nyo",
  ひゃ: "hya", ひゅ: "hyu", ひょ: "hyo", みゃ: "mya", みゅ: "myu", みょ: "myo",
  りゃ: "rya", りゅ: "ryu", りょ: "ryo", ぎゃ: "gya", ぎゅ: "gyu", ぎょ: "gyo",
  じゃ: "ja", じゅ: "ju", じょ: "jo", びゃ: "bya", びゅ: "byu", びょ: "byo",
  ぴゃ: "pya", ぴゅ: "pyu", ぴょ: "pyo",
  あ: "a", い: "i", う: "u", え: "e", お: "o",
  か: "ka", き: "ki", く: "ku", け: "ke", こ: "ko", さ: "sa", し: "shi", す: "su", せ: "se", そ: "so",
  た: "ta", ち: "chi", つ: "tsu", て: "te", と: "to", な: "na", に: "ni", ぬ: "nu", ね: "ne", の: "no",
  は: "ha", ひ: "hi", ふ: "fu", へ: "he", ほ: "ho", ま: "ma", み: "mi", む: "mu", め: "me", も: "mo",
  // を → "o": the KANA_ROMAJI citation reading (Spencer ruling) — the
  // sentence-line "gohanwo" vs per-kana "o" mismatch was a sweep finding.
  や: "ya", ゆ: "yu", よ: "yo", ら: "ra", り: "ri", る: "ru", れ: "re", ろ: "ro", わ: "wa", を: "o", ん: "n",
  が: "ga", ぎ: "gi", ぐ: "gu", げ: "ge", ご: "go", ざ: "za", じ: "ji", ず: "zu", ぜ: "ze", ぞ: "zo",
  だ: "da", ぢ: "ji", づ: "zu", で: "de", ど: "do", ば: "ba", び: "bi", ぶ: "bu", べ: "be", ぼ: "bo",
  ぱ: "pa", ぴ: "pi", ぷ: "pu", ぺ: "pe", ぽ: "po",
  ト: "to", ム: "mu", ミ: "mi", カ: "ka", ケ: "ke", ン: "n", タ: "ta", ナ: "na",
};
function kanaToRomaji(input: string): string {
  const s = input.replace(/[。、？！]/g, "");
  const out: string[] = [];
  let i = 0;
  while (i < s.length) {
    const ch = s[i];
    if (ch === " " || ch === "　") {
      out.push(" ");
      i++;
    } else if (ch === "っ") {
      const r = ROMAJI[s.slice(i + 1, i + 3)] ?? ROMAJI[s[i + 1] ?? ""] ?? "";
      if (r) out.push(r[0]);
      i++;
    } else if (ch === "ー") {
      const last = out[out.length - 1];
      if (last) out.push(last[last.length - 1]);
      i++;
    } else if (ROMAJI[s.slice(i, i + 2)]) {
      out.push(ROMAJI[s.slice(i, i + 2)]);
      i += 2;
    } else if (ROMAJI[ch]) {
      out.push(ROMAJI[ch]);
      i += 1;
    } else {
      out.push(ch);
      i += 1;
    }
  }
  return out.join("").replace(/\s+/g, " ").trim();
}

const PARTICLES = ["は", "が", "を", "に", "で", "と", "の", "も", "へ", "から", "まで", "か"];
const NAMES = ["トム", "ミカ", "ケン", "たなか", "タナカ"];
const INTERJ = ["うん", "ううん", "そう", "ええ", "はい", "いいえ"];
/**
 * Course furniture — character names and bare interjections, present since
 * m3 and belonging to no module. `metBefore` below counts them as met, and
 * every OTHER consumer of "what has the learner actually been taught"
 * (`languages/ja/curriculum/taughtVocab.ts`, which feeds the render-time
 * build-tile pad — B088) must agree with the compiler, so the list is
 * exported once here rather than copied.
 */
export const JA_COURSE_FURNITURE_KANA: readonly string[] = [...NAMES, ...INTERJ];
/**
 * Single-character GRAMMATICAL tokens that belong to no lexicon here: the
 * plain copula 「だ」 and the な-adjective's attributive 「な」. Both tile
 * correctly already — they are here so the buildability gate can tell them
 * apart from debris.
 *
 * They are the reason that gate used to carry a `t.length > 1` escape, and
 * that escape is why nine shattered build steps shipped (Spencer's learner
 * walk, 2026-07-27): 「かいません」 tokenized to かい + ま + せん — "shell",
 * a stray ま, and せん "thousand" — and every fragment either was a real atom
 * or was one character long, so the gate saw nothing. Naming the two real
 * single-char tokens costs one line and lets the gate reject the rest.
 */
const COPULA = ["だ", "な"];
/**
 * Polite ENDINGS, as bound morphemes. 「ません」 is one ending, but with only
 * 「せん」 in the lexicon (千, "thousand") the tokenizer read every polite
 * negative as ま + せん and happily reported that the learner had been
 * introduced to the word "thousand" — m16's conjugation drill was the debut
 * of 千 for the whole course. Endings are longest-match-first like everything
 * else, so a fully registered form (かいません) still wins as a single tile;
 * this only governs what happens to the tail nobody registered.
 */
const POLITE_ENDINGS = ["ます", "ません"];
/**
 * BOUND ENDERS — real atoms that cannot stand alone as an utterance. They
 * attach to a preceding predicate, so a filler slot that asks the learner to
 * "Say: intend to" and expects 「つもり」 is asking for something no one says.
 *
 * Found 2026-07-27 by scanning every compiled production target course-wide:
 * m23 shipped 「つもり」 twice and m24 shipped 「ましょう」 once, all as
 * `speaking` filler. m25 caught it in its own pool and pulled its four enders
 * out by hand — which is the per-module fix, and is why this list exists
 * instead: the filler generator draws from the pool automatically, so every
 * future module with a bound ender would ship the same step again.
 *
 * Excluded deliberately: しましょう is a complete utterance ("let's do it"),
 * as are the INTERJ above.
 *
 * 2026-07-27, m27: six more, added BEFORE the module shipped rather than after
 * (which is the whole point of the list existing). んだ / んです / なんだ /
 * なんです attach to a finished clause and なんだ carries a copula that only a
 * noun can hand it; すぎる / すぎた attach to a ます-stem or an adjective stem.
 * A filler slot asking "Say: too much" and expecting 「すぎる」 is the つもり
 * defect with a different word in it. NOT added: なる / なった and the seven
 * 〜すぎる ADJECTIVE composites (たかすぎる …), because those are complete
 * utterances — 「たかすぎる」 is a whole sentence.
 *
 * 2026-07-27, m28: eight more, again added WITH the module. The six 〜なければ
 * forms are dangling conditionals — 「いかなければ」 is "if I don't go…" and
 * nobody stops there — and ならない / なりません are the halves that finish them.
 * **The seven 〜なきゃ forms and the two 〜なくちゃ forms are deliberately NOT
 * here**: 「いかなきゃ。」 is a complete utterance ("gotta go"), which is the whole
 * reason m28 registers each contraction as one whole atom rather than
 * registering a bare 「なきゃ」 that would have been bound.
 *
 * 2026-07-27, m29: よ and ね, on a PRINCIPLE rather than case by case — a form
 * that carries the PREDICATE is not bound, a form that only decorates one is.
 * 「よ」 and 「ね」 attach to a sentence that is already finished and contribute
 * no proposition, so 「よ。」 is not an utterance and a filler slot asking the
 * learner to "Say: you know" is the つもり defect with a shorter word in it.
 * NOT added by the same principle: m29's じゃない / じゃないです / じゃありません,
 * because the negative copula IS the predicate — 「じゃない。」 is a complete
 * reply ("it's not") and its two polite skins are the same reply said to
 * somebody else.
 */
const BOUND = [
  "つもり", "ましょう", "でしょう", "でしょ", "だろう", "かな", "たり",
  "んだ", "んです", "なんだ", "なんです", "すぎる", "すぎた",
  "いかなければ", "のまなければ", "かえらなければ", "しなければ",
  "はたらかなければ", "おぼえなければ", "ならない", "なりません",
  "よ", "ね",
];
const PUNCT = /[。、？！]/g;

/**
 * Verb ます-stems and い-adjective く-stems.
 *
 * 〜に いく, 〜ながら, 〜やすい/にくい, 〜すぎる, 〜たがる and 〜く なる all attach
 * to a stem, and a stem was a surface no lexicon here knew — so the sentence
 * read as an invented mutation and the unbuildable gate rejected it. That
 * already cost two spine items (m12 dropped 〜く なる, m13 dropped 〜に いく,
 * both for tooling reasons rather than curriculum ones) and would have blocked
 * most of N4's m36.
 *
 * Safe to add to the tokenizer by construction: `vocab` is longest-match-first,
 * so a SHORTER entry can only win where nothing longer matched — i.e. exactly
 * where the old code was emitting an unrecognized fragment. It cannot change a
 * tokenization that was already correct.
 */
const STEMS: readonly string[] = (() => {
  const out = new Set<string>();
  for (const v of VERB_ENTRIES) {
    const masu = conjugateVerb(v.dictionary, v.group, "masu");
    if (masu.endsWith("ます")) out.add(masu.slice(0, -2));
  }
  for (const adj of ADJ_ENTRIES) {
    if (adj.type !== "i-adj") continue;
    // いい is irregular in every stem it forms: よく, never いく — which is a
    // different verb entirely.
    if (adj.dictionary === "いい") out.add("よく");
    else if (adj.dictionary.endsWith("い")) out.add(`${adj.dictionary.slice(0, -1)}く`);
  }
  out.delete("");
  return [...out];
})();

/**
 * Split on SENTENCE-final punctuation only — 、 is a comma, not a boundary.
 * Returns each sentence with the mark that ended it, so the tokenizer can put
 * the mark back on the last tile of every non-final sentence.
 */
function splitSentences(ja: string): { text: string; mark: string }[] {
  const out: { text: string; mark: string }[] = [];
  for (const m of ja.matchAll(/([^。？！]*)([。？！]?)/g)) {
    if (!m[1].trim() && !m[2]) continue;
    out.push({ text: m[1], mark: m[2] });
  }
  return out.length ? out : [{ text: ja, mark: "" }];
}

/** Step taxonomy is SHARED with the guards — see `stepTaxonomy.ts` for why
 *  these must never be re-declared locally. */
const SELECTION = SELECTION_TYPES;
const INTRO_STEP_TYPES = TEACH_FIRST_INTRO_TYPES;

/** Does `seq` respect every gate? Used to veto an adjacency-repair swap
 *  that would move a step ahead of a word's debut. */
function precedenceHolds(
  seq: LessonStep[],
  gated: Map<LessonStep, Set<string>>,
  gateOf: Map<string, LessonStep>,
  satisfied: ReadonlySet<string>,
): boolean {
  const seen = new Set(satisfied);
  for (const s of seq) {
    for (const k of gated.get(s) ?? []) {
      const g = gateOf.get(k);
      if (!seen.has(k) && g !== undefined && g !== s) return false;
    }
    for (const k of gated.get(s) ?? []) seen.add(k);
  }
  return true;
}

function atomIndex(ir: ModuleIR): Map<string, Atom> {
  const m = new Map<string, Atom>();
  // Iterate the RESOLVED by-kana map, not the raw list. Building a second
  // kana index here made this map first-wins while JA_COURSE_ATOMS_BY_KANA was
  // last-wins, so ambiguous kana got one sense for their gloss and the other
  // for their SRS id (はな displayed "flower", credited 鼻 "nose").
  for (const a of JA_COURSE_ATOMS_BY_KANA.values() as unknown as Iterable<
    Record<string, unknown>
  >) {
    const kana = a.kana as string;
    if (kana && !m.has(kana))
      m.set(kana, {
        kana,
        meaningEn: (a.meaningEn as string) ?? kana,
        shortGloss: a.shortGloss as string | undefined,
        emoji: a.emoji as string | undefined,
        fromModule: (a.fromModule as ReviewAtom["fromModule"]) ?? "m6",
      });
  }
  // Words EARLIER IR modules taught. Most IR atoms are deliberately left out of
  // courseAtoms (registering inflections regresses flashcard import and
  // annotateJapaneseText), so without this a later module cannot see them at
  // all: their surfaces shattered into junk tiles, and sometimes split silently
  // into other real words — 「ふるかった」 → ふる "to fall" + かった "bought", no
  // diagnostic, wrong SRS credit. m15 worked around it by avoiding nine words
  // it had every right to reuse.
  for (const a of ir.priorAtoms ?? [])
    m.set(a.kana, {
      kana: a.kana,
      meaningEn: a.gloss,
      shortGloss: a.shortGloss,
      emoji: m.get(a.kana)?.emoji,
      fromModule: (m.get(a.kana)?.fromModule ?? "m6") as ReviewAtom["fromModule"],
    });
  for (const a of ir.newAtoms ?? [])
    m.set(a.kana, {
      kana: a.kana,
      meaningEn: a.gloss,
      shortGloss: a.shortGloss,
      // The IR overrides the GLOSS, not the artwork. Dropping the course
      // atom's emoji here silently disabled EVERY image debut in every
      // IR-compiled module (m6-m10 shipped zero word_image_mcq steps), which
      // is why one-token `mode: build` beats had to stand in as intros —
      // and why 41 single-tile builds came back (inv 19).
      emoji: m.get(a.kana)?.emoji,
      fromModule: ir.module as ReviewAtom["fromModule"],
    });
  return m;
}

/**
 * Rule-table sub-row for forms whose rule branches INSIDE a verb class.
 *
 * て and た are the only such forms: every godan verb is class `godan`, but
 * the final kana picks the row (う・つ・る→って, む・ぶ・ぬ→んで, く→いて,
 * ぐ→いで, す→して). Derived here rather than authored in the IR — the ending
 * IS the base's last character, so asking authors to restate it would just be
 * a second place to get it wrong.
 *
 * いく is its own subgroup: it ends in く but takes って, and it is the most
 * common verb that breaks the table. Returns undefined for forms with one
 * rule per class (ない, ます, …), which highlight on class alone.
 */
const TE_TA_SUBGROUP: Record<string, string> = {
  う: "tte", つ: "tte", る: "tte",
  む: "nde", ぶ: "nde", ぬ: "nde",
  く: "ite",
  ぐ: "ide",
  す: "shite",
};

function transformSubgroup(
  form: string,
  group: string,
  base: string,
): string | undefined {
  if (form !== "te" && form !== "ta") return undefined;
  if (group !== "godan") return undefined;
  if (base === "いく") return "iku";
  return TE_TA_SUBGROUP[base.slice(-1)];
}

/**
 * Pick the card a rule beat means.
 *
 * Most ids name exactly one card and this is a lookup. Where a module writes
 * several cards under one id — m6's three `nai-form` cards, one per verb class
 * — the beat says which with `variant`, matched against the card's own
 * `variant`. Returns undefined when the reference is ambiguous rather than
 * guessing; `diagnoseModule` turns that into a build failure.
 */
function resolveGrammarPoint(
  ir: ModuleIR,
  beat: { grammarPointId: string; variant?: string },
): IRGrammarPoint | undefined {
  const candidates = (ir.grammarPoints ?? []).filter((g) => g.id === beat.grammarPointId);
  if (candidates.length <= 1) return candidates[0];
  if (!beat.variant) return undefined;
  return candidates.find((c) => c.variant === beat.variant);
}

function makeTokenizer(atoms: Map<string, Atom>) {
  const vocab = [
    ...new Set([...atoms.keys(), ...PARTICLES, ...NAMES, ...INTERJ, ...STEMS, ...COPULA, ...POLITE_ENDINGS]),
  ].sort(
    (a, b) => b.length - a.length,
  );
  return function tokenize(ja: string): string[] {
    // Authored spaces are WORD BOUNDARIES — tokenize each segment
    // independently, never matching across them. Stripping spaces first
    // let はい greedy-match across the きょうは|いかない boundary and
    // emitted an UNBUILDABLE build step (きょう・はい・か・ない —
    // Spencer m6 walk 2026-07-23). The `unbuildable` diagnostic below is
    // the standing gate for this class.
    // Sentence-final punctuation is ALSO a word boundary, and it has to
    // survive into the tiles. Stripping it globally first fused two
    // independent clauses into one run-on whenever a beat held more than one
    // sentence: 「…だった。ちょっと たかい。」 built as ろくじゅうえんだった +
    // ちょっと with nothing between them, and the audio ran them together
    // (m8-m11, 8 beats). The boundary mark rides on the preceding tile so the
    // break is visible without costing the learner an extra tap.
    const out: string[] = [];
    const sentences = splitSentences(ja);
    for (const [n, sentence] of sentences.entries()) {
      const before = out.length;
      for (const str of sentence.text.replace(PUNCT, "").split(/[　\s]+/).filter(Boolean)) {
        let i = 0;
        while (i < str.length) {
          const hit = vocab.find((t) => str.startsWith(t, i));
          if (hit) {
            out.push(hit);
            i += hit.length;
          } else {
            let j = i + 1;
            while (j < str.length && !vocab.some((t) => str.startsWith(t, j))) j++;
            out.push(str.slice(i, j));
            i = j;
          }
        }
      }
      // A trailing 。 is implicit and has always been dropped. A trailing ？ is
      // NOT: a plain-form question has no か, so 「ミカは くると おもう」 and
      // 「ミカは くると おもう？」 are the same tiles and opposite meanings, and
      // the question reading lives entirely in intonation a tile bank cannot
      // encode. m18 shipped two items where the prompt asked a question the
      // learner had no way to build. The mark rides the last tile, so it costs
      // no extra tap.
      const isLast = n === sentences.length - 1;
      const keep = !isLast || sentence.mark === "？";
      if (keep && sentence.mark && out.length > before) {
        out[out.length - 1] += sentence.mark;
      }
    }
    return out;
  };
}

// ── compiler ────────────────────────────────────────────────────────────────
export function compileModule(ir: ModuleIR): LessonContent[] {
  const atoms = atomIndex(ir);
  const tokenize = makeTokenizer(atoms);
  const moduleId = ir.module;
  // Distractors may only come from vocabulary THIS module declares — its own
  // newAtoms plus every reviewPool word (a pool entry asserts the word is
  // already known). `atomIndex` loads the whole course, and an unfiltered pool
  // handed far-future words (ギター, としょかん) to MCQ distractors.
  const declaredKana = new Set<string>([
    ...(ir.newAtoms ?? []).map((a) => a.kana),
    ...ir.lessons.flatMap((l) => l.reviewPool ?? []),
  ]);
  const declaredPool: Atom[] = [...atoms.values()].filter((a) => declaredKana.has(a.kana));
  const emojiPool: Atom[] = [...atoms.values()].filter(
    (a) => a.emoji && !WORD_IMAGE_MCQ_BLOCKLIST.has(a.kana),
  );

  /**
   * Has the learner MET this word before this module?
   *
   * `ir.priorVocab` is the union of what every earlier module actually taught
   * (compile-ir.mjs builds it). `courseAtoms.fromModule` deliberately is not
   * consulted: those tags are stale by construction — m5's seed verbs still
   * carry old-course m7/m11/m15 tags — so ordering by them both admits
   * untaught words and rejects taught ones.
   */
  // Character names and bare interjections belong to no module — they are
  // course furniture, present since m3 — so they count as met. Without this the
  // leak check is inexact exactly where it looks most alarming (トム, ケン).
  const priorVocab = new Set([...(ir.priorVocab ?? []), ...NAMES, ...INTERJ]);
  const metBefore = (kana: string): boolean => priorVocab.has(kana);

  const resolve = (kana: string): Atom =>
    atoms.get(kana) ?? { kana, meaningEn: kana, fromModule: moduleId as ReviewAtom["fromModule"] };
  /**
   * Atoms a beat actually practises.
   *
   * The honorific さん is a homograph of the number 三, and Track A credited
   * every 「たなかさん」 as a review of "three" — 31 steps across m7–m11, which
   * meant FSRS kept marking 三 as freshly practised and stopped scheduling it.
   * An honorific always attaches to a person's name, so a さん that follows one
   * is never the numeral. (The module notes already flagged this collision
   * class for に/にじゅう and missed it here.)
   */
  const exercised = (ja: string): string[] => {
    const tokens = tokenize(ja);
    return tokens.filter((t, i) => {
      if (!atoms.has(t)) return false;
      if (t === "さん" && i > 0 && NAMES.includes(tokens[i - 1])) return false;
      return true;
    });
  };
  /**
   * DESTINATION に ↔ へ.
   *
   * Both particles mark where you are going, so 「としょかんに いく」 and
   * 「としょかんへ いく」 are equally correct and max-acceptance grading requires
   * both. m19 rejected the unauthored one in three items.
   *
   * The two directions are NOT symmetric, which is why this is a rule and not a
   * blanket swap:
   *   へ → に  is always safe — へ has exactly one job, direction.
   *   に → へ  is only safe when に is marking a DESTINATION, i.e. the sentence
   *           runs to a motion verb. に also marks time (ごじに), location of
   *           existence (いえに ある) and the indirect object (ミカに いう), and
   *           へ is wrong in every one of those.
   */
  const MOTION_VERB = /(いく|いきます|いった|いきました|くる|きます|きた|きました|かえる|かえります|かえった|かえりました)/;
  const particleVariants = (ja: string): string[] => {
    const out = [ja];
    if (ja.includes("へ")) out.push(ja.replace(/へ/g, "に"));
    // Swap ONLY a に that IMMEDIATELY precedes the motion verb. Anything looser
    // reaches particles that are not destinations: a blanket replace turns
    // 「ごじに としょかんに いく」 into 「ごじへ としょかんへ いく」, and even
    // "the last に before the verb" grabs the に inside までに
    // (「ごじまでに うちへ かえる」 → 「ごじまでへ …」).
    out.push(ja.replace(new RegExp(`に(\\s*)(?=${MOTION_VERB.source})`), "へ$1"));
    return out;
  };

  const acceptedVariants = (ja: string): string[] => {
    const out = new Set<string>();
    for (const variant of particleVariants(ja.trim())) {
      const noPunct = variant.replace(PUNCT, "").trim();
      out.add(variant);
      out.add(noPunct);
      out.add(noPunct.replace(/[　\s]/g, ""));
    }
    return [...out];
  };
  /**
   * Strip punctuation — but a 、 becomes a SPACE, not nothing.
   *
   * 、 is a prosodic break, and deleting it fuses the words on either side:
   * 「うん、いえに いく。」 rendered and was SPOKEN as 「うんいえに いく」, which
   * reads as one unfamiliar word. Spencer's learner walk hit six of these in
   * m10, where the fused word happened to start with a yes/no word it
   * recognised; a scan then found 175 across 24 modules, fusing silently
   * mid-sentence everywhere else.
   *
   * A space is what the rest of the pipeline already uses for a word
   * boundary, so tiles are unaffected (the tokenizer was longest-matching
   * across the fusion correctly) — this changes what is DISPLAYED and what
   * TTS is handed.
   */
  const clean = (ja: string) =>
    ja.replace(/、/g, " ").replace(PUNCT, "").replace(/[ 　]+/g, " ").trim();
  /**
   * Target text for a BUILD step. Same as `clean`, except an internal
   * sentence boundary survives — otherwise a two-sentence beat renders (and
   * is spoken) as a run-on. The trailing mark still goes, as it always has.
   */
  const buildTarget = (ja: string) => {
    const parts = splitSentences(ja);
    return parts
      .map((s, i) => {
        // Trailing ？ survives (it is the only thing marking a plain-form
        // question); trailing 。 does not. See the tokenizer for why.
        const last = i === parts.length - 1;
        return clean(s.text) + (last && s.mark !== "？" ? "" : s.mark);
      })
      .join("")
      .trim();
  };

  // Inv 25: a module carries THREE review lessons. Resolve every lesson's
  // role up front so review lessons can be numbered without colliding —
  // the old single-review assumption named them all `ja-<m>-neo-review`.
  const roleOf = (l: IRLesson): "teaching" | "review" | "challenge" => {
    if (l.role) return l.role;
    // Legacy inference for m6-era IR that predates `role:`.
    if (l.id.endsWith("-challenge")) return "challenge";
    const hasChallengeBeat = l.beats.some(
      (b) => b.kind === "capstone" || b.kind === "challenge",
    );
    return hasChallengeBeat ? "teaching" : "review";
  };
  const reviewIds = ir.lessons.filter((l) => roleOf(l) === "review").map((l) => l.id);

  // ── AVAILABILITY (teach-first, inv 33) ────────────────────────────────
  // A module-new atom is not usable as DISTRACTOR/filler/match material
  // until a STRICTLY EARLIER lesson has introduced it. Options text is a
  // real appearance to the provenance guard, so an unscoped pool makes a
  // word debut on a `multiple_choice` distractor lessons before it is
  // taught (m7 のみません in lesson 1, taught in lesson 3). Same-lesson
  // introduces are excluded too: filler is interleaved, so nothing can
  // guarantee the distractor lands after the intro step.
  const moduleNew = new Set((ir.newAtoms ?? []).map((a) => a.kana));
  // Introduced-by-declaration: `introduces:` on a strictly earlier lesson.
  const introducedBefore: Set<string>[] = [];
  {
    const acc = new Set<string>();
    for (const l of ir.lessons) {
      introducedBefore.push(new Set(acc));
      for (const k of l.introduces ?? []) if (moduleNew.has(k)) acc.add(k);
    }
  }
  // Introduced-by-USE: a reviewPool entry asserts "already known", and it
  // can be WRONG — m6's L9 pool lists なか, which m6 itself only teaches in
  // L10 (its IR comment calls うえ/なか "the KNOWN nouns"); m7's L2 pool
  // lists パーティー, which the module first uses in review-1. The claim is
  // unverifiable from `newAtoms` alone, so derive it from the IR: the first
  // lesson at which a word lands on an INTRO-CAPABLE beat. A word this
  // module itself teaches later is not prior-known, whatever the pool says.
  const firstIntroLesson = new Map<string, number>();
  {
    const note = (kana: string, li: number) => {
      if (!firstIntroLesson.has(kana)) firstIntroLesson.set(kana, li);
    };
    ir.lessons.forEach((l, li) => {
      // word_image_mcq debuts (intro-capable) — see `debutSteps` below.
      for (const k of l.introduces ?? []) note(k, li);
      for (const b of l.beats) {
        if (b.kind === "rule") {
          // grammar_rule: examples render as kana-only lines the provenance
          // guard reads. The `rule:` prose is mixed-script and invisible to
          // it, so it does NOT count as an intro.
          for (const e of resolveGrammarPoint(ir, b)?.examples ?? [])
            for (const t of tokenize(e.ja)) note(t, li);
        } else if (b.kind === "particle-cloze") {
          for (const t of tokenize(`${b.stem}${b.answer}${b.tail}`)) note(t, li);
        } else if (b.kind === "listening-comp") {
          // listening_comprehension IS intro-capable, so its audio counts.
          for (const t of tokenize(b.audio)) note(t, li);
        } else if (b.kind === "register") {
          // A register beat compiles to build_sentence, so provenance WILL
          // treat it as intro-capable — this scan has to agree or `usableHere`
          // drifts from the guard. That a register beat must never actually be
          // a word's first exposure is a separate, stricter rule, enforced by
          // registerScaffoldIsolation.
          for (const t of tokenize(b.answer)) note(t, li);
          for (const o of b.options) for (const t of tokenize(o)) note(t, li);
        } else if (b.kind !== "dialogue" && b.kind !== "kanji" && b.mode === "build") {
          // build_sentence only: `listening` → listening_build and
          // `translate` → translate, neither of which can introduce.
          for (const t of tokenize(b.ja)) note(t, li);
        }
      }
    });
  }

  return ir.lessons.map((lesson, lessonIdx) => {
    /** May this word appear on a NON-intro-capable step in this lesson?
     *  Module-new atoms need a declared earlier `introduces:`; anything the
     *  module itself teaches needs that teaching to be strictly earlier;
     *  everything else is genuinely prior-module vocabulary. */
    const known = introducedBefore[lessonIdx];
    const usableKana = (kana: string): boolean => {
      // PRIOR-MODULE vocabulary is known by definition — it must not be gated
      // on `firstIntroLesson`. It was, and the effect was severe: any earlier
      // word that ALSO appears in a later lesson of this module (いく, たべる,
      // せんせい …) counted as "introduced later" and dropped out of the filler
      // pool early, collapsing it to whichever words happened not to recur.
      // m10-neo-1 was left with one usable word and shipped the identical
      // "Pick the word for 'person'" MCQ five times in one lesson.
      // …but "not new here" is not the same as "known". Every atom belonging
      // to a LATER module also lands in this branch, and the pools believed
      // them: image-MCQ debuts and filler drew distractors from the whole
      // registry, so untaught words (えいが, りょこう, ポスト) shipped as wrong
      // answers, and だいがく — an m19 atom — became m13's running example.
      // `priorVocab` is what earlier modules actually taught, computed in
      // compile-ir.mjs where the filesystem is available.
      if (!moduleNew.has(kana)) return metBefore(kana);
      // Module-new stays STRICT: usable only after the lesson that declares
      // it in `introduces:`. Loosening this to a beat-scan fallback let a new
      // word reach filler before its own debut (m6 なか, m7 パーティー).
      return known.has(kana);
    };
    const usableHere = (a: Atom) => usableKana(a.kana);
    const role = roleOf(lesson);
    const isReview = role === "review";
    // Review lessons are named `-review` so the guards' review-lesson
    // exemptions (challenge step, dialogue-open) fire. A lone review keeps
    // the unnumbered id m6 already ships; 2+ get a 1-based suffix.
    const reviewId =
      reviewIds.length > 1
        ? `ja-${moduleId}-neo-review-${reviewIds.indexOf(lesson.id) + 1}`
        : `ja-${moduleId}-neo-review`;
    const lid = isReview ? reviewId : `ja-${lesson.id}`;
    let n = 0;
    const sid = (tag: string) => `${lid}-${tag}-${n++}`;

    /** This lesson's own sentences, so filler can re-present them in another
     *  modality — same concepts, different context (Spencer 2026-07-26) —
     *  instead of padding with unrelated single words.
     *
     *  `en` here is the MEANING, not the beat's prompt. A beat's `en` IS its
     *  prompt (inv 39), so it may open with a register cue — "Say politely: I
     *  work from nine" (inv 8). Filler re-presents the sentence as a
     *  listening-comprehension item asking "What does this sentence mean?",
     *  and a directive addressed to the speaker is not a meaning: 164 options
     *  across m5-m20 read "Say politely: …" as an answer to that question,
     *  which is both wrong and a giveaway (only the authored sentence carries
     *  a cue, so the cued option stands out). Strip the cue where the text
     *  changes job; the build prompt keeps it. A colon is required, so a
     *  sentence that genuinely MEANS "Say it one more time." is untouched. */
    const meaningOf = (en: string): string =>
      en.replace(/^(?:Say|Ask|Answer|Reply|Tell)\b[^:]{0,40}:\s*/i, "").trim() || en;
    const sentencePairs: { ja: string; en: string }[] = [];
    const ruleSteps: LessonStep[] = [];
    const body: LessonStep[] = [];
    // Transform ramp (spec 2026-07-23): pinned IMMEDIATELY after the rule
    // steps, exempt from the interleaver — the whole point is that the
    // transformation gets drilled before any sentence work, and that no
    // typed production lands adjacent to a new rule.
    const transformRamp: LessonStep[] = [];
    let capstone: LessonStep | null = null;

    // IR verbClass name → the transform card's CLASS axis. `i-adj` (m12 /
    // spine s09) rides the same ramp: an い-adjective conjugates like a verb,
    // so the 4-cell adjective table is drilled by the same card type.
    const IR_CLASS_TO_GROUP: Record<
      string,
      "ichidan" | "godan" | "irregular" | "i-adj"
    > = {
      ru: "ichidan",
      u: "godan",
      irregular: "irregular",
      "i-adj": "i-adj",
    };

    for (const beat of lesson.beats) {
      if (beat.kind === "rule") {
        const gp = resolveGrammarPoint(ir, beat);
        if (!gp) continue;
        ruleSteps.push(
          grammarRule({
            id: `${lid}-rule-${beat.grammarPointId}`,
            title: lesson.title ?? ir.title,
            rule: gp.rule,
            examples: gp.examples.map((e) => ({ ...e, romaji: kanaToRomaji(e.ja) })),
            antiPattern: gp.antiPattern
              ? {
                  ja: gp.antiPattern.ja,
                  romaji: kanaToRomaji(gp.antiPattern.ja),
                  en: "(incorrect)",
                  why: gp.antiPattern.why,
                }
              : undefined,
            grammarPointId: beat.grammarPointId,
            conjugationForm: gp.conjugation?.form,
            transferDiagram: gp.diagram,
          }),
        );
        if (gp.conjugation) {
          const groups = gp.conjugation.classes
            .map((c) => IR_CLASS_TO_GROUP[c])
            .filter(Boolean);
          // Ramp material: THIS LESSON's derived forms whose base's class
          // matches the rule — scoped to `introduces` so a same-class atom
          // from a later lesson (いない, L6) can't ride an earlier ramp
          // ahead of its own base verb's intro (teach-first, inv 33).
          const scope = new Set(lesson.introduces ?? []);
          const material = (ir.newAtoms ?? []).filter(
            (a) =>
              a.derivedFrom &&
              a.verbClass &&
              groups.includes(IR_CLASS_TO_GROUP[a.verbClass]) &&
              (scope.size === 0 || scope.has(a.kana)) &&
              // You cannot drill a transform FROM a base the learner has never
              // met. m14's ramp printed すむ as a given, and すむ is taught in
              // no module — the base is the card's premise, not its answer, so
              // an untaught one is invisible to the debut guards.
              (metBefore(a.derivedFrom as string) ||
                (ir.newAtoms ?? []).some((n) => n.kana === a.derivedFrom)),
          );
          for (const a of material.slice(0, 3)) {
            const group = IR_CLASS_TO_GROUP[a.verbClass as string];
            const base = a.derivedFrom as string;
            transformRamp.push(
              conjugationTransform({
                id: `${lid}-tf-${transformRamp.length}`,
                base,
                baseGloss: atoms.get(base)?.meaningEn ?? base,
                targetGloss: a.shortGloss ?? a.gloss,
                form: gp.conjugation.form as Parameters<typeof conjugationTransform>[0]["form"],
                group,
                subgroup: transformSubgroup(
                  gp.conjugation.form as string,
                  group,
                  base,
                ),
                baseRomaji: kanaToRomaji(base),
              }),
            );
          }
          // NOTE: the ungraded "type-tease" card was emitted here for one
          // day and CUT (Spencer 2026-07-24): the lesson already forces
          // sentence-level typing on translate steps, so a word-typing
          // "bonus" after that read as redundant, and word-level typed
          // production correctly waits for FSRS graduation (stage 3).
          // The `ungraded` step variant still exists for manual authoring.
        }
      } else if (
        beat.kind === "sentence" ||
        beat.kind === "capstone" ||
        beat.kind === "challenge"
      ) {
        // New IR uses `challenge` (→ `-challenge` step id); m6's legacy
        // `capstone` beats keep emitting `-capstone` so shipped step ids
        // (and saved lesson-resume state keyed by them) don't churn.
        const id =
          beat.kind === "challenge"
            ? `${lid}-challenge`
            : beat.kind === "capstone"
              ? `${lid}-capstone`
              : sid("s");
        sentencePairs.push({ ja: clean(beat.ja), en: meaningOf(beat.en) });
        const ex = exercised(beat.ja);
        let step: LessonStep;
        if (beat.mode === "translate") {
          step = translateStep({
            id,
            promptEn: beat.en,
            acceptedAnswers: [
              ...acceptedVariants(beat.ja),
              ...(beat.alsoAccept ?? []).flatMap(acceptedVariants),
            ],
            audioText: clean(beat.ja),
            exercisedAtomKanas: ex,
          });
          if (beat.pitfall) {
            // Known-trap tip: the reactive-tip gate (reactiveTipGate.ts)
            // fires this ONLY when the learner's typed answer actually
            // contains the trap surface — targeted correction, not a
            // generic lecture.
            step.reactiveGrammarTip = {
              grammarPointId: `pitfall-${id}`,
              title: beat.pitfall.title ?? "Heads up",
              ruleLine: beat.pitfall.why,
              wrongJa: beat.pitfall.wrong,
              wrongRomaji: kanaToRomaji(beat.pitfall.wrong),
              rightJa: beat.ja,
              rightRomaji: kanaToRomaji(beat.ja),
              why: beat.pitfall.why,
            };
          }
        } else if (beat.mode === "listening") {
          const tiles = tokenize(beat.ja);
          step = listeningBuildSentence({
            id,
            target: buildTarget(beat.ja),
            tiles,
            correctOrder: tiles,
            promptEn: "Build what you hear.",
            exercisedAtomKanas: ex,
          });
        } else {
          const tiles = tokenize(beat.ja);
          // A beat's `en` that already opens with a directive IS the prompt —
          // prefixing "Build: " onto a register cue produced the double-framed
          // "Build: Say to a friend: Yeah" on all 327 `Say …` beats course-wide.
          // Inv 8 wants the cue to be the FIRST thing read, not the second.
          const directive = /^(Say|Ask|Answer|Reply|Tell)\b/.test(beat.en);
          step = build(
            id,
            directive ? beat.en : `Build: ${beat.en}`,
            buildTarget(beat.ja),
            tiles,
            tiles,
            ex,
          );
        }
        // Track B (grammar SRS): carry the beat's declared grammar points
        // onto the step. `exercises` (sentence) and `combines` (challenge)
        // share one vocabulary. Until 2026-07-26 both fields were authored
        // but never read — this is what makes compiled content gradeable
        // against the grammar scheduler instead of dead metadata.
        const points = [...(beat.exercises ?? []), ...(beat.combines ?? [])];
        if (points.length) step.exercisedGrammar = [...new Set(points)];
        if (beat.kind === "capstone" || beat.kind === "challenge")
          capstone = step;
        else body.push(step);
      } else if (beat.kind === "listening-comp") {
        const step = listeningCompSentence({
          id: sid("lc"),
          // buildTarget, not clean: a listening item's ？ is the only thing
          // distinguishing 「…と おもう」 from 「…と おもう？」, and stripping it
          // left m18's challenge playing a STATEMENT while its correct option
          // was the question reading.
          audioText: buildTarget(beat.audio),
          correctMeaningEn: beat.answer,
          distractorsEn: beat.distractors,
          question: beat.q,
          explanation: beat.explanation,
          exercisedAtomKanas: exercised(beat.audio),
        });
        if (beat.exercises?.length)
          step.exercisedGrammar = [...new Set(beat.exercises)];
        body.push(step);
      } else if (beat.kind === "register") {
        // The register ladder compiles to a single-answer picker — NOT a
        // particle_cloze. Inv 5 pins that type as introduction-only and these
        // are not particles, so framing the picker keeps the whole ladder in
        // one step type and leaves inv 5 untouched rather than carved out.
        const aud = audience(beat.audience);
        if (aud) {
          const tiles = [...new Set(beat.options)];
          const step: LessonStep = {
            id: sid("reg"),
            type: "build_sentence",
            prompt: beat.en,
            targetSentence: beat.answer,
            tiles,
            correctOrder: [beat.answer],
            granularity: "word",
            // Not a one-tile build — a choice between whole utterances. See
            // `picker` in types.ts; without this the bulk audit reads the
            // ladder as 6 broken builds.
            picker: true,
            // Stage 3 has NO picture: the vocative frame names the addressee
            // in Japanese, which is the point of reaching stage 3 at all.
            ...(beat.stage < 3
              ? {
                  audienceEmoji: aud.emoji,
                  audienceLabel: aud.label,
                  politenessHint: aud.politeness,
                }
              : {}),
            ...(beat.stage === 1 && beat.cheatSheet
              ? {
                  referenceTable: registerCheatSheet(
                    beat.cheatSheet,
                    beat.audience,
                  ),
                }
              : {}),
            ...(beat.frame
              ? {
                  frameBefore: beat.frame.before,
                  frameAfter: beat.frame.after ?? "",
                }
              : {}),
          } as LessonStep;
          if (beat.exercises?.length)
            step.exercisedGrammar = [...new Set(beat.exercises)];
          body.push(step);
        }
      } else if (beat.kind === "kanji") {
        // Reading ladder. The atom is prior-module by construction (the beat
        // tests a READING, never a new word), so no gate/debut plumbing is
        // needed — and the factory throws rather than degrading, because a
        // silently-dropped kanji step is a coverage hole nothing else sees.
        const a = resolve(beat.kana);
        const step = kanjiReading(
          sid("kanji"),
          {
            kana: a.kana,
            meaningEn: a.meaningEn,
            fromModule: a.fromModule,
          } as ReviewAtom,
          { kanji: beat.kanji, distractors: beat.distractors },
        );
        if (beat.exercises?.length)
          step.exercisedGrammar = [...new Set(beat.exercises)];
        body.push(step);
      } else if (beat.kind === "particle-cloze") {
        const full = clean(`${beat.stem}${beat.answer}${beat.tail}`);
        body.push(
          cloze(sid("cloze"), beat.stem, beat.tail, beat.answer, beat.options, beat.en, full, beat.explanation),
        );
      } else if (beat.kind === "dialogue") {
        const questions = beat.questions.map((q, qi) => {
          const wrong = q.options.filter((o) => o !== q.answer);
          const fillers = ["We can't tell", "Neither", "Both", "Not yet"];
          const distractors = [...wrong];
          for (const f of fillers) {
            if (distractors.length >= 3) break;
            if (!distractors.includes(f) && f !== q.answer) distractors.push(f);
          }
          return {
            id: `q${qi}`,
            prompt: q.q,
            correctText: q.answer,
            distractors: distractors.slice(0, 3) as [string, string, string],
          };
        });
        body.push(
          dialogueListen({
            id: sid("dlg"),
            lines: beat.lines.map((l) => ({ speaker: l.speaker, kana: l.ja })),
            questions,
          }),
        );
      }
    }

    // ── DENSITY: assemble the middle pool so rule + middle + capstone + match
    //    lands in [18, 24]; pad with review fillers, trim fillers if over.
    const pool = (lesson.reviewPool ?? []).map(resolve).filter(usableHere);
    // Match pairs are EXCLUSIVELY words (Spencer 2026-07-24: "が is not a
    // word") — particles drill in cloze/build, never as match tiles.
    const matchable = pool.filter((a) => !PARTICLES.includes(a.kana));
    const picked = (
      matchable.length >= 4 ? matchable : [...matchable, ...emojiPool.filter(usableHere)]
    ).slice(0, 6);
    const tileGlosses = picked.map(matchTileGloss);
    const matchAtoms = picked.map((a, i) => ({
      ...a,
      // Truncation must never create two identical targets (elimination
      // ambiguity — matchPairsPairCount guard): a collided tile falls back
      // to its full gloss, e.g. で/に both shortening to "at".
      meaningEn:
        tileGlosses.filter((g) => g === tileGlosses[i]).length > 1
          ? a.meaningEn
          : tileGlosses[i],
    }));
    const match = reviewMatchPairs(`${lid}-rev`, matchAtoms);

    // Image-first debuts (Spencer 2026-07-23): an imageable NEW word's
    // first-ever appearance IS its word_image_mcq. These are NOT pinned —
    // a pinned block of N debuts is N-1 guaranteed adjacent-same-type
    // failures, and the pinned region is exempt from `repairAdjacency`.
    // They ride the interleaver like everything else and are held first by
    // the PRECEDENCE constraint below (gateOf), which is what "debut"
    // actually means: before every other use, not at position zero.
    const debutSteps: LessonStep[] = [];
    for (const kana of lesson.introduces ?? []) {
      const irAtom = (ir.newAtoms ?? []).find((x) => x.kana === kana);
      const atom = atoms.get(kana);
      if (!irAtom || irAtom.imageable === false || !atom?.emoji) continue;
      const v = tryVocabMcq(
        `${lid}-debut-${debutSteps.length}`,
        atom,
        emojiPool.filter(usableHere),
      );
      if (v) debutSteps.push(v);
    }

    const fixed = ruleSteps.length + transformRamp.length + (capstone ? 1 : 0) + 1;
    // Debuts lead the AUTHORED order so gate assignment prefers them.
    const middle: LessonStep[] = [...debutSteps, ...body];
    // Never TYPED-recall this lesson's own new words or any conjugated
    // form — the transform cells own their production timeline.
    const noTyped = new Set<string>([
      ...(lesson.introduces ?? []),
      ...(ir.newAtoms ?? []).filter((x) => x.derivedFrom).map((x) => x.kana),
    ]);
    let fi = 0;
    // What filler has already consumed in THIS lesson, as `modality:key`.
    // Filler used to index its pools with `i % length`, so once the slot index
    // wrapped it re-asked questions it had already asked.
    const usedFiller = new Set<string>();
    while (middle.length + fixed < 18 && fi < 60) {
      // (The <=15% translate budget that used to gate the filler's typed slot
      // went away with the slot itself — filler emits no translate steps now,
      // so every compiled translate is an authored sentence beat.)
      const f = reviewFiller(
        lid,
        fi,
        pool,
        declaredPool.filter(usableHere),
        noTyped,
        sentencePairs,
        usedFiller,
      );
      if (f) middle.push(f);
      fi++;
    }
    while (middle.length + fixed > 24 && middle.some((s) => s.id.includes("-fill-"))) {
      const idx = middle.findIndex((s) => s.id.includes("-fill-"));
      middle.splice(idx, 1);
    }

    // ── SEQUENCE: rule(s) first → TRANSFORM RAMP (pinned, exempt from the
    //    interleaver: the transformation is drilled before any sentence
    //    work, and no typed production can land adjacent to a new rule —
    //    spec 2026-07-23) → interleaved middle (image debuts included,
    //    held first by PRECEDENCE not by position) → capstone (stretch) →
    //    close on match_pairs.
    // NOTE (2026-08-06): a ramp cannot introduce its own BASE verb. The ramp
    // is pinned directly after the rule card and its atoms count as
    // pre-satisfied, so a module-new base's image debut sorts into the middle
    // and the transform card — explicitly NOT intro-capable (inv 37) —
    // becomes the word's first exposure. Pinning the debut ahead of the ramp
    // was tried and rejected: it breaks the ramp-length guard (which measures
    // distance from the last grammar_rule, not consecutive transforms) and
    // stacks adjacent word_image_mcq steps when a lesson has two new bases.
    // The rule is therefore an AUTHORING one, enforced by the debut guard:
    // introduce a base verb in an EARLIER lesson than the one that drills its
    // transformation. m8's たつ/いそぐ/かす follow it.
    const pinned = [...ruleSteps, ...transformRamp];

    // ── PRECEDENCE (teach-first, inv 33) ──────────────────────────────
    // Every atom this lesson introduces gets ONE gate: the earliest
    // intro-capable step, in AUTHORED order, that surfaces it. No step may
    // be sequenced before the gate of an atom it surfaces. This is a
    // PARTIAL order — strictly weaker than pinning, which is why it
    // composes with the adjacency/defer rules instead of fighting them.
    const needsGate = (t: string) => t.length > 1 && atoms.has(t) && !usableKana(t);
    const gatedOf = (s: LessonStep): Set<string> =>
      new Set(jaSurfaces(s).flatMap(tokenize).filter(needsGate));
    const gated = new Map<LessonStep, Set<string>>();
    for (const s of [...pinned, ...middle]) gated.set(s, gatedOf(s));
    const preSatisfied = new Set<string>();
    for (const s of pinned) for (const k of gated.get(s)!) preSatisfied.add(k);
    const gateOf = new Map<string, LessonStep>();
    for (const s of middle)
      if (INTRO_STEP_TYPES.has(s.type))
        for (const k of gated.get(s)!)
          if (!preSatisfied.has(k) && !gateOf.has(k)) gateOf.set(k, s);

    // Typed translates live as late as possible ("more repetitions before
    // typing", Spencer 2026-07-24) — but the tail must keep ≥2t-1 slots so
    // t translates can still alternate with other types (no-adjacent bar).
    const typedCount = middle.filter((s) => s.type === "translate").length;
    const midSeq = interleave(middle, lastType(pinned), {
      deferTypes: new Set(["translate"]),
      deferUntil: Math.max(
        0,
        Math.min(
          Math.ceil(middle.length * (2 / 3)),
          middle.length - (typedCount * 2 - 1),
        ),
      ),
      gated,
      gateOf,
      satisfied: preSatisfied,
    });
    const steps: LessonStep[] = [...pinned, ...midSeq];
    if (capstone) placeCapstone(steps, capstone, pinned.length);
    // ONE legality predicate for the repair pass, covering every HARD
    // constraint it could otherwise break. Repair may reorder freely inside
    // the space this predicate defines and nowhere else — that is what
    // stops the three passes from fighting.
    repairAdjacency(
      steps,
      pinned.length,
      (seq) =>
        precedenceHolds(seq, gated, gateOf, preSatisfied) &&
        challengeInWindow(seq, capstone),
    );
    steps.push(match);

    return {
      id: lid,
      moduleId,
      courseId: "mock-1",
      languageId: "ja",
      title: lesson.title ?? `${ir.title} — ${lesson.id}`,
      description: lesson.focus,
      estimatedMinutes: 5,
      xpReward: 15,
      introducesVocabIds: [],
      steps,
    } as LessonContent;
  });
}

function lastType(steps: LessonStep[]): string | null {
  return steps.length ? steps[steps.length - 1].type : null;
}

/** Reorganize greedy: at each slot pick the MOST-ABUNDANT remaining type that
 *  differs from the previous and won't make a 3rd selection-tap in a row. This
 *  spreads scarce types out and only violates when a type is unavoidably
 *  dominant (which then surfaces as an `ordering` diagnostic). */
function interleave(
  pool: LessonStep[],
  prev: string | null,
  opts?: {
    deferTypes?: Set<string>;
    deferUntil?: number;
    /** step → the not-yet-taught atoms it surfaces (see `jaSurfaces`). */
    gated?: Map<LessonStep, Set<string>>;
    /** atom → the ONE step allowed to be its first appearance. */
    gateOf?: Map<string, LessonStep>;
    /** atoms already introduced by the pinned prefix. */
    satisfied?: ReadonlySet<string>;
  },
): LessonStep[] {
  const remaining = [...pool];
  const out: LessonStep[] = [];
  let last = prev;
  let selRun = prev && SELECTION.has(prev) ? 1 : 0;
  const seen = new Set(opts?.satisfied ?? []);
  /** HARD constraint, applied before every soft tier: a step may be placed
   *  only if each new atom it surfaces is already introduced, or this step
   *  is that atom's designated gate. Acyclic by construction — a gate is
   *  the authored-earliest intro-capable step for its atom, so dependencies
   *  always point backwards in authored order. */
  const eligible = (s: LessonStep): boolean => {
    for (const k of opts?.gated?.get(s) ?? []) {
      if (seen.has(k)) continue;
      const g = opts?.gateOf?.get(k);
      if (g === undefined || g === s) continue;
      return false;
    }
    return true;
  };
  while (remaining.length) {
    // Sequence over the ELIGIBLE subset; fall back to the whole pool rather
    // than deadlock (an unsatisfiable gate is an authoring defect, reported
    // by the `ordering` diagnostic, not a reason to fail the compile).
    const avail = remaining.filter(eligible);
    const usable = avail.length ? avail : remaining;
    const byType = new Map<string, number>();
    for (const s of usable) byType.set(s.type, (byType.get(s.type) ?? 0) + 1);
    const rank = (t: string) => byType.get(t) ?? 0;
    // deferTypes are held out of the early lesson (typed translate lives
    // in the final third — "more repetitions before typing", Spencer
    // 2026-07-24). Soft constraint: the fallback tiers below may still
    // place one early rather than deadlock.
    const deferred = (t: string) =>
      (opts?.deferTypes?.has(t) ?? false) && out.length < (opts?.deferUntil ?? 0);
    // Urgency: once a type's remaining count can only JUST alternate into
    // the remaining slots (2n-1 ≥ slots), it must be picked at every legal
    // opportunity or an adjacency is forced at the tail (seen live with 6
    // deferred translates, 2026-07-24).
    const urgent = [...byType.keys()].filter(
      (t) => t !== last && (byType.get(t) ?? 0) * 2 - 1 >= remaining.length,
    );
    let cands = urgent.length
      ? urgent
      : [...byType.keys()].filter(
          (t) => t !== last && !(selRun >= 2 && SELECTION.has(t)) && !deferred(t),
        );
    if (!cands.length)
      cands = [...byType.keys()].filter((t) => !(selRun >= 2 && SELECTION.has(t)));
    if (!cands.length) cands = [...byType.keys()].filter((t) => t !== last);
    if (!cands.length) cands = [...byType.keys()];
    cands.sort((a, b) => rank(b) - rank(a));
    const t = cands[0];
    // Pick within the ELIGIBLE subset — `byType` was counted over `usable`,
    // so the chosen type must be filled from it too.
    const s = usable.find((x) => x.type === t)!;
    remaining.splice(remaining.indexOf(s), 1);
    for (const k of opts?.gated?.get(s) ?? []) seen.add(k);
    selRun = SELECTION.has(s.type) ? (last && SELECTION.has(last) ? selRun + 1 : 1) : 0;
    last = s.type;
    out.push(s);
  }
  return out;
}

/**
 * Post-pass adjacency repair: the greedy interleaver + translate deferral
 * can strand two same-type steps at the tail (six deferred translates,
 * 2026-07-24). Swap the later duplicate with the nearest earlier step
 * whose move breaks the pair without creating a new one. Deferral is
 * soft, adjacency is hard — one translate drifting earlier is the price.
 *
 * `ok` VETOES a swap that would break a teach-first gate. Without it this
 * pass and the interleaver fight over the same ordering (the oscillating
 * 6↔30 failure counts of the `enforceIntroFirst` experiment): precedence is
 * decided once, in the interleaver, and repair may only move within it.
 */
function repairAdjacency(
  seq: LessonStep[],
  floor: number,
  ok: (seq: LessonStep[]) => boolean = () => true,
): void {
  for (let pass = 0; pass < 6; pass++) {
    const before = sequenceCost(seq, floor);
    if (before === 0) return;
    let improved = false;
    search: for (let i = floor + 1; i < seq.length; i++) {
      if (seq[i].type !== seq[i - 1].type) continue;
      // The transform ramp is LEGALLY consecutive (capped at 3 by the guard).
      if (seq[i].type === "conjugation_transform") continue;
      // Try relocating EITHER member of the offending pair. The old pass
      // only ever moved the later one, which deadlocks when that one is
      // immovable (the challenge step, pinned to its stretch window).
      for (const victim of [i, i - 1]) {
        if (victim <= floor) continue;
        for (let j = seq.length - 1; j > floor; j--) {
          if (j === victim) continue;
          [seq[victim], seq[j]] = [seq[j], seq[victim]];
          if (sequenceCost(seq, floor) < before && ok(seq)) {
            improved = true;
            break search;
          }
          [seq[victim], seq[j]] = [seq[j], seq[victim]];
        }
      }
    }
    // STRICT improvement only: the cost is monotone non-increasing, so this
    // terminates and cannot oscillate. (The `enforceIntroFirst` experiment
    // swung between 6 and 30 failures because three passes each optimized a
    // different objective with no shared cost function.)
    if (!improved) return;
  }
}

/** Hard ordering-bar violations in `seq` past `floor`: adjacent same-type
 *  steps plus selection-tap runs longer than 2. One number for the repair
 *  pass to descend — the guard checks both, so repairing one by creating
 *  the other is not progress. */
function sequenceCost(seq: LessonStep[], floor: number): number {
  let cost = 0;
  let selRun = 0;
  for (let i = 0; i < seq.length; i++) {
    if (
      i > floor &&
      i > 0 &&
      seq[i].type === seq[i - 1].type &&
      seq[i].type !== "conjugation_transform"
    )
      cost++;
    selRun = SELECTION.has(seq[i].type) ? selRun + 1 : 0;
    if (selRun > 2) cost++;
  }
  return cost;
}

/** Inv 26: the challenge step stays in the stretch window. `seq` here has
 *  not had the closing match grid pushed yet, so the final length is
 *  `seq.length + 1` — the guard's window is [len-8, len-3). */
function challengeInWindow(seq: LessonStep[], capstone: LessonStep | null): boolean {
  if (!capstone) return true;
  const idx = seq.indexOf(capstone);
  if (idx < 0) return true;
  const len = seq.length + 1;
  return idx >= len - 8 && idx < len - 2;
}

/** Insert the capstone in the stretch window [N-8, N-3] (N = final length),
 *  preferring a slot whose neighbours differ in type (no adjacency). */
function placeCapstone(steps: LessonStep[], capstone: LessonStep, ruleCount: number): void {
  const N = steps.length + 2; // + capstone + match
  const lo = Math.max(N - 8, ruleCount);
  const hi = Math.min(N - 3, steps.length);
  for (let p = hi; p >= lo; p--) {
    const before = steps[p - 1]?.type;
    const after = steps[p]?.type; // undefined at end → match (match_pairs) follows, always differs
    if (before !== capstone.type && (after === undefined || after !== capstone.type)) {
      steps.splice(p, 0, capstone);
      return;
    }
  }
  steps.splice(Math.min(hi, steps.length), 0, capstone);
}

function tryVocabMcq(id: string, target: Atom, distractorPool: Atom[]): LessonStep | null {
  try {
    return vocabMcq(id, target as never, distractorPool as never);
  } catch {
    return null;
  }
}

/** MCQ factories throw on a thin distractor pool; filler must degrade to the
 *  next rotation entry rather than fail the compile. */
function safeStep(make: () => LessonStep): LessonStep | null {
  try {
    return make();
  } catch {
    return null;
  }
}

function reviewFiller(
  lid: string,
  i: number,
  pool: Atom[],
  declaredPool: Atom[],
  noTyped: ReadonlySet<string>,
  sentences: { ja: string; en: string }[],
  used: Set<string>,
): LessonStep | null {
  // Particles are never filler (mic-grading a mora is ASR noise; typing に
  // from a gloss is a guessing game), glosses are the SHORT form, and no typed
  // recall of this lesson's own new atoms.
  //
  // 2026-07-26 (Spencer): the old body alternated speaking/translate on
  // unrelated pool words, which pushed translate to ~30% of production and
  // padded lessons with vocabulary the lesson wasn't about. It now rotates and
  // prefers re-presenting THIS LESSON'S sentences in a modality they weren't
  // authored in, using sibling sentences as distractors — no extra authoring.
  // Filler is REVIEW of prior material. It must never touch a word this
  // lesson introduces: filler is interleaved, so an MCQ/speaking filler on a
  // brand-new word lands before that word's real (intro-capable) debut and
  // the learner meets it first as a wrong answer. `noTyped` is exactly this
  // lesson's new atoms + their conjugations.
  // Character names are known but are not vocabulary — たなか sitting among
  // みせ/いえ as a "Pick the word for …" option is an odd-one-out cue, not a
  // distractor.
  const usable = pool.filter(
    (p) =>
      !PARTICLES.includes(p.kana) &&
      !noTyped.has(p.kana) &&
      !NAMES.includes(p.kana) &&
      !BOUND.includes(p.kana),
  );
  // `fallback` feeds the same filler slots, so it needs the same exclusion —
  // filtering only `usable` would just move the bad step to the modules whose
  // pool is thin enough to fall through.
  const fallback = declaredPool.filter(
    (p) => !noTyped.has(p.kana) && !BOUND.includes(p.kana),
  );
  /**
   * The first atom this lesson has not already drilled in THIS modality.
   * `usable[i % usable.length]` alone re-asked the same word as soon as the
   * slot index wrapped past the pool size — "Pick the word for 'person'" five
   * times in one m10 lesson, and twelve quieter ×2 repeats elsewhere.
   */
  // Dedupe on the GLOSS as well as the kana: この and その both render as
  // "Pick the word for "that"", so a kana-only check let m6-neo-7 ask the
  // identical question twice with different right answers.
  // Key on `meaningEn`, which is what the PROMPT renders — not on
  // matchTileGloss, whose shortGloss can differ for two atoms that print the
  // same question.
  const usedKey = (tag: string, a: Atom) =>
    `${tag}:${a.kana}|${tag}g:${a.meaningEn}`;
  const pickAtom = (tag: string): Atom | null => {
    for (const source of [usable, fallback]) {
      for (let k = 0; k < source.length; k++) {
        const cand = source[(i + k) % source.length];
        if (!cand) continue;
        if (usedKey(tag, cand).split("|").some((key) => used.has(key))) continue;
        return cand;
      }
    }
    return null;
  };

  const uniq = sentences.filter(
    (x, ix, arr) =>
      x.ja &&
      x.en &&
      // >=3 chunks = real sentence context; a 2-token surface reads as
      // word-level to the M5+ sentence-first ratchet (invariant 19).
      x.ja.trim().split(/[\s\u3000]+/).length >= 3 &&
      arr.findIndex((y) => y.ja === x.ja) === ix,
  );
  const sentenceComp = (): LessonStep | null => {
    if (uniq.length < 4) return null;
    // `uniq[i % uniq.length]` alone re-asked the SAME audio with the same four
    // options merely reordered once the filler index wrapped (m11 review-1 slots
    // 0 and 4), while a sentence the lesson had authored never got checked at
    // all. Comprehension-check each sentence at most once per lesson and let the
    // rotation move on when they are spent.
    for (let k = 0; k < uniq.length; k++) {
      const pick = uniq[(i + k) % uniq.length];
      if (used.has(`comp:${pick.ja}`)) continue;
      const others = uniq.filter((x) => x.ja !== pick.ja);
      if (others.length < 3) return null;
      const d = [0, 1, 2].map((n) => others[(i + n) % others.length]);
      if (new Set(d.map((x) => x.en)).size < 3) continue;
      used.add(`comp:${pick.ja}`);
      return listeningCompSentence({
        id: `${lid}-fill-${i}`,
        audioText: pick.ja,
        correctMeaningEn: pick.en,
        distractorsEn: [d[0].en, d[1].en, d[2].en],
      });
    }
    return null;
  };

  // NB: word_image_mcq is FIRST-EXPOSURE ONLY, and a full-sentence MCQ is
  // TEST-OUT ONLY (invariant 28) — neither belongs in filler.
  // Each entry reports the key it consumed so the loop can mark it ONLY when
  // the step actually materialized — several of these can still come back null.
  const rotation: (() => [LessonStep | null, string])[] = [
    () => [sentenceComp(), ""],
    () => {
      const a = pickAtom("mcq");
      return [
        a
          ? safeStep(() =>
              translationMcq(`${lid}-fill-${i}`, a as ReviewAtom, declaredPool as ReviewAtom[]),
            )
          : null,
        a ? usedKey("mcq", a) : "",
      ];
    },
    () => {
      const a = pickAtom("say");
      return [
        a ? speaking(`${lid}-fill-${i}`, a.kana, matchTileGloss(a), [a.kana]) : null,
        a ? usedKey("say", a) : "",
      ];
    },
    // WORD-LEVEL RECALL IS ALWAYS MULTIPLE CHOICE (Spencer 2026-07-28).
    // This slot used to emit a typed `translateStep` from a bare gloss — the
    // prompt was literally "to come" and the answer くる. Typing is the
    // strongest retrieval tier in the codebase and it belongs to whole
    // utterances; spending it on one dictionary word asks the learner to
    // free-recall a spelling with no sentence to place it in, which is the
    // same objection that killed the ungraded type-tease card (2026-07-24)
    // and single-tile builds (2026-07-17). Recognition of a single word is
    // still worth drilling — so the slot keeps its atom and its rotation
    // position and asks the same question as a tap instead of a type.
    //
    // It shares the "mcq" dedupe tag with the slot two up ON PURPOSE: two
    // slots drawing from one namespace means the second one picks the next
    // unused word, where a private tag would happily ask about the same word
    // twice. And it is `translationMcq`, not `audioMeaningMcq` — a word-level
    // `listening_comprehension` is exactly what the M5+ sentence-first
    // ratchet (§4b) bans, and `listeningGranularity.test.ts` catches it.
    () => {
      const a = pickAtom("mcq");
      return [
        a
          ? safeStep(() =>
              translationMcq(`${lid}-fill-${i}`, a as ReviewAtom, declaredPool as ReviewAtom[]),
            )
          : null,
        a ? usedKey("mcq", a) : "",
      ];
    },
  ];
  for (let k = 0; k < rotation.length; k++) {
    const [step, key] = rotation[(i + k) % rotation.length]();
    if (step) {
      for (const part of key.split("|")) if (part) used.add(part);
      return step;
    }
  }
  return null;
}

// ── diagnostics (author ⇄ compiler feedback) ─────────────────────────────────
export function diagnoseModule(ir: ModuleIR): Diagnostic[] {
  const out: Diagnostic[] = [];
  const gpById = new Map((ir.grammarPoints ?? []).map((g) => [g.id, g]));
  // Buildability gate (Spencer 2026-07-23: an unbuildable build step
  // shipped — tokens crossed a word boundary). Every sentence surface must
  // tokenize into KNOWN units only (atoms/particles/names/interjections);
  // an unknown fragment means the tile bank cannot spell the sentence.
  const atoms = atomIndex(ir);
  const tokenize = makeTokenizer(atoms);
  const KNOWN = new Set([
    ...atoms.keys(),
    ...PARTICLES,
    ...NAMES,
    ...INTERJ,
    ...STEMS,
    ...COPULA,
    ...POLITE_ENDINGS,
  ]);
  for (const lesson of ir.lessons) {
    for (const b of lesson.beats) {
      if (b.kind !== "sentence" && b.kind !== "capstone" && b.kind !== "challenge")
        continue;
      // A tile may carry the sentence boundary it ends (「です。」); the mark is
      // punctuation, not part of the word being checked for buildability.
      const alien = tokenize(b.ja)
        .map((t) => t.replace(/[。？！]$/, ""))
        .filter((t) => !KNOWN.has(t));
      if (alien.length > 0)
        out.push({
          lesson: lesson.id,
          kind: "unbuildable",
          detail: `"${b.ja}" tokenizes to unknown fragment(s) ${alien.join("・")} — the tile bank cannot spell this sentence; fix the surface or teach the missing atom`,
        });
    }
  }
  // TWO LESSONS MAY NOT OPEN WITH THE SAME CARD.
  //
  // A lesson's rule card IS its teaching. When a second lesson points at a
  // card written for the first, that lesson's own rule is never stated
  // anywhere in the course — and it looks fine from every angle except a
  // learner's: the module compiles, the lesson has a card, the card is about
  // roughly the right topic. Spencer's learner walk (2026-07-27) found ten
  // of these across m7–m14, each lesson titled after the exact thing its
  // card fails to explain ("Names carry register too — さん, さま, くん, ちゃん"
  // opening with the audience card, which never mentions an honorific).
  //
  // `reteach: true` is the honest opt-out for a lesson that deliberately
  // re-shows a card as review.
  {
    const cardOwner = new Map<string, string>();
    for (const lesson of ir.lessons) {
      for (const b of lesson.beats) {
        if (b.kind !== "rule" || b.reteach) continue;
        const gp = resolveGrammarPoint(ir, b);
        if (!gp) continue;
        const key = `${gp.id}${gp.variant ? `/${gp.variant}` : ""}`;
        const first = cardOwner.get(key);
        if (first === undefined) cardOwner.set(key, lesson.id);
        else
          out.push({
            lesson: lesson.id,
            kind: "provenance",
            detail:
              `opens with the card "${key}" already used by ${first} — "${lesson.title ?? lesson.id}" ` +
              `never states its own rule. Write a card for it (same id, new \`variant\`), or mark the beat \`reteach: true\` if it really is review`,
          });
      }
    }
  }
  // Image-debut invariant (Spencer 2026-07-23): the word_image_mcq is a
  // word's FIRST-EVER appearance, and it never repeats. Checked on the
  // COMPILED module: (a) no word is the correct answer of >1 image MCQ;
  // (b) an imageable introduced word's first surfaced step is its debut
  // MCQ. Distractor/grading fields are excluded from "appearance".
  {
    const compiled = compileModule(ir);
    const mcqSeen = new Map<string, string>();
    const introduced = new Set(
      (ir.newAtoms ?? [])
        .filter((a) => a.imageable !== false && atoms.get(a.kana)?.emoji)
        .map((a) => a.kana),
    );
    const firstAppearance = new Map<string, { stepId: string; type: string }>();
    for (const lesson of compiled) {
      for (const step of lesson.steps as Array<Record<string, unknown>>) {
        if (step.type === "word_image_mcq") {
          const opts = step.options as Array<{ id: string; word: string }>;
          const word = opts.find((o) => o.id === step.correctOptionId)?.word;
          if (word) {
            const prior = mcqSeen.get(word);
            if (prior)
              out.push({
                lesson: lesson.id,
                kind: "image-debut",
                detail: `${word} gets a SECOND image MCQ (${step.id}; first was ${prior}) — the picture quiz is first-exposure only, use speaking/translate for review`,
              });
            else mcqSeen.set(word, step.id as string);
          }
        }
        // TOKENIZE, never substring-match: `いま` is a substring of
        // `かいます`, so `JSON.stringify(step).includes(kana)` reported いま
        // debuting in a lesson that only ever says かいます. Same longest-
        // match tokenizer the guard uses, over the same kana-only display
        // projection.
        const surfaced = new Set(
          jaSurfaces(step as unknown as LessonStep).flatMap(tokenize),
        );
        for (const kana of introduced) {
          if (!firstAppearance.has(kana) && surfaced.has(kana))
            firstAppearance.set(kana, {
              stepId: step.id as string,
              type: step.type as string,
            });
        }
      }
    }
    for (const [kana, first] of firstAppearance) {
      if (first.type !== "word_image_mcq")
        out.push({
          lesson: ir.module,
          kind: "image-debut",
          detail: `imageable word ${kana} first appears on ${first.type} (${first.stepId}) — its image MCQ must be the first-ever appearance`,
        });
    }
  }

  const baseGlossOf = (kana: string): string | null => {
    const irAtom = (ir.newAtoms ?? []).find((n) => n.kana === kana);
    if (irAtom) return `${irAtom.shortGloss ?? ""} ${irAtom.gloss}`;
    // Same resolved map as everywhere else — a `.find()` over the raw list is
    // a third, independently-ordered answer for an ambiguous kana.
    const course = JA_COURSE_ATOMS_BY_KANA.get(kana);
    return course ? `${course.shortGloss ?? ""} ${course.meaningEn}` : null;
  };
  for (const a of ir.newAtoms ?? []) {
    const tile = a.shortGloss ?? a.gloss.split(/[/,;]/)[0].trim();
    if (tile.length > 28)
      out.push({
        lesson: ir.module,
        kind: "gloss-long",
        detail: `${a.kana} match-tile gloss "${tile}" is ${tile.length} chars even after first-segment split — add a shortGloss (≤28 chars)`,
      });
    // Base ⇄ derived sense consistency (Spencer m6 walk 2026-07-23: みる
    // "to see" beside みない "won't watch" reads as two different verbs).
    // The derived tile's content words, negation stripped, must appear in
    // the base atom's gloss.
    //
    // NARROWED 2026-07-27 (m28), with the evidence dumped first. The strip
    // list was NEGATION only, because until m28 every derived form in the
    // course was a negative. m28's must-forms add a MODAL to the gloss the
    // same way ない adds a negation — 「いかなきゃ」 is "gotta go" — and the
    // guard fired on いかなきゃ / しなきゃ / いかなくちゃ for a reason that has
    // nothing to do with sense: after the `length > 2` stopword filter,
    // "gotta go" keeps only "gotta" and "gotta do" only "gotta", because
    // *go* and *do* are two letters. m6's 「いかない」 ("won't go") passes
    // this check ONLY because its content list comes out EMPTY once "won't"
    // is stripped — i.e. the negation strip is what makes short verbs work,
    // and the modal strip is the same fix for the same reason. The guard
    // still bites: 「たべなきゃ」 "gotta eat" keeps "eat" and 「おぼえなきゃ」
    // "gotta learn" keeps "learn", so a must-form glossed against the wrong
    // base is still caught. Narrowed, never deleted — and narrowed to the two
    // words that are MODALS and nothing else: a first attempt that also
    // stripped "have" immediately broke m16's なかった ("didn't have" against
    // ある "to have"), which is the guard working exactly as intended.
    if (a.derivedFrom) {
      const base = baseGlossOf(a.derivedFrom);
      if (base) {
        const content = tile
          .toLowerCase()
          .replace(/\b(won't|don't|doesn't|isn't|aren't|not|no|there)\b/g, " ")
          .replace(/\b(gotta|must)\b/g, " ")
          .replace(/[^a-z']+/g, " ")
          .split(/\s+/)
          .filter((w) => w.length > 2);
        if (content.length > 0 && !content.some((w) => base.toLowerCase().includes(w)))
          out.push({
            lesson: ir.module,
            kind: "gloss-mismatch",
            detail: `${a.kana} tile gloss "${tile}" shares no content word with base ${a.derivedFrom} gloss "${base.trim()}" — align the sense (shortGloss on either side)`,
          });
      }
    }
  }
  // ── Grammar-point tagging (`exercises:` / `combines:`) ───────────────
  // Known ids = taught here + declared as prior-module. Everything else is
  // a typo that used to pass silently (the old validation covered only
  // `kind: rule` beats).
  const knownPoints = new Set([
    ...(ir.grammarPoints ?? []).map((g) => g.id),
    ...(ir.priorGrammarPoints ?? []),
  ]);
  const pointsOf = (b: IRBeat): string[] =>
    b.kind === "sentence" || b.kind === "capstone" || b.kind === "challenge"
      ? [...(b.exercises ?? []), ...(b.combines ?? [])]
      : [];
  const seenCombos = new Set<string>();
  const comboKey = (pts: string[]) => [...new Set(pts)].sort().join("+");
  for (const lesson of ir.lessons) {
    for (const beat of lesson.beats) {
      const pts = pointsOf(beat);
      for (const p of pts)
        if (!knownPoints.has(p))
          out.push({
            lesson: lesson.id,
            kind: "unknown-grammar-point",
            detail: `exercises/combines names "${p}", which is neither in grammarPoints[] nor priorGrammarPoints[] — fix the typo or declare it`,
          });
      // Inv 26: a challenge beat must present a combination not already
      // drilled. Exact-set repeats are longer-but-familiar, not a stretch.
      if (beat.kind === "capstone" || beat.kind === "challenge") {
        if (pts.length < 3)
          out.push({
            lesson: lesson.id,
            kind: "challenge-not-novel",
            detail: `challenge beat combines ${pts.length} grammar point(s); invariant 26 wants ≥3`,
          });
        else if (seenCombos.has(comboKey(pts)))
          out.push({
            lesson: lesson.id,
            kind: "challenge-not-novel",
            detail: `challenge combination [${comboKey(pts)}] already appeared earlier in this module — vary the shape`,
          });
      }
      if (pts.length) seenCombos.add(comboKey(pts));
    }
  }
  for (const lesson of ir.lessons) {
    const buildable = lesson.beats.filter(
      (b) => b.kind === "sentence" || b.kind === "particle-cloze" || b.kind === "dialogue",
    ).length;
    if (buildable < 6 && !lesson.id.endsWith("-12"))
      out.push({
        lesson: lesson.id,
        kind: "density-short",
        detail: `${buildable} practice beats — compiler pads review to reach 18, but authored practice reads better`,
      });
    // Review lessons carry no challenge beat by design. Prefer the explicit
    // `role:` field; fall back to the legacy id-suffix sniff for m6-era IR.
    const declaredReview =
      lesson.role === "review" ||
      (lesson.role === undefined && lesson.id.endsWith("-12"));
    if (
      !lesson.beats.some((b) => b.kind === "capstone" || b.kind === "challenge") &&
      !declaredReview
    )
      out.push({
        lesson: lesson.id,
        kind: "capstone-missing",
        detail: "no challenge beat (kind: challenge)",
      });
    for (const b of lesson.beats) {
      if (b.kind === "dialogue")
        for (const q of b.questions)
          if (q.options.filter((o) => o !== q.answer).length < 3)
            out.push({
              lesson: lesson.id,
              kind: "dialogue-distractor-synth",
              detail: `question "${q.q}" has <3 real distractors — compiler synthesized fillers; supply 3 real ones`,
            });
      if (b.kind === "rule" && !gpById.has(b.grammarPointId))
        out.push({ lesson: lesson.id, kind: "provenance", detail: `unknown grammarPointId ${b.grammarPointId}` });
      // An id that names several cards must say WHICH. Silently taking one of
      // them is how m6 shipped two lessons showing the wrong rule.
      else if (b.kind === "rule" && !resolveGrammarPoint(ir, b) && !b.reteach)
        out.push({
          lesson: lesson.id,
          kind: "provenance",
          detail:
            `grammarPointId ${b.grammarPointId} names ${(ir.grammarPoints ?? []).filter((g) => g.id === b.grammarPointId).length} cards — ` +
            `the beat must pick one with \`classes\`, or the lesson renders whichever the module happened to list last`,
        });
    }
  }
  return out;
}
