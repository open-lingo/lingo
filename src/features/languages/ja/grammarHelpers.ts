/**
 * Shared factories for the JA M3-M7 grammar-spine modules (2026-05-16).
 *
 * Tightens repetition across the 5 newly authored modules + review pools.
 * No new step types — only thin wrappers over the existing primitives so
 * call sites stay readable.
 */
import type {
  BuildSentenceStep,
  ConjugationClozeStep,
  ConjugationTransformStep,
  DialogueListenStep,
  GrammarRuleStep,
  GrammarExample,
  InfoStep,
  KanjiReadingStep,
  LessonStep,
  ListeningBuildStep,
  ListeningComprehensionStep,
  MatchPairsStep,
  MultipleChoiceStep,
  ParticleClozeStep,
  PhraseCardStep,
  SelfExplanationMcqStep,
  SelfExplanationOption,
  SpeakingStep,
  TranslateStep,
  WordImageMcqStep,
} from "@/features/lesson/types";
import type { JapaneseAnnotation } from "@/shared/japanese/types";
import {
  JA_COURSE_ATOMS,
  JA_COURSE_ATOMS_BY_KANA,
} from "@/features/languages/ja/courseAtoms";
import { withoutMcqBlocked as sharedWithoutMcqBlocked } from "@/shared/lessonAuthoring/imageMcqBlocklist";
import { isKana } from "@/shared/japanese/kanaTable";
import { KANJI_ELIGIBLE_ATOMS } from "./secondScript/applyKanjiSurfaces";
import { readingDistractors } from "./secondScript/readingDistractors";
import { annotateJapaneseText } from "./romajiLexicon";
import { VERB_ENTRIES, ADJ_ENTRIES, type VerbGroup } from "./conjugationTables";
import {
  conjugateVerb,
  conjugateIAdj,
  CHAIN_FORM_LABELS,
  IADJ_FORM_LABELS,
  type ChainForm,
  type IAdjForm,
} from "./conjugationEngine";
// PURE leaf module (not trainerSession — its SRS chain closes an import
// cycle back into the curriculum through the language registry).
import {
  generateFormationDistractors,
  transformDrillDistractors,
  transformDrillIAdjDistractors,
} from "./conjugation/formationDistractors";

/**
 * Resolve a course atom ID from a phrase_card's kana. Used by the `phrase()`
 * and `vocab()` factories so the passive-card followup lint
 * (assertPassiveCardsHaveFollowup) can verify that every vocab teach card has
 * a same-atom retrieval in the [i+2, i+3] window. Returns undefined when the
 * kana isn't a known atom (e.g. multi-word phrases like "irasshaimase") — in
 * which case the lint falls back to the weaker "any graded follow-up" check.
 */
function resolvePhraseAtomId(kana: string): string | undefined {
  return JA_COURSE_ATOMS_BY_KANA.get(kana)?.id;
}

/**
 * Resolve a list of kana strings to course-atom IDs for the
 * `StepBase.exercisedAtoms` SRS-grading field. Unknown kana drop out
 * silently — same defensive posture as `resolvePhraseAtomId` for sentence-
 * level factories where authors may pass in particles ("は") or vocab kana
 * mixed together.
 */
function resolveAtomIds(kanas: ReadonlyArray<string> | undefined): string[] {
  if (!kanas?.length) return [];
  const out: string[] = [];
  for (const k of kanas) {
    const id = JA_COURSE_ATOMS_BY_KANA.get(k)?.id;
    if (id) out.push(id);
  }
  return out;
}

/**
 * Resolve a course atom's `{atomId, gloss}` payload from a token's reading.
 * Looked up against `JA_COURSE_ATOMS_BY_KANA`. Returns `{}` when the reading
 * isn't a known atom (so spread into an annotation literal is a no-op for
 * unmatched tokens). Used by every annotation builder below so each
 * `JapaneseAnnotation` automatically carries `atomId + gloss` when its
 * reading matches an atom — the gloss-popover surface reads these directly.
 */
export function resolveAtom(reading: string): { atomId?: string; gloss?: string } {
  const atom = JA_COURSE_ATOMS_BY_KANA.get(reading);
  if (!atom) return {};
  return { atomId: atom.id, gloss: atom.meaningEn };
}

/**
 * Build a single-token annotation from a (surface, reading?) pair, applying
 * `resolveAtom` so the token carries `atomId + gloss` when the reading is a
 * known atom. Shared by the factories that emit single-token annotations.
 */
function buildSingletonAnnotation(
  surface: string,
  reading: string = surface,
): JapaneseAnnotation {
  return { surface, reading, ...resolveAtom(reading) };
}

/**
 * How many course atoms share a given kana surface. Built once. A kana with a
 * count > 1 is a HOMOGRAPH (はな = 花 flower / 鼻 nose; に = 二 two / particle
 * に; はし = 橋 bridge / 箸 chopsticks) — its kana→atom collapse in
 * `JA_COURSE_ATOMS_BY_KANA` is last-write-wins, so trusting it could attach the
 * WRONG atom and render the WRONG kanji. We refuse to attach an atomId to any
 * homograph token (see `resolveEligibleKanjiAtomId`).
 */
let _kanaAtomCount: Map<string, number> | null = null;
function kanaAtomCount(): Map<string, number> {
  if (_kanaAtomCount) return _kanaAtomCount;
  const m = new Map<string, number>();
  for (const a of JA_COURSE_ATOMS) m.set(a.kana, (m.get(a.kana) ?? 0) + 1);
  _kanaAtomCount = m;
  return m;
}

/**
 * Every INFLECTED verb/adjective surface in the conjugation tables (た/て/ない/
 * ます/たい forms + adjective negatives/pasts) — the dictionary form itself is
 * excluded. A noun atom whose kana collides with one of these is a cross-class
 * homograph the segmenter cannot resolve: した is both 下 ("below") and the past
 * of する ("did"); きた is both 北 and the past of くる. Substituting the noun
 * kanji onto the verb reading ships WRONG kanji, so any such atom is barred from
 * sentence substitution (it still reaches kanji via single-atom steps). Derived
 * from the tables so it stays correct as verbs/adjectives are added.
 */
let _reservedInflections: Set<string> | null = null;
function reservedInflections(): Set<string> {
  if (_reservedInflections) return _reservedInflections;
  const s = new Set<string>();
  for (const v of VERB_ENTRIES) {
    for (const [form, surface] of Object.entries(v.forms)) {
      if (form !== "dictionary" && surface) s.add(surface);
    }
  }
  for (const a of ADJ_ENTRIES) {
    for (const [form, surface] of Object.entries(a.forms)) {
      if (form !== "present" && surface) s.add(surface); // present = dictionary
    }
  }
  _reservedInflections = s;
  return s;
}

/** Number kanji (一..十, 百/千/万, 〇/零). Their readings (に, し, よん, ろく, まん,
 *  …) are extremely common substrings of OTHER words and of verb/adjective
 *  inflections (読んで→"よん", ひろく→"ろく", まんが→"まん"), so number atoms are
 *  too slice-prone to substitute inside free-running sentence text. They still
 *  reach kanji via single-atom match / kanji_reading steps — just not here. */
const NUMBER_KANJI_ONLY = /^[一二三四五六七八九十百千万〇零]+$/u;

/**
 * THE CONSERVATIVE ATOM-ID RESOLVER for sentence tokens. Returns an atomId for
 * a token's kana ONLY when substituting its kanji in free sentence text is
 * PROVABLY safe. Every gate below, failing which we return undefined (token
 * stays bare kana; the pass can never put a wrong kanji on it):
 *
 *   1. Non-homographic: exactly ONE course atom carries this kana. A homograph
 *      (はな = 花/鼻, に = 二/particle, はし = 橋/箸) collapses last-write-wins in
 *      `JA_COURSE_ATOMS_BY_KANA` — guessing risks the WRONG kanji, so we refuse.
 *   2. Actually taught: `fromModule !== "future"`. Backlog atoms (e.g. きた 北,
 *      whose kana collides with the past tense 来た of くる) never substitute.
 *   3. Kanji-eligible in the shipped rollout catalog (`KANJI_ELIGIBLE_ATOMS`).
 *   4. Not a pure NUMBER kanji (see `NUMBER_KANJI_ONLY`) — number readings slice
 *      out of inflections/compounds far too easily to trust in running text.
 *   5. Not a verb/adjective inflection surface (`reservedInflections`) — した is
 *      both 下 and する's past, きた both 北 and くる's past; we can't tell which,
 *      so we don't substitute.
 *
 * When all gates pass, exactly one atom carries the kana and its kanji is that
 * surface's unique reading, so the substitution is correct. Anything uncertain
 * stays kana — partial coverage is the safe, intended outcome. Exported for
 * direct testing of the ambiguity rule.
 */
export function resolveEligibleKanjiAtomId(kana: string): string | undefined {
  if ((kanaAtomCount().get(kana) ?? 0) !== 1) return undefined; // homograph → never
  const atom = JA_COURSE_ATOMS_BY_KANA.get(kana);
  if (!atom) return undefined;
  if (atom.fromModule === "future") return undefined; // not taught → don't
  const entry = KANJI_ELIGIBLE_ATOMS.get(atom.id);
  if (!entry) return undefined; // not kanji-eligible
  if (NUMBER_KANJI_ONLY.test(entry.kanji)) return undefined; // slice-prone number
  if (reservedInflections().has(kana)) return undefined; // collides with a verb/adj inflection (した=下/した)
  return atom.id;
}

/**
 * Single-kana particles that may trail a kanji-fied word inside its run WITHOUT
 * risking a bad slice. `と` is deliberately EXCLUDED: it is frequently
 * word-internal (きょうと 京都 → "きょう"+と would slice out 今日 "today"), so a
 * word followed by と is treated as unclean and left bare. The remaining core
 * particles (は/が/を/に/へ/も/の/で/…) attach to content words grammatically and
 * do not create common-noun slices in this corpus.
 */
let _safeTrailingParticles: Set<string> | null = null;
function safeTrailingParticles(): Set<string> {
  if (_safeTrailingParticles) return _safeTrailingParticles;
  _safeTrailingParticles = new Set(
    JA_COURSE_ATOMS.filter(
      (a) =>
        a.kind === "particle" &&
        Array.from(a.kana).length === 1 &&
        a.kana !== "と",
    ).map((a) => a.kana),
  );
  return _safeTrailingParticles;
}

/** A fragment carrying at least one kana (a grouped lexicon word OR a lone
 *  kana). Non-kana fragments (spaces, punctuation, latin) are run separators. */
function isKanaFragment(frag: { text: string }): boolean {
  return Array.from(frag.text).some(isKana);
}

/** A grouped dictionary word: `annotateJapaneseText` only groups spans of ≥2
 *  units, so a `symbols` array marks a real lexicon word (never a slice-orphan). */
function isGroupedWord(frag: { symbols?: string[] }): boolean {
  return frag.symbols !== undefined;
}

