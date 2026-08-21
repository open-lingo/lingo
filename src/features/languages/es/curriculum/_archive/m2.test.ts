/**
 * ES M2 curriculum guard.
 *
 * m2 was re-authored through the IR pipeline on 2026-08-19 (frameless phrase
 * module, ir/m2.ir.yaml) with the full authoring bar already in force, so —
 * unlike the July-wave modules — it registers the shared lints with ZERO
 * pinned debt. Never add a `debt` entry here to admit new content; fix the
 * content instead.
 */
// Side-effect: register the full es curriculum in canonical order first — m16's
// capstone match grid resolves cross-module surfaces at import time and throws
// when this file is the vitest entry with those modules mid-import-cycle.
import "./index";

import { describe, it, expect } from "vitest";
import { ES_M2_ATOMS, ES_M2_LESSONS, ES_M2_PLACEMENT } from "./m2";
import { registerEsModuleContentLints } from "../__tests__/moduleContentLints";
import { registerEsModuleBarGuards } from "../__tests__/moduleBarGuards";
import { ES_MODULE_ORDER } from "../grammarHelpers";

registerEsModuleContentLints({
  moduleId: "m2",
  lessons: ES_M2_LESSONS,
  atoms: ES_M2_ATOMS,
});

registerEsModuleBarGuards({
  moduleLabel: "m2",
  lessons: ES_M2_LESSONS,
  priorModules: ES_MODULE_ORDER.slice(0, ES_MODULE_ORDER.indexOf("m2")),
});

describe("ES M2 bespoke guards", () => {
  it("the mastery lesson keeps its test identity", () => {
    expect(ES_M2_LESSONS[7].title).toBe("M2 Mastery Test");
  });

  it("the placement bank carries the m2 facts (1 screener + 4 byModule)", () => {
    expect(ES_M2_PLACEMENT.screener.length).toBe(1);
    expect(ES_M2_PLACEMENT.byModule.length).toBe(4);
    for (const item of [...ES_M2_PLACEMENT.screener, ...ES_M2_PLACEMENT.byModule]) {
      const step = item.build();
      if (step.type !== "multiple_choice") {
        throw new Error(`${item.id}: expected a multiple_choice placement step`);
      }
      expect(step.options.length, `${item.id} should offer 4 options`).toBe(4);
    }
  });

  it("the formal question is a registered atom (the July file produced it untracked)", () => {
    expect(ES_M2_ATOMS.some((a) => a.surface === "¿cómo se llama usted?")).toBe(true);
  });
});
