/**
 * Vocab browser data layer.
 *
 * Joins the normalized course-atom view (the authored vocabulary for every
 * language with a catalog — JA/KO/ES today) with the learner's REAL local
 * study state: the lesson unlock store (has this word been taught yet?) and
 * the FSRS-6 SRS store (how well is it known?). Pure + registry-gated so
 * the page stays a thin renderer; stores are injectable for tests.
 */
import { getNormalizedCourseAtoms } from "@/features/lesson/data/normalizedAtoms";
import { getUnlockedAtomIds } from "@/features/lesson/data/unlockLessonAtoms";
import { lingoArtUrl, notoEmojiUrl } from "@/shared/assets/notoEmoji";
import { getSRSStore, isMastered, isNew } from "@/features/flashcards/engine";
import type { SRSStore } from "@/features/flashcards/engine";
import type {
  SRSCardState,
  SRSModalityState,
} from "@/features/flashcards/data/types";

export type VocabTier = "new" | "learning" | "reviewing" | "mastered";
export type VocabKind = "vocab" | "particle" | "phrase";

export type VocabRow = {
  /** Canonical SRS id (`ja:biiru`, `es:cerveza`). */
  id: string;
  /** Display surface (kana for JA, surface form for KO/ES). */
  kana: string;
  /** Secondary written form (kanji for JA), when the atom has one. */
  kanji?: string;
  /** Romanization; falls back to the surface for Latin-script languages. */
  romaji: string;
  meaning: string;
  emoji?: string;
  imageUrl: string | null;
  /** Source module key (`m3`, `sidequest-survival`, `future`). */
  module: string;
  kind: VocabKind;
  /** SRS-derived mastery bucket (same FSRS helpers as the flashcards hub). */
  tier: VocabTier;
  /** Taught by a completed lesson (or placement seed) — the unlock store. */
  unlocked: boolean;
  /** 0–100 lifetime retention (reps / (reps + lapses)), 0 when never seen. */
  retention: number;
  /** Total FSRS reviews across both modalities. */
  encounters: number;
};

/**
 * Bucket a card's FSRS state. Mirrors the flashcards-hub buckets
 * (`isNew`/`isLearning`/`isMastered`), splitting the middle by FSRS phase:
 * "reviewing" once every graded modality has graduated to the review
 * phase, "learning" while any graded side is still in (re)learning steps.
 */
function tierFor(state: SRSCardState | undefined): VocabTier {
  if (isNew(state)) return "new";
  if (isMastered(state)) return "mastered";
  const graduated = (sub: SRSModalityState) =>
    sub.reps === 0 || sub.state === "review";
  return graduated(state!.recognition) && graduated(state!.production)
    ? "reviewing"
    : "learning";
}

function retentionFor(state: SRSCardState | undefined): {
  retention: number;
  encounters: number;
} {
  if (!state) return { retention: 0, encounters: 0 };
  let reps = 0;
  let lapses = 0;
  for (const modality of ["recognition", "production"] as const) {
    const sub = state[modality];
    if (sub.reps > 0) {
      reps += sub.reps;
      lapses += sub.lapses;
    }
  }
  if (reps === 0) return { retention: 0, encounters: 0 };
  return {
    retention: Math.round((reps / (reps + lapses)) * 100),
    encounters: reps,
  };
}

/** Human label for a `fromModule` key. */
export function moduleLabel(key: string): string {
  if (key === "future") return "Upcoming";
  if (key.startsWith("sidequest")) return "Side quest";
  const m = /^m(\d+)$/.exec(key);
  return m ? `Module ${m[1]}` : key;
}

/** Sort key so `m2` < `m10` and side quest / future land at the end. */
export function moduleOrder(key: string): number {
  const m = /^m(\d+)$/.exec(key);
  if (m) return Number(m[1]);
  if (key.startsWith("sidequest")) return 900;
  return 999; // future
}

export function buildVocabRows(
  languageId: string,
  opts: {
    /** Injectable for tests; defaults to the live localStorage store. */
    srsStore?: SRSStore;
    /** Injectable for tests; defaults to the live unlock store. */
    unlockedIds?: ReadonlySet<string>;
  } = {},
): VocabRow[] {
  const srsStore = opts.srsStore ?? getSRSStore();
  const unlockedIds = opts.unlockedIds ?? getUnlockedAtomIds();

  // Words + particles only: phrase-kind atoms (full example sentences)
  // exist for SRS/listening exposure, but a sentence tile in the WORD
  // vocab grid reads as mislabeled data and its surface breaks the tile
  // layout (Spencer QA 2026-07-13). "other"-kind atoms (KO jamo /
  // syllables) are alphabet-trainer territory, not vocabulary.
  return getNormalizedCourseAtoms(languageId)
    .filter(
      (a) => a.srsEligible && (a.kind === "vocab" || a.kind === "particle"),
    )
    .map((atom) => {
      const state = srsStore[atom.id];
      const { retention, encounters } = retentionFor(state);
      const imageUrl =
        lingoArtUrl(languageId, atom.display) ??
        (atom.emoji ? notoEmojiUrl(atom.emoji) : null);
      return {
        id: atom.id,
        kana: atom.display,
        kanji: atom.secondary,
        romaji: atom.romanization ?? atom.display,
        // ES nouns carry grammatical gender — folded into the free-text
        // meaning ("beer (f.)") rather than a new column (no page redesign).
        meaning: atom.gender ? `${atom.gloss} (${atom.gender}.)` : atom.gloss,
        emoji: atom.emoji,
        imageUrl,
        module: atom.module,
        kind: atom.kind as VocabKind,
        tier: tierFor(state),
        unlocked: unlockedIds.has(atom.id),
        retention,
        encounters,
      };
    });
}

const TIER_RANK: Record<VocabTier, number> = {
  learning: 0,
  reviewing: 1,
  new: 2,
  mastered: 3,
};

export type VocabSelections = {
  module: string[];
  kind: string[];
  mastery: string[];
  /** "learned" | "locked" — unlock-store facet. Empty = all. */
  learned: string[];
};

/** Filter rows by facet selections + free-text search. */
export function filterVocab(
  rows: VocabRow[],
  selections: VocabSelections,
  search: string,
): VocabRow[] {
  const q = search.trim().toLowerCase();
  return rows.filter((r) => {
    if (selections.module.length && !selections.module.includes(r.module)) return false;
    if (selections.kind.length && !selections.kind.includes(r.kind)) return false;
    if (selections.mastery.length && !selections.mastery.includes(r.tier)) return false;
    if (selections.learned.length) {
      const bucket = r.unlocked ? "learned" : "locked";
      if (!selections.learned.includes(bucket)) return false;
    }
    if (q) {
      const hay = `${r.kana} ${r.kanji ?? ""} ${r.romaji} ${r.meaning}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });
}

/** Default sort: in-progress first (review focus), then by module. */
export function sortVocab(rows: VocabRow[]): VocabRow[] {
  return [...rows].sort(
    (a, b) =>
      TIER_RANK[a.tier] - TIER_RANK[b.tier] ||
      moduleOrder(a.module) - moduleOrder(b.module) ||
      a.romaji.localeCompare(b.romaji),
  );
}