/**
 * Build a MULTI-segment `JapaneseAnnotation[]` for a sentence: one segment per
 * word/particle/filler run, carrying an `atomId` (+gloss) ONLY on
 * unambiguously-resolvable, kanji-eligible word tokens (`resolveEligibleKanjiAtomId`).
 * The kanji post-pass (`applyKanjiSurfaces`) then substitutes exactly those
 * tokens once their module unlocks; every other run stays kana. Concatenating
 * the segment surfaces reproduces the input sentence byte-for-byte, so the
 * rendered sentence (and every non-display field, which this never touches) is
 * unchanged below the unlock.
 *
 * Word boundaries come from `annotateJapaneseText` — the SAME kana-aware
 * segmenter `AnnotatedText` already runs at render, so romaji grouping is
 * identical to today's single whole-sentence segment; we only pull the eligible
 * words out into their own segments so the pass has an atomId to key on.
 *
 * SLICE GUARD (critical): the segmenter will happily carve a valid atom out of
 * the MIDDLE of an inflected form — ひろくない (not spacious) yields ろく (六,
 * "six"); よんでいます (読んでいます, "is reading") yields よん (四, "four"). Any
 * such slice ships WRONG kanji. So we work in maximal KANA RUNS (bounded by
 * spaces / punctuation) and kanji-fy a run's word ONLY when the run is
 * unambiguous: it contains EXACTLY ONE dictionary word and every other token in
 * it is a single-kana particle (は/を/に/…). A run with two+ dictionary words
 * (よん+います), or any leftover orphan kana (conjugation stems/okurigana),
 * kanji-fies NOTHING — we can't tell a real word from a lucky slice. Very
 * conservative on purpose: partial coverage (some words kanji, some kana) is the
 * correct, safe outcome the spec mandates. Space-delimited phrases — the norm in
 * these lessons — put each content word in its own run, so real words still land.
 *
 * A whole string that is itself a single atom (a single-word target like
 * コーヒー / まいにち) short-circuits to the historical singleton shape, keeping
 * its atomId + gloss exactly as `buildSingletonAnnotation` produced them.
 */
export function buildSentenceAnnotation(sentence: string): JapaneseAnnotation[] {
  if ((kanaAtomCount().get(sentence) ?? 0) === 1) {
    return [buildSingletonAnnotation(sentence)];
  }
  const fragments = annotateJapaneseText(sentence, true);
  const segments: JapaneseAnnotation[] = [];
  let filler = "";
  const flushFiller = () => {
    if (filler) {
      segments.push({ surface: filler, reading: filler });
      filler = "";
    }
  };
  // Emit one kana run. It is "clean" (eligible to kanji-fy its word) iff it has
  // EXACTLY ONE dictionary word and every other token is a single-kana particle.
  const flushRun = (run: { text: string; symbols?: string[]; reading?: string }[]) => {
    if (run.length === 0) return;
    const parts = safeTrailingParticles();
    const words = run.filter(isGroupedWord);
    const clean =
      words.length === 1 &&
      run.every((f) => isGroupedWord(f) || parts.has(f.text));
    for (const frag of run) {
      if (clean && isGroupedWord(frag) && resolveEligibleKanjiAtomId(frag.text)) {
        flushFiller();
        // Safe: eligible ⇒ exactly one atom for this kana ⇒ resolveAtom is
        // unambiguous. Carries atomId (pass keys on it) + gloss (word popover).
        segments.push({ surface: frag.text, reading: frag.text, ...resolveAtom(frag.text) });
      } else {
        filler += frag.text;
      }
    }
  };
  let run: typeof fragments = [];
  for (const frag of fragments) {
    if (isKanaFragment(frag)) {
      run.push(frag);
    } else {
      flushRun(run);
      run = [];
      filler += frag.text; // separator (space / punctuation) → bare filler
    }
  }
  flushRun(run);
  flushFiller();
  if (segments.length === 0) segments.push(buildSingletonAnnotation(sentence));
  return segments;
}

export function vocab(
  id: string,
  meaningEn: string,
  romaji: string,
  kana: string,
  cultureNote?: string,
  opts?: { atomId?: string; emoji?: string },
): PhraseCardStep {
  const atomId = opts?.atomId ?? resolvePhraseAtomId(kana);
  return {
    id,
    type: "phrase_card",
    meaningEn,
    romaji,
    kana,
    cultureNote,
    ...(atomId ? { atomId } : {}),
    ...(opts?.emoji ? { emoji: opts.emoji } : {}),
  };
}

export function phrase(
  id: string,
  meaningEn: string,
  romaji: string,
  kana: string,
  cultureNote?: string,
  opts?: { atomId?: string; emoji?: string },
): PhraseCardStep {
  const atomId = opts?.atomId ?? resolvePhraseAtomId(kana);
  return {
    id,
    type: "phrase_card",
    meaningEn,
    romaji,
    kana,
    cultureNote,
    ...(atomId ? { atomId } : {}),
    ...(opts?.emoji ? { emoji: opts.emoji } : {}),
  };
}

export function cloze(
  id: string,
  before: string,
  after: string,
  correctParticle: string,
  options: string[],
  meaningEn: string,
  audioText: string,
  explanation?: string,
): ParticleClozeStep {
  // Slot-rotate so the correct particle doesn't always land where the
  // author put it in the options array. Without this, ~83% of cloze
  // sites would render the correct answer in position 0 (per 2026-05-18
  // audit). Authors should still pass distinct options; we just reorder.
  const correctIdx = options.indexOf(correctParticle);
  let rotated = options;
  if (correctIdx === -1) {
    throw new Error(
      `cloze(${id}): correctParticle '${correctParticle}' is not in options [${options.join(", ")}]`,
    );
  }
  const targetSlot = slotFor(id, options.length);
  if (correctIdx !== targetSlot) {
    const without = options.filter((_, i) => i !== correctIdx);
    rotated = [
      ...without.slice(0, targetSlot),
      correctParticle,
      ...without.slice(targetSlot),
    ];
  }
  const particleAtomIds = resolveAtomIds([correctParticle]);
  return {
    id,
    type: "particle_cloze",
    prompt: { before, after },
    correctParticle,
    options: rotated,
    meaningEn,
    audioText,
    explanation,
    exercisedAtoms: particleAtomIds,
    modality: "production",
  };
}

export function build(
  id: string,
  prompt: string,
  target: string,
  tiles: string[],
  correctOrder: string[],
  exercisedAtomKanas?: string[],
): BuildSentenceStep {
  return {
    id,
    type: "build_sentence",
    prompt,
    targetSentence: target,
    tiles,
    correctOrder,
    granularity: "word",
    audioKey: target,
    // Multi-segment: kanji-fies only the sentence's unambiguous eligible words
    // (post-pass); tiles + correctOrder stay KANA (separate fields, grading
    // untouched). See buildSentenceAnnotation.
    targetAnnotation: buildSentenceAnnotation(target),
    exercisedAtoms: resolveAtomIds(exercisedAtomKanas),
    modality: "production",
  };
}

/**
 * Transform build (n4-scoping "sentence_transform"): show a JA source
 * sentence + a short operation chip ("→ casual"), learner assembles the
 * transformed sentence from tiles. A parametrized `build_sentence` — same
 * grading, same guards, same density slot. The prompt must still state the
 * operation in English WITH the register cue (pinned invariant 8), e.g.
 * "Rewrite for a friend:" — the chip is reinforcement, not the only cue.
 */
export function transformBuild(
  id: string,
  prompt: string,
  sourceSentence: string,
  transformLabel: string,
  target: string,
  tiles: string[],
  correctOrder: string[],
  exercisedAtomKanas?: string[],
): BuildSentenceStep {
  return {
    ...build(id, prompt, target, tiles, correctOrder, exercisedAtomKanas),
    sourceSentence,
    sourceAnnotation: buildSentenceAnnotation(sourceSentence),
    transformLabel,
  };
}

export function infoStep(
  id: string,
  title: string,
  body: string,
  variant: InfoStep["variant"] = "default",
): InfoStep {
  return { id, type: "info", title, body, variant };
}

export function grammarRule(opts: {
  id: string;
  title: string;
  rule: string;
  examples: GrammarExample[];
  antiPattern?: GrammarExample & { why: string };
  cultureNote?: string;
  /** Track B grammar-point id this card teaches (see GrammarRuleStep). Passed
   *  through verbatim; omit for cards that don't map cleanly to one point. */
  grammarPointId?: string;
  /** ChainForm id when this card teaches a conjugation (see GrammarRuleStep). */
  conjugationForm?: string;
}): GrammarRuleStep {
  return {
    id: opts.id,
    type: "grammar_rule",
    title: opts.title,
    rule: opts.rule,
    examples: opts.examples,
    antiPattern: opts.antiPattern,
    cultureNote: opts.cultureNote,
    ...(opts.grammarPointId ? { grammarPointId: opts.grammarPointId } : {}),
    ...(opts.conjugationForm ? { conjugationForm: opts.conjugationForm } : {}),
  };
}

export function speaking(
  id: string,
  targetPhrase: string,
  translation: string,
  exercisedAtomKanas?: string[],
): SpeakingStep {
  return {
    id,
    type: "speaking",
    targetPhrase,
    translation,
    // 2026-05-18 (Spencer + tester): was stubbed:true, which meant every
    // M3-M7 dialogue speaking step rendered the legacy "Speech recognition
    // is not yet available / I said it!" placeholder. Whisper + the
    // 2-fail-then-choice flow ship and work for these whole-utterance
    // targets — graduate them to the recognized path. Matches the
    // analogous flip on _consonantRowHelpers.speaking from 2026-05-17.
    stubbed: false,
    audioKey: targetPhrase,
    targetAnnotation: buildSentenceAnnotation(targetPhrase),
    exercisedAtoms: resolveAtomIds(exercisedAtomKanas),
    modality: "production",
  };
}

/**
 * Speaking-target option for the dialogue lesson factory.
 *
 * "representative": one whole-utterance speaking step appended to the
 * dialogue (default for now per Spencer's spec — wait for Whisper
 * sentence-level validation before per-line).
 *
 * "per-line": one speaking step per dialogue line where `speakingPhrase`
 * is non-null. Architectural switch only — turn on later by changing this
 * one arg at the call site.
 */
export type SpeakingTargets = "representative" | "per-line";

export type DialogueLine = {
  speaker: string;
  meaningEn: string;
  romaji: string;
  kana: string;
  cultureNote?: string;
  /** If non-null, available as a speaking target when mode is per-line. */
  speakingPhrase?: string;
};

/**
 * Dialogue lesson factory — composes a phrase-card-per-line dialogue plus
 * a speaking step. Hook for future per-line speaking via `speakingTargets`
 * option.
 */
export function dialogueLesson(opts: {
  idPrefix: string;
  /** Whole-utterance speaking phrase + translation for the representative
   *  mode. Required so that, even in per-line mode, a sane fallback exists
   *  when none of the lines declare `speakingPhrase`. */
  representative: { phrase: string; translation: string };
  lines: DialogueLine[];
  speakingTargets?: SpeakingTargets;
}): (PhraseCardStep | SpeakingStep)[] {
  const mode: SpeakingTargets = opts.speakingTargets ?? "representative";
  const out: (PhraseCardStep | SpeakingStep)[] = [];
  for (let i = 0; i < opts.lines.length; i++) {
    const line = opts.lines[i];
    out.push({
      id: `${opts.idPrefix}-l${i + 1}`,
      type: "phrase_card",
      meaningEn: `${line.speaker}: ${line.meaningEn}`,
      romaji: line.romaji,
      kana: line.kana,
      cultureNote: line.cultureNote,
    });
    if (mode === "per-line" && line.speakingPhrase) {
      out.push(
        speaking(
          `${opts.idPrefix}-l${i + 1}-say`,
          line.speakingPhrase,
          line.meaningEn,
        ),
      );
    }
  }
  if (mode === "representative") {
    out.push(
      speaking(
        `${opts.idPrefix}-say`,
        opts.representative.phrase,
        opts.representative.translation,
      ),
    );
  }
  return out;
}

