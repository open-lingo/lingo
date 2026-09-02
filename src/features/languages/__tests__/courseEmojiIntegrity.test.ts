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
import { getFrCourseAtoms } from "@/features/languages/fr/courseAtoms";
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

/**
 * Snapshot of the actual offending groups as of 2026-09-02 (JA has 24 live
 * today, well under its 43 ceiling; KO is at its ceiling of 5) — used only
 * to keep a ratchet failure message short: a regression's message names
 * the NEW groups (not in this snapshot), not the whole backlog. Update
 * this snapshot whenever the backlog legitimately shrinks or grows within
 * the ceiling, so the next regression's message stays a short diff.
 */
const KNOWN_DUPLICATE_GROUPS: Record<"ja" | "ko", ReadonlySet<string>> = {
  ja: new Set([
    "⏰ → とけい / じかん / いま",
    "☕ → きっさてん / コーヒー",
    "⬆️ → うえ / まっすぐ",
    "⭐ → ほし / ゆうめい",
    "🍞 → ぱん / パン",
    "🍱 → たべもの / りょうり",
    "🎒 → かばん / せいと",
    "🎓 → がくせい / だいがく",
    "🎤 → うた / うたう",
    "🎵 → うた / おんがく",
    "🏪 → みせ / コンビニ",
    "🏫 → きょうしつ / がっこう",
    "👨‍🏫 → じゅぎょう / おしえる",
    "📓 → ノート / れんしゅうする",
    "📖 → ほん / じしょ",
    "📚 → よむ / としょかん",
    "📷 → しゃしん / カメラ",
    "📸 → しゃしん / とる",
    "🖊️ → ぺん / ペン",
    "🗣️ → いう / はなす",
    "🚪 → どあ / ドア",
    "🚶 → さんぽ / いく",
    "🥤 → のむ / のみもの",
    "🧍 → からだ / たつ",
  ]),
  ko: new Set([
    "❓ → 누구 / 뭐 / 왜",
    "🍚 → 끼 / 밥",
    "👶 → 아이 / 아기",
    "📍 → 거기 / 여기",
    "🧑 → 머리 / 오빠",
  ]),
};

/** Minimal shape check 1 needs, uniform across all four courses. */
type EmojiAtom = { id: string; display: string; emoji?: string };

/**
 * Every atom for a course, in the shape check 1 needs. JA/KO/ES go through
 * the shared cross-language adapter; FR is NOT registered in
 * `normalizedAtoms.ts`'s `buildAtomsFor` switch (deliberately — that
 * registration also wires FR into lessonAtomIndex/flashcards/SRS-unlock,
 * out of scope here), so `getNormalizedCourseAtoms("fr")` always returns
 * `[]`. Read FR straight from its own registry instead, the way
 * `emojiInventory.emit.test.ts` does.
 */
function atomsFor(course: CourseId): EmojiAtom[] {
  if (course === "fr") {
    return getFrCourseAtoms().map((a) => ({
      id: a.id,
      display: a.surface,
      emoji: a.emoji,
    }));
  }
  return getNormalizedCourseAtoms(course).map((a) => ({
    id: a.id,
    display: a.display,
    emoji: a.emoji,
  }));
}

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

// Repo-relative form of PUB_DIR (`src/pub`), for actionable failure
// messages — a bare absolute path is useless to whoever reads the report.
const REPO_PUB_REL = "src/pub";

describe.each(COURSES)("%s course emoji integrity", (course) => {
  it("every emoji-bearing atom's emoji resolves to a real vendored asset", () => {
    // Checks EVERY emoji-bearing atom, not just SRS-eligible ones — an
    // atom excluded from SRS (e.g. a `srsEligible: false` KO atom) can
    // still render its emoji in a word_image_mcq step or a vocab-browse
    // card, so a missing SVG there is just as broken.
    const atoms = atomsFor(course).filter((a) => a.emoji);
    const missing: string[] = [];
    for (const atom of atoms) {
      if (lingoArtUrl(course, atom.display)) continue;
      const url = notoEmojiUrl(atom.emoji!);
      const path = assetPath(atom.emoji!);
      if (!path || !existsSync(path)) {
        const expectedRel = url ? `${REPO_PUB_REL}${url}` : "(unresolvable emoji)";
        missing.push(
          `${atom.id} "${atom.display}" (${atom.emoji}) → expected ${expectedRel}\n` +
            `  vendor it: node scripts/emoji-refit/vendor-noto.mjs ${atom.emoji} ` +
            `(or copy from https://github.com/googlefonts/noto-emoji/tree/main/svg)`,
        );
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
      const newGroups = bad.filter((g) => !KNOWN_DUPLICATE_GROUPS[course].has(g));
      expect(
        bad.length,
        `${course}: ${bad.length} duplicate-emoji group(s), ceiling ${KNOWN_DUPLICATE_BASELINE[course]}. ` +
          `NEW group(s) not in the known baseline (${newGroups.length}):\n${newGroups.join("\n")}`,
      ).toBeLessThanOrEqual(KNOWN_DUPLICATE_BASELINE[course]);
    });
  },
);
