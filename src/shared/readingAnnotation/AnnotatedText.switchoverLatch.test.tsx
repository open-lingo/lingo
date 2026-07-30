import { describe, it, expect, beforeEach } from "vitest";
import { kanjiSurfaceLatchVisible } from "./AnnotatedText";
import {
  latchKanji,
  resetKanjiLatchStore,
} from "@/features/languages/ja/secondScript/kanjiSwitchoverLatch";
import {
  isSwitchoverAtom,
  switchoverUnlockModule,
} from "@/features/languages/ja/secondScript/switchoverCandidate";
import { KANJI_ELIGIBLE_ATOMS } from "@/features/languages/ja/secondScript/applyKanjiSurfaces";
import { SWITCHOVER_GRACE_MODULES } from "@/features/languages/ja/secondScript/kanjiRollout";
import type { JapaneseAnnotation } from "@/shared/japanese/types";

/**
 * The SURFACE gate (B061) — whether a kanji shows at all.
 *
 * This is the highest-blast-radius part of the switchover beat: it changes what
 * every annotated segment in the app renders. The properties below are what keep
 * it safe, and each one corresponds to a way it could quietly break the course.
 */

function switchoverFixture() {
  const id = [...KANJI_ELIGIBLE_ATOMS.keys()].find((k) => isSwitchoverAtom(k));
  if (!id) throw new Error("no switchover atom in the catalog");
  const entry = KANJI_ELIGIBLE_ATOMS.get(id)!;
  return { atomId: id, kanji: entry.kanji, unlock: entry.unlockModule };
}

function bornWithKanjiFixture() {
  const id = [...KANJI_ELIGIBLE_ATOMS.keys()].find((k) => !isSwitchoverAtom(k));
  if (!id) throw new Error("no born-with-kanji atom in the catalog");
  const entry = KANJI_ELIGIBLE_ATOMS.get(id)!;
  return { atomId: id, kanji: entry.kanji, unlock: entry.unlockModule };
}

/** A segment shaped like `applyKanjiSurfaces`' output. */
function stamped(atomId: string, kanji: string): JapaneseAnnotation {
  return {
    surface: kanji,
    reading: "かな",
    atomId,
    furiganaWindowOpen: true,
  };
}

beforeEach(() => {
  resetKanjiLatchStore();
});