/**
 * Self-explanation MCQ factory. Authors pass exactly one `rule` option +
 * one `surface` option + one `distractor` option (order at author site is
 * irrelevant — the renderer shuffles per-mount). Helper handles correct-id
 * wiring so call sites don't have to repeat the rule-option's id.
 *
 * Pedagogy: Dunlosky 2013 moderate-utility self-explanation. Use as a
 * follow-up to a committed particle_cloze / multiple_choice in M3+.
 */
export function selfExplain(opts: {
  id: string;
  anchorLabel: string;
  anchorAudioText?: string;
  question: string;
  rule: { text: string };
  surface: { text: string };
  distractor: { text: string };
  ruleExplanation?: string;
}): SelfExplanationMcqStep {
  // Slot-rotate so the rule (correct answer) doesn't always land in
  // position 0 — the 3 sites that show only 3 options would otherwise
  // pattern-match to "always pick first." Per 2026-05-18 audit.
  const base: SelfExplanationOption[] = [
    { id: `${opts.id}-rule`, text: opts.rule.text, reasonType: "rule" },
    { id: `${opts.id}-surface`, text: opts.surface.text, reasonType: "surface" },
    { id: `${opts.id}-distractor`, text: opts.distractor.text, reasonType: "distractor" },
  ];
  const slot = slotFor(opts.id, base.length);
  const options = [...base];
  const correct = options.shift()!;
  options.splice(slot, 0, correct);
  return {
    id: opts.id,
    type: "self_explanation_mcq",
    anchor: {
      label: opts.anchorLabel,
      audioText: opts.anchorAudioText,
    },
    question: opts.question,
    options,
    correctOptionId: `${opts.id}-rule`,
    ruleExplanation: opts.ruleExplanation,
  };
}

/* ────────────────────────────────────────────────────────────────────────
 * M3-M7 rebuild factories (2026-05-18)
 *
 * Added per docs/m3-m7-rebuild-spec-2026-05-18.md §8. These keep the
 * M3-M7 rebuild call sites readable AND enforce the compounding-review
 * + same-answer-cluster contracts the spec mandates.
 * ──────────────────────────────────────────────────────────────────────── */

/** Cumulative atom pool for prior-module review-tail draws. */
export type ReviewAtom = {
  kana: string;
  meaningEn: string;
  emoji?: string;
  fromModule: "m1" | "m2" | "m3" | "m4" | "m5" | "m6" | "m7" | "m8" | "m9" | "m10" | "m11" | "m12" | "m13" | "m14" | "m15" | "m16" | "m17" | "m18" | "m19" | "m20" | "m21" | "m22" | "m23" | "m24" | "m25" | "m26" | "m27" | "m28" | "m29" | "m30";
};

/**
 * Aggregated atom-level vocab from M1 + M2. Curated additive subset for
 * the M3-M7 grammar-spine rebuild — does NOT duplicate every entry in
 * `M1_REVIEW_POOL` (that's a `RowWord[]` for kana-row helpers). Authors
 * extend this constant per module as later modules ship.
 *
 * M1 (vowels + ka/sa/ta/na/ha/ma/ya/ra/wa anchors): traveler-useful
 * nouns the learner has actually built or recognized.
 * M2 (g/z/d/b/p + yōon): anchor words from the dakuten + yōon rows.
 */
export const M3_M7_REVIEW_POOL: ReviewAtom[] = [
  // ── M1 anchors (curated subset; emoji-bearing for visual MCQ) ──
  { kana: "ねこ", meaningEn: "cat",      emoji: "🐱", fromModule: "m1" },
  { kana: "いぬ", meaningEn: "dog",      emoji: "🐕", fromModule: "m1" },
  { kana: "やま", meaningEn: "mountain", emoji: "⛰️", fromModule: "m1" },
  { kana: "かわ", meaningEn: "river",    emoji: "🏞️", fromModule: "m1" },
  { kana: "そら", meaningEn: "sky",      emoji: "☁️", fromModule: "m1" },
  { kana: "つき", meaningEn: "moon",     emoji: "🌙", fromModule: "m1" },
  { kana: "ほし", meaningEn: "star",     emoji: "⭐", fromModule: "m1" },
  { kana: "はな", meaningEn: "flower",   emoji: "🌷", fromModule: "m1" },
  { kana: "うみ", meaningEn: "sea",      emoji: "🌊", fromModule: "m1" },
  { kana: "かい", meaningEn: "shell",    emoji: "🐚", fromModule: "m1" },
  { kana: "かお", meaningEn: "face",     emoji: "😀", fromModule: "m1" },
  { kana: "こえ", meaningEn: "voice",    emoji: "🗣️", fromModule: "m1" },
  { kana: "えき", meaningEn: "station",  emoji: "🚉", fromModule: "m1" },
  { kana: "あさ", meaningEn: "morning",  emoji: "🌅", fromModule: "m1" },
  { kana: "すし", meaningEn: "sushi",    emoji: "🍣", fromModule: "m1" },
  { kana: "ふね", meaningEn: "boat",     emoji: "🚢", fromModule: "m1" },
  { kana: "ひと", meaningEn: "person",   emoji: "👤", fromModule: "m1" },
  { kana: "うた", meaningEn: "song",     emoji: "🎵", fromModule: "m1" },
  { kana: "もも", meaningEn: "peach",    emoji: "🍑", fromModule: "m1" },
  { kana: "ゆき", meaningEn: "snow",     emoji: "❄️", fromModule: "m1" },
  // ── M2 g-row anchors ──
  { kana: "めがね", meaningEn: "glasses",     emoji: "👓", fromModule: "m2" },
  { kana: "かぎ",   meaningEn: "key",         emoji: "🔑", fromModule: "m2" },
  { kana: "げんき", meaningEn: "well/energy", emoji: "💪", fromModule: "m2" },
  { kana: "ごはん", meaningEn: "rice/meal",   emoji: "🍚", fromModule: "m2" },
  // ── M2 z/d/b/p + yōon anchors. Before the 2026-05-18 expansion, only
  //    g-row had M2 atoms; the other dakuten rows + yōon-rare were
  //    structurally absent from M3-M7 review tails. `assertReviewPoolCoverage`
  //    at module load now blocks regressions. ──
  { kana: "かぞく",     meaningEn: "family",         emoji: "👪",  fromModule: "m2" }, // z-row (ぞ)
  { kana: "じかん",     meaningEn: "time",           emoji: "⏰",  fromModule: "m2" }, // z-row (じ)
  { kana: "まど",       meaningEn: "window",         emoji: "🪟",  fromModule: "m2" }, // d-row (ど)
  { kana: "でんわ",     meaningEn: "telephone",      emoji: "☎️",  fromModule: "m2" }, // d-row (で)
  { kana: "あそぶ",     meaningEn: "play",           emoji: "🎮",  fromModule: "m2" }, // b-row (ぶ)
  { kana: "ぼうし",     meaningEn: "hat",            emoji: "🎩",  fromModule: "m2" }, // b-row (ぼ)
  { kana: "えんぴつ",   meaningEn: "pencil",         emoji: "✏️",  fromModule: "m2" }, // p-row (ぴ)
  { kana: "さんぽ",     meaningEn: "walk/stroll",    emoji: "🚶",  fromModule: "m2" }, // p-row (ぽ)
  { kana: "きっぷ",     meaningEn: "ticket",         emoji: "🎫",  fromModule: "m2" }, // p-row (ぷ)
  { kana: "ぎゅうにゅう", meaningEn: "milk",         emoji: "🥛",  fromModule: "m2" }, // yōon-voiced (ぎゅ)
  { kana: "りょうり",   meaningEn: "cooking",        emoji: "🍳",  fromModule: "m2" }, // yōon (りょ)
  { kana: "しゃしん",   meaningEn: "photo",          emoji: "📸",  fromModule: "m2" }, // yōon (しゃ)
  { kana: "パーティー", meaningEn: "party",          emoji: "🎉",  fromModule: "m2" }, // yōon-rare (ティ)
  { kana: "ティーシャツ", meaningEn: "T-shirt",      emoji: "👕",  fromModule: "m2" }, // yōon-rare (ティ)
  // ── M3 anchors (loanwords + people + concrete nouns from M3 v2 rebuild) ──
  { kana: "コーヒー",   meaningEn: "coffee",            emoji: "☕", fromModule: "m3" },
  { kana: "タクシー",   meaningEn: "taxi",              emoji: "🚕", fromModule: "m3" },
  { kana: "ホテル",     meaningEn: "hotel",             emoji: "🏨", fromModule: "m3" },
  { kana: "ビール",     meaningEn: "beer",              emoji: "🍺", fromModule: "m3" },
  { kana: "がくせい",   meaningEn: "student",           emoji: "🎓", fromModule: "m3" },
  { kana: "せんせい",   meaningEn: "teacher",           emoji: "👩‍🏫", fromModule: "m3" },
  { kana: "ともだち",   meaningEn: "friend",            emoji: "🧑‍🤝‍🧑", fromModule: "m3" },
  { kana: "なまえ",     meaningEn: "name",              emoji: "📛", fromModule: "m3" },
  { kana: "ほん",       meaningEn: "book",              emoji: "📖", fromModule: "m3" },
  { kana: "みず",       meaningEn: "water",             emoji: "💧", fromModule: "m3" },
  // ── M4 anchors (possession/pointer-focused — objects you'd point at) ──
  { kana: "ペン",       meaningEn: "pen",               emoji: "🖊️", fromModule: "m4" },
  { kana: "かばん",     meaningEn: "bag",               emoji: "👜", fromModule: "m4" },
  { kana: "くるま",     meaningEn: "car",               emoji: "🚗", fromModule: "m4" },
  { kana: "カメラ",     meaningEn: "camera",            emoji: "📷", fromModule: "m4" },
  { kana: "けいたい",   meaningEn: "mobile phone",      emoji: "📱", fromModule: "m4" },
  { kana: "かさ",       meaningEn: "umbrella",          emoji: "☂️", fromModule: "m4" },
  { kana: "じしょ",     meaningEn: "dictionary",        emoji: "📕", fromModule: "m4" },
  { kana: "いす",       meaningEn: "chair",             emoji: "🪑", fromModule: "m4" },
  { kana: "てがみ",     meaningEn: "letter (postal)",   emoji: "✉️", fromModule: "m4" },
  { kana: "じてんしゃ", meaningEn: "bicycle",           emoji: "🚲", fromModule: "m4" },
  { kana: "あに",       meaningEn: "older brother",     emoji: "👨", fromModule: "m4" },
  { kana: "あなた",     meaningEn: "you",               emoji: "🫵", fromModule: "m4" },
  { kana: "わたし",     meaningEn: "I/me",              emoji: "🙋", fromModule: "m4" },
  { kana: "にほん",     meaningEn: "Japan",             emoji: "🇯🇵", fromModule: "m4" },
  { kana: "アメリカ",   meaningEn: "America",           emoji: "🇺🇸", fromModule: "m4" },
  { kana: "なん",       meaningEn: "what",              emoji: "❓", fromModule: "m4" },
  { kana: "だれ",       meaningEn: "who",               emoji: "🙋‍♂️", fromModule: "m4" },
  { kana: "どれ",       meaningEn: "which one",         emoji: "🤔", fromModule: "m4" },
  { kana: "これ",       meaningEn: "this (near me)",    emoji: "👇", fromModule: "m4" },
  // ── M5 anchors (numbers + counters + café/transactional) ──
  // Numbers carry digit-emoji so vocabMcq can use them as visual MCQ
  // targets for M6+ review-tails. Counter + transactions vocab give
  // M6/M7 dialogue/cloze sites concrete nouns to lean on.
  { kana: "いち",       meaningEn: "1 (one)",           emoji: "1️⃣", fromModule: "m5" },
  { kana: "に",         meaningEn: "2 (two)",           emoji: "2️⃣", fromModule: "m5" },
  { kana: "さん",       meaningEn: "3 (three)",         emoji: "3️⃣", fromModule: "m5" },
  { kana: "よん",       meaningEn: "4 (four)",          emoji: "4️⃣", fromModule: "m5" },
  { kana: "ご",         meaningEn: "5 (five)",          emoji: "5️⃣", fromModule: "m5" },
  { kana: "ろく",       meaningEn: "6 (six)",           emoji: "6️⃣", fromModule: "m5" },
  { kana: "なな",       meaningEn: "7 (seven)",         emoji: "7️⃣", fromModule: "m5" },
  { kana: "はち",       meaningEn: "8 (eight)",         emoji: "8️⃣", fromModule: "m5" },
  { kana: "きゅう",     meaningEn: "9 (nine)",          emoji: "9️⃣", fromModule: "m5" },
  { kana: "じゅう",     meaningEn: "10 (ten)",          emoji: "🔟", fromModule: "m5" },
  { kana: "ひとり",     meaningEn: "1 person",          emoji: "🧍", fromModule: "m5" },
  { kana: "ふたり",     meaningEn: "2 people",          emoji: "👥", fromModule: "m5" },
  { kana: "さんにん",   meaningEn: "3 people",          emoji: "👨‍👩‍👦", fromModule: "m5" },
  { kana: "よにん",     meaningEn: "4 people",          fromModule: "m5" },
  { kana: "ごにん",     meaningEn: "5 people",          fromModule: "m5" },
  { kana: "ひとつ",     meaningEn: "1 thing (generic counter)", fromModule: "m5" },
  { kana: "ふたつ",     meaningEn: "2 things (generic counter)", fromModule: "m5" },
  { kana: "みっつ",     meaningEn: "3 things (generic counter)", fromModule: "m5" },
  { kana: "から",       meaningEn: "from (origin)",     fromModule: "m5" },
  { kana: "おかね",     meaningEn: "money",             emoji: "💰", fromModule: "m5" },
  { kana: "いくら",     meaningEn: "how much (price)",  emoji: "💲", fromModule: "m5" },
  { kana: "えん",       meaningEn: "yen",               emoji: "💴", fromModule: "m5" },
  { kana: "おちゃ",     meaningEn: "green tea",         emoji: "🍵", fromModule: "m5" },
  { kana: "ください",   meaningEn: "please give me",    emoji: "🤲", fromModule: "m5" },
  // ── M6 anchors (places + transport + existence verbs) ──
  { kana: "こうえん",     meaningEn: "park",              emoji: "🌲", fromModule: "m6" },
  { kana: "がっこう",     meaningEn: "school",            emoji: "🏫", fromModule: "m6" },
  { kana: "うち",         meaningEn: "home",              emoji: "🏡", fromModule: "m6" },
  { kana: "えき",         meaningEn: "train station",     emoji: "🚉", fromModule: "m6" },
  { kana: "トイレ",       meaningEn: "toilet",            emoji: "🚽", fromModule: "m6" },
  { kana: "コンビニ",     meaningEn: "convenience store", emoji: "🏪", fromModule: "m6" },
  { kana: "ぎんこう",     meaningEn: "bank",              emoji: "🏦", fromModule: "m6" },
  { kana: "としょかん",   meaningEn: "library",           emoji: "🏛️", fromModule: "m6" },
  { kana: "みせ",         meaningEn: "shop",              emoji: "🏬", fromModule: "m6" },
  { kana: "へや",         meaningEn: "room",              emoji: "🛋️", fromModule: "m6" },
  { kana: "でんしゃ",     meaningEn: "train",             emoji: "🚆", fromModule: "m6" },
  { kana: "バス",         meaningEn: "bus",               emoji: "🚌", fromModule: "m6" },
  { kana: "あります",     meaningEn: "exists (thing)",    emoji: "📦", fromModule: "m6" },
  { kana: "います",       meaningEn: "exists (alive)",    emoji: "🧑", fromModule: "m6" },
  // ── M7 anchors (verbs — DICTIONARY form, not ます-form. Spencer QA
  //    2026-07-16: review/match grids must build a strong association
  //    with the plain form so learners can generalize to later
  //    conjugations; ます is taught in ja-m7-2-1's dedicated dict↔ます
  //    match step, which stays hand-authored and untouched by this pool.
  //    Glosses match the ja-m7-1-2-match-verbs vocab-intro grid. + food/
  //    drink objects) ──
  { kana: "たべる",   meaningEn: "to eat",          emoji: "🍴", fromModule: "m7" },
  { kana: "のむ",     meaningEn: "to drink",        emoji: "🥤", fromModule: "m7" },
  { kana: "いく",     meaningEn: "to go",           emoji: "🚶", fromModule: "m7" },
  { kana: "みる",     meaningEn: "to see / watch",  emoji: "👀", fromModule: "m7" },
  { kana: "よむ",     meaningEn: "to read",         emoji: "📚", fromModule: "m7" },
  { kana: "かく",     meaningEn: "to write",        emoji: "✍️", fromModule: "m7" },
  { kana: "すし",       meaningEn: "sushi",             emoji: "🍣", fromModule: "m7" },
  { kana: "ラーメン",   meaningEn: "ramen",             emoji: "🍜", fromModule: "m7" },
  { kana: "パン",       meaningEn: "bread",             emoji: "🍞", fromModule: "m7" },
  { kana: "ごはん",     meaningEn: "rice/meal",         emoji: "🍚", fromModule: "m7" },
  { kana: "ジュース",   meaningEn: "juice",             emoji: "🧃", fromModule: "m7" },
];

