import type { JapaneseAnnotation } from "@/shared/japanese/types";

export type StepType =
  | "info"
  | "multiple_choice"
  | "build_sentence"
  | "match_pairs"
  | "fill_blank"
  | "translate"
  | "listening_comprehension"
  | "listening_build"
  | "speaking"
  | "symbol_intro"
  | "symbol_trace"
  | "symbol_recognition"
  | "symbol_production"
  | "symbol_to_sound"
  | "word_image_mcq"
  | "phrase_card"
  | "grammar_rule"
  | "particle_cloze"
  | "agreement_cloze"
  | "conjugation_cloze"
  | "conjugation_transform"
  | "kanji_reading"
  | "kanji_reveal"
  | "self_explanation_mcq"
  | "dialogue_listen"
  | "dialogue_sim"
  | "row_test";

/**
 * Direction the learner is exercising on this step.
 * - `recognition` — shown stimulus → identify (audio→image MCQ, etc).
 * - `production` — cued meaning → produce target form (English→kana build).
 * - `both` — step exercises both directions equally (used sparingly).
 */
export type StepModality = "recognition" | "production" | "both";

/**
 * Reactive grammar intervention payload (deriveGrammarMicroSteps): when a
 * step carrying this is answered WRONG, the lesson player flashes the
 * point's ✗/✓ contrast plus a one-line rule reminder — once per grammar
 * point per lesson session. Duolingo-Smart-Tips-shaped, but diagnosis
 * comes from the authored anti-pattern, not a translation description.
 */
export type ReactiveGrammarTip = {
  grammarPointId: string;
  title: string;
  ruleLine: string;
  wrongJa: string;
  wrongRomaji?: string;
  rightJa: string;
  rightRomaji?: string;
  why: string;
};

export type StepBase = {
  /** See ReactiveGrammarTip — attached by deriveGrammarMicroSteps. */
  reactiveGrammarTip?: ReactiveGrammarTip;
  id: string;
  type: StepType;
  hint?: string;
  /**
   * Sentence-level "why this is the correct answer" rationale. Surfaced via
   * the `<ExplainButton>` after a wrong submit or 15s dwell. FORBIDDEN on
   * passive steps (phrase_card / info / grammar_rule) — those use their own
   * domain fields (cultureNote / body / rule).
   */
  explanation?: string;
  /**
   * SRS atom IDs this step grades when completed. Populated by graded step
   * factories (vocabMcq, cloze, build, etc.); absent on teach steps so the
   * `shouldWriteSrs(step)` gate skips them. The lesson grading pipeline
   * resolves these to FSRS card states via `setCardState(atomId, …)`.
   *
   * Different from `exercisedAtomIds` on passive steps (Info, GrammarRule,
   * DialogueListen) which tracks passive exposure for review-tail planning,
   * not grading.
   */
  exercisedAtoms?: string[];
  /**
   * Direction this step exercises. Determines which FSRS sub-state advances
   * when the step is graded. Omit to default to `"both"` at the grading
   * pipeline.
   */
  modality?: StepModality;
  /**
   * Track B (grammar SRS) point ids this step drills (e.g. "wa-topic",
   * "te-form"). When present on a graded step in a review lesson, completing
   * it advances the grammar-point's FSRS state via `reviewGrammarPoint`
   * (separate from the vocab `exercisedAtoms` write). Set by the grammar
   * review generator; see `grammarSrs.ts` + `buildSrsReviewLesson`.
   */
  exercisedGrammar?: string[];
};

export type InfoStep = StepBase & {
  type: "info";
  title?: string;
  body: string;
  imageKey?: string;
  variant?: "tip" | "culture" | "grammar" | "default" | "win";
  /** Course-atom ids this info step "teaches" — used by passive-follow-up lint
   *  to verify a same-atom retrieval lands within [i+2, i+3]. */
  exercisedAtomIds?: string[];
};

export type Option = {
  id: string;
  text: string;
  imageKey?: string;
};

export type MultipleChoiceStep = StepBase & {
  type: "multiple_choice";
  prompt: string;
  promptAudioKey?: string;
  promptImageKey?: string;
  options: Option[];
  correctOptionId: string;
  promptAnnotation?: JapaneseAnnotation[];
  optionAnnotations?: (JapaneseAnnotation[] | undefined)[];
  /**
   * When set, looks up TTS for this phrase via the JA manifest and auto-plays
   * 500ms after mount. Used for prompt-audio-driven drills (e.g. "you hear
   * 'mizu' — which kana starts it?").
   */
  promptAudioText?: string;
  /**
   * When true, hides the prompt text and renders a large Play button instead.
   * Forces an audio-first recognition mode where the learner must listen
   * before choosing. Pairs with `promptAudioText`.
   */
  audioOnlyPrompt?: boolean;
  /**
   * When true, option text is rendered raw (no AnnotatedJa ruby helpers).
   * Use on test/quiz cards where the romaji over kana would literally
   * be the answer. Default false keeps the standard mastery-gated helper
   * scaffold for teaching cards.
   */
  optionsHideRomaji?: boolean;
  /**
   * When true, render romaji ruby above kana options ONLY when the
   * option is currently selected (clicked, pre-submit). Deselecting
   * hides it again. Used by the M2 "How do you say X?" translation MCQ
   * so the learner can verify their guess by tapping, but cannot
   * romaji-skim all 4 options at once and bypass the kana entirely
   * (Marcus/Sarah audit, 2026-05-17).
   */
  optionsRevealRomajiOnSelect?: boolean;
};

