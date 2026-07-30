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
 * Descriptive points that ENCODE a mechanical transformation the curriculum
 * already teaches — verb conjugation (じしょけい ↔ ます) and the 人 counter —
 * ARE covered here, by regenerating that same known-correct transformation as
 * a `sentenceMcq` (see `buildDescriptiveGrammarSteps`): a reused step type, a
 * never-wrong form, drawing only on vocab introduced by the point's module.
 * Points with neither a literal token nor a mechanical transform (adjective
 * forms, demonstrative sets) stay uncovered (logged via
 * `getUncoveredGrammarPoints`) — authored review items / the Conjugation
 * Trainer (§10) cover them later.
 */
import { getAvailableMockLessonIds, getMockLessonContent } from "./mockLessons";
import type { LessonStep } from "../types";
import grammarPointsJson from "./n5-grammar-points.json";
import type { GrammarPoint } from "@/features/flashcards/engine/grammarSrs";
import { JA_COURSE_ATOMS, isSrsEligibleAtom } from "@/features/languages/ja/courseAtoms";
import { sentenceMcq } from "@/features/languages/ja/grammarHelpers";

const GRAMMAR_POINTS = grammarPointsJson as GrammarPoint[];

let index: Map<string, LessonStep[]> | null = null;

/**
 * Harvest attribution window (2026-07-06 mis-attribution fix). A literal
 * token belongs to its point only NEAR the point's own module: the registry
 * spells several LATER grammar senses with the same token (から: origin m5 /
 * time m13 / because m13 / てから m16; に: location m6 / time m12 / purpose
 * m25 / になる m27; が, と, います likewise), but those later senses are
 * non-literal-token points (their `point` carries 〜 or /), so token-matching
 * used to dump EVERY occurrence — all modules, all senses — into the one
 * literal point's pool (audit: kara-origin held てから "after doing X"
 * sentences; imasu's pool was 100% て-います progressive). A cloze is now
 * attributed only when its source LESSON's module (the lesson content's own
 * `moduleId` — the m1-id-prefix landmine forbids parsing lesson ids, and the
 * course map now carries the rewrite spine, not the harvested lessons) sits in
 * [point.module, point.module + HARVEST_WINDOW_MODULES]: the intro module
 * plus the horizon the curriculum actually re-drills a fresh particle in.
 * Sentences outside the window are simply dropped — the later senses all have
 * authored pools (`AUTHORED_GRAMMAR_POOLS`), so nothing needs re-attribution,
 * and below-window occurrences (e.g. m4 が clozes predating ga-existence m6)
 * were intro-before-review violations to begin with.
 */
const HARVEST_WINDOW_MODULES = 2;

/** Literal single-token grammar points (particles/markers/copula) → point.
 *  Skips descriptive points ("じしょけい") and multi-token ones ("これ/それ/…").
 *  No two shipped points share a literal token (verified 2026-07-06) — later
 *  same-token senses are all non-literal — so first-wins never fires. */
function buildTokenToPoint(): Map<string, GrammarPoint> {
  const m = new Map<string, GrammarPoint>();
  for (const p of GRAMMAR_POINTS) {
    if (p.status !== "shipped") continue;
    const tok = p.point;
    if (!tok || tok.includes("/") || tok.includes("〜") || Array.from(tok).length > 5) {
      continue;
    }
    if (!m.has(tok)) m.set(tok, p);
  }
  return m;
}

function moduleNum(m: string): number {
  const x = /^m(\d+)$/.exec(m);
  return x ? Number(x[1]) : NaN;
}

/* ────────────────────────────────────────────────────────────────────────
 * Non-particle grammar review (verb conjugation + counters)
 *
 * These points have no literal token to cloze, but the curriculum DOES author
 * the transformation itself (M7-2 dict↔ます, M5-4 people-counter). We
 * regenerate that same, known-correct transformation as a `sentenceMcq` — an
 * existing step type, never a fabricated/wrong form — so they enter Track B
 * review through the identical builder path the particle clozes use. Every
 * form referenced is introduced by the point's own module (see the atom
 * registry: dict forms + counters are M5/M7 atoms), so the intro-before-review
 * invariant holds inside the ja-mN-review lessons.
 * ──────────────────────────────────────────────────────────────────────── */

