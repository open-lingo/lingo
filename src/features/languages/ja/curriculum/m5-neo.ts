/**
 * m5-neo — spine tile s05: VERBS I (dictionary form as THE verb; を +
 * SOV; CEJC seed verbs; もの compositional family). Authored 2026-07-20
 * from docs/m5-neo-authoring-spec-2026-07-20.md; halves in m5-neo-a.ts
 * (L1-6) and m5-neo-b.ts (L7-12).
 */
import { M5_NEO_A_LESSONS } from "./m5-neo-a";
import { M5_NEO_B_LESSONS } from "./m5-neo-b";
import type { LessonContent } from "@/features/lesson/types";

export {
  M5_NEO_1, M5_NEO_2, M5_NEO_3, M5_NEO_4, M5_NEO_5, M5_NEO_6,
} from "./m5-neo-a";
export {
  M5_NEO_7, M5_NEO_8, M5_NEO_9, M5_NEO_10, M5_NEO_11, M5_NEO_REVIEW,
} from "./m5-neo-b";

/** All twelve lessons, deep-link order. */
export const M5_NEO_LESSONS: LessonContent[] = [
  ...M5_NEO_A_LESSONS,
  ...M5_NEO_B_LESSONS,
];
