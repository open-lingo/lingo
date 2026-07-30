/**
 * Lexical segmentation for conversation lines — shared by the build-from-tiles
 * production rung and the production SRS credit.
 *
 * A `Conversation` line is authored as running target-language text with no
 * per-word atom tagging, so both features need to recover the words: the tiles
 * rung needs chunks the learner can reassemble, and SRS credit needs the
 * course-atom ids the line exercises. We reuse the normalized cross-language
 * atom catalog (the same surface source the comprehensibility gate uses) and
 * greedily longest-match it against the line.
 *
 * Segmentation is script-aware only in that space-delimited languages (es) can
 * split on whitespace first; no-space languages (ja/ko) scan character by
 * character. Either way, matched spans carry their atom id and unmatched runs
 * become plain chunks — so the concatenation of chunks reproduces the line's
 * words (punctuation aside, which grading normalizes away).
 */
import { getNormalizedCourseAtoms } from "@/features/lesson/data/normalizedAtoms";

/** A recognized surface → its course-atom id (for SRS credit). */
interface SurfaceEntry {
  surface: string;
  id: string;
}

interface Lexicon {
  /** Surface → atom id (raw, whitespace-collapsed). */
  bySurface: Map<string, string>;
  /** Longest surface length to attempt in the scan. */
  maxLen: number;
}

const cache = new Map<string, Lexicon>();

/** Split "/"、"、"-separated variants (matches the gate's surfaceVariants). */
function variants(display: string, secondary?: string): string[] {
  const out = display.split(/[/、]/).map((s) => s.trim());
  if (secondary) out.push(...secondary.split(/[/、]/).map((s) => s.trim()));
  return out.filter(Boolean);
}

function getLexicon(lang: string): Lexicon {
  const cached = cache.get(lang);
  if (cached) return cached;

  const bySurface = new Map<string, string>();
  let maxLen = 1;
  const entries: SurfaceEntry[] = [];
  for (const atom of getNormalizedCourseAtoms(lang)) {
    for (const v of variants(atom.display, atom.secondary)) {
      const surface = v.replace(/\s/g, "");
      if (surface) entries.push({ surface, id: atom.id });
    }
  }
  // Longest first so a longer surface wins the id when two overlap.
  entries.sort((a, b) => b.surface.length - a.surface.length);
  for (const { surface, id } of entries) {
    if (!bySurface.has(surface)) bySurface.set(surface, id);
    if (surface.length > maxLen) maxLen = surface.length;
  }

  const lex: Lexicon = { bySurface, maxLen };
  cache.set(lang, lex);
  return lex;
}

/** True for whitespace / punctuation characters that never become a tile. */
const NON_TILE_RE = /[\s.,!?;:'"()[\]…—–\-·、。！？「」『』〜～]/u;

export interface SegmentResult {
  /** Ordered display chunks the learner reassembles (no whitespace/punct). */
  chunks: string[];
  /** Distinct course-atom ids the line exercises (for SRS credit). */
  atomIds: string[];
}

/**
 * Segment a line into reassemblable chunks + the atom ids it exercises.
 * Greedy longest-match over course-atom surfaces; unmatched runs coalesce
 * into plain chunks; whitespace and standalone punctuation are dropped (they
 * are normalized away when grading, and make noisy tiles).
 */
export function segmentLine(text: string, lang: string): SegmentResult {
  const lex = getLexicon(lang);
  const chunks: string[] = [];
  const atomIds: string[] = [];
  const seen = new Set<string>();
  let residual = "";
  const flush = () => {
    if (residual) {
      chunks.push(residual);
      residual = "";
    }
  };

  const chars = Array.from(text);
  let i = 0;
  while (i < chars.length) {
    const ch = chars[i];
    if (NON_TILE_RE.test(ch)) {
      flush();
      i += 1;
      continue;
    }
    let matched = "";
    let matchedId: string | undefined;
    const limit = Math.min(lex.maxLen, chars.length - i);
    for (let len = limit; len >= 1; len--) {
      const sub = chars.slice(i, i + len).join("");
      const id = lex.bySurface.get(sub);
      if (id !== undefined) {
        matched = sub;
        matchedId = id;
        break;
      }
    }
    if (matched) {
      flush();
      chunks.push(matched);
      if (matchedId && !seen.has(matchedId)) {
        seen.add(matchedId);
        atomIds.push(matchedId);
      }
      i += matched.length;
    } else {
      residual += ch;
      i += 1;
    }
  }
  flush();
  return { chunks, atomIds };
}

/** Test hook — drop the memoized lexicons. */
export function __resetConversationLexicon(): void {
  cache.clear();
}
