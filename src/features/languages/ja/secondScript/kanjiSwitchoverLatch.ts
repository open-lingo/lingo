import { canonicalize } from "@/features/flashcards/engine/srsStorage";

/**
 * The kana→kanji switchover LATCH (B061).
 *
 * One persisted set: "this atom's written form has been introduced, on this
 * date." It is the smallest possible store that makes the beat coherent, and it
 * is deliberately not part of the FSRS card:
 *
 *  - **It must never revert.** A predicate on the current interval would un-write
 *    the kanji after a lapse, and "words that used to be [kanji] now just aren't"
 *    is the single most-reported complaint about Duolingo's kanji behaviour
 *    (`docs/kanji-switchover-design-2026-07-28.md` §2). Once a word has been
 *    introduced in kanji it stays in kanji. Reverting is worse than never
 *    switching.
 *  - **The date is load-bearing, not diagnostics.** It is what lets furigana be
 *    measured from the introduction rather than from the module, which is the
 *    B064 fix: a learner who latches at m25 on a word that unlocked at m19 is
 *    past the unlock+2 window AND mastered, so under the module rule the kanji
 *    would appear bare on first sight with no furigana at all.
 *
 * Not synced to the server in v1. The consequence is honest and worth stating: a
 * learner on a second device re-meets the beat for words they have already had
 * introduced. That is a repeated introduction, not a lost one — strictly better
 * than the alternative failure of skipping the introduction entirely — but it is
 * the reason this wants to ride the SRS sync payload eventually.
 */

const STORAGE_KEY = "open-lingo-kanji-switch:v1";
const MISS_KEY = "open-lingo-kanji-switch-miss:v1";

type LatchEntry = { latchedAt: string };
/** Failed beat attempts per atom — see `recordSwitchoverMiss`. */
type MissStore = Record<string, number>;
type LatchStore = Record<string, LatchEntry>;

let cache: LatchStore | null = null;

function read(): LatchStore {
  if (cache) return cache;
  if (typeof localStorage === "undefined") return (cache = {});
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return (cache = {});
    const parsed = JSON.parse(raw) as LatchStore;
    const out: LatchStore = {};
    for (const [id, v] of Object.entries(parsed ?? {})) {
      // Harden against schema drift: a bad date must not throw at render time,
      // and this is read on every annotated segment.
      if (v && typeof v.latchedAt === "string") out[canonicalize(id)] = v;
    }
    return (cache = out);
  } catch {
    return (cache = {});
  }
}

function write(store: LatchStore): void {
  cache = store;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch {
    /* quota / private mode — the in-memory cache still holds for this session */
  }
}

/** True once this atom's written form has been introduced by the beat. */
export function isKanjiLatched(atomId: string | undefined): boolean {
  if (!atomId) return false;
  return read()[canonicalize(atomId)] !== undefined;
}

/** ISO date the beat introduced this atom's kanji, or null. */
export function kanjiLatchedAt(atomId: string | undefined): string | null {
  if (!atomId) return null;
  return read()[canonicalize(atomId)]?.latchedAt ?? null;
}

/**
 * Record that the beat introduced this atom's kanji. Idempotent — a re-run keeps
 * the ORIGINAL date, because furigana duration is measured from it and a repeat
 * (e.g. the beat replaying on a second device) must not restart the scaffold.
 */
export function latchKanji(atomId: string, today: string): void {
  const key = canonicalize(atomId);
  const store = read();
  if (store[key]) return;
  write({ ...store, [key]: { latchedAt: today } });
}

/** Every latched atom id, canonical form. */
export function getLatchedKanjiIds(): ReadonlySet<string> {
  return new Set(Object.keys(read()));
}

/**
 * Failed beat attempts (Spencer 2026-07-29: "it should unlock immediately UNLESS
 * they get the kanji question wrong, then it will stay kana and then show them the
 * card one more time in reviews").
 *
 * So a miss buys the word ONE more introduction, not unlimited retries. After
 * `MAX_SWITCHOVER_MISSES` the word latches anyway on the next completed beat —
 * otherwise a learner who keeps missing one word blocks a beat slot forever and
 * that word stays kana for the rest of the course.
 */
let missCache: MissStore | null = null;

function readMisses(): MissStore {
  if (missCache) return missCache;
  if (typeof localStorage === "undefined") return (missCache = {});
  try {
    const raw = localStorage.getItem(MISS_KEY);
    const parsed = raw ? (JSON.parse(raw) as MissStore) : {};
    const out: MissStore = {};
    for (const [id, n] of Object.entries(parsed ?? {})) {
      if (typeof n === "number" && n > 0) out[canonicalize(id)] = n;
    }
    return (missCache = out);
  } catch {
    return (missCache = {});
  }
}

export function switchoverMisses(atomId: string): number {
  return readMisses()[canonicalize(atomId)] ?? 0;
}

/** Records a failed beat and returns the new miss count. */
export function recordSwitchoverMiss(atomId: string): number {
  const key = canonicalize(atomId);
  const store = readMisses();
  const next = (store[key] ?? 0) + 1;
  missCache = { ...store, [key]: next };
  try {
    localStorage.setItem(MISS_KEY, JSON.stringify(missCache));
  } catch {
    /* quota / private mode — in-memory holds for this session */
  }
  return next;
}

/** Test/dev only — drops the stores and the in-memory caches. */
export function resetKanjiLatchStore(): void {
  cache = null;
  missCache = null;
  try {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(MISS_KEY);
  } catch {
    /* nothing to remove */
  }
}

/**
 * Is a latched word still inside its post-introduction furigana window?
 *
 * Measured from the latch date, which is exactly why the date is stored. Returns
 * false for an un-latched word — callers fall back to the module window.
 *
 * Date-only arithmetic on the ISO `YYYY-MM-DD` prefix: the latch stamp comes from
 * `getToday()`, and comparing timestamps would make the answer depend on the hour
 * a learner happened to finish the lesson.
 */
export function withinFuriganaLatchWindow(
  atomId: string | undefined,
  today: string,
  windowDays: number,
): boolean {
  const latchedAt = kanjiLatchedAt(atomId);
  if (!latchedAt) return false;
  const then = Date.parse(`${latchedAt.slice(0, 10)}T00:00:00Z`);
  const now = Date.parse(`${today.slice(0, 10)}T00:00:00Z`);
  if (Number.isNaN(then) || Number.isNaN(now)) return false;
  const days = (now - then) / 86400000;
  return days < windowDays;
}
