import { describe, it, expect } from "vitest";
import { getDictionaryEntries } from "@/shared/dictionary";
import { createInitialState, getToday, addDays } from "@/features/flashcards/engine";
import type { SRSCardState } from "@/features/flashcards/data/types";
import {
  getKnownAtomsByPos,
  getDueOrStruggling,
  getReachedModule,
} from "./learnedContent";
import type { LearnerStores } from "./types";

/** A card that is due today (recognition due, high difficulty). */
function dueStrugglingState(): SRSCardState {
  const s = createInitialState();
  s.recognition = {
    ...s.recognition,
    reps: 4,
    difficulty: 9,
    interval: 2,
    state: "review",
    dueDate: getToday(),
  };
  s.production = {
    ...s.production,
    reps: 4,
    difficulty: 9,
    interval: 2,
    state: "review",
    dueDate: getToday(),
  };
  return s;
}

/** A mastered card, not due (long interval, far future). */
function masteredState(): SRSCardState {
  const s = createInitialState();
  const far = addDays(getToday(), 60);
  s.recognition = {
    ...s.recognition,
    reps: 10,
    difficulty: 2,
    interval: 40,
    state: "review",
    dueDate: far,
  };
  s.production = {
    ...s.production,
    reps: 10,
    difficulty: 2,
    interval: 40,
    state: "review",
    dueDate: far,
  };
  return s;
}

const jaNouns = getDictionaryEntries("ja", { pos: "noun", maxUnlockModule: 8 });

describe("getKnownAtomsByPos", () => {
  it("returns only unlocked atoms, filtered by POS, with correct pos", () => {
    const unlockedNouns = jaNouns.slice(0, 3);
    const excludedNoun = jaNouns[10]; // unlocked=false
    const stores: LearnerStores = {
      unlocked: new Set(unlockedNouns.map((e) => e.id)),
      srs: {},
    };

    const known = getKnownAtomsByPos("ja", "noun", { stores });
    const ids = known.map((a) => a.id).sort();

    expect(ids).toEqual(unlockedNouns.map((e) => e.id).sort());
    expect(known.every((a) => a.pos === "noun")).toBe(true);
    expect(ids).not.toContain(excludedNoun.id);
  });

  it("excludes an unlocked atom of a different POS when filtering", () => {
    const noun = jaNouns[0];
    const adj = getDictionaryEntries("ja", { pos: "adjective", maxUnlockModule: 8 })[0];
    const stores: LearnerStores = {
      unlocked: new Set([noun.id, adj.id]),
      srs: {},
    };
    const nouns = getKnownAtomsByPos("ja", "noun", { stores });
    expect(nouns.map((a) => a.id)).toContain(noun.id);
    expect(nouns.map((a) => a.id)).not.toContain(adj.id);
  });

  it("derives SRS tier + due + weight from the injected SRS store", () => {
    const [dueNoun, masteredNoun, freshNoun] = jaNouns;
    const stores: LearnerStores = {
      unlocked: new Set([dueNoun.id, masteredNoun.id, freshNoun.id]),
      srs: {
        [dueNoun.id]: dueStrugglingState(),
        [masteredNoun.id]: masteredState(),
        // freshNoun: no state → tier "new"
      },
    };
    const known = getKnownAtomsByPos("ja", "noun", { stores });
    const byId = new Map(known.map((a) => [a.id, a]));

    expect(byId.get(dueNoun.id)!.tier).toBe("reviewing");
    expect(byId.get(dueNoun.id)!.due).toBe(true);
    expect(byId.get(masteredNoun.id)!.tier).toBe("mastered");
    expect(byId.get(masteredNoun.id)!.due).toBe(false);
    expect(byId.get(freshNoun.id)!.tier).toBe("new");

    // Due + struggling weighs more than mastered-not-due and than a fresh atom.
    expect(byId.get(dueNoun.id)!.weight).toBeGreaterThan(byId.get(masteredNoun.id)!.weight);
    expect(byId.get(dueNoun.id)!.weight).toBeGreaterThan(byId.get(freshNoun.id)!.weight);
  });
});

describe("getReachedModule", () => {
  it("returns the max numeric unlock module across unlocked atoms", () => {
    const at3 = getDictionaryEntries("ja").filter((e) => e.unlockModule === "m3");
    const at7 = getDictionaryEntries("ja").filter((e) => e.unlockModule === "m7");
    const stores: LearnerStores = {
      unlocked: new Set([at3[0].id, at7[0].id]),
      srs: {},
    };
    expect(getReachedModule("ja", stores)).toBe(7);
  });

  it("is 0 for a learner with nothing unlocked", () => {
    expect(getReachedModule("ja", { unlocked: new Set(), srs: {} })).toBe(0);
  });
});

describe("getDueOrStruggling", () => {
  it("surfaces due/struggling atoms, highest weight first", () => {
    const [dueNoun, masteredNoun] = jaNouns;
    const stores: LearnerStores = {
      unlocked: new Set([dueNoun.id, masteredNoun.id]),
      srs: {
        [dueNoun.id]: dueStrugglingState(),
        [masteredNoun.id]: masteredState(),
      },
    };
    const pool = getDueOrStruggling("ja", { stores });
    expect(pool[0].id).toBe(dueNoun.id);
    expect(pool.map((a) => a.id)).not.toContain(masteredNoun.id);
  });
});
