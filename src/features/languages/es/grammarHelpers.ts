/**
 * Spanish grammar helpers — thin language-idiomatic wrappers over the
 * generic lesson step types. Ports the KO helper set (same step type
 * names + the same slot-rotation / atom-resolution discipline) to ES.
 *
 * Atom resolution: keyed by the Spanish surface form (the canonical
 * written form — Latin script, accents included). Resolution goes through
 * `findEsAtomBySurface` — the cycle-safe accessor over the live
 * `ES_ATOMS_BY_SURFACE` registry in `courseAtoms.ts` (curriculum files
 * build their lessons at import time, so the const map isn't initialized
 * yet when these factories run). Unknown surfaces fall through silently —
 * safe default for sentence-level factories that may include function
 * words not registered as atoms.
 *
 * Naming convention: KO's Hangul-first params (`correctHangul` /
 * `distractorsHangul`) become `correctText` / `distractorsText` — the
 * emitted step objects are shape-identical to KO's; only the ES-facing
 * parameter names change.
 */
import type {
  AgreementClozeStep,
  BuildSentenceStep,
  DialogueListenStep,
  InfoStep,
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
import {
  findEsAtomBySurface,
  type EsAtom,
  type EsAtomKind,
  type EsAtomSource,
} from "./courseAtoms";
import { ES_REVIEW_POOL } from "./esReviewPool";

// ─── Atom resolution ─────────────────────────────────────────────────────

// Static-pool fallback for the courseAtoms↔curriculum import cycle: when a
// curriculum module builds a compounding-review step referencing a PRIOR
// module's surface, that earlier module may not have registered its atoms in
// the live registry yet (the later module's lessons can evaluate first). The
// generated `ES_REVIEW_POOL` snapshot is import-order independent, so gloss /
// id resolution falls back to it. Atom ids are deterministically `es:<surface>`.
const POOL_BY_SURFACE = new Map(ES_REVIEW_POOL.map((e) => [e.surface, e] as const));

/** Resolve a surface's English gloss from the live registry, else the static
 *  review pool. Undefined only for surfaces that are not registered atoms. */
function resolveSurfaceGloss(surface: string): string | undefined {
  return findEsAtomBySurface(surface)?.gloss ?? POOL_BY_SURFACE.get(surface)?.gloss;
}

function resolveAtomId(surface: string): string | undefined {
  const live = findEsAtomBySurface(surface);
  if (live) return live.id;
  return POOL_BY_SURFACE.has(surface) ? `es:${surface}` : undefined;
}

function resolveAtomIds(surfaces: ReadonlyArray<string> | undefined): string[] {
  if (!surfaces?.length) return [];
  const out: string[] = [];
  for (const s of surfaces) {
    const id = resolveAtomId(s);
    if (id) out.push(id);
  }
  return out;
}

// ─── Slot rotation (FNV-1a + Murmur3 finalizer — mirrors KO `slotFor`) ──
// Stable shuffle so the correct answer doesn't always land in position 0.

export function slotFor(id: string, slots: number): number {
  let h = 2166136261;
  for (let i = 0; i < id.length; i++) {
    h ^= id.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  h ^= h >>> 16;
  h = Math.imul(h, 0x85ebca6b);
  h ^= h >>> 13;
  h = Math.imul(h, 0xc2b2ae35);
  h ^= h >>> 16;
  return (h >>> 0) % slots;
}

// ─── Passive-card factories (phrase / vocab) ─────────────────────────────

export function phrase(
  id: string,
  meaningEn: string,
  text: string,
  cultureNote?: string,
  opts?: { atomId?: string; emoji?: string },
): PhraseCardStep {
  const atomId = opts?.atomId ?? resolveAtomId(text);
  return {
    id,
    type: "phrase_card",
    meaningEn,
    // The shared PhraseCardStep type carries `romaji` (transliteration
    // slot) and `kana` (target-script slot) — JA-era field names. Spanish
    // is already Latin script, so the transliteration slot stays empty
    // (spine: leave romanization unset) and `kana` carries the Spanish
    // text. Renderer treats both as opaque.
    romaji: "",
    kana: text,
    cultureNote,
    ...(atomId ? { atomId } : {}),
    ...(opts?.emoji ? { emoji: opts.emoji } : {}),
  };
}

export const vocab = phrase;

// ─── Cloze (function-word fill: articles / preps / conjunctions) ────────

export function cloze(
  id: string,
  before: string,
  after: string,
  correctParticle: string,
  options: string[],
  meaningEn: string,
  audioText: string,
  explanation?: string,
  /** Extra surfaces to credit beyond the correct particle — e.g. the
   *  content noun the blank agrees with. Merged + deduped with
   *  `correctParticle`; trailing-optional so existing call sites keep
   *  their exact positional shape. */
  exercisedAtomSurfaces?: string[],
): ParticleClozeStep {
  const correctIdx = options.indexOf(correctParticle);
  if (correctIdx === -1) {
    throw new Error(
      `es cloze(${id}): correctParticle '${correctParticle}' missing from options [${options.join(", ")}]`,
    );
  }
  let rotated = options;
  const targetSlot = slotFor(id, options.length);
  if (correctIdx !== targetSlot) {
    const without = options.filter((_, i) => i !== correctIdx);
    rotated = [
      ...without.slice(0, targetSlot),
      correctParticle,
      ...without.slice(targetSlot),
    ];
  }
  return {
    id,
    type: "particle_cloze",
    prompt: { before, after },
    correctParticle,
    options: rotated,
    meaningEn,
    audioText,
    explanation,
    exercisedAtoms: [
      ...new Set(
        resolveAtomIds([correctParticle, ...(exercisedAtomSurfaces ?? [])]),
      ),
    ],
    modality: "production",
  };
}

// ─── Agreement cloze (multi-blank gender/number agreement) ──────────────

/**
 * `agreement_cloze` factory — sentence with 1+ blanks whose fillers must
 * agree in gender/number ("L__ cas__ blanc__s"). Each blank's options are
 * slot-rotated INDEPENDENTLY (keyed `${id}-${blank.id}`) so identical
 * option sets across blanks don't land the correct ending in the same
 * position — authors pass options in any fixed order, never pre-shuffled.
 *
 * `exercisedAtomSurfaces` may be empty/omitted: the step still grades
 * (all blanks as a set) but writes no SRS state — `shouldWriteSrs` gates
 * on a non-empty `exercisedAtoms`.
 */
export function agreementCloze(
  id: string,
  segments: AgreementClozeStep["segments"],
  meaningEn: string,
  audioText?: string,
  exercisedAtomSurfaces?: string[],
): AgreementClozeStep {
  if (!segments.some((seg) => "blank" in seg)) {
    throw new Error(`es agreementCloze(${id}): segments contain no blanks`);
  }
  const rotated = segments.map((seg) => {
    if ("text" in seg) return seg;
    const { id: blankId, correctAnswer, options } = seg.blank;
    const correctIdx = options.indexOf(correctAnswer);
    if (correctIdx === -1) {
      throw new Error(
        `es agreementCloze(${id}): blank '${blankId}' correctAnswer '${correctAnswer}' missing from options [${options.join(", ")}]`,
      );
    }
    const targetSlot = slotFor(`${id}-${blankId}`, options.length);
    if (correctIdx === targetSlot) return seg;
    const without = options.filter((_, i) => i !== correctIdx);
    return {
      blank: {
        id: blankId,
        correctAnswer,
        options: [
          ...without.slice(0, targetSlot),
          correctAnswer,
          ...without.slice(targetSlot),
        ],
      },
    };
  });
  return {
    id,
    type: "agreement_cloze",
    segments: rotated,
    meaningEn,
    audioText,
    exercisedAtoms: resolveAtomIds(exercisedAtomSurfaces ?? []),
    modality: "production",
  };
}

// ─── Sentence MCQ ────────────────────────────────────────────────────────

export function sentenceMcq(opts: {
  id: string;
  prompt: string;
  promptAudioText?: string;
  correctText: string;
  distractorsText: [string, string, string];
  explanation?: string;
  exercisedAtomSurfaces?: string[];
}): MultipleChoiceStep {
  const items = [
    { id: "correct", text: opts.correctText },
    { id: "opt-1", text: opts.distractorsText[0] },
    { id: "opt-2", text: opts.distractorsText[1] },
    { id: "opt-3", text: opts.distractorsText[2] },
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
    exercisedAtoms: resolveAtomIds(opts.exercisedAtomSurfaces),
    // Tap-one-of-N is RECOGNITION by the SRS engine's own semantics — the
    // same call vocabTextMcq (also multiple_choice) already makes. This said
    // "production" until 2026-08-19, so every sentenceMcq success advanced an
    // atom's production sub-state without one production act. (JA never faces
    // the question: inv 28 bans full-sentence MCQs from teaching lessons.)
    modality: "recognition",
  };
}

// ─── Build / translate / listening (sentence-level) ──────────────────────

export function build(
  id: string,
  prompt: string,
  target: string,
  tiles: string[],
  correctOrder: string[],
  exercisedAtomSurfaces?: string[],
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
    exercisedAtoms: resolveAtomIds(exercisedAtomSurfaces),
    modality: "production",
  };
}

export function translateStep(opts: {
  id: string;
  promptEn: string;
  acceptedAnswers: string[];
  audioText?: string;
  exercisedAtomSurfaces?: string[];
}): TranslateStep {
  return {
    id: opts.id,
    type: "translate",
    sourceText: opts.promptEn,
    sourceLanguage: "native",
    acceptedAnswers: opts.acceptedAnswers,
    audioKey: opts.audioText,
    exercisedAtoms: resolveAtomIds(opts.exercisedAtomSurfaces),
    modality: "production",
  };
}

export function listeningBuildSentence(opts: {
  id: string;
  target: string;
  tiles: string[];
  correctOrder: string[];
  promptEn: string;
  exercisedAtomSurfaces?: string[];
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
    exercisedAtoms: resolveAtomIds(opts.exercisedAtomSurfaces),
    modality: "production",
  };
}

export function listeningCompSentence(opts: {
  id: string;
  audioText: string;
  correctMeaningEn: string;
  distractorsEn: [string, string, string];
  question?: string;
  exercisedAtomSurfaces?: string[];
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
    question: opts.question ?? "What does this sentence mean?",
    options: items,
    correctOptionId: "correct",
    exercisedAtoms: resolveAtomIds(opts.exercisedAtomSurfaces),
    modality: "recognition",
  };
}

// ─── Match pairs (vocab review grid) ─────────────────────────────────────

/**
 * `match_pairs` factory — Spanish surface ↔ English gloss, resolved from
 * the atom registry (mirrors JA `reviewMatchPairs`, minus the ruby
 * annotation Latin script doesn't need). Tap-source plays TTS so the grid
 * doubles as listening reinforcement.
 *
 * Every surface must be a registered atom (the gloss side comes from the
 * registry, so an unknown surface has no pair to render) — throws, unlike
 * the sentence-level factories' silent fall-through. ≥6 pairs is the
 * house ratchet floor.
 */
export function matchPairs(
  idPrefix: string,
  surfaces: string[],
): MatchPairsStep {
  if (surfaces.length < 6) {
    throw new Error(
      `es matchPairs(${idPrefix}): needs >= 6 surfaces (got ${surfaces.length})`,
    );
  }
  const pairs = surfaces.map((s, i) => {
    const gloss = resolveSurfaceGloss(s);
    if (!gloss) {
      throw new Error(
        `es matchPairs(${idPrefix}): surface '${s}' is not a registered atom`,
      );
    }
    return { id: `p-${i}`, source: s, target: gloss };
  });
  return {
    id: `${idPrefix}-match`,
    type: "match_pairs",
    prompt: "Match each Spanish word to its meaning",
    playAudioOnSelect: true,
    pairs,
    exercisedAtoms: resolveAtomIds(surfaces),
    modality: "recognition",
  };
}

/**
 * Registry-free `match_pairs` variant for grids that reference OTHER
 * modules' vocabulary (the m16 capstone). `matchPairs` resolves glosses
 * from the live registry at module-evaluation time, which throws whenever
 * a referenced module sits suspended mid-import-cycle (any test entry
 * point that imports a curriculum module directly). Glosses are supplied
 * inline instead, and exercisedAtoms are constructed from the atom-id
 * contract (`es:<surface>`) without a lookup. Keep glosses byte-identical
 * to the owning atom's meaningEn.
 */
export function capstoneMatchPairs(
  idPrefix: string,
  entries: Array<{ surface: string; gloss: string }>,
): MatchPairsStep {
  if (entries.length < 6) {
    throw new Error(
      `es capstoneMatchPairs(${idPrefix}): needs >= 6 entries (got ${entries.length})`,
    );
  }
  return {
    id: `${idPrefix}-match`,
    type: "match_pairs",
    prompt: "Match each Spanish word to its meaning",
    playAudioOnSelect: true,
    pairs: entries.map((e, i) => ({ id: `p-${i}`, source: e.surface, target: e.gloss })),
    exercisedAtoms: entries.map((e) => `es:${e.surface}`),
    modality: "recognition",
  };
}

// ─── Dialogue listen ─────────────────────────────────────────────────────

/**
 * `dialogue_listen` factory — multi-turn audio-only dialogue with 1-3
 * comprehension MCQs. Clones the JA factory's semantics: question options
 * are slot-rotated by `${id}-${q.id}`, transcript defaults to revealing
 * after the first answer, lines capped at 1-8 with speaker required.
 *
 * The shared step type's `kana` slot carries each line's Spanish text —
 * Latin text renders bare through the annotation component.
 */
export function dialogueListen(opts: {
  id: string;
  lines: Array<{ speaker: string; text: string; audioText?: string }>;
  questions: Array<{
    id: string;
    prompt: string;
    correctText: string;
    distractors: [string, string, string];
    explanation?: string;
  }>;
  transcriptRevealAfter?: "first-answer" | "all-answers" | "never";
  exercisedAtomSurfaces?: string[];
}): DialogueListenStep {
  if (opts.lines.length < 1 || opts.lines.length > 8) {
    throw new Error(
      `es dialogueListen(${opts.id}): lines.length must be 1-8 (got ${opts.lines.length})`,
    );
  }
  if (opts.lines.some((l) => !l.speaker)) {
    throw new Error(
      `es dialogueListen(${opts.id}): every line must have a speaker`,
    );
  }
  if (opts.questions.length < 1 || opts.questions.length > 3) {
    throw new Error(
      `es dialogueListen(${opts.id}): questions.length must be 1-3 (got ${opts.questions.length})`,
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
      kana: l.text,
      audioText: l.audioText,
    })),
    questions,
    transcriptRevealAfter: opts.transcriptRevealAfter ?? "first-answer",
    format: "dialogue",
    exercisedAtoms: resolveAtomIds(opts.exercisedAtomSurfaces),
    modality: "recognition",
  };
}

