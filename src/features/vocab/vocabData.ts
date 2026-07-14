/**
 * Vocab browser data layer.
 *
 * Joins the JA course-atom registry (the authored vocabulary) with the
 * learner's concept rollups (GET /progress/me) to tag each word with a
 * mastery tier. Pure + language-gated so the page stays a thin renderer.
 */
import {
  JA_COURSE_ATOMS,
  canonicalAtomId,
  isSrsEligibleAtom,
} from "@/features/languages/ja/courseAtoms";
import { lingoArtUrl, notoEmojiUrl } from "@/shared/assets/notoEmoji";
import type { ConceptRollup } from "@/shared/api/progress";

export type VocabTier = "new" | "weak" | "fading" | "solid" | "strong";
export type VocabKind = "vocab" | "particle" | "phrase";

export type VocabRow = {
  /** Canonical SRS id (`ja:biiru`). */
  id: string;
  kana: string;
  kanji?: string;
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
  if (languageId !== "ja") return [];
  const byId = new Map(concepts.map((c) => [c.conceptId, c]));

  // Words + particles only: phrase-kind atoms (full example sentences)
  // exist for SRS/listening exposure, but a sentence tile in the WORD
  // vocab grid reads as mislabeled data and its kana breaks the tile
  // layout (Spencer QA 2026-07-13).
  return JA_COURSE_ATOMS.filter(
    (a) => isSrsEligibleAtom(a) && a.kind !== "phrase",
  ).map((atom) => {
    const id = canonicalAtomId(atom);
    const { tier, recentStrength } = tierFor(byId.get(id));
    const imageUrl = lingoArtUrl(atom.kana) ?? (atom.emoji ? notoEmojiUrl(atom.emoji) : null);
    return {
      id,
      kana: atom.kana,
      kanji: atom.kanji,
      romaji: atom.romaji,
      meaning: atom.meaningEn,
      emoji: atom.emoji,
      imageUrl,
      module: atom.fromModule,
      kind: atom.kind,
      tier,
      recentStrength,
      encounters: byId.get(id)?.encounters ?? 0,
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
