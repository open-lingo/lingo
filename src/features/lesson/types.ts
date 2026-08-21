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
  | "pretest_mcq"
  | "tap_the_word"
  | "word_map"
  | "grammar_rule"
  | "particle_cloze"
  | "agreement_cloze"
  | "aspect_choice_cloze"
  | "gender_sort"
  | "stress_pattern"
  | "silent_letter"
  | "agreement_chain"
  | "liaison_listen"
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
/**
 * Learner-INITIATED rule peek ("See the rule"), as distinct from
 * `ReactiveGrammarTip` which the player fires at the learner on an error.
 *
 * Attached to every graded step in a rule card's drill span by
 * `deriveGrammarMicroSteps`, so the learner can re-open the card that taught
 * the thing they are currently being asked to produce. Deliberately budgeted
 * per lesson: an always-available answer key stops being retrieval practice.
 */
export type RuleHint = {
  grammarPointId: string;
  title: string;
  ruleLine: string;
  /** Present when the point is taught by a picture — the peek shows the
   *  interactive scene, not a paragraph. */
  scene?: SceneSpec;
};

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
  /** See RuleHint — attached by deriveGrammarMicroSteps. */
  ruleHint?: RuleHint;
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
  /**
   * Cued-recall mode (ES m1 rework R3, 2026-08-20). When "recall", the
   * reference card leads with the ENGLISH translation as the cue and
   * hides the target phrase behind "Show answer"; audio does not
   * autoplay (it would answer the cue). The target + clip reveal after
   * the first verdict lands or on explicit reveal. Authoring law: the
   * FIRST voicing of any surface is never recall — it keeps the printed
   * form so the learner reads while they hear. Default (undefined) is
   * the classic read-aloud card; the live JA course is untouched.
   */
  cue?: "recall";
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
 * Pretest MCQ — the interactive replacement for `phrase_card` (Spencer,
 * 2026-08-20: passive "show them and have them listen but do nothing"
 * steps feel hollow). The learner is shown a SITUATION in English and
 * guesses which target-language phrase fits, BEFORE the word has been
 * taught; the reveal that follows is the teaching moment.
 *
 * Pedagogy: the pretesting effect (Kornell, Hays & Bjork 2009) — an
 * unsuccessful retrieval attempt before study measurably improves
 * retention over passive presentation, even when the guess is wrong.
 * The guess is therefore SAFE by contract: this is a TEACH step
 * (`TEACH_STEP_KINDS`), it always reports `correct: true`, a wrong pick
 * renders in a soft "not this one" tone rather than error red, and it
 * never writes SRS or the accuracy denominator.
 *
 * ⚠️ LAST RESORT (Spencer 2026-08-20, on QA-walking one): "any narrative
 * card is very miserable to do or use. you have to read a ton just to
 * press one button, when the same thing can be done with a dialogue
 * simulation." The preferred non-imageable debut is a ONE-TURN
 * micro-`dialogue_sim` (es guide §13.2/§13.6) — the situation is shown,
 * not narrated. Use this type only for a debut no sim can frame, and
 * keep `situationEn` to ONE short sentence.
 */
export type PretestMcqStep = StepBase & {
  type: "pretest_mcq";
  /** English situation cue ("Someone hands you a coffee. What do you
   *  say?"). Must never quote or gloss the answer. */
  situationEn: string;
  /** Target-language phrases. Tap previews TTS when a clip exists. */
  options: Option[];
  correctOptionId: string;
  /** The teaching reveal shown after the guess commits. */
  reveal: {
    /** Canonical surface being taught ("mucho gusto"). */
    surface: string;
    meaningEn: string;
    /** Pronunciation / usage note, same register as atom hints. */
    hint?: string;
    /** TTS key when the manifest key differs from `surface`. */
    audioText?: string;
  };
  /** Course-atom id this step teaches — same lint contract as
   *  `phrase_card.atomId` (passive-follow-up spacing). */
  atomId?: string;
};

