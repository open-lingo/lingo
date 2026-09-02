/**
 * COURSE-WIDE EMOJI INTEGRITY GATE (2026-09-02, Wave C emoji re-fit, task 7).
 *
 * Generalizes `es/curriculum/es-course-integrity.test.ts`'s "an emoji means
 * one thing" check to all four courses, and adds a second, new check this
 * wave exists to make possible: every emoji actually resolves to a real
 * rendered asset. Before Wave C there was no single place enumerating
 * every course's atoms against the vendored SVG set — an atom could carry
 * an emoji whose Noto SVG was never vendored, and nothing would fail until
 * a human eyeballed a broken `<img>` in a lesson.
 *
 *   1. every SRS-eligible atom's `emoji` resolves to SOMETHING real: either
 *      a vendored `src/pub/noto-emoji/svg/emoji_u*.svg` file, or a
 *      `LINGO_CUSTOM_ART` entry (checked via `lingoArtUrl`). STRICT for
 *      all four courses — there is no known-debt category for a glyph
 *      that flatly doesn't exist.
 *
 *   2. an emoji is a meaning: the same emoji must not be bound to two
 *      different surfaces across a course's `word_image_mcq` steps (the
 *      🚪 → "la puerta" / "hasta luego" defect `es-course-integrity.test.ts`
 *      already gates). STRICT for ES/FR (both fully re-authored courses
 *      with a proven-clean baseline). JA/KO are RATCHETED: both have a
 *      long tail of legitimate same-lemma pairs (an inflected form sharing
 *      its base noun's glyph, a plain vs. polite verb form) mixed with
 *      real, not-yet-fixed defects, and Wave C's brief is a content-neutral
 *      emoji swap — it must not silently paper over pre-existing debt by
 *      omission, but it also must not block on a backlog that isn't this
 *      wave's job to clear. `KNOWN_DUPLICATE_BASELINE` pins the count so
 *      the backlog can only shrink from here, never grow.
 *
 * Same-lemma pairs (e.g. an ES article-inflected phrase vs. its bare noun)
 * are expected debt, not defects — they're listed in
 * `EMOJI_SURFACE_EXEMPTIONS` with the reason, not silently dropped.
 */
import { existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, it, expect } from "vitest";
import {
  getAvailableMockLessonIds,
  getMockLessonContent,
} from "@/features/lesson/data/mockLessons";
import { getNormalizedCourseAtoms } from "@/features/lesson/data/normalizedAtoms";
import { lingoArtUrl, notoEmojiUrl } from "@/shared/assets/notoEmoji";
import type { WordImageMcqStep } from "@/features/lesson/types";

const COURSES = ["ja", "ko", "es", "fr"] as const;
type CourseId = (typeof COURSES)[number];

// `src/pub` is Vite's publicDir — every asset URL notoEmojiUrl returns
// (main svg/ set OR the region-flags/ side path it auto-routes country
// flags to) is served relative to that directory on disk.
const PUB_DIR = join(dirname(fileURLToPath(import.meta.url)), "../../../pub");

/**
 * Resolve an emoji to the on-disk path a real render would fetch, or
 * `null` if the emoji is malformed / unresolvable. Mirrors the runtime
 * resolver exactly (including flag auto-routing) instead of hand-rolling
 * the Noto filename convention a second time in test code.
 */
function assetPath(emoji: string): string | null {
  const url = notoEmojiUrl(emoji);
  return url ? join(PUB_DIR, url) : null;
}

/**
 * Strip a leading determiner so an article-inflected surface and its bare
 * noun compare as the same lemma. ES/FR only — JA kana and KO hangul carry
 * no articles, so those two courses use identity.
 */
