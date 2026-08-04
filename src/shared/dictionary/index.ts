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
 *   - taught lexicon          → `getTaughtLexiconSeeds(id)` — whole conjugated
 *     / bound surfaces the course teaches but never atomizes, which the
 *     tokenizer would otherwise shred into pieces (see `taughtLexicon.ts`).
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
import { getTtsUrl } from "@/shared/tts";
import { getTaughtLexiconSeeds } from "./taughtLexicon";
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

/**
 * Lookup ordering — used when RESOLVING A TAPPED WORD, which is a different
 * question from "how should the browse list be sorted".
 *
 * Authored course entries come first: for a homograph the learner met in course
 * content, the sense the curriculum taught is the sense they are looking at.
 * Ordering by frequency rank alone put every course entry LAST (they carry no
 * rank), so tapping 도 answered "degree" instead of the particle "also / too".
 *
 * Within a tier the earlier-taught sense wins: two course senses of one surface
 * (JA かぜ is both "wind" and "a cold") are otherwise ordered by nothing at
 * all, and the sense introduced earlier is the one the learner is more likely
 * reading. Frequency order breaks any remaining tie.
 */
function compareForLookup(a: DictionaryEntry, b: DictionaryEntry): number {
  const fa = a.source === "frequency" ? 1 : 0;
  const fb = b.source === "frequency" ? 1 : 0;
  if (fa !== fb) return fa - fb;
  const ma = moduleNumber(a.unlockModule);
  const mb = moduleNumber(b.unlockModule);
  if (ma !== mb) return ma - mb;
  return compareByFrequency(a, b);
}

/**
 * The distinct meanings a gloss carries, normalized for comparison: drop
 * parenthesised qualifiers, split on the separators glosses use, and strip a
 * leading article / infinitive marker.
 *
 *   "ten (10, native)" → ["ten"]
 *   "fever / heat"     → ["fever", "heat"]
 *   "to be, to have"   → ["be", "have"]
 */
function meaningCores(meaningEn: string): string[] {
  return meaningEn
    .replace(/\([^)]*\)/g, " ")
    .split(/[/;,]/)
    .map((part) => foldText(part.replace(/^\s*(?:to|an?|the)\s+/i, "")))
    .filter(Boolean);
}

/**
 * Collapse entries for one surface that say the SAME thing from two sources.
 *
 * A word can appear as both an authored course atom and a frequency atom with
 * ids that don't match (`ko:열` vs `ko:열-03`), so the id-level merge in
 * `buildIndex` never fires and the sense list would read "ten" twice. An entry
 * is dropped only when EVERY one of its meanings is already covered by an
 * earlier (better-ranked) entry — a subset test, so a genuinely new sense such
 * as 열 "fever / heat" is never lost.
 */
