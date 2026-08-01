/**
 * Story read state — local-first, mirroring `practiceStats` / `srsStorage`.
 *
 * Tracks how many times each story has been read, when, and the best
 * comprehension score. Stories are repeatable by design, so this counts reads
 * rather than flipping a done bit.
 *
 * Pathway-promoted stories ALSO write through `markLessonCompleted` at the call
 * site (see the reader), which is what carries them into `/progress/me` sync
 * and the Learn map. This store is the richer per-story record that the
 * pathway's boolean completion cannot express.
 */

const STORAGE_KEY = "lingo:story-progress:v1";

export interface StoryScore {
  correct: number;
  total: number;
}

export interface StoryProgress {
  reads: number;
  /** ISO timestamp of the first read. */
  firstReadAt: string;
  /** ISO timestamp of the most recent read. */
  lastReadAt: string;
  /** Highest comprehension score achieved, by correct count. */
  bestScore?: StoryScore;
}

export type StoryProgressStore = Record<string, StoryProgress>;

const listeners = new Set<() => void>();

function load(): StoryProgressStore {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? (parsed as StoryProgressStore) : {};
  } catch {
    return {};
  }
}

function save(store: StoryProgressStore): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch {
    // quota — read state is a nicety, never block the read on it
  }
  for (const fn of listeners) fn();
}

export function getAllStoryProgress(): StoryProgressStore {
  return load();
}

export function getStoryProgress(storyId: string): StoryProgress | null {
  return load()[storyId] ?? null;
}

export function isStoryRead(storyId: string): boolean {
  return (load()[storyId]?.reads ?? 0) > 0;
}

/** Record one read. `score` updates `bestScore` only when it beats the record. */
export function recordStoryRead(storyId: string, score?: StoryScore): void {
  const store = load();
  const now = new Date().toISOString();
  const prev = store[storyId];
  const bestScore =
    score && (!prev?.bestScore || score.correct > prev.bestScore.correct)
      ? score
      : prev?.bestScore;

  store[storyId] = {
    reads: (prev?.reads ?? 0) + 1,
    firstReadAt: prev?.firstReadAt ?? now,
    lastReadAt: now,
    ...(bestScore ? { bestScore } : {}),
  };
  save(store);
}

export function clearStoryProgress(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
  for (const fn of listeners) fn();
}

/** Subscribe to writes. Returns an unsubscribe function. */
export function subscribeStoryProgress(fn: () => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