const STRIP_DETERMINER: Record<CourseId, (w: string) => string> = {
  ja: (w) => w,
  ko: (w) => w,
  es: (w) => w.replace(/^(el|la|un|una|los|las) /, ""),
  fr: (w) => w.replace(/^(le|la|les|un|une|des|l['’]) ?/, ""),
};

/**
 * Known, accepted "one emoji, two lemma-equivalent surfaces" pairs — NOT
 * defects. Anything hit by the check below that isn't listed here fails.
 * Course -> emoji -> allowed surface set (post STRIP_DETERMINER).
 */
export const EMOJI_SURFACE_EXEMPTIONS: Record<CourseId, Map<string, Set<string>>> = {
  ja: new Map(),
  ko: new Map(),
  es: new Map(),
  fr: new Map(),
};

/**
 * JA/KO ratchet ceiling for check 2 (see file header). Each course's real
 * offending-group count as of 2026-09-02, pinned so the pre-existing
 * backlog can shrink but never grow. If a future change pushes a course
 * over its ceiling, the failure message names the offending groups —
 * either add a genuine same-lemma exemption above, fix the content, or
 * (if the new count is a real regression) revert it.
 */
export const KNOWN_DUPLICATE_BASELINE: Record<"ja" | "ko", number> = {
  ja: 43,
  ko: 5,
};

function lessonsFor(course: CourseId) {
  return getAvailableMockLessonIds()
    .filter((id) => id.startsWith(`${course}-`))
    .map((id) => getMockLessonContent(id))
    .filter((l): l is NonNullable<typeof l> => l != null);
}

function duplicateEmojiGroups(course: CourseId): string[] {
  const strip = STRIP_DETERMINER[course];
  const byEmoji = new Map<string, Set<string>>();
  for (const lesson of lessonsFor(course)) {
    for (const step of lesson.steps) {
      if (step.type !== "word_image_mcq") continue;
      for (const o of (step as WordImageMcqStep).options) {
        const set = byEmoji.get(o.emoji) ?? new Set<string>();
        set.add(strip(o.word));
        byEmoji.set(o.emoji, set);
      }
    }
  }
  const bad: string[] = [];
  const allowed = EMOJI_SURFACE_EXEMPTIONS[course];
  for (const [emoji, surfaces] of byEmoji) {
    if (surfaces.size <= 1) continue;
    const exempt = allowed.get(emoji);
    if (exempt && [...surfaces].every((s) => exempt.has(s))) continue;
    bad.push(`${emoji} → ${[...surfaces].join(" / ")}`);
  }
  return bad.sort();
}

describe.each(COURSES)("%s course emoji integrity", (course) => {
  it("every SRS-eligible atom's emoji resolves to a real vendored asset", () => {
    const atoms = getNormalizedCourseAtoms(course).filter(
      (a) => a.srsEligible && a.emoji,
    );
    const missing: string[] = [];
    for (const atom of atoms) {
      if (lingoArtUrl(course, atom.display)) continue;
      const path = assetPath(atom.emoji!);
      if (!path || !existsSync(path)) {
        missing.push(`${atom.id} (${atom.emoji}) → ${path ?? "(unresolvable)"}`);
      }
    }
    expect(missing, missing.join("\n")).toEqual([]);
  });
});

describe("es course emoji integrity", () => {
  it("an emoji means ONE thing: no emoji bound to two different surfaces in image MCQs", () => {
    expect(duplicateEmojiGroups("es")).toEqual([]);
  });
});

describe("fr course emoji integrity", () => {
  it("an emoji means ONE thing: no emoji bound to two different surfaces in image MCQs", () => {
    expect(duplicateEmojiGroups("fr")).toEqual([]);
  });
});

describe.each(["ja", "ko"] as const)(
  "%s course emoji integrity (ratchet)",
  (course) => {
    it(`duplicate-emoji groups do not exceed the known baseline (${KNOWN_DUPLICATE_BASELINE[course]})`, () => {
      const bad = duplicateEmojiGroups(course);
      expect(
        bad.length,
        `${bad.length} duplicate-emoji group(s), ceiling is ${KNOWN_DUPLICATE_BASELINE[course]}:\n${bad.join("\n")}`,
      ).toBeLessThanOrEqual(KNOWN_DUPLICATE_BASELINE[course]);
    });
  },
);