// ─── Speaking ────────────────────────────────────────────────────────────

export function speaking(
  id: string,
  targetPhrase: string,
  translation: string,
  exercisedAtomSurfaces?: string[],
  /** "recall" = cued recall: English cue shown, Spanish hidden until the
   *  first verdict (or explicit reveal), no autoplay. NEVER the first
   *  voicing of a surface — that one keeps the printed form (§13.9). */
  cue?: "recall",
): SpeakingStep {
  return {
    id,
    type: "speaking",
    targetPhrase,
    translation,
    // Whisper supports Spanish; graded path enabled from day one (same
    // whole-utterance grader flow the KO sentence-level targets use).
    stubbed: false,
    audioKey: targetPhrase,
    exercisedAtoms: resolveAtomIds(exercisedAtomSurfaces),
    modality: "production",
    ...(cue ? { cue } : {}),
  };
}

// ─── Info / vocab MCQ ────────────────────────────────────────────────────

export function infoStep(
  id: string,
  title: string,
  body: string,
  variant: InfoStep["variant"] = "default",
): InfoStep {
  return { id, type: "info", title, body, variant };
}

/**
 * Vocab-by-image MCQ — given the meaning, pick the Spanish tile whose
 * emoji art matches. Pulls a 3-distractor pool from `distractorPool`;
 * any candidate without an `emoji` is filtered out (visual MCQs need art).
 *
 * Throws if the target lacks an emoji or the distractor pool can't fill
 * three slots. Slot-rotated by id like the KO `vocabMcq`.
 */
