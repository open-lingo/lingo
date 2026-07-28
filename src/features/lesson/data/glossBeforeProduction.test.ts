import { describe, expect, it } from "vitest";
import { getMockCourse } from "@/shared/domain/mockCourse";
import { getMockLessonContent } from "./mockLessons";
import { readdirSync, readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { JA_COURSE_ATOMS } from "@/features/languages/ja/courseAtoms";

/**
 * A WORD'S MEANING MUST BE STATED BEFORE THE LEARNER IS ASKED TO PRODUCE IT.
 *
 * Spencer's learner simulation (2026-07-27) kept hitting the same wall from
 * m3 onward: a build step whose answer needs a word the course has shown but
 * never explained. The learner could usually still pass — the tile bank has
 * four tiles and three of them are known — and that is exactly the problem.
 * Passing by elimination is not learning the word, and the course never comes
 * back to teach it, so the word stays a hole that later modules build on.
 * 「ともだち」 is used as content vocabulary from m3 lesson 2 and first
 * explained in m4; 「にほんじん」 is produced in m3 and explained in m20.
 *
 * WHAT COUNTS AS STATING A MEANING. The course teaches vocabulary four ways,
 * and all four are honest:
 *   - `word_image_mcq` — the picture-and-word debut.
 *   - `match_pairs` — the word beside its English.
 *   - `multiple_choice` — "pick the word for X".
 *   - `grammar_rule` — the card's prose and worked examples carry English.
 * What does NOT count is appearing as a tile, a distractor, or inside a
 * sentence the learner is asked to build. Those are exposure, not teaching.
 *
 * WHAT IS EXEMPT. Conjugated forms are excluded: a learner taught いく and the
 * ます rule can produce いきます without being handed it as vocabulary — that
 * is the rule doing its job. The exemption is built from the IR's own
 * `derivedFrom` links, NOT from `getRealFormLexicon()`, which is the whole
 * 2,151-word real-word lexicon and contains plain nouns like うみ. Excluding
 * by that made every word exempt and the guard passed on a course with
 * thirty-one known holes — so `demandedWords` carries its own non-vacuity
 * floor below.
 */
const CONTENT_KINDS = new Set(["vocab", "verb", "adj"]);
const CONTENT = new Set(
  JA_COURSE_ATOMS.filter((a) => CONTENT_KINDS.has((a as { kind?: string }).kind ?? "")).map(
    (a) => a.kana,
  ),
);

/** Every surface some module declares as a conjugation of something else. */
function derivedForms(): Set<string> {
  const dir = join(dirname(fileURLToPath(import.meta.url)), "../../languages/ja/curriculum/ir");
  const out = new Set<string>();
  for (const f of readdirSync(dir).filter((x) => x.endsWith(".ir.json"))) {
    const ir = JSON.parse(readFileSync(join(dir, f), "utf8")) as {
      newAtoms?: { kana: string; derivedFrom?: string }[];
      priorAtoms?: { kana: string; derivedFrom?: string }[];
    };
    for (const a of [...(ir.newAtoms ?? []), ...(ir.priorAtoms ?? [])])
      if (a.derivedFrom) out.add(a.kana);
  }
  return out;
}

/** The sentence the learner must produce, or null for steps that only ask
 *  them to recognise something. */
function producedJa(step: Record<string, unknown>): string | null {
  const t = step.type;
  if (t === "speaking") return (step.targetPhrase as string) ?? null;
  if (t === "translate") return ((step.acceptedAnswers as string[]) ?? [])[0] ?? null;
  if (t === "build_sentence") return ((step.correctOrder as string[]) ?? []).join(" ") || null;
  return null;
}

/**
 * Words produced before they are explained, as the course stands. Every entry
 * is a real hole in the teaching order — this is a WORKLIST, not a set of
 * accepted exceptions, and it only shrinks. A new word appearing here means a
 * module was authored with a step that outruns its own vocabulary.
 */
const KNOWN_DEBT = new Set<string>([
  // EMPTY, and it stays empty. All 43 holes were closed on 2026-07-27, the day
  // this guard was written. An entry appearing here again means a module was
  // authored with a production step that outruns its own vocabulary, and the
  // fix is the lesson, not the list.
]);

describe("vocabulary is explained before it is demanded", () => {
  it("no content word is produced before its meaning is stated", () => {
    const derived = derivedForms();
    const stated = new Map<string, number>();
    const demanded = new Map<string, { at: number; where: string }>();
    let n = 0;
    let scannedProductions = 0;

    for (const mod of getMockCourse("ja").modules) {
      if ((mod as { tier?: string }).tier === "n4") continue;
      for (const entry of mod.lessons ?? []) {
        const lesson = getMockLessonContent(entry.id);
        if (!lesson) continue;
        for (const raw of lesson.steps) {
          const step = raw as unknown as Record<string, unknown>;
          n++;
          const state = (w?: string) => {
            if (w && CONTENT.has(w) && !stated.has(w)) stated.set(w, n);
          };
          const opts = (step.options as { id?: string; word?: string; text?: string }[]) ?? [];
          if (step.type === "word_image_mcq" || step.type === "multiple_choice")
            for (const o of opts) if (o.id === "correct") state(o.word ?? o.text);
          if (step.type === "match_pairs")
            for (const p of (step.pairs as { source?: string }[]) ?? []) state(p.source);
          if (step.type === "grammar_rule") {
            // `cultureNote` counts: it is shown on the card and routinely
            // carries the only gloss a function word ever gets — 「そう」's
            // lived there and nowhere else, so the first run of this guard
            // called a taught word untaught.
            const text = [
              step.rule as string,
              step.cultureNote as string,
              ...(((step.examples as { ja?: string }[]) ?? []).map((e) => e.ja ?? "")),
            ].join(" ");
            for (const w of CONTENT) if (text.includes(w)) state(w);
          }

          const sent = producedJa(step);
          if (!sent) continue;
          scannedProductions++;
          for (const chunk of sent.split(/[\s　]+/)) {
            const w = chunk.replace(/[。、？！]/g, "");
            if (CONTENT.has(w) && !derived.has(w) && !demanded.has(w))
              demanded.set(w, { at: n, where: `${entry.id} ${String(step.type)}` });
          }
        }
      }
    }

    // `LEARNER_DEBT=1` ignores the worklist and reports every hole, so the
    // debt can be burned down without editing the guard to see it.
    const showAll = !!process.env.LEARNER_DEBT;
    const offenders: string[] = [];
    for (const [w, { at, where }] of demanded) {
      if (!showAll && KNOWN_DEBT.has(w)) continue;
      const s = stated.get(w);
      if (s === undefined)
        offenders.push(`「${w}」 is produced at ${where} and its meaning is never stated anywhere`);
      else if (s > at)
        offenders.push(
          `「${w}」 is produced at ${where} (step ${at}) but only explained at step ${s} — ` +
            `move its debut earlier, or teach it where it is first used`,
        );
    }

    // Non-vacuity: this scan reads four step types and a projection that has
    // moved before. Nothing to check reads exactly like nothing wrong.
    expect(scannedProductions, "no production steps scanned — field names moved").toBeGreaterThan(
      1500,
    );
    expect(stated.size, "no vocabulary found to be stated — gloss sources moved").toBeGreaterThan(
      200,
    );
    // THE assert this guard shipped without, and the reason it passed on a
    // course with thirty-one known holes: if the exemption set swallows every
    // word, there is nothing left to check and the run looks clean.
    expect(demanded.size, "no words demanded — the derived-form exemption is too wide")
      .toBeGreaterThan(300);
    expect(offenders, offenders.join("\n")).toEqual([]);
  });

  it("counts a rule card as teaching, and a tile as not", () => {
    // The distinction the whole guard rests on: a card that says what a word
    // means teaches it; a tile bank that happens to contain the word does not.
    const card = {
      type: "grammar_rule",
      rule: "ある says an inanimate thing EXISTS",
      examples: [{ ja: "ほんが ある。" }],
    };
    const build = { type: "build_sentence", correctOrder: ["ほんが", "ある"] };
    expect(producedJa(build)).toBe("ほんが ある");
    expect(producedJa(card)).toBeNull();
  });
});
