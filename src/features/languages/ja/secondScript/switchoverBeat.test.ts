import { describe, it, expect, beforeEach } from "vitest";
import * as latchModule from "./kanjiSwitchoverLatch";
import {
  isKanjiLatched,
  kanjiLatchedAt,
  latchKanji,
  resetKanjiLatchStore,
} from "./kanjiSwitchoverLatch";
import {
  isSwitchoverAtom,
  pickSwitchoverCandidates,
  switchoverUnlockModule,
} from "./switchoverCandidate";
import { KANJI_ELIGIBLE_ATOMS } from "./applyKanjiSurfaces";
import {
  MAX_SWITCHOVER_BEATS_PER_REVIEW,
  MAX_SWITCHOVER_MISSES,
  SWITCHOVER_GRACE_MODULES,
} from "./kanjiRollout";
import { setCardState, clearSRSStore } from "@/features/flashcards/engine/srsStorage";
import { createInitialState } from "@/features/flashcards/engine/srs";
import type { SRSCardState } from "@/features/flashcards/data/types";
import { JA_COURSE_ATOMS_BY_ID } from "../courseAtoms";

/**
 * The kana→kanji switchover beat (B061) — trigger, latch, and drain.
 *
 * These pin the properties that make the feature safe rather than merely working:
 * the latch never reverts, an unknown word is never introduced, and the queue can
 * actually drain against the number of review lessons that exist.
 */

/** A card state whose interval clears (or misses) the readiness bar. */
function cardWithInterval(days: number): SRSCardState {
  const base = createInitialState();
  return {
    ...base,
    recognition: { ...base.recognition, interval: days },
    production: { ...base.production, interval: days },
  };
}

/** Every switchover atom, cheapest way to get realistic fixtures. */
function switchovers(): { atomId: string; unlock: number }[] {
  return [...KANJI_ELIGIBLE_ATOMS.entries()]
    .filter(([id]) => isSwitchoverAtom(id))
    .map(([atomId, e]) => ({ atomId, unlock: e.unlockModule }));
}

beforeEach(() => {
  resetKanjiLatchStore();
  clearSRSStore();
});

describe("latch store", () => {
  it("starts empty and records a latch", () => {
    expect(isKanjiLatched("tomodachi")).toBe(false);
    latchKanji("tomodachi", "2026-07-29");
    expect(isKanjiLatched("tomodachi")).toBe(true);
    expect(kanjiLatchedAt("tomodachi")).toBe("2026-07-29");
  });

  it("accepts bare and canonical ids interchangeably", () => {
    latchKanji("tomodachi", "2026-07-29");
    expect(isKanjiLatched("ja:tomodachi")).toBe(true);
  });

  it("KEEPS the original date on re-latch", () => {
    // Furigana duration is measured from the latch date; a repeat (e.g. the beat
    // replaying on a second device, where the store is not synced) must not
    // restart the scaffold.
    latchKanji("tomodachi", "2026-07-01");
    latchKanji("tomodachi", "2026-07-29");
    expect(kanjiLatchedAt("tomodachi")).toBe("2026-07-01");
  });

  it("exposes no way to un-latch a single word", () => {
    // Reverting is the single most-reported complaint about Duolingo's kanji
    // ("words that used to be kanji now just aren't"), so the ABSENCE of an
    // un-latch API is the design. `resetKanjiLatchStore` is the test/dev
    // sledgehammer and is named to say so.
    const removers = Object.keys(latchModule).filter((k) =>
      /unlatch|revert|remove|delete|clear/i.test(k),
    );
    expect(removers).toEqual([]);
  });
});

