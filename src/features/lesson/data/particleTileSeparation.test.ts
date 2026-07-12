import { describe, expect, it } from "vitest";
import { getAvailableMockLessonIds, getMockLessonContent } from "./mockLessons";
import { getLanguageModule } from "@/shared/language/registry";

/**
 * Particle-tile separation (Spencer QA 2026-07-12): in build-type steps,
 * particles must be their OWN tiles — "わたしは" as one tile lets the
 * learner skip the actual skill of choosing は vs が vs を. Any tile that
 * decomposes into <known word> + <case/topic particle> is an authoring
 * error unless the whole surface is a lexicalized word in the allowlist.
 */
const PARTICLES = ["から", "まで", "は", "が", "を", "に", "で", "と", "の", "へ", "も", "や"];

/** Lexicalized surfaces that merely LOOK like word+particle. */
const LEXICALIZED = new Set([
  "いつも", // always
  "でも", // but (conjunction)
  "ので", // because (conjunctive particle)
  "それで", // and so (conjunction)
  "それから", // and then (conjunction)
  "では", // well then (discourse marker — taught in m26)
  "はは", // mother
  "もの", // thing
  "もも", // peach
  "どうも", // thanks / somehow
]);

describe("build-tile particle separation", () => {
  it("no build/listening_build tile glues a known word to a particle", () => {
    const atoms = new Set(
      getLanguageModule("ja").courseAtoms.map((a) =>
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        String((a as any).surface ?? (a as any).kana ?? ""),
      ),
    );
    const violations: string[] = [];
    for (const id of getAvailableMockLessonIds()) {
      if (!id.startsWith("ja")) continue;
      const lesson = getMockLessonContent(id);
      if (!lesson) continue;
      for (const s of lesson.steps) {
        if (s.type !== "build_sentence" && s.type !== "listening_build") {
          continue;
        }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const a = s as any;
        const tokens: string[] = [
          ...(a.tiles ?? a.wordBank ?? []),
          ...(a.correctOrder ?? []),
        ];
        for (const tok of new Set(tokens)) {
          if (typeof tok !== "string" || LEXICALIZED.has(tok)) continue;
          for (const p of PARTICLES) {
            if (tok.length <= p.length || !tok.endsWith(p)) continue;
            const stem = tok.slice(0, -p.length);
            // Particle-particle glues (のが) are violations too, but a
            // single-particle "stem" (もも→も+も) is a word, not a glue —
            // require the stem to be a known atom, and skip stems that
            // are themselves single particles UNLESS the pair is a known
            // double-particle glue like のが.
            const stemIsParticle = PARTICLES.includes(stem);
            const knownDoubleGlue = tok === "のが";
            if ((atoms.has(stem) && !stemIsParticle) || knownDoubleGlue) {
              violations.push(`${id}/${s.id}: "${tok}" = ${stem} + ${p}`);
              break;
            }
          }
        }
      }
    }
    expect(violations, violations.join("\n")).toEqual([]);
  });
});
