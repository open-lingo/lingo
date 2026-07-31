/**
 * Reading practice — "words from the module it uses" extractor (pure).
 *
 * Tokenizes a story's authored sentences with the SAME dictionary longest-match
 * approach `TappableText` uses (greedy longest known surface for no-space
 * scripts; word-run split for space-delimited ones), resolves each token to a
 * dictionary entry via `lookupWord`, keeps only content words, and dedupes in
 * first-seen order. Powers the "vocab you'll see" preview and feeds the unique
 * content-word count into the difficulty metric.
 */
import {
  getDictionaryEntries,
  lookupWord,
  type DictionaryEntry,
} from "@/shared/dictionary";
import type { Story } from "@/features/practice/content";

/** Content parts of speech worth previewing as vocab (skip particles etc.). */
const CONTENT_POS = new Set(["noun", "verb", "adjective", "adverb"]);

/** Scripts with no word boundaries — use the greedy longest-match scan. */
const NO_SPACE_LANGS = new Set(["ja", "ko"]);

/** Upper bound on the substring length scanned per position (perf guard). */
const MAX_SURFACE_SCAN = 16;

/** Word = letters/numbers, allowing internal apostrophe/hyphen. */
const WORD_RE = /[\p{L}\p{N}][\p{L}\p{M}\p{N}'’-]*/gu;

interface SurfaceIndex {
  surfaces: Set<string>;
  maxLen: number;
}

/** Known-surface index for a language (built per extraction; memoize upstream). */
function buildIndex(lang: string): SurfaceIndex {
  const surfaces = new Set<string>();
  let maxLen = 0;
  for (const entry of getDictionaryEntries(lang)) {
    const s = entry.surface;
    if (!s) continue;
    surfaces.add(s);
    if (s.length > maxLen) maxLen = s.length;
  }
  return { surfaces, maxLen: Math.min(maxLen, MAX_SURFACE_SCAN) };
}

/** Greedy longest-match scan → the known surfaces found, in order. */
function scanNoSpace(text: string, idx: SurfaceIndex): string[] {
  const out: string[] = [];
  const n = text.length;
  let i = 0;
  while (i < n) {
    let matched: string | null = null;
    const limit = Math.min(idx.maxLen, n - i);
    for (let len = limit; len >= 1; len--) {
      const sub = text.slice(i, i + len);
      if (idx.surfaces.has(sub)) {
        matched = sub;
        break;
      }
    }
    if (matched) {
      out.push(matched);
      i += matched.length;
    } else {
      i += 1;
    }
  }
  return out;
}

/** Space-delimited: raw word tokens (folded resolution happens in `lookupWord`). */
function scanSpaced(text: string): string[] {
  return Array.from(text.matchAll(WORD_RE)).map((m) => m[0]);
}

/**
 * Content words a story uses, resolved to dictionary entries, deduped in
 * first-seen order. Returns `[]` when nothing resolves (e.g. no dictionary for
 * the language).
 */
export function extractStoryWords(
  story: Pick<Story, "sentences">,
  lang: string,
): DictionaryEntry[] {
  const noSpace = NO_SPACE_LANGS.has(lang);
  const idx = noSpace ? buildIndex(lang) : null;

  const seen = new Set<string>();
  const out: DictionaryEntry[] = [];
  for (const sentence of story.sentences) {
    const tokens = noSpace ? scanNoSpace(sentence.text, idx!) : scanSpaced(sentence.text);
    for (const token of tokens) {
      const entry = lookupWord(lang, token);
      if (!entry || !CONTENT_POS.has(entry.pos) || seen.has(entry.id)) continue;
      seen.add(entry.id);
      out.push(entry);
    }
  }
  return out;
}