export type BuildSentenceStep = StepBase & {
  type: "build_sentence";
  prompt: string;
  targetSentence: string;
  tiles: string[];
  correctOrder: string[];
  audioKey?: string;
  granularity: "word" | "character";
  targetAnnotation?: JapaneseAnnotation[];
  /**
   * TRANSFORM MODE (n4-scoping §3 "sentence_transform" verdict: parametrize,
   * don't fork the type). When set, the JA source sentence renders above the
   * tile bank and the learner assembles its transformation (polite↔plain,
   * etc.). `transformLabel` is the short operation chip ("→ casual").
   * Grading, tiles, and audio behavior are unchanged.
   */
  sourceSentence?: string;
  sourceAnnotation?: JapaneseAnnotation[];
  transformLabel?: string;
  /**
   * PICKER MODE. The register ladder compiles to a `build_sentence` whose
   * `tiles` are whole competing utterances and whose `correctOrder` is the one
   * correct utterance — the learner CHOOSES a politeness variant rather than
   * assembling a sentence. (See the `kind === "register"` branch in
   * `moduleCompiler`: it stays a build_sentence so the whole ladder is one
   * step type, and because inv 5 pins `particle_cloze` to introductions.)
   *
   * That shape is indistinguishable from a genuinely broken build — one tile,
   * one slot — so the compiler LABELS it instead of leaving every consumer to
   * re-derive intent from shape. The bulk audit's inv 19 check read all 6 of
   * m10's register beats as single-tile builds for exactly that reason.
   *
   * Rule Zero's sibling: ask the compiler what it built; don't pattern-match
   * the output.
   */
  picker?: boolean;
  /**
   * AUDIENCE CUE (Spencer 2026-07-27). Register questions used to be asked in
   * prose — "You are talking to your teacher, how do you say this?" — which is
   * narration the learner has to parse before they can even start, in the same
   * verbal channel as the Japanese. Instead the addressee is DRAWN: 👵 / 🧑‍🏫 /
   * 👫 above a prompt that says only "Say yes."
   *
   * This is the one thing no competitor does. Register contrast needs the
   * addressee to be a variable the item can vary, and every major course
   * instead tags register in a gloss and drills the form. It works here only
   * because our cast is already 100% register-consistent, so the picture is
   * shorthand for a relationship the learner has genuinely been living in.
   *
   * `audienceLabel` is the accessible name (alt text / screen readers) — never
   * rendered as visible prose, or we would be back to narrating.
   */
  audienceEmoji?: string;
  audienceLabel?: string;
  /**
   * POLITENESS METER, 1–3 — the fading hint (Spencer 2026-07-27: "slowly
   * giving hints and what goes where"). Lifted from Tobira Gateway's 丁寧度
   * star rating, which prints a per-ROLE politeness degree right on the page
   * (`丁寧度 先生★★ 学生★★★`) so the asymmetry is shown rather than explained.
   *
   * 1 = くだけた (plain, to friends) · 2 = 丁寧 (です・ます) · 3 = とても丁寧.
   *
   * Set it on a word's INTRODUCTION and omit it on review surfaces: the
   * scaffold is supposed to disappear once the audience picture alone is
   * doing the work. Never a substitute for the emoji — a bare number is
   * narration in a costume.
   */
  politenessHint?: 1 | 2 | 3;
  /**
   * CHEAT SHEET (Spencer 2026-07-27) — the stage-1 scaffold, mirroring how
   * `conjugation_transform` pins `TransformRuleTable` at STAGE 1 · LEARN and
   * then hides it behind a half-credit 💡 peek at stage 2.
   *
   * Same discipline as that table's `maskBase`: it must NOT print the answer
   * to the card it sits above, or the step is a lookup rather than a recall.
   * For register that means the table shows the cline against EXAMPLE
   * audiences and the card asks about a different one — the learner
   * transfers rather than reads off.
   *
   * Set on a word's first go-around only; drop it once production starts.
   */
  referenceTable?: {
    label: string;
    rows: { cue: string; form: string }[];
  };
  /**
   * SENTENCE FRAME around a single-answer picker — 「せんせい、___。」
   *
   * This is the register picker's production form (Spencer 2026-07-27 picked
   * the vocative-cloze shape). It deliberately does NOT reuse `particle_cloze`:
   * invariant 5 pins that type as an introduction-only device, banned in later
   * modules, and register production is the opposite of an introduction. These
   * are also not particles. Framing the picker instead keeps the whole register
   * ladder — cheat sheet, audience picture, meter, frame — inside ONE step type
   * with different scaffolds switched on and off, which is why inv 5 is
   * untouched rather than carved out.
   *
   * The vocative is the point: 「せんせい、」 names the addressee in JAPANESE,
   * so the cue costs no English narration at all.
   */
  frameBefore?: string;
  frameAfter?: string;
};

export type MatchPair = {
  id: string;
  source: string;
  target: string;
  sourceAnnotation?: JapaneseAnnotation[];
};

