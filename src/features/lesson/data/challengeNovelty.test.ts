import { describe, expect, it } from "vitest";
import { getMockLessonContent, getAvailableMockLessonIds } from "./mockLessons";

/**
 * A CHALLENGE LESSON MAY NOT RE-RUN A SENTENCE THE LEARNER HAS ALREADY MET TWICE.
 *
 * Invariant 26 says the challenge combines ≥3 grammar points "in a combination
 * the learner has NOT seen in this module — every constituent piece is taught,
 * the SHAPE is new. Longer-but-familiar is not a challenge step."
 *
 * The compiler already enforces half of that (`challenge-not-novel`), but it
 * keys on the BEAT kind and compares only the grammar-point SET. An ordinary
 * `kind: sentence` beat sitting inside the challenge LESSON is never checked at
 * all, so byte-identical text has been passing for as long as the rule has
 * existed: found 2026-07-27 in m26, where six of the challenge's thirteen
 * sentence beats were recycles and two dictations were byte-identical to a
 * teaching beat AND to a review beat. A course-wide scan then found the same
 * shape in eleven modules. Three-plus modules means the tooling is the defect,
 * not the authors — hence this file.
 *
 * WHY "TWICE" AND NOT "AT ALL". Meeting a sentence again in a new modality is
 * legitimate review: building 「としょかんは ごじまでだから よじまでに いく」 in
 * lesson 7 and then HEARING it in the challenge is a different act. What is not
 * legitimate is the third exposure — taught, reviewed, and then handed back as
 * the module's stretch. Fifteen single-prior-appearance cases are deliberately
 * NOT flagged; the eleven below all appeared in two or more other lessons.
 *
 * The unit is what the LEARNER IS ASKED TO PRODUCE OR HEAR — `targetPhrase`,
 * `acceptedAnswers`, `correctOrder`, `transcript`. Not `jaSurfaces`: scanning
 * every Japanese string on every step reports 138 hits, most of them cloze-stem
 * fragments and rule-card examples being practised later, which is good
 * teaching. A guard that flags good teaching gets deleted, so it is worth
 * being precise about the unit.
 */
const norm = (s: string) => s.replace(/[。、？！\s　]/g, "");

/** The sentence the learner produces or hears — nothing else on the step.
 *  `speaking` keeps its answer in `targetPhrase`, `translate` in
 *  `acceptedAnswers` (an ARRAY, because grading is max-acceptance), builds in
 *  `correctOrder`, listening in `transcript`. There is no `targetSentence`. */
function learnerJa(step: unknown): string[] {
  const s = step as {
    targetPhrase?: string;
    acceptedAnswers?: string[];
    correctOrder?: string[];
    transcript?: string;
  };
  const out: string[] = [];
  if (typeof s.targetPhrase === "string") out.push(s.targetPhrase);
  if (Array.isArray(s.acceptedAnswers)) out.push(...s.acceptedAnswers);
  if (Array.isArray(s.correctOrder)) out.push(s.correctOrder.join(""));
  if (typeof s.transcript === "string") out.push(s.transcript);
  return out;
}

/**
 * Known debt as of 2026-07-27, keyed `<module> <stepId>`. These eleven shipped
 * before the rule was mechanical. This list may SHRINK and must never grow: a
 * new entry means a module was authored with a stale challenge beat, and the
 * fix is the sentence, not the list.
 */
const KNOWN_DEBT = new Set([
  "m13 ja-m13-neo-challenge-s-6",
  "m15 ja-m15-neo-challenge-s-7",
  "m16 ja-m16-neo-challenge-s-7",
  "m18 ja-m18-neo-challenge-lc-9",
  "m18 ja-m18-neo-challenge-lc-10",
  "m20 ja-m20-neo-challenge-lc-9",
  "m21 ja-m21-neo-challenge-lc-8",
  "m23 ja-m23-neo-challenge-s-7",
  "m24 ja-m24-neo-challenge-lc-9",
  "m24 ja-m24-neo-challenge-s-7",
  "m25 ja-m25-neo-challenge-s-7",
]);

describe("challenge lessons are new material", () => {
  it("no challenge sentence has already been met in two other lessons", () => {
    const byModule = new Map<string, string[]>();
    for (const id of getAvailableMockLessonIds().filter((i) => /^ja-m\d+-/.test(i))) {
      const mod = id.match(/^ja-(m\d+)-/)![1];
      byModule.set(mod, [...(byModule.get(mod) ?? []), id]);
    }

    let scannedChallenge = 0;
    let scannedElsewhere = 0;
    const fresh: string[] = [];

    for (const [mod, ids] of byModule) {
      // Where else in this module does each sentence appear? Counting DISTINCT
      // lessons, not steps — a sentence built and then re-drilled inside the
      // same lesson is that lesson's business.
      const where = new Map<string, Set<string>>();
      for (const id of ids) {
        if (id.includes("challenge")) continue;
        const lesson = getMockLessonContent(id);
        if (!lesson) continue;
        for (const step of lesson.steps)
          for (const ja of learnerJa(step)) {
            const k = norm(ja);
            if (k.length < 8) continue; // a one-word target is vocabulary, not a sentence
            scannedElsewhere++;
            if (!where.has(k)) where.set(k, new Set());
            where.get(k)!.add(id);
          }
      }

      for (const id of ids.filter((i) => i.includes("challenge"))) {
        const lesson = getMockLessonContent(id);
        if (!lesson) continue;
        const reported = new Set<string>();
        for (const step of lesson.steps)
          for (const ja of learnerJa(step)) {
            const k = norm(ja);
            if (k.length < 8) continue;
            scannedChallenge++;
            const seenIn = where.get(k);
            if (!seenIn || seenIn.size < 2) continue;
            const key = `${mod} ${step.id}`;
            if (reported.has(key) || KNOWN_DEBT.has(key)) continue;
            reported.add(key);
            fresh.push(
              `${key}: 「${ja}」 was already met in ${seenIn.size} other lessons ` +
                `(${[...seenIn].join(", ")}) — the challenge is the module's stretch, ` +
                `not its fourth exposure. Write a new sentence; keep the grammar tags.`,
            );
          }
      }
    }

    // Non-vacuity. A scan that stops seeing the steps it checks looks exactly
    // like a scan that passes — the field names moved once already.
    expect(scannedChallenge, "no challenge sentences scanned — field names moved")
      .toBeGreaterThan(200);
    expect(scannedElsewhere, "no module sentences scanned — field names moved")
      .toBeGreaterThan(2000);
    expect(fresh, fresh.join("\n")).toEqual([]);
  });

  it("reads all four answer fields, so a step type cannot hide from it", () => {
    expect(learnerJa({ targetPhrase: "あ" })).toEqual(["あ"]);
    expect(learnerJa({ acceptedAnswers: ["い", "う"] })).toEqual(["い", "う"]);
    expect(learnerJa({ correctOrder: ["え", "お"] })).toEqual(["えお"]);
    expect(learnerJa({ transcript: "か" })).toEqual(["か"]);
    expect(learnerJa({ prompt: "not an answer field" })).toEqual([]);
    // Normalisation has to make 「にほんに いった ことが ある。」 and the tile join
    // 「にほんにいったことがある」 the same string, or every build step compares
    // unequal to its own dictation.
    expect(norm("にほんに いった ことが ある。")).toBe(norm("にほんにいったことがある"));
  });
});
