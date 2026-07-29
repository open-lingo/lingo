/**
 * Language-agnostic dictionary lookup service.
 *
 * The reusable data layer behind (a) on-the-fly definition lookups — e.g.
 * tapping a word in a future story — and (b) the reference "vocab viewer".
 * It is UI-free and built ENTIRELY off the language registry: adding a 4th
 * language requires NO change here.
 *
 * Sources, per language (iterated via `getAllLanguageIds()`):
 *   - authored course vocab   → `getNormalizedCourseAtoms(id)` (surface /
 *     reading / meaning / module) + `getCourseAtoms(id)` (part of speech).
 *   - frequency vocab         → `getFrequencyAtoms(id)` (rank + unlock module).
 * unioned and deduped by canonical id: a word in both keeps the course
 * definition/reading and gains the frequency rank (`source: "both"`).
 *
 * Indexes are static data, so each language's index is built lazily on first
 * use and memoized. The API is shaped so an HTTP `DictionaryApi` could back it
 * later (pure functions of `languageId` + query/opts).
 */
import {
  getAllLanguageIds,
  getCourseAtoms,
  tryGetLanguageModule,
} from "@/shared/language/registry";
import { getNormalizedCourseAtoms } from "@/features/lesson/data/normalizedAtoms";
import { getFrequencyAtoms } from "@/features/languages/frequencyResolver";
import type { ConjugationTable, PartOfSpeech } from "@/shared/language/types";
import { foldText } from "./normalize";
import type {
  DictionaryEntry,
  EntryQueryOptions,
  SearchOptions,
} from "./types";

export type {
  DictionaryEntry,
  DictionarySource,
  EntryQueryOptions,
  SearchOptions,
  PartOfSpeech,
  ConjugationTable,
} from "./types";
export { foldText } from "./normalize";

// ── Internal index shape ──────────────────────────────────────────────────

interface SearchRecord {
  entry: DictionaryEntry;
  fSurface: string;
  fReading: string;
  fMeaning: string;
}

interface DictionaryIndex {
  /** All entries, in insertion order (course atoms then frequency-only). */
  entries: DictionaryEntry[];
  byId: Map<string, DictionaryEntry>;
  /** Raw (unfolded) surface → entries. */
  bySurface: Map<string, DictionaryEntry[]>;
  /** Folded surface → entries. */
  byFoldedSurface: Map<string, DictionaryEntry[]>;
  /** Folded reading → entries. */
  byFoldedReading: Map<string, DictionaryEntry[]>;
  /** Precomputed folded fields for ranked search. */
  search: SearchRecord[];
}

const indexCache = new Map<string, DictionaryIndex>();

// ── Helpers ───────────────────────────────────────────────────────────────

/** A real numeric content module (`m3`), vs `future` / `sidequest-*`. */
function isRealModule(m: string | undefined): m is string {
  return m != null && /^m\d+$/.test(m);
}

/** Numeric module for `maxUnlockModule` filtering; non-numeric → Infinity. */
function moduleNumber(m: string | undefined): number {
  if (!m) return Infinity;
  const match = /^m(\d+)$/.exec(m);
  return match ? Number(match[1]) : Infinity;
}

/**
 * Resolve the display unlock module. Authored-taught words (real numeric
 * course module) keep that module — it's when the learner actually learns the
 * word. Words with no authored module (`future` / `sidequest-*`) but a
 * frequency gate use `m${freqUnlock}`. Otherwise the raw course module string.
 */
function resolveUnlockModule(
  courseModule: string | undefined,
  freqUnlock: number | undefined,
): string | undefined {
  if (isRealModule(courseModule)) return courseModule;
  if (freqUnlock != null) return `m${freqUnlock}`;
  return courseModule;
}

/**
 * Frequency ordering: lower frequency rank first (more frequent), then course
 * before frequency-only, then surface for stability. Entries with no rank sort
 * after ranked entries (they carry no frequency signal).
 */
