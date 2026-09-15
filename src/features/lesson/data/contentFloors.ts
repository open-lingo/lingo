/**
 * CONTENT FLOORS — the three selection/authoring floors Spencer gave verbatim
 * on 2026-09-15 (`docs/spencer-product-sentiment.md`, Topic 3), after seven
 * TestFlight items (#90 #91 #116 #129 #135 #138 #139) turned out to share one
 * root cause: *the selection and authoring code has no floors*
 * (`docs/user-feedback/2026-09-15-recurring-complaints-rca.md` §2.4 — the only
 * recurring class in the matrix with ZERO fix commits).
 *
 * The rules, in his words:
 *
 *  1. **Answer length.** "5 tiles in the answer, and yeah m11 is good for a
 *     cutoff — at LEAST 5 tiles in the answer in anything after m11." (#139)
 *     The floor is on the ANSWER, not the bank.
 *  2. **Sentence-reuse spacing.** "one sentence should NEVER be less than two
 *     steps between re-uses even if the step type is different, and ideally we
 *     keep the space greater than 2 steps where we can." (#138 #135 #129)
 *  3. **Review window.** A six-module look-back for in-lesson review and
 *     filler pools, "unless the word is due": "yeah that should be perfect and
 *     THEN we can add half of the lesson as fsrs seeded reviews, the same way
 *     we do the review lesson tails, so half recent things, half fsrs
 *     learnings." (#91 #116)
 *
 * This module holds the PREDICATES and the KEY FUNCTIONS only — one definition
 * each, shared by the compiler, the render-time passes, the test-out sampler
 * and the gates. That is deliberate: every recurrence in §2 of the RCA is a
 * rule that was re-derived per surface and drifted. A floor that each consumer
 * spells for itself is not a floor.
 */
import type { LessonStep } from "../types";
import type { JapaneseAnnotation } from "@/shared/japanese/types";

// ── Rule 1: answer length ───────────────────────────────────────────────────

/** Minimum ANSWER tiles (correctOrder tokens) on a sentence build. */
export const ANSWER_TILE_FLOOR = 5;

/**
 * First module the floor binds in. Spencer: "m11 is good for a cutoff … in
 * anything after m11" — so m12 up. Below it a three-tile sentence is the
 * lesson (m6 これはかばんだ), not a defect.
 */
export const ANSWER_FLOOR_FIRST_MODULE = 12;

export type SentenceBuildStep = LessonStep & {
  type: "build_sentence" | "listening_build";
  correctOrder: string[];
  tiles: string[];
  granularity: "word" | "character";
  targetSentence: string;
  picker?: boolean;
};

/**
 * Is this step a SENTENCE build — the shape Rule 1 is about?
 *
 * Three exclusions, each because the step is not a sentence:
 *  - `granularity: "character"` — kana/kanji decoding drills assemble one WORD
 *    from glyphs (m1/m2 and the katakana rows). Script acquisition, not
 *    sentence production; the same carve-out `buildTileFloor.isPaddableStep`
 *    makes for the same reason.
 *  - `picker: true` — the register ladder compiles to a build_sentence whose
 *    tiles are whole competing utterances and whose answer is one tile
 *    (see `BuildSentenceStep.picker`). One tile IS the correct shape there.
 *  - a single-token answer — the MCQ-shaped single-answer picker
 *    (`isSingleAnswerPicker`), i.e. a word build. Counted separately by the
 *    gate so the exclusion stays visible rather than silent.
 */
export function isSentenceBuildStep(step: LessonStep): step is SentenceBuildStep {
  if (step.type !== "build_sentence" && step.type !== "listening_build") return false;
  const s = step as SentenceBuildStep;
  if (s.granularity !== "word") return false;
  if (s.picker === true) return false;
  return (s.correctOrder?.length ?? 0) >= 2;
}

/** Answer tiles = correctOrder tokens (bunsetsu tiles), never bank tiles. */
export function answerTileCount(step: SentenceBuildStep): number {
  return step.correctOrder.length;
}

/** Module index from a bare curriculum id (`m33` → 33; -1 for m1kata etc). */
export function moduleIndexOf(moduleId: string): number {
  const m = /^m(\d+)$/.exec(moduleId);
  return m ? parseInt(m[1], 10) : -1;
}

/** Does Rule 1 bind on a step in this module? */
export function answerFloorApplies(moduleId: string): boolean {
  const n = moduleIndexOf(moduleId);
  return n >= ANSWER_FLOOR_FIRST_MODULE;
}