// M7 dictionary/polite verb pairs — every dict form is introduced in M7-1,
// every ます form in M7-2, so both are known by the M7 review lesson.
const VERB_FORM_PAIRS: ReadonlyArray<{ dict: string; masu: string; en: string }> = [
  { dict: "のむ", masu: "のみます", en: "drink" },
  { dict: "たべる", masu: "たべます", en: "eat" },
  { dict: "みる", masu: "みます", en: "watch" },
  // よむ / かく sat here until 2026-07-30: the m16 vocab pack re-homed their
  // stale m7 fromModule tags to m16 (where the live course actually teaches
  // them), which correctly makes them too advanced for this m5-era pool —
  // the comprehensibility gate resolves through fromModule. あそぶ (m2) and
  // はたらく (m7, taught by ja-m7-neo-7) carry the slots instead.
  { dict: "あそぶ", masu: "あそびます", en: "play" },
  { dict: "はたらく", masu: "はたらきます", en: "work" },
  { dict: "いく", masu: "いきます", en: "go" },
];

// M5 人-counter. ひとり/ふたり are native-reading irregulars; from 3 the Sino
// number + にん pattern applies. All introduced in M5-4. `wrongNum` = the bare
// Sino number, `wrongThing` = the generic object counter — the two authored
// confusions (M5-4-1 distractors に / ふたつ).
const PEOPLE_COUNTERS: ReadonlyArray<{
  kana: string;
  en: string;
  wrongNum: string;
  wrongThing: string;
}> = [
  { kana: "ふたり", en: "2 people", wrongNum: "に", wrongThing: "ふたつ" },
  { kana: "ひとり", en: "1 person", wrongNum: "いち", wrongThing: "ひとつ" },
  { kana: "さんにん", en: "3 people", wrongNum: "さん", wrongThing: "みっつ" },
];

/** dict → ます (produce the polite form). */
function verbMasuSteps(): LessonStep[] {
  return VERB_FORM_PAIRS.map(({ dict, masu, en }, i) =>
    sentenceMcq({
      id: `ja-grev-masu-${i}`,
      prompt: `What is the polite (ます) form of ${dict} (to ${en})?`,
      correctKana: masu,
      distractorsKana: [
        `${dict}ます`, // naive-append error
        dict, // unconjugated plain form
        VERB_FORM_PAIRS[(i + 1) % VERB_FORM_PAIRS.length].masu, // another verb's ます
      ],
      explanation: `${dict} → ${masu}. Change the verb ending to its ます-form; never just append ます to the dictionary form.`,
      exercisedAtomKanas: [masu],
    }),
  );
}

/** ます → dict (recall the citation form). */
function verbDictSteps(): LessonStep[] {
  return VERB_FORM_PAIRS.map(({ dict, masu, en }, i) =>
    sentenceMcq({
      id: `ja-grev-dict-${i}`,
      prompt: `What is the dictionary (plain) form of ${masu} (to ${en})?`,
      correctKana: dict,
      distractorsKana: [
        masu, // the polite form itself
        VERB_FORM_PAIRS[(i + 1) % VERB_FORM_PAIRS.length].dict, // another verb's plain form
        VERB_FORM_PAIRS[(i + 2) % VERB_FORM_PAIRS.length].dict, // …and another
      ],
      explanation: `${masu} → ${dict}. The dictionary form is the -u ending citation form you'd look up.`,
      exercisedAtomKanas: [dict],
    }),
  );
}

