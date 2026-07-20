/**
 * m3-neo render gate — registers `registerRenderGate` (DOM mount + Gate 10
 * mustShow contract + ruby/romaji sanity) for every step of every m3-neo
 * pilot lesson. Complements `m3-neo.test.ts` (content bar) and
 * `m3-neo.variety.test.ts`: those check the AUTHORED data; this checks
 * what actually RENDERS.
 */
import { registerRenderGate } from "@/features/lesson/__tests__/renderGate";
import { M3_NEO_LESSONS } from "./m3-neo";

registerRenderGate({ moduleLabel: "m3-neo", lessons: M3_NEO_LESSONS });
