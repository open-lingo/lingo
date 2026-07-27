import { describe, expect, it } from "vitest";
import { readdirSync } from "node:fs";
import { join } from "node:path";
import { compileModule } from "./moduleCompiler";

/**
 * に and へ are both correct for a destination, so both must be accepted.
 *
 * m19's QA found three typed items that accepted only the particle the author
 * happened to write and marked the other one wrong. Max-acceptance grading has
 * exactly one carve-out — a prompt that names an audience — and this is not it.
 *
 * The two directions are NOT symmetric, which is the whole subtlety:
 *   へ → に  always holds; へ has one job.
 *   に → へ  only where に marks a DESTINATION. に also marks time (ごじに),
 *           existence (いえに ある) and the indirect object (ミカに いう), and へ
 *           is wrong in all three — so the swap applies to the last に before a
 *           motion verb and nothing else.
 */

const IR_DIR = join(__dirname, "..", "..", "languages", "ja", "curriculum", "ir");
const MOTION = /(いく|いきます|いった|いきました|くる|きます|きた|きました|かえる|かえります)/;

type Translate = { type: string; id: string; acceptedAnswers?: string[] };

function translateSteps(): { where: string; step: Translate }[] {
  return readdirSync(IR_DIR)
    .filter((f) => f.endsWith(".ir.json"))
    .flatMap((f) =>
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      compileModule(require(join(IR_DIR, f))).flatMap((lesson) =>
        lesson.steps
          .map((s) => s as unknown as Translate)
          .filter((s) => s.type === "translate")
          .map((step) => ({ where: lesson.id, step })),
      ),
    );
}

describe("destination に and へ are interchangeable", () => {
  const steps = translateSteps();

  it("has typed items to check", () => {
    expect(steps.length).toBeGreaterThan(50);
  });

  it("accepts both particles wherever one is accepted", () => {
    const oneSided: string[] = [];
    for (const { where, step } of steps) {
      const answers = step.acceptedAnswers ?? [];
      const bare = (s: string) => s.replace(/[。、？！　\s]/g, "");
      const set = new Set(answers.map(bare));

      for (const answer of answers) {
        if (!MOTION.test(answer)) continue;
        const stripped = bare(answer);

        if (stripped.includes("へ") && !set.has(stripped.replace(/へ/g, "に"))) {
          oneSided.push(`${where} ${step.id}: ${answer} (へ only)`);
        }
        // Only a に IMMEDIATELY before the motion verb is a destination. The
        // に inside までに is a deadline, and へ is wrong there.
        const swapped = stripped.replace(new RegExp(`に(?=${MOTION.source})`), "へ");
        if (swapped !== stripped && !set.has(swapped)) {
          oneSided.push(`${where} ${step.id}: ${answer} (に only)`);
        }
      }
    }
    expect([...new Set(oneSided)].slice(0, 20)).toEqual([]);
  });
});
