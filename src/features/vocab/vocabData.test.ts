import { describe, it, expect } from "vitest";
import { buildVocabRows, filterVocab, sortVocab, moduleLabel, moduleOrder } from "./vocabData";
import type { SRSStore } from "@/features/flashcards/engine";
import type {
  SRSCardState,
  SRSModalityState,
} from "@/features/flashcards/data/types";

function sub(over: Partial<SRSModalityState> = {}): SRSModalityState {
  return {
    stability: 1,
    difficulty: 5,
    state: "new",
    interval: 0,
    dueDate: "2026-07-16",
    lastReviewDate: "",
    reps: 0,
    lapses: 0,
    ...over,
  };
}

function card(
  recognition: Partial<SRSModalityState>,
  production: Partial<SRSModalityState> = {},
): SRSCardState {
  return { recognition: sub(recognition), production: sub(production) };
}

const EMPTY = { srsStore: {}, unlockedIds: new Set<string>() };

describe("buildVocabRows", () => {
  it("returns nothing for languages without an atom catalog", () => {
    expect(buildVocabRows("fr", EMPTY)).toEqual([]);
  });

  it("builds JA rows and tags untouched words as new + locked", () => {
    const rows = buildVocabRows("ja", EMPTY);
    expect(rows.length).toBeGreaterThan(0);
    expect(rows.every((r) => r.id.startsWith("ja:"))).toBe(true);
    expect(rows.every((r) => r.tier === "new")).toBe(true);
    expect(rows.every((r) => !r.unlocked)).toBe(true);
  });

  it("builds ES rows with surface, meaning and inline gender", () => {
    const rows = buildVocabRows("es", EMPTY);
    expect(rows.length).toBeGreaterThan(0);
    expect(rows.every((r) => r.id.startsWith("es:"))).toBe(true);
    // Latin script: romaji falls back to the surface so search/sort work.
    expect(rows.every((r) => r.romaji.length > 0)).toBe(true);
    // No sentence tiles in the word grid.
    expect(rows.every((r) => r.kind !== "phrase")).toBe(true);
    const hola = rows.find((r) => r.id === "es:hola")!;
    expect(hola.kana).toBe("hola");
    expect(hola.meaning).toBe("hello");
    expect(hola.romaji).toBe("hola");
    // Gendered nouns surface their gender in the free-text meaning.
    const gendered = rows.filter((r) => /\((m|f)\.\)$/.test(r.meaning));
    expect(gendered.length).toBeGreaterThan(0);
  });

  it("builds KO rows without alphabet material", () => {
    const rows = buildVocabRows("ko", EMPTY);
    expect(rows.length).toBeGreaterThan(0);
    expect(rows.every((r) => r.id.startsWith("ko:"))).toBe(true);
    // Jamo are alphabet-trainer territory, never vocab rows.
    expect(rows.some((r) => r.kana === "ㄱ")).toBe(false);
  });

  it("marks unlock-store atoms as learned", () => {
    const sample = buildVocabRows("ja", EMPTY)[0];
    const rows = buildVocabRows("ja", {
      srsStore: {},
      unlockedIds: new Set([sample.id]),
    });
    const learned = rows.find((r) => r.id === sample.id)!;
    expect(learned.unlocked).toBe(true);
    expect(rows.filter((r) => r.unlocked)).toHaveLength(1);
  });

  it("derives tiers from the SRS store", () => {
    const base = buildVocabRows("ja", EMPTY);
    const [a, b, c, d] = base.slice(0, 4);
    const srsStore: SRSStore = {
      // Untouched — stays "new".
      [a.id]: card({}, {}),
      // Graded but still in FSRS learning steps.
      [b.id]: card({ state: "learning", reps: 1, interval: 1 }),
      // Both graded modalities graduated to review, below mastery interval.
      [c.id]: card(
        { state: "review", reps: 3, interval: 5 },
        { state: "review", reps: 2, interval: 4 },
      ),
      // Both modalities at/over the mastery interval (21d).
      [d.id]: card(
        { state: "review", reps: 8, interval: 30 },
        { state: "review", reps: 7, interval: 25 },
      ),
    };
    const rows = buildVocabRows("ja", { srsStore, unlockedIds: new Set() });
    const tier = (id: string) => rows.find((r) => r.id === id)!.tier;
    expect(tier(a.id)).toBe("new");
    expect(tier(b.id)).toBe("learning");
    expect(tier(c.id)).toBe("reviewing");
    expect(tier(d.id)).toBe("mastered");
  });

  it("computes retention + encounters from FSRS reps/lapses", () => {
    const sample = buildVocabRows("ja", EMPTY)[0];
    const srsStore: SRSStore = {
      [sample.id]: card(
        { state: "review", reps: 6, lapses: 1, interval: 5 },
        { state: "review", reps: 2, lapses: 1, interval: 3 },
      ),
    };
    const row = buildVocabRows("ja", { srsStore, unlockedIds: new Set() }).find(
      (r) => r.id === sample.id,
    )!;
    expect(row.encounters).toBe(8);
    // 8 reps / (8 reps + 2 lapses) = 80%
    expect(row.retention).toBe(80);
  });
});

describe("filterVocab", () => {
  const base = buildVocabRows("ja", EMPTY);
  const learnedId = base[0].id;
  const rows = buildVocabRows("ja", {
    srsStore: {},
    unlockedIds: new Set([learnedId]),
  });
  const none = { module: [], kind: [], mastery: [], learned: [] };

  it("filters by free-text search across romaji/meaning", () => {
    const out = filterVocab(rows, none, rows[0].romaji);
    expect(out.some((r) => r.id === rows[0].id)).toBe(true);
  });

  it("filters by kind", () => {
    const particles = filterVocab(rows, { ...none, kind: ["particle"] }, "");
    expect(particles.every((r) => r.kind === "particle")).toBe(true);
  });

  it("filters by mastery tier", () => {
    const out = filterVocab(rows, { ...none, mastery: ["new"] }, "");
    expect(out.length).toBe(rows.length); // all untouched are new
  });

  it("filters by learned / not-yet-taught buckets", () => {
    const learned = filterVocab(rows, { ...none, learned: ["learned"] }, "");
    expect(learned.map((r) => r.id)).toEqual([learnedId]);
    const locked = filterVocab(rows, { ...none, learned: ["locked"] }, "");
    expect(locked.length).toBe(rows.length - 1);
    expect(locked.some((r) => r.id === learnedId)).toBe(false);
    // Both buckets selected = everything (same as no selection).
    const both = filterVocab(
      rows,
      { ...none, learned: ["learned", "locked"] },
      "",
    );
    expect(both.length).toBe(rows.length);
  });
});

describe("sortVocab", () => {
  it("orders in-progress tiers first, mastered last", () => {
    const rows = [
      { tier: "mastered", module: "m1", romaji: "a" },
      { tier: "new", module: "m1", romaji: "b" },
      { tier: "reviewing", module: "m1", romaji: "c" },
      { tier: "learning", module: "m1", romaji: "d" },
    ] as ReturnType<typeof buildVocabRows>;
    expect(sortVocab(rows).map((r) => r.tier)).toEqual([
      "learning",
      "reviewing",
      "new",
      "mastered",
    ]);
  });
});

describe("module helpers", () => {
  it("labels and orders modules", () => {
    expect(moduleLabel("m3")).toBe("Module 3");
    expect(moduleLabel("future")).toBe("Upcoming");
    expect(moduleOrder("m2")).toBeLessThan(moduleOrder("m10"));
    expect(moduleOrder("m5")).toBeLessThan(moduleOrder("future"));
  });
});
