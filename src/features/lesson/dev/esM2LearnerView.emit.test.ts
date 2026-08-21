import { describe, it } from "vitest";
import { writeFileSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { ES_M2_LESSONS } from "@/features/languages/es/curriculum/m2";

// PROMOTED 2026-08-21: emits from the real curriculum (raw authored steps).
const ES_M2_PROTO_TITLES = ES_M2_LESSONS.map((l) => l.title);
const buildEsM2Lesson = async (n: number) => ES_M2_LESSONS[n - 1].steps;
import { emitModule } from "./learnerViewRender";

/**
 * ES m2 learner-view emitter.
 * Run: ES_M2_LEARNER_VIEW=1 npx vitest run src/features/lesson/dev/esM2LearnerView.emit.test.ts
 * Output: docs/learner-sim/es-m2-proto.md
 */
const HERE = dirname(fileURLToPath(import.meta.url));
const OUT = join(HERE, "../../../../docs/learner-sim/es-m2-proto.md");

describe("es m2 prototype learner view", () => {
  it.skipIf(!process.env.ES_M2_LEARNER_VIEW)(
    "writes docs/learner-sim/es-m2-proto.md",
    async () => {
      const md = await emitModule(
        "ES module 2 (prototype)",
        "Spanish",
        ES_M2_PROTO_TITLES,
        buildEsM2Lesson,
      );
      mkdirSync(dirname(OUT), { recursive: true });
      writeFileSync(OUT, md);
    },
  );
});