describe("kanjiSurfaceLatchVisible", () => {
  it("withholds an un-introduced switchover kanji inside the grace window", () => {
    const f = switchoverFixture();
    expect(kanjiSurfaceLatchVisible(stamped(f.atomId, f.kanji), f.unlock)).toBe(false);
  });

  it("shows it once the beat has introduced it", () => {
    const f = switchoverFixture();
    latchKanji(f.atomId, "2026-07-29");
    expect(kanjiSurfaceLatchVisible(stamped(f.atomId, f.kanji), f.unlock)).toBe(true);
  });

  it("FAILS OPEN past the grace window", () => {
    // Non-negotiable: 124 words against a finite queue means some will not be
    // reached, and a permanently invisible kanji is a worse failure than an
    // un-introduced one.
    const f = switchoverFixture();
    const seg = stamped(f.atomId, f.kanji);
    expect(
      kanjiSurfaceLatchVisible(seg, f.unlock + SWITCHOVER_GRACE_MODULES - 1),
    ).toBe(false);
    expect(
      kanjiSurfaceLatchVisible(seg, f.unlock + SWITCHOVER_GRACE_MODULES),
    ).toBe(true);
  });

  it("fails open with no module context at all", () => {
    // The vocab browser, dictionary and flashcard reviewer render outside a
    // lesson. Withholding there would make a word look different depending on
    // WHERE it is read, which is the inconsistency this feature exists to remove.
    const f = switchoverFixture();
    expect(kanjiSurfaceLatchVisible(stamped(f.atomId, f.kanji), null)).toBe(true);
    expect(kanjiSurfaceLatchVisible(stamped(f.atomId, f.kanji))).toBe(true);
  });

  it("never withholds a born-with-kanji word", () => {
    // ~30 eligible words are taught at or after their unlock. Gating those would
    // hide a form the learner met on day one and never get a beat to restore it.
    const f = bornWithKanjiFixture();
    expect(kanjiSurfaceLatchVisible(stamped(f.atomId, f.kanji), f.unlock)).toBe(true);
  });

  it("never withholds a segment the substitution pass did not stamp", () => {
    // Hand-authored kanji, kanji_reading prompts and every kana segment. The gate
    // only ever withholds what the pass itself put there.
    const f = switchoverFixture();
    expect(
      kanjiSurfaceLatchVisible({ surface: f.kanji, reading: "かな", atomId: f.atomId }),
    ).toBe(true);
    expect(
      kanjiSurfaceLatchVisible({
        surface: f.kanji,
        reading: "かな",
        furiganaWindowOpen: true,
      }),
    ).toBe(true);
  });

  it("never withholds the furigana-suppressed shape (reading === surface)", () => {
    // That is the `kanji_reading` prompt: the answer must never float, and the
    // kanji IS the question, so withholding it would blank the step.
    const f = switchoverFixture();
    expect(
      kanjiSurfaceLatchVisible(
        { surface: f.kanji, reading: f.kanji, atomId: f.atomId, furiganaWindowOpen: false },
        f.unlock,
      ),
    ).toBe(true);
  });

  it("agrees with the selector about what a switchover is", () => {
    // If these two ever disagree, a word could be withheld by the renderer while
    // the selector refuses to ever introduce it — permanently invisible kanji.
    for (const atomId of KANJI_ELIGIBLE_ATOMS.keys()) {
      const entry = KANJI_ELIGIBLE_ATOMS.get(atomId)!;
      const withheld = !kanjiSurfaceLatchVisible(
        stamped(atomId, entry.kanji),
        entry.unlockModule,
      );
      if (withheld) {
        expect(isSwitchoverAtom(atomId), atomId).toBe(true);
        expect(switchoverUnlockModule(atomId), atomId).toBe(entry.unlockModule);
      }
    }
  });
});

describe("furigana after the introduction (B064)", () => {
  it("keeps furigana for a backlog word that latched past its module window", async () => {
    // The failure this fixes: m22 makes 22 words eligible at once and the queue
    // takes ~4 modules to drain, so a word unlocked at m22 can be introduced at
    // m26 — past unlock+2 — and if it is FSRS-mastered (likely for a word known
    // since m1) it appeared BARE seconds after its own reveal.
    const { kanjiFuriganaSrsVisible } = await import("./AnnotatedText");
    const { FURIGANA_DAYS_AFTER_LATCH } = await import(
      "@/features/languages/ja/secondScript/kanjiRollout"
    );
    const f = switchoverFixture();

    // Pass output for a learner PAST the module window: furiganaWindowOpen false.
    const pastWindow: JapaneseAnnotation = {
      surface: f.kanji,
      reading: "かな",
      atomId: f.atomId,
      furiganaWindowOpen: false,
    };

    latchKanji(f.atomId, todayIso());
    expect(kanjiFuriganaSrsVisible(pastWindow)).toBe(true);

    // ...and it lapses once the post-introduction window is spent.
    resetKanjiLatchStore();
    latchKanji(f.atomId, daysAgo(FURIGANA_DAYS_AFTER_LATCH + 1));
    // Falls back to the legacy rule (window OR unmastered). With an empty SRS
    // store the word is unmastered, so furigana still shows — the point is only
    // that the LATCH is no longer what is keeping it on.
    const { withinFuriganaLatchWindow } = await import(
      "@/features/languages/ja/secondScript/kanjiSwitchoverLatch"
    );
    expect(
      withinFuriganaLatchWindow(f.atomId, todayIso(), FURIGANA_DAYS_AFTER_LATCH),
    ).toBe(false);
  });
});

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}
function daysAgo(n: number): string {
  return new Date(Date.now() - n * 86400000).toISOString().slice(0, 10);
}
