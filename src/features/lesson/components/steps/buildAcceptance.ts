/**
 * Build-step grading, extracted from `BuildSentenceStepView` so it is pure
 * and snapshot-able across every course (2026-09-06).
 *
 * Three lanes, checked in order:
 *  1. EXACT — the placed tiles equal `correctOrder`. Every language, every
 *     granularity. The only lane that existed before 2026-07-24.
 *  2. JA VARIANTS — word-granularity builds whose target contains kana are
 *     graded against the typed-translation variant generator
 *     (`expandAcceptedAnswers`: topic drop, register, particle scramble…).
 *     Rule-based, generated from the ONE authored sentence; no per-step data.
 *  3. AUTHOR-LISTED — `alsoAccepted` on the step: whole alternative
 *     sentences the author has vetted (Spencer 2026-09-06: "as many easy
 *     listed alternatives as we can, max 3 for now"). Absent on a step means
 *     exact grading — no line is added to steps that have nothing to list,
 *     and the check is a code-side `?.` rather than a schema requirement.
 *     Language-agnostic: ES uses it first, JA/KO/FR may too.
 *
 * `listening_build` steps render through the same view but never carry
 * `alsoAccepted` (you build what you HEARD), so lane 3 is a no-op there.
 */
import { expandAcceptedAnswers } from "./translateVariants";
import { normalizeTypedAnswer } from "@/shared/speech";
import type { BuildSentenceStep } from "../../types";

/** Author-listed alternates per build step. Beyond this the list is a
 *  grammar in disguise and belongs in a generator (see translateVariants). */
export const MAX_ALSO_ACCEPTED = 3;

export type BuildGradable = Pick<
  BuildSentenceStep,
  "correctOrder" | "granularity" | "targetSentence"
> & { type: string; alsoAccepted?: string[] };

/** Lane 2. Null when the lane does not apply (non-word, non-kana). */
export function jaVariantSurfaces(
  step: BuildGradable,
  moduleIndex: number | null,
): Set<string> | null {
  if (step.granularity !== "word") return null;
  const target = step.correctOrder.join("");
  if (!/[぀-ヿ]/.test(target)) return null;
  // Seed from the AUTHORED sentence — its spacing carries the word
  // grouping the variant regexes key on (きょうは, not きょう|は).
  const seed = step.targetSentence?.trim() || step.correctOrder.join(" ");
  return new Set(
    expandAcceptedAnswers([seed], { moduleIndex }).map((v) => normalizeTypedAnswer(v)),
  );
}

/** Space-preserving normalisation for whole-sentence alternates: case,
 *  inverted marks, terminal punctuation and commas are not what a tile
 *  build tests. Single spaces are kept so «a la» can never collide with
 *  a hypothetical «ala» tile. */
export function normalizeBuildAnswer(s: string): string {
  return s
    .normalize("NFC")
    .toLowerCase()
    .replace(/[¿¡]/g, "")
    .replace(/[。．.!?！？,;:]+/gu, "")
    .replace(/[\s　]+/g, " ")
    .trim();
}

/** Lane 3. Null when the step lists nothing. */
export function alsoAcceptedSurfaces(step: BuildGradable): Set<string> | null {
  if (step.type !== "build_sentence") return null;
  const list = step.alsoAccepted;
  if (!list || list.length === 0) return null;
  return new Set(list.map(normalizeBuildAnswer));
}

export function isBuildCorrect(
  placed: readonly string[],
  step: BuildGradable,
  jaVariants: Set<string> | null,
  also: Set<string> | null,
): boolean {
  if (placed.length === step.correctOrder.length && placed.every((t, i) => t === step.correctOrder[i])) {
    return true;
  }
  if (jaVariants !== null && jaVariants.has(normalizeTypedAnswer(placed.join("")))) return true;
  if (also !== null && also.has(normalizeBuildAnswer(placed.join(" ")))) return true;
  return false;
}

/**
 * Every surface a build step accepts, as the learner would build it. Used by
 * the cross-language regression snapshot; not by the view.
 */
export function acceptedBuildSurfaces(
  step: BuildGradable,
  moduleIndex: number | null,
): { exact: string; jaVariants: string[]; alsoAccepted: string[] } {
  return {
    exact: step.correctOrder.join(" "),
    jaVariants: [...(jaVariantSurfaces(step, moduleIndex) ?? [])].sort(),
    alsoAccepted: [...(alsoAcceptedSurfaces(step) ?? [])].sort(),
  };
}

/**
 * Authoring invariant for `alsoAccepted` — shared by the ES lint and the IR
 * assembler so both report the same problems. Returns human-readable
 * problems; empty means fine.
 */
export function lintAlsoAccepted(step: {
  id: string;
  tiles: readonly string[];
  correctOrder: readonly string[];
  alsoAccepted?: readonly string[];
}): string[] {
  const list = step.alsoAccepted ?? [];
  const problems: string[] = [];
  if (list.length > MAX_ALSO_ACCEPTED) {
    problems.push(`${step.id}: ${list.length} alternates > max ${MAX_ALSO_ACCEPTED}`);
  }
  const exact = normalizeBuildAnswer(step.correctOrder.join(" "));
  const seen = new Set<string>();
  for (const alt of list) {
    const norm = normalizeBuildAnswer(alt);
    if (norm === exact) problems.push(`${step.id}: alternate «${alt}» is the authored answer`);
    if (seen.has(norm)) problems.push(`${step.id}: alternate «${alt}» is listed twice`);
    seen.add(norm);
    // Buildable from the bank: an alternate the tiles cannot spell is a lie
    // to the learner (and a false green for the author).
    const why = coverWithTiles(norm, step.tiles);
    if (why) problems.push(`${step.id}: alternate «${alt}» ${why}`);
  }
  return problems;
}

/**
 * Can `sentence` (normalised) be laid out as a sequence of whole tiles from
 * the bank, each used at most as often as it appears? Tiles may be
 * multi-word («je vais», «s'il vous plaît»), so this is a backtracking
 * cover, not a word multiset. A tile with punctuation fused on («¿tienes»,
 * «perro?», «soir ?») can only sit at the edge it is punctuated for.
 * Returns null when buildable, else a short reason.
 */
export function coverWithTiles(sentence: string, tiles: readonly string[]): string | null {
  const words = sentence.split(" ").filter(Boolean);
  const kinds = new Map<string, { words: string[]; opens: boolean; closes: boolean; count: number }>();
  for (const t of tiles) {
    const norm = normalizeBuildAnswer(t);
    const k = kinds.get(norm);
    if (k) k.count++;
    else kinds.set(norm, { words: norm.split(" "), opens: /^[¿¡]/.test(t), closes: /[?!.]$/.test(t), count: 1 });
  }
  const candidates = [...kinds.values()].sort((a, b) => b.words.length - a.words.length);
  let edgeProblem: string | null = null;
  const rec = (i: number): boolean => {
    if (i === words.length) return true;
    for (const c of candidates) {
      if (c.count === 0) continue;
      if (c.words.some((w, j) => words[i + j] !== w)) continue;
      const atStart = i === 0;
      const atEnd = i + c.words.length === words.length;
      if ((c.opens && !atStart) || (c.closes && !atEnd)) {
        edgeProblem = `moves the punctuated tile «${c.words.join(" ")}» off its edge`;
        continue;
      }
      c.count--;
      if (rec(i + c.words.length)) return true;
      c.count++;
    }
    return false;
  };
  if (rec(0)) return null;
  return edgeProblem ?? "cannot be laid out from the bank's tiles";
}
