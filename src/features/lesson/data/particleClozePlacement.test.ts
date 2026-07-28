import { describe, expect, it } from "vitest";
import { getAvailableMockLessonIds, getMockLessonContent } from "./mockLessons";

/**
 * Particle-cloze placement policy (workshop D, Spencer 2026-07-12):
 * true particle clozes (all options are particles) are an INTRODUCTION
 * device — they belong within 2 modules of the particle's introduction.
 * Later contrast drilling lives in review lessons and the grammar deck
 * (interleaving surfaces), not teaching lessons. The list below
 * grandfathers existing late usages and may only SHRINK — remove entries
 * as content waves retire them; the test fails on any NEW late usage.
 */
const PARTICLES = new Set(["は","が","を","に","で","と","へ","も","の","か","や","から","まで","より","ね","よ"]);
// より added 2026-07-27 (m20, spine n09): it had NO entry, so `intro ===
// undefined` made every より cloze in every module skip the ratchet entirely.
// Naming its intro module is what lets the check actually run on it.
//
// よ / ね CORRECTED 9 → 29 (2026-07-27, m29), with the evidence dumped before
// the edit. The 9 was ARCHIVED-course attribution — the same staleness
// `courseAtoms.fromModule` and `n5-grammar-points.json`'s `module` column
// carry. In the NEO course no module before m29 teaches either particle:
// scanning every `ir/*.ir.json` for a `newAtoms` entry or an `introduces:`
// entry naming よ or ね returns **m29 and nothing else**, and m29's own
// computed `priorVocab` — the union of what every earlier module actually
// taught — contains neither. m29 (spine tile s25) is where the RUN-PLAN
// ledger assigns `yo-emphasis` and `ne-agreement`, and it is where they are
// taught. So this is a stale INPUT being corrected, not a bar being lowered:
// the ratchet still runs on both particles, and it now bites where it should
// — a よ cloze in m32 would fail, which under the old 9 it would also have
// done, while the m29 introduction clozes that inv 5 explicitly permits no
// longer fail for being in the module that introduces them.
const PARTICLE_INTRO_MODULE: Record<string, number> = {"か":3,"は":3,"も":3,"の":4,"が":4,"から":5,"に":6,"で":6,"を":7,"と":8,"よ":29,"ね":29,"まで":13,"へ":17,"より":20,"や":21};

