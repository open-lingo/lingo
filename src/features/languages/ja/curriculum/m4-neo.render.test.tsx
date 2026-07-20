/**
 * m4-neo render gate — registers `registerRenderGate` (DOM mount + Gate 10
 * mustShow contract + ruby/romaji sanity) for every step of every m4-neo
 * lesson. Complements `m4-neo.test.ts` (content bar): that checks the
 * AUTHORED data; this checks what actually RENDERS.
 */
import { registerRenderGate } from "@/features/lesson/__tests__/renderGate";
import { M4_NEO_LESSONS } from "./m4-neo";

registerRenderGate({ moduleLabel: "m4-neo", lessons: M4_NEO_LESSONS });
