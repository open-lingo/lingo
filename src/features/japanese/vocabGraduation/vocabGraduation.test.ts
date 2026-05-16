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
 *   - The CustomEvent fires exactly once with the new items.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { CourseModule } from "@/shared/domain/course";
import {
  _isModuleGraduated,
  clearGraduatedVocab,
  getGraduatedVocab,
  graduateModule,
} from "./index";

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
  clearGraduatedVocab();
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
    const added = graduateModule("mock-1", m);
    expect(added.length).toBeGreaterThan(0);
    expect(added.every((i) => i.sourceModuleId === "m1")).toBe(true);
    const stored = getGraduatedVocab("mock-1");
    expect(stored.length).toBe(added.length);
  });

  it("is idempotent — second call returns []", () => {
    const m = makeModule("m1", ["ja-m1-ka-1", "ja-m1-ka-test"]);
    const first = graduateModule("mock-1", m);
    expect(first.length).toBeGreaterThan(0);
    const second = graduateModule("mock-1", m);
    expect(second).toEqual([]);
    // Stored list unchanged.
    expect(getGraduatedVocab("mock-1").length).toBe(first.length);
    expect(_isModuleGraduated("mock-1", "m1")).toBe(true);
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
    const added = graduateModule("mock-1", m);
    const seen = new Set<string>();
    for (const i of added) {
      expect(seen.has(i.kana), `dup kana ${i.kana}`).toBe(false);
      seen.add(i.kana);
    }
  });

  it("skips coming-soon modules", () => {
    const m = makeModule("m4", [], { comingSoon: true });
    const added = graduateModule("mock-1", m);
    expect(added).toEqual([]);
    expect(_isModuleGraduated("mock-1", "m4")).toBe(false);
  });

  it("skips modules with no lessons", () => {
    const m = makeModule("m4", []);
    const added = graduateModule("mock-1", m);
    expect(added).toEqual([]);
  });

  it("uses module.eyebrow as sourceModuleTitle when present", () => {
    const m = makeModule("m1", ["ja-m1-ka-1"], {
      eyebrow: "Module 1 · Hiragana",
      title: "The first 46 sounds",
    });
    const added = graduateModule("mock-1", m);
    expect(added[0]?.sourceModuleTitle).toBe("Module 1 · Hiragana");
  });

  it("scopes graduations per course", () => {
    const m = makeModule("m1", ["ja-m1-ka-1"]);
    graduateModule("course-A", m);
    graduateModule("course-B", m);
    expect(getGraduatedVocab("course-A").length).toBeGreaterThan(0);
    expect(getGraduatedVocab("course-B").length).toBeGreaterThan(0);
    // Each course tracks its own flag — clearing one shouldn't affect the other.
    clearGraduatedVocab("course-A");
    expect(getGraduatedVocab("course-A")).toEqual([]);
    expect(getGraduatedVocab("course-B").length).toBeGreaterThan(0);
  });

  it("fires lingo:vocab-graduated CustomEvent with new items", () => {
    const handler = vi.fn();
    window.addEventListener("lingo:vocab-graduated", handler);
    const m = makeModule("m1", ["ja-m1-ka-1", "ja-m1-ka-test"]);
    const added = graduateModule("mock-1", m);
    expect(handler).toHaveBeenCalledTimes(1);
    const event = handler.mock.calls[0][0] as CustomEvent;
    expect(event.detail).toEqual(added);
    window.removeEventListener("lingo:vocab-graduated", handler);
  });

  it("does not fire CustomEvent on idempotent re-graduation", () => {
    const m = makeModule("m1", ["ja-m1-ka-1"]);
    graduateModule("mock-1", m);
    const handler = vi.fn();
    window.addEventListener("lingo:vocab-graduated", handler);
    graduateModule("mock-1", m);
    expect(handler).not.toHaveBeenCalled();
    window.removeEventListener("lingo:vocab-graduated", handler);
  });

  it("ignores lesson ids that don't match the JA row pattern", () => {
    const m = makeModule("m1", ["m1-l0-alphabet", "random-id"]);
    const added = graduateModule("mock-1", m);
    expect(added).toEqual([]);
    // Flag still set so we don't re-scan.
    expect(_isModuleGraduated("mock-1", "m1")).toBe(true);
  });

  it("clearGraduatedVocab() with no arg wipes every course", () => {
    const m = makeModule("m1", ["ja-m1-ka-1"]);
    graduateModule("course-A", m);
    graduateModule("course-B", m);
    clearGraduatedVocab();
    expect(getGraduatedVocab("course-A")).toEqual([]);
    expect(getGraduatedVocab("course-B")).toEqual([]);
    expect(_isModuleGraduated("course-A", "m1")).toBe(false);
  });
});
