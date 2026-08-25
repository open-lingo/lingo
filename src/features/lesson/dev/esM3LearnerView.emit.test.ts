import { describe, it } from "vitest";
import { writeFileSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { ES_M3_LESSONS } from "@/features/languages/es/curriculum/m3";

// m3 is IR-compiled curriculum (2026-08-24 wave) — emits the raw authored steps.
const ES_M3_TITLES = ES_M3_LESSONS.map((l) => l.title);
const buildEsM3Lesson = async (n: number) => ES_M3_LESSONS[n - 1].steps;
import { emitModule } from "./learnerViewRender";

/**
 * ES m3 learner-view emitter.
 * Run: ES_M3_LEARNER_VIEW=1 npx vitest run src/features/lesson/dev/esM3LearnerView.emit.test.ts
 * Output: docs/learner-sim/es-m3.md
 */
const HERE = dirname(fileURLToPath(import.meta.url));
const OUT = join(HERE, "../../../../docs/learner-sim/es-m3.md");

describe("es m3 learner view", () => {
  it.skipIf(!process.env.ES_M3_LEARNER_VIEW)(
    "writes docs/learner-sim/es-m3.md",
    async () => {
      const md = await emitModule(
        "ES module 3",
        "Spanish",
        ES_M3_TITLES,
        buildEsM3Lesson,
      );
      mkdirSync(dirname(OUT), { recursive: true });
      writeFileSync(OUT, md);
    },
  );
});
