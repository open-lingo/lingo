/**
 * §4g SENTENCE-COMPLEXITY FLOOR, as a machine gate.
 *
 * The ja guide states this rule and then says of it: "This is guidance, not yet
 * a machine gate. No test asserts sentence complexity today." The failure it
 * describes is authoring a *new* module's sentences as bare frames because the
 * drill is isolating one new conjugation — which produces m7-level sentences at
 * m29, below the review-tail sentences sitting next to them.
 *
 * Spanish can enforce it, because ES sentences are not hand-written: the frame
 * decides which slots a sentence carries, so "every production target carries a
 * time adverbial" is a property of the frame's `slots`, not of an author's
 * discipline. This test is what stops a future frame from quietly making the
 * time slot optional — which would be invisible in review, since every
 * individual sentence it produced would still be correct Spanish.
 *
 * Scope is deliberately the IR-compiled modules only. The inventory of markers
 * comes from each module's OWN frame (via its IR's `frameFile`), and the module
 * list comes from globbing `ir/`, so neither can go stale the way a hardcoded
 * `MODULE_ORDER` did.
 */
import { describe, it, expect } from "vitest";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import type { LessonContent } from "@/features/lesson/types";

const IR_DIR = resolve(process.cwd(), "src/features/languages/es/curriculum/ir");
const FRAME_DIR = resolve(process.cwd(), "scripts/draft");

/** Fields that hold a sentence the learner must PRODUCE or parse in full. */
const PRODUCTION_FIELDS = [
  "targetSentence", // build_sentence, listening_build
  "targetPhrase", // speaking
  "transcript", // listening_comprehension
] as const;

type Ir = { module: string; frame: string; frameFile: string };

/** The IR header is a fixed key: value preamble — no YAML parser needed. */
function readIrHeaders(): Ir[] {
  // 2026-08-21: the July IR wave lives in curriculum/_archive/ir/ — until
  // the §13-doctrine IR emitters land (m3+ handoff) there is no live IR
  // directory, and this gate has nothing to check.
  if (!existsSync(IR_DIR)) return [];
  return readdirSync(IR_DIR)
    .filter((f) => f.endsWith(".ir.yaml"))
    .map((f) => {
      const head = readFileSync(resolve(IR_DIR, f), "utf8").slice(0, 2000);
      const field = (k: string) =>
        new RegExp(`^${k}:\\s*"?([\\w-]+)"?\\s*$`, "m").exec(head)?.[1];
      const [module, frame, frameFile] = [
        field("module"),
        field("frame"),
        field("frameFile"),
      ];
      // Frameless phrase modules (frame: none) have no drafted pool and no
      // time system to demand adverbials from — their sentence law lives in
      // the module bar guards and es-quality structure gates instead.
      if (frame === "none") {
        return null;
      }
      if (!module || !frame || !frameFile) {
        throw new Error(`${f}: missing module/frame/frameFile in its header`);
      }
      return { module, frame, frameFile };
    })
    .filter((ir): ir is Ir => ir !== null);
}

async function timeMarkersFor(ir: Ir): Promise<string[]> {
  const mod = (await import(
    /* @vite-ignore */ resolve(FRAME_DIR, `frames-${ir.frameFile}.mjs`)
  )) as Record<string, { time?: { es: string }[] }>;
  const frame = mod[ir.frame];
  if (!frame) {
    throw new Error(
      `frames-${ir.frameFile}.mjs does not export "${ir.frame}" — the IR's ` +
        `frame/frameFile pair no longer resolves.`,
    );
  }
  const markers = (frame.time ?? []).map((t) => t.es);
  if (!markers.length) {
    throw new Error(`frame ${ir.frame} declares no time markers`);
  }
  return markers;
}

/**
 * `LESSONS_BY_MODULE` is private to `curriculum/index.ts`, so the lessons come
 * from each compiled module by its export convention — which is also what
 * catches a module that was compiled but never registered.
 */
async function productionTargets(
  moduleId: string,
): Promise<{ stepId: string; es: string }[]> {
  const mod = (await import(`../curriculum/${moduleId}.ts`)) as Record<
    string,
    LessonContent[]
  >;
  const exportName = `ES_${moduleId.toUpperCase()}_LESSONS`;
  const lessons = mod[exportName];
  if (!lessons?.length) {
    throw new Error(`${moduleId}.ts does not export a non-empty ${exportName}`);
  }
  const out: { stepId: string; es: string }[] = [];
  for (const lesson of lessons) {
    for (const step of lesson.steps) {
      const s = step as unknown as Record<string, unknown>;
      for (const f of PRODUCTION_FIELDS) {
        const v = s[f];
        // A single word is a vocabulary prompt, not a sentence.
        if (typeof v === "string" && v.includes(" ")) {
          out.push({ stepId: String(s.id), es: v });
        }
      }
    }
  }
  return out;
}

describe("es sentence-complexity floor (ja guide §4g)", () => {
  const irs = readIrHeaders();

  it("finds the IR-compiled modules (unless the IR wave is archived)", () => {
    // Guards against the suite passing vacuously if the glob breaks. The
    // 2026-08-21 §13 restart archived ALL live IR (curriculum/_archive/ir/);
    // zero IR files is the expected state until the new emitters land.
    if (!existsSync(IR_DIR)) {
      expect(irs.length).toBe(0);
      return;
    }
    // 2026-08-24: the §13 wave restarts the live IR dir with FRAMELESS
    // phrase modules (m3 — frame: none), which this suite rightly skips
    // (no frame → no time system to demand adverbials from). The glob is
    // only broken if a FRAMED IR exists that readIrHeaders failed to parse.
    const framed = readdirSync(IR_DIR).filter(
      (f) =>
        f.endsWith(".ir.yaml") &&
        !/^frame:\s*"?none"?\s*$/m.test(
          readFileSync(resolve(IR_DIR, f), "utf8").slice(0, 2000),
        ),
    );
    expect(irs.length).toBe(framed.length);
  });

  for (const ir of irs) {
    it(`${ir.module}: every production target carries a time adverbial`, async () => {
      const markers = await timeMarkersFor(ir);
      const targets = await productionTargets(ir.module);
      expect(targets.length).toBeGreaterThan(20);

      const bare = targets.filter((t) => !markers.some((m) => t.es.includes(m)));
      expect(
        bare.map((b) => `${b.stepId}: ${b.es}`),
        `${ir.module} has production target(s) with no time adverbial. A bare ` +
          `subject-verb-object clause is under-spec for A2 even when it isolates ` +
          `a new form (ja guide §4g). The usual cause is a frame whose \`slots\` ` +
          `made \`time\` optional — fix the frame, not the sentence.`,
      ).toEqual([]);
    });
  }
});
