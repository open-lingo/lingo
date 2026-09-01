/**
 * Korean grammar helpers — thin language-idiomatic wrappers over the
 * generic lesson step types. Mirrors the JA helpers in spirit (same step
 * type names + the same slot-rotation / atom-resolution discipline) but
 * scoped to what KO M1/M2/survival/placement need today.
 *
 * Atom resolution: keyed by Hangul surface (the canonical written form
 * for Korean). `KO_ATOMS_BY_SURFACE` is populated by `courseAtoms.ts`.
 * Unknown surfaces fall through silently — safe default for sentence-
 * level factories that may include particles or function words not yet
 * registered as atoms.
 *
 * Naming convention: every factory uses Hangul-first option ordering
 * (`correctHangul`, `distractorsHangul`) instead of JA's `correctKana`/
 * `distractorsKana` — keeps the call site obvious about what shape it's
 * dealing with. Placement-bank items reuse the JA shape (cloze / sentenceMcq
 * sentence schemas) so the shared `instantiateItem` doesn't need to fork.
 */
import type {
  BuildSentenceStep,
  InfoStep,
  ListeningBuildStep,
  ListeningComprehensionStep,
  MatchPairsStep,
  MultipleChoiceStep,
  ParticleClozeStep,
  PhraseCardStep,
  SpeakingStep,
  TranslateStep,
  WordImageMcqStep,
} from "@/features/lesson/types";
import { getTtsUrl } from "@/shared/tts";
import {
  KO_ATOMS_BY_SURFACE,
  KO_COURSE_ATOMS,
  KO_PARTICLES_BY_SURFACE,
  type KoAtom,
  type KoAtomKind,
} from "./courseAtoms";

// ─── Atom resolution ─────────────────────────────────────────────────────

function resolveAtomId(surface: string): string | undefined {
  return KO_ATOMS_BY_SURFACE.get(surface)?.id;
}

// Particle steps must NOT resolve through the general surface map: 이
// (subject marker) loses that lookup to 이 (the number "two") on
// first-write-wins. Falls back to the general map for anything not
// registered as a particle (e.g. a cloze over a non-particle function word).
function resolveParticleAtomId(surface: string): string | undefined {
  return (KO_PARTICLES_BY_SURFACE.get(surface) ?? KO_ATOMS_BY_SURFACE.get(surface))?.id;
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

// ─── Slot rotation (FNV-1a + Murmur3 finalizer — mirrors JA `slotFor`) ──
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
  romanization: string,
  hangul: string,
  cultureNote?: string,
  opts?: { atomId?: string; emoji?: string },
): PhraseCardStep {
  const atomId = opts?.atomId ?? resolveAtomId(hangul);
  return {
    id,
    type: "phrase_card",
    meaningEn,
    // The shared PhraseCardStep type uses `romaji` for the transliteration
    // slot — KO Revised Romanization is the value carried, just the field
    // name reuses the JA-era label. Renderer treats it as opaque.
    romaji: romanization,
    kana: hangul,
    cultureNote,
    ...(atomId ? { atomId } : {}),
    ...(opts?.emoji ? { emoji: opts.emoji } : {}),
  };
}

export const vocab = phrase;

// ─── Cloze (particle fill) ────────────────────────────────────────────────

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
      `ko cloze(${id}): correctParticle '${correctParticle}' missing from options [${options.join(", ")}]`,
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
    exercisedAtoms: (() => {
      const id = resolveParticleAtomId(correctParticle);
      return id ? [id] : [];
    })(),
    modality: "production",
  };
}

// ─── Sentence MCQ ────────────────────────────────────────────────────────