const LATE_PARTICLE_CLOZE_EXEMPTIONS = new Set([
  "ja-m10-1-1/ja-m10-1-1-cloze-wo",
  "ja-m10-1-2/ja-m10-1-2-cloze-ni-iki",
  "ja-m10-1-2/ja-m10-1-2-cloze-wo-kaki",
  "ja-m10-3-2/ja-m10-3-2-cloze-wa-topic",
  "ja-m10-6-1/ja-m10-6-1-cloze-ni-nihon",
  "ja-m10-story/ja-m10-story-cloze-de",
  "ja-m12-5-1/ja-m12-5-1-cloze-ni-1",
  "ja-m12-5-1/ja-m12-5-1-cloze-ni-2",
  "ja-m12-5-2/ja-m12-5-2-cloze-ni-1",
  "ja-m12-7-1/ja-m12-7-1-cloze-ni-2",
  "ja-m13-1-2/ja-m13-1-2-cloze-ni-2",
  "ja-m13-2-2/ja-m13-2-2-cloze-ni-2",
  "ja-m13-3-1/ja-m13-3-1-cloze-kara-1",
  "ja-m13-3-1/ja-m13-3-1-cloze-kara-2",
  "ja-m13-3-2/ja-m13-3-2-cloze-kara-1",
  "ja-m13-3-2/ja-m13-3-2-cloze-kara-2",
  "ja-m13-6-2/ja-m13-6-2-cloze-ni-1",
  "ja-m15-3-1/ja-m15-3-1-cloze-temoii-1",
  "ja-m15-3-1/ja-m15-3-1-cloze-temoii-2",
  "ja-m15-3-2/ja-m15-3-2-cloze-akete",
  "ja-m15-3-2/ja-m15-3-2-cloze-hanashite",
  "ja-m15-3-2/ja-m15-3-2-cloze-tsukatte",
  "ja-m15-5-1/ja-m15-5-1-cloze-hoshii-1",
  "ja-m15-5-1/ja-m15-5-1-cloze-hoshii-ga",
  "ja-m15-5-2/ja-m15-5-2-cloze-hoshii-1",
  "ja-m15-7-1/ja-m15-7-1-cloze-hoshii",
  "ja-m16-3-1/ja-m16-3-1-cloze-2",
  "ja-m17-4-1/ja-m17-4-1-cloze-no-1",
  "ja-m17-6-1/ja-m17-6-1-cloze-de",
  "ja-m17-6-1/ja-m17-6-1-cloze-ni",
  "ja-m18-1-2/ja-m18-1-2-cloze-ga",
  "ja-m18-3-1/ja-m18-3-1-cloze-to-1",
  "ja-m18-3-2/ja-m18-3-2-cloze-to-1",
  "ja-m18-5-1/ja-m18-5-1-cloze-to",
  "ja-m18-6-1/ja-m18-6-1-cloze-to",
  "ja-m18-6-2/ja-m18-6-2-cloze-to",
  "ja-m18-7-1/ja-m18-7-1-cloze-to",
  "ja-m19-1-2/ja-m19-1-2-cloze-no",
  "ja-m19-3-1/ja-m19-3-1-cloze-ni",
  "ja-m19-4-2/ja-m19-4-2-cloze-ga",
  "ja-m19-5-2/ja-m19-5-2-cloze-to",
  "ja-m20-1-1/ja-m20-1-1-cloze-ga",
  "ja-m20-1-2/ja-m20-1-2-cloze-wo",
  "ja-m20-3-1/ja-m20-3-1-cloze-de",
  "ja-m21-1-2/ja-m21-1-2-cloze-ha",
  "ja-m21-2-2/ja-m21-2-2-cloze-ha",
  "ja-m21-3-2/ja-m21-3-2-cloze-to",
  "ja-m21-4-2/ja-m21-4-2-cloze-to",
  "ja-m21-5-1/ja-m21-5-1-cloze-wo-2",
  "ja-m21-6-1/ja-m21-6-1-cloze-to-1",
  "ja-m21-6-1/ja-m21-6-1-cloze-to-2",
  "ja-m21-6-2/ja-m21-6-2-cloze-de",
  "ja-m21-6-2/ja-m21-6-2-cloze-to-1",
  "ja-m21-6-2/ja-m21-6-2-cloze-to-2",
  "ja-m21-7-1/ja-m21-7-1-cloze-to",
  "ja-m21-7-2/ja-m21-7-2-cloze-to",
  "ja-m22-1-2/ja-m22-1-2-cloze-ga",
  "ja-m22-1-2/ja-m22-1-2-cloze-to",
  "ja-m22-3-1/ja-m22-3-1-cloze-ga",
  "ja-m23-1-1/ja-m23-1-1-cloze-ga",
  "ja-m24-2-1/ja-m24-2-1-cloze-ga",
  "ja-m25-3-1/ja-m25-3-1-cloze-1",
  "ja-m25-3-1/ja-m25-3-1-cloze-2",
  "ja-m25-3-1/ja-m25-3-1-cloze-3",
  "ja-m25-3-2/ja-m25-3-2-cloze-1",
  "ja-m25-3-2/ja-m25-3-2-cloze-3",
  "ja-m25-4-1/ja-m25-4-1-cloze-3",
  "ja-m25-6-1/ja-m25-6-1-cloze-4",
  "ja-m25-6-2/ja-m25-6-2-cloze-2",
  "ja-m25-7-1/ja-m25-7-1-cloze-2",
  "ja-m25-7-2/ja-m25-7-2-cloze-2",
  "ja-m7-5-1/ja-m7-5-1-cloze-6",
  "ja-m7-5-2/ja-m7-5-2-cloze-3",
  "ja-m8-4-2/ja-m8-4-2-cloze-ha-1",
  "ja-m8-7-1/ja-m8-7-1-cloze-ha",
  "ja-m9-2-1/ja-m9-2-1-cloze-ga-1",
  "ja-m9-2-2/ja-m9-2-2-cloze-ga-1",
  "ja-m9-2-2/ja-m9-2-2-cloze-ga-2",
  "ja-m9-2-2/ja-m9-2-2-cloze-ga-3",
  "ja-m9-3-1/ja-m9-3-1-cloze-ga-jouzu",
  "ja-m9-5-2/ja-m9-5-2-cloze-ga",
  "ja-m9-story/ja-m9-story-cloze-ga",
]);

describe("particle-cloze placement ratchet", () => {
  it("no NEW true-particle cloze lands beyond the particle's intro module + 2", () => {
    const violations: string[] = [];
    for (const id of getAvailableMockLessonIds()) {
      if (!id.startsWith("ja")) continue;
      const lesson = getMockLessonContent(id);
      if (!lesson) continue;
      const modN = parseInt(lesson.moduleId.replace(/\D/g, ""), 10) || 0;
      if (modN === 0) continue;
      for (const s of lesson.steps) {
        if (s.type !== "particle_cloze") continue;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const a = s as any;
        const opts: string[] = a.options ?? [];
        if (!opts.every((o) => PARTICLES.has(o))) continue; // semantic cloze — exempt
        const correct: string = a.correctParticle ?? "";
        const intro = PARTICLE_INTRO_MODULE[correct];
        if (intro === undefined) continue;
        if (modN <= intro + 2) continue;
        const key = `${id}/${s.id}`;
        if (!LATE_PARTICLE_CLOZE_EXEMPTIONS.has(key)) {
          violations.push(`${key} :: ${correct} (intro m${intro}, found m${modN})`);
        }
      }
    }
    expect(violations, violations.join("\n")).toEqual([]);
  });
});
