/**
 * ES M1 curriculum guard.
 *
 * m1 was re-authored through the IR pipeline on 2026-08-19 (frameless phrase
 * module, ir/m1.ir.yaml) with the full authoring bar already in force, so —
 * unlike the July-wave modules — it registers the shared lints with ZERO
 * pinned debt. Never add a `debt` entry here to admit new content; fix the
 * content instead.
 */
// Side-effect: register the full es curriculum in canonical order first — m16's
// capstone match grid resolves cross-module surfaces at import time and throws
// when this file is the vitest entry with those modules mid-import-cycle.
import "./index";

import { describe, it, expect } from "vitest";
import { ES_M1_ATOMS, ES_M1_LESSONS, ES_M1_PLACEMENT } from "./m1";
import { registerEsModuleContentLints } from "../__tests__/moduleContentLints";
import { registerEsModuleBarGuards } from "../__tests__/moduleBarGuards";
import { ES_MODULE_ORDER } from "../grammarHelpers";

registerEsModuleContentLints({
  moduleId: "m1",
  lessons: ES_M1_LESSONS,
  atoms: ES_M1_ATOMS,
});

registerEsModuleBarGuards({
  moduleLabel: "m1",
  lessons: ES_M1_LESSONS,
  priorModules: ES_MODULE_ORDER.slice(0, ES_MODULE_ORDER.indexOf("m1")),
});

describe("ES M1 bespoke guards", () => {
  it("the mastery lesson keeps its test identity", () => {
    expect(ES_M1_LESSONS[7].title).toBe("M1 Mastery Test");
  });

  it("the placement bank carries the m1 facts (1 screener + 4 byModule)", () => {
    expect(ES_M1_PLACEMENT.screener.length).toBe(1);
    expect(ES_M1_PLACEMENT.byModule.length).toBe(4);
    for (const item of [...ES_M1_PLACEMENT.screener, ...ES_M1_PLACEMENT.byModule]) {
      const step = item.build();
      if (step.type !== "multiple_choice") {
        throw new Error(`${item.id}: expected a multiple_choice placement step`);
      }
      expect(step.options.length, `${item.id} should offer 4 options`).toBe(4);
    }
  });
});