/**
 * Tap-the-word — active noticing (Spencer, 2026-08-20: "tap the word is
 * perfect… we can also lead them through deductive reasoning"). A real
 * sentence is shown (and plays); the learner taps the word(s) matching an
 * English cue. Turns "read this sentence" exposure into a search task.
 *
 * DEDUCTION CONTRACT (authoring, not code): the cue must be deducible
 * from what's on screen — a cognate («inteligente»), the sentence gloss,
 * morphology the learner can see (the feminine -a), position, or prior
 * context. Never blind luck. `revealNote` names the cue afterward so the
 * deduction pays off as a learned strategy, not a lucky tap.
 *
 * GRADED: unlike `pretest_mcq`, this is retrieval — the learner can be
 * wrong and the standard correctness palette applies. Multi-select when
 * `correctIndices.length > 1` (the view says how many to tap).
 *
 * ⚠️ LENGTH FLOOR (Spencer 2026-08-20, on QA-walking a 3-token one): use
 * this only where FINDING the word in a real sentence is the work —
 * roughly ≥5 tokens. On a short sentence "tap the one you know" is an
 * MCQ in a costume; author the MCQ (or the audio-prompt word MCQ, which
 * needs zero reading).
 */
export type TapTheWordStep = StepBase & {
  type: "tap_the_word";
  /** English instruction carrying the deductive cue ("Tap the word that
   *  means 'intelligent'"). Never quotes the answer's Spanish. */
  prompt: string;
  /** The sentence pre-tokenized into tappable words, in display casing —
   *  bare words only (punctuation lives in `audioText`/gloss). */
  tokens: string[];
  /** Indices into `tokens` that are correct. 1+ (>1 = tap-all-N). */
  correctIndices: number[];
  /** English gloss of the whole sentence — the context that powers
   *  deduction, shown under the tokens. Optional for cue types where the
   *  gloss would give the answer away. */
  meaningEn?: string;
  /** Whole-sentence TTS key; autoplays once + replay button when a clip
   *  exists. */
  audioText?: string;
  /** Post-commit payoff: names the cue that made deduction possible. */
  revealNote?: string;
};

/**
 * Word-map — interlinear sentence mapping (Spencer, 2026-08-20: "similar
 * to match pairs process of elimination, map all the words to the
 * sentence… highlights the english word and THEN they get to pick from
 * the word bank, slowly filling in the translations").
 *
 * The English line is prompted one word at a time (in English order); the
 * learner taps the target-language word it maps to. Solved words lock in
 * with their gloss underneath, so the learner BUILDS an interlinear
 * translation — and the shrinking bank gives the match-pairs
 * process-of-elimination ramp: the last mappings are deducible even when
 * the words are unknown.
 *
 * AUTHORING CONTRACT: use sentences whose words map cleanly. An `en`
 * entry may be a short phrase mapping to ONE token («tengo» ↔ "I have");
 * a token maps to at most one pair. Order divergence is a feature, not a
 * bug — mapping "black" to «negro» AFTER the noun teaches adjective
 * position better than a rule card.
 *
 * GRADED, match-pairs conventions: 3 mistakes fails the step immediately
 * (remaining mappings reveal so the teaching still lands); otherwise
 * completing all pairs reports correct.
 */
export type WordMapPair = {
  /** The English word (or short phrase) as it reads in the English line. */
  en: string;
  /** Index into `tokens` of the word it maps to. Distinct per pair. */
  tokenIndex: number;
};

