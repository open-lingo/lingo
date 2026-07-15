/**
 * Vocab browser data layer.
 *
 * Joins the normalized course-atom view (the authored vocabulary for every
 * language with a catalog — JA/KO/ES today) with the learner's concept
 * rollups (GET /progress/me) to tag each word with a mastery tier. Pure +
 * registry-gated so the page stays a thin renderer.
 */
import { getNormalizedCourseAtoms } from "@/features/lesson/data/normalizedAtoms";
import { lingoArtUrl, notoEmojiUrl } from "@/shared/assets/notoEmoji";
import type { ConceptRollup } from "@/shared/api/progress";

export type VocabTier = "new" | "weak" | "fading" | "solid" | "strong";
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
  tier: VocabTier;
  /** 0–100 recent strength, 0 when never seen. */
  recentStrength: number;
  encounters: number;
};

function tierFor(roll: ConceptRollup | undefined): { tier: VocabTier; recentStrength: number } {
  if (!roll || roll.encounters === 0) return { tier: "new", recentStrength: 0 };
  const recent = roll.recentResults ?? [];
  const total = roll.correctCount + roll.incorrectCount;
  const strength =
    recent.length > 0
      ? Math.round((recent.filter(Boolean).length / recent.length) * 100)
      : total > 0
        ? Math.round((roll.correctCount / total) * 100)
        : 0;
  if (roll.encounters < 2) return { tier: "weak", recentStrength: strength };
  const tier: VocabTier =
    strength >= 85 ? "strong" : strength >= 60 ? "solid" : strength >= 35 ? "fading" : "weak";
  return { tier, recentStrength: strength };
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
  concepts: ConceptRollup[],
): VocabRow[] {
  const byId = new Map(concepts.map((c) => [c.conceptId, c]));

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
      const { tier, recentStrength } = tierFor(byId.get(atom.id));
      const imageUrl =
        lingoArtUrl(atom.display) ??
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
        tier,
        recentStrength,
        encounters: byId.get(atom.id)?.encounters ?? 0,
      };
    });
}

const TIER_RANK: Record<VocabTier, number> = { weak: 0, fading: 1, new: 2, solid: 3, strong: 4 };

/** Filter rows by facet selections + free-text search. */
export function filterVocab(
  rows: VocabRow[],
  selections: { module: string[]; kind: string[]; mastery: string[] },
  search: string,
): VocabRow[] {
  const q = search.trim().toLowerCase();
  return rows.filter((r) => {
    if (selections.module.length && !selections.module.includes(r.module)) return false;
    if (selections.kind.length && !selections.kind.includes(r.kind)) return false;
    if (selections.mastery.length && !selections.mastery.includes(r.tier)) return false;
    if (q) {
      const hay = `${r.kana} ${r.kanji ?? ""} ${r.romaji} ${r.meaning}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });
}

/** Default sort: weakest-mastery first (review focus), then by module. */
export function sortVocab(rows: VocabRow[]): VocabRow[] {
  return [...rows].sort(
    (a, b) =>
      TIER_RANK[a.tier] - TIER_RANK[b.tier] ||
      moduleOrder(a.module) - moduleOrder(b.module) ||
      a.romaji.localeCompare(b.romaji),
  );
}