/** number → 人-counter reading (ひとり / ふたり / …にん). */
function counterNinSteps(): LessonStep[] {
  return PEOPLE_COUNTERS.map(({ kana, en, wrongNum, wrongThing }, i) =>
    sentenceMcq({
      id: `ja-grev-nin-${i}`,
      prompt: `Which word counts '${en}'?`,
      correctKana: kana,
      distractorsKana: [
        wrongNum, // bare Sino number
        wrongThing, // generic object counter
        PEOPLE_COUNTERS[(i + 1) % PEOPLE_COUNTERS.length].kana, // another people-count
      ],
      explanation: `${kana} = ${en}. The 人 counter uses native ひとり/ふたり for 1–2, then Sino number + にん.`,
      exercisedAtomKanas: [kana],
    }),
  );
}

/** grammar-point id → synthesized transformation review steps. Merged into
 *  the particle-cloze index by `getGrammarReviewIndex` (shipped points only). */
function buildDescriptiveGrammarSteps(): Map<string, LessonStep[]> {
  return new Map<string, LessonStep[]>([
    ["masu-present", verbMasuSteps()],
    ["dictionary-form", verbDictSteps()],
    ["counter-nin", counterNinSteps()],
  ]);
}

/** point id → authored particle_cloze steps that drill it. Memoized; walks
 *  content lessons once (review-lesson ids skipped to avoid recursion, since
 *  this is imported by the review builder). */
export function getGrammarReviewIndex(): Map<string, LessonStep[]> {
  if (index) return index;
  const tokenToPoint = buildTokenToPoint();
  const out = new Map<string, LessonStep[]>();
  // Harvest from the LESSON REGISTRY, not the course map. (The 2026-07-19
  // rationale — "the map's m4-m29 are unauthored comingSoon placeholders and
  // the old course stays registered for deep links" — is DEAD: the IR wave
  // authored m4-m29 and the old course was archived out of the registry on
  // 2026-07-26. The registry walk survives because each lesson's own
  // `moduleId` carries attribution, and the neo-only filter below now does
  // the real source selection.)
  // ⚠️ The `-neo-` substring filter also excludes ja-m30-* (the N4 opener
  // ships without the -neo- infix) and the ja-mN-neo-kata rows are included
  // by it — if m30 ever authors particle_cloze steps they will silently not
  // harvest. Flagged in docs/stale-reference-audit-2026-07-29.md.
  for (const lessonId of getAvailableMockLessonIds()) {
    if (/-review-[12]$/.test(lessonId)) continue; // avoid recursion; reviews aren't sources
    // NEO-ONLY (2026-07-26). This used to be the inverse — neo lessons were
    // SKIPPED because "the rewrite brings its own review machinery" and the
    // old course was the source of truth. The old course is now ARCHIVED
    // (Spencer's ruling: no function in the program may reference it), so
    // harvesting anything but neo would either find nothing or resurrect
    // polite-register content into a dict-form-first course.
    if (!lessonId.includes("-neo-")) continue;
    const lesson = getMockLessonContent(lessonId);
    if (!lesson || lesson.languageId !== "ja") continue;
    const srcModule = moduleNum(lesson.moduleId);
    {
      for (const step of lesson.steps) {
        if (step.type !== "particle_cloze") continue;
        const cp = (step as unknown as { correctParticle?: string }).correctParticle;
        const point = cp ? tokenToPoint.get(cp) : undefined;
        if (!point) continue;
        // Attribution window — see HARVEST_WINDOW_MODULES above.
        const pointModule = moduleNum(point.module);
        if (
          Number.isNaN(srcModule) ||
          Number.isNaN(pointModule) ||
          srcModule < pointModule ||
          srcModule > pointModule + HARVEST_WINDOW_MODULES
        ) {
          continue;
        }
        const list = out.get(point.id) ?? [];
        list.push(step);
        out.set(point.id, list);
      }
    }
  }
  // Merge synthesized transformation steps for non-particle points (verb
  // conjugation + counters). Shipped-gated so a point can't surface a review
  // before its module is authored.
  const shipped = new Set(
    GRAMMAR_POINTS.filter((p) => p.status === "shipped").map((p) => p.id),
  );
  for (const [pid, steps] of buildDescriptiveGrammarSteps()) {
    if (!shipped.has(pid) || steps.length === 0) continue;
    const list = out.get(pid) ?? [];
    list.push(...steps);
    out.set(pid, list);
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
