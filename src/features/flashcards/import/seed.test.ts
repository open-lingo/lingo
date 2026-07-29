import { describe, it, expect, beforeEach, vi } from "vitest";

const unlockAtomIds = vi.fn((ids: Iterable<string>) => [...ids].length);
vi.mock("@/features/lesson/data/unlockLessonAtoms", () => ({
  unlockAtomIds: (ids: Iterable<string>) => unlockAtomIds(ids),
}));

import { evidenceToSeedState, applyImport } from "./seed";
import { getCardState, setCardState } from "../engine/srsStorage";
import { createInitialState, reviewCard } from "../engine/srs";
import type { KnownItem } from "./types";
import type { ImportMatch } from "./match";
import type { CourseAtom } from "@/features/languages/ja/courseAtoms";

const TODAY = "2026-07-07";

function item(evidence: Partial<KnownItem["evidence"]>): KnownItem {
  return {
    expression: "x",
    evidence: {
      class: "active",
      intervalDays: 30,
      reps: 5,
      lapses: 1,
      ...evidence,
    },
  };
}

const stubAtom: CourseAtom = {
  id: "stub",
  kana: "すたぶ",
  romaji: "stub",
  meaningEn: "stub",
  pos: "noun",
  fromModule: "m7",
  kind: "vocab",
};

function match(cardId: string, it: KnownItem): ImportMatch {
  return { item: it, cardId, atom: stubAtom };
}

beforeEach(() => {
  localStorage.clear();
  unlockAtomIds.mockClear();
});

describe("evidenceToSeedState", () => {
  it("seeds recognition as a review-state card with carried reps/lapses", () => {
    const s = evidenceToSeedState(item({ intervalDays: 30, reps: 8, lapses: 2 }), TODAY);
    expect(s.recognition.state).toBe("review");
    expect(s.recognition.reps).toBe(8);
    expect(s.recognition.lapses).toBe(2);
    expect(s.recognition.difficulty).toBeGreaterThan(0); // derived FSRS D0, not 0
  });

  it("makes long-overdue cards due TODAY (not rescheduled forward)", () => {
    const s = evidenceToSeedState(
      item({ intervalDays: 10, lastReviewAt: "2020-01-01" }),
      TODAY,
    );
    expect(s.recognition.dueDate).toBe(TODAY);
  });

  it("keeps a not-yet-due card scheduled in the future", () => {
    const s = evidenceToSeedState(
      item({ intervalDays: 20, lastReviewAt: TODAY }),
      TODAY,
    );
    expect(s.recognition.dueDate > TODAY).toBe(true);
  });

  it("clamps stability to [1, 365]", () => {
    expect(evidenceToSeedState(item({ intervalDays: 999 }), TODAY).recognition.stability).toBe(365);
    expect(evidenceToSeedState(item({ intervalDays: 0 }), TODAY).recognition.stability).toBe(1);
  });

  it("halves the interval for suspended-reviewed evidence", () => {
    const s = evidenceToSeedState(
      item({ class: "suspended-reviewed", intervalDays: 100, lastReviewAt: TODAY }),
      TODAY,
    );
    expect(s.recognition.stability).toBe(50);
    expect(s.recognition.interval).toBe(50);
  });

  it("enters production NEW and due alongside recognition", () => {
    const s = evidenceToSeedState(item({ intervalDays: 40, lastReviewAt: TODAY }), TODAY);
    expect(s.production.state).toBe("new");
    expect(s.production.reps).toBe(0);
    expect(s.production.dueDate).toBe(s.recognition.dueDate);
  });
});

describe("applyImport", () => {
  it("seeds fresh cards and writes them through the store setter", () => {
    const report = applyImport([match("ja:imp-a", item({ intervalDays: 30 }))], {
      unlockAtoms: false,
      today: TODAY,
    });
    expect(report.seededCards).toBe(1);
    expect(report.skippedExisting).toBe(0);
    expect(getCardState("ja:imp-a")?.recognition.state).toBe("review");
  });

  it("no-clobber: skips cards with real progress on either modality", () => {
    // Give ja:imp-b real review history (reps > 0).
    const progressed = reviewCard(createInitialState(), "recognition", "good");
    setCardState("ja:imp-b", progressed);
    const before = getCardState("ja:imp-b");

    const report = applyImport([match("ja:imp-b", item({ intervalDays: 200 }))], {
      unlockAtoms: false,
      today: TODAY,
    });
    expect(report.seededCards).toBe(0);
    expect(report.skippedExisting).toBe(1);
    expect(getCardState("ja:imp-b")).toEqual(before); // untouched
  });

  it("unlocks EXACTLY the matched card ids when the toggle is on", () => {
    applyImport(
      [
        match("ja:imp-c", item({})),
        match("ja:imp-d", item({})),
      ],
      { unlockAtoms: true, today: TODAY },
    );
    expect(unlockAtomIds).toHaveBeenCalledTimes(1);
    const passed = [...unlockAtomIds.mock.calls[0][0]];
    expect(passed.sort()).toEqual(["ja:imp-c", "ja:imp-d"]);
  });

  it("does not unlock when the toggle is off", () => {
    applyImport([match("ja:imp-e", item({}))], { unlockAtoms: false, today: TODAY });
    expect(unlockAtomIds).not.toHaveBeenCalled();
  });

  it("counts matchedItems and multiMatches (one item crediting two atoms)", () => {
    const shared = item({ intervalDays: 30 });
    const report = applyImport(
      [match("ja:imp-f", shared), match("ja:imp-g", shared)],
      { unlockAtoms: false, today: TODAY },
    );
    expect(report.matchedItems).toBe(1);
    expect(report.multiMatches).toBe(1);
    expect(report.seededCards).toBe(2);
  });

  it("threads unmatched through to the report", () => {
    const un = item({});
    const report = applyImport([], { unlockAtoms: false, unmatched: [un], today: TODAY });
    expect(report.unmatched).toEqual([un]);
  });
});
