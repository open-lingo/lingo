import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { getMockLessonContent } from "@/features/lesson/data/mockLessons";
import { getMockCourse } from "@/shared/domain/mockCourse";
import { JA_COURSE_ATOMS_BY_KANA } from "../courseAtoms";

/**
 * PRODUCTION-ONLY EXPOSURE DETECTOR (recognition-scaffolding gap, 3rd
 * occurrence of the class: m11 weekday lesson finding 2, then m13-neo-10 /
 * m14-neo-10 — docs/learner-sim/m11-packs-2026-07-29.md and
 * m13-m14-packs-2026-07-29.md).
 *
 * The failure shape: an `imageable: false` newly-introduced word gets no
 * image-MCQ debut (the compiler only generates those for imageable words),
 * and unless the author adds a SUBSTITUTE recognition beat (particle-cloze
 * with the word as the ANSWER, or a listening-comp), every graded touch of
 * the word — first exposure to final review — is a production task
 * (build_sentence / listening_build / translate). The learner is never once
 * asked the cheap direction ("what does ゆうべ mean?") before being asked to
 * produce the word in a full sentence.
 *
 * INSTRUMENT. For every IR-compiled module (curriculum/ir/*.ir.json —
 * m3–m5 are hand-authored TS and out of scope), take each lesson's
 * `introduces:` list, drop derived conjugation cells (`derivedFrom` — they
 * deliberately carry no registry row / no SRS credit) and any kana with no
 * registry atom, and resolve kana → atom id through the SAME map the step
 * factories' `resolveAtomIds` uses (`JA_COURSE_ATOMS_BY_KANA`, which bakes
 * in the `JA_PRIMARY_ATOM_BY_KANA` homograph rulings — はやい→hayai-early).
 * Then walk the live map in course order (same walk as
 * fromModuleDrift.test.ts) and bucket every step that grades the atom
 * (`exercisedAtoms` membership) as RECOGNITION or PRODUCTION:
 *
 *   recognition — `step.modality === "recognition"` (word_image_mcq,
 *     listening_comprehension, match_pairs, the audio MCQs) OR
 *     `step.type === "particle_cloze"` (its factory credits ONLY the answer,
 *     so exercisedAtoms membership means the word IS the picked answer —
 *     the けさ/ゆうべ/あした contrast-cloze pattern);
 *   production — everything else (build_sentence, listening_build,
 *     translate, multiple_choice, …).
 *
 * An offender is an introduced atom with ≥1 graded exposure and ZERO
 * recognition exposures, course-wide. (Atoms with zero graded exposure at
 * all are atomExposureAudit's territory, not this test's.)
 *
 * Ratcheted SHRINK-ONLY: fix words by giving them a recognition beat in
 * their teaching lesson's IR (see the 2026-07-29 m13/m14 fix — reuse an
 * already-TTS'd sentence as a particle-cloze full text or listening-comp
 * audio so no new clips are needed), then lower the pin. Never raise it.
 * Full offender list: RECOGNITION_REPORT=1 npx vitest run recognitionExposure
 * → /tmp/ja-production-only-exposure.txt
 */

const IR_DIR = join(process.cwd(), "src/features/languages/ja/curriculum/ir");

type IrAtom = { kana?: string; imageable?: boolean; derivedFrom?: string | null };
type IrLesson = { id: string; introduces?: string[] };
type IrModule = { module: string; newAtoms?: IrAtom[]; lessons?: IrLesson[] };

type Candidate = {
  atomId: string;
  kana: string;
  module: string;
  imageable: boolean | undefined;
};

type Tally = {
  graded: number;
  recognition: number;
  /** `type@stepId` of every graded touch, for the report/failure message. */
  touches: string[];
};

function collectCandidates(): Candidate[] {
  const byId = new Map<string, Candidate>();
  const files = readdirSync(IR_DIR)
    .filter((f) => /^m\d+\.ir\.json$/.test(f))
    .sort((a, b) => Number(a.match(/\d+/)![0]) - Number(b.match(/\d+/)![0]));
  for (const f of files) {
    const ir = JSON.parse(readFileSync(join(IR_DIR, f), "utf8")) as IrModule;
    const newAtoms = ir.newAtoms ?? [];
    for (const lesson of ir.lessons ?? []) {
      for (const kana of lesson.introduces ?? []) {
        const irAtom = newAtoms.find((a) => a.kana === kana);
        // Derived conjugation cells (おきた, あけて …) carry no registry row
        // by design — Track A credit rides the dictionary form.
        if (irAtom?.derivedFrom) continue;
        const atomId = JA_COURSE_ATOMS_BY_KANA.get(kana)?.id;
        if (!atomId) continue;
        // First introducing module wins (re-introductions don't re-home).
        if (!byId.has(atomId)) {
          byId.set(atomId, {
            atomId,
            kana,
            module: ir.module,
            imageable: irAtom?.imageable,
          });
        }
      }
    }
  }
  return [...byId.values()];
}