export type MatchPairsStep = StepBase & {
  type: "match_pairs";
  prompt: string;
  pairs: MatchPair[];
  /** When true, tapping a source-side tile plays its TTS (kana → audio).
   *  Used by M2 dakuten/yōon match steps where the kana is the recall
   *  cue and audio is the secondary reinforcement channel. Default false
   *  keeps prior behavior on existing M1 match steps. */
  playAudioOnSelect?: boolean;
  /** When true, show romaji above the kana source tiles even in
   *  audio-on-select mode. For scaffolded first-taste surfaces (e.g. the
   *  onboarding preview match) where the learner can't read kana yet and
   *  needs the reading aid; normal lessons keep the default (hidden) so the
   *  romaji doesn't give away the reading. */
  showSourceRomaji?: boolean;
};

export type Blank = {
  id: string;
  correctAnswer: string;
  acceptedAnswers?: string[];
};

export type FillBlankStep = StepBase & {
  type: "fill_blank";
  sentence: string;
  blanks: Blank[];
  wordBank?: string[];
  sentenceAnnotation?: JapaneseAnnotation[];
  /**
   * Suppress the reading helper on the word-bank tiles.
   *
   * Needed the moment the bank holds KANJI options: the tiles render through
   * `AnnotatedText` in bare mode, which floats each word's kana above it — so a
   * bank of 友達 / 家族 / 先生 / 学生 hands over every reading and the learner
   * picks by kana without reading a single kanji. Same class of defect as
   * `optionsHideRomaji` on `multiple_choice`, and the same fix.
   *
   * Leave unset for kana banks, where the helper is the intended scaffold.
   */
  wordBankHideHelper?: boolean;
};

/**
 * Step 1 of the kana→kanji switchover beat (B061) — an UNGRADED introduction of a
 * known word's written form, animated. Emitted only by `buildSrsReviewLesson`,
 * never authored: which word is ready is a per-learner FSRS question, so a static
 * lesson could not know it.
 *
 * Always immediately followed by the graded cloze (`fill_blank`) for the same
 * word. The pair is the beat; neither half stands alone — the reveal has no
 * retrieval and the cloze has no teaching.
 */
export type KanjiRevealStep = StepBase & {
  type: "kanji_reveal";
  /** Course-atom id, so lesson completion knows what to latch. */
  atomId: string;
  /** The reading the learner already knows, e.g. ともだち. */
  kana: string;
  /** The written form being introduced, e.g. 友達. */
  kanji: string;
  gloss: string;
  /**
   * Per-character senses. `null` where the catalog has no honest standalone
   * meaning — 達 is a pluralising suffix, and inventing a gloss for it would
   * teach folk etymology, so the renderer shows a dash instead.
   */
  parts?: { glyph: string; sense: string | null }[];
};

export type TranslateStep = StepBase & {
  type: "translate";
  sourceText: string;
  sourceLanguage: "target" | "native";
  acceptedAnswers: string[];
  audioKey?: string;
  sourceAnnotation?: JapaneseAnnotation[];
};

export type ListeningComprehensionStep = StepBase & {
  type: "listening_comprehension";
  audioKey: string;
  transcript?: string;
  /** Romaji form of `transcript`, shown alongside the kana to reinforce
   * sound↔script correlation. */
  romaji?: string;
  question: string;
  options: Option[];
  correctOptionId: string;
  transcriptAnnotation?: JapaneseAnnotation[];
};

export type ListeningBuildStep = StepBase & {
  type: "listening_build";
  audioKey: string;
  prompt: string;
  targetSentence: string;
  tiles: string[];
  correctOrder: string[];
  granularity: "word" | "character";
  targetAnnotation?: JapaneseAnnotation[];
};

export type SpeakingStep = StepBase & {
  type: "speaking";
  targetPhrase: string;
  translation: string;
  audioKey?: string;
  /**
   * When true, the step is treated as ungraded "I said it!" placeholder
   * (legacy default). When false, the Whisper-backed scorer runs and
   * the learner gets the 2-attempt + reward-the-try flow. Hand-authored
   * consonant rows (M2 g/z/d/b) emit `stubbed: false` as of 2026-05-17
   * R1.3 — Whisper-small + mora tiers + kuroshiro normalization are
   * production-grade.
   */
  stubbed: boolean;
  targetAnnotation?: JapaneseAnnotation[];
};

/** Payload for alphabet steps.
 *
 *  - `romanization`: the user-facing pronunciation (romaji for kana, Revised
 *    Romanization for Hangul, the letter itself for Latin). This is what's
 *    shown to the learner.
 *  - `ipa`: technical phonetic notation — retained for completeness but not
 *    surfaced in the default UI; normal users shouldn't need to read IPA.
 *  - `scriptId`/`hasStrokeOrder`: see {@link SymbolReference} and
 *    `AlphabetDef.hasStrokeOrder`.
 */
export type SymbolStepPayload = {
  symbol: string;
  romanization: string;
  ipa: string;
  hint: string;
  note?: string;
  example?: string;
  audioKey?: string;
  scriptId?: string;
  hasStrokeOrder?: boolean;
};

export type SymbolIntroStep = StepBase & {
  type: "symbol_intro";
  payload: SymbolStepPayload;
};