export function vocabMcq(
  idPrefix: string,
  target: { surface: string; meaningEn: string; emoji?: string },
  distractorPool: { surface: string; emoji?: string }[],
): WordImageMcqStep {
  if (!target.emoji) {
    throw new Error(
      `es vocabMcq: target '${target.surface}' has no emoji — use listeningBuild or listeningComp instead`,
    );
  }
  const filtered = distractorPool.filter(
    (d) => d.surface !== target.surface && Boolean(d.emoji),
  );
  if (filtered.length < 3) {
    throw new Error(
      `es vocabMcq: distractor pool for '${target.surface}' has only ${filtered.length} emoji-bearing candidates (need 3)`,
    );
  }
  const slot = slotFor(idPrefix, 4);
  const picks = filtered.slice(0, 3);
  const options: { id: string; word: string; emoji: string }[] = [];
  let di = 0;
  for (let i = 0; i < 4; i++) {
    if (i === slot) {
      options.push({ id: "correct", word: target.surface, emoji: target.emoji });
    } else {
      const d = picks[di++];
      options.push({ id: `opt-${i}`, word: d.surface, emoji: d.emoji! });
    }
  }
  return {
    id: idPrefix,
    type: "word_image_mcq",
    meaningEn: target.meaningEn,
    options,
    correctOptionId: "correct",
    exercisedAtoms: resolveAtomIds([target.surface]),
    modality: "recognition",
  };
}