export type WordMapStep = StepBase & {
  type: "word_map";
  /** Target-language sentence, tokenized in ITS order (display casing,
   *  bare words — punctuation lives in `audioText`). */
  tokens: string[];
  /** The English line in ENGLISH order — also the prompting sequence.
   *  Should cover every token (uncovered tokens act as distractors). */
  pairs: WordMapPair[];
  /** Whole-sentence TTS key; autoplays once + replay when a clip exists.
   *  Solved words also replay their own clip when one exists. */
  audioText?: string;
  /** Post-commit payoff (order divergence, cognates, morphology…). */
  revealNote?: string;
  /**
   * Gender tint per token index (see `shared/language/genderColor.ts`) —
   * a SOLVED chip lights in its gender's hue instead of accent, so an
   * agreement chain («la casa … bonita», all feminine) becomes visible
   * as the mapping fills in. Tint only gendered words: the contrast with
   * untinted invariants is the lesson. Reveal-state only by design —
   * pre-answer tint would train color-reading over word-reading.
   */
  tokenGenders?: Record<number, "m" | "f" | "n">;
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

/**
 * Transfer diagram — the picture behind directional verb sets (JA
 * あげる/くれる/もらう, かす/かりる; the same shape fits おしえる/ならう and
 * いく/くる, and Korean's 주다/받다 later).
 *
 * Deliberately language-agnostic: parties carry a `label`, not kana, and the
 * in-group/out-group captions are authored strings. `features/lesson/` never
 * imports a language (ADR-005).
 *
 * Four facts, each a position or a label rather than a clause of prose:
 *   1. which side of the boundary each party stands on  -> `inside`
 *   2. which way the thing travelled                    -> `from`
 *   3. who the sentence is about                        -> `subject`
 *   4. which party the verb already named, so it drops  -> `hidden`
 */
export type TransferDiagramParty = {
  /** Surface form shown under the figure. */
  label: string;
  /** Small caption under the label when this party is not the subject. */
  gloss: string;
  /** Flat fill. Identity of the party — must be stable across rows. */
  color: string;
  /** Inside the in-group boundary (JA うち). */
  inside: boolean;
};

/**
 * A role on a journey, and the particle that marks it.
 *
 * Language-agnostic on purpose: JA marks these with に/へ/で/から/まで, but
 * "the place you end up", "the thing you travel by" and "where you set out
 * from" are roles any course has to teach, and each language fills the
 * `particle` slot with its own marker.
 */
export type JourneyDiagramSlot = {
  /** The noun that fills the role (a place, a vehicle). */
  label: string;
  /** The marker that assigns the role — rendered in the particle colour. */
  particle: string;
  /** One line: what this slot means, shown when the learner selects it. */
  note: string;
};

/**
 * One traveller, one path, and the roles hung along it.
 *
 * The sibling of `TransferDiagramSpec`, and deliberately NOT the same shape.
 * A transfer moves an OBJECT between two people; a journey moves the SUBJECT
 * along a path. Forcing one renderer to do both would draw a parcel labelled
 * "me" flying between two blobs — see the rollout doc.
 */
export type JourneyDiagramSpec = {
  kind: "journey";
  traveller: { label: string; color: string };
  /** The motion verb, printed at the arrowhead (いく / かえる / くる). */
  verb: string;
  /** Where the journey starts, when the sentence says so (から). */
  origin?: JourneyDiagramSlot;
  /** What you travel BY — drawn on the traveller, not on the path (で). */
  means?: JourneyDiagramSlot;
  /** How far you go, when that is not the destination (まで). */
  limit?: JourneyDiagramSlot;
  /** Where you end up. Every journey has one. */
  destination: JourneyDiagramSlot;
  /**
   * The same destination under a DIFFERENT marker — JA に vs へ. Rendered as a
   * toggle on the destination chip, because the two are near-synonyms and the
   * only way to feel the difference is to swap one for the other in place.
   */
  destinationAlt?: { particle: string; note: string };
};

export type TransferDiagramRow = {
  verb: string;
  /** Which party the arrow leaves. */
  from: "left" | "right";
  leftParticle?: string;
  rightParticle?: string;
  /** Who the sentence is about — the ONLY thing separating verbs that share
   *  an arrow direction (JA くれる vs もらう). Rendered as a ring. */
  subject: "left" | "right";
  /** Party the verb already names, so the sentence drops it. Rendered as a
   *  ghost so the learner sees an absence, not an omission. */
  hidden?: "left" | "right";
  /** One-line takeaway shown under the scene. */
  note: string;
};

export type TransferDiagramSpec = {
  /** Discriminator. Absent on diagrams authored before scenes were a family;
   *  `compileScene` defaults those to "transfer", which is what they are. */
  kind?: "transfer";
  /** In-group caption (JA "うち"). */
  insideLabel: string;
  /** Out-group caption (JA "そと"). */
  outsideLabel: string;
  left: TransferDiagramParty;
  right: TransferDiagramParty;
  /** The thing that moves. Drawn as a GENERIC parcel — never the named atom,
   *  so a rule card can't steal an imageable atom's word_image_mcq debut
   *  (inv 30, the m14 trap). The label names it in text instead. */
  object: { label: string; particle: string };
  rows: TransferDiagramRow[];
};


/* ── The rest of the scene family ────────────────────────────────────────
 *
 * These live here rather than beside their renderers for the same reason
 * `TransferDiagramSpec` does: a scene is AUTHORED in the IR and compiled onto
 * a step, so its shape is data, and the data layer must not import a view.
 */

/** Which drawn figure a register audience falls back to without a portrait. */
export type CastRole = "friend" | "teacher" | "grandmother" | "clerk";

export type TimelineMoment = {
  /** What happens at this point on the clock. */
  label: string;
  /** Wall-clock stamp. Grounds the axis in something concrete. */
  clock: string;
  color: string;
};

export type TimelineFrame = {
  id: string;
  /** Chip label — the connective itself. */
  connective: string;
  /** Clause said FIRST in the sentence, and which moment it names. */
  first: { text: string; at: "early" | "late" };
  /** Clause said SECOND. */
  second: { text: string; at: "early" | "late" };
  /** English of the WHOLE sentence, so the picture only has to teach order. */
  en: string;
  /** Re-label the clock when this connective needs its own events. */
  moments?: { early: TimelineMoment; late: TimelineMoment };
  note: string;
};

/** Said order vs clock order — the fact behind まえに / てから / とき / あとで. */
export type TimelineSpec = {
  kind: "timeline";
  early: TimelineMoment;
  late: TimelineMoment;
  frames: TimelineFrame[];
};

export type ScaleItem = {
  id: string;
  label: string;
  color: string;
  /** Emoji/art URL. Falls back to a plain block when absent. */
  artUrl?: string | null;
  /**
   * IR-authoring only: the emoji to draw when the course's own vocab map has
   * none for `label`. `resolveScene` turns it into `artUrl`; nothing renders
   * this field.
   *
   * It exists because a scale axis is unreadable when one item has a picture
   * and its neighbour is a coloured rectangle — ちゃ carries no emoji in
   * `courseAtoms`, so m26 drew a green block beside a photographic shoe. The
   * course's own art still WINS when it exists, so the picture on the axis
   * stays the picture the learner met on the flashcard.
   */
  emoji?: string;
};

export type ScaleFrame = {
  id: string;
  /** Chip label — the pattern being read off the axis. */
  pattern: string;
  /** Item the sentence is ABOUT. */
  subject: string;
  /** Item supplying the yardstick, when the pattern needs one. */
  against?: string;
  ja: string;
  note: string;
};

/** One axis read three ways — より / いちばん / ほうがいい. */
export type ScaleSpec = {
  kind: "scale";
  /** The adjective the axis measures. */
  dimension: string;
  /** "size" draws rank as size; "count" stacks `rankGlyph` instead, for a
   *  dimension where drawing one item bigger would assert something false. */
  rankAs?: "size" | "count";
  rankGlyph?: string;
  items: ScaleItem[];
  frames: ScaleFrame[];
};

export type RegisterAudienceView = {
  id: string;
  /** Japanese role label — the register cue. */
  ja: string;
  /** Accessible English name; never rendered as prose. */
  label: string;
  color: string;
  /** 1 = くだけた · 2 = 丁寧 (です・ます) · 3 = とても丁寧. */
  politeness: 1 | 2 | 3;
  role: CastRole;
  portraitUrl?: string;
  bowPortraitUrl?: string;
};

/** Who you are talking to, drawn — the bow IS the politeness meter. */
export type RegisterSpec = {
  kind: "register";
  /**
   * What is being said, once per politeness level. Same meaning throughout.
   *
   * PARTIAL on purpose. A three-way ladder needs a level-3 audience, and the
   * course has exactly one (おばあさん, m19) — so an m10 scene is honestly a
   * two-level scene, and inventing a third form to fill the record would be a
   * card teaching Japanese the course does not have. `resolveScene` throws if
   * a named cast member's level has no form, so a gap is loud rather than blank.
   */
  forms: Partial<Record<1 | 2 | 3, string>>;
  /** One line of English — what the learner is trying to say. */
  gloss: string;
  audiences: RegisterAudienceView[];
};

/**
 * Every drawn rule card, tagged.
 *
 * A scene REPLACES the paragraph that was carrying the fact, so the prose it
 * displaces must actually be trimmed — a card that keeps both is longer than
 * the one it replaced. Gated for vocabulary by `sceneVocabGate.test.ts`.
 */
export type SceneSpec =
  | TransferDiagramSpec
  | JourneyDiagramSpec
  | TimelineSpec
  | ScaleSpec
  | RegisterSpec;

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
  /**
   * When this rule card teaches a DIRECTION (a verb set where the choice
   * turns on which way the thing moved), the diagram spec — rendered instead
   * of leaving the direction, the particles and the dropped party buried in
   * prose. Same pattern as `conjugationForm` above.
   */
  scene?: SceneSpec;
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
  /** Ruby data for the sentence halves. `*Annotation`-suffixed so the kanji
   *  post-pass (applyKanjiSurfaces.isAnnotationKey) can rewrite the frame's
   *  eligible words — same contract as ConjugationClozeStep. Until these
   *  existed (2026-08-15) the halves were bare strings, which the pass keys
   *  on `atomId` per segment and therefore could never reach: every cloze
   *  frame in the course rendered kana at every module, 先生 and 母 and 花
   *  included, long after their unlock. The blank itself stays kana — it is
   *  the answer. */
  beforeAnnotation?: JapaneseAnnotation[];
  afterAnnotation?: JapaneseAnnotation[];
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
/**
 * ASPECT CHOICE CLOZE — preterite vs imperfect (es) / passé composé vs
 * imparfait (fr), chosen by DISCOURSE rather than by morphology.
 *
 * Why this is not `conjugation_cloze`. That step derives one correct form from
 * a paradigm: the learner is being asked "can you conjugate this verb". Here
 * BOTH options are perfectly-formed and the sentence is grammatical either
 * way — what differs is what the sentence MEANS. «Cuando era niño, jugaba» and
 * «Cuando fui niño, jugué» are both well-formed Spanish; only one is what a
 * speaker would say. A step whose distractor is morphologically wrong cannot
 * teach that, because the learner can win it without reading the context.
 *
 * Why it is not `particle_cloze` either: the answer depends on the surrounding
 * NARRATIVE, not on the immediate slot, so the item must show several
 * sentences at once and the blanks must be read against each other.
 *
 * This is the A2→B1 wall — the zone where learner attrition concentrates and
 * where, per the 2026-08-09 competitive research, no product engineers a
 * set-piece. It is the one Spanish-specific mechanic that research said needs
 * genuinely new engine logic.
 */
export type AspectChoiceClozeStep = StepBase & {
  type: "aspect_choice_cloze";
  /** Plain-language framing, e.g. "A story about last summer." No theatrics. */
  prompt: string;
  /** English rendering of the whole narrative, shown above the blanks. */
  meaningEn: string;
  /**
   * The narrative, in order. Text segments carry literal prose; blank segments
   * carry a two-way aspect choice. Rendering keeps sentence flow so the
   * learner reads the discourse, which is the entire skill being tested.
   */
  segments: Array<
    | { text: string }
    | {
        blank: {
          id: string;
          /** Infinitive, shown as the cue — the learner picks aspect, not verb. */
          lemma: string;
          /** Exactly two: both must be morphologically correct forms. */
          options: [string, string];
          correctAnswer: string;
          /**
           * WHY this aspect, in discourse terms — "this is the background
           * scene", "this is a completed event that moves the story on".
           * Shown after grading. This is the teaching payload: without it the
           * step is a coin-flip the learner cannot learn from.
           */
          reason: string;
        };
      }
  >;
  /** Whole-narrative audio, played after a correct commit. */
  audioText?: string;
};

/**
 * LIAISON LISTEN — mark where a French phrase links across a word boundary.
 *
 * Genuinely new because nothing in the engine has a concept of a pronunciation
 * that differs from the spelling ACROSS a word boundary. Every existing
 * listening step grades a whole utterance; none can ask "did the final
 * consonant of word 1 attach to word 2". «les amis» is [le.za.mi] and «les
 * héros» is [le.e.ʁo] — same spelling shape, opposite behaviour, and a learner
 * who cannot hear the difference cannot segment spoken French at all.
 *
 * The learner hears the phrase and taps the junctions where linking happened.
 * Junctions are derived from the word list, so a step cannot claim a link at a
 * position that does not exist.
 */
/**
 * GENDER SORT (es / fr). A tray of bare nouns; two gender buckets labelled by
 * the DEFINITE ARTICLE ("el"/"la", "le"/"la"). The learner drops every noun
 * into a bucket, then one Check grades the board.
 *
 * Why this is not `match_pairs`. Match consumes each tile exactly once, so an
 * eight-noun gender set would need eight "el" tiles sitting in the grid — the
 * grid would teach that there are eight masculines rather than one masculine
 * class. Sorting is n:2 and matching is 1:1; they are different shapes, and the
 * ratio IS the fact being taught.
 *
 * Why it is not `agreement_cloze` either. That step asks the learner to make a
 * sentence agree once the gender is already known — «l__ cas__ blanc__s» is
 * unanswerable if you do not know `casa` is feminine. Gender assignment is the
 * PRIOR step, and it is lexical (a property of the word) where agreement is
 * syntactic (a property of the sentence). Conflating them is why learners who
 * can recite the o/a endings still write «el problema» wrong.
 *
 * The step earns its keep on the EXCEPTIONS. A set of transparent -o/-a nouns
 * is a spelling drill the learner can win without knowing any Spanish; the
 * authored sets must carry the words whose ending lies — el problema, el día,
 * la mano, el agua (feminine, masculine article), and for fr le musée, la main.
 * `endingRule` is the after-the-fact generalisation, shown on the review card
 * so the learner leaves with the rule AND its exception list.
 */
/**
 * SILENT LETTER — a written French word, its audio, and the learner taps every
 * letter that is NOT pronounced. «petit» → t. «beaucoup» → p. «ils parlent» →
 * e, n, t.
 *
 * WHY THIS IS NOT `stress_pattern` WITH DIFFERENT DATA. The two look adjacent
 * and are not:
 *   · stress_pattern is SINGLE-select (one syllable carries the stress);
 *     this is MULTI-select, and "how many are silent" is itself unknown to the
 *     learner, so a single-select control would leak the answer's shape.
 *   · stress_pattern operates on SYLLABLES, which are a segmentation the
 *     author supplies; this operates on the raw grapheme sequence, because a
 *     silent letter is a property of a letter, not of a syllable.
 *   · stress_pattern asks what is PROMINENT in speech; this asks what is
 *     ABSENT from it. Grading, feedback wording and the post-commit reveal all
 *     differ accordingly.
 * Parameterizing one type to do both would give it two answer shapes and two
 * grading rules under one name — a fork wearing a shared type's clothes.
 *
 * WHY NOT `multiple_choice`. An option list over spellings shows the learner
 * the letters in question. The whole difficulty of French orthography is
 * deciding, from a word you have never seen, which of ITS OWN letters survive
 * into speech; a step that pre-selects the candidates has removed the task.
 *
 * The audio is the reference, not the stimulus: the word is on screen from the
 * start, so this plays on demand rather than on mount (the opposite of
 * `stress_pattern`).
 */
export type SilentLetterStep = StepBase & {
  type: "silent_letter";
  prompt?: string;
  /** The word as written, one entry per GRAPHEME. Split by the author so
   *  digraphs that behave as a unit («ch», «ou», «eau») stay together — a
   *  learner tapping the «u» of «beaucoup» separately is answering a question
   *  French does not ask. */
  graphemes: string[];
  /** Indices into `graphemes` that are not pronounced. May be empty — a word
   *  with NO silent letter is a legitimate and necessary item, otherwise the
   *  learner learns that every word has one. */
  silentIndices: number[];
  meaningEn: string;
  audioText: string;
  /** The generalisation, revealed post-commit. "Final consonants are usually
   *  silent in French — but c, r, f and l usually survive (CaReFuL)." */
  ruleNote?: string;
  /** A partner word where the SAME letter is pronounced, revealed post-commit.
   *  «petit» / «petite» is the pair that makes the rule make sense. */
  contrast?: { writtenForm: string; meaningEn: string; note?: string };
};

/**
 * AGREEMENT CHAIN — one head noun's gender and number, propagated across every
 * word that must agree with it. The learner sets each slot; the point is that
 * a SINGLE feature choice forces four separate surface changes at once.
 *
 *   les ___ filles sont ___     (petites / contentes)
 *
 * WHY THIS IS NOT n × `agreement_cloze`. Three reasons, and the third is the
 * real one:
 *   · n consecutive agreement_cloze steps trip the "no two adjacent steps
 *     share a type" gate and the 3-selection-run gate immediately.
 *   · Each would be graded independently, so a learner could get the
 *     determiner right and the participle wrong and see two unrelated verdicts
 *     rather than one broken chain.
 *   · Splitting them destroys the lesson. The fact being taught is that the
 *     agreements are NOT independent — they are one decision surfacing in four
 *     places. Presenting them as four questions teaches the opposite.
 *
 * French-specific by construction, but nothing here is French-only: Spanish
 * («las niñas pequeñas están contentas») and Portuguese have the same shape.
 * The type takes the feature labels from the step, not from a language table.
 */
export type AgreementChainStep = StepBase & {
  type: "agreement_chain";
  prompt?: string;
  /** The head noun that governs the chain, shown fixed and un-blanked. */
  head: { surface: string; meaningEn: string; featureLabel: string };
  /** The sentence as an ordered list. A `slot` is a blank the learner fills;
   *  a `fixed` token is printed as-is. */
  tokens: (
    | { kind: "fixed"; text: string }
    | {
        kind: "slot";
        id: string;
        /** Options for THIS slot, in authored order — the view shuffles by a
         *  seed derived from the step id, per the house rule. */
        options: string[];
        correct: string;
        /** What this slot is agreeing in, for the post-commit reveal:
         *  "feminine plural adjective". */
        roleLabel: string;
      }
  )[];
  meaningEn: string;
  audioText?: string;
  /** Revealed post-commit — the one sentence that names the propagation. */
  ruleNote?: string;
};

export type GenderSortStep = StepBase & {
  /** Exactly two buckets: the language's two genders, labelled by article. */
  type: "gender_sort";
  prompt?: string;
  buckets: [
    { id: string; label: string },
    { id: string; label: string },
  ];
  items: {
    id: string;
    /** The BARE noun — never printed with its article, which is the answer. */
    surface: string;
    bucketId: string;
    meaningEn: string;
    /** Post-grading note for this word. Reserve it for the liars. */
    note?: string;
  }[];
  /** Generalisation revealed after grading, e.g. "-o is usually masculine,
   *  -a usually feminine — but -ma words borrowed from Greek are masculine." */
  endingRule?: string;
};

/**
 * STRESS PATTERN (es, and fr for the accent-bearing minority). A word is shown
 * split into SYLLABLES with every written accent stripped; the audio plays; the
 * learner taps the syllable that carries the stress. After grading the card
 * reveals the correctly written form — tilde and all — and the aguda / llana /
 * esdrújula rule that decides whether the accent is written at all.
 *
 * Why no existing type does this. The Spanish written accent is not a spelling
 * fact, it is a STRESS fact with a spelling consequence, and every existing
 * type that could carry it prints the answer: put «habló» in a
 * `multiple_choice` option and the learner reads the tilde instead of hearing
 * the stress. Stripping the accent is the whole mechanic, and it requires
 * sub-word segmentation that no Latin-script step type in the course renders —
 * the `symbol_*` family segments kana glyphs, which is a different unit and a
 * different script.
 *
 * This is the gap m17 hit. Its L5 minimal-pair lesson (hablo / habló) had to be
 * hand-rolled out of generic MCQ steps because the type did not exist, and the
 * hand-rolled version necessarily showed both accented spellings up front.
 *
 * `syllables` MUST be accent-stripped; a written tilde in this array is an
 * authoring error and the view will not repair it. `writtenForm` is the only
 * place the accent appears, and it appears only after the learner has committed.
 */
export type StressPatternStep = StepBase & {
  type: "stress_pattern";
  prompt?: string;
  /** Syllables in order, WITHOUT written accents. The answer must be heard. */
  syllables: string[];
  /** Index into `syllables` of the stressed one. */
  stressedIndex: number;
  /** Correct orthography, revealed post-commit. Carries the tilde if required. */
  writtenForm: string;
  meaningEn: string;
  /** TTS key for the word. Plays on mount and on demand — this step is a
   *  listening task, so the audio is the stimulus, not a reward. */
  audioText: string;
  /** Which rule decides the written accent. Drives the revealed label. */
  accentRule?: "aguda" | "llana" | "esdrujula" | "none";
  /** One-line prose for that rule, shown with the revealed spelling. */
  ruleNote?: string;
  /** A same-spelling, different-stress partner ("hablo" ↔ "habló"), shown in
   *  the reveal so the learner sees what the stress was distinguishing. */
  minimalPair?: { writtenForm: string; meaningEn: string };
};

export type LiaisonListenStep = StepBase & {
  type: "liaison_listen";
  /** Plain instruction. */
  prompt: string;
  /** Text passed to TTS — also the phrase shown after grading. */
  audioText: string;
  meaningEn: string;
  /** The phrase split into words; junctions are the N-1 gaps between them. */
  words: string[];
  /**
   * Indices of junctions (0 = between words[0] and words[1]) where a liaison
   * IS pronounced. Every other junction is silent, including the ones learners
   * over-apply — h aspiré, «et», singular noun + adjective.
   */
  linkedJunctions: number[];
  /** Per-junction explanation, keyed by junction index. Shown after grading. */
  junctionNotes?: Record<number, string>;
};

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
  | PretestMcqStep
  | TapTheWordStep
  | WordMapStep
  | GrammarRuleStep
  | ParticleClozeStep
  | AgreementClozeStep
  | AspectChoiceClozeStep
  | GenderSortStep
  | StressPatternStep
  | SilentLetterStep
  | AgreementChainStep
  | LiaisonListenStep
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