export type SymbolTraceStep = StepBase & {
  type: "symbol_trace";
  payload: SymbolStepPayload;
  /** Show faded guide (true) or blank canvas (production) */
  showGuide: boolean;
  minCorrectAttempts: number;
  /**
   * Passes already credited to this letter from previous sessions. Used to
   * pre-fill the in-step progress so resumed lessons don't re-require the
   * full minCorrectAttempts when partial trace progress was persisted.
   */
  initialCorrectCount?: number;
};

export type SymbolRecognitionStep = StepBase & {
  type: "symbol_recognition";
  /** Audio plays; user picks correct symbol */
  payload: SymbolStepPayload;
  options: { id: string; symbol: string }[];
  correctOptionId: string;
};

export type SymbolProductionStep = StepBase & {
  type: "symbol_production";
  /** Sound only; user writes symbol from memory. Same as symbol_trace with showGuide: false. */
  payload: SymbolStepPayload;
  minCorrectAttempts: number;
};

export type SymbolToSoundStep = StepBase & {
  type: "symbol_to_sound";
  payload: SymbolStepPayload;
  /**
   * Each option pairs a romaji label with the kana whose audio plays when
   * the user taps it for preview. `symbol` is optional for backward-compat
   * with steps authored before the revamp; missing symbol = no preview.
   */
  options: { id: string; text: string; symbol?: string }[];
  correctOptionId: string;
};

/**
 * Word-discovery MCQ. User reads "What is the word for 'love'?" and picks
 * from a 2×2 grid of square buttons: kana inset top, emoji centered. Tapping
 * a button plays that word's TTS (preview). Then Check commits.
 *
 * Designed for FIRST-encounter vocab teaching — the four words don't have
 * to be introduced yet. The emoji is the primary semantic clue; audio +
 * kana wire the form to that meaning.
 */
export type WordImageMcqStep = StepBase & {
  type: "word_image_mcq";
  /** The english meaning the prompt asks about — e.g. "love". Rendered
   *  bold inside the prompt "What is the word for 'love'?". */
  meaningEn: string;
  options: {
    id: string;
    /** Kana form (the answer text). */
    word: string;
    /** Emoji rendered via Noto Emoji SVG. */
    emoji: string;
  }[];
  correctOptionId: string;
  /**
   * Optional display annotation per option, parallel to `options`. Carries the
   * single-atom `JapaneseAnnotation` for each option's kana word so the kanji
   * post-pass (`applyKanjiSurfaces`, which only rewrites `*Annotation` fields)
   * can substitute the kanji surface at/after the atom's unlock module. Only a
   * display field — the option `id`/`word` (audio + answer matching) are
   * untouched. Mirrors `MultipleChoiceStep.optionAnnotations`.
   */
  optionAnnotations?: (JapaneseAnnotation[] | undefined)[];
};

/**
 * Row-test step (alphabet-streamline). Encapsulates a queue of mc / match /
 * build items drawn from the full row. Missed items get appended to the
 * back of the queue at runtime (max 3 retries per item). Passes at >=
 * `passThreshold` correct out of total seen.
 *
 * The renderer (`RowTestStepView`) wraps the existing step renderers via
 * thin adapters so we don't duplicate UI.
 */
export type RowTestItemMC = {
  kind: "mc";
  payload: MultipleChoiceStep;
};
export type RowTestItemMatch = {
  kind: "match";
  payload: MatchPairsStep;
};
export type RowTestItemBuild = {
  kind: "build";
  payload: BuildSentenceStep;
};
export type RowTestItem = RowTestItemMC | RowTestItemMatch | RowTestItemBuild;

/**
 * Phrasebook exposure card. Teaches a single phrase via meaning-first
 * presentation: large English meaning, medium romaji, kana as decoration.
 * Audio auto-plays on mount. No correct/incorrect — the user reads,
 * hears, and continues. Used in sidequest lessons where the goal is
 * exposure + recognition, not recall.
 */
export type PhraseCardStep = StepBase & {
  type: "phrase_card";
  kana: string;
  romaji: string;
  meaningEn: string;
  cultureNote?: string;
  /** Optional explicit emoji override. When unset, the renderer falls back to
   *  `lookupKanaEmoji(kana)` from `JA_KANA_EMOJI_MAP`. */
  emoji?: string;
  /** Course-atom id this card teaches. Used by passive-follow-up lint to
   *  verify a same-atom retrieval lands within [i+2, i+3]. */
  atomId?: string;
};

/**
 * Grammar Rule Card (M3+). Tae Kim-style explicit teaching: state the rule,
 * show 2 examples, optionally show 1 anti-pattern with a "why wrong" note,
 * optional culture note. No correct/incorrect — exposure card, like
 * `phrase_card`, but structured for grammar rather than vocabulary.
 *
 * Per curriculum-design-v2 (2026-05-16): replaces Duolingo's silent
 * pattern-match. Each Grammar Rule Card is followed by drills in context
 * (typically `particle_cloze` or `multiple_choice`).
 */
export type GrammarExample = {
  ja: string;
  romaji: string;
  en: string;
};