// ── Rule 2: sentence-reuse spacing ──────────────────────────────────────────

/**
 * Required index distance between two steps that ask the same sentence.
 * Spencer: "NEVER be less than two steps between re-uses" → the two
 * occurrences must sit at least 3 indices apart (two other steps in between).
 * Distance 3 exactly is the "ideally … greater than 2" case: reported SOFT.
 */
export const SENTENCE_REUSE_MIN_GAP = 3;

/** Distance at which a reuse is still legal but flagged as a soft warning. */
export const SENTENCE_REUSE_SOFT_GAP = 3;

/** Sentence-final and clause punctuation, plus every space form. */
const SENTENCE_PUNCT = /[\s　。、，,？?！!「」『』（）()・…~〜]/g;

/**
 * Canonical comparison key for a Japanese sentence.
 *
 * Folded on purpose:
 *  - whitespace — the IR authors bunsetsu boundaries as spaces, the tiles do
 *    not, and `targetAnnotation` carries trailing spaces on particle segments;
 *  - punctuation — 「さいふを おとす」 and 「さいふを おとす。」 are one sentence
 *    (the m33 evidence in #129 differs only by the 。 and the step type);
 *  - kanji surface — see `primarySentenceOf`, which reads ANNOTATION READINGS
 *    before raw text, so 電車が でる and でんしゃが でる collapse. That is the
 *    whole point of #138: "I was just asked this question in a different font."
 *
 * NOT folded: reordering. Two different word orders are two different
 * sentences (and one of them may be the point of the step), so the match is
 * exact on the normalised string.
 */
export function normalizeSentenceKey(text: string | undefined | null): string {
  return (text ?? "").replace(SENTENCE_PUNCT, "");
}

function kanaOf(ann: JapaneseAnnotation[] | undefined): string | null {
  if (!Array.isArray(ann) || ann.length === 0) return null;
  return ann.map((a) => a?.reading ?? a?.surface ?? "").join("");
}

const HAS_JA = /[぀-ヿ㐀-鿿ｦ-ﾟ]/;

/**
 * The ONE sentence a step asks about, kana-folded, or "" when the step is not
 * a sentence-level retrieval (word drills, match grids, rule cards, dialogues).
 *
 * `tokens` is how many word tokens that sentence has — a one-token "sentence"
 * (a kana-row build of ねこ, a vocab MCQ) is a WORD and is excluded from Rule 2
 * the same way it is excluded from Rule 1. Multi-sentence steps (dialogue_listen,
 * dialogue_sim) are out of scope: they carry several sentences and no single
 * primary one, so a spacing rule over them would compare the wrong things.
 */
