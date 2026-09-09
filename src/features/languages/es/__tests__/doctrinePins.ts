/**
 * Shared §13-doctrine pins for ES modules (extracted from m3.test.ts for
 * the m4–m10 wave — one call per module test file, bespoke pins stay in
 * the module's own suite).
 *
 * What lives here: the module-shape laws every §13 module obeys
 * identically. What does NOT live here: discrimination-lane tallies, tint
 * tables, inventory rules, recall licensing — those are per-module
 * judgment and belong in mN.test.ts.
 */
import { describe, it, expect } from "vitest";
import type { EsAtom } from "../courseAtoms";
import type { LessonContent } from "@/features/lesson/types";
import { isGradedStep } from "@/features/lesson/data/_stepPredicates";

export function registerEsDoctrinePins(opts: {
  moduleId: string;
  lessons: LessonContent[];
  checkpointIndex: number;
  /** Module-wide floor for cue:"recall" speaking steps (default 6). */
  minRecalls?: number;
  /** Module-wide floor for audio-prompted word MCQs (default 6). */
  minAudioWimcqs?: number;
}): void {
  const { moduleId, lessons, checkpointIndex } = opts;
  const MASTERY = lessons.length;
  const nums = lessons.map((_, i) => i + 1);
  const getLesson = (n: number) => lessons[n - 1].steps;

  describe(`ES ${moduleId} — §13 doctrine pins (shared)`, () => {
    it(`has ${lessons.length} lessons; checkpoint at ${checkpointIndex}`, () => {
      expect(lessons.length).toBeGreaterThanOrEqual(9);
      expect(checkpointIndex).toBeGreaterThan(1);
      expect(checkpointIndex).toBeLessThan(MASTERY);
    });

    for (const n of nums) {
      it(`L${n}: unique ids, no adjacent same-type steps, match in the closing zone`, () => {
        const steps = getLesson(n);
        expect(steps.length).toBeGreaterThanOrEqual(6);
        expect(new Set(steps.map((s) => s.id)).size).toBe(steps.length);
        for (let i = 1; i < steps.length; i++) {
          expect(
            steps[i].type,
            `L${n} adjacent same-type at ${steps[i - 1].id} / ${steps[i].id}`,
          ).not.toBe(steps[i - 1].type);
        }
        if (n !== MASTERY) {
          expect(
            steps.slice(-3).map((s) => s.type),
            `L${n} has no match in its closing zone`,
          ).toContain("match_pairs");
        }
      });

      it(`L${n}: zero passive cards; info budget respected (§13.1)`, () => {
        const steps = getLesson(n);
        expect(steps.filter((s) => s.type === "phrase_card").length).toBe(0);
        expect(steps.filter((s) => s.type === "pretest_mcq").length).toBe(0);
        const infoCount = steps.filter((s) => s.type === "info").length;
        if (n === MASTERY || n === checkpointIndex) {
          expect(infoCount, "checkpoint/mastery carry no cards").toBe(0);
        } else {
          expect(infoCount).toBeLessThanOrEqual(1);
        }
      });

      it(`L${n}: exercised atoms resolve to registered es: ids`, () => {
        for (const s of getLesson(n)) {
          const ex = (s as { exercisedAtoms?: string[] }).exercisedAtoms ?? [];
          for (const id of ex) expect(id.startsWith("es:")).toBe(true);
        }
      });
    }

    it("checkpoint and mastery are graded steps only", () => {
      for (const n of [checkpointIndex, MASTERY]) {
        expect(
          getLesson(n).every((s) => isGradedStep(s)),
          `L${n} carries a non-graded step`,
        ).toBe(true);
      }
    });

    it("the module ends on a dialogue_sim (§13.9 law 7)", () => {
      const steps = getLesson(MASTERY);
      expect(steps[steps.length - 1].type).toBe("dialogue_sim");
    });

    it("has ZERO typed translate steps (beginner tier — §13.9 law 10)", () => {
      for (const n of nums) {
        expect(getLesson(n).filter((s) => s.type === "translate").length).toBe(0);
      }
    });

    it(`carries ≥${opts.minRecalls ?? 6} cued recalls (licensing is checked course-wide)`, () => {
      let recalls = 0;
      for (const n of nums) {
        for (const s of getLesson(n)) {
          if (s.type === "speaking" && s.cue === "recall") recalls++;
        }
      }
      expect(recalls).toBeGreaterThanOrEqual(opts.minRecalls ?? 6);
    });

    it(`carries ≥${opts.minAudioWimcqs ?? 6} audio-prompted word MCQs; digit options only audio-prompted`, () => {
      // m8's teens use composite two-keycap emoji (no native Unicode form).
      const digits = ["0️⃣", "1️⃣", "2️⃣", "3️⃣", "4️⃣", "5️⃣", "6️⃣", "7️⃣", "8️⃣", "9️⃣", "🔟", "1️⃣1️⃣", "1️⃣2️⃣", "1️⃣3️⃣", "1️⃣4️⃣", "1️⃣5️⃣"];
      let audio = 0;
      for (const n of nums) {
        for (const s of getLesson(n)) {
          if (s.type !== "word_image_mcq") continue;
          const audioPrompted = s.options.some((o) => o.word === s.meaningEn);
          if (audioPrompted) audio++;
          if (s.options.some((o) => digits.includes(o.emoji))) {
            expect(audioPrompted, `${s.id}: digit options demand audio mode`).toBe(true);
          }
        }
      }
      expect(audio).toBeGreaterThanOrEqual(opts.minAudioWimcqs ?? 6);
    });

    it("no sim offers the NPC's own line as a WRONG option; goals stay ≤8 words (§13.6)", () => {
      const norm = (t: string) => t.toLowerCase().replace(/[¡!¿?.,«»\s]+/g, " ").trim();
      for (const n of nums) {
        for (const s of getLesson(n)) {
          if (s.type !== "dialogue_sim") continue;
          for (const turn of s.turns) {
            expect(
              turn.goal.split(/\s+/).length,
              `${s.id}/${turn.id} goal too wordy`,
            ).toBeLessThanOrEqual(8);
            if (turn.reply.mode !== "choice") continue;
            const npcLine = norm(turn.npc.kana);
            for (const opt of turn.reply.options) {
              if (norm(opt.text) !== npcLine) continue;
              const accepted =
                opt.id === turn.reply.correctOptionId ||
                (turn.reply.alsoCorrectOptionIds ?? []).includes(opt.id);
              expect(
                accepted,
                `${s.id}/${turn.id}: option "${opt.text}" mirrors the NPC line but is marked wrong`,
              ).toBe(true);
            }
          }
        }
      }
    });

    it("cloze share: ≤25% in teaching lessons, ≤⅓ in checkpoint/mastery", () => {
      // The exam lessons run discrimination lanes hard by design; teaching
      // lessons carrying that density are the m3 checkpoint-wall failure.
      for (const n of nums) {
        const steps = getLesson(n);
        const clozes = steps.filter((s) => s.type === "particle_cloze").length;
        const cap = n === checkpointIndex || n === MASTERY ? 1 / 3 : 0.25;
        expect(
          clozes / steps.length,
          `L${n}: ${clozes}/${steps.length} clozes (cap ${cap.toFixed(2)})`,
        ).toBeLessThanOrEqual(cap + 1e-9);
      }
    });
  });
}