export type GrammarRuleStep = StepBase & {
  type: "grammar_rule";
  title: string;
  rule: string;
  examples: GrammarExample[];
  antiPattern?: GrammarExample & { why: string };
  cultureNote?: string;
  /** Course-atom ids this rule "teaches" — used by passive-follow-up lint
   *  to verify a same-atom retrieval lands within [i+2, i+3]. */
  exercisedAtomIds?: string[];
  /**
   * Track B grammar-point id this rule card teaches (e.g. "wa-topic",
   * "te-form"). Set on the ~93 curriculum grammar_rule cards that map cleanly
   * to exactly one point in `n5-grammar-points.json`. Consumed by
   * `getGrammarRuleStepForPoint` (grammarReviewPools.ts) to show the rule
   * card before a grammar point's FIRST scheduled review in the practice-page
   * session. Cards that don't map cleanly to one point stay untagged.
   */
  grammarPointId?: string;
  /**
   * When this rule card teaches a CONJUGATION (IR grammar point with a
   * `conjugation` block), the ChainForm id ("nai") — the view renders the
   * shared TransformRuleTable (ending → result grid, canonical example per
   * class) instead of leaving the transformations buried in prose
   * (Spencer 2026-07-23).
   */
  conjugationForm?: string;
};

/**
 * Particle Cloze (M3+). Sentence with a blank in the middle; learner
 * picks the correct particle from 4 options. The single highest-leverage
 * grammar drill for Japanese — particles distinguish meaning in ways
 * English speakers consistently get wrong.
 *
 * Layout: prompt = `${before} [ ___ ] ${after}` rendered with AnnotatedJa
 * ruby; 4 particle buttons below. On tap → submit + reveal meaning. The
 * full `audioText` (when provided) plays once the answer commits so the
 * learner hears the assembled sentence with the correct particle.
 */
export type ParticleClozeStep = StepBase & {
  type: "particle_cloze";
  prompt: { before: string; after: string };
  correctParticle: string;
  options: string[];
  meaningEn: string;
  audioText?: string;
};

/**
 * Agreement Cloze (ES). Sentence with MULTIPLE blanks whose fillers must
 * agree in gender/number — "L__ cas__ blanc__s". Each blank carries a
 * small closed option set (agreement endings: o/a/os/as, articles:
 * el/la/los/las); the learner fills every blank, then ONE Check grades
 * the whole set. All-or-nothing by design: agreement is a property of
 * the sentence, not of any single blank.
 *
 * Segments render in order; `text` segments are literal (may end
 * mid-word — blanks are usually endings), `blank` segments render as
 * tappable chip-groups inline.
 */
export type AgreementClozeSegment =
  | { text: string }
  | { blank: { id: string; correctAnswer: string; options: string[] } };

export type AgreementClozeStep = StepBase & {
  type: "agreement_cloze";
  segments: AgreementClozeSegment[];
  meaningEn: string;
  audioText?: string;
};

/**
 * Conjugation Cloze (JA, N4 wave — n4-scoping-2026-07-16 §3 ACCEPT). A
 * sentence with a blank where a CONJUGATED verb form goes, plus a cue
 * naming the dictionary form and the target form ("はなす → て form",
 * optionally an English cue). The learner picks the correctly derived
 * form from 4 options. No other type drills a conjugated form in sentence
 * context: `particle_cloze` is particles only; `fill_blank` is generic
 * free-text with no form logic.
 *
 * ENGINE-BACKED, never hand-authored: the `conjugationCloze` factory
 * (grammarHelpers.ts) derives the correct surface via `conjugateVerb`
 * and the 3 distractors via `generateFormationDistractors` — real
 * wrong-derivation shapes (wrong sound-change, wrong verb class,
 * attach-to-dictionary). Engine-generated NON-WORDS are the sanctioned
 * pedagogy here (this is a derivation drill), which is why Gate 5's
 * invented-form blocklist explicitly exempts this step type.
 *
 * `beforeAnnotation` / `afterAnnotation` carry the sentence halves' ruby
 * data and are named with the `*Annotation` suffix ON PURPOSE: that is
 * the key shape `applyKanjiSurfaces.isAnnotationKey` matches, so the
 * kanji post-pass can rewrite the frame's eligible words while the
 * options / audio / grading fields stay untouched.
 *
 * `audioText` is the full assembled sentence (with the CORRECT form) and
 * plays post-commit only, like `particle_cloze` — pre-commit it would
 * speak the answer.
 */
export type ConjugationClozeStep = StepBase & {
  type: "conjugation_cloze";
  /** Sentence halves around the blank — same shape as ParticleClozeStep. */
  prompt: { before: string; after: string };
  /** Dictionary form of the verb under derivation, e.g. はなす. Shown in
   *  the cue chip; never a valid answer itself. */
  verb: string;
  /** Human label of the target form, e.g. "て form" (CHAIN_FORM_LABELS). */
  formLabel: string;
  /** Machine id of the target form (ChainForm), kept as metadata for
   *  analytics / future grammar-SRS mapping. */
  form: string;
  /** Optional English cue for the blank's meaning, e.g. "want to speak". */
  cueEn?: string;
  /** 4 conjugated surfaces; exactly one is the engine-derived answer. */
  options: { id: string; text: string }[];
  correctOptionId: string;
  meaningEn: string;
  /** Full assembled sentence TTS key. Played post-commit only. */
  audioText?: string;
  /** Ruby data for the sentence halves. `*Annotation`-suffixed so the
   *  kanji post-pass (applyKanjiSurfaces) can rewrite them. */
  beforeAnnotation?: JapaneseAnnotation[];
  afterAnnotation?: JapaneseAnnotation[];
};

