import { describe, expect, it } from "vitest";
import { readdirSync } from "node:fs";
import { join } from "node:path";
import { compileModule } from "@/features/lesson/data/moduleCompiler";
import type { WordImageMcqStep } from "@/features/lesson/types";
import { JA_COURSE_ATOMS_BY_KANA, JA_PRIMARY_ATOM_BY_KANA } from "../courseAtoms";

/**
 * You cannot TEACH the losing sense of a homograph.
 *
 * Seventeen kana are shared by two or three atoms, and
 * `JA_PRIMARY_ATOM_BY_KANA` rules which one a bare kana means (はな is 花 not
 * 鼻, あめ is 雨 not 飴, は is the particle not 歯). The tokenizer has no way to
 * express the loser: every は it emits resolves to the particle, so an atom
 * that loses its kana can never be identified by a token and never accrues
 * SRS credit.
 *
 * That has a consequence the rulings themselves don't state. A word-image MCQ
 * teaching 「あめ = candy」 would render perfectly, mark the learner correct,
 * and then credit the exposure to 雨 "rain" — so the course would claim to
 * have taught candy while scheduling rain, and 飴 would never come up for
 * review because nothing can ever reference it.
 *
 * The image-first guard (`moduleBarGuards`) was relaxed on 2026-07-27 to skip
 * these losers, because requiring an atom that can never debut to debut on a
 * picture is unsatisfiable. This is the other half of that change: image-first
 * stops asking for the impossible, and this stops anyone from authoring it.
 *
 * To teach a losing sense the course needs a disambiguation mechanism first
 * (a kanji surface, or a compound). Until then, pick a different word.
 */

const IR_DIR = join(__dirname, "..", "curriculum", "ir");

/** "a cold" / "to cut" / "the bridge" all compare equal to their bare noun. */
const norm = (s: string) =>
  s
    .toLowerCase()
    .replace(/\b(a|an|the|to)\b/g, " ")
    .replace(/[^a-z0-9 ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

/**
 * Does the taught gloss name the same sense as the ruled atom? Substring in
 * either direction, plus a shared content word, so "a cold" matches "cold" and
 * "flower" matches "flower, blossom" without letting "candy" match "rain".
 */
export const sensesAgree = (taughtEn: string, ruledEn: string): boolean => {
  const taught = norm(taughtEn);
  const ruled = norm(ruledEn);
  return (
    taught.includes(ruled) ||
    ruled.includes(taught) ||
    ruled.split(" ").some((w) => w.length > 3 && taught.includes(w))
  );
};

function wordImageSteps(): { where: string; step: WordImageMcqStep }[] {
  return readdirSync(IR_DIR)
    .filter((f) => f.endsWith(".ir.json"))
    .flatMap((f) =>
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      compileModule(require(join(IR_DIR, f))).flatMap((lesson) =>
        lesson.steps
          .filter((s): s is WordImageMcqStep => s.type === "word_image_mcq")
          .map((step) => ({ where: `${f.replace(".ir.json", "")} ${lesson.id}`, step })),
      ),
    );
}

describe("homograph losers are never taught", () => {
  const steps = wordImageSteps();

  it("has word-image steps to check", () => {
    expect(steps.length).toBeGreaterThan(40);
  });

  it("actually rejects a wrong sense", () => {
    // The course currently teaches no losers, so without this the guard above
    // passes vacuously and would keep passing if `sensesAgree` were broken.
    expect(sensesAgree("candy", "rain")).toBe(false);
    expect(sensesAgree("nose", "flower")).toBe(false);
    expect(sensesAgree("tooth", "topic particle")).toBe(false);
    // ...while still accepting the wording drift real glosses have.
    expect(sensesAgree("a cold", "cold")).toBe(true);
    expect(sensesAgree("flower", "flower, blossom")).toBe(true);
    expect(sensesAgree("to cut", "cut")).toBe(true);
  });

  it("teaches the ruled sense whenever the answer is an ambiguous kana", () => {
    const offenders: string[] = [];
    for (const { where, step } of steps) {
      const correct = step.options.find((o) => o.id === step.correctOptionId);
      if (!correct) continue;
      if (!JA_PRIMARY_ATOM_BY_KANA[correct.word]) continue;

      const winner = JA_COURSE_ATOMS_BY_KANA.get(correct.word);
      if (!winner) continue;

      // The taught meaning must be the sense the token actually credits.
      // Substring either way: "a cold" vs "cold", "flower" vs "flower, blossom".
      if (!sensesAgree(step.meaningEn, winner.meaningEn)) {
        offenders.push(
          `${where} ${step.id}: teaches ${correct.word} = "${step.meaningEn}" ` +
            `but the kana resolves to ${winner.id} "${winner.meaningEn}" — ` +
            `SRS would credit the wrong atom`,
        );
      }
    }
    expect(offenders).toEqual([]);
  });
});
