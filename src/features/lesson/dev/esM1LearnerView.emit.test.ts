import { describe, it } from "vitest";
import { writeFileSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { ES_M1_LESSONS } from "@/features/languages/es/curriculum/m1";

// PROMOTED 2026-08-21: emits from the real curriculum (raw authored steps).
const ES_M1_PROTO_TITLES = ES_M1_LESSONS.map((l) => l.title);
const buildEsM1Lesson = async (n: number) => ES_M1_LESSONS[n - 1].steps;
import { emitModule } from "./learnerViewRender";

/**
 * ES m1 learner-view emitter — rendering contract lives in
 * `learnerViewRender.ts` (shared across all prototype modules).
 * Run: ES_M1_LEARNER_VIEW=1 npx vitest run src/features/lesson/dev/esM1LearnerView.emit.test.ts
 * Output: docs/learner-sim/es-m1-proto.md
 */
const HERE = dirname(fileURLToPath(import.meta.url));
const OUT = join(HERE, "../../../../docs/learner-sim/es-m1-proto.md");

describe("es m1 prototype learner view", () => {
  it.skipIf(!process.env.ES_M1_LEARNER_VIEW)(
    "writes docs/learner-sim/es-m1-proto.md",
    async () => {
      const md = await emitModule(
        "ES module 1 (re-authored prototype)",
        "Spanish",
        ES_M1_PROTO_TITLES,
        buildEsM1Lesson,
      );
      mkdirSync(dirname(OUT), { recursive: true });
      writeFileSync(OUT, md);
    },
  );
});