/**
 * Text-front vocab MCQ — the no-emoji alternative to `vocabMcq`. Prompt
 * asks for the target's gloss ("Which word means "house"?"); options are
 * plain Spanish surfaces, slot-rotated by id. Use when the word has no
 * honest visual referent (abstract vocab, function-ish words).
 *
 * Target must be a registered atom (the default prompt needs its gloss);
 * distractors are display-only strings and need no registry entry.
 */
export function vocabTextMcq(
  id: string,
  targetSurface: string,
  distractorSurfaces: string[],
  promptOverride?: string,
): MultipleChoiceStep {
  const gloss = resolveSurfaceGloss(targetSurface);
  if (!gloss) {
    throw new Error(
      `es vocabTextMcq(${id}): target '${targetSurface}' is not a registered atom`,
    );
  }
  const distractors = distractorSurfaces.filter((s) => s !== targetSurface);
  if (distractors.length < 3) {
    throw new Error(
      `es vocabTextMcq(${id}): needs >= 3 distractors distinct from the target (got ${distractors.length})`,
    );
  }
  const items = [
    { id: "correct", text: targetSurface },
    { id: "opt-1", text: distractors[0] },
    { id: "opt-2", text: distractors[1] },
    { id: "opt-3", text: distractors[2] },
  ];
  const slot = slotFor(id, 4);
  const correct = items.shift()!;
  items.splice(slot, 0, correct);
  return {
    id,
    type: "multiple_choice",
    prompt: promptOverride ?? `Which word means "${gloss}"?`,
    options: items,
    correctOptionId: "correct",
    optionsHideRomaji: true,
    exercisedAtoms: resolveAtomIds([targetSurface]),
    modality: "recognition",
  };
}

