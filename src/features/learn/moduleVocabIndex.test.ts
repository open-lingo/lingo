import { describe, it, expect } from "vitest";
import { getMockCourse } from "@/shared/domain/mockCourse";
import { getModuleLessonCounts, getModuleVocab } from "./courseMapData";
import { buildModuleIndexEntry } from "./moduleVocabIndex";

/**
 * Parity guard for the content:emit module index (2026-09-13): the emitted
 * `<lang>/index.<hash>.json` and the course map's live per-module fallback
 * both go through `buildModuleIndexEntry`, so they can't drift by
 * construction — this test is the regression tripwire if that ever stops
 * being true (e.g. someone hand-rolls a second computation somewhere).
 * Runs under the eager registry (every lesson registered), so
 * `getModuleVocab`'s content-derived paths have real data to compare.
 */
const LANGS = ["ja", "ko", "es", "fr"] as const;

describe("moduleVocabIndex parity", () => {
  it("index-derived counts/samples equal full-content-derived ones for every module of every language", () => {
    let checked = 0;
    for (const lang of LANGS) {
      const course = getMockCourse(lang);
      for (const module of course.modules) {
        const entry = buildModuleIndexEntry(module, lang);
        const counts = getModuleLessonCounts(module);
        const vocab = getModuleVocab(module, lang);
        expect(entry.id).toBe(module.id);
        expect(entry.lessonCount).toEqual(counts);
        expect(entry.vocabCount).toBe(vocab.count);
        expect(entry.vocabSamples).toEqual(vocab.samples);
        checked++;
      }
    }
    // Sanity: the loop actually ran over real modules, not an empty course.
    expect(checked).toBeGreaterThan(50);
  });
});