function compareByFrequency(a: DictionaryEntry, b: DictionaryEntry): number {
  const ra = a.frequencyRank ?? Number.POSITIVE_INFINITY;
  const rb = b.frequencyRank ?? Number.POSITIVE_INFINITY;
  if (ra !== rb) return ra - rb;
  const sa = a.source === "frequency" ? 1 : 0;
  const sb = b.source === "frequency" ? 1 : 0;
  if (sa !== sb) return sa - sb;
  return a.surface.localeCompare(b.surface);
}

/** Push `entry` under `key` in a multimap. */
function pushMulti(
  map: Map<string, DictionaryEntry[]>,
  key: string,
  entry: DictionaryEntry,
): void {
  const bucket = map.get(key);
  if (bucket) bucket.push(entry);
  else map.set(key, [entry]);
}

// ── Index build (per language, memoized) ──────────────────────────────────

function buildIndex(languageId: string): DictionaryIndex {
  const module = tryGetLanguageModule(languageId);
  const posById = new Map<string, PartOfSpeech>(
    getCourseAtoms(languageId).map((a) => [a.id, a.partOfSpeech]),
  );
  const tableById = new Map<string, ConjugationTable>(
    (module?.conjugation?.tables ?? []).map((t) => [t.lemmaAtomId, t]),
  );
  const ttsManifest = module?.ttsManifest ?? {};
  const hasAudio = (surface: string): boolean =>
    ttsManifest[`${languageId}:${surface}`] != null;

  const byId = new Map<string, DictionaryEntry>();
  const entries: DictionaryEntry[] = [];

  // 1. Authored course atoms — the definition/reading source of truth.
  for (const atom of getNormalizedCourseAtoms(languageId)) {
    const reading =
      atom.romanization && atom.romanization.trim()
        ? atom.romanization
        : atom.display;
    const entry: DictionaryEntry = {
      id: atom.id,
      languageId,
      surface: atom.display,
      reading,
      meaningEn: atom.gloss,
      pos: posById.get(atom.id) ?? "other",
      unlockModule: resolveUnlockModule(atom.module, undefined),
      source: "course",
      conjugation: tableById.get(atom.id),
      hasAudio: hasAudio(atom.display),
    };
    byId.set(entry.id, entry);
    entries.push(entry);
  }

  // 2. Frequency atoms — merge into course entries (→ "both") or add new.
  for (const freq of getFrequencyAtoms(languageId)) {
    const existing = byId.get(freq.id);
    if (existing) {
      existing.source = "both";
      existing.frequencyRank = freq.frequencyRank;
      // `existing.unlockModule` is still the raw course module here.
      existing.unlockModule = resolveUnlockModule(
        existing.unlockModule,
        freq.unlockModule,
      );
      continue;
    }
    const entry: DictionaryEntry = {
      id: freq.id,
      languageId,
      surface: freq.surface,
      reading: freq.reading || freq.surface,
      meaningEn: freq.meaningEn,
      pos: freq.pos,
      frequencyRank: freq.frequencyRank,
      unlockModule: `m${freq.unlockModule}`,
      source: "frequency",
      conjugation: tableById.get(freq.id),
      hasAudio: hasAudio(freq.surface),
    };
    byId.set(entry.id, entry);
    entries.push(entry);
  }

  // 3. Lookup / search indexes.
  const bySurface = new Map<string, DictionaryEntry[]>();
  const byFoldedSurface = new Map<string, DictionaryEntry[]>();
  const byFoldedReading = new Map<string, DictionaryEntry[]>();
  const search: SearchRecord[] = [];
  for (const entry of entries) {
    const fSurface = foldText(entry.surface);
    const fReading = foldText(entry.reading);
    pushMulti(bySurface, entry.surface, entry);
    pushMulti(byFoldedSurface, fSurface, entry);
    pushMulti(byFoldedReading, fReading, entry);
    search.push({
      entry,
      fSurface,
      fReading,
      fMeaning: foldText(entry.meaningEn),
    });
  }

  return { entries, byId, bySurface, byFoldedSurface, byFoldedReading, search };
}

function getIndex(languageId: string): DictionaryIndex {
  const cached = indexCache.get(languageId);
  if (cached) return cached;
  const built = buildIndex(languageId);
  indexCache.set(languageId, built);
  return built;
}