function dedupeSenses(ranked: DictionaryEntry[]): DictionaryEntry[] {
  const kept: DictionaryEntry[] = [];
  const keptCores: string[][] = [];
  for (const entry of ranked) {
    const cores = meaningCores(entry.meaningEn);
    const covered =
      cores.length > 0 &&
      keptCores.some((prior) => cores.every((c) => prior.includes(c)));
    if (covered) continue;
    kept.push(entry);
    keptCores.push(cores);
  }
  return kept;
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
  // Audio coverage goes through the resolver, not a raw manifest lookup. The
  // manifest stopped being a flat `"<lang>:<text>" -> path` table when clips
  // moved to the CDN: it is now a set of hashes the client derives against, so
  // indexing it by cache key silently reported "no audio" for every word.
  // `getTtsUrl` also picks up the punctuation-variant and katakana-twin
  // fallbacks, so coverage here matches what actually plays.
  const hasAudio = (surface: string): boolean =>
    getTtsUrl(surface, languageId) !== null;

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

  // 3. Taught-lexicon surfaces — whole conjugated / bound / fused forms the
  //    course teaches in its lessons but never registers as atoms (`나요`,
  //    `괜찮을`, `막혔거든요`). Without an entry the tokenizer shreds them into
  //    their pieces and the learner gets two wrong answers for one taught word.
  //    See `taughtLexicon.ts`.
  //
  //    Reading comes from the language module's annotator (Revised
  //    Romanization for KO), so no per-language branch lands here.
  const annotate = module?.readingAnnotation?.annotate;
  const deriveReading = (surface: string): string => {
    const fragments = annotate?.(surface) ?? [];
    if (fragments.length === 0) return surface;
    return fragments.map((f) => f.reading ?? f.text).join("");
  };
  const priorBySurface = new Map<string, DictionaryEntry[]>();
  for (const entry of entries) pushMulti(priorBySurface, entry.surface, entry);
  for (const seed of getTaughtLexiconSeeds(languageId)) {
    const prior = priorBySurface.get(seed.surface) ?? [];
    // The curriculum's own atom always wins: the lexicon SUPPLEMENTS the atom
    // registry (that is its whole definition), so restating a surface the
    // registry already defines would only double it in the browse list.
    if (prior.some((e) => e.source !== "frequency")) continue;
    // Nor is a frequency entry that already says this worth a second row —
    // same subset test `dedupeSenses` uses, so a genuinely new sense (`보고`
    // "seeing" next to "report") is still added.
    const cores = meaningCores(seed.meaningEn);
    if (
      cores.length > 0 &&
      prior.some((e) => {
        const priorCores = meaningCores(e.meaningEn);
        return cores.every((c) => priorCores.includes(c));
      })
    ) {
      continue;
    }
    if (byId.has(seed.id)) continue;
    const entry: DictionaryEntry = {
      id: seed.id,
      languageId,
      surface: seed.surface,
      reading: seed.reading ?? deriveReading(seed.surface),
      meaningEn: seed.meaningEn,
      pos: seed.pos,
      unlockModule: seed.module,
      // Course-taught, just not atomized — and `compareForLookup` needs it out
      // of the frequency tier so the taught sense answers a tap first.
      source: "course",
      hasAudio: hasAudio(seed.surface),
    };
    byId.set(entry.id, entry);
    entries.push(entry);
  }

  // 4. Lookup / search indexes.
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

/** First non-empty candidate bucket for a surface, or `undefined`. */
function candidatesFor(
  idx: DictionaryIndex,
  surface: string,
): DictionaryEntry[] | undefined {
  const exact = idx.bySurface.get(surface);
  if (exact && exact.length > 0) return exact;
  const folded = foldText(surface);
  if (!folded) return undefined;
  const byFolded = idx.byFoldedSurface.get(folded);
  if (byFolded && byFolded.length > 0) return byFolded;
  const byReading = idx.byFoldedReading.get(folded);
  return byReading && byReading.length > 0 ? byReading : undefined;
}

// ── Public API ─────────────────────────────────────────────────────────────

/**
 * EVERY sense a surface has, best first — the honest answer for a homograph.
 *
 * One `DictionaryEntry` carries exactly one meaning, but a surface may have
 * several entries (Korean 열 is both "ten" and "fever"; 눈 is "eye" and
 * "snow"). Collapsing that to a single entry made the tap-a-word path answer
 * CONFIDENTLY WRONG — a learner reading 열이 나요 was told "ten", with no way
 * to tell it was the wrong sense. Callers that show a word to a learner should
 * use this and surface the alternates.
 *
 * Resolution order matches {@link lookupWord}: exact raw surface, folded
 * surface, then folded reading. Duplicate senses arriving from two sources are
 * collapsed (see `dedupeSenses`). Unknown surface → `[]`.
 */
export function lookupWordSenses(
  languageId: string,
  surface: string,
): DictionaryEntry[] {
  if (!surface) return [];
  const candidates = candidatesFor(getIndex(languageId), surface);
  if (!candidates) return [];
  return dedupeSenses([...candidates].sort(compareForLookup));
}

/**
 * Exact-or-normalized surface lookup — the on-the-fly path (e.g. tapping a word
 * in a story). Returns the BEST sense (see `compareForLookup`), or `null` if
 * unknown. For a homograph this is only one of several meanings; prefer
 * {@link lookupWordSenses} anywhere a learner sees the result.
 */
export function lookupWord(
  languageId: string,
  surface: string,
): DictionaryEntry | null {
  return lookupWordSenses(languageId, surface)[0] ?? null;
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
