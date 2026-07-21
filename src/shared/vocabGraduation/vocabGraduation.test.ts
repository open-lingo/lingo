/**
 * Tests for vocab graduation idempotency + dedupe behavior.
 *
 * Verifies:
 *   - First-time graduation snapshots anchor words from every row that
 *     contributes lessons to the module.
 *   - Repeat graduateModule calls are no-ops (idempotency flag).
 *   - Items are deduped by kana even when the same surface appears in
 *     multiple rows.
 *   - Coming-soon modules don't graduate (no anchor words anyway).
 *   - `clearGraduatedVocab(courseId)` wipes per-course state.
 *   - Storage keys are language-namespaced (KO state doesn't tread on JA).
 */
import { beforeEach, describe, expect, it } from "vitest";
import type { CourseModule } from "@/shared/domain/course";
import {
  _isModuleGraduated,
  clearGraduatedVocab,
  getGraduatedVocab,
  graduateModule,
} from "./index";

const LANG = "ja";

function makeModule(
  id: string,
  lessonIds: string[],
  opts: { comingSoon?: boolean; title?: string; eyebrow?: string } = {},
): CourseModule {
  return {
    id,
    title: opts.title ?? `Module ${id}`,
    eyebrow: opts.eyebrow,
    comingSoon: opts.comingSoon,
    lessons: lessonIds.map((lid) => ({ id: lid, title: lid })),
  };
}

beforeEach(() => {
  // Reset all storage between tests so cases don't bleed.
  clearGraduatedVocab(LANG);
  // Also wipe both keys directly in case clearGraduatedVocab missed
  // some edge case (it shouldn't).
  window.localStorage.clear();
});

describe("vocabGraduation.graduateModule", () => {
  it("graduates anchor words from rows referenced by module lessons", () => {
    // ka-row sub-lessons reference row id "ka".
    const m = makeModule("m1", [
      "ja-m1-ka-1",
      "ja-m1-ka-2",
      "ja-m1-ka-3",
      "ja-m1-ka-test",
    ]);
    const added = graduateModule(LANG, "mock-1", m);
    expect(added.length).toBeGreaterThan(0);
    expect(added.every((i) => i.sourceModuleId === "m1")).toBe(true);
    const stored = getGraduatedVocab(LANG, "mock-1");
    expect(stored.length).toBe(added.length);
  });

  it("is idempotent — second call returns []", () => {
    const m = makeModule("m1", ["ja-m1-ka-1", "ja-m1-ka-test"]);
    const first = graduateModule(LANG, "mock-1", m);
    expect(first.length).toBeGreaterThan(0);
    const second = graduateModule(LANG, "mock-1", m);
    expect(second).toEqual([]);
    // Stored list unchanged.
    expect(getGraduatedVocab(LANG, "mock-1").length).toBe(first.length);
    expect(_isModuleGraduated(LANG, "mock-1", "m1")).toBe(true);
  });

  it("dedupes items by kana across rows in the same module", () => {
    // Both rows contribute lessons; we manually choose two rows that
    // share zero anchors normally, then assert no duplicate kana even
    // if we simulate a clash by adding both ka + sa rows.
    const m = makeModule("m1", [
      "ja-m1-ka-1",
      "ja-m1-ka-test",
      "ja-m1-sa-1",
      "ja-m1-sa-test",
    ]);
    const added = graduateModule(LANG, "mock-1", m);
    const seen = new Set<string>();
    for (const i of added) {
      expect(seen.has(i.kana), `dup kana ${i.kana}`).toBe(false);
      seen.add(i.kana);
    }
  });

  it("skips coming-soon modules", () => {
    const m = makeModule("m4", [], { comingSoon: true });
    const added = graduateModule(LANG, "mock-1", m);
    expect(added).toEqual([]);
    expect(_isModuleGraduated(LANG, "mock-1", "m4")).toBe(false);
  });

  it("skips modules with no lessons", () => {
    const m = makeModule("m4", []);
    const added = graduateModule(LANG, "mock-1", m);
    expect(added).toEqual([]);
  });

  it("uses module.eyebrow as sourceModuleTitle when present", () => {
    const m = makeModule("m1", ["ja-m1-ka-1"], {
      eyebrow: "Module 1 · Hiragana",
      title: "The first 46 sounds",
    });
    const added = graduateModule(LANG, "mock-1", m);
    expect(added[0]?.sourceModuleTitle).toBe("Module 1 · Hiragana");
  });

  it("scopes graduations per course", () => {
    const m = makeModule("m1", ["ja-m1-ka-1"]);
    graduateModule(LANG, "course-A", m);
    graduateModule(LANG, "course-B", m);
    expect(getGraduatedVocab(LANG, "course-A").length).toBeGreaterThan(0);
    expect(getGraduatedVocab(LANG, "course-B").length).toBeGreaterThan(0);
    // Each course tracks its own flag — clearing one shouldn't affect the other.
    clearGraduatedVocab(LANG, "course-A");
    expect(getGraduatedVocab(LANG, "course-A")).toEqual([]);
    expect(getGraduatedVocab(LANG, "course-B").length).toBeGreaterThan(0);
  });

  it("ignores lesson ids that don't match the JA row pattern", () => {
    const m = makeModule("m1", ["m1-l0-alphabet", "random-id"]);
    const added = graduateModule(LANG, "mock-1", m);
    expect(added).toEqual([]);
    // Flag still set so we don't re-scan.
    expect(_isModuleGraduated(LANG, "mock-1", "m1")).toBe(true);
  });

  it("clearGraduatedVocab() with no courseId wipes every course for the language", () => {
    const m = makeModule("m1", ["ja-m1-ka-1"]);
    graduateModule(LANG, "course-A", m);
    graduateModule(LANG, "course-B", m);
    clearGraduatedVocab(LANG);
    expect(getGraduatedVocab(LANG, "course-A")).toEqual([]);
    expect(getGraduatedVocab(LANG, "course-B")).toEqual([]);
    expect(_isModuleGraduated(LANG, "course-A", "m1")).toBe(false);
  });

  it("scopes storage keys per language", () => {
    const m = makeModule("m1", ["ja-m1-ka-1"]);
    graduateModule(LANG, "mock-1", m);
    // KO has no anchor source today so it should be a no-op + return [].
    const koAdded = graduateModule("ko", "mock-1", m);
    expect(koAdded).toEqual([]);
    // JA storage is intact.
    expect(getGraduatedVocab(LANG, "mock-1").length).toBeGreaterThan(0);
    // Clearing KO doesn't touch JA.
    clearGraduatedVocab("ko");
    expect(getGraduatedVocab(LANG, "mock-1").length).toBeGreaterThan(0);
  });

  it("storage key includes language id", () => {
    const m = makeModule("m1", ["ja-m1-ka-1"]);
    graduateModule(LANG, "mock-1", m);
    const keys = Object.keys(window.localStorage);
    expect(keys.some((k) => k.includes("_ja_"))).toBe(true);
  });
});