import { topStruggleKana } from "@/shared/symbolMastery";

/**
 * Build-time guard: every M1 row and every M2 sub-row must have ≥2 anchor
 * atoms in `M3_M7_REVIEW_POOL`. Catches the 2026-05-18 audit regression
 * where p-row and yōon-rare had ZERO coverage — a 7-14 day gap learner
 * could not surface those rows in any M3-M7 review tail.
 *
 * Probe kana ranges by row signature, not by `fromModule` (some M3+ atoms
 * legitimately carry M2 kana; we want any anchor that exposes the row).
 */
const ROW_PROBES: ReadonlyArray<{ name: string; re: RegExp }> = [
  { name: "ya",          re: /[やゆよ]/ },
  { name: "ra",          re: /[らりるれろ]/ },
  { name: "wa",          re: /[わを]/ },
  { name: "g",           re: /[がぎぐげご]/ },
  { name: "z",           re: /[ざじずぜぞ]/ },
  { name: "d",           re: /[だぢづでど]/ },
  { name: "b",           re: /[ばびぶべぼ]/ },
  { name: "p",           re: /[ぱぴぷぺぽパピプペポ]/ },
  { name: "yoon-voiced", re: /(じゃ|じゅ|じょ|ぎゃ|ぎゅ|ぎょ|びゃ|びゅ|びょ)/ },
  { name: "yoon-rare",   re: /(ファ|フィ|フェ|フォ|ティ|ディ|ウィ|ウェ|ウォ|ツァ|ヴ)/ },
];
for (const { name, re } of ROW_PROBES) {
  const hits = M3_M7_REVIEW_POOL.filter((a) => re.test(a.kana)).length;
  if (hits < 2) {
    throw new Error(
      `M3_M7_REVIEW_POOL: row '${name}' has only ${hits} anchor(s); need ≥2 so a forgetting-gap learner can re-encounter the row in review tails.`,
    );
  }
}

/**
 * Draw N atoms from a prior-module pool, deterministic by seed. Identical
 * shuffle algorithm to `pickReviewWords` in _consonantRowHelpers so atom
 * rotation across re-mounts of the same lesson stays stable.
 *
 * When `n` exceeds the pool size, returns the whole pool.
 *
 * **Adaptive weighting (2026-05-18):** if a `struggle` map is provided
 * (atom-kana → wrong-count), atoms with prior struggles are weighted
 * roughly 3× as likely to appear early in the shuffle. This brings the
 * function closer to FSRS-style "favor what was forgotten" without the
 * full interval-state machinery. Deterministic given the same struggle
 * snapshot.
 */
export function pickReviewAtomsWeighted(
  seed: string,
  pool: ReviewAtom[],
  n: number,
  struggle: ReadonlyMap<string, number>,
): ReviewAtom[] {
  if (struggle.size === 0) return pickReviewAtoms(seed, pool, n);
  let h = 0;
  for (let i = 0; i < seed.length; i++) {
    h = (h * 31 + seed.charCodeAt(i)) | 0;
  }
  // Score each atom: base (seed-derived noise) plus weight from struggle.
  const scored = pool.map((atom, i) => {
    h = (h * 16807) % 2147483647;
    const noise = Math.abs(h) / 2147483647; // [0, 1)
    const w = struggle.get(atom.kana) ?? 0;
    const weight = 1 + Math.min(w, 3) * 2; // wrong 1× → 3, 2× → 5, 3+× → 7
    return { atom, key: noise / weight, i };
  });
  scored.sort((a, b) => a.key - b.key);
  return scored.slice(0, Math.min(n, scored.length)).map((s) => s.atom);
}