export function primarySentenceOf(step: LessonStep): { key: string; tokens: number } {
  const r = step as unknown as Record<string, unknown>;
  const tok = (s: string): number => s.trim().split(/\s+/).filter(Boolean).length;
  switch (step.type) {
    case "build_sentence":
    case "listening_build": {
      const order = (r.correctOrder as string[] | undefined) ?? [];
      const raw =
        kanaOf(r.targetAnnotation as JapaneseAnnotation[] | undefined) ??
        (r.targetSentence as string | undefined) ??
        order.join(" ");
      return { key: normalizeSentenceKey(raw), tokens: order.length };
    }
    case "particle_cloze": {
      const prompt = (r.prompt as { before?: string; after?: string } | undefined) ?? {};
      const before =
        kanaOf(r.beforeAnnotation as JapaneseAnnotation[] | undefined) ?? prompt.before ?? "";
      const after =
        kanaOf(r.afterAnnotation as JapaneseAnnotation[] | undefined) ?? prompt.after ?? "";
      const raw = `${before}${(r.correctParticle as string | undefined) ?? ""}${after}`;
      return { key: normalizeSentenceKey(raw), tokens: tok(raw) };
    }
    case "conjugation_cloze":
    case "aspect_choice_cloze": {
      const prompt = (r.prompt as { before?: string; after?: string } | undefined) ?? {};
      const raw = `${prompt.before ?? ""}${(r.correctAnswer as string | undefined) ?? ""}${prompt.after ?? ""}`;
      return { key: normalizeSentenceKey(raw), tokens: tok(raw) };
    }
    case "fill_blank": {
      let raw = (r.sentence as string | undefined) ?? "";
      for (const b of (r.blanks as Array<{ correctAnswer?: string }> | undefined) ?? []) {
        raw = raw.replace("___", b.correctAnswer ?? "");
      }
      return { key: normalizeSentenceKey(raw), tokens: tok(raw) };
    }
    case "listening_comprehension": {
      const raw =
        kanaOf(r.transcriptAnnotation as JapaneseAnnotation[] | undefined) ??
        (r.transcript as string | undefined) ??
        (r.audioKey as string | undefined) ??
        "";
      const spoken = (r.transcript as string | undefined) ?? raw;
      return { key: normalizeSentenceKey(raw), tokens: tok(spoken) };
    }
    case "translate": {
      // The JAPANESE side is the sentence, whichever direction the step runs.
      const raw =
        (r.sourceLanguage as string | undefined) === "target"
          ? (kanaOf(r.sourceAnnotation as JapaneseAnnotation[] | undefined) ??
            (r.sourceText as string | undefined) ??
            "")
          : (((r.acceptedAnswers as string[] | undefined) ?? [])[0] ?? "");
      return { key: normalizeSentenceKey(raw), tokens: tok(raw) };
    }
    case "speaking": {
      const raw = (r.targetPhrase as string | undefined) ?? "";
      return { key: normalizeSentenceKey(raw), tokens: tok(raw) };
    }
    case "multiple_choice": {
      // Only a JA PROMPT sentence counts. A translation MCQ's prompt is
      // English ("What is the word for 'a birthday'?") and its options are
      // words — nothing sentence-shaped to space out.
      const audio = (r.promptAudioText as string | undefined) ?? "";
      const raw = audio && HAS_JA.test(audio) ? audio : (r.prompt as string | undefined) ?? "";
      if (!HAS_JA.test(raw)) return { key: "", tokens: 0 };
      return { key: normalizeSentenceKey(raw), tokens: tok(raw) };
    }
    default:
      return { key: "", tokens: 0 };
  }
}

/**
 * Step types that ECHO a sentence rather than ask it back.
 *
 * `speaking` says aloud what the previous step assembled. It is the same
 * sentence, so it is inside the letter of Spencer's rule — but his reports are
 * all about being RE-TESTED ("I was just asked this question in a different
 * font", #138; "the simple version is useless since they just learned it",
 * #135), and saying aloud what you just built is the repo's canonical
 * production ladder (assemble → produce), not a second question. Every
 * remaining build→speaking pair in the course is one of those ladders, all in
 * the hand-written m1–m5 files.
 *
 * So: echo pairs are reported SOFT, never hard, and the interleaver still
 * prefers to space them. Flipping this to hard is a one-line change and a
 * judgment call for Spencer — it is listed as such in the lane report rather
 * than decided here.
 */
export const SENTENCE_REUSE_ECHO_TYPES: ReadonlySet<string> = new Set(["speaking"]);

/** Sentence keys for a step list; "" wherever the step is not sentence-level. */
export function sentenceKeys(steps: readonly LessonStep[]): string[] {
  return steps.map((s) => {
    const { key, tokens } = primarySentenceOf(s);
    return tokens >= 2 ? key : "";
  });
}

export type ReuseViolation = {
  distance: number;
  firstIndex: number;
  secondIndex: number;
  firstId: string;
  firstType: string;
  secondId: string;
  secondType: string;
  sentence: string;
};

/**
 * Every same-sentence pair inside a step list, split at the hard/soft line.
 *
 * HARD  = two non-echo steps closer than `SENTENCE_REUSE_MIN_GAP`.
 * SOFT  = a legal-but-tight pair at exactly `SENTENCE_REUSE_SOFT_GAP`
 *         ("ideally we keep the space greater than 2 steps where we can"),
 *         or any pair involving an echo step (`SENTENCE_REUSE_ECHO_TYPES`).
 *
 * Only the NEAREST later occurrence of each sentence is reported per index —
 * reporting all pairs turns one triple into three findings and the count stops
 * matching what a learner actually walks past.
 */
