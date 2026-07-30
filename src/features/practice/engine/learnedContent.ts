/**
 * learnedContent — the learner's REAL learned state, language-agnostically.
 *
 * The single read surface the practice engine (and the four surfaces) use to
 * answer "what does this learner actually know, and how well?". It unions the
 * unlock ladder (`getUnlockedAtomIds`) with FSRS-6 SRS state and the POS/reading/
 * meaning carried by the dictionary service — so it needs zero per-language code.
 *
 * Stores are injectable for tests via {@link LearnerStores}; omitted fields read
 * the real localStorage-backed stores.
 */
import { getDictionaryEntries } from "@/shared/dictionary";
import {
  getSRSStore,
  isDue,
  isNew,
  isMastered,
  cardMaxDifficulty,
} from "@/features/flashcards/engine";
import { getActiveGrammarPoints } from "@/features/flashcards/engine/grammarSrs";
import { getUnlockedAtomIds } from "@/features/lesson/data/unlockLessonAtoms";
import type { SRSCardState } from "@/features/flashcards/data/types";
import type { PartOfSpeech } from "@/shared/language/types";
import type { KnownAtom, KnownTier, LearnerStores } from "./types";

export interface KnownQueryOptions {
  stores?: LearnerStores;
}

interface ResolvedStores {
  unlocked: ReadonlySet<string>;
  srs: Record<string, SRSCardState>;
}

function resolveStores(stores?: LearnerStores): ResolvedStores {
  return {
    unlocked: stores?.unlocked ?? getUnlockedAtomIds(),
    srs: stores?.srs ?? getSRSStore(),
  };
}

/** Parse `m7` → 7; non-numeric modules (`future`, `sidequest-*`, undefined) → 0. */
function moduleNumber(m: string | undefined): number {
  if (!m) return 0;
  const match = /^m(\d+)$/.exec(m);
  return match ? Number(match[1]) : 0;
}

/** SRS tier of a card (or a never-seen unlocked atom → `new`). */
function tierOf(state: SRSCardState | undefined): KnownTier {
  if (!state || isNew(state)) return "new";
  if (isMastered(state)) return "mastered";
  if (state.recognition.state === "review" || state.production.state === "review") {
    return "reviewing";
  }
  return "learning";
}

/**
 * Reinforcement weight. Base 1 for any known atom; due and high-difficulty
 * (struggling) atoms weigh more so the filler drills them preferentially;
 * mastered-and-not-due atoms weigh less.
 */
function weightOf(state: SRSCardState | undefined, tier: KnownTier, due: boolean): number {
  let w = 1;
  if (due) w += 3;
  const difficulty = state ? cardMaxDifficulty(state) : 0;
  if (difficulty >= 7) w += 2;
  else if (difficulty >= 5) w += 1;
  if (tier === "mastered" && !due) w *= 0.5;
  return w;
}

function toKnownAtom(
  entry: { id: string; surface: string; reading: string; meaningEn: string; pos: PartOfSpeech },
  state: SRSCardState | undefined,
): KnownAtom {
  const due = state ? isDue(state) : false;
  const tier = tierOf(state);
  return {
    id: entry.id,
    surface: entry.surface,
    reading: entry.reading,
    meaningEn: entry.meaningEn,
    pos: entry.pos,
    tier,
    due,
    weight: weightOf(state, tier, due),
  };
}

/**
 * Known atoms (unlocked) for a language, optionally filtered to one or more
 * parts of speech, each enriched with its SRS tier / due flag / reinforcement
 * weight. Only atoms the learner has actually unlocked are returned — a
 * brand-new learner gets the little they have (never a crash).
 */
export function getKnownAtomsByPos(
  languageId: string,
  pos?: PartOfSpeech | PartOfSpeech[] | null,
  opts?: KnownQueryOptions,
): KnownAtom[] {
  const { unlocked, srs } = resolveStores(opts?.stores);
  const posSet = pos == null ? null : new Set(Array.isArray(pos) ? pos : [pos]);
  const out: KnownAtom[] = [];
  for (const entry of getDictionaryEntries(languageId)) {
    if (!unlocked.has(entry.id)) continue;
    if (posSet && !posSet.has(entry.pos)) continue;
    out.push(toKnownAtom(entry, srs[entry.id]));
  }
  return out;
}

const STRUGGLE_WEIGHT = 3;

/**
 * Known atoms that are due or struggling, SRS-weighted (highest first). The
 * reinforcement pool — what practice should prioritize surfacing.
 */
export function getDueOrStruggling(
  languageId: string,
  opts?: KnownQueryOptions,
): KnownAtom[] {
  return getKnownAtomsByPos(languageId, null, opts)
    .filter((a) => a.due || a.weight >= STRUGGLE_WEIGHT)
    .sort((a, b) => b.weight - a.weight);
}

/**
 * The furthest content module the learner has reached — the max numeric unlock
 * module across their unlocked atoms. Language-agnostic: you can only have an
 * m7 atom unlocked by doing m7 content, so this is a faithful reached-module
 * signal without touching per-language course structure. `0` for a learner with
 * nothing (or only non-numeric) unlocked.
 */
export function getReachedModule(
  languageId: string,
  stores?: LearnerStores,
): number {
  const { unlocked } = resolveStores(stores);
  let max = 0;
  for (const entry of getDictionaryEntries(languageId)) {
    if (!unlocked.has(entry.id)) continue;
    const n = moduleNumber(entry.unlockModule);
    if (n > max) max = n;
  }
  return max;
}

/**
 * Grammar-point ids the learner has reached. Delegates to the shared grammar
 * activation accessor (introduce-before-review: a point activates once its
 * module has unlocked content). Only JA ships a grammar-point registry today,
 * so this is empty for other languages — which rely on {@link getReachedModule}
 * gating alone. No per-language branch here: the accessor keys off the learner's
 * unlocked atoms, which only match the language they actually studied.
 */
export function getReachedGrammarPointIds(
  _languageId: string,
  stores?: LearnerStores,
): Set<string> {
  const { unlocked } = resolveStores(stores);
  return new Set(getActiveGrammarPoints(unlocked).map((p) => p.id));
}
