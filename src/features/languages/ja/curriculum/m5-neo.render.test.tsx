/** DOM-render gate registration for m5-neo (see renderGate.tsx). */
import { registerRenderGate } from "@/features/lesson/__tests__/renderGate";
import { M5_NEO_LESSONS } from "./m5-neo";

registerRenderGate({ moduleLabel: "m5-neo", lessons: M5_NEO_LESSONS });