export function findSentenceReuse(steps: readonly LessonStep[]): {
  hard: ReuseViolation[];
  soft: ReuseViolation[];
} {
  const keys = sentenceKeys(steps);
  const hard: ReuseViolation[] = [];
  const soft: ReuseViolation[] = [];
  for (let i = 0; i < keys.length; i++) {
    if (!keys[i]) continue;
    for (let j = i + 1; j <= i + SENTENCE_REUSE_SOFT_GAP && j < keys.length; j++) {
      if (keys[j] !== keys[i]) continue;
      const rec: ReuseViolation = {
        distance: j - i,
        firstIndex: i,
        secondIndex: j,
        firstId: steps[i].id,
        firstType: steps[i].type,
        secondId: steps[j].id,
        secondType: steps[j].type,
        sentence: keys[i],
      };
      const echo =
        SENTENCE_REUSE_ECHO_TYPES.has(steps[i].type) ||
        SENTENCE_REUSE_ECHO_TYPES.has(steps[j].type);
      if (!echo && j - i < SENTENCE_REUSE_MIN_GAP) hard.push(rec);
      else soft.push(rec);
      break;
    }
  }
  return { hard, soft };
}

// ── Rule 3: review window ───────────────────────────────────────────────────

/**
 * Look-back for review/filler selection, in modules. Spencer on the six-module
 * window: "yeah that should be perfect". An atom outside the window is only
 * legal when its FSRS card is due (`isDue`) — due words may come from anywhere,
 * which is what keeps Anki semantics (#113) intact while killing #91/#116.
 */
export const REVIEW_WINDOW_MODULES = 6;

/**
 * Smallest pool the windowed draw may run on before it widens.
 *
 * Not a softening of the rule — a guard against the failure the window would
 * otherwise reintroduce. m18 declares 3 new atoms; windowed, its filler pool
 * is 7 words, and a pool that small is how `m10-neo-1` once shipped the same
 * "Pick the word for 'person'" MCQ five times in one lesson
 * (`moduleCompiler.usableKana`'s note). Below this floor the window widens one
 * module at a time until it is met — recency is still preferred, it is just
 * not allowed to starve the lesson into repeating itself.
 */
export const REVIEW_POOL_FLOOR = 16;

// ── #90: same-family tiles in one bank ──────────────────────────────────────

/**
 * Do two tile surfaces belong to ONE lexical family — the thing a bank may
 * only offer once?
 *
 * TestFlight #90: a listening-build bank offered うた「歌」(song) AND
 * うたう「歌う」(to sing). Spencer: "This is a weird sentence, double uta aren't
 * necessary no?" Two surfaces of one stem are not two choices; the learner
 * reads the stem twice and the distractor tests okurigana trivia instead of
 * the sentence.
 *
 * The test is STRICT PREFIX with a bounded tail: one surface extends the
 * other by 1–2 kana, and the shared stem is ≥2 kana. That is exactly the #90
 * shape (うた ⊂ うたう) and it also catches はな ⊂ はなす, かえ ⊂ かえる,
 * ほん ⊂ ほんとう.
 *
 * What it deliberately does NOT collapse:
 *  - たべる / たべた — neither is a prefix of the other. Two inflections offered
 *    against each other is a TENSE contrast a module may be teaching, not a
 *    duplicated stem, and a stem-stripping key would have banned it.
 *  - き ⊂ きく, か ⊂ かう — a one-kana stem is noise, not a family.
 *  - Particles (single kana), which the contrast pairs in `jaSiblingSets`
 *    own and which this rule must never touch.
 *
 * A surface heuristic on purpose: `derivedFrom` exists only on IR atoms, and
 * the offending tile in #90 came from the render-time fill, where the only
 * thing known about a candidate is its kana.
 */
export function sameTileFamily(a: string, b: string): boolean {
  const x = a.trim();
  const y = b.trim();
  if (x === y) return false;
  const [short, long] = x.length <= y.length ? [x, y] : [y, x];
  if (short.length < 2) return false;
  if (long.length - short.length > 2) return false;
  return long.startsWith(short);
}

/**
 * Tiles in `tiles` that share a family with the answer or with an EARLIER
 * tile. An answer token always wins: 歌う as the answer is legal, 歌 beside
 * it is not.
 */
export function bankFamilyCollisions(
  tiles: readonly string[],
  answer: readonly string[],
): Array<{ tile: string; clashesWith: string }> {
  const answerSet = new Set(answer);
  const kept: string[] = [...answer];
  const out: Array<{ tile: string; clashesWith: string }> = [];
  for (const t of tiles) {
    if (answerSet.has(t)) continue;
    const clash = kept.find((k) => sameTileFamily(k, t));
    if (clash !== undefined) {
      out.push({ tile: t, clashesWith: clash });
      continue;
    }
    kept.push(t);
  }
  return out;
}