/**
 * Conjugation Transform (spec 2026-07-23) — the morphing drill card that
 * teaches the TRANSFORMATION itself (base → form) right after a
 * conjugation rule card, before any sentence work. The card's answer
 * mechanism is decided AT RENDER by the (form × verb-class) mastery cell
 * (`transformCells.ts`): stage 1/2 render MCQ (options below), stage 3
 * renders typed production. The rule table (canonical example per class,
 * たべる/のむ pinned) comes from `transformRulesets.ts` by `form` — it is
 * NEVER authored per-step.
 *
 * `ungraded: true` marks the end-of-lesson "try typing it" tease: always
 * typed, never writes the cell, never touches the streak (stakes wait for
 * consolidation; the act doesn't — research review 2026-07-23).
 */
export type ConjugationTransformStep = StepBase & {
  type: "conjugation_transform";
  /** Dictionary form shown as the prompt, e.g. のむ. */
  base: string;
  /** Per-kana romaji for the base (annotation line). */
  baseRomaji?: string;
  /** Prompt-clarity glosses: "to drink" → "won't drink / don't drink". */
  baseGloss: string;
  targetGloss: string;
  /** ChainForm id ("nai") — keys the mastery cell and the rule table. */
  form: string;
  /** Human form label for the prompt chip, e.g. "ない form". */
  formLabel: string;
  /**
   * Word class — mastery cell axis + rule-table row highlight. `i-adj` (m12
   * / spine s09) is the adjective paradigm riding the same ramp: an
   * い-adjective conjugates like a verb, so it gets its own (form × class)
   * cells rather than a parallel step type.
   */
  verbClass: "ichidan" | "godan" | "irregular" | "i-adj";
  /**
   * Sub-row of the class, for forms whose rule branches INSIDE a class.
   * て/た are the case: every godan verb is class `godan`, but the ending
   * decides the row (う・つ・る→って, む・ぶ・ぬ→んで, く→いて, ぐ→いで,
   * す→して, and いく is its own exception). Without this the rule table can
   * only highlight "う-verbs" and lights all five rows at once — on the one
   * table in the course that most needs precision. Derived by the compiler
   * from the base's final kana; absent for forms with one rule per class.
   */
  subgroup?: string;
  /** Engine-derived correct surface, e.g. のまない. */
  answer: string;
  /** 3 formation distractors (same-verb rule misapplications). */
  distractors: string[];
  /** Ungraded type-tease variant — see type doc. */
  ungraded?: boolean;
};

/**
 * Kanji Reading (JA). Shows a kanji word and asks for its KANA READING —
 * the retrieval beat the kanji ladder was missing (surfaces appeared with
 * furigana but were never tested). Direction is strictly kanji → kana.
 *
 * NOT the inverse: sound → kanji-spelling is the separate, future
 * `audio_spelling_mcq` (lesson-authoring-guide §13.1). Shipped policy is
 * NO kanji production, ever — so every option here is a kana reading and
 * the learner never types or picks a kanji.
 *
 * `promptAnnotation` MUST be authored in the furigana-OFF shape
 * (`surface === reading === kanji`): AnnotatedText floats a reading only
 * when `surface !== reading`, so this is what keeps the answer off the
 * screen. It also makes the annotation invisible to `applyKanjiSurfaces`
 * (whose `hasHan` guard skips already-substituted surfaces), so the rolling
 * furigana window can never re-attach the reading to the tested word. The
 * `kanjiReading` factory emits this shape; author it by hand at your peril.
 *
 * `audioText` is the KANA reading and is spoken ONLY after the learner
 * commits — it is the answer.
 */
export type KanjiReadingStep = StepBase & {
  type: "kanji_reading";
  /** The kanji surface under test, e.g. 水 / 食べる / 電車. */
  kanji: string;
  /** Correct kana reading of `kanji` — the answer. */
  reading: string;
  /** Furigana-OFF ruby data for `kanji`. See the note above. */
  promptAnnotation: JapaneseAnnotation[];
  /** English gloss shown as a disambiguating cue (homographs). */
  meaningEn?: string;
  /** 4 kana readings; exactly one is `reading`. */
  options: { id: string; text: string }[];
  correctOptionId: string;
  /** Kana TTS key. Played post-commit only. */
  audioText?: string;
};

/**
 * Self-explanation MCQ (M3+ metacognitive follow-up). After a learner
 * commits an answer in an upstream step (typically `particle_cloze` or
 * `multiple_choice`), this step asks "Why is that answer correct?" with
 * three reason options:
 *   - `rule`       — correct rule-citing answer.
 *   - `surface`    — wrong-but-plausible heuristic (close miss).
 *   - `distractor` — wrong and unrelated.
 *
 * Backed by Dunlosky 2013 (moderate-utility self-explanation effect).
 * Mechanically a tagged variant of `multiple_choice` whose correct option
 * encodes the rule rather than the surface answer; the `reasonType` tag
 * drives differentiated wrong-answer feedback copy + analytics.
 */