function tallyExposures(): Map<string, Tally> {
  const course = getMockCourse("ja");
  const tally = new Map<string, Tally>();
  for (const mod of course.modules) {
    for (const lesson of mod.lessons) {
      const content = getMockLessonContent(lesson.id);
      if (!content) continue;
      for (const step of content.steps) {
        const s = step as {
          exercisedAtoms?: string[];
          modality?: string;
          type: string;
          id: string;
        };
        const ex = s.exercisedAtoms ?? [];
        if (!ex.length) continue;
        const isRecognition =
          s.modality === "recognition" || s.type === "particle_cloze";
        for (const raw of ex) {
          const atomId = raw.replace(/^ja:/, "");
          let t = tally.get(atomId);
          if (!t) {
            t = { graded: 0, recognition: 0, touches: [] };
            tally.set(atomId, t);
          }
          t.graded++;
          if (isRecognition) t.recognition++;
          if (t.touches.length < 12) t.touches.push(`${s.type}@${s.id}`);
        }
      }
    }
  }
  return tally;
}

describe("IR-introduced atoms: production-only exposure (recognition-gap ratchet)", () => {
  const candidates = collectCandidates();
  const tally = tallyExposures();
  const offenders = candidates
    .filter((c) => {
      const t = tally.get(c.atomId);
      return t !== undefined && t.graded > 0 && t.recognition === 0;
    })
    .sort((a, b) => a.module.localeCompare(b.module, undefined, { numeric: true }));

  it("instrument control: the walk sees a real population and both modalities", () => {
    // Population guards — an empty candidate set or a walk that dropped
    // modality/exercisedAtoms would make the ratchet vacuous.
    expect(candidates.length).toBeGreaterThan(150);
    const graded = [...tally.values()];
    expect(graded.length).toBeGreaterThan(400);
    // The walk must see BOTH buckets, or the classifier is mislabeling.
    expect(graded.some((t) => t.recognition > 0)).toBe(true);
    expect(graded.some((t) => t.graded > t.recognition)).toBe(true);
    // Positive control (verified by hand against the IR SOURCE 2026-07-29,
    // independently of this walk): あさって's only graded appearances in the
    // whole course are two build beats (m11.ir.yaml ja-m11-neo-10 「あさって
    // みせに いく。」 and review-1 「…あさっても いく。」); its rule-card mention
    // is ungraded prose. The seven weekday words got cloze-as-answer fixes,
    // あさって did not. If あさって legitimately gains a recognition beat,
    // swap in another hand-verified offender before deleting this — the
    // detector must stay positive-controlled.
    const asatte = offenders.find((c) => c.kana === "あさって");
    expect(
      asatte,
      "あさって (m11, production-only) disappeared from the offender list — " +
        "if its recognition gap was legitimately fixed, update this control " +
        "to another hand-verified offender.",
    ).toBeDefined();
  });

  it("production-only introduced atoms count only goes DOWN", () => {
    // Measured 2026-07-29: 21 offenders after the m13/m14 recognition fix
    // (was 27 before it — おきる/あらう/ゆうべ/はやい/あける/しめる each
    // gained a cloze-as-answer or listening-comp beat in their teaching
    // lesson). SHRINK-ONLY: give words recognition beats in the IR and
    // lower this; never raise.
    const MAX_PRODUCTION_ONLY_INTRODUCED_ATOMS = 21;
    expect(
      offenders.length,
      `introduced atoms whose every graded exposure is production-only:\n` +
        offenders
          .map((c) => {
            const t = tally.get(c.atomId)!;
            return `${c.kana}\t${c.atomId}\t${c.module}\timageable=${String(c.imageable)}\tgraded=${t.graded}\t${t.touches.join(", ")}`;
          })
          .join("\n"),
    ).toBeLessThanOrEqual(MAX_PRODUCTION_ONLY_INTRODUCED_ATOMS);
  });

  it("the m13/m14 pack fix holds: the six flagged words keep a recognition touch", () => {
    // Regression pin for the 2026-07-29 learner-sim MAJOR findings — these
    // exact words shipped production-only and were fixed with contrast
    // clozes / listening-comps in ja-m13-neo-10 and ja-m14-neo-10.
    for (const atomId of ["okiru", "arau", "yuube", "hayai-early", "akeru", "shimeru"]) {
      const t = tally.get(atomId);
      expect(t, `${atomId} is no longer graded anywhere`).toBeDefined();
      expect(
        t!.recognition,
        `${atomId} lost its recognition-only exposure (touches: ${t!.touches.join(", ")})`,
      ).toBeGreaterThan(0);
    }
  });

  it("report: full offender list when RECOGNITION_REPORT=1", () => {
    if (!process.env.RECOGNITION_REPORT) return;
    writeFileSync(
      "/tmp/ja-production-only-exposure.txt",
      [
        `IR-introduced atoms with graded exposure but ZERO recognition ` +
          `exposure, course-wide: ${offenders.length} of ${candidates.length} introduced atoms`,
        "recognition = modality:recognition step OR particle_cloze-as-answer",
        "",
        ...offenders.map((c) => {
          const t = tally.get(c.atomId)!;
          return `${c.module}\t${c.kana}\t${c.atomId}\timageable=${String(c.imageable)}\tgraded=${t.graded}\t${t.touches.join(", ")}`;
        }),
      ].join("\n"),
    );
    expect(true).toBe(true);
  });
});
