/**
 * Portuguese curriculum assembly — module metadata + pathway builder.
 * Mirrors `es/curriculum/index.ts`'s shape exactly (explicit named imports,
 * not a glob — see the ordering note in `../courseAtoms.ts`'s header).
 *
 * `PT_MODULE_META` is the single source of truth for the module spine, one
 * row per module regardless of whether it is authored yet.
 * `buildPortugueseCourse()` turns it into the pathway `CourseModule[]`,
 * SKIPPING modules whose lesson array is still an empty stub — the learn
 * map only ever shows authored content. Today every module (just m1) is a
 * stub, so `buildPortugueseCourse()` returns `[]`.
 *
 * Unlike ES/FR, this does NOT go through `shared/domain/mockCourse.ts` —
 * there is no legacy PT content to merge with, and skipping that shared
 * 2000+-line dispatch file avoids the registry↔mockCourse import cycle ES/FR
 * work around with a lazy `curriculum` getter. `pt/module.ts` imports
 * `buildPortugueseCourse` directly.
 */
import type { CourseModule } from "@/shared/domain/course";
import type { LessonContent } from "@/features/lesson/types";

import { PT_M1_LESSONS } from "./m1";
import { PT_M4_LESSONS } from "./m4";
import { PT_M3_LESSONS } from "./m3";
import { PT_M2_LESSONS } from "./m2";

export type PtModuleMeta = {
  id: string;
  title: string;
  eyebrow?: string;
  summary?: string;
  accent?: { from: string; to: string };
};

// Titles/summaries are placeholders until the m1 authoring lane (design doc
// §4's L1–L5 briefs) ships real copy — kept here (not invented content) so
// the course-map row exists the moment m1 has >=1 lesson.
export const PT_MODULE_META: PtModuleMeta[] = [
  {
    id: "m1",
    title: "Eu sou Sam",
    eyebrow: "Module 1 · Primeiras palavras",
    summary: "ser/estar/ter, greetings, and the first contractions.",
    accent: { from: "#059669", to: "#047857" },
  },
  {
    id: "m2",
    title: "Na cidade",
    eyebrow: "Module 2 · Na cidade",
    summary: "querer, the articles, question words, -ar verbs and ir/vir — moving in.",
    accent: { from: "#6366f1", to: "#8b5cf6" },
  },
  {
    id: "m3",
    title: "A viagem",
    eyebrow: "Module 3 · A viagem",
    summary: "poder/precisar, the days and time, -er/-ir verbs, paying and the bus.",
    accent: { from: "#f59e0b", to: "#ea580c" },
  },
  {
    id: "m4",
    title: "No Rio",
    eyebrow: "Module 4 · No Rio",
    summary: "ficar, the market, the beach, a doctor, and saying goodbye — end of A1.",
    accent: { from: "#0ea5e9", to: "#0284c7" },
  },
];

const LESSONS_BY_MODULE: Record<string, LessonContent[]> = {
  m1: PT_M1_LESSONS,
  m4: PT_M4_LESSONS,
  m3: PT_M3_LESSONS,
  m2: PT_M2_LESSONS,
};

/** Flat lesson list for the shared LESSONS content index (mirrors
 *  `es/curriculum/index.ts`'s `ES_ALL_LESSONS`). Empty until m1 ships. */
export const PT_ALL_LESSONS: LessonContent[] = PT_MODULE_META.flatMap(
  (meta) => LESSONS_BY_MODULE[meta.id] ?? [],
);

/** Assemble the PT pathway. Modules with no authored lessons are skipped —
 *  today that is every module, so this returns `[]`. */
export function buildPortugueseCourse(): CourseModule[] {
  return PT_MODULE_META.filter(
    (meta) => (LESSONS_BY_MODULE[meta.id] ?? []).length > 0,
  ).map((meta) => ({
    id: meta.id,
    title: meta.title,
    eyebrow: meta.eyebrow,
    summary: meta.summary,
    accent: meta.accent,
    lessons: (LESSONS_BY_MODULE[meta.id] ?? []).map((lesson) => ({
      id: lesson.id,
      title: lesson.title,
      status: "available" as const,
    })),
  }));
}