export type SelfExplanationOption = {
  id: string;
  text: string;
  /** "rule" = correct rule-citing answer; "surface" = wrong heuristic
   *  (close miss — fires the "that's the pattern, but the rule is…" copy);
   *  "distractor" = wrong & unrelated. */
  reasonType: "rule" | "surface" | "distractor";
};

export type SelfExplanationMcqStep = StepBase & {
  type: "self_explanation_mcq";
  /** The just-answered fact this is asking the learner to reflect on.
   *  Example: { label: "You picked は in: わたし＿ がくせいです",
   *             audioText: "わたしは がくせいです" } */
  anchor: {
    label: string;
    /** Optional Japanese to TTS as context when the learner taps the
     *  anchor's play button. */
    audioText?: string;
  };
  /** e.g. "Why is は correct here?" */
  question: string;
  options: SelfExplanationOption[];
  correctOptionId: string;
  /** Optional 1-sentence reveal shown after commit (the actual rule). */
  ruleExplanation?: string;
};

/**
 * Dialogue-listen step (M3+). Plays a short 2-4 turn dialogue sequentially
 * (gap between turns), then asks 2-3 comprehension MCQs over the dialogue.
 * No transcript is shown by default — `transcriptRevealAfter` controls when
 * (if ever) the spoken kana lines are revealed as a chat-bubble transcript.
 *
 * Pedagogy: forces audio-only retrieval on a multi-turn exchange. Replaces
 * the prior "phrase cards in sequence" dialogue closer with a real
 * retrieval moment. See docs/n5-content-spec-2026-05-25.md §5.2 +
 * docs/wave-4-m3-m7-reauthor-2026-05-18.md §3.
 */
export type DialogueListenLine = {
  /** Display label for the speaker — "Stranger" / "You" / "Server" / etc.
   *  Optional in `format: "narrative"` (single-voice story prose where
   *  speaker labels would clutter the read). */
  speaker?: string;
  /** Kana form of the line. Used for TTS lookup AND for the transcript
   *  reveal (rendered as a chat bubble alongside the speaker label). */
  kana: string;
  /** Override the kana for TTS lookup when the manifest key differs from
   *  the display kana. Default: `kana`. */
  audioText?: string;
};

export type DialogueListenQuestion = {
  id: string;
  /** English prompt — what is being asked about the dialogue. */
  prompt: string;
  options: Option[];
  correctOptionId: string;
  explanation?: string;
};

export type DialogueListenStep = StepBase & {
  type: "dialogue_listen";
  lines: DialogueListenLine[];
  questions: DialogueListenQuestion[];
  /**
   * When to reveal the dialogue transcript as a chat-bubble list:
   *   - "first-answer" (default): after the first question commits.
   *   - "all-answers": after every question commits.
   *   - "never": transcript never shown.
   */
  transcriptRevealAfter?: "first-answer" | "all-answers" | "never";
  /**
   * Rendering mode:
   *   - "dialogue" (default): multi-turn exchange with speaker chips per line.
   *   - "narrative": single-voice story prose; speaker labels suppressed.
   *
   * Used by the `storyComprehension` factory to render a 1-8 line narrative
   * followed by comprehension questions, distinct from the existing 2-4 line
   * dialogue closer pattern.
   */
  format?: "dialogue" | "narrative";
  /** Course-atom ids exercised by the dialogue's questions. Used by lint /
   *  passive-card followup checks. SEPARATE from `exercisedAtoms` on
   *  StepBase, which drives FSRS grading. */
  exercisedAtomIds?: string[];
};

/**
 * Simulation-dialogue step (`dialogue_sim`) — PROTOTYPE, 2026-07-29.
 *
 * Spencer's ask: "a simulation style dialogue walking you through certain
 * interactions… a playful 'shopfront emoji' — 'worker says: do you need a
 * bag?' — great for travel sprint and overall learning, good to not dumb it
 * down too much." Target surfaces: the Travel Sprint side quest
 * (Pimsleur-style listen-and-respond) and, later, a local-AI TTSD
 * conversational lesson.
 *
 * HOW IT DIFFERS FROM `dialogue_listen`: that step is *comprehension* — the
 * whole exchange plays, then the learner answers MCQs ABOUT it. This one is
 * *participation* — an NPC speaks one turn at a time and the learner IS the
 * other speaker, producing (tile-build) or choosing (MCQ) the reply that
 * moves the scenario forward. The two coexist: listen for comprehension,
 * sim for interaction.
 *
 * ONE STEP = ONE SCENARIO (several turns). Rationale: LessonPage keys one
 * result per step id and `computeGradedProgress` counts one tick per graded
 * step, so a 4-turn scenario split across 4 steps would let the learner
 * exit mid-conversation, would fire the combo/chime 4× on what is one
 * social exchange, and would make the transcript-so-far unreachable across
 * step boundaries. `dialogue_listen` already established the
 * many-questions-inside-one-step shape (it fires `onComplete` once with
 * overall correctness); this follows it.
 *
 * GRADING: see `_stepPredicates.ts` — `dialogue_sim` is deliberately NOT in
 * TEACH_STEP_KINDS (the learner can get a turn wrong, so it is retrieval),
 * but a scenario only writes FSRS when it carries `exercisedAtoms`, which
 * authors add ONLY in review contexts. `exercisedAtomIds` below is the
 * exposure-only channel, same split as `dialogue_listen`.
 */
