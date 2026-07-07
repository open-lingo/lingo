import { describe, it, expect } from "vitest";
import {
  isDedicatedReviewLesson,
  shouldWriteContentReviewAtom,
} from "./reviewTailSrs";

/**
 * D2 gate (docs/srs-scheduling-model-2026-06-15.md) — decides which vocab
 * atoms a graded step in a content sub-lesson advances in Track A FSRS.
 *
 * Atom ids are grounded in real `JA_COURSE_ATOMS` entries:
 *  - `neko`          — fromModule m1, introducedByLessonId "ja-m3-3"
 *  - `ja-m4-1-v-pen` — fromModule m4, introducedByLessonId "ja-m4-1"
 *  - `ja-m7-4-v-sushi` — fromModule m7 (a forward-reference kana homograph
 *    of the m1 word すし; last-wins kana→id map resolves すし to this id)
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
    // すし in an m3 tail resolves (kana→id) to the m7 atom id; grading it in
    // m3 would touch a not-yet-introduced atom → skipped.
    expect(shouldWriteContentReviewAtom("ja-m7-4-v-sushi", "ja-m3-1-2")).toBe(false);
  });

  it("SKIPS unknown / non-JA atom ids", () => {
    expect(shouldWriteContentReviewAtom("ko-something", "ja-m4-1-1")).toBe(false);
    expect(shouldWriteContentReviewAtom("not-an-atom", "ja-m4-1-1")).toBe(false);
  });

  it("SKIPS when the lesson id has no parseable module (sidequests etc.)", () => {
    expect(shouldWriteContentReviewAtom("neko", "ja-sidequest-travel")).toBe(false);
  });
});