// ─── Self-explanation MCQ (metacognitive "why is this right") ────────────

/**
 * `self_explanation_mcq` factory — the metacognitive beat JA lands at
 * position N-1 of every grammar-drill lesson (guide §5.3). Anchor the
 * learner to a form they JUST committed, then ask "why?" with three
 * reason options: `rule` (correct), `surface` (a plausible near-rule /
 * heuristic — the "that's the pattern, but the rule is deeper" miss), and
 * `distractor` (a rule-citing-but-wrong statement, NOT obvious nonsense —
 * see guide §5.4). Slot-rotated so the rule isn't always first.
 *
 * Not an SRS-writing step (no `exercisedAtoms`) — it reflects on retrieval,
 * it doesn't add a new one. Place it AFTER 2-3 commits on the target form.
 */
export function selfExplain(opts: {
  id: string;
  /** The just-committed fact, e.g. "You wrote: la casa es bonita". */
  anchorLabel: string;
  anchorAudioText?: string;
  question: string;
  rule: { text: string };
  surface: { text: string };
  distractor: { text: string };
  ruleExplanation?: string;
}): SelfExplanationMcqStep {
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
    anchor: { label: opts.anchorLabel, audioText: opts.anchorAudioText },
    question: opts.question,
    options,
    correctOptionId: `${opts.id}-rule`,
    ruleExplanation: opts.ruleExplanation,
  };
}

// ─── Compounding review (prior-module atom picker) ───────────────────────

export const ES_MODULE_ORDER: EsAtomSource[] = [
  // 2026-08-21: the July m1–m19 wave was archived; the §13-doctrine course
  // restarts at m1/m2. m3+ appends here as the re-authoring lands.
  "m1",
  "m2",
];