export type DialogueSimNpcLine = {
  /** Speaker label — MUST be classified in `dialogueSpeakers.json` (inv 23)
   *  or it silently plays the female Nanami voice. */
  speaker: string;
  /** Kana form of the line — TTS lookup + the transcript bubble. */
  kana: string;
  /** Override for TTS lookup when the manifest key differs from the display
   *  kana (the deck is keyed on unspaced text for some phrases). */
  audioText?: string;
  /** English meaning. Revealed with the kana — see `listenFirst`. */
  gloss: string;
};

/**
 * The learner's half of a turn. Two modes, both max-acceptance:
 *
 *  - `build` — tap tiles to produce the reply. Graded through the same
 *    `expandAcceptedAnswers` pipeline the build/translate steps use, so
 *    polite/plain register and particle-phrase scrambles pass, plus any
 *    author-listed `alsoAccepted` rendering (これを ください /
 *    これを おねがいします are both what a person says at a till).
 *  - `choice` — pick a reply. `alsoCorrectOptionIds` exists because a real
 *    interaction has more than one right move: けっこうです and
 *    だいじょうぶです both decline the bag.
 */
export type DialogueSimReply =
  | {
      mode: "build";
      /** Bank tiles, including distractors. Seeded-shuffled per step id. */
      tiles: string[];
      /** Canonical rendering — the model answer shown/played after commit. */
      answer: string;
      /** Additional full renderings accepted verbatim (max-acceptance). */
      alsoAccepted?: string[];
      /** TTS key for the model answer when it differs from `answer`. */
      audioText?: string;
    }
  | {
      mode: "choice";
      options: Option[];
      correctOptionId: string;
      /** Other options that are ALSO right (accepted, no correction). */
      alsoCorrectOptionIds?: string[];
      /** TTS key for the correct option's text, when the manifest differs. */
      audioText?: string;
    };

export type DialogueSimTurn = {
  id: string;
  npc: DialogueSimNpcLine;
  /** English cue for what the learner is trying to accomplish this turn
   *  ("You brought your own bag — turn it down."). This is the prompt; it
   *  never quotes the Japanese answer. */
  goal: string;
  reply: DialogueSimReply;
  /** English gloss of the model reply, shown once the turn commits. */
  replyGloss?: string;
  /** Post-commit rationale (why that reply, why the near-miss is wrong). */
  explanation?: string;
};

export type DialogueSimStep = StepBase & {
  type: "dialogue_sim";
  /** Playful-but-not-childish framing: storefront emoji + scene name. */
  scene: {
    emoji: string;
    title: string;
    /** One-line English situation ("You are buying a drink."). */
    setting?: string;
  };
  turns: DialogueSimTurn[];
  /**
   * Listen-first (Pimsleur mode): the NPC line's kana + gloss stay masked
   * until its clip has played once, the learner taps "Show text", the turn
   * commits, or NO clip exists. That last escape hatch is load-bearing —
   * an un-generated line must never trap the learner behind silence.
   */
  listenFirst?: boolean;
  /** Exposure-only atom tagging (review-tail planning / lint). SEPARATE
   *  from `exercisedAtoms` on StepBase, which drives FSRS grading. */
  exercisedAtomIds?: string[];
};

export type RowTestStep = StepBase & {
  type: "row_test";
  rowId: string;
  items: RowTestItem[];
  /** Pass threshold as a fraction in [0, 1]. Spec default: 0.70. */
  passThreshold: number;
  /** Max times one item can re-enter the back of the queue. Spec default: 3. */
  maxRetries: number;
};

export type LessonStep =
  | InfoStep
  | MultipleChoiceStep
  | BuildSentenceStep
  | MatchPairsStep
  | FillBlankStep
  | TranslateStep
  | ListeningComprehensionStep
  | ListeningBuildStep
  | SpeakingStep
  | SymbolIntroStep
  | SymbolTraceStep
  | SymbolRecognitionStep
  | SymbolProductionStep
  | SymbolToSoundStep
  | WordImageMcqStep
  | PhraseCardStep
  | GrammarRuleStep
  | ParticleClozeStep
  | AgreementClozeStep
  | ConjugationClozeStep
  | ConjugationTransformStep
  | KanjiReadingStep
  | KanjiRevealStep
  | SelfExplanationMcqStep
  | DialogueListenStep
  | DialogueSimStep
  | RowTestStep;

export type LessonContent = {
  id: string;
  moduleId: string;
  courseId: string;
  languageId: string;
  title: string;
  description?: string;
  estimatedMinutes?: number;
  xpReward?: number;
  introducesVocabIds?: string[];
  introducesCardIds?: string[];
  /**
   * Optional content classification. "module_review" lessons are part of
   * the SRS-style review cycle scheduled between module completions —
   * they reuse existing step primitives (cloze + build + dialogue snippets)
   * but are gated/surfaced separately from regular module lessons.
   */
  kind?: "module_review";
  steps: LessonStep[];
};