/** Best (most frequent, course-first) entry from a candidate list. */
function bestOf(candidates: DictionaryEntry[] | undefined): DictionaryEntry | null {
  if (!candidates || candidates.length === 0) return null;
  return [...candidates].sort(compareByFrequency)[0];
}

// ── Public API ─────────────────────────────────────────────────────────────

/**
 * Exact-or-normalized surface lookup — the on-the-fly path (e.g. tapping a word
 * in a story). Tries, in order: exact raw surface, folded surface, folded
 * reading (so a romaji/RR query resolves to the target-script word). Returns
 * the most-frequent matching entry, or `null` if unknown.
 */
export function lookupWord(
  languageId: string,
  surface: string,
): DictionaryEntry | null {
  if (!surface) return null;
  const idx = getIndex(languageId);
  const exact = bestOf(idx.bySurface.get(surface));
  if (exact) return exact;
  const folded = foldText(surface);
  if (!folded) return null;
  return (
    bestOf(idx.byFoldedSurface.get(folded)) ??
    bestOf(idx.byFoldedReading.get(folded)) ??
    null
  );
}

/**
 * Ranked search across surface / reading / meaning. Ranking: exact > prefix >
 * substring (best tier across the three fields wins); ties broken by frequency
 * (lower rank first, then course before frequency-only). `opts.limit` caps the
 * result count. Empty / whitespace query → `[]`.
 */
export function searchDictionary(
  languageId: string,
  query: string,
  opts: SearchOptions = {},
): DictionaryEntry[] {
  const q = foldText(query);
  if (!q) return [];
  const idx = getIndex(languageId);

  const scored: { entry: DictionaryEntry; tier: number }[] = [];
  for (const rec of idx.search) {
    const tier = matchTier(q, rec);
    if (tier < 3) scored.push({ entry: rec.entry, tier });
  }
  scored.sort((a, b) => {
    if (a.tier !== b.tier) return a.tier - b.tier;
    return compareByFrequency(a.entry, b.entry);
  });

  const results = scored.map((s) => s.entry);
  return opts.limit != null ? results.slice(0, opts.limit) : results;
}

/** 0 = exact, 1 = prefix, 2 = substring, 3 = no match (best across fields). */
function matchTier(q: string, rec: SearchRecord): number {
  let best = 3;
  for (const field of [rec.fSurface, rec.fReading, rec.fMeaning]) {
    if (field === q) return 0;
    if (field.startsWith(q)) best = Math.min(best, 1);
    else if (field.includes(q)) best = Math.min(best, 2);
  }
  return best;
}

/**
 * The full entry list for a language — the viewer's data. Supports filtering by
 * part of speech, source bucket, and max unlock module, plus `frequency`
 * (default, most-frequent first) or `surface` (A→Z) sort. Empty for an
 * unregistered language.
 */
export function getDictionaryEntries(
  languageId: string,
  opts: EntryQueryOptions = {},
): DictionaryEntry[] {
  const idx = getIndex(languageId);
  let entries = idx.entries;

  if (opts.pos != null) {
    const allowed = new Set(Array.isArray(opts.pos) ? opts.pos : [opts.pos]);
    entries = entries.filter((e) => allowed.has(e.pos));
  }
  if (opts.source != null) {
    const allowed = new Set(
      Array.isArray(opts.source) ? opts.source : [opts.source],
    );
    entries = entries.filter((e) => allowed.has(e.source));
  }
  if (opts.maxUnlockModule != null) {
    const max = opts.maxUnlockModule;
    entries = entries.filter((e) => moduleNumber(e.unlockModule) <= max);
  }

  const sorted = [...entries].sort(
    opts.sort === "surface"
      ? (a, b) => a.surface.localeCompare(b.surface)
      : compareByFrequency,
  );
  return opts.limit != null ? sorted.slice(0, opts.limit) : sorted;
}

/**
 * Every registered language id that has at least one dictionary entry. Handy
 * for a viewer's language switcher.
 */
export function getDictionaryLanguageIds(): string[] {
  return getAllLanguageIds().filter((id) => getIndex(id).entries.length > 0);
}

/** Test hook — drop the memoized per-language indexes. */
export function __resetDictionaryForTests(): void {
  indexCache.clear();
}
