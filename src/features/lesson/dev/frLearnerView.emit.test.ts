import { describe, it } from "vitest";
import { writeFileSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { FR_M1_MODULE } from "@/features/languages/fr/curriculum/m1";
import { FR_M2_MODULE } from "@/features/languages/fr/curriculum/m2";

// PROMOTED 2026-08-21: emits from the real curriculum (raw authored steps).
const FR_M1_PROTO_TITLES = FR_M1_MODULE.lessons.map((l) => l.title);
const buildFrM1Lesson = async (n: number) => FR_M1_MODULE.lessons[n - 1].steps;
const FR_M2_PROTO_TITLES = FR_M2_MODULE.lessons.map((l) => l.title);
const buildFrM2Lesson = async (n: number) => FR_M2_MODULE.lessons[n - 1].steps;
import { emitModule } from "./learnerViewRender";

/**
 * FR m1+m2 learner-view emitter — two files, one run.
 * Run: FR_LEARNER_VIEW=1 npx vitest run src/features/lesson/dev/frLearnerView.emit.test.ts
 * Output: docs/learner-sim/fr-m1-proto.md + fr-m2-proto.md
 */
const HERE = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = join(HERE, "../../../../docs/learner-sim");

describe("fr prototype learner views", () => {
  it.skipIf(!process.env.FR_LEARNER_VIEW)(
    "writes fr-m1-proto.md and fr-m2-proto.md",
    async () => {
      mkdirSync(OUT_DIR, { recursive: true });
      writeFileSync(
        join(OUT_DIR, "fr-m1-proto.md"),
        await emitModule("FR module 1 (prototype)", "French", FR_M1_PROTO_TITLES, buildFrM1Lesson),
      );
      writeFileSync(
        join(OUT_DIR, "fr-m2-proto.md"),
        await emitModule("FR module 2 (prototype)", "French", FR_M2_PROTO_TITLES, buildFrM2Lesson),
      );
    },
  );
});
