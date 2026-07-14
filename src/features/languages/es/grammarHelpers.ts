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
  BuildSentenceStep,
  InfoStep,
  ListeningBuildStep,
  ListeningComprehensionStep,
  MultipleChoiceStep,
  ParticleClozeStep,
  PhraseCardStep,
  SpeakingStep,
  TranslateStep,
  WordImageMcqStep,
} from "@/features/lesson/types";
import { findEsAtomBySurface, type EsAtom } from "./courseAtoms";

// ─── Atom resolution ─────────────────────────────────────────────────────

function resolveAtomId(surface: string): string | undefined {
  return findEsAtomBySurface(surface)?.id;
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
    exercisedAtoms: resolveAtomIds([correctParticle]),
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
    modality: "production",
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

// ─── Speaking ────────────────────────────────────────────────────────────

export function speaking(
  id: string,
  targetPhrase: string,
  translation: string,
  exercisedAtomSurfaces?: string[],
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

// ─── Re-export atom shape for consumers ─────────────────────────────────

export type { EsAtom };
