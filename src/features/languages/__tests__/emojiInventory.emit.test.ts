/**
 * EMOJI INVENTORY — every vocab atom in every course with its emoji, for the
 * emoji re-fit pipeline (scripts/emoji-refit/). Runs under vitest because the
 * registries are TS with the vite alias; vite-node is not reliable here.
 *
 *   EMOJI_INVENTORY_EMIT=1 EMOJI_REFIT_OUT=artifacts/emoji-refit \
 *     npx vitest run src/features/languages/__tests__/emojiInventory.emit.test.ts
 */
import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { getNormalizedCourseAtoms } from "@/features/lesson/data/normalizedAtoms";
import { JA_COURSE_ATOMS, canonicalAtomId } from "@/features/languages/ja/courseAtoms";
import { WORD_IMAGE_MCQ_BLOCKLIST } from "@/features/languages/ja/grammarHelpers";
import { getFrCourseAtoms } from "@/features/languages/fr/courseAtoms";

const ENABLED = process.env.EMOJI_INVENTORY_EMIT === "1";
// FR is not registered in normalizedAtoms.ts's buildAtomsFor switch (that
// registration also wires FR into lessonAtomIndex/flashcards/SRS-unlock,
// which is out of scope for the emoji inventory — see fix-round-2 report).
// So FR is read straight from its own registry here, bypassing
// getNormalizedCourseAtoms, while ja/ko/es keep going through the shared
// cross-language adapter.
const NORMALIZED_COURSES = ["ja", "ko", "es"] as const;

describe.skipIf(!ENABLED)("emoji inventory emit", () => {
  it("writes inventory.json for all four courses", () => {
    const jaExtras = new Map(
      JA_COURSE_ATOMS.map((a) => [
        canonicalAtomId(a),
        {
          blocked: a.blocked === true || WORD_IMAGE_MCQ_BLOCKLIST.has(a.kana),
          note: a.note,
          pos: a.pos,
        },
      ]),
    );
    const normalizedItems = NORMALIZED_COURSES.flatMap((course) =>
      getNormalizedCourseAtoms(course).map((a) => ({
        course,
        id: a.id,
        surface: a.display,
        secondary: a.secondary,
        gloss: a.gloss,
        kind: a.kind,
        module: a.module,
        emoji: a.emoji,
        srsEligible: a.srsEligible,
        ...(course === "ja" ? jaExtras.get(a.id) ?? {} : {}),
      })),
    );
    const frItems = getFrCourseAtoms().map((a) => ({
      course: "fr" as const,
      id: a.id,
      surface: a.surface,
      secondary: undefined as string | undefined,
      gloss: a.gloss,
      kind: a.kind,
      module: a.fromModule ?? "future",
      emoji: a.emoji,
      srsEligible: a.srsEligible,
      // FR has no blocked-list / note / pos concept (that's JA-only
      // metadata above) — declare the fields so `items` is one shape and
      // the `blocked` filter below type-checks across all four courses.
      blocked: undefined as boolean | undefined,
      note: undefined as string | undefined,
      pos: undefined as string | undefined,
    }));
    const items = [...normalizedItems, ...frItems];
    const COURSES = [...NORMALIZED_COURSES, "fr"] as const;
    const perCourse = Object.fromEntries(
      COURSES.map((c) => {
        const rows = items.filter((i) => i.course === c);
        const isWord = (i: (typeof rows)[number]) => i.kind === "vocab" || i.kind === "phrase";
        return [
          c,
          {
            total: rows.length,
            withEmoji: rows.filter((i) => i.emoji).length,
            gaps: rows.filter((i) => !i.emoji && !i.blocked && isWord(i)).length,
            blocked: rows.filter((i) => i.blocked).length,
          },
        ];
      }),
    );
    const out = process.env.EMOJI_REFIT_OUT ?? "artifacts/emoji-refit";
    fs.mkdirSync(out, { recursive: true });
    fs.writeFileSync(
      path.join(out, "inventory.json"),
      JSON.stringify({ generatedAt: new Date().toISOString(), summary: { perCourse }, items }, null, 1),
    );
    expect(items.length).toBeGreaterThan(1500);
    for (const c of COURSES) expect(perCourse[c].total).toBeGreaterThan(0);
  });
});