export function pickReviewAtoms(
  seed: string,
  pool: ReviewAtom[],
  n: number,
): ReviewAtom[] {
  // Struggle-weighted draw: read the kana struggle snapshot at call time
  // and bias the shuffle toward atoms whose kana contains characters the
  // learner has missed before. Falls back to pure seeded shuffle if the
  // struggle store is empty (cold start) so first-time learners still get
  // a stable, deterministic review tail.
  const struggleKana = new Set(topStruggleKana("ja", 12));
  if (struggleKana.size > 0) {
    let h = 0;
    for (let i = 0; i < seed.length; i++) {
      h = (h * 31 + seed.charCodeAt(i)) | 0;
    }
    const scored = pool.map((atom) => {
      h = (h * 16807) % 2147483647;
      const noise = Math.abs(h) / 2147483647; // [0, 1)
      let hits = 0;
      for (const ch of atom.kana) if (struggleKana.has(ch)) hits += 1;
      const weight = 1 + Math.min(hits, 3) * 2; // 1 hit → 3×, 2 → 5×, 3+ → 7×
      return { atom, key: noise / weight };
    });
    scored.sort((a, b) => a.key - b.key);
    return scored.slice(0, Math.min(n, scored.length)).map((s) => s.atom);
  }
  const out = pool.slice();
  let h = 0;
  for (let i = 0; i < seed.length; i++) {
    h = (h * 31 + seed.charCodeAt(i)) | 0;
  }
  for (let i = out.length - 1; i > 0; i--) {
    h = (h * 16807) % 2147483647;
    const j = Math.abs(h) % (i + 1);
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out.slice(0, Math.min(n, out.length));
}

/** Deterministic 32-bit hash → [0, slots) — FNV-1a with a Murmur3-style
 *  finalizer so the low bits distribute well after `% slots`.
 *
 *  2026-05-18 audit found that the prior naked FNV variant collapsed to
 *  ~75% slot-0 concentration on the lesson-id naming pattern (long shared
 *  prefix `ja-mN-N-…`). The finalizer mixes high bits into low bits so a
 *  modest hash difference no longer collides on `h % 4` /  `h % 3`.
 *
 *  Exported so the 5 mock-ja-m{3-v2,4,5,6,7}.ts files can reuse for
 *  their inline particleMc row-test helpers. */
export function slotFor(id: string, slots: number): number {
  let h = 2166136261;
  for (let i = 0; i < id.length; i++) {
    h ^= id.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  // Murmur3 finalizer.
  h ^= h >>> 16;
  h = Math.imul(h, 0x85ebca6b);
  h ^= h >>> 13;
  h = Math.imul(h, 0xc2b2ae35);
  h ^= h >>> 16;
  return (h >>> 0) % slots;
}

/**
 * `match_pairs` factory drawing pairs from a prior atom pool — meaning
 * EN ↔ kana. Used as a review-tail step; tap-source plays TTS so the
 * grid doubles as listening reinforcement.
 *
 * Caller passes a stable id-prefix; the resulting step id is
 * `${idPrefix}-match-review`. 4-6 pairs recommended for the M3 tail (≥
 * 4 keeps the grid interesting; > 6 starts to drag).
 */
export function reviewMatchPairs(
  idPrefix: string,
  atoms: ReviewAtom[],
): MatchPairsStep {
  return {
    id: `${idPrefix}-match-review`,
    type: "match_pairs",
    prompt: "Match each Japanese word to its meaning (review)",
    playAudioOnSelect: true,
    pairs: atoms.map((a, i) => ({
      id: `p-${i}`,
      source: a.kana,
      target: a.meaningEn,
      sourceAnnotation: [buildSingletonAnnotation(a.kana)],
    })),
    exercisedAtoms: resolveAtomIds(atoms.map((a) => a.kana)),
    modality: "recognition",
  };
}

/**
 * Words whose audit-graded visual cue (Noto emoji OR custom SVG) is
 * either misleading or weak per docs/emoji-blocked-words-2026-05-18.md.
 * The kana stay in the curriculum and ride along on pools as `emoji`-bearing
 * atoms (so listeningBuild / listeningComp / build_sentence can use them),
 * but `vocabMcq` and `priorWordMcq` skip them from BOTH target and
 * distractor slots. Authors pick a different step type for these words.
 *
 * Add to this set when the audit flags a new word. Strip an entry when
 * we ship custom art the audit grades "confident."
 */
export const WORD_IMAGE_MCQ_BLOCKLIST: ReadonlySet<string> = new Set([
  "あなた",   // pronoun — context-dropped in practice
  "あに",     // older brother — age cue carried by kanji, not face
  "あね",     // older sister — same
  "ちち",     // (my) father — parent composition reads as "parent," not father
  "はは",     // (my) mother — same
  "あります", // exists (thing) — grammatical existence, no visual referent
  "います",   // exists (alive) — same
  "こえ",     // voice — 🗣️ reads as "speech/shout," not the abstract "voice"
  // 2026-05-18 coordinator unblock: M5 counter atoms have no honest
  // visual referent (the counters need pairing with a noun to mean
  // anything). Block so vocabMcq + withoutMcqBlocked filter them out.
  "よにん",   // 4 people — pure counter, abstract
  "ごにん",   // 5 people — pure counter, abstract
  "ひとつ",   // 1 thing (generic counter) — abstract grouping
  "ふたつ",   // 2 things (generic counter) — abstract grouping
  "みっつ",   // 3 things (generic counter) — abstract grouping
  "から",     // particle (from) — grammar marker, no visual
  // 2026-07-17 m30 casual-register pilot: abstract adverbs/fillers with no
  // honest visual referent (docs/n4-pilot-spine-2026-07-16.md m30 table).
  "きになる",   // "on my mind" idiom (spine's bare き would collide with the
                // existing tree き atom, m18 — see m30.ts file header) — abstract
  "なんで",     // why (casual) — abstract interrogative
  "どうしたの", // "what's up?" — function phrase, no visual
  "べつに",     // not particularly — abstract adverb
  "やっぱり",   // as expected, after all — abstract adverb
  "もちろん",   // of course — abstract adverb
  "ぜったい",   // absolutely — abstract adverb
]);

/**
 * Helper: returns a copy of `pool` with image-blocklisted atoms removed.
 * Use when declaring per-module review pools that feed `vocabMcq` —
 * blocklisted atoms can't be MCQ targets and shouldn't be MCQ distractors
 * either. The unfiltered pool stays available for matchPairs / listening
 * helpers (text + audio surfaces, no image).
 *
 * Thin JA wrapper over the generic `withoutMcqBlocked` in
 * `shared/lessonAuthoring/imageMcqBlocklist.ts` — Phase 2 will route
 * this through `LanguageModule.imageMcqBlocklist`.
 */
export function withoutMcqBlocked(pool: ReviewAtom[]): ReviewAtom[] {
  return sharedWithoutMcqBlocked(WORD_IMAGE_MCQ_BLOCKLIST, pool);
}

/**
 * `word_image_mcq` factory with auto-drawn distractors from a prior atom
 * pool. Skips the target itself + any atom without an emoji (visual MCQ
 * requires the emoji as the semantic cue). Throws if the target has no
 * emoji (the call site should use `listeningComp` / `listeningBuild`
 * instead — visual MCQ on an emoji-less word is unsolvable). Also throws
 * if the target is in `WORD_IMAGE_MCQ_BLOCKLIST` — those words are
 * teachable via other step types, just not via visual MCQ.
 *
 * Used to introduce / re-encounter a vocab atom via visual recognition.
 * Distractors deterministic by id so a re-mount picks the same foils.
 */
export function vocabMcq(
  idPrefix: string,
  target: ReviewAtom,
  distractorPool: ReviewAtom[],
): WordImageMcqStep {
  if (!target.emoji) {
    throw new Error(
      `vocabMcq: target '${target.kana}' has no emoji — use listeningBuild or listeningComp instead`,
    );
  }
  if (WORD_IMAGE_MCQ_BLOCKLIST.has(target.kana)) {
    throw new Error(
      `vocabMcq: target '${target.kana}' is image-blocked (see docs/emoji-blocked-words-2026-05-18.md) — use listeningBuild / listeningComp / particle_cloze / phrase_card instead`,
    );
  }
  const filtered = distractorPool.filter(
    (a) => a.kana !== target.kana && Boolean(a.emoji) && !WORD_IMAGE_MCQ_BLOCKLIST.has(a.kana),
  );
  const picked = pickReviewAtoms(`${idPrefix}-distractors`, filtered, 3);
  if (picked.length < 3) {
    throw new Error(
      `vocabMcq: not enough emoji-bearing distractors for '${target.kana}' (have ${picked.length}, need 3)`,
    );
  }
  const slot = slotFor(idPrefix, 4);
  const options: { id: string; word: string; emoji: string }[] = [];
  let di = 0;
  for (let i = 0; i < 4; i++) {
    if (i === slot) {
      options.push({ id: "correct", word: target.kana, emoji: target.emoji });
    } else {
      const d = picked[di++];
      options.push({ id: `opt-${i}`, word: d.kana, emoji: d.emoji! });
    }
  }
  return {
    id: idPrefix,
    type: "word_image_mcq",
    meaningEn: target.meaningEn,
    options,
    // Parallel display annotations: one single-atom annotation per option so
    // the kanji post-pass (which only rewrites *Annotation fields) can swap in
    // the kanji surface once unlocked. Non-atom option words resolve no atomId
    // and are left as-is by the pass. Grading/audio (id/word) untouched.
    optionAnnotations: options.map((o) => [buildSingletonAnnotation(o.word)]),
    correctOptionId: "correct",
    exercisedAtoms: resolveAtomIds([target.kana]),
    modality: "recognition",
  };
}

/* ────────────────────────────────────────────────────────────────────────
 * Card-agnostic review factories (2026-05-21)
 *
 * These three factories are atom-shaped (signature `(idPrefix, target,
 * distractorPool)`) and intentionally card-agnostic — they can be invoked
 * at flashcards-surface render time for any SRS-eligible atom, given the
 * minimal `ReviewAtom` shape. Catalog: docs/card-agnostic-reviews-2026-05-21.md.
 *
 * Pattern mirrors `vocabMcq`:
 *  - 4 options, correct slot picked by `slotFor(idPrefix, 4)`
 *  - 3 distractors drawn via `pickReviewAtoms(seed, pool, 3)` for stable
 *    seeded shuffling across re-mounts
 *  - Audio text resolves to `target.kana` (TTS manifest key)
 * ──────────────────────────────────────────────────────────────────────── */

/**
 * Audio→Image MCQ: hear the word, pick the matching emoji tile.
 *
 * Card-agnostic — works for any atom with an `emoji` (concrete-noun-shaped).
 * Distractors drawn from the pool; must themselves carry emoji + not be
 * image-blocked. Throws on the same conditions as `vocabMcq`.
 *
 * Differs from `vocabMcq` in that the PROMPT is audio-only (no meaningEn
 * label) — the learner hears the kana via TTS and picks the matching
 * picture. Same `WordImageMcqStep` shape; the renderer detects audio-prompt
 * mode via the empty-string `meaningEn` + presence of the audio key in
 * the step id (current contract; renderer enhancement tracked separately).
 *
 * For now, ships as a WordImageMcqStep with `meaningEn` left as the kana
 * itself, so existing renderers fall back gracefully. The flashcards
 * adaptive picker (phase 6) can choose between vocabMcq and audioImageMcq
 * per atom based on prior-modality SRS state.
 */
export function audioImageMcq(
  idPrefix: string,
  target: ReviewAtom,
  distractorPool: ReviewAtom[],
): WordImageMcqStep {
  if (!target.emoji) {
    throw new Error(
      `audioImageMcq: target '${target.kana}' has no emoji — use audioMeaningMcq or listeningBuild instead`,
    );
  }
  if (WORD_IMAGE_MCQ_BLOCKLIST.has(target.kana)) {
    throw new Error(
      `audioImageMcq: target '${target.kana}' is image-blocked (see docs/emoji-blocked-words-2026-05-18.md) — use audioMeaningMcq instead`,
    );
  }
  const filtered = distractorPool.filter(
    (a) =>
      a.kana !== target.kana &&
      Boolean(a.emoji) &&
      !WORD_IMAGE_MCQ_BLOCKLIST.has(a.kana),
  );
  const picked = pickReviewAtoms(`${idPrefix}-distractors`, filtered, 3);
  if (picked.length < 3) {
    throw new Error(
      `audioImageMcq: not enough emoji-bearing distractors for '${target.kana}' (have ${picked.length}, need 3)`,
    );
  }
  const slot = slotFor(idPrefix, 4);
  const options: { id: string; word: string; emoji: string }[] = [];
  let di = 0;
  for (let i = 0; i < 4; i++) {
    if (i === slot) {
      options.push({ id: "correct", word: target.kana, emoji: target.emoji });
    } else {
      const d = picked[di++];
      options.push({ id: `opt-${i}`, word: d.kana, emoji: d.emoji! });
    }
  }
  return {
    id: idPrefix,
    type: "word_image_mcq",
    // Audio-prompt mode: the meaning is intentionally the kana itself — the
    // learner hears it via TTS and matches to the emoji. The renderer
    // detects this (meaningEn equals an option word, impossible for real
    // English meanings) and swaps the text prompt for a play button +
    // "Which word do you hear?" — the old "What is the word for <kana>?"
    // template printed the answer right above a tile captioned with the
    // same kana (QA 2026-07-16, ja-m28-review-1).
    meaningEn: target.kana,
    options,
    // Parallel display annotations (see vocabMcq) so the kanji post-pass can
    // substitute unlocked kanji surfaces; audio/grading fields untouched.
    optionAnnotations: options.map((o) => [buildSingletonAnnotation(o.word)]),
    correctOptionId: "correct",
    exercisedAtoms: resolveAtomIds([target.kana]),
    modality: "recognition",
  };
}

/**
 * Audio→Meaning MCQ: hear the word, pick the English meaning.
 *
 * Atom-form of `listeningCompSentence` (which is sentence-form with
 * hand-authored distractor sentences). For atoms, distractors are the
 * English meanings of other atoms in the pool. Works for any atom — emoji
 * not required, blocklist not relevant (the answer surface is English).
 *
 * Card-agnostic — minimal data needed: `{kana, meaningEn}`. Used by the
 * flashcards adaptive picker when the atom is hard-to-image (compound
 * nouns, pronouns, abstract concepts) or when the recognition-modality
 * SRS state needs a non-visual review beat.
 */
export function audioMeaningMcq(
  idPrefix: string,
  target: ReviewAtom,
  distractorPool: ReviewAtom[],
): ListeningComprehensionStep {
  const filtered = distractorPool.filter(
    (a) => a.kana !== target.kana && a.meaningEn !== target.meaningEn,
  );
  const picked = pickReviewAtoms(`${idPrefix}-distractors`, filtered, 3);
  if (picked.length < 3) {
    throw new Error(
      `audioMeaningMcq: not enough distractors for '${target.kana}' (have ${picked.length}, need 3)`,
    );
  }
  const slot = slotFor(idPrefix, 4);
  const options: { id: string; text: string }[] = [];
  let di = 0;
  for (let i = 0; i < 4; i++) {
    if (i === slot) {
      options.push({ id: "correct", text: target.meaningEn });
    } else {
      options.push({ id: `opt-${i}`, text: picked[di++].meaningEn });
    }
  }
  return {
    id: idPrefix,
    type: "listening_comprehension",
    audioKey: target.kana,
    transcript: target.kana,
    question: "What does this word mean?",
    options,
    correctOptionId: "correct",
    transcriptAnnotation: [buildSingletonAnnotation(target.kana)],
    exercisedAtoms: resolveAtomIds([target.kana]),
    modality: "recognition",
  };
}

/**
 * Translation MCQ: English prompt → pick the correct kana.
 *
 * Atom-form of `sentenceMcq` (which is sentence-form with hand-authored
 * distractor kana sentences). For atoms, distractors are other atoms'
 * kana. The English meaning is the prompt; learner picks among 4 kana.
 *
 * Card-agnostic — minimal data needed: `{kana, meaningEn}`. Used by the
 * flashcards adaptive picker for the production-direction recognition
 * beat (English-cue → kana-recall) without requiring a full typed
 * `translateStep` (which is harder and slower).
 */
export function translationMcq(
  idPrefix: string,
  target: ReviewAtom,
  distractorPool: ReviewAtom[],
): MultipleChoiceStep {
  const filtered = distractorPool.filter((a) => a.kana !== target.kana);
  const picked = pickReviewAtoms(`${idPrefix}-distractors`, filtered, 3);
  if (picked.length < 3) {
    throw new Error(
      `translationMcq: not enough distractors for '${target.kana}' (have ${picked.length}, need 3)`,
    );
  }
  const slot = slotFor(idPrefix, 4);
  const options: { id: string; text: string }[] = [];
  let di = 0;
  for (let i = 0; i < 4; i++) {
    if (i === slot) {
      options.push({ id: "correct", text: target.kana });
    } else {
      options.push({ id: `opt-${i}`, text: picked[di++].kana });
    }
  }
  return {
    id: idPrefix,
    type: "multiple_choice",
    // Bare meaningEn ("this") reads unfinished as a whole prompt — frame it
    // as an instruction, meaning quoted verbatim (Spencer QA 2026-07-16,
    // same defect class as the build_sentence single-answer picker).
    prompt: `Pick the word for "${target.meaningEn}"`,
    options,
    correctOptionId: "correct",
    optionsHideRomaji: true,
    exercisedAtoms: resolveAtomIds([target.kana]),
    modality: "production",
  };
}

/**
 * `kanji_reading` factory: show a kanji word, pick its KANA reading.
 *
 * Closes the kanji ladder's retrieval gap — before this, kanji surfaces
 * appeared (with furigana, per the unlock+2 rolling window) but were never
 * tested. Direction is strictly kanji → kana; sound → kanji-spelling is the
 * separate future `audio_spelling_mcq` (guide §13.1), NOT this.
 *
 * Atom-keyed, so it auto-tags `exercisedAtoms` (guide §13.13) and the
 * correct slot rotates by `slotFor(idPrefix, 4)` like every other MCQ
 * factory here.
 *
 * THE TESTED KANJI RENDERS BARE. `promptAnnotation` is emitted in the
 * furigana-OFF shape (`surface === reading === kanji`) — the same shape
 * `applyKanjiSurfaces` uses once a word's window closes. Two independent
 * guards fall out of that one choice:
 *   1. AnnotatedText floats a reading only when `surface !== reading`, so
 *      the ruby <rt> is empty + aria-hidden — the answer never prints.
 *   2. `applyKanjiSurfaces.rewriteSegment` skips any segment whose surface
 *      already carries Han, so the post-pass can never "helpfully" re-attach
 *      the kana reading to the word under test, at ANY module.
 * A furigana'd prompt would hand over the answer, so this is the single
 * correctness property of the step — see kanjiReading.test.ts.
 *
 * The kanji surface resolves from the shipped rollout catalog
 * (`KANJI_ELIGIBLE_ATOMS`), so a step can never test a word the ladder
 * hasn't cleared. Pass `opts.kanji` to override (e.g. counter forms whose
 * atom maps to a different surface).
 *
 * Distractors default to generated near-misses (`readingDistractors` —
 * valid-but-wrong on/kun, wrong okurigana stem, rendaku slip; guide §13.7).
 * Pass `opts.distractors` to author them by hand; they win outright.
 */
export function kanjiReading(
  idPrefix: string,
  target: ReviewAtom,
  opts?: { kanji?: string; distractors?: string[] },
): KanjiReadingStep {
  const atomId = JA_COURSE_ATOMS_BY_KANA.get(target.kana)?.id;
  const kanji =
    opts?.kanji ?? (atomId ? KANJI_ELIGIBLE_ATOMS.get(atomId)?.kanji : undefined);
  if (!kanji) {
    throw new Error(
      `kanjiReading(${idPrefix}): '${target.kana}' has no kanji-eligible surface in the rollout catalog — pass opts.kanji, or use vocabMcq/translationMcq for a kana-only atom`,
    );
  }

  let distractors: string[];
  if (opts?.distractors?.length) {
    for (const d of opts.distractors) {
      if (d === target.kana) {
        throw new Error(
          `kanjiReading(${idPrefix}): distractor '${d}' equals the correct reading`,
        );
      }
      // Kana-only options are the shipped no-kanji-production policy, not a
      // style rule: a kanji option would make this a spelling test.
      if (!Array.from(d).every((c) => isKana(c))) {
        throw new Error(
          `kanjiReading(${idPrefix}): distractor '${d}' is not pure kana — this step never offers kanji options`,
        );
      }
    }
    distractors = [...new Set(opts.distractors)];
  } else {
    distractors = readingDistractors(kanji, target.kana);
  }
  if (distractors.length < 3) {
    throw new Error(
      `kanjiReading(${idPrefix}): only ${distractors.length} plausible distractor(s) for ${kanji} (${target.kana}) — pass opts.distractors with hand-authored near-misses (guide §13.7)`,
    );
  }
  distractors = distractors.slice(0, 3);

  const slot = slotFor(idPrefix, 4);
  const options: { id: string; text: string }[] = [];
  let di = 0;
  for (let i = 0; i < 4; i++) {
    if (i === slot) options.push({ id: "correct", text: target.kana });
    else options.push({ id: `opt-${i}`, text: distractors[di++] });
  }

  return {
    id: idPrefix,
    type: "kanji_reading",
    kanji,
    reading: target.kana,
    // Furigana-OFF shape — see the doc comment. Deliberately NOT
    // buildSingletonAnnotation(kanji, target.kana), which would float the
    // answer above the prompt.
    promptAnnotation: [
      { surface: kanji, reading: kanji, ...resolveAtom(target.kana) },
    ],
    meaningEn: target.meaningEn,
    options,
    correctOptionId: "correct",
    // Kana TTS key, spoken post-commit only (it IS the answer).
    audioText: target.kana,
    exercisedAtoms: resolveAtomIds([target.kana]),
    modality: "recognition",
  };
}

/**
 * `conjugation_cloze` factory (n4-scoping-2026-07-16 §3 ACCEPT): a sentence
 * frame with a blank where a CONJUGATED verb form goes, cued by
 * "dictionary form → target form" (+ optional English cue). The learner
 * picks the correctly derived form from 4 options.
 *
 * ENGINE PROVENANCE (do not hand-author distractors): the correct surface
 * comes from `conjugateVerb` and ALL 3 distractors from
 * `generateFormationDistractors` (conjugation/trainerSession.ts) — the
 * trainer's anti-elimination generator: same-verb wrong sound-change
 * (のむ→のみて), wrong-class rule application, wrong tense/polarity within
 * the ending family, attach-to-dictionary (のむます). Those are often
 * NON-WORDS by design — this is a derivation drill, so engine-generated
 * wrong-derivation shapes ARE the tested contrast (same pedagogy as the
 * standalone trainer + QA fix 25b1f46). Gate 5's invented-form blocklist
 * exempts `conjugation_cloze` for exactly this reason
 * (moduleContentLints.ts).
 *
 * `group` resolves from `VERB_ENTRIES` by dictionary form; pass
 * `opts.group` for verbs not (yet) in the tables or for ichidan/godan
 * homographs (きる, かえる).
 *
 * Correct-slot rotation via `slotFor(id, 4)` like every MCQ factory here
 * (mcq-position-distribution gate: no slot > 55%).
 *
 * `audioText` defaults to the assembled sentence
 * `before + correct + after` (spaces collapsed the way TTS keys are
 * authored); it plays post-commit only — it contains the answer.
 */
export function conjugationCloze(opts: {
  id: string;
  /** Sentence half before the blank, e.g. "わたしは にほんごを ". */
  before: string;
  /** Sentence half after the blank, e.g. "、テレビを みます。". */
  after: string;
  /** Dictionary form of the verb under derivation, e.g. はなす. */
  verb: string;
  /** Target chain form the learner must derive, e.g. "te" / "tai". */
  form: ChainForm;
  meaningEn: string;
  /** Optional English cue for the blank itself, e.g. "want to speak". */
  cueEn?: string;
  /** Verb class override — required when `verb` is not in VERB_ENTRIES. */
  group?: VerbGroup;
  /** Override the assembled-sentence TTS key. */
  audioText?: string;
  explanation?: string;
}): ConjugationClozeStep {
  const group =
    opts.group ??
    VERB_ENTRIES.find((v) => v.dictionary === opts.verb)?.group;
  if (!group) {
    throw new Error(
      `conjugationCloze(${opts.id}): '${opts.verb}' is not in VERB_ENTRIES — pass opts.group ("godan" | "ichidan" | "irregular")`,
    );
  }
  // Engine-derived answer + distractors — the whole point of the type.
  const correct = conjugateVerb(opts.verb, group, opts.form);
  const distractors = generateFormationDistractors(
    opts.verb,
    group,
    opts.form,
    correct,
  );
  if (distractors.length < 3) {
    throw new Error(
      `conjugationCloze(${opts.id}): engine produced only ${distractors.length} distractor(s) for ${opts.verb} → ${opts.form} — pick a different form or verb`,
    );
  }

  const slot = slotFor(opts.id, 4);
  const options: { id: string; text: string }[] = [];
  let di = 0;
  for (let i = 0; i < 4; i++) {
    if (i === slot) options.push({ id: "correct", text: correct });
    else options.push({ id: `opt-${i}`, text: distractors[di++] });
  }

  return {
    id: opts.id,
    type: "conjugation_cloze",
    prompt: { before: opts.before, after: opts.after },
    verb: opts.verb,
    form: opts.form,
    formLabel: CHAIN_FORM_LABELS[opts.form],
    ...(opts.cueEn ? { cueEn: opts.cueEn } : {}),
    options,
    correctOptionId: "correct",
    meaningEn: opts.meaningEn,
    // Full sentence with the CORRECT form — post-commit audio only.
    audioText: opts.audioText ?? `${opts.before}${correct}${opts.after}`,
    ...(opts.explanation ? { explanation: opts.explanation } : {}),
    // Ruby data for the frame halves; `*Annotation` keys so the kanji
    // post-pass (applyKanjiSurfaces) can rewrite eligible frame words.
    // A half may be empty (blank at a sentence edge) — no annotation then.
    ...(opts.before.trim()
      ? { beforeAnnotation: buildSentenceAnnotation(opts.before) }
      : {}),
    ...(opts.after.trim()
      ? { afterAnnotation: buildSentenceAnnotation(opts.after) }
      : {}),
    exercisedAtoms: resolveAtomIds([opts.verb]),
    modality: "production",
  };
}

/**
 * Conjugation Transform factory (spec 2026-07-23) — the morphing drill
 * card. Answer + formation distractors are engine-derived; glosses are
 * REQUIRED (prompt-clarity invariant: the target is always spelled out,
 * "to drink → won't drink · ない form", never bare "make it negative").
 * Stage (MCQ vs typed) is NOT authored — the view resolves it from the
 * (form × verb-class) mastery cell at render.
 */
export function conjugationTransform(opts: {
  id: string;
  /** Dictionary form, e.g. のむ. */
  base: string;
  /** Base-form gloss, e.g. "to drink". */
  baseGloss: string;
  /** Target-form gloss, e.g. "won't drink / don't drink". */
  targetGloss: string;
  /** Verb chain form, OR an い-adjective cell when `group` is "i-adj". */
  form: ChainForm | IAdjForm;
  /** Word class override — required when `base` is not in VERB_ENTRIES, and
   *  ALWAYS for い-adjectives ("i-adj", m12 / spine s09). */
  group?: VerbGroup | "i-adj";
  /** Per-kana romaji annotation line for the base. */
  baseRomaji?: string;
  /** Ungraded end-of-lesson type-tease (no cell write, no streak). */
  ungraded?: boolean;
}): ConjugationTransformStep {
  const group =
    opts.group ?? VERB_ENTRIES.find((v) => v.dictionary === opts.base)?.group;
  if (!group) {
    throw new Error(
      `conjugationTransform(${opts.id}): '${opts.base}' is not in VERB_ENTRIES — pass opts.group`,
    );
  }
  // Never serve a REAL registered word as a wrong option (いない collision
  // class); anti-pattern ranks first — see transformDrillDistractors.
  const realWords = new Set(JA_COURSE_ATOMS.map((a) => a.kana));
  // い-adjectives conjugate on their OWN engine (よ- suppletion, no verb
  // classes) — same card, same mastery ladder, different rule table.
  const isIAdj = group === "i-adj";
  const answer = isIAdj
    ? conjugateIAdj(opts.base, opts.form as IAdjForm)
    : conjugateVerb(opts.base, group, opts.form as ChainForm);
  const distractors = isIAdj
    ? transformDrillIAdjDistractors(
        opts.base,
        opts.form as IAdjForm,
        answer,
        realWords,
      )
    : transformDrillDistractors(
        opts.base,
        group,
        opts.form as ChainForm,
        answer,
        realWords,
      );
  if (distractors.length < 2) {
    throw new Error(
      `conjugationTransform(${opts.id}): only ${distractors.length} formation distractor(s) for ${opts.base} → ${opts.form}`,
    );
  }
  return {
    id: opts.id,
    type: "conjugation_transform",
    base: opts.base,
    ...(opts.baseRomaji ? { baseRomaji: opts.baseRomaji } : {}),
    baseGloss: opts.baseGloss,
    targetGloss: opts.targetGloss,
    form: opts.form,
    formLabel: isIAdj
      ? IADJ_FORM_LABELS[opts.form as IAdjForm]
      : CHAIN_FORM_LABELS[opts.form as ChainForm],
    verbClass: group,
    answer,
    distractors: distractors.slice(0, 2),
    ...(opts.ungraded ? { ungraded: true } : {}),
    // Cell grading happens in the view (recordTransformResult) against the
    // grammar store — deliberately NOT the vocab pipeline, so no
    // exercisedAtoms here. Modality is stage-dependent at render.
  };
}

/**
 * Throws if more than `maxAdjacent` consecutive `particle_cloze` steps
 * share the same `correctParticle`. Catches the M3-5 / M6-6 / M7-5
 * "は か は か は か" / "がががが" / "をををを" anti-patterns at build
 * time before the lesson exports.
 *
 * Steps that aren't particle_cloze reset the run counter. Default
 * threshold = 2 (i.e. max 2 same-answer in a row).
 */
export function assertNoSameAnswerCluster(
  steps: LessonStep[],
  maxAdjacent = 2,
): void {
  // Content-authoring guard — build-time only. Vite statically replaces
  // import.meta.env.DEV, so the body is dead-code-eliminated in prod builds.
  if (!import.meta.env.DEV) return;
  let runParticle: string | null = null;
  let runLen = 0;
  for (const step of steps) {
    if (step.type !== "particle_cloze") {
      runParticle = null;
      runLen = 0;
      continue;
    }
    if (step.correctParticle === runParticle) {
      runLen += 1;
      if (runLen > maxAdjacent) {
        throw new Error(
          `assertNoSameAnswerCluster: ${runLen} consecutive particle_cloze steps with correct='${runParticle}' (max ${maxAdjacent}). Offending step id: ${step.id}`,
        );
      }
    } else {
      runParticle = step.correctParticle;
      runLen = 1;
    }
  }
}

/**
 * Throws if a sub-lesson's `particle_cloze` block contains fewer than
 * `minDistinct` unique correct particles across all cloze items.
 *
 * Per docs/m3-m7-audit-synthesis-2026-05-18.md §2.4: assertNoSameAnswerCluster
 * only catches adjacent dupes. Lessons like M3-4 (5×は), M6-2 (4×に),
 * M7-3 (all を) pass that guard but ship answer-set monotony — learners
 * pattern-match "always pick X" without parsing.
 *
 * Pass `minDistinct = 3` for any drill-only sub-lesson; the introductory
 * sub-lesson for a NEW particle can pass `minDistinct = 1` (legitimate
 * focus on the new atom). Wave-4B agents will tighten module-by-module to
 * `3` once answer-set re-author lands.
 *
 * `steps` should be the array of steps in ONE sub-lesson, not the whole
 * module. Non-particle_cloze steps are ignored. Sub-lessons with zero
 * particle_cloze steps trivially pass.
 */
export function assertAnswerRotation(
  steps: LessonStep[],
  minDistinct = 3,
): void {
  // Content-authoring guard — build-time only (see assertNoSameAnswerCluster).
  if (!import.meta.env.DEV) return;
  const entries: { id: string; correctParticle: string }[] = [];
  for (const step of steps) {
    if (step.type !== "particle_cloze") continue;
    entries.push({ id: step.id, correctParticle: step.correctParticle });
  }
  if (entries.length === 0) return;
  const distinct = new Set(entries.map((e) => e.correctParticle));
  if (entries.length <= minDistinct) return;
  if (distinct.size < minDistinct) {
    const detail = entries
      .map((e) => `${e.id}→'${e.correctParticle}'`)
      .join(", ");
    throw new Error(
      `assertAnswerRotation: sub-lesson has ${distinct.size} distinct correct particle(s) across ${entries.length} cloze item(s) (min ${minDistinct}). Items: [${detail}]`,
    );
  }
}

/**
 * Throws if more than `maxAdjacent` consecutive steps share the same `type`,
 * restricted to a configurable set of types. Catches the M5/M7 phrase_card
 * runs that `assertNoSameAnswerCluster` misses — that guard only watches
 * particle_cloze answers, not step-type adjacency. M7-8 shipped 5 phrase_cards
 * in a row before this guard existed.
 *
 * Default watch set = ["phrase_card", "vocab"] (the two intro-style step types
 * that are most prone to back-to-back stacking). Pass a custom set to widen.
 *
 * `steps` is one sub-lesson's step array. Non-watched types reset the run.
 */
export function assertNoConsecutiveSame(
  steps: LessonStep[],
  maxAdjacent = 2,
  watch: ReadonlyArray<LessonStep["type"]> = ["phrase_card"],
): void {
  // Content-authoring guard — build-time only (see assertNoSameAnswerCluster).
  if (!import.meta.env.DEV) return;
  let runType: LessonStep["type"] | null = null;
  let runLen = 0;
  for (const step of steps) {
    if (!watch.includes(step.type)) {
      runType = null;
      runLen = 0;
      continue;
    }
    if (step.type === runType) {
      runLen += 1;
      if (runLen > maxAdjacent) {
        throw new Error(
          `assertNoConsecutiveSame: ${runLen} consecutive '${runType}' steps (max ${maxAdjacent}). Offending step id: ${step.id}`,
        );
      }
    } else {
      runType = step.type;
      runLen = 1;
    }
  }
}

/**
 * Thin wrapper to author a `translate` step (typed-bank or whole-sentence).
 * M3-M7 spec §4 mandates ≥1 generation step per sub-lesson; this is the
 * highest-leverage one when build_sentence isn't the right fit.
 *
 * `direction = "ja-from-en"` (default): prompt is English, learner types
 * the Japanese. `acceptedAnswers` includes the canonical kana plus any
 * romaji equivalents the grader should accept.
 */
export function translateStep(opts: {
  id: string;
  promptEn: string;
  acceptedAnswers: string[];
  audioText?: string;
  /** Course-atom kana exercised by this step (resolves to FSRS atom IDs). */
  exercisedAtomKanas?: string[];
}): TranslateStep {
  return {
    id: opts.id,
    type: "translate",
    sourceText: opts.promptEn,
    sourceLanguage: "native",
    acceptedAnswers: opts.acceptedAnswers,
    audioKey: opts.audioText,
    exercisedAtoms: resolveAtomIds(opts.exercisedAtomKanas),
    modality: "production",
  };
}

/**
 * `listening_build` factory for a sentence — hear a target sentence,
 * assemble it from a word-tile bank. Distinct from the kana-mora
 * listening_build in `_consonantRowHelpers` (this one uses word-level
 * granularity for grammar-spine production).
 */
export function listeningBuildSentence(opts: {
  id: string;
  target: string;
  tiles: string[];
  correctOrder: string[];
  promptEn: string;
  /** Course-atom kana exercised by this step (resolves to FSRS atom IDs). */
  exercisedAtomKanas?: string[];
}): ListeningBuildStep {
  return {
    id: opts.id,
    type: "listening_build",
    audioKey: opts.target,
    prompt: opts.promptEn,
    targetSentence: opts.target,
    tiles: opts.tiles,
    correctOrder: opts.correctOrder,
    granularity: "word",
    // Multi-segment target (kanji reference); tiles + correctOrder stay KANA.
    targetAnnotation: buildSentenceAnnotation(opts.target),
    exercisedAtoms: resolveAtomIds(opts.exercisedAtomKanas),
    modality: "production",
  };
}

/**
 * `listening_comprehension` factory — hear a phrase, pick its English
 * meaning. Slot-shuffled by id so position bias doesn't leak.
 */
export function listeningCompSentence(opts: {
  id: string;
  audioText: string;
  correctMeaningEn: string;
  distractorsEn: [string, string, string];
  question?: string;
  /** Post-answer teaching note (the noticing beat: shown after grading,
   *  never in the prompt — invariant 18's no-narrative/no-leak rule). */
  explanation?: string;
  /** Course-atom kana exercised by this step (resolves to FSRS atom IDs). */
  exercisedAtomKanas?: string[];
}): ListeningComprehensionStep {
  const items = [
    { id: "correct", text: opts.correctMeaningEn },
    { id: "opt-1", text: opts.distractorsEn[0] },
    { id: "opt-2", text: opts.distractorsEn[1] },
    { id: "opt-3", text: opts.distractorsEn[2] },
  ];
  const slot = slotFor(opts.id, 4);
  const correct = items.shift()!;
  items.splice(slot, 0, correct);
  return {
    id: opts.id,
    type: "listening_comprehension",
    audioKey: opts.audioText,
    transcript: opts.audioText,
    // Word-level audio (no space = single word) must not be labeled a
    // "sentence" (Gate 10 m4 run — pool-word review LCs inherited the
    // sentence default).
    question:
      opts.question ??
      (/[ 　]/.test(opts.audioText)
        ? "What does this sentence mean?"
        : "What did you hear?"),
    options: items,
    correctOptionId: "correct",
    transcriptAnnotation: buildSentenceAnnotation(opts.audioText),
    explanation: opts.explanation,
    exercisedAtoms: resolveAtomIds(opts.exercisedAtomKanas),
    modality: "recognition",
  };
}

/**
 * `multiple_choice` factory for a particle-or-grammar mini-quiz where the
 * prompt is a transliterated meaning and the answer set is kana phrases.
 * Slot-shuffled by id. Distinct from `particle_cloze`: this is whole-
 * sentence selection ("which kana sentence means X?"), not particle fill.
 */
export function sentenceMcq(opts: {
  id: string;
  prompt: string;
  promptAudioText?: string;
  correctKana: string;
  distractorsKana: [string, string, string];
  explanation?: string;
  /** Course-atom kana exercised by this step (resolves to FSRS atom IDs). */
  exercisedAtomKanas?: string[];
}): MultipleChoiceStep {
  const items = [
    { id: "correct", text: opts.correctKana },
    { id: "opt-1", text: opts.distractorsKana[0] },
    { id: "opt-2", text: opts.distractorsKana[1] },
    { id: "opt-3", text: opts.distractorsKana[2] },
  ];
  const slot = slotFor(opts.id, 4);
  const correct = items.shift()!;
  items.splice(slot, 0, correct);
  return {
    id: opts.id,
    type: "multiple_choice",
    prompt: opts.prompt,
    promptAudioText: opts.promptAudioText,
    options: items,
    correctOptionId: "correct",
    explanation: opts.explanation,
    optionsHideRomaji: true,
    exercisedAtoms: resolveAtomIds(opts.exercisedAtomKanas),
    modality: "production",
  };
}

/**
 * Example self-explanation step (exercise / reference). Follows a
 * particle_cloze about の (possession). Not wired into a shipping lesson
 * yet — authors can import and slot it as needed.
 */
export const EXAMPLE_SELF_EXPLAIN_NO_POSSESSION: SelfExplanationMcqStep =
  selfExplain({
    id: "ja-ex-self-explain-no-1",
    anchorLabel: "You picked の in: わたし＿ ほん (my book)",
    anchorAudioText: "わたしの ほん",
    question: "Why is の correct in 'わたしの ほん'?",
    rule: { text: "の attaches the owner to what they own." },
    surface: { text: "の always comes after a noun." },
    distractor: { text: "の is the question marker." },
    ruleExplanation:
      "の is the possession particle — it links owner (わたし) to thing owned (ほん).",
  });

/**
 * `dialogue_listen` factory — composes a multi-turn audio-only dialogue
 * with 1-3 comprehension MCQs. Each question's options are slot-rotated by
 * id (`slotFor`) so the correct answer doesn't always land in position 0
 * across MCQ steps, matching the rotation contract of `vocabMcq` /
 * `sentenceMcq` / `selfExplain` / `cloze`.
 *
 * Authoring shape mirrors `sentenceMcq`: pass `correctText` + a 3-tuple of
 * `distractors` per question. Factory generates option ids and wires
 * `correctOptionId`.
 *
 * Defaults `transcriptRevealAfter` to `"first-answer"` — the spec's
 * recommendation: hide the kana during the first retrieval attempt
 * (audio-only is the whole point), reveal after the learner has committed
 * once so they can match what they heard to the script.
 *
 * Used as a dialogue closer in M3-M7 sub-lessons (replaces the prior
 * `dialogueLesson` phrase-card-only closer when a real comprehension
 * retrieval is wanted). Counts as 1 step toward sub-lesson density.
 */
export function dialogueListen(opts: {
  id: string;
  /**
   * Dialogue or narrative lines. Speaker is required in `format: "dialogue"`
   * (default) and optional in `format: "narrative"`. Line cap is 1-8 to
   * accommodate single-voice story closers as well as multi-turn exchanges.
   */
  lines: Array<{ speaker?: string; kana: string; audioText?: string }>;
  questions: Array<{
    id: string;
    prompt: string;
    correctText: string;
    distractors: [string, string, string];
    explanation?: string;
  }>;
  transcriptRevealAfter?: "first-answer" | "all-answers" | "never";
  /**
   * `"dialogue"` (default) — speaker chips per line.
   * `"narrative"` — speaker labels suppressed (story prose).
   */
  format?: "dialogue" | "narrative";
  /** Course-atom kana exercised by this step (resolves to FSRS atom IDs). */
  exercisedAtomKanas?: string[];
}): DialogueListenStep {
  const format = opts.format ?? "dialogue";
  if (opts.lines.length < 1 || opts.lines.length > 8) {
    throw new Error(
      `dialogueListen(${opts.id}): lines.length must be 1-8 (got ${opts.lines.length})`,
    );
  }
  if (format === "dialogue" && opts.lines.some((l) => !l.speaker)) {
    throw new Error(
      `dialogueListen(${opts.id}): every line must have a speaker in format "dialogue"`,
    );
  }
  if (opts.questions.length < 1 || opts.questions.length > 3) {
    throw new Error(
      `dialogueListen(${opts.id}): questions.length must be 1-3 (got ${opts.questions.length})`,
    );
  }
  const questions = opts.questions.map((q) => {
    const items = [
      { id: "correct", text: q.correctText },
      { id: "opt-1", text: q.distractors[0] },
      { id: "opt-2", text: q.distractors[1] },
      { id: "opt-3", text: q.distractors[2] },
    ];
    const slot = slotFor(`${opts.id}-${q.id}`, 4);
    const correct = items.shift()!;
    items.splice(slot, 0, correct);
    return {
      id: q.id,
      prompt: q.prompt,
      options: items,
      correctOptionId: "correct",
      explanation: q.explanation,
    };
  });
  return {
    id: opts.id,
    type: "dialogue_listen",
    lines: opts.lines.map((l) => ({
      speaker: l.speaker,
      kana: l.kana,
      audioText: l.audioText,
    })),
    questions,
    transcriptRevealAfter: opts.transcriptRevealAfter ?? "first-answer",
    format,
    exercisedAtoms: resolveAtomIds(opts.exercisedAtomKanas),
    modality: "recognition",
  };
}

/**
 * Example `dialogue_listen` — a 3-turn café exchange ordering coffee.
 * Not wired into a shipping lesson yet; the M3-M7 re-author wave (per
 * docs/wave-4-m3-m7-reauthor-2026-05-18.md) will call `dialogueListen`
 * directly for each module's dialogue closer.
 */
/**
 * Story-comprehension factory — composes a single-voice narrative
 * `dialogue_listen` (recognition) followed by a `build_sentence` response
 * (production). This is the formulaic "hear a short story → answer
 * comprehension MCQs → build the response sentence" pattern Spencer
 * specced as the M8+ canonical L7 closer alternative to dialogueListen.
 *
 * The returned tuple `[dialogue_listen, build_sentence]` is two
 * individually-addressable steps so SRS grading credits the atom set on
 * both halves — recognition on the comprehension, production on the
 * response.
 *
 * Both halves receive the same `exercisedAtomKanas`. If you want
 * different atom sets per half, call dialogueListen + build directly.
 */
export function storyComprehension(opts: {
  idPrefix: string;
  /** 1-8 narrative lines. Speaker labels suppressed (narrative format). */
  narrative: Array<{ speaker?: string; kana: string; audioText?: string }>;
  /** 1-3 comprehension MCQs about the narrative. */
  comprehensionQuestions: Array<{
    id: string;
    prompt: string;
    correctText: string;
    distractors: [string, string, string];
    explanation?: string;
  }>;
  /** The response sentence the learner assembles after answering. */
  responseBuild: {
    target: string;
    tiles: string[];
    correctOrder: string[];
    promptEn: string;
  };
  /** Course-atom kana exercised by the story+response (resolves to FSRS atom IDs). */
  exercisedAtomKanas?: string[];
  /** When to reveal the narrative transcript. Default "first-answer". */
  transcriptRevealAfter?: "first-answer" | "all-answers" | "never";
}): [DialogueListenStep, BuildSentenceStep] {
  const story = dialogueListen({
    id: `${opts.idPrefix}-narrative`,
    lines: opts.narrative,
    questions: opts.comprehensionQuestions.map((q) => ({ ...q })),
    transcriptRevealAfter: opts.transcriptRevealAfter ?? "first-answer",
    format: "narrative",
    exercisedAtomKanas: opts.exercisedAtomKanas,
  });
  const response = build(
    `${opts.idPrefix}-response`,
    opts.responseBuild.promptEn,
    opts.responseBuild.target,
    opts.responseBuild.tiles,
    opts.responseBuild.correctOrder,
    opts.exercisedAtomKanas,
  );
  return [story, response];
}

export const EXAMPLE_DIALOGUE_LISTEN_CAFE: DialogueListenStep = dialogueListen({
  id: "ja-ex-dialogue-listen-cafe",
  lines: [
    { speaker: "Server", kana: "いらっしゃいませ。" },
    { speaker: "You",    kana: "コーヒーを ください。" },
    { speaker: "Server", kana: "はい、ごひゃくえんです。" },
  ],
  questions: [
    {
      id: "q1",
      prompt: "What did the customer order?",
      correctText: "Coffee",
      distractors: ["Green tea", "Water", "Beer"],
      explanation: "コーヒー = coffee. を marks it as the thing being ordered.",
    },
    {
      id: "q2",
      prompt: "How much does it cost?",
      correctText: "500 yen",
      distractors: ["100 yen", "1,000 yen", "5,000 yen"],
      explanation: "ごひゃくえん = 五百円 = 500 yen.",
    },
  ],
});