function moduleIndex(m: EsAtomSource): number {
  const i = ES_MODULE_ORDER.indexOf(m);
  // An unlisted module used to return -1, which reads as "nothing is earlier
  // than this" and quietly empties every review draw in the module. m17 hit
  // exactly that: capstoneMatchPairs("es-m17-1-rev-mp") came back with 0 entries
  // and surfaced as a capstone-grid arity error three frames away from the
  // cause. A new module must be added here, and forgetting must say so.
  if (i === -1) {
    throw new Error(
      `es moduleIndex: "${m}" is not in ES_MODULE_ORDER — add it when you add the module`,
    );
  }
  return i;
}

function hash32(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  h ^= h >>> 16;
  h = Math.imul(h, 0x85ebca6b);
  h ^= h >>> 13;
  h = Math.imul(h, 0xc2b2ae35);
  h ^= h >>> 16;
  return h >>> 0;
}

type ReviewEntry = { surface: string; gloss: string };

/**
 * Deterministically pick `n` entries from atoms introduced in modules
 * STRICTLY EARLIER than `beforeModule` — the compounding-review draw JA
 * gets from `pickReviewAtoms` (guide §6, "the #1 differentiator").
 *
 * Reads the STATIC `ES_REVIEW_POOL` (a generated snapshot), NOT the live
 * `courseAtoms` registry: the courseAtoms↔curriculum import cycle can build
 * a later module's lessons before an earlier module has registered its
 * atoms, so a registry read here returns an empty pool and throws (the same
 * cycle `capstoneMatchPairs` sidesteps). The static table is import-order
 * independent. Seed the picker with a per-lesson id so two lessons draw
 * different (stable) samples. Default: single-word vocab/particle entries.
 */
function pickReviewEntries(
  seedId: string,
  beforeModule: EsAtomSource,
  n: number,
  opts?: { singleWord?: boolean; kinds?: EsAtomKind[]; includePhrases?: boolean },
): ReviewEntry[] {
  const cutoff = moduleIndex(beforeModule);
  const singleWord = opts?.singleWord ?? true;
  const kinds = opts?.kinds ?? (opts?.includePhrases ? undefined : (["vocab", "particle"] as EsAtomKind[]));
  const pool = ES_REVIEW_POOL.filter((a) => {
    if (moduleIndex(a.fromModule as EsAtomSource) >= cutoff) return false;
    if (singleWord && a.surface.includes(" ")) return false;
    if (kinds && !kinds.includes(a.kind as EsAtomKind)) return false;
    return true;
  });
  // Stable shuffle keyed by (seed, surface) so the sample is deterministic
  // but varies lesson-to-lesson.
  pool.sort((a, b) => hash32(`${seedId}:${a.surface}`) - hash32(`${seedId}:${b.surface}`));
  const seen = new Set<string>();
  const out: ReviewEntry[] = [];
  for (const a of pool) {
    if (seen.has(a.surface)) continue;
    seen.add(a.surface);
    out.push({ surface: a.surface, gloss: a.gloss });
    if (out.length >= n) break;
  }
  return out;
}

/** Surfaces-only variant — for feeding prior-module words into `cloze` /
 *  `sentenceMcq` / `build` review carriers. */
export function pickReviewSurfaces(
  seedId: string,
  beforeModule: EsAtomSource,
  n: number,
  opts?: { singleWord?: boolean; kinds?: EsAtomKind[]; includePhrases?: boolean },
): string[] {
  return pickReviewEntries(seedId, beforeModule, n, opts).map((e) => e.surface);
}

/**
 * Convenience: a prior-module review `match_pairs` grid. Draws `n` (≥6)
 * earlier-module single-word entries and builds the grid with INLINE glosses
 * (via `capstoneMatchPairs`) so it never touches the live registry — safe at
 * import time. Only call from m2+ where the earlier pool is large enough.
 */
export function reviewMatchPairs(
  idPrefix: string,
  seedId: string,
  beforeModule: EsAtomSource,
  n = 6,
): MatchPairsStep {
  return capstoneMatchPairs(idPrefix, pickReviewEntries(seedId, beforeModule, n));
}

// ─── Re-export atom shape for consumers ─────────────────────────────────

export type { EsAtom };
