import { describe, it, expect } from "vitest";
import {
  isDedicatedReviewLesson,
  shouldWriteContentReviewAtom,
  shouldWriteReviewLessonAtom,
} from "./reviewTailSrs";
import { JA_COURSE_ATOMS } from "@/features/languages/ja/courseAtoms";

/**
 * D2 gate (docs/srs-scheduling-model-2026-06-15.md) — decides which vocab
 * atoms a graded step in a content sub-lesson advances in Track A FSRS.
 *
 * Atom ids are grounded in real `JA_COURSE_ATOMS` entries:
 *  - `neko`          — fromModule m1, introducedByLessonId "ja-m3-3"
 *  - `ja-m4-1-v-pen` — fromModule m4, introducedByLessonId "ja-m4-1"
 *  - `ja-m6-1-koen` — fromModule m32 since the 2026-08-20 restamp (the m32
 *    directions lesson is its real teach) — the forward-reference fixture
 */
describe("isDedicatedReviewLesson", () => {
  it("matches ja-mN-review-1/2 only", () => {
    expect(isDedicatedReviewLesson("ja-m3-review-1")).toBe(true);
    expect(isDedicatedReviewLesson("ja-m4-review-2")).toBe(true);
    expect(isDedicatedReviewLesson("ja-m4-1-1")).toBe(false);
    expect(isDedicatedReviewLesson("ja-m4-review-test")).toBe(false);
    expect(isDedicatedReviewLesson("ko-m1-review-1")).toBe(false);
  });
});

describe("shouldWriteContentReviewAtom (D2 prior-atom gate)", () => {
  it("WRITES a strictly-prior-module atom reviewed in a later content lesson", () => {
    // neko (m1) reviewed in an m4 sub-lesson tail — genuine spaced retrieval.
    expect(shouldWriteContentReviewAtom("neko", "ja-m4-1-1")).toBe(true);
  });

  it("SKIPS the lesson's own current-module just-introduced word", () => {
    // ペン is m4 material introduced in ja-m4-1; grading it in ja-m4-1-1 is
    // same-day (D6). Excluded by BOTH module-precedence and introduced-here.
    expect(shouldWriteContentReviewAtom("ja-m4-1-v-pen", "ja-m4-1-1")).toBe(false);
  });

  it("SKIPS a kana-word re-introduced as vocab from an earlier kana module", () => {
    // neko is fromModule m1 but introducedByLessonId "ja-m3-3" — it is BRAND
    // NEW material in the ja-m3-3-x sub-lessons. Module-precedence alone
    // (m1 < m3) would wrongly write; the introduced-here guard catches it.
    expect(shouldWriteContentReviewAtom("neko", "ja-m3-3-1")).toBe(false);
    expect(shouldWriteContentReviewAtom("neko", "ja-m3-3-2")).toBe(false);
  });

  it("SKIPS a forward-reference homograph (atom resolves to a later module)", () => {
    // The old fixture (すし in an m3 tail) retired 2026-08-20: Spencer's R2
    // ruling restamped すし to m1 (the sa-row anchor teaches it), so grading
    // it early is now correct. こうえん carries the same forward-reference
    // shape today — its true home is m32 (the directions lesson), so grading it
    // in any earlier tail must skip.
    expect(shouldWriteContentReviewAtom("ja-m6-1-koen", "ja-m4-1-1")).toBe(false);
  });

  it("SKIPS unknown / non-JA atom ids", () => {
    expect(shouldWriteContentReviewAtom("ko-something", "ja-m4-1-1")).toBe(false);
    expect(shouldWriteContentReviewAtom("not-an-atom", "ja-m4-1-1")).toBe(false);
  });

  it("SKIPS when the lesson id has no parseable module (sidequests etc.)", () => {
    expect(shouldWriteContentReviewAtom("neko", "ja-sidequest-travel")).toBe(false);
  });
});

/**
 * Review-lesson collision guard (learner-sim BLOCKER, 2026-07-29): review
 * lessons grade exercised atoms unconditionally, so an id colliding with an
 * unrelated later-module registry row silently wrote FSRS history onto
 * flashcards for unmet words. Real case: m11's plain-past beats emit
 * "shita"/"kita" (した/きた), which are the registry ids of 下 (m17) and
 * 北 (fromModule "future").
 */
describe("shouldWriteReviewLessonAtom (collision guard)", () => {
  it("skips ids that resolve to a LATER-module registry row", () => {
    // こうえん → m32 (the restamped truth): 32 > 11 → never grade in m11.
    expect(shouldWriteReviewLessonAtom("ja-m6-1-koen", "ja-m11-neo-review-3")).toBe(false);
  });

  it("skips ids that resolve to a non-module home (future / quest tags)", () => {
    // した → 下 and きた → 北, both fromModule "future" since 2026-08-20
    // (the restamp proved neither noun is taught) → parses to 0 → skip.
    expect(shouldWriteReviewLessonAtom("shita", "ja-m11-neo-review-3")).toBe(false);
    expect(shouldWriteReviewLessonAtom("kita", "ja-m11-neo-review-3")).toBe(false);
  });

  it("grades same-module and earlier-module atoms (legit review material)", () => {
    // どようび re-homed to m11 by the vocab pack — same module as the review.
    expect(shouldWriteReviewLessonAtom("doyoubi", "ja-m11-neo-review-1")).toBe(true);
    // ねこ (m1) reviewed anywhere later is fine.
    expect(shouldWriteReviewLessonAtom("neko", "ja-m11-neo-review-1")).toBe(true);
  });

  it("keeps grading ids with no registry row (IR-only inflections, non-JA)", () => {
    expect(shouldWriteReviewLessonAtom("wakatta-not-a-registry-id", "ja-m11-neo-review-3")).toBe(true);
    expect(shouldWriteReviewLessonAtom("es:hola", "es-m2-review-1")).toBe(true);
  });

  it("positive control: the colliding rows exist and are why the guard fires", () => {
    // If 下/北 were ever REMOVED from the registry, "shita"/"kita" would take
    // the no-registry-row path above and grade as inflections — the skips
    // would silently invert. Pin the rows themselves. (Both are fromModule
    // "future" since 2026-08-20: the restamp proved neither noun is taught —
    // the old m17 pin graded した in an m17 review, which no longer applies.)
    const shita = JA_COURSE_ATOMS.find((a) => a.id === "shita");
    const kita = JA_COURSE_ATOMS.find((a) => a.id === "kita");
    expect(shita?.kanji).toBe("下");
    expect(kita?.kanji).toBe("北");
    expect(shita?.fromModule).toBe("future");
    expect(kita?.fromModule).toBe("future");
  });
});