export function sentenceMcq(opts: {
  id: string;
  prompt: string;
  promptAudioText?: string;
  correctHangul: string;
  distractorsHangul: [string, string, string];
  explanation?: string;
  exercisedAtomSurfaces?: string[];
}): MultipleChoiceStep {
  const items = [
    { id: "correct", text: opts.correctHangul },
    { id: "opt-1", text: opts.distractorsHangul[0] },
    { id: "opt-2", text: opts.distractorsHangul[1] },
    { id: "opt-3", text: opts.distractorsHangul[2] },
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
    // 2026-05-19 — KO STT is wired (Whisper supports it); flip to false to
    // exercise the graded path. The KO mora/normalization pipeline is JA-
    // specific so single-block production steps in M1/M2 still stub.
    // M2/survival/placement use sentence-level targets which flow through
    // Whisper's whole-utterance grader the same way JA dialogue speaking
    // does post-2026-05-18.
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
 * Vocab-by-image MCQ — given the meaning, pick the Hangul tile whose
 * emoji art matches. Pulls a 3-distractor pool from `distractorPool`;
 * any candidate without an `emoji` is filtered out (visual MCQs need art).
 *
 * Throws if the target lacks an emoji or the distractor pool can't fill
 * three slots. Slot-rotated by id like the JA `vocabMcq`.
 */
export function vocabMcq(
  idPrefix: string,
  target: { surface: string; meaningEn: string; emoji?: string },
  distractorPool: { surface: string; emoji?: string }[],
): WordImageMcqStep {
  if (!target.emoji) {
    throw new Error(
      `ko vocabMcq: target '${target.surface}' has no emoji — use listeningBuild or listeningComp instead`,
    );
  }
  const filtered = distractorPool.filter(
    (d) => d.surface !== target.surface && Boolean(d.emoji),
  );
  if (filtered.length < 3) {
    throw new Error(
      `ko vocabMcq: distractor pool for '${target.surface}' has only ${filtered.length} emoji-bearing candidates (need 3)`,
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

// ─── Compounding review (prior-module draw) ──────────────────────────────
//
// KO port of the ES/JA compounding-review machinery (guide §6 — "the #1
// differentiator"; audit 2026-09-01 §2 #5: KO modules never resurfaced
// earlier material except by accident). Unlike ES, KO needs NO generated
// pool snapshot: `courseAtoms.ts` imports nothing from `curriculum/`, so
// there is no import cycle — every atom is registered before any curriculum
// module evaluates, and the live registry is safe to read at lesson-build
// time. If courseAtoms ever grows a curriculum import, port the ES
// `esReviewPool.ts` snapshot pattern instead.

/** Full-width FNV-1a + Murmur3 finalizer (slotFor keeps only `% slots`). */
function hash32(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  h ^= h >>> 16;
  h = Math.imul(h, 0x85ebca6b);
  h ^= h >>> 13;
  h = Math.imul(h, 0xc2b2ae35);
  h ^= h >>> 16;
  return h >>> 0;
}

/** Numeric index for "mN" module ids; -1 for sidequests/undefined (which the
 *  review pool deliberately excludes). */
function koModuleIndex(fromModule: string | undefined): number {
  const m = fromModule ? /^m(\d+)$/.exec(fromModule) : null;
  return m ? Number(m[1]) : -1;
}

export type KoReviewEntry = { atomId: string; surface: string; gloss: string };

/**
 * Deterministically pick up to `n` atoms introduced in modules STRICTLY
 * EARLIER than `beforeModule`. Seeded by `seedId` so two call sites draw
 * different (but stable) samples. Defaults keep the draw honest for review
 * carriers:
 *   - kind "vocab" only, srsEligible, gloss present, single-word surface;
 *   - surfaces are deduped first-write-wins (matches KO_ATOMS_BY_SURFACE);
 *   - glosses are deduped within one draw (a match grid with two identical
 *     targets is unanswerable);
 *   - entries without a manifest TTS clip are skipped (audio-on-select must
 *     never fall back to the platform voice in a review grid).
 */
export function pickReviewEntries(
  seedId: string,
  beforeModule: string,
  n: number,
  opts?: { kinds?: KoAtomKind[]; singleWord?: boolean; requireAudio?: boolean },
): KoReviewEntry[] {
  const cutoff = koModuleIndex(beforeModule);
  if (cutoff < 0) {
    throw new Error(`ko pickReviewEntries(${seedId}): beforeModule '${beforeModule}' is not an mN module id`);
  }
  const kinds = opts?.kinds ?? (["vocab"] as KoAtomKind[]);
  const singleWord = opts?.singleWord ?? true;
  const requireAudio = opts?.requireAudio ?? true;
  const seenSurface = new Set<string>();
  const pool: KoReviewEntry[] = [];
  for (const a of KO_COURSE_ATOMS) {
    const idx = koModuleIndex(a.fromModule);
    if (idx < 0 || idx >= cutoff) continue;
    if (seenSurface.has(a.surface)) continue; // first-write-wins parity
    seenSurface.add(a.surface);
    if (!kinds.includes(a.kind)) continue;
    if (a.srsEligible === false) continue;
    if (!a.gloss) continue;
    if (singleWord && a.surface.includes(" ")) continue;
    if (requireAudio && getTtsUrl(a.surface, "ko") === null) continue;
    pool.push({ atomId: a.id, surface: a.surface, gloss: a.gloss });
  }
  pool.sort((x, y) => hash32(`${seedId}:${x.surface}`) - hash32(`${seedId}:${y.surface}`));
  const out: KoReviewEntry[] = [];
  const seenGloss = new Set<string>();
  for (const e of pool) {
    const g = e.gloss.toLowerCase();
    if (seenGloss.has(g)) continue;
    seenGloss.add(g);
    out.push(e);
    if (out.length >= n) break;
  }
  return out;
}

/** Surfaces-only variant — for feeding prior-module words into cloze /
 *  sentenceMcq / build review carriers. */
export function pickReviewSurfaces(
  seedId: string,
  beforeModule: string,
  n: number,
  opts?: { kinds?: KoAtomKind[]; singleWord?: boolean; requireAudio?: boolean },
): string[] {
  return pickReviewEntries(seedId, beforeModule, n, opts).map((e) => e.surface);
}

/**
 * A prior-module review match_pairs grid (Hangul → meaning, audio on
 * select). Throws when the earlier pool can't fill the grid — a review
 * step that silently shrinks is how coverage rots.
 */
export function reviewMatchPairs(
  idPrefix: string,
  seedId: string,
  beforeModule: string,
  n = 6,
): MatchPairsStep {
  const entries = pickReviewEntries(seedId, beforeModule, n);
  if (entries.length < n) {
    throw new Error(
      `ko reviewMatchPairs(${idPrefix}): pool before ${beforeModule} has only ${entries.length} usable entries (need ${n})`,
    );
  }
  return {
    id: `${idPrefix}-match`,
    type: "match_pairs",
    prompt: "Review — match each word to its meaning",
    playAudioOnSelect: true,
    pairs: entries.map((e, i) => ({ id: `p-${i}`, source: e.surface, target: e.gloss })),
    exercisedAtoms: entries.map((e) => e.atomId),
    modality: "recognition",
  };
}

// ─── Re-export atom shape for consumers ─────────────────────────────────

export type { KoAtom };