/** Convenience: pins that a module's atoms all literally appear somewhere
 *  in its own steps (registration point 7). */
export function registerEsAtomUsagePin(
  moduleId: string,
  lessons: LessonContent[],
  atoms: EsAtom[],
  opts: {
    /** Atoms registered ONLY so the gate can track them (a transfer-test foil,
     *  a never-conjugated infinitive). Each needs a reason at the call site. */
    neverProduced?: string[];
  } = {},
): void {
  describe(`ES ${moduleId} — atom usage`, () => {
    it("every declared atom appears in the module's own steps", () => {
      const corpus = JSON.stringify(lessons).toLowerCase();
      const missing = atoms
        .map((a) => a.surface)
        .filter((surf) => !corpus.includes(surf.toLowerCase()));
      expect(missing, `atoms never used: ${missing.join(", ")}`).toEqual([]);
    });

    it("every declared atom earns an ANSWER position, not just a distractor slot", () => {
      // The usage pin above counts appearances, and a distractor IS an
      // appearance — so a word can be shown a dozen times and never once be
      // the thing the learner commits to. Found in the m12 wave (estas: 8
      // appearances, 0 answers); lifted course-wide 2026-09-06. Answer
      // positions: build/listen-build targets, speaking phrases, cloze and
      // agreement blanks, and dialogue_sim replies (the learner produces the
      // reply, in pick or build mode).
      const answers: string[] = [];
      for (const l of lessons) {
        for (const s of l.steps) {
          const rec = s as unknown as Record<string, unknown>;
          if (s.type === "build_sentence" || s.type === "listening_build") {
            answers.push(String(rec.targetSentence ?? ""));
          } else if (s.type === "speaking") {
            answers.push(String(rec.targetPhrase ?? ""));
          } else if (s.type === "particle_cloze") {
            answers.push(String(rec.correctParticle ?? ""));
          } else if (s.type === "agreement_cloze") {
            for (const seg of s.segments) if ("blank" in seg) answers.push(seg.blank.correctAnswer);
          } else if (s.type === "dialogue_sim") {
            for (const t of s.turns) {
              const r = t.reply;
              if (r.mode === "build") answers.push(r.answer);
              else answers.push(r.options.find((o) => o.id === r.correctOptionId)?.text ?? "");
            }
          }
        }
      }
      expect(answers.length, "no answer positions found — the pin would be vacuous").toBeGreaterThan(0);
      const norm = (x: string) => x.toLowerCase().replace(/[¿¡?!.,]/g, "").trim();
      const phrases = answers.map(norm);
      const words = new Set(phrases.flatMap((p) => p.split(/\s+/)));
      const exempt = new Set((opts.neverProduced ?? []).map(norm));
      const missing = atoms
        .map((a) => norm(a.surface))
        .filter((surf) => !exempt.has(surf))
        .filter((surf) =>
          surf.includes(" ") ? !phrases.some((p) => p.includes(surf)) : !words.has(surf),
        );
      expect(
        missing,
        `offered but never produced (no answer position): ${missing.join(", ")}`,
      ).toEqual([]);
      const staleExempt = [...exempt].filter((e) => !atoms.some((a) => norm(a.surface) === e));
      expect(staleExempt, `neverProduced names a surface that is not an atom here`).toEqual([]);
    });
  });
}
