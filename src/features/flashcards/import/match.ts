/**
 * External-study import — atom matcher (anki-import-spec-2026-07-07 §match.ts).
 *
 * Language-agnostic core: match keys come from the language module capability
 * (`getLanguageModule(lang).importMatch`), same registration pattern as
 * annotate/TTS. This file imports NO language file at runtime — the only JA
 * reference is a **type-only** import of `CourseAtom` so `ImportMatch.atom`
 * carries the concrete shape callers expect (erased at build; no runtime
 * coupling, no import cycle). Key GENERATION lives entirely in the JA module.
 *
 * Precedence (highest → lowest): reading==kana > expression==kanji >
 * expression==kana > expanded (inflected) forms. An item matches at its best
 * available level and credits ALL atoms tied at that level; a lower level is
 * never consulted once a higher one hits. Items crediting >1 atom are counted
 * in `multiMatches` for transparency (ambiguity is rare).
 */
import { tryGetLanguageModule } from "@/shared/language/registry";
import type { ImportMatchEntry } from "@/shared/language/types";
// Type-only: gives ImportMatch.atom its concrete shape without a runtime dep.
import type { CourseAtom } from "@/features/languages/ja/courseAtoms";
import type { KnownItem } from "./types";

export interface ImportMatch {
  item: KnownItem;
  cardId: string;
  atom: CourseAtom;
}

export interface MatchResult {
  matches: ImportMatch[];
  unmatched: KnownItem[];
  /** Count of items that credited more than one atom. */
  multiMatches: number;
}

type Index = Map<string, ImportMatchEntry[]>;

function addKey(index: Index, key: string, entry: ImportMatchEntry): void {
  const norm = key.trim();
  if (!norm) return;
  const bucket = index.get(norm);
  if (!bucket) {
    index.set(norm, [entry]);
  } else if (!bucket.includes(entry)) {
    bucket.push(entry);
  }
}

/**
 * Match `items` against the atoms of `language` (default "ja"). Returns the
 * per-item credits, the unmatched remainder, and a multi-match count.
 */
export function matchKnownItems(
  items: KnownItem[],
  language = "ja",
): MatchResult {
  const capability = tryGetLanguageModule(language)?.importMatch;
  if (!capability) {
    return { matches: [], unmatched: [...items], multiMatches: 0 };
  }

  const kanaIndex: Index = new Map();
  const kanjiIndex: Index = new Map();
  const expandedIndex: Index = new Map();
  for (const entry of capability.getMatchEntries()) {
    for (const k of entry.keys.kana) addKey(kanaIndex, k, entry);
    for (const k of entry.keys.kanji) addKey(kanjiIndex, k, entry);
    for (const k of entry.keys.expanded) addKey(expandedIndex, k, entry);
  }

  const creditsFor = (item: KnownItem): ImportMatchEntry[] => {
    const expr = item.expression.trim();
    const reading = item.reading?.trim();
    // 1. reading == kana
    if (reading) {
      const hit = kanaIndex.get(reading);
      if (hit?.length) return hit;
    }
    // 2. expression == kanji
    const kanjiHit = kanjiIndex.get(expr);
    if (kanjiHit?.length) return kanjiHit;
    // 3. expression == kana
    const kanaHit = kanaIndex.get(expr);
    if (kanaHit?.length) return kanaHit;
    // 4. expanded (inflected) forms — try expression, then reading
    const expExprHit = expandedIndex.get(expr);
    if (expExprHit?.length) return expExprHit;
    if (reading) {
      const expReadingHit = expandedIndex.get(reading);
      if (expReadingHit?.length) return expReadingHit;
    }
    return [];
  };

  const matches: ImportMatch[] = [];
  const unmatched: KnownItem[] = [];
  let multiMatches = 0;

  for (const item of items) {
    const credits = creditsFor(item);
    if (credits.length === 0) {
      unmatched.push(item);
      continue;
    }
    if (credits.length > 1) multiMatches++;
    for (const entry of credits) {
      matches.push({
        item,
        cardId: entry.cardId,
        atom: entry.atom as CourseAtom,
      });
    }
  }

  return { matches, unmatched, multiMatches };
}
