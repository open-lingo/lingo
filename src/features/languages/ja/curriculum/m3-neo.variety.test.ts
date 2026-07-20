/**
 * m3-neo authoring-bar guards — now the shared per-module suite
 * (moduleBarGuards.ts). m3 is grandfathered on lesson count (7 — it
 * taught only three things; invariant 25's 12-lesson floor starts at m4).
 */
import { registerModuleBarGuards, COURSE_CANON } from "../__tests__/moduleBarGuards";
import { M3_NEO_LESSONS } from "./m3-neo";

registerModuleBarGuards({
  moduleLabel: "m3-neo",
  lessons: M3_NEO_LESSONS,
  priorModules: ["m1", "m2"],
  canon: COURSE_CANON,
});
