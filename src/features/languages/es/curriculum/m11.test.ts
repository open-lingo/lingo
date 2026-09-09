/**
 * ES M11 curriculum guard — «Como y bebo», the module that completes the
 * regular present. Opus-authored 5-agent wave (2026-09-02); brief =
 * scratchpad/es-m11-spine.md, spine settled in
 * docs/handoff-2026-09-02-es-m11-m15.md. Shared lints at ZERO debt +
 * shared doctrine pins + module-bespoke lanes below.
 */
import "./index";

import { describe, it, expect } from "vitest";
import { ES_M11_ATOMS, ES_M11_LESSONS, ES_M11_PLACEMENT, ES_M11_CHECKPOINT_INDEX } from "./m11";
import { registerEsModuleContentLints } from "../__tests__/moduleContentLints";
import { registerEsModuleBarGuards } from "../__tests__/moduleBarGuards";
import { registerEsDoctrinePins, registerEsAtomUsagePin } from "../__tests__/doctrinePins";
import { ES_MODULE_ORDER } from "../grammarHelpers";

registerEsModuleContentLints({
  moduleId: "m11",
  lessons: ES_M11_LESSONS,
  atoms: ES_M11_ATOMS,
  expectedLessonCount: 10,
});

registerEsModuleBarGuards({
  moduleLabel: "m11",
  lessons: ES_M11_LESSONS,
  priorModules: ES_MODULE_ORDER.slice(0, ES_MODULE_ORDER.indexOf("m11")),
});

registerEsDoctrinePins({
  moduleId: "m11",
  lessons: ES_M11_LESSONS,
  checkpointIndex: ES_M11_CHECKPOINT_INDEX,
});
registerEsAtomUsagePin("m11", ES_M11_LESSONS, ES_M11_ATOMS, {
  // «recibir» is the -ir transfer test: the learner produces «recibo» from
  // a bank holding all three singular cells. «recibes»/«recibe» are foils.
  neverProduced: ["recibes", "recibe"],
});

const getLesson = (n: number) => ES_M11_LESSONS[n - 1].steps;
const LESSONS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] as const;

function allSurfaces(nums: readonly number[] = LESSONS): Array<{ id: string; text: string }> {
  const out: Array<{ id: string; text: string }> = [];
  for (const n of nums) {
    for (const s of getLesson(n)) {
      const rec = s as unknown as Record<string, unknown>;
      for (const k of ["audioText", "targetPhrase", "targetSentence"]) {
        const v = rec[k];
        if (typeof v === "string") out.push({ id: s.id, text: v });
      }
    }
  }
  return out;
}

describe("ES m11 — bespoke pins", () => {
  it("checkpoint at 8; placement shape holds", () => {
    expect(ES_M11_CHECKPOINT_INDEX).toBe(8);
    expect(ES_M11_PLACEMENT.screener.length).toBe(1);
    expect(ES_M11_PLACEMENT.byModule.length).toBeGreaterThanOrEqual(3);
  });

  it("pan (m7) and pero (m6) are NOT re-registered — first-write-wins", () => {
    for (const surf of ["pan", "pero"]) {
      expect(
        ES_M11_ATOMS.some((a) => a.surface === surf),
        `«${surf}» belongs to an earlier module; m11 uses it as a carrier only`,
      ).toBe(false);
    }
  });

  it("escribir/leer/correr stay infinitive-only (never conjugated anywhere)", () => {
    // «leer» itself is safe: \b after "lee" fails on the following r.
    const banned = /\b(escrib|le|corr)(o|es|e)\b/;
    for (const { id, text } of allSurfaces()) {
      expect(banned.test(text), `${id}: conjugated infinitive-only verb in «${text}»`).toBe(false);
    }
  });

  it("the -er/-ir machine lane runs with all three gears live", () => {
    const gears: Record<string, number> = {};
    for (const n of LESSONS) {
      for (const s of getLesson(n)) {
        if (s.type !== "particle_cloze") continue;
        const c = s.correctParticle;
        if (/^(como|comes|come|bebo|bebes|bebe|vivo|vives|vive)$/.test(c)) {
          const person = /o$/.test(c) ? "I" : /es$/.test(c) ? "you" : "he/she";
          gears[person] = (gears[person] ?? 0) + 1;
        }
      }
    }
    expect(gears["I"] ?? 0, "yo-form trials").toBeGreaterThanOrEqual(3);
    expect(gears["you"] ?? 0, "tú-form trials").toBeGreaterThanOrEqual(3);
    expect(gears["he/she"] ?? 0, "él/ella-form trials").toBeGreaterThanOrEqual(3);
  });

  it("the -ar/-er contrast is actually staged (ending is the ONLY variable)", () => {
    // The module's whole thesis is a -> e in the tú and él/ella cells. At
    // least one cloze must force a choice between an -ar cell and an
    // -er/-ir cell on the SAME person, so the ending is what is tested and
    // not the verb's meaning. (The sonnet/opus parity experiment failed
    // exactly here: «como» vs «hablo» are both -o forms, so the learner is
    // choosing eat-vs-speak and the ending is never the variable.)
    const AR = /^(hablas|habla|trabajas|trabaja|estudias|estudia)$/;
    const ER = /^(comes|come|bebes|bebe|vives|vive)$/;
    let staged = 0;
    for (const n of LESSONS) {
      for (const s of getLesson(n)) {
        if (s.type !== "particle_cloze") continue;
        const opts = s.options ?? [];
        const hasAr = opts.some((o) => AR.test(o));
        const hasEr = opts.some((o) => ER.test(o));
        if (hasAr && hasEr) staged++;
      }
    }
    expect(staged, "clozes contrasting an -ar cell with an -er/-ir cell").toBeGreaterThanOrEqual(1);
  });

  it("the transfer cells live ONLY in the L8 checkpoint", () => {
    const cells = /\b(recibir|recibo|recibes|recibe)\b/;
    for (const n of LESSONS) {
      if (n === 8) continue;
      for (const { id, text } of allSurfaces([n])) {
        expect(cells.test(text), `L${n}/${id}: transfer cell leaked outside the checkpoint («${text}»)`).toBe(false);
      }
    }
    const inCheckpoint = allSurfaces([8]).filter(({ text }) => cells.test(text));
    expect(inCheckpoint.length, "L8 must carry the transfer beat").toBeGreaterThanOrEqual(2);
  });

  it("L8's transfer build offers all three singular cells in the bank", () => {
    const build = getLesson(8).find(
      (s) => s.type === "build_sentence" && /recibo/.test((s as never as Record<string, string>).targetSentence ?? ""),
    );
    expect(build, "L8 transfer buildLit missing").toBeDefined();
    const tiles = (build as never as Record<string, string[]>).tiles ?? [];
    for (const cell of ["recibo", "recibes", "recibe"]) {
      expect(tiles.includes(cell), `transfer bank must hold «${cell}» so the answer can't be found by shape`).toBe(true);
    }
  });
});