describe("candidate selection", () => {
  it("respects the module floor — never introduces an unteachable glyph", () => {
    // Without this a mature ともだち could be shown 友達 at m3, before the learner
    // has met either glyph.
    const late = switchovers().find((s) => s.unlock >= 20);
    expect(late, "expected a switchover unlocking at m20+").toBeDefined();
    setCardState(late!.atomId, cardWithInterval(60));
    const unlocked = new Set([late!.atomId]);
    expect(
      pickSwitchoverCandidates({
        learnerModule: late!.unlock - 1,
        unlockedAtomIds: unlocked,
      }),
    ).toEqual([]);
    expect(
      pickSwitchoverCandidates({
        learnerModule: late!.unlock,
        unlockedAtomIds: unlocked,
      }),
    ).toHaveLength(1);
  });

  it("skips words the learner has not unlocked", () => {
    const target = switchovers()[0];
    setCardState(target.atomId, cardWithInterval(60));
    expect(
      pickSwitchoverCandidates({ learnerModule: 29, unlockedAtomIds: new Set() }),
    ).toEqual([]);
  });

  it("never offers an already-latched word", () => {
    const target = switchovers()[0];
    setCardState(target.atomId, cardWithInterval(60));
    const unlocked = new Set([target.atomId]);
    expect(
      pickSwitchoverCandidates({ learnerModule: 29, unlockedAtomIds: unlocked }),
    ).toHaveLength(1);
    latchKanji(target.atomId, "2026-07-29");
    expect(
      pickSwitchoverCandidates({ learnerModule: 29, unlockedAtomIds: unlocked }),
    ).toEqual([]);
  });

  it("never offers a born-with-kanji word", () => {
    // ~30 eligible words are taught at or after their unlock module. They have no
    // switchover, and a beat for them would "introduce" a form the learner met on
    // day one.
    const born = [...KANJI_ELIGIBLE_ATOMS.keys()].filter(
      (id) => !isSwitchoverAtom(id),
    );
    expect(born.length).toBeGreaterThan(0);
    for (const id of born) setCardState(id, cardWithInterval(90));
    const picked = pickSwitchoverCandidates({
      learnerModule: 30,
      unlockedAtomIds: new Set(born),
      limit: 50,
    });
    expect(picked).toEqual([]);
  });

  it("caps at the per-review policy and is deterministic", () => {
    const ready = switchovers().slice(0, 10);
    for (const s of ready) setCardState(s.atomId, cardWithInterval(60));
    const unlocked = new Set(ready.map((s) => s.atomId));
    const a = pickSwitchoverCandidates({ learnerModule: 30, unlockedAtomIds: unlocked });
    const b = pickSwitchoverCandidates({ learnerModule: 30, unlockedAtomIds: unlocked });
    expect(a.length).toBeLessThanOrEqual(MAX_SWITCHOVER_BEATS_PER_REVIEW);
    expect(a.map((c) => c.atomId)).toEqual(b.map((c) => c.atomId));
  });

  it("drains earliest-unlock first", () => {
    const ready = switchovers()
      .slice()
      .sort((x, y) => y.unlock - x.unlock)
      .slice(0, 6);
    for (const s of ready) setCardState(s.atomId, cardWithInterval(60));
    const picked = pickSwitchoverCandidates({
      learnerModule: 30,
      unlockedAtomIds: new Set(ready.map((s) => s.atomId)),
      limit: 6,
    });
    const mods = picked.map((c) => c.unlockModule);
    expect(mods).toEqual([...mods].sort((a, b) => a - b));
  });

  it("carries an honest part list — null where no standalone sense exists", () => {
    const target = switchovers().find((s) => s.atomId.includes("tomodachi"))
      ?? switchovers()[0];
    setCardState(target.atomId, cardWithInterval(60));
    const [candidate] = pickSwitchoverCandidates({
      learnerModule: 30,
      unlockedAtomIds: new Set([target.atomId]),
    });
    expect(candidate).toBeDefined();
    expect(candidate.parts.map((p) => p.glyph).join("")).toBe(
      [...candidate.kanji].filter((c) => /\p{Script=Han}/u.test(c)).join(""),
    );
  });

  it("every candidate is a word the course actually teaches", () => {
    const ready = switchovers().slice(0, 20);
    for (const s of ready) setCardState(s.atomId, cardWithInterval(60));
    const picked = pickSwitchoverCandidates({
      learnerModule: 30,
      unlockedAtomIds: new Set(ready.map((s) => s.atomId)),
      limit: 20,
    });
    for (const c of picked) {
      expect(JA_COURSE_ATOMS_BY_ID.get(c.atomId), c.atomId).toBeDefined();
      expect(c.kana.length).toBeGreaterThan(0);
      expect(c.gloss.length).toBeGreaterThan(0);
      expect(switchoverUnlockModule(c.atomId)).toBe(c.unlockModule);
    }
  });
});

describe("queue capacity — the beat has to be able to drain", () => {
  it("two beats per review covers the switchover backlog", () => {
    // Measured 2026-07-29: 66 review lessons at m8+ (3 per module, m8–m29). At
    // one beat each, 58 of 124 words could never be introduced — and because the
    // render gate withholds an un-introduced kanji, those would stay kana for the
    // whole course. This is the arithmetic that forced the cap to 2; if either
    // number moves, this test is where it surfaces.
    const REVIEW_HOSTS_M8_PLUS = 66;
    const backlog = switchovers().length;
    expect(backlog).toBeGreaterThan(100);
    expect(REVIEW_HOSTS_M8_PLUS * MAX_SWITCHOVER_BEATS_PER_REVIEW).toBeGreaterThanOrEqual(
      backlog,
    );
  });

  it("fails open past the grace window rather than hiding a kanji forever", () => {
    // The grace window is the safety valve for a queue that does not reach a
    // word. It must be positive, or an unreached word is invisible for good.
    expect(SWITCHOVER_GRACE_MODULES).toBeGreaterThan(0);
  });

  it("grace covers the measured worst-case backlog", () => {
    // m22 alone makes 22 words eligible at once; at 6 slots per module that takes
    // about four modules to clear. A grace of 3 would have failed those words open
    // BEFORE their beat ran, defeating the feature exactly where it is under most
    // load.
    expect(SWITCHOVER_GRACE_MODULES).toBeGreaterThanOrEqual(4);
  });

  it("gives a missed word exactly one retry", () => {
    expect(MAX_SWITCHOVER_MISSES).toBe(1);
  });
});
