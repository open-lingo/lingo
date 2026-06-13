/**
 * Track B step source (retention 3b). Maps each grammar point to AUTHORED
 * review steps reused from the curriculum — never fabricated. v1 covers the
 * literal-token points (particles / copula / discrete markers) by matching a
 * `particle_cloze` step's `correctParticle` to the grammar point whose
 * `point` is that exact token (は → wa-topic, です → desu-copula, …). This is
 * the Bunpro model — cloze-deletion of the grammar element in a real
 * sentence — but sourced from sentences the course already authored, so we
 * never drill a wrong form.
 *
 * Descriptive-token points (verb-form "じしょけい", adjective-form, counters)
 * have no clean literal to cloze; they're scheduled by `grammarSrs` but get
 * no auto-generated step here (logged via `getUncoveredGrammarPoints`) —
 * authored review items / the Conjugation Trainer (§10) cover them later.
 */
import { getMockCourse } from "@/shared/domain/mockCourse";
import { getMockLessonContent } from "./mockLessons";
import type { LessonStep } from "../types";
import grammarPointsJson from "./n5-grammar-points.json";
import type { GrammarPoint } from "@/features/flashcards/engine/grammarSrs";
import { JA_COURSE_ATOMS, isSrsEligibleAtom } from "@/features/languages/ja/courseAtoms";

const GRAMMAR_POINTS = grammarPointsJson as GrammarPoint[];

let index: Map<string, LessonStep[]> | null = null;

/** Literal single-token grammar points (particles/markers/copula) → point id.
 *  Skips descriptive points ("じしょけい") and multi-token ones ("これ/それ/…"). */
function buildTokenToPointId(): Map<string, string> {
  const m = new Map<string, string>();
  for (const p of GRAMMAR_POINTS) {
    if (p.status !== "shipped") continue;
    const tok = p.point;
    if (!tok || tok.includes("/") || tok.includes("〜") || Array.from(tok).length > 5) {
      continue;
    }
    if (!m.has(tok)) m.set(tok, p.id);
  }
  return m;
}

/** point id → authored particle_cloze steps that drill it. Memoized; walks
 *  content lessons once (review-lesson ids skipped to avoid recursion, since
 *  this is imported by the review builder). */
export function getGrammarReviewIndex(): Map<string, LessonStep[]> {
  if (index) return index;
  const tokenToPoint = buildTokenToPointId();
  const out = new Map<string, LessonStep[]>();
  const course = getMockCourse("ja");
  for (const mod of course.modules) {
    for (const l of mod.lessons) {
      if (/-review-[12]$/.test(l.id)) continue; // avoid recursion; reviews aren't sources
      const lesson = getMockLessonContent(l.id);
      if (!lesson) continue;
      for (const step of lesson.steps) {
        if (step.type !== "particle_cloze") continue;
        const cp = (step as unknown as { correctParticle?: string }).correctParticle;
        const pid = cp ? tokenToPoint.get(cp) : undefined;
        if (!pid) continue;
        const list = out.get(pid) ?? [];
        list.push(step);
        out.set(pid, list);
      }
    }
  }
  index = out;
  return out;
}

/** Shipped grammar points with NO auto-sourced review step (need authored
 *  items / Conjugation Trainer). Surfaced so coverage gaps aren't silent. */
export function getUncoveredGrammarPoints(): string[] {
  const idx = getGrammarReviewIndex();
  return GRAMMAR_POINTS.filter(
    (p) => p.status === "shipped" && !idx.has(p.id),
  ).map((p) => p.id);
}

/**
 * D4 credit: the content-vocab atom ids whose kana appear in a sentence, so a
 * grammar review also counts as a full review of the words it contains. Same
 * substring match the sentence miner uses (`courseDeck.getMinedSentences`).
 * Single-kana atoms are skipped (too noisy). Returns bare atom ids.
 */
export function sentenceVocabAtomIds(sentence: string): string[] {
  const ids: string[] = [];
  for (const atom of JA_COURSE_ATOMS) {
    if (!isSrsEligibleAtom(atom)) continue;
    if (Array.from(atom.kana).length < 2) continue;
    if (sentence.includes(atom.kana)) ids.push(atom.id);
  }
  return ids;
}

/** Reconstruct the full sentence text of a particle-cloze step (before +
 *  answer + after) for vocab resolution. */
export function clozeStepSentence(step: LessonStep): string {
  const s = step as unknown as {
    correctParticle?: string;
    prompt?: { before?: string; after?: string };
  };
  return `${s.prompt?.before ?? ""}${s.correctParticle ?? ""}${s.prompt?.after ?? ""}`;
}

export function __resetGrammarReviewIndex(): void {
  index = null;
}
