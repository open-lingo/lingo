import { describe, it } from "vitest";
import { writeFileSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { emitModule } from "./learnerViewRender";

/**
 * Generic ES module learner-view emitter (the m4–m10 wave).
 * Run: ES_LV_MODULE=m5 npx vitest run src/features/lesson/dev/esModuleLearnerView.emit.test.ts
 * Output: docs/learner-sim/es-<module>.md
 * (m1/m2/m3 keep their dedicated emitters; this one covers any registered
 * module by number so the wave doesn't add a file per module.)
 */
const HERE = dirname(fileURLToPath(import.meta.url));
const MOD = process.env.ES_LV_MODULE ?? "";

describe("es module learner view (generic)", () => {
  it.skipIf(!/^m\d+$/.test(MOD))(`writes docs/learner-sim/es-${MOD || "mN"}.md`, async () => {
    const curriculum = (await import(
      /* @vite-ignore */ `@/features/languages/es/curriculum/${MOD}`
    )) as Record<string, unknown>;
    const lessons = curriculum[`ES_${MOD.toUpperCase()}_LESSONS`] as {
      title: string;
      steps: unknown[];
    }[];
    if (!Array.isArray(lessons)) throw new Error(`no ES_${MOD.toUpperCase()}_LESSONS export`);
    const md = await emitModule(
      `ES module ${MOD.slice(1)}`,
      "Spanish",
      lessons.map((l) => l.title),
      async (n: number) => lessons[n - 1].steps as never,
    );
    const out = join(HERE, `../../../../docs/learner-sim/es-${MOD}.md`);
    mkdirSync(dirname(out), { recursive: true });
    writeFileSync(out, md);
  });
});
