/**
 * m4-neo — spine tile s04: Possession & pointing (の, これ/それ/あれ/どれ,
 * だれ, 何). First at-scale module of the dict-form-first rewrite
 * (12 lessons per invariant 25). Authored 2026-07-20 from
 * docs/m4-neo-authoring-spec-2026-07-20.md; halves live in m4-neo-a.ts
 * (L1-6) and m4-neo-b.ts (L7-12).
 */
import { M4_NEO_A_LESSONS } from "./m4-neo-a";
import { M4_NEO_B_LESSONS } from "./m4-neo-b";
import type { LessonContent } from "@/features/lesson/types";

export {
  M4_NEO_1, M4_NEO_2, M4_NEO_3, M4_NEO_4, M4_NEO_5, M4_NEO_6,
} from "./m4-neo-a";
export {
  M4_NEO_7, M4_NEO_8, M4_NEO_9, M4_NEO_10, M4_NEO_11, M4_NEO_REVIEW,
} from "./m4-neo-b";

/** All twelve lessons, deep-link order. */
export const M4_NEO_LESSONS: LessonContent[] = [
  ...M4_NEO_A_LESSONS,
  ...M4_NEO_B_LESSONS,
];
