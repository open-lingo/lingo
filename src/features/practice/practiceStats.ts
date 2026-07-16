import { getSRSStore } from "@/features/flashcards/engine/srsStorage";
import type { SRSCardState } from "@/features/flashcards/data/types";

const STORAGE_KEY = "lingo:practice-stats:v1";

export type PracticeFeatureKey =
  | "conjugation"
  | "kanji"
  | "reading"
  | "speaking"
  | "counters"
  | "listening"
  | "writing";

export type ItemStats = {
  correct: number;
  total: number;
  lastPracticed: string;
};

export type FeatureStats = {
  items: Record<string, ItemStats>;
  sessions: number;
  lastSessionDate: string | null;
};

type PracticeStatsStore = Partial<Record<PracticeFeatureKey, FeatureStats>>;

function load(): PracticeStatsStore {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function save(store: PracticeStatsStore): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch {
    // quota
  }
}

function ensureFeature(store: PracticeStatsStore, feature: PracticeFeatureKey): FeatureStats {
  if (!store[feature]) {
    store[feature] = { items: {}, sessions: 0, lastSessionDate: null };
  }
  return store[feature]!;
}

export function recordPracticeResult(
  feature: PracticeFeatureKey,
  itemId: string,
  correct: boolean,
): void {
  const store = load();
  const feat = ensureFeature(store, feature);
  const today = new Date().toISOString().slice(0, 10);

  if (!feat.items[itemId]) {
    feat.items[itemId] = { correct: 0, total: 0, lastPracticed: today };
  }
  const item = feat.items[itemId];
  item.total++;
  if (correct) item.correct++;
  item.lastPracticed = today;

  save(store);
}

export function recordSessionEnd(feature: PracticeFeatureKey): void {
  const store = load();
  const feat = ensureFeature(store, feature);
  feat.sessions++;
  feat.lastSessionDate = new Date().toISOString().slice(0, 10);
  save(store);
}

export function getFeatureStats(feature: PracticeFeatureKey): FeatureStats {
  const store = load();
  return store[feature] ?? { items: {}, sessions: 0, lastSessionDate: null };
}

export function getItemAccuracy(feature: PracticeFeatureKey, itemId: string): number | null {
  const stats = getFeatureStats(feature);
  const item = stats.items[itemId];
  if (!item || item.total === 0) return null;
  return item.correct / item.total;
}

export function getWeakItems(feature: PracticeFeatureKey, limit: number = 10): string[] {
  const stats = getFeatureStats(feature);
  return Object.entries(stats.items)
    .filter(([, s]) => s.total >= 2)
    .sort(([, a], [, b]) => {
      const accA = a.total > 0 ? a.correct / a.total : 1;
      const accB = b.total > 0 ? b.correct / b.total : 1;
      return accA - accB;
    })
    .slice(0, limit)
    .map(([id]) => id);
}

/**
 * Read SRS difficulty for an atom (read-only — practice never writes to SRS).
 * Returns difficulty 1-10 or null if the atom has no SRS state.
 */
export function getAtomSrsDifficulty(atomId: string): number | null {
  const store = getSRSStore();
  const state: SRSCardState | undefined = store[atomId];
  if (!state) return null;
  return Math.max(state.recognition.difficulty, state.production.difficulty);
}

/**
 * Pick an item from a pool, weighted toward items the learner struggles with.
 * Combines practice-local accuracy with SRS difficulty for a composite score.
 *
 * Higher score = more likely to be selected. Items with no history get a
 * moderate weight so they still appear (exploration).
 */
export function pickWeighted<T>(
  pool: T[],
  getId: (item: T) => string,
  feature: PracticeFeatureKey,
  atomIdResolver?: (item: T) => string | null,
): T {
  if (pool.length <= 1) return pool[0];

  const weights = pool.map((item) => {
    const id = getId(item);
    let weight = 1.0;

    // Practice accuracy: lower accuracy = higher weight
    const acc = getItemAccuracy(feature, id);
    if (acc !== null) {
      weight += (1 - acc) * 2;
    } else {
      weight += 0.5; // unseen items get moderate exploration weight
    }

    // SRS difficulty: higher difficulty = higher weight
    if (atomIdResolver) {
      const atomId = atomIdResolver(item);
      if (atomId) {
        const diff = getAtomSrsDifficulty(atomId);
        if (diff !== null) {
          weight += (diff / 10) * 1.5;
        }
      }
    }

    return weight;
  });

  const totalWeight = weights.reduce((a, b) => a + b, 0);
  let r = Math.random() * totalWeight;
  for (let i = 0; i < pool.length; i++) {
    r -= weights[i];
    if (r <= 0) return pool[i];
  }
  return pool[pool.length - 1];
}
